var condinate;
table = document.getElementById("talbe_mission");
var value
var rIndex;
var condition;
var min_level;
var min_time;
var map_name;
var Index = 0;
var msg_pose

var msg_pose // pose in action 
    // messenge send server when save mission 
var msg = {
    command: "save_mission",
    name: [],
    date: [],
    action: []
}


// init connection to server
var ws = new WebSocket("ws://192.168.5.10:8888/name_mission");
//var ws = new WebSocket("ws://192.168.5.71:8888/name_mission");
var msg_editmission = {
    command: "display_mission",
    name: "name_mission",
};
// request display mission 
ws.onopen = function(e) {
    ws.send(JSON.stringify(msg_editmission));
};


// select action
$("#setting").click(function() {
    value = document.getElementById("select_action").value;

    if (value == "while_setting") {
        $('#while_setting').modal({
            show: true
        });
        $("#edit_while").hide();
        $("#creat_while").show();
    };

    if (value == "move_setting")

    {
    value_map = document.getElementById("Chosse_Map").value;
    length_pose=msg_tem.pose_name[value_map].length;
    console.log(length_pose)
	$( "#select_condinate option" ).remove();
	for (i = 0; i < length_pose; i++) {
            name_pose = msg_tem.pose_name[value_map][i].settings.name
            $('#select_condinate').append(`<option value="${name_pose}">   
            ${ name_pose}                                
            </option>`);
        }
    
        $('#move_setting').modal({
            show: true
        });
        $("#creat_move").show();
        $("#edit_move").hide();
    };
    if (value == "charge_setting") {
        $("#edit_charge").hide();
        $('#charge_setting').modal({
            show: true
        });
        $("#creat_charge").show();
        $("#edit_charge").hide();

    };
    if (value == "switch_map") {
        $('#switch_map_setting').modal({
            show: true
        });
        $("#creat_sw_map").show();
        $("#edit_switch").hide();
    };
    if (value == "if_setting") {
        $('#if_setting').modal({
            show: true
        });
        $("#creat_if").show();
        $("#edit_if").hide();
    };
});


$("#creat_move").click(function() {
    leng = table.rows.length;
    console.log(leng)
    condinate = document.getElementById("select_condinate").value;
    name_pose = document.getElementById("Chosse_Map").selectedIndex;
    i = document.getElementById("select_condinate").selectedIndex;
    console.log(i)

    var move = {
        type: "Move",
        Con: condinate,
        x: msg_pose.pose_name[name_pose][i].settings.x,
        y: msg_pose.pose_name[name_pose][i].settings.y,
        theta:  msg_pose.pose_name[name_pose][i].settings.theta,
    };
    console.log(move)
    msg.action.push(move);
    var newRow = table.insertRow(table.length),
        cell1 = newRow.insertCell(0),
        cell2 = newRow.insertCell(1),
        cell3 = newRow.insertCell(2),
        cell4 = newRow.insertCell(3),
        cell5 = newRow.insertCell(4);
    cell1.innerHTML = msg.action[leng - 1].type,
        cell2.innerHTML = msg.action[leng - 1].Con,
        cell3.innerHTML = '',
        cell4.innerHTML = '';
    cell5.innerHTML = '<div class="float-right" ><i  onclick="Delete()" class="fa fa-trash-o mr-2"></i><i  id="edit"  class="fa fa-pencil ml-1"></i> </div>'

});


$("#creat_charge").click(function() {
    leng = table.rows.length;
    min_level = document.getElementById("min_level").value;
    min_time = document.getElementById("min_time").value;
    msg_Charging = {
        type: "Charging",
        Min_level: min_level,
        Min_time: min_time,
    };
    msg.action.push(msg_Charging);

    var newRow = table.insertRow(table.length),
        cell1 = newRow.insertCell(0),
        cell2 = newRow.insertCell(1),
        cell3 = newRow.insertCell(2),
        cell4 = newRow.insertCell(3),
        cell5 = newRow.insertCell(4);
    cell1.innerHTML = msg.action[leng - 1].type,
        cell2.innerHTML = "min_level   :" + msg.action[leng - 1].Min_level,
        cell3.innerHTML = ' min_time   :' + msg.action[leng - 1].Min_time;
    cell4.innerHTML = '';
    cell5.innerHTML = '<div class="float-right" ><i  onclick="Delete()" class="fa fa-trash-o mr-2"></i><i  id="edit"  class="fa fa-pencil ml-1"></i> </div>'


});


