var ws = new WebSocket('ws://' + window.location.hostname + ':8888/Dashboard');
var pointer;
var count = 0;
var serializedData = [
    { x: 0, y: 0, width: 2, height: 2, id: '0', name: "kien" }
];
var dataFile = {
    cmd: "saveDash",
    name: "",
    data: {}
}

var grid = GridStack.init({
    alwaysShowResizeHandle: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
    ),
    removable: '#trash',
    removeTimeout: 100,
    float: true
});

grid.on('added removed change', function(e, items) {
    var str = '';
    items.forEach(function(item) {
        str += ' (x,y)=' + item.x + ',' + item.y;
    });
    console.log(e.type + ' ' + items.length + ' items:' + str);

});

addWidget()

function addWidget() {
    var n = {
        x: Math.round(12 * Math.random()),
        y: Math.round(5 * Math.random()),
        width: Math.round(1 + 3 * Math.random()),
        height: Math.round(1 + 3 * Math.random()),
        id: count,

    };

    var el = '<div><div class="grid-stack-item-content">' +
        count++ + (n.text ? n.text : '') + '<br><span>Empty Name</span><br><span>Empty Type</span></div></div>';
    grid.addWidget(el, n);

};

saveGrid = function() {
    serializedData = [];
    grid.engine.nodes.forEach(function(node) {
        var str = $(node.el).attr('data-gs-name')
        console.log(str)
        var rep = str.replace(/ /gi, "-")
        console.log(rep)
        serializedData.push({
            x: node.x,
            y: node.y,
            width: node.width,
            height: node.height,
            id: node.id,
            name: ($(node.el).attr('data-gs-name')).replace(/ /gi, "-"),
            type: $(node.el).attr('data-gs-type')
        });
    });
    dataFile.name = document.getElementById("name-input").value
    dataFile.data = serializedData
    ws.send(JSON.stringify(dataFile));
    document.querySelector('#saved-data').value = JSON.stringify(dataFile, null, '  ');
    console.log(serializedData)
};

grid.on('click', function(e, items) {
    if ($(e.target).hasClass('grid-stack-item-content')) {
        $(e.target).parent().addClass('grid-active').siblings().removeClass('grid-active');
        pointer = e;
    } else {
        $('.grid-stack-item').removeClass('grid-active')
    }
})

$('.btn-group .dropdown-menu .dropdown-item').click(function() {
    if (pointer != undefined) {
        $(pointer.target)[0].children[1].textContent = this.text //name
        $(pointer.target)[0].children[3].textContent = $(this).parent().siblings()[0].textContent //type
        var node = {
            name: this.text,
            type: $(this).parent().siblings()[0].textContent
        }
        grid.adjAttr($(pointer.target).parent(), node)
    }

})