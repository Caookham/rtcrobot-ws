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
 


var creat_map = new ROSLIB.Topic({
  ros : ros,
  name : '/robot_mode',
  messageType : 'rtcrobot_msgs/RobotMode'
});

var mode = new ROSLIB.Message({
  code:2 // switch to mapping 
  });

creat_map.publish(mode);






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



QuaternionToTheta = function(orientation) {
  var q0 = orientation.w;
  var q1 = orientation.x;
  var q2 = orientation.y;
  var q3 = orientation.z;
  // Canvas rotation is clock wise and in degrees
  return -Math.atan2(2 * (q0 * q3 + q1 * q2), 1 - 2 * (q2 * q2 + q3 * q3)) * 180.0 / Math.PI;
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
    //listenerMetaData.unsubscribe();

    console.log('OriginX = ' + posOriginX + ', OriginY = ' + posOriginY);
    var elmnt = document.getElementById("map-contain");

    // Create the main viewer.
    var viewer = new Viewer({
      divID : 'map',
      width : elmnt.offsetWidth,
      height : elmnt.offsetHeight
    });

    var slam_pose = new ROSLIB.Topic({
      ros: ros,
      name: '/rtcrobot/pose',
      messageType: 'geometry_msgs/PoseStamped'
    });

    slam_pose.subscribe(function (msgs) {
      var pose = { 
		x: msgs.pose.position.x,
		y: msgs.pose.position.y,
		theta: QuaternionToTheta(msgs.pose.orientation)
	};
	
	viewer.map.x = (viewer.width - widthMap)/2 - pose.x/0.05;
	viewer.map.y = (viewer.height - heightMap)/2 + pose.y/0.05;
	
    });

    // Setup the map client.
    var mapClient = new OccupancyGridClient({
        ros : ros,
        topic: '/maps/mapping',
        rootObject : viewer.map,
        continuous: true
    });

    ico_robot = new createjs.Shape();
    ico_robot.graphics.clear();
    ico_robot.graphics.beginStroke("rgba(0,0,0,0.5)");
    ico_robot.graphics.beginFill('rgba(255,0,0,0.7)')
    ico_robot.graphics.drawCircle(0, 0, 10);
    ico_robot.graphics.endStroke();
    viewer.robot.addChild(ico_robot);
     console.log(viewer)
    
});

//$('#map-contain').addEventListener('resize', reportWindowSize);

function reportWindowSize(){
}


Viewer = function(options) {
  var that = this;
  options = options || {};
  var divID = options.divID;
  this.width = options.width;
  this.height = options.height;
  var background = options.background || '#C0C0C0';

  // create the canvas to render to
  var canvas = document.createElement('canvas');
  canvas.width = this.width;
  canvas.height = this.height;
  canvas.style.background = background;
  document.getElementById(divID).appendChild(canvas);
  // create the easel to use
  this.scene = new createjs.Stage(canvas);
  this.scene.scale = 1.5;
  this.map = new createjs.Container();
  this.robot = new createjs.Container();
  this.scene.addChild(this.map);
  this.scene.addChild(this.robot);
  this.robot.x = this.width/2;
  this.robot.y = this.height/2;

  // change Y axis center
  //this.scene.y = this.height;

  // add the renderer to the page
  document.getElementById(divID).appendChild(canvas);

  // update at 30fps
  createjs.Ticker.setFPS(30);
  createjs.Ticker.addEventListener('tick', this.scene);
};


OccupancyGridClient = function(options) {
  var that = this;
  options = options || {};
  var ros = options.ros;
  var topic = options.topic || '/map';
  this.continuous = options.continuous;
  this.rootObject = options.rootObject || new createjs.Container();
  this.currentGrid = new createjs.Bitmap();
  this.rootObject.addChild(this.currentGrid);
  // current grid that is displayed
  // create an empty shape to start with, so that the order remains correct.


  // subscribe to the topic
  var rosTopic = new ROSLIB.Topic({
    ros : ros,
    name : topic,
    messageType : 'nav_msgs/OccupancyGrid',
    compression : 'png'
  });

  rosTopic.subscribe(function(message) {

    this.currentGrid = new OccupancyGrid2({
      message : message
    });
    that.rootObject.removeAllChildren()
    that.rootObject.addChild(this.currentGrid);

    // check if we should unsubscribe
    if (!that.continuous) {
      rosTopic.unsubscribe();
    }
  });
};

    
OccupancyGrid2 = function(options) {
  options = options || {};
  var message = options.message;

  // internal drawing canvas
  var canvas = document.createElement('canvas');
  var context = canvas.getContext('2d');

  // save the metadata we need
  this.pose = new ROSLIB.Pose({
    position : message.info.origin.position,
    orientation : message.info.origin.orientation
  });

  // set the size
  this.width = message.info.width;
  this.height = message.info.height;
  canvas.width = this.width;
  canvas.height = this.height;

  var imageData = context.createImageData(this.width, this.height);
  for ( var row = 0; row < this.height; row++) {
    for ( var col = 0; col < this.width; col++) {
      // determine the index into the map data
      var mapI = col + ((this.height - row - 1) * this.width);
      // determine the value
      var data = message.data[mapI];
      var val,alpha;
      if (data === 100) {
        alpha = 255;
        val = 0;
      } else if (data === 0) {
        alpha = 255;
        val = 255;
      } else {
        alpha = 255;
        val = 127;
      }

      // determine the index into the image data array
      var i = (col + (row * this.width)) * 4;
      // r
      imageData.data[i] = val;
      // g
      imageData.data[++i] = val;
      // b
      imageData.data[++i] = val;
      // a
      imageData.data[++i] = alpha;
    }
  }
  context.putImageData(imageData, 0, 0);

  // create the bitmap
  bmp = new createjs.Bitmap(canvas);
  return bmp;

};


// save mappping


function savemap(mapnane){ 

  var save_map = new ROSLIB.Service({
    ros : ros,
    name : '/robot_services/savemap',
    serviceType : 'rtcrobot_services/SaveMapRequest'
  });
  
  var request = new ROSLIB.ServiceRequest({
    name :mapnane ,
    description : 'ok'
  });
  

  save_map.callService(request, function(result) {
    console.log('Result for service call on '+ save_map.name)
  })
   mode = new ROSLIB.Message({
    code:1 // switch to mapping 
  
    });

  creat_map.publish(mode);
  
};




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