$("#creat_sw_map").click(function() {
    leng = table.rows.length;
    map_name = document.getElementById("select_map").value;
    msg_switch_map = {
        type: "switch_map",
        Map_name: map_name,
    };
    msg.action.push(msg_switch_map);

    var newRow = table.insertRow(table.length),
        cell1 = newRow.insertCell(0),
        cell2 = newRow.insertCell(1),
        cell3 = newRow.insertCell(2);
    cell4 = newRow.insertCell(3),
        cell5 = newRow.insertCell(4);

    cell1.innerHTML = msg.action[leng - 1].type;
    cell2.innerHTML = "map name   :" + msg.action[leng - 1].Map_name,
        cell3.innerHTML = '';
    cell4.innerHTML = '';
    cell5.innerHTML = '<div class="float-right" ><i  onclick="Delete()" class="fa fa-trash-o mr-2"></i><i  id="edit"  class="fa fa-pencil ml-1"></i> </div>'
});

$("#creat_while").click(function() {
    leng = table.rows.length;
    action = document.getElementById("action").value;
    Condition_while = document.getElementById("Condition_while").value;
    Condition_run_while = document.getElementById("Condition_run_while").value;
    Operation_while = document.getElementById("Operation_while").value;

    msg_while = {
        type: "logic while",
        Con_run_while: Condition_run_while,
        Con_while: Condition_while,
        op_while: Operation_while,
        action_while: action,
    };
    msg.action.push(msg_while);
    console.log(msg)
    var newRow = table.insertRow(table.length),
        cell1 = newRow.insertCell(0),
        cell2 = newRow.insertCell(1),
        cell3 = newRow.insertCell(2),
        cell4 = newRow.insertCell(3),
        cell5 = newRow.insertCell(4);

    cell1.innerHTML = msg.action[leng - 1].type;
    cell2.innerHTML = msg.action[leng - 1].Con_run_while + " " + msg.action[leng - 1].op_while + " " + msg.action[leng - 1].Con_while,
        cell3.innerHTML = 'run ' + msg.action[leng - 1].action_while;
    cell4.innerHTML = '';
    cell5.innerHTML = '<div class="float-right" ><i  onclick="Delete()" class="fa fa-trash-o mr-2"></i><i  id="edit"  class="fa fa-pencil ml-1"></i> </div>'

});


$("#creat_if").click(function() {
    action = document.getElementById("action").value;
    Condition_if = document.getElementById("Condition_if").value;
    Condition_run_if = document.getElementById("Condition_run_if").value;
    Operation_if = document.getElementById("Operation_if").value;
    condition = document.getElementById("select_condinate").value;
    var newRow = table.insertRow(table.length),
        cell1 = newRow.insertCell(0),
        cell2 = newRow.insertCell(1),
        cell3 = newRow.insertCell(2),
        cell4 = newRow.insertCell(3),
        cell5 = newRow.insertCell(4);
    cell1.innerHTML = "Logic:  If";
    cell2.innerHTML = Condition_run_if + " " + Operation_if + " " + Condition_if,
        cell3.innerHTML = 'run ' + action;
    cell4.innerHTML = '';
    cell5.innerHTML = '<div class="float-right" ><i  onclick="Delete()" class="fa fa-trash-o mr-2"></i><i  id="edit"  class="fa fa-pencil ml-1"></i> </div>'
    msg_if = {
        type: "logic if",
        Con_run_if: Condition_run_if,
        Con_if: Condition_if,
        op_if: Operation_if,
        action_if: action,
    };
    msg.action.push( msg_if);
});

$("#talbe_mission").on('click', 'tr', function() {
    var id = 0;
    rIndex = this.rowIndex;
    Index = this.rowIndex;
    $(this).addClass('table-active').siblings().removeClass('table-active')
        // console.log(Index)
});

///edit mission

$("#talbe_mission").on('click', 'td .fa-pencil', function() {
    index = $(this).parent().parent().parent().children()[0].innerHTML;
    console.log(index)
    if (index == "logic while") {
        $('#while_setting').modal({
            show: true
        });
        $("#edit_while").show();
        $("#creat_while").hide();
    }


    if (index == "Move") {
        $('#move_setting').modal({
            show: true
        });
        $("#edit_move").show();
        $("#creat_move").hide();
    }

    if (index == "Charging") {
        $('#charge_setting').modal({
            show: true
        });

        $("#edit_charge").show();
        $("#creat_charge").hide();
    }


    if (index == "switch_map") {
        $('#switch_map_setting').modal({
            show: true
        });
        $("#edit_switch").show();
        $("#creat_sw_map").hide();
    }

    if (index == "Logic:  If"||index =="logic if") {
        $('#if_setting').modal({
            show: true
        });
        $("#edit_if").show();
        $("#creat_if").hide();
    }


})



