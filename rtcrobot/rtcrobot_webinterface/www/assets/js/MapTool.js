var _erase_size = 5;
var _map_size = 2048;
var _layer = 1;
var zoom=1
var align=0;
var  img, icon_pos;
var flag 
var canvas, stage, _bkg_container, _drw_container, _zone_container, _wall_container;

var mouseTarget;	// the display object currently under the mouse, or being dragged
var dragStarted;	// indicates whether we are currently in a drag operation
var offset;
var update = true;
var _pan_enable = false, _eraser_enable = false, _select_enable = false;
var _bmp_map
var _mode = 'Nomal'

var _cur;
var _current_point;

var _data, _stg_data;
var mapname;
var offset_x=0,offset_y=0
var _delete_pos
var scale
var width



// kết quả: 'You failed 2 times.'

var pointer_dowm_x,pointer_dowm_y,pointer_up_x,pointer_up_y,theta_robot

//////////////////////////////////////////////////////////
const _stg_speedZone = `<p>Speed target when robot into the zone (m/s).</p>
						<div class="form-group"><input type="text" name="mapname" class="form-control-user form-control" placeholder="Speed value (m/s)"></div>`

const _stg_lookaheadZone = `<p>Minimal distance to obstructions (m).</p>
							<div class="form-group"><input type="text" name="mapsize" class="form-control-user form-control" placeholder="Distance (m)"></div>`


//////////////////////////////////////////////////////////

window.onload = function(){
	getdata();
	
}

function getdata()
{
	mapname = new URLSearchParams(window.location.search).get('map')  
	$.ajax({
        type: 'POST',
        url: '/ajax',
        data: jQuery.param({ map: mapname}),
        contentType: 'application/x-www-form-urlencoded; charset=utf-8',
        dataType: 'json',
        success: function (msg) {
			_data = msg;
			console.log(msg)
			init();
        }
	});
	
}

var ros = new ROSLIB.Ros({
    url: 'ws://192.168.5.10:9090'
});



var listener = new ROSLIB.Topic({
    ros : ros,
    name : '/rtcrobot/pose',
    messageType : 'geometry_msgs/PoseStamped'
  });

var listenerMetaData = new ROSLIB.Topic({
	ros: ros,
	name: '/map_metadata',
	messageType: 'nav_msgs/MapMetaData'
});


var widthMap=0
var heightMap=0
listenerMetaData.subscribe(function(message) {
	console.log("Subscribed to topic /map_metadata");
	widthMap = message.width;
	heightMap = message.height;
	resolutionMap = message.resolution;
	console.log(widthMap,heightMap)
})

function subcrice_postion_robot()
{

  listener.subscribe(function(message) {

    //console.log('Received message on '+ message.pose.position.y);
_robot.x =message.pose.position.x/0.05;
_robot.y =heightMap-message.pose.position.y/0.05;
  var q0 = message.pose.orientation.w;
  var q1 = message.pose.orientation.x;
  var q2 = message.pose.orientation.y;
  var q3 = message.pose.orientation.z;
  _robot.rotation=-Math.atan2(2 * (q0 * q3 + q1 * q2), 1 - 2 * (q2 * q2 + q3 * q3)) * 180.0 / Math.PI;
//   console.log(message.pose.position.x)
// console.log(_robot.x)
  
//console.log(_robot.rotation)

  });
}



var camera = new ROSLIB.Topic({
    ros : ros,
    name : '/camera/depth/color/points',
    messageType : 'sensor_msgs/Image'
  });


function subcrice_camera()
{
  camera.subscribe(function(message) {
  var camera_Image = new Image();
  camera_Image.src = 'data:image\/(png|jpg);base64,' + message.data;
  console.log(camera_Image.src)
  camera_ = new createjs.Bitmap(camera_Image);
  camera_.x=1000
 camera_.y=1000
 stage.update();

  });
}



