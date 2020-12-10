var ws = new WebSocket('ws://' + window.location.hostname + ':8888/Dashboard');
var nameDash = {
    cmd: "chooseDash",
    name: "Default"
}
var deleteDash = {
    cmd: "deleteDash",
    name: "Default"
}
var chosenDash = {
    cmd: "chosenDash"
}
ws.onopen = function() {
    ws.send(JSON.stringify(chosenDash))
}
ws.onmessage = (function(event) {
    $('#' + event.data).addClass('list-group-item-success')
})
$('.list-group-item').on('click','.fa-check',function() {
    console.log($(this).parent().parent().parent()[0].id)

    //document.getElementsByClassName('fa-check').removeClass('active')
    if (( $(this).parent().parent().parent() ).hasClass('list-group-item-success')) {
        nameDash.name = "Default"
        ws.send(JSON.stringify(nameDash))
        $(this).parent().parent().parent().removeClass('list-group-item-success')
    } else {
        nameDash.name = $(this).parent().parent().parent()[0].id
        ws.send(JSON.stringify(nameDash))
        $(this).parent().parent().parent().addClass('list-group-item-success').siblings().removeClass('list-group-item-success');
    }
})


$('.list-group-item').on('click','.fa-trash-o',function() {
    $(this).parent().parent().parent().remove()

    deleteDash.name = $(this).parent().parent().parent()[0].id
        ws.send(JSON.stringify(deleteDash))

})