$("#edit_move").click(function() {
    condition = document.getElementById("select_condinate").value;
    i = document.getElementById("select_condinate").selectedIndex;

    var move = {
        type: "Move",
        Con: condition,
        x: msg_pose.pose_name[i].x,
        y: msg_pose.pose_name[i].y,
        theta: msg_pose.pose_name[i].theta,
    };
    console.log(move)
    table.rows[rIndex].cells[1].innerHTML = condition;
    delete msg.action[rIndex - 1];
    msg.action[rIndex - 1] = move;
});


$("#edit_while").click(function() {
    action = document.getElementById("action").value;
    Condition_while = document.getElementById("Condition_while").value;
    Condition_run_while = document.getElementById("Condition_run_while").value;
    Operation_while = document.getElementById("Operation_while").value;
    condition = document.getElementById("select_condinate").value;
    table.rows[rIndex].cells[2].innerHTML = 'run ' + action;
    table.rows[rIndex].cells[1].innerHTML = Condition_run_while + " " + Operation_while + " " + Condition_while;
    msg_while = {
        type: "logic while",
        Con_run_while: Condition_run_while,
        Con_while: Condition_while,
        op_while: Operation_while,
        action_while: action,
    };
    delete msg.action[rIndex - 1];
    msg.action[rIndex - 1] = msg_while;
});

$("#edit_if").click(function() {
    action = document.getElementById("action_if").value;
    Condition_if = document.getElementById("Condition_if").value;
    Condition_run_if = document.getElementById("Condition_run_if").value;
    Operation_if = document.getElementById("Operation_if").value;
    condition = document.getElementById("select_condinate").value;
    table.rows[rIndex].cells[2].innerHTML = 'run ' + action;
    table.rows[rIndex].cells[1].innerHTML = Condition_run_if + " " + Operation_if + " " + Condition_if;
    msg_if = {
        type: "logic if",
        Con_run_if: Condition_run_if,
        Con_if: Condition_if,
        op_if: Operation_while,
        action_if: action,
    };
    delete msg.action[rIndex - 1];
    msg.action[rIndex - 1] = msg_if;
})

$("#edit_charge").click(function() {
    min_level = document.getElementById("min_level").value;
    min_time = document.getElementById("min_time").value;
    table.rows[rIndex].cells[2].innerHTML = 'min level :' + min_level;
    table.rows[rIndex].cells[1].innerHTML = 'min time :' + min_time;

    msg_Charging = {
        type: "Charging",
        Min_level: min_level,
        Min_time: min_time,
    };

    delete msg.action[rIndex - 1];
    msg.action[rIndex - 1] = msg_Charging;
})

$("#edit_switch").click(function() {
    map_name = document.getElementById("select_map").value;
    table.rows[rIndex].cells[2].innerHTML = 'map name :' + map_name;
    table.rows[rIndex].cells[1].innerHTML = '';

    msg_switch_map = {
        type: "switch_map",
        Map_name: map_name,
    };
    delete msg.action[rIndex - 1];
    msg.action[rIndex - 1] = msg_switch_map;

})

// remove action 
$("#talbe_mission").on('click', '.fa-trash-o', function() {
    var id = 0;
    Index = this.rowIndex;
    $(this).addClass('table-active').siblings().removeClass('table-active')
    rIndex = this.rowIndex;
});

function Delete() {
    b = delete_mission()
    if (b) {
        console.log(Index)
        if (Index != 0)
            table.deleteRow(Index);
        msg.action.splice(Index - 1, Index);
        console.log(msg)
    }
};

$("#creat_mission").click(function() {
    Name_mission = document.getElementById("Name_mission").value;

    var msg_newmission = {
        command: "new_mission",
        name: []
    };
    var send = { "name": Name_mission }
    msg_newmission.name.push(send);
    console.log(msg_newmission)
    ws.send(JSON.stringify(msg_newmission));
});

