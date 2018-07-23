var express = require('express');
var app = express();
var  https = require('https');
var  http = require('http');
var fs = require('fs');

 if(__dirname == '/home/sulfurous/public_html/cloudSave'){
	 var server = https.createServer({key: fs.readFileSync('/etc/apache2/ssl/sulfurous_aau_at.key'),cert: fs.readFileSync('/etc/apache2/ssl/sulfurous_aau_at.crt')},app).listen(8082);

 }else{
	  var server = http.createServer(app).listen(8082);
 }

var io = require('socket.io').listen(server);

var CLOUDSAVE = {};

console.log('started');

var stdin = process.openStdin();

stdin.addListener("data", function(d) {

	console.log(CLOUDSAVE[Object.keys(CLOUDSAVE)[0]]);
	
  });

  setInterval(function(){

	for(var i = 0;i < Object.keys(CLOUDSAVE).length;i++){
	
			console.log(CLOUDSAVE[Object.keys(CLOUDSAVE)[i]].vars);
			
			console.log(JSON.stringify(CLOUDSAVE[Object.keys(CLOUDSAVE)[i]].vars));

			delete CLOUDSAVE[Object.keys(CLOUDSAVE)[i]].ttl;
			fs.writeFile('data/'+Object.keys(CLOUDSAVE)[i]+'.json', JSON.stringify(CLOUDSAVE[Object.keys(CLOUDSAVE)[i]]), function(err) {
			if(err) {
			return console.log(err);
			}

			console.log("The file was saved!");
			}); 
			
		}
	
  }, 10000);
  
  setInterval(function(){

	for(var i = 0;i < Object.keys(CLOUDSAVE).length;i++){
	
		CLOUDSAVE[Object.keys(CLOUDSAVE)[i]].ttl -= 1;
		if(CLOUDSAVE[Object.keys(CLOUDSAVE)[i]].ttl == 0){
			
			console.log(CLOUDSAVE[Object.keys(CLOUDSAVE)[i]].vars);
			
			console.log(JSON.stringify(CLOUDSAVE[Object.keys(CLOUDSAVE)[i]].vars));
			
			
			delete CLOUDSAVE[Object.keys(CLOUDSAVE)[i]].ttl;
			fs.writeFile('data/'+Object.keys(CLOUDSAVE)[i]+'.json', JSON.stringify(CLOUDSAVE[Object.keys(CLOUDSAVE)[i]]), function(err) {
			delete CLOUDSAVE[Object.keys(CLOUDSAVE)[i]];
			if(err) {
			return console.log(err);
			}

			console.log("The file was saved!");
			}); 
			
		}
	}

  }, 1000);

  var loadJSON = function(projectID){
	  
	  console.log("loadJSON");
	  
	  try{
		   var content = fs.readFileSync('data/'+projectID+'.json');
		  CLOUDSAVE[projectID] = JSON.parse(content);
		 
	  }catch(err){
		  CLOUDSAVE[projectID] = {"vars":{}};
 
		  fs.writeFile('data/'+projectID+'.json', JSON.stringify(CLOUDSAVE[projectID]), function(err) {
			if(err) {
			return console.log(err);
			}

			console.log("The file was saved!");
			}); 
	  }

  }
  
io.on('connection', function (socket) {

   socket.on('getReq', function (data) {
	
		if(typeof CLOUDSAVE[data.projectID] == 'undefined'){
			
			loadJSON(data.projectID);
			
		}

				if(typeof Object.keys(data.sulfCloudVarsChanged)[0] != 'undefined' ){
					
					for(var i = 0;i<Object.keys(data.sulfCloudVarsChanged).length;i++){
						//console.log(Object.keys(data.sulfCloudVarsChanged)[i]);
	
						CLOUDSAVE[data.projectID].vars[Object.keys(data.sulfCloudVarsChanged)[i]] = data.sulfCloudVarsChanged[Object.keys(data.sulfCloudVarsChanged)[i]];
	
					}
	
				}
	
					CLOUDSAVE[data.projectID].ttl = 10;
		
		socket.emit('getRes', CLOUDSAVE[data.projectID].vars );
	
  });
  
});