function init() {			
	
  
    // create the canvas to render to100
	canvas = document.createElement('canvas'); 
    canvas.width = document.getElementById('map-contain').offsetWidth;
    canvas.height = document.getElementById('map-contain').offsetHeight;
    //canvas.style.background = background;
    document.getElementById('map-contain').appendChild(canvas);
	// create stage and point it to the canvas:
	stage = new createjs.Stage(canvas);


    // enable touch interactions if supported on the current device:
	createjs.Touch.enable(stage);
	
	// enabled mouse over / out events
	stage.enableMouseOver(10);
	stage.mouseMoveOutside = true; // keep tracking the mouse even when it leaves the canvas
	
	_bkg_container = new createjs.Container();
    _drw_container = new createjs.Container();
    _zone_container = new createjs.Container();
	_wall_container = new createjs.Container();
	_robot_container = new createjs.Container();
	_marker_container = new createjs.Container();
	_plan_container = new createjs.Container();
	_wall_container.alpha = 0.5;
    stage.addChild(_bkg_container);
    stage.addChild(_wall_container);
    stage.addChild(_zone_container);
	stage.addChild(_drw_container);
	stage.addChild(_robot_container);
	stage.addChild(_marker_container);
	stage.addChild(_plan_container);

	_robot=new createjs.Shape();// 


	subcrice_postion_robot()
	subcrice_camera()
	//
	_robot.graphics.beginFill("DeepSkyBlue").drawRect(-0.96/0.05/2,-0.59/0.05/2,0.96/0.05,0.59/0.05);
	_robot.graphics.beginFill("rgba(255,0,0,1)").drawCircle((0.96/0.05/2)-2,0,1)
	
	_robot_container.addChild(_robot)
	
	//createMarker(100,100,"rgba(0,255,0,0.5)");
	//createMarker(555,100,"rgba(0,0,255,0.5)");
	//createMarker(555,222,"rgba(255,0,0,0.5)");

    
    _cur = new createjs.Shape();
    _cur.graphics.beginFill("rgba(0,0,0,0.1)").beginStroke("rgba(0,0,0,0.5)").drawRect(-2, -2, 5,5);
	_cur.visible = false;
	
	
	_current_point = new createjs.Shape();
	_current_point.graphics.beginFill("rgba(0,255,0,0.1)").beginStroke("rgba(0,0,0,0.5)").drawCircle(0, 0, 10);
	_current_point.visible = false;

	
	

    _bkg_container.on("pressmove", function (evt) {   
		
		
		var pt = _bkg_container.globalToLocal(stage.mouseX, stage.mouseY);

		if(_mode == "Nomal" && _eraser_enable)
		{
			_cur.x = pt.x;
        	_cur.y = pt.y;
			_cur.visible = true
		}
		



		if((_mode == "DrawLine" || _mode =='DrawPolygon') && _pan_enable == false && _eraser_enable ==false)
		{
			_current_point.x = pt.x;
        	_current_point.y = pt.y;
			_current_point.visible = true;
		}
        update = true;
    });

	_bkg_container.on("mousedown", function (evt) {  
		var pt = _bkg_container.globalToLocal(stage.mouseX, stage.mouseY);
		_cur.visible = false;

		if(_mode =="align")
		{
		   align=1;

		   pointer_dowm_x= pt.x;
		   pointer_dowm_y= pt.y;	
		   _robot.x=pointer_dowm_x;
		   _robot.y=pointer_dowm_y;   
		
		}
	})



	
    _bkg_container.on("pressup", function (evt) {  
		var pt = _bkg_container.globalToLocal(stage.mouseX, stage.mouseY);

		_cur.visible = false;
		
		if(_mode =="align")
		{
			align=0;
			_mode = "nomal"
			pointer_up_x=pt.x;
			pointer_up_y=pt.y;
			
			tan_alpha=(pointer_up_y-pointer_dowm_y)/(pointer_up_x-pointer_dowm_x);
			del_x=pointer_up_x-pointer_dowm_x
			del_y=pointer_up_y-pointer_dowm_y
			
 

			theta_robot=(Math.atan(tan_alpha)/Math.PI)*180
			console.log("zoom:", zoom)
			_robot.x=pointer_dowm_x;
			_robot.y=pointer_dowm_y;
			
			
			if(del_x<0&&del_y>0){
			_robot.rotation=theta_robot+180;
			console.log('del_x<0');}

			else if(del_x<0&&del_y<0){
			_robot.rotation=theta_robot+180;
			console.log('del_y>0');}
			else 
			 _robot.rotation=theta_robot;
		


			var pos_init = new ROSLIB.Topic({
			    ros : ros,
			    name : '/initialpose',
			    messageType : 'geometry_msgs/PoseWithCovarianceStamed'
			  });

			  var pose = new ROSLIB.Message({
			   
			    pose : {
				
			   	pose:{
					orientation:{
						w:Math.cos(Math.PI*(_robot.rotation/2)/180),
						x:0.0,
						y:0.0,
						z:-Math.sin(Math.PI*(_robot.rotation/2)/180),
						
						},

				      	position:{
							x:_robot.x*0.05,
							y:(_robot.y)*0.05,
							z:_robot.rotation,
						 }
				    	     }
				   }
			  	})
		 		pos_init.publish(pose);
				
				subcrice_postion_robot()
				
				
			}
				

		if((_mode =='DrawLine' || _mode =='DrawPolygon') && _pan_enable == false && _eraser_enable ==false)
		{
			if(!_drw_container.children.find(line => line.name == 'line'))
			{
				var line = new createjs.Shape();
				line.name = 'line'
				line.originScale = 1;
				line.points = [];
				line.layer = _layer;
				_drw_container.addChild(line);
			}
			
			drawPoint({x: pt.x, y:pt.y})
			_current_point.visible = false;
		}
        update = true;
	});
	
	
	_data.wallData.pointdata.forEach(pg =>{
		drawLine(_wall_container,pg);
		update = true;
	});

	_data.zoneData.forEach(pg =>{
		if(pg.type == 'point')
		{
			console.log(pg)
			createMarker(pg);
		}
		else{
			drawLine(_zone_container,pg);
		}
		
		update = true;
	});
    
	canvas.addEventListener("mousewheel", MouseWheelHandler, false);
    canvas.addEventListener("DOMMouseScroll", MouseWheelHandler, false);
    //container.addEventListener("mousemove", MouseMoveHandler);
	stage.addEventListener("stagemousedown", StageMouseDownHandler); 
	
	
    var image = new Image();
    image.src = 'data:image\/(png|jpg);base64,' + _data.navData;
    image.onload = handleImageLoad
    
    createjs.Ticker.addEventListener("tick", stage);
}

