var socket;

var projectData = undefined

function setupWebsocket(type) {

    if (type == "extern") {
        socket = io.connect("https://sulfurous.aau.at" + ':8082');
    } else if (type == "intern" || type == "app") {
        socket = io.connect(window.location.hostname + ':8082');
    }

    socket.on("getProjectDataReturn", function (data) {
        projectData = data.project_token
     //   console.log(data)
    });

    socket.on("sendSB2file", function (data) {

        if (type != "app") {
            loadSP2FileFromSocket(data);
        } else {
            loadFromSocket(data);
        }
    });

    socket.on("sendPackage", function (data) {
        console.log("tset")
        console.log(data)
        var zip = new JSZip(data);
        console.log(zip)
        var content = zip.generate({ type: "blob" });
        saveData(content, "OUTPUT.zip")
    })
}