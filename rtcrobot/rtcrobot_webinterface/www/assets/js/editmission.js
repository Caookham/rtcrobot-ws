var condinate;
table = document.getElementById("talbe_mission");
var value
var status_loop=false
var rIndex;
var condition;
var min_level;
var min_time;
var map_name;
var Index = 0;
var msg_pose
var check

var msg_pose // pose in action 
    // messenge send server when save mission 
var msg = {
    command: "save_mission",
    action: []
}

var  msg_switch_map = {
    type: "WAIT",
    wait_time: '',
    con:""
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
    console.log(value_map)
    // length_pose=msg_tem.pose_name[value_map].length;
    // console.log(length_pose)
	// $( "#select_condinate option" ).remove();
	// for (i = 0; i < length_pose; i++) {
    //         name_pose = msg_tem.pose_name[value_map][i].settings.name
    //         $('#select_condinate').append(`<option value="${name_pose}">   
    //         ${ name_pose}                                
    //         </option>`);
    //     }
    
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

    if (value == "loop") {
    leng = table.rows.length;

    var loop = {
        type: "loop",
    };
   
    msg.action.push(loop);
    var newRow = table.insertRow(table.length),
        cell1 = newRow.insertCell(0),
        cell2 = newRow.insertCell(1),
        cell3 = newRow.insertCell(2),
        cell4 = newRow.insertCell(3),
        cell5 = newRow.insertCell(4);

    cell1.innerHTML = msg.action[leng - 1].type,
        cell2.innerHTML = '',
        cell3.innerHTML = '',
        cell4.innerHTML = '';
    cell5.innerHTML = '<div class="float-right" ><i  onclick="Delete()" class="fa fa-trash-o mr-2"></i><i  id="edit"  class="fa fa-pencil ml-1"></i> </div>'

    };

});