$('#modal-Settings').on('click', '.modal-footer .btn-ok', function(){
	if(_stg_data.layer == 12) //marker
	{
		_zone_container.removeChild(_stg_data);
		_stg_data.settings.name = $("input[name=markername]").val();
		_stg_data.settings.x =parseFloat($("input[name=markerx]").val())/0.05;
		_stg_data.settings.y = parseFloat($("input[name=markery]").val())/0.05 ;
		//_stg_data.settings.y = parseFloat($("input[name=markery]").val())/0.05 +width*scale;
		_stg_data.settings.theta = parseFloat($("#theta").val());
		_stg_data.settings.type = parseInt($("select[id=slt-markertype]").val());
		_stg_data.settings.type = parseInt($("select[id=slt-markertype]").val());
		createMarker(_stg_data);
	}
});

$('#modal-Settings').on('click', '.modal-footer .btn-delete', function(){
	
	var pt = _robot_container.globalToLocal(stage.mouseX, stage.mouseY);
		stage.children[5].removeChild(_delete_pos);
		leng=stage.children[2].children.length;
		var i
		for(i=0;i<leng;i++)

		{
			
			 if(stage.children[2].children[i].settings.x==_delete_pos.x)
				{
					stage.children[2].removeChild(stage.children[2].children[i]);
				}	
			
			

		}
});

$('#modal-Settings').on('click', '.modal-footer .btn-edit', function(){
	
	var pt = _robot_container.globalToLocal(stage.mouseX, stage.mouseY);
		stage.children[5].removeChild(_delete_pos);
		leng=stage.children[2].children.length;
		var i
		for(i=0;i<leng;i++)

		{
			
			 if(stage.children[2].children[i].settings.x==_delete_pos.x)
				{
					stage.children[2].removeChild(stage.children[2].children[i]);
				}	
			
			

		}
	// var pt = _robot_container.globalToLocal(stage.mouseX, stage.mouseY);
	// 	stage.children[5].removeChild(_delete_pos);
	// 	leng=stage.children[2].children.length;
	// 	var i
	// 	for(i=0;i<leng-1;i++)
	// 	{
	// 		if(stage.children[2].children[i].type=='point'){
	// 			if(stage.children[2].children[i].settings.x==_delete_pos.x)
				
	// 		{
	// 			stage.children[2].removeChild(stage.children[2].children[i]);
	// 		}	
	// 		}
			

	// 	}

 if(_stg_data.layer == 12) //marker
	{
		_zone_container.removeChild(_stg_data);
		_stg_data.settings.name = $("input[name=markername]").val();
		_stg_data.settings.x = parseFloat($("input[name=markerx]").val())/0.05;
		_stg_data.settings.y = parseFloat($("input[name=markery]").val())/0.05 ;

		//_stg_data.settings.y = parseFloat($("input[name=markery]").val())/0.05 +width*scale;
		_stg_data.settings.theta = parseFloat($("#theta").val())*180/Math.PI;
		_stg_data.settings.type = parseInt($("select[id=slt-markertype]").val());
		createMarker(_stg_data);
	}
});

