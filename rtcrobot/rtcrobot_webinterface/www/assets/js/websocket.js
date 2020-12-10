var ws = new WebSocket("ws://"+window.location.hostname+":8888/ws");
var mapname_ = ''
/////////////////////////////////////////////////////////////
savemap_cmd_ = {
    command: "CMD_SAVEMAP",
    mapname: "KShop"
}

delmap_cmd_ = {
    command: "CMD_DELMAP",
    mapname: "map"
}

activemap_cmd_ = {
    command: "CMD_ACTIVEMAP",
    mapname: "map"
}
////////////////////////////////////////////////////////////
msg_cmd_ = {
    name : "COMMAND",
    command: []
}
ws.onopen = function() {
   //ws.send("Hello, world");
   //msg_cmd_.command.push(savemap_cmd_)
   //msg_cmd_.command.push(activemap_cmd_)
   //ws.send(JSON.stringify(msg_cmd_))

};
ws.onmessage = function (evt) {
   alert(evt.data);
};

///////////////////////////////////////////////////////////////
// function savemap(mapnane){
//     savemap_cmd_.mapname = mapnane
//     console.log(savemap_cmd_)
//     msg_cmd_.command = []
//     msg_cmd_.command.push(savemap_cmd_)
//     ws.send(JSON.stringify(msg_cmd_))
// }

function deletemap(mapname){
    delmap_cmd_.mapname = mapname
    msg_cmd_.command = []
    msg_cmd_.command.push(delmap_cmd_)
    ws.send(JSON.stringify(msg_cmd_))
}

function delmap_submit()
{
    delmap_cmd_.mapname = mapname_
    msg_cmd_.command = []
    msg_cmd_.command.push(delmap_cmd_)
    ws.send(JSON.stringify(msg_cmd_))
}

function set_mapname(name)
{
    mapname_ = name
}


////////////////////////////////////////////////////////////////
$('#dataTable').on('click', '.btn-delete', function(event) {
    set_mapname($(this).closest('tr')[0].cells[0].innerText)
  });