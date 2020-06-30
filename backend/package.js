const fs = require("fs");
var JSZip = require("jszip");
var generatePackage = function (project, callback) {
    var zip = new JSZip();
    fs.readFile("./SulfurousOffline.zip", function (err, data) {
        zip.loadAsync(data)
            .then(function (zip) {
                //console.log(zip)
                // you now have every files contained in the loaded zip
                zip.file("project.sb2", project); // a promise of "Hello World\n"

                zip.generateAsync({ type: "arraybuffer" }).then(function (base64) {

                    callback(base64);
                });
                zip
                    .generateNodeStream({ type: 'nodebuffer', streamFiles: true })
                    .pipe(fs.createWriteStream('out.zip'))
                    .on('finish', function () {
                        // JSZip generates a readable stream with a "end" event,
                        // but is piped here in a writable stream which emits a "finish" event.
                        console.log("out.zip written.");
                    });

            });

    })
}
/*
fs.readFile("project.sb2", function (error, data) {
    console.log(data)
    generatePackage(data, function (output) {
        

      
    })
})
*/
module.exports = { generatePackage }