function createMarker(option) {

	/*
	x= 10, y = 105
	var c = document.getElementById("myCanvas");
	var ctx = c.getContext("2d");
	ctx.beginPath();
	ctx.moveTo(x+10, y-20);
	ctx.lineTo(x, y)
	ctx.lineTo(x-10, y-20);
	ctx.bezierCurveTo(x-16, y-40, x+16, y-40, x+10, y-20);
	ctx.stroke();
	ctx.moveTo(x+5, y-25);
	ctx.arc(x, y-25, 5, 0, 2 * Math.PI,true);
	ctx.fill()
	ctx.stroke();
	*/



	
	rect = new createjs.Shape();
        img = new Image();
	

	switch(option.settings.type)
	{
		case 0: //Robot position
			//icon.graphics.beginFill('rgba(100,0,0,1)');
			 img.src = 'assets/img/flag_robot_pos.png';
			 scale=0.03
			 width=512
			
			break;
		case 1: //Dock Position
			//.graphics.beginFill('rgba(100,100,0,1)');
			 img.src = 'assets/img/flag_dock_pos.png';
			 scale=0.225
			 width=80
			break;
		case 2: //Charge Position
			//icon.graphics.beginFill('rgba(100,0,0,1)');
			 img.src = 'assets/img/flag_Charge_pos.png';
			 scale=0.28125
			 width=64
			break;
	}
	
	icon_pos = new createjs.Bitmap(img);
       _marker_container.addChild(icon_pos);
       icon_pos.x = option.settings.x;
	icon_pos.y =(heightMap-option.settings.y)-width*scale;
	icon_pos.scaleX=scale
	icon_pos.scaleY=scale
    	stage.update();

		$("input[name=markername]").val()
	icon_pos.on("click", function (evt) {  
	_delete_pos=this;
	var leng=stage.children[2].children.length;

	var i
	var name_pos
	var type_ 
	var theta_
		for(i=0;i<leng;i++)
		{
			
			var LOP=Math.round(stage.children[2].children[i].settings.x)
			var LOL=Math.round(this.x)
	
				if((LOP)==LOL)
					{

						name_pos=stage.children[2].children[i].settings.name
						
						type_=stage.children[2].children[i].settings.type
						theta_=stage.children[2].children[i].settings.theta
						_zone_container.removeChild(_stg_data);
						
						
					}	
			
			

		}
    
	stg = {
		layer: 12,
		type: 0,
		settings: {
			y: (this.y)*0.05, 
			x: this.x*0.05, 
			type:type_, 
			name:name_pos , 
			theta:theta_}
		}
	$("#ok").hide();
        $("#edit").show();
	stg_marker(stg)

	$("#slt-markertype").val(type_).change()
	//$('#slt-markertype option[value=type_]').attr('selected','selected')
    	update = true;	
	})



	
	function remove_marker() {

   	 var result = confirm("Are you sure remove!");

    	return result
}


	x = option.settings.x;
	y = option.settings.y;
	icon = new createjs.Shape();
	icon.graphics.clear();
	icon.alpha = 0.7;
	
	
	//icon.graphics.beginStroke("rgba(0,0,0,0.5)");
	/*lOZICATION icon
	icon.graphics.moveTo(x+10, y-20);
	icon.graphics.lineTo(x, y);
	icon.graphics.lineTo(x-10, y-20);
	icon.graphics.bezierCurveTo(x-16, y-40, x+16, y-40, x+10, y-20);
	icon.graphics.endFill();
	icon.graphics.endStroke();
	icon.graphics.beginFill('rgba(0,0,0,0.7)')
	icon.graphics.moveTo(x+5, y-25);
	icon.graphics.drawCircle(x, y-25, 5);
	icon.graphics.endStroke();
	icon.graphics.closePath();
	*/

	//DIRECTIONS icon
	/*icon.graphics.moveTo(15, 6);
	icon.graphics.lineTo(0, 15);
	icon.graphics.lineTo(-15, 6);
	icon.graphics.moveTo(-10, 6);
	icon.graphics.bezierCurveTo(-17, -17, +17, -17, +10, +6);
	icon.graphics.endFill();
	icon.graphics.endStroke();
	icon.graphics.beginFill('rgba(0,0,0,0.7)')
	icon.graphics.moveTo(5, 0);
	icon.graphics.drawCircle(0, 0, 5);
	icon.graphics.endStroke();
	icon.graphics.closePath();
	*/

	// icon.graphics.beginFill('rgba(0,0,0,1)');
	// icon.graphics.moveTo(0, 0);
	// icon.graphics.lineTo(1, 0);
	// icon.graphics.lineTo(1, -10);
	// icon.graphics.lineTo(0, -10);
	// icon.graphics.lineTo(0, 0);
	// icon.graphics.endFill();
	// icon.graphics.beginFill('rgba(255,0,0,1)');
	// icon.graphics.moveTo(0, -10);
	// icon.graphics.lineTo(0, -15);	
	// icon.graphics.lineTo(8, -15);
	// icon.graphics.lineTo(8, -10);
	// icon.graphics.lineTo(0, -10);
	// icon.graphics.endFill();
	
	
	
	// icon.graphics.endStroke();
	// icon.graphics.closePath();



	icon.x = x;
	icon.y = y;
	icon.cursor = 'pointer';
	icon.type = 'point';
	//icon.points = [{x:x,y:y}];
	icon.layer = 12;
	icon.settings = {
		name : option.settings.name || '',
		x : x || 0,
		y : y || 0,
		theta : option.settings.theta || 0,
		type: option.settings.type || 0
	};

	icon.rotation = icon.settings.theta;

	icon.on("rollover", function (evt) {
		this.alpha = 1;
		update = true;
	});

	icon.on("rollout", function (evt) {
		this.alpha = 0.7;
		update = true;
	});

	icon.on("mousedown", function (evt) {
		print("click")
		stg_marker(this);
	});

	_zone_container.addChild(icon);

  }

function drawLine(container, pointgroup)
{
	var line = new createjs.Shape();
	line.name = 'line';
	line.alpha = 0.7;
	line.cursor = 'pointer';
	line.originScale = 1;
	line.points = pointgroup.points;
	line.layer = pointgroup.layer;
	line.type = pointgroup.type;
	if(pointgroup.type == "DrawLine")
	{
		line.graphics.setStrokeStyle(1.2/line.originScale).beginStroke("rgba(0,0,0,1)");
	}else if(pointgroup.type == "DrawPolygon")
	{
		switch(parseInt(line.layer)){
			case 3://Vitual Wall
				line.graphics.beginFill("rgba(0,0,0,0.5)");
				break;
			case 4://Speed Zone
				line.graphics.beginFill("rgba(255,0,0,0.5)");
				break;
			case 5://Bluetooth Zone
				line.graphics.beginFill("rgba(0,255,0,0.5)");
				break;
			case 6://Beep Zone
				line.graphics.beginFill("rgba(0,0,255,0.5)");
				break;
			case 7://Blink Zone
				line.graphics.beginFill("rgba(40, 154, 199,0.5)");
				break;
			case 8://No localization Zone
				line.graphics.beginFill("rgba(133, 199, 40,0.5)");
				break;
			case 9://Look-ahead Zone
				line.graphics.beginFill("rgba(199, 90, 40,0.5)");
				break;
		}
		
	}
	pointgroup.points.forEach(p =>{
		line.graphics.lineTo(p.x/line.originScale, p.y/line.originScale);
		
	});

	if(pointgroup.type == "DrawPolygon")
	{
		line.graphics.closePath ();
	}

	line.graphics.endStroke();

	line.on("rollover", function (evt) {
		this.alpha = 1;
		update = true;
	});

	line.on("rollout", function (evt) {
		this.alpha = 0.7;
		update = true;
	});
	
	line.on("mousedown", function (evt) {
		var line = new createjs.Shape();
		//////////////////////////////////
		if(_layer == 3 )
		{
			_mode = this.type;
		}
		else
		{
			_mode = "DrawPolygon";
		}
		_select_enable = false;
		//////////////////////////////////
		line.name = 'line';
		line.originScale = 1;
		line.points = this.points;
		line.layer = this.layer;
		_drw_container.addChild(line);
		for(i =0; i <this.points.length; i++)
		{
			drawPoint(this.points[i]);
		}
		this.parent.removeChild(this);
		update = true;
	});

	container.addChild(line);
}

