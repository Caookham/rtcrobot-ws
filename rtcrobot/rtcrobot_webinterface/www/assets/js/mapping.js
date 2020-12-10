// Variables sur la map
    var posImageX = 0;
    var posImageY = 0;
    var widthMap = 0;
    var heightMap = 0;
    var resolutionMap = 0;
    var svg;

    // Position d'origine du robot
    var posOriginX = 0;
    var posOriginY = 0;

    // Position du clic
    var posClicX, posClicY;



var ros = new ROSLIB.Ros({
      url: 'ws://192.168.5.10:9090'
    });

console.log(ros)
ros.on('connection', function () {
  document.getElementById("status").innerHTML = "Connected";
});

ros.on('error', function (error) {
  document.getElementById("status").innerHTML = "Error";
});

ros.on('close', function () {
  document.getElementById("status").innerHTML = "Closed";
});


var mode_listener = new ROSLIB.Topic({
      ros: ros,
      name: '/robot_mode',
      messageType: 'rtcrobot_msgs/RobotMode'
    });

mode_listener.subscribe(function (m) {
      console.log(m.name)
    });

cmd_vel_listener = new ROSLIB.Topic({
      ros: ros,
      name: "/cmd_vel",
      messageType: 'geometry_msgs/Twist'
    });

move = function (linear, angular) {
  var twist = new ROSLIB.Message({
    linear: {
      x: linear,
      y: 0,
      z: 0
    },
    angular: {
      x: 0,
      y: 0,
      z: angular
    }
  });
  cmd_vel_listener.publish(twist);
};

    

// On subscribe to topic /map_metadata
// ----------------------------------
var listenerMetaData = new ROSLIB.Topic({
    ros : ros,
    name : '/map_metadata',
    messageType : 'nav_msgs/MapMetaData'
});


listenerMetaData.subscribe(function(message) {
        console.log("Subscribed to topic /map_metadata");
        
    // On récupère les métadonnées de la map
    posOriginX = message.origin.position.x;
    posOriginY = message.origin.position.y;
    widthMap = message.width;
    heightMap = message.height;
    resolutionMap = message.resolution;
    listenerMetaData.unsubscribe();

    console.log('OriginX = ' + posOriginX + ', OriginY = ' + posOriginY);
    
});


    // Create the main viewer.
    var viewer = new ROS2D.Viewer({
      divID : 'map',
      width : 2048,
      height : 2048
    });
    
    // Setup the map client.
    var mapClient = new ROS2D.OccupancyGridClient({
        ros : ros,
        rootObject : viewer.scene,
        continuous: true
    });
    // Scale the canvas to fit to the map
    mapClient.on('change', function(){
        console.log('map change')
        viewer.scaleToDimensions(mapClient.currentGrid.width, mapClient.currentGrid.height);
        viewer.shift(mapClient.currentGrid.pose.position.x, mapClient.currentGrid.pose.position.y);
    });
    


    
// Joystick to control
createJoystick = function () {
      var options = {
        zone: document.getElementById('zone_joystick'),
        threshold: 0.1,
        position: { left: 50 + '%' },
        mode: 'static',
        size: 150,
        color: '#000000',
      };
      manager = nipplejs.create(options);

      linear_speed = 0;
      angular_speed = 0;

      manager.on('start', function (event, nipple) {
        timer = setInterval(function () {
          move(linear_speed, angular_speed);
        }, 25);
      });

      manager.on('move', function (event, nipple) {
        max_linear = 0.5; // m/s
        max_angular = 0.5; // rad/s
        max_distance = 75.0; // pixels;
        linear_speed = Math.sin(nipple.angle.radian) * max_linear * nipple.distance/max_distance;
				angular_speed = -Math.cos(nipple.angle.radian) * max_angular * nipple.distance/max_distance;
      });

      manager.on('end', function () {
        if (timer) {
          clearInterval(timer);
        }
        self.move(0, 0);
      });
    }

window.onload = function () {
  createJoystick();
}

