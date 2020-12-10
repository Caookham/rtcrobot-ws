// Variables sur la map
var posImageX = 0;
var posImageY = 0;
var canvas;
var widthMap = 0;
var heightMap = 0;
var resolutionMap = 0;
var svg;
var _data, _stg_data;

// Position d'origine du robot
var posOriginX = 0;
var posOriginY = 0;

// Position du clic
var posClicX, posClicY;

var screen_hight = screen.height
var h=0
var w=0



var ros = new ROSLIB.Ros({
     url: 'ws://192.168.5.10:9090'
// url: 'ws://'+window.location.hostname+':9090'
});

console.log(ros)
ros.on('connection', function () {
console.log("connected")
});

ros.on('error', function (error) {
  console.log("error")

});

ros.on('close', function () {
dconsole.log("close")

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



QuaternionToTheta = function(orientation) {
var q0 = orientation.w;
var q1 = orientation.x;
var q2 = orientation.y;
var q3 = orientation.z;
// Canvas rotation is clock wise and in degrees
return -Math.atan2(2 * (q0 * q3 + q1 * q2), 1 - 2 * (q2 * q2 + q3 * q3)) * 180.0 / Math.PI;
};




//$('#map-contain').addEventListener('resize', reportWindowSize);
console.log(screen_hight)

var elmnt = document.getElementById("anh");
console.log(elmnt)
w=elmnt.offsetWidth*4/5
h=elmnt.offsetWidth

if(screen_hight>1000){
  w=elmnt.offsetWidth*2/3
h=elmnt.offsetWidth*2/3
}
console.log(w,h)
var viewer = new MJPEGCANVAS.Viewer({
  divID : 'mjpeg1',
   host : '192.168.5.10',
  width :w,
  height :h,
  topic : '/camera_left/color/image_raw',
  labels :'Left Arm View' 
});

var viewer1 = new MJPEGCANVAS.Viewer({
  divID : 'mjpeg',
  host : '192.168.5.10',
  width : w,
  height : h,
  topic : '/camera_right/color/image_raw',
  labels :'Left Arm View' 
});


// Joystick to control
createJoystick = function () {
  var options = {
    zone: document.getElementById('zone_joystick'),
    threshold: 0.1,
    position: { left: 85+ '%' },
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
            console.log(linear_speed)
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
onMap()

}



function onMap() {
  var win = $(window);
  var w = win.width();
  var widthMap = 0;
  var heightMap = 0;
  var zoom = 0.4;
  var scaleX_index = 0.4;
  var elmnt = document.getElementById("map-contain");
  //var elmnt = par
  console.log(elmnt.offsetWidth)
  console.log(elmnt.offsetHeight)
      //Recieve info map
  var listenerMetaData = new ROSLIB.Topic({
      ros: ros,
      name: '/map_metadata',
      messageType: 'nav_msgs/MapMetaData'
  });

  //Create viewer containt map and robot container
  var viewer = new ROS2D.Viewer_custom({
      divID: 'map-contain',
      width: elmnt.offsetWidth,
      height: elmnt.offsetHeight
          //height: elmnt.offsetWidth / 16 * 5
  });

  listenerMetaData.subscribe(function(message) {
      console.log("Subscribed to topic /map_metadata");
      widthMap = message.width;
      heightMap = message.height;
      resolutionMap = message.resolution;
      console.log($("#map-contain"))
          // Setup the map client.
      var gridClient = new ROS2D.OccupancyGridClient_custom({
          ros: ros,
          topic: '/map',
          rootObject: viewer.map
      });

      var slam_pose = new ROSLIB.Topic({
          ros : ros,
          name : '/rtcrobot/pose',
          messageType : 'geometry_msgs/PoseStamped'
      });

      var icon_robot = new ROS2D.Add_Robot({
          rootObject: viewer.robot,
          width: 0.95,
          height: 0.59,
          resolution: message.resolution
      })

      listenerMetaData.unsubscribe();
      load_map()

      slam_pose.subscribe(function(msgs) {
          var q0 = msgs.pose.orientation.w;
          var q1 =msgs.pose.orientation.x;
          var q2 = msgs.pose.orientation.y;
          var q3 = msgs.pose.orientation.z;
          var theta_=-Math.atan2(2 * (q0 * q3 + q1 * q2), 1 - 2 * (q2 * q2 + q3 * q3)) * 180.0 / Math.PI;
          var pose = {
              x: msgs.pose.position.x,
              y: msgs.pose.position.y,
              theta: theta_
          };

         // console.log(pose)
              //console.log(viewer.robot)
              // viewer.map.x = (viewer.canvas.width - widthMap * scaleX_index) / 2 - pose.x / 0.05 * scaleX_index;
              // viewer.map.y = (viewer.canvas.height - heightMap * scaleX_index) / 2 + pose.y / 0.05 * scaleX_index;
              // viewer.map.x = (viewer.width) / 2 - pose.x / 0.05;
              // viewer.map.y = (viewer.height) / 2 - heightMap + pose.y / 0.05;
              // viewer.map.rotation = pose.theta
          viewer.map.x = (viewer.canvas.width) / 2 - pose.x / resolutionMap * scaleX_index;
          viewer.map.y = (viewer.canvas.height) / 2 - (heightMap * scaleX_index) + pose.y / resolutionMap * scaleX_index;
          viewer.robot.rotation = pose.theta;
      });
  });

  win.resize(function() {

      if (w == win.width()) {
          return;
      }
      w = win.width();
      load_map()
  });

  $(".zoom-plus").click(function() {
      if (zoom >= 1) {
          zoom = zoom + 1;
          console.log("ok1")
      } else {
          zoom = zoom * 2;
      }
      console.log("ok2")
      load_map();
  })
  $(".zoom-minus").click(function() {
      if (zoom > 1) {
          zoom = zoom - 1;
      } else {
          zoom = zoom / 2;
      }
      load_map();
  })


  function load_map() {
      console.log("ok3")
      scaleX_index = elmnt.offsetWidth / widthMap * zoom;
      scaleY_index = elmnt.offsetHeight / heightMap * zoom;
      viewer.map.scaleX = scaleX_index
      viewer.map.scaleY = scaleX_index
      viewer.canvas.width = elmnt.offsetWidth;
      viewer.canvas.height = elmnt.offsetHeight;
      viewer.robot.x = elmnt.offsetWidth / 2;
      viewer.robot.y = elmnt.offsetHeight / 2;
      viewer.robot.scaleX = scaleX_index;
      viewer.robot.scaleY = scaleX_index;
      console.log(elmnt.offsetWidth)
      console.log(elmnt.offsetHeight)
  }
  console.log("ok map")
}