function drawPoint(option)
{
	var px = option.x | 0;
	var py = option.y | 0;

	var point = new createjs.Shape();
	point.graphics.beginFill("rgba(0,255,0,0.1)").beginStroke("rgba(0,0,0,0.5)").drawCircle(0, 0, 5);
	point.x = px;
	point.y = py;
	point.selected = false;
	point.scale = 1/_scale;
	point.name = 'point'
	point.cursor = 'pointer'

	point.on("rollover", function (evt) {
		this.scale = 2/_scale;
		update = true;
	});

	point.on("rollout", function (evt) {
		if(!this.selected)this.scale = 1/_scale;
		update = true;
	});

	point.on("pressmove", function (evt) {
		var pt = _bkg_container.globalToLocal(stage.mouseX, stage.mouseY);
		this.x = pt.x;
		this.y = pt.y;
		update = true;
	});

	point.on("mousedown", function (evt) {
		if(_eraser_enable)
			_drw_container.removeChild(this)
	});


	_drw_container.addChild(point)
}

//HANDLE
function handleImageLoad(event) {
	var image = event.target;
	

    // create the canvas to render to
    var cv = document.createElement('canvas');
    cv.name = 'cvs-map'
    cv.width = image.width;
	cv.height = image.height;

	var ctx = cv.getContext("2d");
    ctx.drawImage(image,0,0);

	_bmp_map = new createjs.Bitmap(cv);
	//_bmp_map.regX = _bmp_map.image.width / 2 | 0;
	//_bmp_map.regY = _bmp_map.image.height / 2 | 0;
	//_bmp_map.x = canvas.width / 2 | 0;
    //_bmp_map.y = canvas.height / 2 | 0;

    _bkg_container.addChild(_bmp_map);
	_bkg_container.addChild(_cur);
	_bkg_container.addChild(_current_point)

	createjs.Ticker.addEventListener("tick", tick);
}

function tick(event) {
    // Update GUI
    if(_select_enable)
    {
        if(_layer >= 4) _zone_container.mouseEnabled = true;
        else _zone_container.mouseEnabled = false;
        
        if(_layer == 3 ) _wall_container.mouseEnabled = true;
        else _wall_container.mouseEnabled = false;
        
    }else 
    {
        _zone_container.mouseEnabled = false;
        _wall_container.mouseEnabled = false;
    }

	if(_pan_enable) $('#tool-list').find('.fa-arrows-alt').addClass('actived');
	else  $('#tool-list').find('.fa-arrows-alt').removeClass('actived');

	if(_eraser_enable) $('#tool-list').find('.fa-eraser').addClass('actived');
	else  $('#tool-list').find('.fa-eraser').removeClass('actived');

	if(_select_enable) $('#tool-list').find('.fa-mouse-pointer').addClass('actived');
	else  $('#tool-list').find('.fa-mouse-pointer').removeClass('actived');

	if(_mode=='DrawPolygon') $('#tool-list').find('.fa-draw-polygon').addClass('actived');
	else  $('#tool-list').find('.fa-draw-polygon').removeClass('actived');

	if(_mode=='DrawLine') $('#tool-list').find('.fa-pen').addClass('actived');
	else  $('#tool-list').find('.fa-pen').removeClass('actived');

	if(_mode=='align') $('#bottom_tool').find('.fa-location-arrow').addClass('actived');
	else  $('#bottom_tool').find('.fa-location-arrow').removeClass('actived');


	if(_layer >0 && _layer <=3 ) $('#tool-list').find('.map-tool').removeClass('hidden');
	else $('#tool-list').find('.mastartXne-tool').addClass('hidden');

	if(_layer == 12 ) $('#tool-list').find('.marker-tool').removeClass('hidden');
	else $('#tool-list').find('.marker-tool').addClass('hidden');
	/////////////////////////////////////////////
	// this set makes it so the stage only re-renders when an event handler indicates a change has happened.
	if (update) {
		update = false; // only update once
		
		points = _drw_container.children.filter(p => p.name=='point')
		if(points.length > 1)
		{
			if(_mode =='DrawLine')
			{
				line = _drw_container.children.find(line => line.name == 'line')
				line.graphics.clear()
				line.graphics.setStrokeStyle(1/line.originScale).beginStroke("rgba(0,0,0,1)");
				//line.graphics.moveTo(points/line.originScale,100/line.originScale);
				points.forEach(p =>
					{
						//line.graphics.moveTo(p.x/line.originScale, p.x/line.originScale);
						line.graphics.lineTo(p.x/line.originScale, p.y/line.originScale);
					})
				//line.graphics.closePath ()
				line.graphics.endStroke();
			}
			if(_mode =='DrawPolygon')
			{
				line = _drw_container.children.find(line => line.name == 'line')
				if(line)
				{
					line.graphics.clear();
					layer = parseInt(line.layer)
					if(layer == 1) //Wall
						line.graphics.beginFill("rgba(0,0,0,0.5)");
					else if(layer == 2) //Floor
						line.graphics.beginFill("rgba(255,255,255,0.5)");
					else if(layer == 3) //Vitual Wall
						line.graphics.beginFill("rgba(0,0,0,1)");
					else if(layer == 4) //Speed Zone
						line.graphics.beginFill("rgba(255,0,0,0.5)");
					else if(layer == 5) //Bluetooth Zone
						line.graphics.beginFill("rgba(0,255,0,0.5)");
					else if(layer == 6) //Beep Zone
						line.graphics.beginFill("rgba(0,0,255,0.5)");
					else if(layer == 7) // Blink Zone
						line.graphics.beginFill("rgba(40, 154, 199,0.5)");
					else if(layer == 8) //No localization Zone
						line.graphics.beginFill("rgba(133, 199, 40,0.5)");
					else if(layer == 9) //Look-ahead Zone
						line.graphics.beginFill("rgba(199, 90, 40,0.5)");
					//line.graphics.moveTo(points/line.originScale,100/line.originScale);
					points.forEach(p =>
						{
							//line.graphics.moveTo(p.x/line.originScale, p.x/line.originScale);
							line.graphics.lineTo(p.x/line.originScale, p.y/line.originScale);
						})
					line.graphics.closePath ()
					line.graphics.endStroke();
				}
				else{
					
				}
				
			}
		}
		else{
			line = _drw_container.children.find(line => line.name == 'line')
			if(line)
			{
				line.graphics.clear()
			}
		}
		stage.update(event);
		
	}
}



