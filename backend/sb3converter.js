const AdmZip = require('adm-zip');
const fs = require("fs");
const fetch = require('node-fetch');
var JSZip = require("jszip");


const projectJSONBaseURL = "https://projects.scratch.mit.edu/"
const assetsBaseURL = "https://cdn.assets.scratch.mit.edu/internalapi/asset/"

var getProjectJSON = async function (projectID) {
    //console.log(projectJSONBaseURL + projectID)
    const req = await fetch(projectJSONBaseURL + projectID);
    return req.json()
}

var getAssets = async function (sb3Name) {

    //console.log(assetsBaseURL + sb3Name+"/get/")
    const req = await fetch(assetsBaseURL + sb3Name + "/get/");
    return req.buffer()

}



var convertFromFile = function (file) {
    //console.log("[CONVERTER] started converting " + projectID + " from FILE")
    var zip = new AdmZip(file);
    var zipEntries = zip.getEntries();
    var newZip = new AdmZip();
    var filemap = [{}, {}];
    var out;
    zipEntries.forEach(function (zipEntry) {
        var fileName = zipEntry.entryName;

        if (fileName == "project.json") {
            var fileContent = zip.readAsText(fileName)

            // out = parser.convert(JSON.parse(fileContent), filemap);
            out = undefined;
            return;
        }
    });
    var sb2project = JSON.stringify(out[0]);
    var fileref = out[1];
    zipEntries.forEach(function (zipEntry) {
        var fileName = zipEntry.entryName;
        if (fileName == "project.json") {
            newZip.addFile(fileName, Buffer.alloc(Buffer.from(sb2project).length, sb2project));
        } else {
            var fileContent = zip.readAsText(fileName)
            var newFileName = fileref[fileName];
            newZip.addFile(newFileName, zipEntry.getData());
        }
    });
    // console.log("[CONVERTER] finished converting " + projectID + " from FILE")
    return new Promise((resolve, reject) => {
        //newZip.writeZip("./test.sb2")
        resolve(newZip.toBuffer());
    });
}

var convertFromID = function (projectID) {
    return new Promise((resolve, reject) => {
        console.log("[CONVERTER] started converting " + projectID + " from ID")




        fs.readFile('./sb2/' + projectID + ".sb2", function (err, data) {
            if (err) {
                // throw err;
                var newZip = new JSZip();

                getProjectJSON(projectID).then(res => {

                    var filemap = parseMap(res.targets);
                    //console.log(JSON.stringify(res,null,2));

                    let outJSON = JSON.stringify(res).replace("â˜", "\u2601")

                    console.log(outJSON)
                    fs.writeFileSync("./sb2/" + projectID + "project.json", outJSON)



                    newZip.file("project.json", outJSON);

                    console.log(Object.keys(newZip.files))



                    Object.keys(filemap).forEach(sb3Name => {
                        // var sb2Name = filemap[element];


                        getAssets(sb3Name).then(asset => {
                            newZip.file(sb3Name, Buffer.alloc(Buffer.from(asset).length, asset));
                        }).then(function () {
                            if (Object.keys(filemap).length == Object.keys(newZip.files).length - 1) {
                                newZip.generateNodeStream({ type: 'nodebuffer', streamFiles: true })
                                    .pipe(fs.createWriteStream("./sb3/" + projectID + ".sb3"))
                                    .on('finish', function () {
                                        // JSZip generates a readable stream with a "end" event,
                                        // but is piped here in a writable stream which emits a "finish" event.
                                        console.log("out.zip written.");
                                    });

                                let findsb2 = setInterval(() => {
                                    var files = fs.readdirSync('./sb2/');
                                    // console.log(files)
                                    files.forEach(element => {
                                        if (element == projectID + ".sb2") {
                                            // console.log(projectID + ".sb2")
                                            fs.readFile('./sb2/' + projectID + ".sb2", function (err, data) {
                                                if (err) throw err;
                                                console.log(data.buffer);
                                                resolve(data.buffer);
                                            });
                                            clearInterval(findsb2);
                                        }
                                    });
                                }, 1000);


                                console.log("[CONVERTER] finished converting " + projectID + " from ID")
                            }
                        })
                    })
                })
                return
            }
            console.log("[CONVERTER] found converted project " + projectID)
            resolve(data.buffer);
        });





    });
}

function parseMap(targets) {
    var out = {};
    var costumeList = {};
    var soundList = {};
    targets.forEach(target => {
        target.costumes.forEach(costume => {
            if (costumeList[costume.assetId] == null)
                costumeList[costume.assetId] = Object.keys(costumeList).length;

            out[costume.md5ext] = costumeList[costume.assetId] + "." + costume.dataFormat;
        });

        target.sounds.forEach(sound => {
            if (soundList[sound.assetId] == null)
                soundList[sound.assetId] = Object.keys(soundList).length;

            out[sound.md5ext] = soundList[sound.assetId] + "." + sound.dataFormat;
        });
    });
    return out;
}

module.exports = { convertFromFile, convertFromID, getProjectJSON, getAssets, parseMap };