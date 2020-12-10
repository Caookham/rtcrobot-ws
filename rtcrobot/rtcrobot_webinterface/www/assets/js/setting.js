//khamf
var ws = new WebSocket("ws:/127.0.0.1:8888/name_mission");
var index
var data_recive
var paramerter
var save_setting = {
    command: 'save_setting',
    paramerter: '',
};
var newTr = ` <tr>
<td class="cell-left">max_vel_x</td>
<td  class="cell-center">10 mm/s</td>
<td  class="cell-right"><i class="fa fa-pencil ml-1"></i></td>
</tr>`;

var newTr1 = ` <tr>
<td class="cell-left">max_vel_x</td>
<td ></td>
<td  class="cell-right"></td>
</tr>`;
ws.onopen = function (e) {
    var msg_requert = {
        command: "setting",
        name: []
    };
    ws.send(JSON.stringify(msg_requert));
}

table_setting = document.getElementById("setting_parameter");
table_baterry = document.getElementById("table_baterry");

$(".talbe_setting").on('click', 'tr', function () {
    index = this.rowIndex;
    $(this).addClass('table-active').siblings().removeClass('table-active')
});

$(".talbe_setting").on('click', 'td .fa-pencil', function () {
    index = this.rowIndex;
    $(this).addClass('table-active').siblings().removeClass('table-active')
    paramerter = $(this).parent().parent().children()[0].innerHTML;
    document.getElementById("label").innerHTML = paramerter;

    $('#setting').modal({
        show: true
    });

})


$("#ok_setting").click(function () {
    value = document.getElementById("value").value;
    console.log(typeof parseInt(value));
    if (value != -0) {
        data_recive.DWBLocalPlanner[paramerter] = parseInt(value)
        table_setting.rows[index].cells[1].innerHTML = parseInt(value)
        paramerter = table_setting.rows[index].cells[0].innerHTML
    }

})
$("#ok_setting_light").click(function () {
    value_state = document.getElementById("state").value;

    leng_color = Object.values(data_recive.light.color).length;
    for (i = 0; i < leng_color; i++) {
        color = Object.keys(data_recive.light.color)[i];
        if (color == document.getElementById("color").value) {
            rbg = Object.values(data_recive.light.color)[i];
        }

    }


    leng_efect = Object.values(data_recive.light.efect).length;
    var i;
    for (i = 0; i < leng_efect; i++) {
        efect = Object.keys(data_recive.light.efect)[i]
        if (efect == document.getElementById("efect").value) {
            hieu_ung = Object.values(data_recive.light.efect)[i]
        }
    }


    data = hieu_ung + " " + rbg
    console.log(data)
    console.log(data_recive)
    data_recive.light.state[value_state] = data

    c = alent()
    if (c) {
        save_setting.paramerter = data_recive
        ws.send(JSON.stringify(save_setting));
        console.log(data_recive)
    }

})

$("#save_modifided").click(function () {
    c = alent()
    if (c) {
        save_setting.paramerter = data_recive
        ws.send(JSON.stringify(save_setting));
        console.log(data_recive)
    }
})


ws.onmessage = function (evt) {
    // $("#list_mission").hide();
    data_recive = JSON.parse(evt.data)

    console.log(data_recive.DWBLocalPlanner)
    leng = Object.values(data_recive.DWBLocalPlanner).length;
    for (i = 1; i < leng; i++) {
        $(".talbe_setting").append(newTr)
        table_setting.rows[i].cells[0].innerHTML = Object.keys(data_recive.DWBLocalPlanner)[i];
        table_setting.rows[i].cells[1].innerHTML = Object.values(data_recive.DWBLocalPlanner)[i];
    }
    leng_state = Object.values(data_recive.light.state).length;
    for (i = 0; i < leng_state; i++) {
        state = Object.keys(data_recive.light.state)[i];
        $('#state').append(`<option value="${state}">   
        ${state}                                
        </option>`);
        $('#state1').append(`<option value="${state}">   
        ${state}                                
        </option>`);
    }
    leng_color = Object.values(data_recive.light.color).length;
    for (i = 0; i < leng_color; i++) {

        color = Object.keys(data_recive.light.color)[i];
        //console.log(color)
        $('#color').append(`<option value="${color}">   
        ${color}                                
        </option>`);
    }

    leng_efect = Object.values(data_recive.light.efect).length;
    for (i = 0; i < leng_efect; i++) {
        efect = Object.keys(data_recive.light.efect)[i];
        $('#efect').append(`<option value="${efect}">   
        ${efect}                                
        </option>`);
    }

    leng_baterry = Object.values(data_recive.Baterry).length;
    for (i = 1; i < leng_baterry; i++) {
        $(".baterry").append(newTr1)
        table_baterry.rows[i].cells[0].innerHTML = Object.keys(data_recive.Baterry)[i];
        table_baterry.rows[i].cells[2].innerHTML = Object.values(data_recive.Baterry)[i];
    }
    leng_sound = data_recive.sound.length;
    console.log(leng_sound)
    for (i = 0; i < leng_sound; i++) {

        sound=data_recive.sound[i];
        console.log(sound)
        $('#sound1').append(`<option value="${sound}">  
        ${sound}                                
        </option>`);
    }

}

function alent() {

    var result = confirm("Are you sure save setting!");

    return result
}


////////////////////////////////////////////////////////////////////////////
// 
////////////////////////////////////////////////////////////////////////////
var ros = new ROSLIB.Ros({
    url: 'ws://192.168.5.58:9090'
});

//   var fibonacciClient = new ROSLIB.ActionClient({
//     ros : ros,
//     serverName : 'sound_play',
//     actionName : '/sound_play/action/SoundRequest'
//   });

//   var goal = new ROSLIB.Goal({
//     actionClient : fibonacciClient,
//     goalMessage : {
//         sound :-2,
//         command:1,
//         volume:1,
//         arg:"/home/mtk/catkin_ws/src/robot_ws/src/rtcrobot/rtcrobot_webinterface/sound/hat.wav"
//     }
//   });


//goal.send();
var light = new ROSLIB.Topic({
    ros: ros,
    name: 'web_control_light',
    messageType: 'rtcrobot_msgs/light'
});



var light_control = new ROSLIB.Message({
    state: document.getElementById("state").value,
    value: '255,255,0'
})

$("#save").click(function () {
c = alent()
    if (c) {
       console.log(document.getElementById("state").value)
       light.publish(light_control);
}
    
})



//   var listener = new ROSLIB.Topic({
//     ros : ros,
//     name : 'chatter',
//     messageType : 'std_msgs/String'
//   });

//   listener.subscribe(function(message) {
//     console.log('Received message on '+ message);

//         listener.unsubscribe();


//   });