///////////////////////////////////HANDLE//////////////////////////////////
var _scale = 1;
function MouseWheelHandler(e) {

	
           
	if(Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)))>0)
		zoom=1.1;
	else
		zoom=1/1.1;
		var local = stage.globalToLocal(stage.mouseX, stage.mouseY);
	_scale *= zoom
    stage.regX=local.x;
    stage.regY=local.y;
	stage.x=stage.mouseX;
	stage.y=stage.mouseY;	

          
	stage.scaleX=stage.scaleY*=zoom;
	

	offset_x= stage.x-stage.x*stage.scaleX;
	offset_y= stage.y-stage.y*stage.scaleY;
	//console.log(offset_x)
	//console.log(e)
	_current_point.scale /= zoom;
	_drw_container.children.forEach(p => {
		p.scale /= zoom;
		p.originScale = p.scale;
	})
	update = true;
	
}

function StageMouseDownHandler(e){
    if(_pan_enable)
        {  
            //console.log(e)
            var offset={x:stage.x-e.stageX,y:stage.y-e.stageY};
            stage.addEventListener("stagemousemove",function(ev) {
                stage.x = ev.stageX+offset.x;
                stage.y = ev.stageY+offset.y;
                stage.update();
            });
            stage.addEventListener("stagemouseup", function(){
                stage.removeAllEventListeners("stagemousemove");
            });
        }
        else if(_pan_enable==false){
            stage.addEventListener("stagemousemove",function(ev) {

			var pt = _bkg_container.globalToLocal(stage.mouseX, stage.mouseY);
			if(_mode =="align"&&align){

			pointer_up_x=pt.x;
			pointer_up_y=pt.y;
			_robot.x=pointer_dowm_x;
		  	 _robot.y=pointer_dowm_y;
			
			tan_alpha=(pointer_up_y-pointer_dowm_y)/(pointer_up_x-pointer_dowm_x);
			del_x=pointer_up_x-pointer_dowm_x
			del_y=pointer_up_y-pointer_dowm_y
	
			theta_robot=(Math.atan(tan_alpha)/Math.PI)*180
			if(del_x<0&&del_y>0){
			_robot.rotation=theta_robot+180;
			}

			else if(del_x<0&&del_y<0){
			_robot.rotation=theta_robot+180;
			}
			else 
			 _robot.rotation=theta_robot;
			}
 

				if(_mode == "Nomal" && _eraser_enable && _cur.visible == true)
				{
					var ctx = _bmp_map.image.getContext("2d");
					var pt = _bkg_container.globalToLocal(stage.mouseX, stage.mouseY);
					var imageData = ctx.getImageData(pt.x - _erase_size/2, pt.y - _erase_size/2 , _erase_size, _erase_size);
					for (i = 0; i< imageData.data.length; i+=4)
					{
						if(imageData.data[i] <= 200)
						{
							imageData.data[i] = 254;
							imageData.data[i+1] = 254;
							imageData.data[i+2] = 254;
						}
					}

					ctx.putImageData(imageData,pt.x - _erase_size/2 ,pt.y - _erase_size/2);
					
					//update = true;
					}
            });
        }
}
////////////////////////////////////////////////////////////////////////////////////////
function stg_marker(marker)
{
	_stg_data = marker;
	const str = `<p class="marker">Marker settings</p>
							<div class="form-group"><input type="text" name="markername" class="form-control-user form-control" placeholder="Name" value ="`+ marker.settings.name +`"></div>	
							<div class="form-group">
								<select id="slt-markertype" class="form-control">
									<option value="0" selected>Robot position</option>
									<option value="1">Dock station</option>
									<option value="2">Charge station</option>
								</select>
							</div>
							<div class="form-group">
								<div class="row">
									<div class="col-lg-4">
										<strong>x</strong>
										<input type="text" id="x" name="markerx" class="form-control-user form-control" placeholder="X coordinate in meters" value ="`+ marker.settings.x +`">
									</div>
									<div class="col-lg-4">
										<strong>y</strong>
										<input type="text" id="y" name="markery" class="form-control-user form-control" placeholder="Y coordinate in meters" value ="`+ marker.settings.y +`">
									</div>
									<div class="col-lg-4">
										<strong>theta</strong>
										<input type="text" id="theta"  name="markertheta" class="form-control-user form-control" placeholder="Orientation from X-axis" value ="`+ marker.settings.theta +`">
									</div>
								</div>
							</div>
							<button onclick="myFunction()" class="btn btn-primary btn-block text-white btn-user" type="submit">Detect Marker</button>`
	
	$('#modal-Settings').find('.modal-body')[0].innerHTML = str;
	$('#modal-Settings').modal();
}
////////////////////////////////////////////////////////////////////////////////////////
//Move button
$('#tool-list').on('click', 'li .fa-arrows-alt', function()
{
	if(_pan_enable)
	{
		_pan_enable = false;
		$(this).removeClass('actived')
	}
	else{
		_pan_enable = true;
		$(this).addClass('actived')
	}
});
 
