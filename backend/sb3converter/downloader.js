const fetch = require('node-fetch');

const projectJSONBaseURL = "https://projects.scratch.mit.edu/"
const assetsBaseURL = "https://cdn.assets.scratch.mit.edu/internalapi/asset/"

exports.getProjectJSON = async function (projectID) {
    //console.log(projectJSONBaseURL + projectID)
    const req = await fetch(projectJSONBaseURL + projectID);
    return req.json()
}

exports.getAssets = async function(sb3Name){

    //console.log(assetsBaseURL + sb3Name+"/get/")
    const req = await fetch(assetsBaseURL + sb3Name+"/get/");
    return req.buffer()

}