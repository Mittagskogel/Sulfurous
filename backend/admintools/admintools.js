const fs = require("fs");

let logs;

var setupAdminTools = function (io) {

    console.log(__dirname)

    logs = JSON.parse(fs.readFileSync(__dirname + "/logs.json"))

    io = io.of('/admintools')
    io.on('connection', function (socket) {
        console.log("client connected")

        socket.on("getLogs", function () {

            calculateLogs()
            socket.emit("logs", {
                "lastHour": logs.requests.lastHour,
                "last24Hours": logs.requests.last24Hours,
                "last30Days": logs.requests.last30Days,
                "currentConnections": logs.currentConnections,
                "SB2IDs": logs.lastSB2IDs,
                "SB3IDs": logs.lastSB3IDs,
                "landingPageLoad": logs.landingPageLoad,
                "SB3Load": logs.SB3Load,
                "SB2Load": logs.SB2Load
            })
        })



    });



    calculateLogs()
    console.log(logs)

    console.log("ADMINTOOLS SCRIPT")
}


function calculateLogs() {
    console.log({ "lastHour": logs.requests.lastHour, "last24Hours": logs.requests.last24Hours, "last30Days": logs.requests.last30Days, "currentConnections": logs.currentConnections })
    logs.requests.lastHour = 0;
    logs.requests.last24Hours = 0;
    logs.requests.last30Days = 0;
    logs.lastSB2IDs = {};
    logs.lastSB3IDs = {};
    logs.landingPageLoad = 0;
    logs.SB2Load = 0;
    logs.SB3Load = 0;
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



        if (element.data.id != "none" && element.data.id.length < 8 || element.data.id.length > 9) {
            console.log("WRONG ID WRONG")
            console.log(element.data.id)
        } else {
            if (element.data.version == 2) {

                if (logs.lastSB2IDs[element.data.id] == undefined) {
                    logs.lastSB2IDs[element.data.id] = 1
                } else {
                    logs.lastSB2IDs[element.data.id]++;
                }
                logs.SB2Load++;
            } else if (element.data.version == 3) {

                if (logs.lastSB3IDs[element.data.id] == undefined) {
                    logs.lastSB3IDs[element.data.id] = 1
                } else {
                    logs.lastSB3IDs[element.data.id]++;
                }
                logs.SB3Load++;
            } else {
                logs.landingPageLoad++;
            }
        }

    });

}


var setCurrentConnections = function (data) {
    logs.currentConnections = data;
}

var logRequest = function (data) {
    console.log("log ------")
    logs.requests.all.push({ "data": data, "timestamp": new Date() })


    calculateLogs();

}

setInterval(() => {

    fs.writeFileSync(__dirname + "/logs.json", JSON.stringify(logs))
}, 10000);

module.exports = { setupAdminTools, logRequest, setCurrentConnections }