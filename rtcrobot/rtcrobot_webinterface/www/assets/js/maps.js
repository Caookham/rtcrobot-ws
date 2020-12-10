$('#dataTable').on('click', '.clickable-row', function(event) {
    $(this).addClass('table-active').siblings().removeClass('table-active');
    document.getElementById("mapselect-name").innerHTML = this.cells[0].innerText;
    document.getElementById("mapselect-createby").innerHTML = this.cells[1].innerText;
    document.getElementById("mapview").src = "./assets/img/maps/"+this.cells[0].innerText+"/" +"navigation.png";
  });

$('#dataTable').on('click', '.btn-active', function(event) {
  console.log("Active click")
  console.log($(this).closest('tr')[0].id)
});

$('#dataTable').on('click', '.btn-delete', function(event) {
  document.getElementById("modal-mapName").innerHTML = $(this).closest('tr')[0].cells[0].innerText
});

$('#dataTable').on('click', '.fa fa-check', function(event) {
  document.getElementById("modal-mapName").innerHTML = $(this).closest('tr')[0].cells[0].innerText
});



var ros = new ROSLIB.Ros({
       url: 'ws://192.168.5.10:9090'
     });

ros.on('connection', function() {
  console.log('Connected to websocket server.');
});

ros.on('error', function(error) {
  console.log('Error connecting to websocket server: ', error);
});

ros.on('close', function() {
  console.log('Connection to websocket server closed.');
});


var creat_map = new ROSLIB.Topic({
  ros : ros,
  name : '/robot_mode',
  messageType : 'rtcrobot_msgs/RobotMode'
});




//submit create map form
$('#mapsubmit').click(function()
{

  var mode = new ROSLIB.Message({
    code:2,
    name:''
    });

  creat_map.publish(mode);
  $('#mapform').submit(); 
});










