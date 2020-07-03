var socket = io.connect(window.location.hostname + ':8082');


function setupWebsocket() {

    socket.on("sendSB2file", function (data) {

        loadSP2FileFromSocket(data);


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