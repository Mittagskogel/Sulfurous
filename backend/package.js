const fs = require("fs");
var JSZip = require("jszip");
var generatePackageFromZip = function (project,settings, callback) {
    var zip = new JSZip();
    fs.readFile("./SulfurousOffline.zip", function (err, data) {
        zip.loadAsync(data)
            .then(function (zip) {
                //console.log(zip)
                // you now have every files contained in the loaded zip

                zip.file("settings.json",JSON.stringify(settings))
                zip.file("project.sb2", project); // a promise of "Hello World\n"

                zip.generateAsync({ type: "arraybuffer" }).then(function (base64) {

                    callback(base64);
                });
            });
    })
}

const fetch = require('node-fetch');

var getProjectJSON = async function (projectID) {
    //console.log(projectJSONBaseURL + projectID)
    const req = await fetch("https://projects.scratch.mit.edu/internalapi/project/" + projectID + "/get");
    return req.json()
}

var getAsset = async function (md5) {
    //console.log(projectJSONBaseURL + projectID)
    const req = await fetch("https://cdn.assets.scratch.mit.edu/internalapi/asset/" + md5 + "/get");
    return req
}

var generatePackageFromID = function (id,settings, callback) {
    var zip = new JSZip();
    var project = new JSZip();
    fs.readFile("./SulfurousOffline.zip", function (err, data) {

        zip.loadAsync(data).then(async function (zip) {
            //console.log(zip)
            // you now have every files contained in the loaded zip


            getProjectJSON(id).then(async res => {

                // var filemap = parseMap(res.targets);
                console.log(id);
                let costumeId = 0;
                let soundId = 0;
                let totalAssets = 0;
                let assets = { sounds: [], costumes: [] }


                if (res.hasOwnProperty("costumes")) {
                    for (let index = 0; index < res.costumes.length; index++) {
                        var current = res.costumes[index];

                        current.baseLayerID = costumeId;
                        costumeId++;
                        totalAssets++;
                        assets.costumes.push(current);

                    }
                }
                if (res.hasOwnProperty("sounds")) {
                    for (let index = 0; index < res.sounds.length - 1; index++) {
                        var current = res.sounds[index];
                        current.soundID = soundId;
                        soundId++;
                        totalAssets++;
                        assets.sounds.push(current);
                    }
                }

                if (res.hasOwnProperty("children")) {
                    res.children.forEach(element => {
                        if (element.hasOwnProperty("costumes")) {
                            for (var i = 0; i < element.costumes.length; i++) {
                                var current = element.costumes[i];
                                current.baseLayerID = costumeId;
                                costumeId++;
                                totalAssets++;
                                assets.costumes.push(current);
                            }
                        }
                        if (element.hasOwnProperty("sounds")) {
                            for (var i = 0; i < element.sounds.length; i++) {
                                var current = element.sounds[i];
                                current.soundID = soundId;
                                soundId++;
                                totalAssets++;
                                assets.sounds.push(current);
                            }
                        }

                    });

                }



                for (let index = 0; index < assets.sounds.length; index++) {
                    const element = assets.sounds[index];
                    let data = await getAsset(element.md5)
                    project.file(element.soundID + "." + element.md5.split(".")[1], data.buffer());
                }
                for (let index = 0; index < assets.costumes.length; index++) {
                    const element = assets.costumes[index];
                    let data = await getAsset(element.baseLayerMD5)
                    project.file(element.baseLayerID + "." + element.baseLayerMD5.split(".")[1], data.buffer());
                }



                project.file("project.json", JSON.stringify(res));


                //  fs.writeFileSync("./sb2/" + projectID + "project.json", outJSON)
                //   newZip.addFile("project.json", Buffer.alloc(outJSON.length, outJSON));

            }).then(() => {

                project.generateAsync({ type: "arraybuffer" }).then(function (base64) {

                    //console.log("-------------------------------------------")
                    //console.log(base64)

                    zip.file("settings.json",JSON.stringify(settings))

                    zip.file("project.sb2", base64); // a promise of "Hello World\n"
                    // console.log(project)
                    zip.generateAsync({ type: "arraybuffer" }).then(function (base64) {
                        callback(base64);
                    });
                });


            })

        })
    })
}

module.exports = { generatePackageFromZip, generatePackageFromID }