ws.onmessage = function(evt) {
    msg_tem = JSON.parse(evt.data)
    console.log(msg_tem)
    if (msg_tem.tyle == "save_mission") {

        msg = msg_tem

        document.getElementById("name_display").innerHTML = msg.name_mission

        len = msg.action.length;
        var i
        for (i = 0; i < len; i++) {

            if (msg.action[i].type == "Move") {

                var newRow = table.insertRow(table.length),
                    cell1 = newRow.insertCell(0),
                    cell2 = newRow.insertCell(1),
                    cell3 = newRow.insertCell(2),
                    cell4 = newRow.insertCell(3),
                    cell5 = newRow.insertCell(4);
                cell1.innerHTML = msg.action[i].type;
                cell2.innerHTML = msg.action[i].Con,
                    cell3.innerHTML = '',
                    cell4.innerHTML = '';
                cell5.innerHTML = '<div class="float-right" ><i  onclick="Delete()" class="fa fa-trash-o mr-2"></i><i  id="edit"  class="fa fa-pencil ml-1"></i> </div>'
            }

            if (msg.action[i].type == "Charging") {
                var newRow = table.insertRow(table.length),
                    cell1 = newRow.insertCell(0),
                    cell2 = newRow.insertCell(1),
                    cell3 = newRow.insertCell(2),
                    cell4 = newRow.insertCell(3),
                    cell5 = newRow.insertCell(4);
                cell1.innerHTML = msg.action[i].type,
                    cell2.innerHTML = "min_level   :" + msg.action[i].Min_level,
                    cell3.innerHTML = ' min_time   :' + msg.action[i].Min_time;
                cell4.innerHTML = '';
                cell5.innerHTML = '<div class="float-right" ><i  onclick="Delete()" class="fa fa-trash-o mr-2"></i><i  id="edit"  class="fa fa-pencil ml-1"></i> </div>'
            }


            if (msg.action[i].type == "switch_map") {
                var newRow = table.insertRow(table.length),
                    cell1 = newRow.insertCell(0),
                    cell2 = newRow.insertCell(1),
                    cell3 = newRow.insertCell(2);
                cell4 = newRow.insertCell(3),
                    cell5 = newRow.insertCell(4);

                cell1.innerHTML = msg.action[i].type;
                cell2.innerHTML = "map name   :" + msg.action[i].Map_name,
                    cell3.innerHTML = '';
                cell4.innerHTML = '';
                cell5.innerHTML = '<div class="float-right" ><i  onclick="Delete()" class="fa fa-trash-o mr-2"></i><i  id="edit"  class="fa fa-pencil ml-1"></i> </div>'

            }

            if (msg.action[i].type == "logic while") {
                var newRow = table.insertRow(table.length),
                    cell1 = newRow.insertCell(0),
                    cell2 = newRow.insertCell(1),
                    cell3 = newRow.insertCell(2),
                    cell4 = newRow.insertCell(3),
                    cell5 = newRow.insertCell(4);
                cell1.innerHTML = msg.action[i].type;
                cell2.innerHTML = msg.action[i].Con_run_while + " " + msg.action[i].op_while + " " + msg.action[i].Con_while,
                    cell3.innerHTML = 'run ' + msg.action[i].action_while;
    
                cell5.innerHTML = '<div class="float-right" ><i  onclick="Delete()" class="fa fa-trash-o mr-2"></i><i  id="edit"  class="fa fa-pencil ml-1"></i> </div>'
            }


          
            if (msg.action[i].type == "logic if") {
                var newRow = table.insertRow(table.length),
                    cell1 = newRow.insertCell(0),
                    cell2 = newRow.insertCell(1),
                    cell3 = newRow.insertCell(2),
                    cell4 = newRow.insertCell(3),
                    cell5 = newRow.insertCell(4);
                cell1.innerHTML = msg.action[i].type;
                cell2.innerHTML = msg.action[i].Con_run_if + " " +   msg.action[i].op_if + " " +  msg.action[i].Con_if,
                cell3.innerHTML = 'run ' + msg.action[i].action_if;
                cell5.innerHTML = '<div class="float-right" ><i  onclick="Delete()" class="fa fa-trash-o mr-2"></i><i  id="edit"  class="fa fa-pencil ml-1"></i> </div>'
            }

        }
    } else if (msg_tem.type == "display_pose_move") // hien thi cac pose trong action move 
    {
        msg_pose = msg_tem // setting pose
        var i;
        length_map = msg_tem.map_name.length;
    
        for (i = 0; i < length_map; i++) {
            name_map = msg_pose.map_name[i]
            $('#Chosse_Map').append(`<option value="${i}">   
            ${name_map}                                
            </option>`);
        }
    }
}



$("#save_mission").click(function() {
    a = save_mission()
    if (a) {
        delete msg.command;
        msg.command = "save_mission";
        console.log(msg)
        ws.send(JSON.stringify(msg))
    }

});

$("#Chosse_Map").change(function() {


value=$("#Chosse_Map").val()
length_pose=msg_tem.pose_name[value].length
$( "#select_condinate option" ).remove();
for (i = 0; i < length_pose; i++) {
            name_pose = msg_tem.pose_name[value][i].settings.name
            $('#select_condinate').append(`<option value="${name_pose}">   
            ${ name_pose}                                
            </option>`);
        }
    
});

function save_mission() {

    var result = confirm("Are you sure save!");

    return result
}

function delete_mission() {

    var result = confirm("Are you sure delete action!");
    return result
}