function myFunction(){
document.getElementById("x").value=_robot.x*0.05
document.getElementById("y").value=  (heightMap-_robot.y)*0.05
document.getElementById("theta").value=_robot.rotation*Math.PI/180


}

//Config button
$('#tool-list').on('click', 'li .fa-cog', function()
{
	if(_layer == 9) {
		$('#modal-Settings').find('.modal-body')[0].innerHTML = _stg_lookaheadZone;
		$('#modal-Settings').modal();
	}
	if(_layer == 4) {
		$('#modal-Settings').find('.modal-body')[0].innerHTML = _stg_speedZone;
		$('#modal-Settings').modal();
	}
});

//Pen tool
$('#tool-list').on('click', 'li .fa-pen', function()
{
	if(_mode == 'DrawLine')
	{
		_mode = 'Nomal';
		hiddenchild(_drw_container,'point')
	}
	else{
		_mode = 'DrawLine'
		_select_enable = false;
        showchild(_drw_container,'point')
    }
    update = true;
});

$("#bottom_tool").on('click','li .fa-location-arrow',function(){
	console.log(_mode)
	if(_mode == 'align')
	{
		_mode = 'Nomal';

	}
	else{
		_mode = 'align';
		listener.unsubscribe();
    }
	
})


//Add Marker tool
$('#tool-list').on('click', 'li .fa-map-marker-alt', function()
{
	$("#ok").show();
        $("#edit").hide();
	stg = {
		layer: 12,
		type: "point",
		settings: {
			y: 0, 
			x: 0, 
			type: 1, 
			name: "", 
			theta: 0.0}
		}
	stg_marker(stg)
    update = true;
});

//Layer change - Select event
$('#tool-list').on('click', 'li .fa-draw-polygon', function()
{
	if(_mode == 'DrawPolygon')
	{
		_mode = 'Nomal';
		hiddenchild(_drw_container,'point')
	}
	else{
		_mode = 'DrawPolygon';
		_select_enable = false;
        showchild(_drw_container,'point')
    }
    update = true;
});

//Eraser Tool
$('#tool-list').on('click', 'li .fa-eraser', function()
{
	if(_eraser_enable)
	{
		_eraser_enable = false;
	}
	else{
		_eraser_enable = true;
		_select_enable = false;
	}
	
});

//Select Tool
$('#tool-list').on('click', 'li .fa-mouse-pointer', function()
{
	if(_select_enable)
	{
		$(this).removeClass('actived')
		_select_enable = false;
	}
	else{
		if(_drw_container.children.length==0){
			$(this).addClass('actived')
			_select_enable = true;
			_mode = 'Nomal';
			_eraser_enable = false;
		}
	}
	update = true;
});

//Confirm button
$('#tool-list').on('click', 'li .fa-check', function()
{
	applytomap();
	update = true;
});

//Disconfirm button
$('#tool-list').on('click', 'li .fa-close', function()
{
	 _drw_container.removeAllChildren()
});

//Select layer
$('#slt-layertype').change(function()
{
    $("#slt-layertype > option:selected" ).each(function() {
		_layer = this.value;
		if(_drw_container.children.find(line => line.name == 'line'))
		{
			_drw_container.children.find(line => line.name == 'line').layer = _layer;
		}
        
        switch(parseInt(this.value))
        {
			case 1: //Wall
			case 2: //Floor
			case 3: //Vitual Wall
				break;
			case 4: //Speed Zone
			case 5: //Bluetooth Zone
			case 6: //Beep Zone
			case 7: //B{"layer": 12, "points": [{"y": 100, "x": 555}], "type": "point"}, link Zone
			case 8: //No localization Zones
			case 9: //Look-ahead Zones
				if(_mode=="DrawLine") _mode = "DrawPolygon"
				break;
			case 12: //Marker
				_mode = 'Nomal'
				_drw_container.removeAllChildren();
                break;
            default:
                break;
        }
	  });
    update = true;
});

document.body.onkeydown = function(event)
{
	var btn_pan = $('#tool-list').find('.fa-arrows-alt');
    if(event.ctrlKey) 
    {
		_pan_enable = true;
		update = true;
    }

    document.body.onkeyup = function(event)
    {
        if(!event.ctrlKey) 
        {
			_pan_enable = false;
			update = true;
        }
    };
};



/////////////////////////////////////////////////////////////////////////
function hiddenchild(container, name)
{
	var points = container.children.filter(p => p.name==name)
	if(points.length > 0)
	{
		points.forEach(p=>{
			p.visible = false;
		})
	}
}

function showchild(container, name)
{
	var points = container.children.filter(p => p.name==name)
	if(points.length > 0)
	{
		points.forEach(p=>{
			p.visible = true;
		})
    }
    update = true;
}


