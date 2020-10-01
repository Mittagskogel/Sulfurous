# USAGE

* You can use Sulfurous via the link: [Sulfurous](https://sulfurous.aau.at)
* If you want to host Sulfurous on your own server you can do that see tutorial below

# HowTo Host

Sulfurous is build and hosted with a microservcie architechture in mind. To host the microservices we use docker. We use a docker-compose file to start the microservices.

## Microservices

* sulfurous-frontend  
    This microservice hosts the webserver for the Suflurousplayer. It is a basic node.js express server. If you only start this service Sulfurous will run without cloud support and without scratch 3.0 compatibility.

* sulfurous-backend  
    This service is used for Sulfurous Cloud Variables it is a node.js application that uses websockets with the socket.io library. Furthermore it receive the SB3 IDs/files to convert to SB2. Also it sends the files to the converter service which does the conversion. After conversion the file is send back to the frontend to be displayed in the player.

* sulfurous-sb3tosb2  
    This is the converter service it is an python programm from [RexScratch](https://github.com/RexScratch/sb3tosb2) which convertes an SB3 file to an SB2 file. We have build a little bash script that checks a folder for SB3 files and if one is found the converter converts it and moves the SB3 file and the generated SB2 file in an other folder. The backend service takes the file and sends it back to the frondend.

## Requirements

The requirements to host Sulfurous on your own are:  

* docker
* docker-compose

|                   |FRONTEND|BACKEND|SB3TOSB2|
|-------------------|--------|-------|--------|
|Sulfurous SB2      |✔️      | ❌    |❌      |
|Sulfurous Cloud    |✔️      | ✔️    |❌      |
|Sulfurous SB3      |✔️      | ✔️    |✔️      |
|Sulfurous SB3+Cloud|✔️      | ✔️    |✔️      |

## How to run

In the "**start**" directory are 3 start files for windows and 3 for linux.
Just run the file that suites your needs refere to the table above

* startSulurousSB2 (.sh/.bat)  
    Sulfurous SB2

* startSulurousCloud (.sh/.bat)  
    Sulfurous Cloud

* startSulurousSB3 (.sh/.bat)  
    Sulfurous SB3  
    Sulfurous SB3+Cloud


