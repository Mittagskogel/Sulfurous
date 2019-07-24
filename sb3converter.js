const AdmZip = require('adm-zip');
const parser = require("./sb3converter/parser.js");
const downloader = require("./sb3converter/downloader.js")

var convertFromFile = function (file) {
    console.log("[CONVERTER] started converting " + projectID + " from FILE")
    var zip = new AdmZip(file);
    var zipEntries = zip.getEntries();
    var newZip = new AdmZip();
    var filemap = [{}, {}];
    var out;
    zipEntries.forEach(function (zipEntry) {
        var fileName = zipEntry.entryName;

        if (fileName == "project.json") {
            var fileContent = zip.readAsText(fileName)

            out = parser.convert(JSON.parse(fileContent), filemap);
            return;
        }
    });
    var sb2project = JSON.stringify(out[0]);
    var fileref = out[1];
    zipEntries.forEach(function (zipEntry) {
        var fileName = zipEntry.entryName;
        if (fileName == "project.json") {
            newZip.addFile(fileName, Buffer.alloc(sb2project.length, sb2project));
        } else {
            var fileContent = zip.readAsText(fileName)
            var newFileName = fileref[fileName];
            newZip.addFile(newFileName, zipEntry.getData());
        }
    });
    console.log("[CONVERTER] finished converting " + projectID + " from FILE")
    return new Promise((resolve, reject) => {
        //newZip.writeZip("./test.sb2")
        resolve(newZip.toBuffer());
    });
}

var convertFromID = function (projectID) {
    console.log("[CONVERTER] started converting " + projectID + " from ID")
    let newZip = new AdmZip();
    return new Promise((resolve, reject) => {
        downloader.getProjectJSON(projectID).then(res => {
            let filemap = [{}, {}];
            let out = parser.convert(res, filemap)
            newZip.addFile("project.json", JSON.stringify(out[0]));
            Object.keys(out[1]).forEach(element => {
                let sb2Name = out[1][element]
                let sb3Name = element
                downloader.getAssets(sb3Name).then(asset => {
                    newZip.addFile(sb2Name, asset);
                }).then(function () {
                    if (element == Object.keys(out[1])[Object.keys(out[1]).length - 1]) {
                        resolve(newZip.toBuffer())
                        console.log("[CONVERTER] finished converting " + projectID + " from ID")
                    }
                })
            })
        })
    });
}

module.exports = { convertFromFile, convertFromID };