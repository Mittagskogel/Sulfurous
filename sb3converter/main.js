const parser = require("./parser.js");
const downloader = require("./downloader.js");

const util = require('util');
var AdmZip = require('adm-zip');

const fs = require("fs");
var https = require('https')
const express = require("express")

const bodyParser = require('body-parser');

const app = express();

// create application/json parser
var jsonParser = bodyParser.json()
 
// create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false })
 


app.post('/',jsonParser, (req, res) => {
    console.log(req.body)
    return res.send('Received a POST HTTP method');
    
  });


  https.createServer({
    key: fs.readFileSync('server.key'),
    cert: fs.readFileSync('server.cert')
  }, app)
  .listen(4000, function () {
    console.log('Example app listening on port 4000! Go to https://localhost:4000/')
  })



























var zip = new AdmZip('./test.sb3');
var zipEntries = zip.getEntries();















//convertFromFile()



function convertFromID(projectID) {
    let newZip = new AdmZip();

    downloader.getProjectJSON(projectID).then(res => {
        let filemap = [{}, {}];
        let out = parser.convert(res, filemap)

        Object.keys(out[1]).forEach(element => {
            let sb2Name = out[1][element] + "." + element.split(".")[1]
            let sb3Name = element

            downloader.getAssets(sb3Name).then(asset => {

                newZip.addFile(sb2Name, asset);

            }).then(ret => {

                newZip.writeZip(projectID + ".sb2")
                return
            });


        });

        newZip.addFile("project.json",JSON.stringify(out[0]));

    })



}


function convertFromFile() {
    var newZip = new AdmZip();
    //console.log(sb3projectjson.monitors[0]);
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



    //console.log(util.inspect(out.scripts, false, null, true /* enable colors */))


    zipEntries.forEach(function (zipEntry) {
        var fileName = zipEntry.entryName;
        //console.log("First "+fileName);
        if (fileName == "project.json") {
            newZip.addFile(fileName, Buffer.alloc(sb2project.length, sb2project));

        } else {

            var fileContent = zip.readAsText(fileName)

            //console.log(zipEntry.getData())

            var newFileName = fileref[fileName] + "." + fileName.split(".")[1];

            //console.log(newFileName);

            newZip.addFile(newFileName, zipEntry.getData());

        }
    });

    newZip.writeZip('test.sb2');  //write the new zip 

}
