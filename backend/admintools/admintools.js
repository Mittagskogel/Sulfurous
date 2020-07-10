const fs = require("fs");

let logs;

var setupAdminTools = function (io) {

    console.log(__dirname)

    logs = JSON.parse(fs.readFileSync(__dirname + "/logs.json"))

    io = io.of('/admintools')
    io.on('connection', function (socket) {
        console.log("client connected")

        socket.on("getLogs", function () {

            calculateConnectionNumbers()
            socket.emit("logs", { "lastHour": logs.requests.lastHour, "last24Hours": logs.requests.last24Hours, "last30Days": logs.requests.last30Days, "currentConnections": logs.currentConnections })
        })



    });



    calculateConnectionNumbers()
    console.log(logs)

    console.log("ADMINTOOLS SCRIPT")
}


function calculateConnectionNumbers() {
    console.log({ "lastHour": logs.requests.lastHour, "last24Hours": logs.requests.last24Hours, "last30Days": logs.requests.last30Days, "currentConnections": logs.currentConnections })
    logs.requests.lastHour = 0;
    logs.requests.last24Hours = 0;
    logs.requests.last30Days = 0;
    logs.requests.all.forEach(element => {
        //  console.log(element)
        //console.log(new Date(element.timestamp).getTime() + "  " + (new Date().getTime() + (3600 * 1000)) + "  " + (new Date() - new Date(element.timestamp).getTime()))

        if ((new Date() - new Date(element.timestamp).getTime()) < (3600 * 1000)) {
            logs.requests.lastHour++;
        }
        if ((new Date() - new Date(element.timestamp).getTime()) < (3600 * 1000 * 24)) {
            logs.requests.last24Hours++;
        }
        if ((new Date() - new Date(element.timestamp).getTime()) < (3600 * 1000 * 24 * 30)) {
            logs.requests.last30Days++;
        }
    });

}


var setCurrentConnections = function (data) {
    logs.currentConnections = data;
}

var logRequest = function (data) {
    console.log("log ------")
    logs.requests.all.push({ "data": data, "timestamp": new Date() })


    calculateConnectionNumbers();

}

setInterval(() => {

    fs.writeFileSync(__dirname + "/logs.json", JSON.stringify(logs))
}, 10000);

module.exports = { setupAdminTools, logRequest, setCurrentConnections }