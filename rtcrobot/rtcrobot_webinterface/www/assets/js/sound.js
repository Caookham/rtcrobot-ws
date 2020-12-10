var ws = new WebSocket("ws://127.0.0.1:8888/name_mission");
var file_stop
var file_play
var audio_play=new Audio()
var newTr = `<tr>
<td>
    <i class='fas fa-volume-up' style='color: green;'></i>
</td>
<td>
</td>
<td>
</td>
<td>
</td>
<td>
</td>
<td>
<div class="container">

<div  ><i  class="fa fa-play"style="color: green;"></i></div>
<div  ><i  class="fa fa-headphones"></i></div>
<div ><i  class="fa fa-pencil"></i></div>
<div  ><i  class="fa fa-times-circle"></i></div>
</div> 
</td>                  
</tr>`;

table_setting = document.getElementById("table-sound");

ws.onopen = function (e) {
    var msg_requert = {
        command: "setting",
        name: []
    };
    ws.send(JSON.stringify(msg_requert));
}

ws.onmessage = function (evt) {
    data_recive = JSON.parse(evt.data)
    console.log(data_recive)
    leng_sound = data_recive.sound.length;
    for (i = 0; i < leng_sound; i++) {
        $(".talbe_sound").append(newTr)
        table_setting.rows[i+1].cells[1].innerHTML = data_recive.sound[i];
    }

}

$(".talbe_sound").on('click','td .fa-times-circle', function() {
    a = remove_mission()
    if (a) {
        var file_chosse = $(this).parent().parent().parent().parent().children()[1].innerHTML
        //..innerHTML
        console.log(file_chosse)

        var msg_remove_mission = {
            command: "remove_sound",
            name: file_chosse,
        };
       
        audio_play.pause();
        audio_play.currentTime = 0.0;
    
        ws.send(JSON.stringify(msg_remove_mission));
       // console.log(msg_remove_mission)
        //$(this).parent().parent().parent().parent().remove()
    } else {}

})

$(".talbe_sound").on('click','td .fa-play', function() {

  
        var file_chosse = $(this).parent().parent().parent().parent().children()[1].innerHTML
        //..innerHTML
        
        var msg_remove_mission = {
            command: "remove_sound",
            name: file_chosse,
        };
       

        audio_play.pause();
        audio_play.currentTime = 0.0;

        file_play='sound/'+file_chosse
        audio_play = new Audio(file_play);
        audio_play.play();
        ws.send(JSON.stringify(msg_remove_mission));
        
       // console.log(msg_remove_mission)
        //$(this).parent().parent().remove()

})

function remove_mission() {

    var result = confirm("Are you sure remove!");

    return result
}
