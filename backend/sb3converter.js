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
    console.log(file)
    return new Promise((resolve, reject) => {
        //console.log("[CONVERTER] started converting " + projectID + " from FILE")
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
                        //   console.log(data.buffer);
                        resolve(data.buffer);
                    });
                    clearInterval(findsb2);
                }
            });
        }, 1000);



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


                    let outJSON = JSON.stringify(res).replace("â˜", "\u2601")


                    fs.writeFileSync("./sb2/" + projectID + "project.json", outJSON)



                    newZip.file("project.json", outJSON);





                    Object.keys(filemap).forEach(sb3Name => {

                        getAssets(sb3Name).then(asset => {
                            newZip.file(sb3Name, asset);

                        }).then(function () {
                            if (Object.keys(filemap).length == Object.keys(newZip.files).length - 1) {
                                // console.log(newZip)
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
                                                //   console.log(data.buffer);
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

            if (costume.md5ext == undefined) {
                out[costume.assetId + "." + costume.dataFormat] = costumeList[costume.assetId] + "." + costume.dataFormat;
            } else {
                out[costume.md5ext] = costumeList[costume.assetId] + "." + costume.dataFormat;
            }

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