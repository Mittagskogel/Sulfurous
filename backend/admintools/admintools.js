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




    console.log(logs)

    console.log("ADMINTOOLS SCRIPT")
}


function calculateConnectionNumbers() {
    logs.requests.lastHour = 0;
    logs.requests.last24Hours = 0;
    logs.requests.last30Days = 0;
    logs.requests.all.forEach(element => {
        // console.log(element)
        if (element.timestamp > (new Date() - 3600 * 10000)) {
            logs.requests.lastHour++;
        }
        if (element.timestamp > (new Date() - 3600 * 10000 * 24)) {
            logs.requests.last24Hours++;
        }
        if (element.timestamp > (new Date() - 3600 * 10000 * 24 * 30)) {
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