var express = require('express');
var app = express();
var https = require('https');
var http = require('http');
var fs = require('fs');



var cloudSave = require("./cloud.js")
var sb3converter = require("./sb3converter.js")
var packager = require("./package.js")



if (process.env.ISSULFSERVER == "true") {
var files = fs.readdirSync('./ssl/');
        console.log(files)

    var server = https.createServer({ key: fs.readFileSync('./ssl/privkey.pem'), cert: fs.readFileSync('./ssl/cert.pem') ,
    requestCert: false,
    rejectUnauthorized: false}, app).listen(8082);
    console.log("RUNNING ON SULF SERVER")
} else {
    var server = http.createServer(app).listen(8082);
}

var io = require('socket.io').listen(server);

io.on('connection', function (socket) {
    socket.on('sendSB3file', function (data) {
        var file = sb3converter.convertFromFile(data).then(function (file) {
            socket.emit("sendSB2file", file);
        });
    });
    socket.on('sendSB3ID', function (data) {
        var file = sb3converter.convertFromID(data).then(function (file) {
            socket.emit("sendSB2file", file);
        })
    });
    socket.on('getReq', function (data) {
        cloudSave.getReq(data);
        console.log(cloudSave.CLOUDSAVE[data.projectID].vars)
        socket.emit('getRes', cloudSave.CLOUDSAVE[data.projectID].vars);
    });
    socket.on('getPackage', function (data) {
        console.log("packager")
        //console.log(data)
        var b64string = data;
        var buf = Buffer.from(b64string, 'base64'); 
        packager.generatePackage(buf, function (output) {
            console.log("done Converting")
            socket.emit('sendPackage', output);
        });

    });
});