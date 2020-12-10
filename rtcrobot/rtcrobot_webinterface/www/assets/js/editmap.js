
/*var viewer = MAPTOOL.Viewer({
    divID: 'viewer',
    width: 2048,
    height: 2048
})*/

/*var eraser_size_ = 5
window.onload = function() {
    var cvs_navigationlayer = document.getElementById("cvs_navigationlayer");
    var ctx_navigationlayer = cvs_navigationlayer.getContext("2d");
    navigation = new Image() 
 
    navigation.onload = function() {
        cvs_navigationlayer.width = navigation.width
        cvs_navigationlayer.height = navigation.height
        ctx_navigationlayer.drawImage(navigation,0,0);
    };

    
    navigation.src = './assets/img/maps/editting/navigation.png'

    var cvs_walllayer = document.getElementById("cvs_walllayer");
    var ctx_walllayer = cvs_walllayer.getContext("2d");
    wall = new Image()
    wall.onload = function() {
        cvs_walllayer.width = wall.width
        cvs_walllayer.height = wall.height
        ctx_walllayer.globalAlpha = .5
        ctx_walllayer.drawImage(wall,0,0);
    };
    wall.src = './assets/img/maps/editting/wall.png'


        // Center planet
    var center = cvs_navigationlayer.display.ellipse({
        x: canvas.width / 2, y: canvas.height / 2,
        radius: canvas.width / 20,
        fill: "#fff"
    }).add();
  }


////////////////////////////////////////////////////////////////////
$('#slt-layertype').change(function()
{
    $( "select option:selected" ).each(function() {
        console.log( $( this ).text() + " ")
        switch($(this).text())
        {
            case "Wall": 
                break;
            default:
                break;
        }
      });
    
});
////////////////////////////////////////////////////////////////////
document.getElementById("cvs_navigationlayer").addEventListener('mousedown', (event) => {
    var cvs_navigationlayer = document.getElementById("cvs_navigationlayer");
    var ctx_navigationlayer = cvs_navigationlayer.getContext("2d");
    var imageData = ctx_navigationlayer.getImageData(event.offsetX - eraser_size_/2, event.offsetY - eraser_size_/2, eraser_size_, eraser_size_);
        var data = imageData.data;
        console.log(imageData)
        for (i = 0; i< imageData.data.length; i+=4)
        {
            if(imageData.data[i] == 0)
            {
                imageData.data[i] = 254;
                imageData.data[i+1] = 254;
                imageData.data[i+2] = 254;
            }
        }
        ctx_navigationlayer.putImageData(imageData,event.offsetX - eraser_size_/2,event.offsetY - eraser_size_/2)
        console.log(data)
        //ctx_navigationlayer.fillRect(event.offsetX,event.offsetY,3,3); // fill in the pixel at (10,10)
        // iterate over all pixels
        var path = pathProto.clone({
            radius: 10,
            x: 0, y: 0,
            strokeColor: "#107B99"
        });

        cvs_navigationlayer.addchi
    })
*/
    
////////////////////////////////////////////////////////////////////