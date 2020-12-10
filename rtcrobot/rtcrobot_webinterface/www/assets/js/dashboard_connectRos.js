var ros = new ROSLIB.Ros({   
    url: 'ws://' + window.location.hostname + ':9090'
});
 var status=false

ros.on('connection', function() {
    console.log('Connected to websocket server.');
});

ros.on('error', function(error) {
    console.log('Error connecting to websocket server: ', error);
});

ros.on('close', function() {
    console.log('Connection to websocket server closed.');
});

var ws = new WebSocket('ws://' + window.location.hostname + ':8888/name_mission');

var displayMap = true
/*-------------------------Create Dashboard------------------------------------*/
var mission = `<div class="row align-items-center no-gutters">
<div class="col mr-2">
    <div class="text-uppercase font-weight-bold text-xs mb-1">
        <span>`
var mission1 = `</span></div>
    <div class="text-dark font-weight-bold h5 mb-0" id="des-`
var mission2 = `"><span></span>
    </div>
</div>
<div class="col-auto"><i class="fas fa-meteor fa-2x text-gray-300"></i></div>
</div>`;
var mapTemp = `<div class="row align-items-center px-0" id="map-contain" style="height:380px;width:1267px">
</div>
`;
var loadDash = {
    cmd: "loadDash" 
}
var displayMap = false;
var displayMission = false;
var grid = GridStack.init({
    alwaysShowResizeHandle: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    ),
    disableDrag: true,
    disableResize: true,
    float: true
});

    // grid.removeAll();
    // var items = GridStack.Utils.sort(msg);
    // grid.batchUpdate();
    // items.forEach(function(node) {

    //     if (node.type == "Missions") {
    //         grid.addWidget('<div><div class="grid-stack-item-content d-flex flex-flow-wrap justify-content-center align-items-center" id="' + node.name + '"></div></div>', node);
    //         $('#' + node.name).append(mission + node.name.replace(/-/gi, " ") + mission1 + node.name + mission2)
    //         displayMission = true
    //     } else if (node.type == "Maps") {
    //         grid.addWidget('<div><div class="grid-stack-item-content d-flex flex-flow-wrap justify-content-center align-items-center" id="map-contain"></div></div>', node);
    //         displayMap = true
    //     }

    // });
    // grid.commit();
    
        onMap()
   



/*-------------------------ROS Topic - Read Battery----------------------------*/
var sub_battery = new ROSLIB.Topic({
    ros: ros,
    name: '/rtcrobot/battery',
    messageType: 'sensor_msgs/BatteryState'
});

