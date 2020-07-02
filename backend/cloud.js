var fs = require('fs');

var autoSaveInterval = 100000
var ttlInterval = 1000

var CLOUDSAVE = {}

var loadJSON = function (projectID) {

    console.log("[CLOUD] loading JSON for " + projectID);

    try {
        var content = fs.readFileSync('./cloudSave/' + projectID + '.json');
        CLOUDSAVE[projectID] = JSON.parse(content);
        console.log("[CLOUD] DONE loading JSON for " + projectID);
    } catch (err) {

        CLOUDSAVE[projectID] = { "vars": {} };
        createProjectJSON(projectID, CLOUDSAVE[projectID])
        console.log("[CLOUD] DONE loading JSON for " + projectID);
    }

}

var getReq = function (data) {

    data.sulfCloudVarsChanged = data.sulfCloudVars;

    delete data.sulfCloudVars

    if (data.sulfCloudVarsChanged == undefined) {
        return
    }

    if (typeof CLOUDSAVE[data.projectID] == 'undefined') {

        loadJSON(data.projectID);

    }

    if (typeof Object.keys(data.sulfCloudVarsChanged)[0] != 'undefined') {

        console.log("got request")
        console.log(data)
        for (var i = 0; i < Object.keys(data.sulfCloudVarsChanged).length; i++) {
            //console.log(Object.keys(data.sulfCloudVarsChanged)[i]);

            CLOUDSAVE[data.projectID].vars[Object.keys(data.sulfCloudVarsChanged)[i]] = data.sulfCloudVarsChanged[Object.keys(data.sulfCloudVarsChanged)[i]];

        }

    }

    CLOUDSAVE[data.projectID].ttl = 10;
}


setInterval(async function () {
    console.log("[CLOUD] Auto saving");
    Object.keys(CLOUDSAVE).forEach(element => {
        saveProjectJSON(element);
    });

}, autoSaveInterval);

setInterval(function () {
    Object.keys(CLOUDSAVE).forEach(element => {
        CLOUDSAVE[element].ttl -= 1;
        if (CLOUDSAVE[element].ttl == 0) {

            saveProjectJSON(element, true);
            console.log("[CLOUD] deleted project JSON from RAM for " + element);
        }
    });
}, ttlInterval);

function saveProjectJSON(projectID, delFlag) {
    var tempTTL = CLOUDSAVE[projectID].ttl;
    delete CLOUDSAVE[projectID].ttl;
    fs.writeFile('./cloudSave/' + projectID + '.json', JSON.stringify(CLOUDSAVE[projectID]), function (err) {
        if (err) {
            return console.log(err);
        }
        if (delFlag) {
            delete CLOUDSAVE[projectID];
        } else {
            CLOUDSAVE[projectID].ttl = tempTTL;
        }
        console.log("[CLOUD] project file saved for " + projectID);
    });
}


function createProjectJSON(projectID, data) {

    fs.writeFile('./cloudSave/' + projectID + '.json', JSON.stringify(data), function (err) {
        if (err) {
            return console.log(err);
        }

        console.log("[CLOUD] Created project file for " + projectID);
    });

}



module.exports = { CLOUDSAVE, getReq };