$("#creat_move").click(function() {
    leng = table.rows.length;
    condinate = document.getElementById("select_condinate").value;
    console.log(condinate)
    name_pose = document.getElementById("Chosse_Map").selectedIndex;
    i = document.getElementById("select_condinate").selectedIndex;
    console.log(i)

    var move = "MOVE"+ " "+ condinate
    console.log(move)
    msg.action.push(move);


    var newRow = table.insertRow(table.length),
        cell1 = newRow.insertCell(0),
        cell2 = newRow.insertCell(1),
        cell3 = newRow.insertCell(2),
        cell4 = newRow.insertCell(3),
        cell5 = newRow.insertCell(4);

    cell1.innerHTML = 'MOVE',
        cell2.innerHTML =condinate,
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
map_name = document.getElementById("wait").value;

    if(map_name=='TIME')
    {

    tem=document.getElementById("time").value;
    
   wait = "WAIT " + 'TIME '+tem
    msg.action.push( wait);
    }



    if(map_name=='INPUT')
    {

    io=document.getElementById("io_").value;
    status=document.getElementById("status_").value;
    console.log(status);
    wait = "WAIT " + io + " "+ status
    msg.action.push( wait);
    }
   

    if(map_name=='REQUEST')
    {
    wait= "WAIT " + "REQUEST"
    msg.action.push(wait);
    }


    var newRow = table.insertRow(table.length),
        cell1 = newRow.insertCell(0),
        cell2 = newRow.insertCell(1),
        cell3 = newRow.insertCell(2);
        cell4 = newRow.insertCell(3),
        cell5 = newRow.insertCell(4);

    cell1.innerHTML = "WAIT"  ;
    cell2.innerHTML =  wait.split(" ")[1]+" " + wait.split(" ")[2] ,
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


    if (index == "MOVE") {
        console.log("lol")
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


    if (index == "WAIT") {
        console.log(index)

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
    con = document.getElementById("select_condinate").value;
    console.log(con)
    //i = document.getElementById("select_condinate").selectedIndex;

    var move ="MOVE" + ' '+ con
    console.log(move)
    table.rows[rIndex].cells[1].innerHTML = con;
    delete msg.action[rIndex-1];
    msg.action[rIndex-1] = move;

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
    map_name = document.getElementById("wait").value;
    

    if(map_name=='TIME'){

        tem=document.getElementById("time").value;
        wait = 'TIME'+" "+tem 
    }


    if(map_name=='INPUT')
    {

    io=document.getElementById("io_").value;
    status=document.getElementById("status_").value;
    console.log(status);
    wait = io+" "+status
    }
   

    if(map_name=='REQUEST')
    {
        wait = map_name 
    }

    table.rows[rIndex].cells[1].innerHTML  =  wait;

    delete msg.action[rIndex - 1];
    msg.action[rIndex - 1] = 'WAIT'+" "+ wait;
    console.log(msg)

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


// recivce data from server 

ws.onmessage = function(evt) {
    console.log(evt.data)
    msg_tem = JSON.parse(evt.data)
    len=msg_tem.action.length

    if(msg_tem.action[len-1]=='LOOP'){
       var loop = document.getElementById("loop");
       loop.checked=true
       console.log("true ")
       msg_tem.action.pop();
       status_loop=true

    }
   

    
        msg = msg_tem
        len=msg_tem.action.length
        var i
        for (i = 0; i <len; i++) {
            var type=msg.action[i].split(" ")[0]
            console.log(type)

            if (type == "MOVE") {
                console.log("move")
                var newRow = table.insertRow(table.length),
                    cell1 = newRow.insertCell(0),
                    cell2 = newRow.insertCell(1),
                    cell3 = newRow.insertCell(2),
                    cell4 = newRow.insertCell(3),
                    cell5 = newRow.insertCell(4);
                cell1.innerHTML = msg.action[i].split(" ")[0];
                cell2.innerHTML = msg.action[i].split(" ")[1],
                    cell3.innerHTML = '',
                    cell4.innerHTML = '';
                cell5.innerHTML = '<div class="float-right" ><i  onclick="Delete()" class="fa fa-trash-o mr-2"></i><i  id="edit"  class="fa fa-pencil ml-1"></i> </div>'
            }

           

            if (type == "WAIT") {
                var newRow = table.insertRow(table.length),
                    cell1 = newRow.insertCell(0),
                    cell2 = newRow.insertCell(1),
                    cell3 = newRow.insertCell(2);
                cell4 = newRow.insertCell(3),
                    cell5 = newRow.insertCell(4);

                    cell1.innerHTML = msg.action[i].split(" ")[0]  ;
                    cell2.innerHTML =  msg.action[i].split(" ")[1] + "  "+ msg.action[i].split(" ")[2] ,
                    cell3.innerHTML = '';
                cell4.innerHTML = '';
                cell5.innerHTML = '<div class="float-right" ><i  onclick="Delete()" class="fa fa-trash-o mr-2"></i><i  id="edit"  class="fa fa-pencil ml-1"></i> </div>'

            }


           

            if (type == "LOOP") {
                var newRow = table.insertRow(table.length),
                    cell1 = newRow.insertCell(0),
                    cell2 = newRow.insertCell(1),
                    cell3 = newRow.insertCell(2),
                    cell4 = newRow.insertCell(3),
                    cell5 = newRow.insertCell(4);
                cell1.innerHTML = msg.action[i].split(" ")[0];
                cell2.innerHTML = '',
                cell3.innerHTML = '';
                cell5.innerHTML = '<div class="float-right" ><i  onclick="Delete()" class="fa fa-trash-o mr-2"></i><i  id="edit"  class="fa fa-pencil ml-1"></i> </div>'
            }

        
        } 
    
    
    
    // load map 
        length_map = msg_tem.map.length;
        console.log(length_map)
        for (i = 0; i< length_map; i++) {
            name_map = msg_tem.map[i]
            $('#Chosse_Map').append(`<option value="${i}">   
            ${name_map}                                
            </option>`);
        }
  // load pose 

        document.getElementById("name_display").innerHTML=msg_tem.name_mission
        document.getElementById("name_display1").innerHTML=msg_tem.name_mission
        value=$("#Chosse_Map").val()
        length_pose=msg_tem.pose[value].length
        $( "#select_condinate option" ).remove();
        for (i = 0; i < length_pose; i++) {
            name_pose = msg_tem.pose[value][i] 
            console.log(name_pose)
            $('#select_condinate').append(`<option value="${name_pose}">   
            ${ name_pose}                                
            </option>`);
        }
  
}



$("#save_mission").click(function() {
    a = save_mission()
  
    if (a) {
        
        msg.command = "save_mission";
        console.log(msg)
        if(status_loop==false)
        {
            ws.send(JSON.stringify(msg))
            window.location = '/editmission'
        }
        else
        {
            len=msg.action.length
            msg.action[len]='LOOP'
            ws.send(JSON.stringify(msg))
            window.location = '/editmission'
        }
       
    }

});

$("#Chosse_Map").change(function() {

value=$("#Chosse_Map").val()
length_pose=msg_tem.pose[value].length
$( "#select_condinate option" ).remove();
for (i = 0; i < length_pose; i++) {
            name_pose = msg_tem.pose[value][i] 
            console.log(name_pose)
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

$("#con").hide();
$("#io").hide();

function wait1() {
var condition = document.getElementById("wait").value;
if (condition=="INPUT") {
    $("#con").show();
    $("#io").show();
    $("#time_").hide();
} else {
    $("#io").hide();
    $("#con").hide();
    $("#time_").show();
    
}


if(condition=="REQUEST")
{
 $("#time_").hide();
 $("#con").hide();
}

}

$("#loop").click(function() {
    var loop = document.getElementById("loop");
    if(loop.checked==true)
    {
       status_loop=true
    }
    else{
     status_loop=false
    }
    
    
})
