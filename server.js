var express = require('express');
var app = express();
var https = require('https');
var http = require('http');
var fs = require('fs');



var cloudSave = require("./cloud.js")
var sb3converter = require("./sb3converter.js")


var app2 = express();
app2.listen(3000, () => console.log('listening at 3000'));
app2.use(express.static('.'));

if (__dirname == '/home/sulfurous/public_html') {
    var server = https.createServer({ key: fs.readFileSync('/etc/apache2/ssl/sulfurous_aau_at.key'), cert: fs.readFileSync('/etc/apache2/ssl/sulfurous_aau_at.crt') }, app).listen(8082);

} else {
    var server = http.createServer(app).listen(8082);
}

var io = require('socket.io').listen(server);

io.on('connection', function (socket) {
    socket.on('sendSB3file', function (data) {
        var file = sb3converter.convertFromFile(data)
        socket.emit("sendSB2file", file);
    });
    socket.on('sendSB3ID', function (data) {
        sb3converter.convertFromID(data).then(function(file){
            fs.writeFile("test.sb2",file,function(){})
            socket.emit("sendSB2file", file);
        })
    });
    socket.on('getReq', function (data) {
        cloudSave.getReq(data);
        socket.emit('getRes', cloudSave.CLOUDSAVE[data.projectID].vars);
    });
});

var stdin = process.openStdin();

stdin.addListener("data", function (d) {


});