function applytomap()
{
    hiddenchild(_drw_container,'point')
	if(_mode =='DrawLine' || _mode =='DrawPolygon')
	{
		layer = _drw_container.children.find(line => line.name == 'line').layer
        // Put data to background layer
		if(layer == 1 || layer == 2)
        {			
            var ctx = _bmp_map.image.getContext("2d");
            var cont = _drw_container.clone(true);
            cont.cache(0,0,_bmp_map.image.width,_bmp_map.image.height);
            var ctx_draw = cont.cacheCanvas.getContext("2d");
            var imageData = ctx.getImageData(0,0,_bmp_map.image.width,_bmp_map.image.height);
            var drawData = ctx_draw.getImageData(0,0,_bmp_map.image.width,_bmp_map.image.height);
            for (i = 0; i< drawData.data.length; i+=4)
            {
                if(_layer == 1) 
                {
                    if(drawData.data[i+3] > 50)
                    {
                        //black
                        imageData.data[i] = 0;
                        imageData.data[i+1] = 0;
                        imageData.data[i+2] = 0;
                    }
                }
                else if(_layer == 2) 
                {
                    if(drawData.data[i+3] > 50 && imageData.data[i] > 50)
                    {
                  
                        imageData.data[i] = 254;
                        imageData.data[i+1] = 254;
                        imageData.data[i+2] = 254;
                    }
                }
                
            }

            ctx.putImageData(imageData,0 ,0);
        }
        else if(layer >= 3 && layer <= 9)
        {
			var l = _drw_container.children[0];
			l.alpha = 0.7;
            l.cursor = 'pointer';
            l.type = _mode
			l.points = [];
			l.layer = layer;
			
			for(i =1; i < _drw_container.children.length; i++)
			{
				p = {x:_drw_container.children[i].x, y:_drw_container.children[i].y}
				l.points.push(p);
			}
			l.on("rollover", function (evt) {
				this.alpha = 1;
				update = true;
			});

			l.on("rollout", function (evt) {
				this.alpha = 0.7;
				update = true;
			});
			
			l.on("mousedown", function (evt) {
                var line = new createjs.Shape();
                //////////////////////////////////
                if(_layer == 3 )
                {
                    _mode = this.type;
                }
                else
                {
                    _mode = "DrawPolygon";
                }
				_select_enable = false;
				//////////////////////////////////
				line.name = 'line';
				line.originScale = 1;
				line.points = this.points;
                line.layer = this.layer;
				_drw_container.addChild(line);
				for(i =0; i <this.points.length; i++)
				{
					drawPoint(this.points[i]);
				}

				this.parent.removeChild(this);
				update = true;
            });
            if(_layer == 3 ) 
            {
                _wall_container.addChild(l);
                _wall_container.mouseEnabled = false;
            }
            else {
                _zone_container.addChild(l)
                _zone_container.mouseEnabled = false;
            }
            
        }

        // Put data to zone layer
    }
    
    _drw_container.removeAllChildren()
}

var button = document.getElementById('btn-download');

button.addEventListener('click', function (e) {
	var ctx = _bmp_map.image.getContext("2d");
	var data_nave=[]
	var data_wall=[]
	var navdataURL = ctx.getImageData(0,0,_bmp_map.image.width,_bmp_map.image.height);
	for(var i=0;i<navdataURL.data.length;i=i+4)
	{
		data_nave.push(navdataURL.data[i])
	}


	var wallcont = _wall_container.clone(true);
	wallcont.alpha = 1;
	wallcont.cache(0,0,widthMap,heightMap);
	var wall_ctx = wallcont.cacheCanvas.getContext("2d");//.toDataURL('image/png');
	walldataURL=wall_ctx.getImageData(0,0,_bmp_map.image.width,_bmp_map.image.height);
	
    for(var i=0;i<walldataURL.data.length;i=i+4)
	{
		if(walldataURL.data[i]==0)
		{
			data_wall.push(255)
		
		}
	 if(walldataURL.data[i]!==0)
		{
			console.log('e')
			data_wall.push(205)
		}
	}
	
	console.log(data_wall)
	
	navdataURL
	wdata = {
		imgdata: data_wall,
		pointdata: []
	};

	_wall_container.children.forEach(w =>{
		wdata.pointdata.push({points:w.points, type: w.type, layer: w.layer})
	});

	zdata = []
	_zone_container.children.forEach(z =>{
		zdata.push({points:z.points, type: z.type, settings: z.settings, layer: z.layer})
	});
    savedata={
		name: mapname,
		navData: data_nave,
		width:navdataURL.width,
		height:navdataURL.height,
        wallData: wdata,
		zoneData: zdata
		
	}
	console.log(this._mode)
	// Sending the image data to Server
	
    $.ajax({
        type: 'POST',
        url: '',
		data: JSON.stringify(savedata),
        contentType: 'application/json; charset=utf-8',
        dataType: 'json',
        success: function (msg) {
			console.log("Done, Picture Uploaded.");
	
        }
    });
});




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
     url: 'ws://'+window.location.hostname+':9090'
});

// console.log(ros)
// ros.on('connection', function () {
// document.getElementById("status").innerHTML = "Connected";
// });

ros.on('error', function (error) {
document.getElementById("status").innerHTML = "Error";
});

ros.on('close', function () {
document.getElementById("status").innerHTML = "Closed";
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






  




