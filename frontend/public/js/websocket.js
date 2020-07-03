var socket = io.connect(window.location.hostname + ':8082');


function setupWebsocket() {

    socket.on("sendSB2file", function (data) {
        console.log("testttt")
        console.log(data)

        var blob = new Blob([data]);

        var request = P.IO.loadSB2File(blob);

        if (request) {
            P.player.showProgress(request, function (stage) {
                stage.triggerGreenFlag();
                document.getElementById("sb3loading").innerHTML = ""
                document.getElementsByClassName("project-link")[0].href = "https://scratch.mit.edu/projects/" + document.location.href.split("/")[3].substring(1);
            })
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