sub_battery.subscribe(function(message) {
   // console.log('Received message on ' + sub_battery.name + ': ' + message.power_supply_status);
    $(".rtc-battery").text(message.percentage + "%")
    if (message.power_supply_status == 1) {
        $("#icon_bat").attr("class", "fas fa-charging-station")
    } else if (message.percentage >= 85) {
        $("#icon_bat").attr("class", "fas fa-battery-full")
    } else if (message.percentage >= 60) {
        $("#icon_bat").attr("class", "fas fa-battery-three-quarters")
    } else if (message.percentage >= 40) {
        $("#icon_bat").attr("class", "fas fa-battery-half")
    } else if (message.percentage >= 20) {
        $("#icon_bat").attr("class", "fas fa-battery-quarter")
    } else if (message.percentage < 20) {
        $("#icon_bat").attr("class", "fas fa-battery-empty")
    }

});
/*----------------------------------------------------------------------------- */
/*
var missionClient = new ROSLIB.ActionClient({
    ros: ros,
    serverName: '/Mission',
    actionName: 'actionlib_tutorials/mission_actionAction'
});

// Create a goal.
var goal = new ROSLIB.Goal({
    actionClient: missionClient,
    goalMessage: {
        order: "ki"
    }
});

// Print out their output into the terminal.
goal.on('feedback', function(feedback) {
    console.log('Feedback: ' + feedback.sequence);
});
goal.on('result', function(result) {
    console.log('Final Result: ' + result.sequence);
});

$(".card_mission").on('click', function() {
    _name_mission = $(this)[0].children[0].children[0].children[0].children[0].children[0].innerText
        // Send the goal to the action server.
    goal.goalMessage.goal.order = _name_mission
        //goal_send1(_name_mission)
    goal.send();
});
*/
/**-------------------------ROS Servive - Mission Action---------------------------------*/
// First, we create a Service client with details of the service's name and service type.
function onMission() {
    var cmd = true
    var _name_missionabc = ""
    var _card_mission = ""
    var _describer_mission = ""
    var _describer_old = ""
    var ismission = false
    

    var mission_service = new ROSLIB.Service({
        ros: ros,
        name: '/mission_request',
        serviceType: 'mission_service/msg_Mission'
    });

    var request = new ROSLIB.ServiceRequest({
        name_mission: "test_request",
        run_stop: true
    });

    var sub_missionState = new ROSLIB.Topic({
        ros: ros,
        name: '/bat',
        messageType: 'std_msgs/Int16'
    });
   



    // Create a goal.
   

    // goal.on('feedback', function(feedback) {
    //     console.log('Feedback: ' + feedback.sequence);
    // });
    // goal.on('result', function(result) {
    //     console.log('Final Result: ' + result.sequence);
    // });
    
    

    $("[data-gs-type='Missions']").click(function() {
        if (ismission == false) //chua co mission thuc hien
        {   
            _name_missionabc = $(this)[0].attributes[5].nodeValue
            _describer_mission = $("#des-" + $(this)[0].attributes[5].nodeValue)[0].firstChild
            _describer_mission.innerText = "Sending Mission"
     
            $(this).addClass("grid-active")
            ismission = true;
            console.log(_name_missionabc);

        var serverName="/"+_name_missionabc;
        console.log(serverName);


        var callmission = new ROSLIB.Service({
            ros : ros,
            name : '/robot_services/mission/load',
            serviceType : 'rtcrobot_services/CallMissionRequest'
          });
        
          var request = new ROSLIB.ServiceRequest({
           name :_name_missionabc,
          
          });
          
          callmission.callService(request, function(result) {
            console.log('Result for service call on '
              + callmission.name
              + ': '
              + result.feedback);
              status=result.feedback
          });
          console.log(status)

        
            var callmission_continue = new ROSLIB.Service({
                ros : ros,
                name : '/robot_services/mission/continue',
                serviceType : 'std_srvs/EmptyRequest'
              });
            
              var request = new ROSLIB.ServiceRequest({
                
              });
              
              callmission_continue.callService(request, function(result) {
                console.log('Result for service call on ')
              }); 

        }
         else if (ismission == true) //dang co mission
        {
            if ($(this)[0].attributes[5].nodeValue != _name_missionabc) //nhan mission khac
            {
                alert("error") //canh bao
            } else if ($(this)[0].attributes[5].nodeValue == _name_missionabc) //nhan lai mission
            {
                //huy mission
                ismission = false
                _name_missionabc = ""
                _describer_mission.innerText = ""
                mission_service.callService(request, function(result) {
                    sub_missionState.unsubscribe()

                })
                $(this).removeClass("grid-active")
                console.log(_name_missionabc)
            }
        }
    })
}
/*------------------------------------------------------------------------------------- */

/**------------------------ROS Viewer - Display Map-------------------------------------*/
function onMap() {
    var win = $(window);
    var w = win.width();
    var widthMap = 0;
    var heightMap = 0;
    var zoom = 1;
    var scaleX_index = 1;
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
        height: elmnt.offsetHeight,
        background: "#7f7f7f"

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
  

var creat_map = new ROSLIB.Topic({
    ros : ros,
    name : '/robot_mode',
    messageType : 'rtcrobot_msgs/RobotMode'
  });
  
  var mode = new ROSLIB.Message({
    code:1 // switch to mapping 
    });
  
  creat_map.publish(mode);
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
  }
  
/**--------------------------------------------------------------------------------------*/

var mission_state = new ROSLIB.Topic({
    ros: ros,
    name: '/rtcrobot/mission/state',
    messageType: 'rtcrobot_msgs/MissionState'
});

mission_state.subscribe(function(message) {

document.getElementById("step").innerHTML= "step: " + message.step
document.getElementById("status").innerHTML= "status: " + message.step
document.getElementById("description").innerHTML= "description: " + message.decription

if(message.actions== undefined)
{
    document.getElementById("action").innerHTML= "action: " 
}
if(message.actions !=undefined)
{
    document.getElementById("action").innerHTML= "action: " + message.actions
}

if(message.decription=='Running')
{
    $("#mission_chose").css({"background-color": "green"});
}

if(message.decription=='Goal pose was aborted by the Action Server')
{
    document.getElementById("description").innerHTML= "description: " + "not find way to pose"
    $("#mission_chose").css({"background-color": "yellow"});

}

})


ws.onopen = function(e) {

    var msg_requert = {
        command: "load_choose_mission",
        name: []
    };
    ws.send(JSON.stringify(msg_requert));
  }

  ws.onmessage = function(evt) {
    console.log(evt.data)
    document.getElementById("mission").innerHTML= evt.data
  }
  
  $("#mission").click(function() {

        console.log(this.innerHTML)
        if(this.innerHTML==''){
            alert("plesse choose mission")
        }
        if(this.innerHTML!=''){
            var callmission_continue = new ROSLIB.Service({
                ros : ros,
                name : '/robot_services/mission/continue',
                serviceType : 'std_srvs/EmptyRequest'
              });
            
              var request = new ROSLIB.ServiceRequest({
                
              });
              
              callmission_continue.callService(request, function(result) {
                console.log('Result for service call on ')
              }); 
        }

  })