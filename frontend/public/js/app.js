var splash = document.querySelector('.splash');
var progressBar = document.querySelector('.progress-bar');
var error = document.querySelector('.error');
var bugLink = document.querySelector('#bug-link');
var webGLError = document.querySelector('.webgl-error');
var legacyLink = document.querySelector('#legacy-link');
var player = document.querySelector('.player');

var stage;

var projectId = 17088932;
var projectTitle = '';
var turbo = false;
var fullScreen = true;
var aspectX = 4;
var aspectY = 3;
var resolutionX = 480;
var resolutionY = 360;
let isPackage = false;

(function () {
    'use strict';


    setupWebsocket("app")






    /*
    if (location.protocol === 'https:') {
      location.replace(('' + location).replace(/^https:/, 'https:'));
    }
    */



    var params = location.search.substr(1).split('&');
    params.forEach(function (p) {
        var parts = p.split('=');
        if (parts.length > 1) {
            switch (parts[0]) {
                case 'id':
                    if (parts[1] == "zip") {
                        isPackage = true;
                    }
                    projectId = Number(parts[1]);
                    break;
                case 'turbo':
                    turbo = parts[1] !== 'false';
                    break;
                case 'full-screen':
                    fullScreen = parts[1] !== 'false';
                    break;
                case 'aspect-x':
                    aspectX = Number(parts[1]);
                    break;
                case 'aspect-y':
                    aspectY = Number(parts[1]);
                    break;
                case 'resolution-x':
                    resolutionX = Number(parts[1]);
                    break;
                case 'resolution-y':
                    resolutionY = Number(parts[1]);
                    break;
                default:
                    console.log('Skipping unknown option: ' + parts[0] + '=' + parts[1]);
            }
        }
    });

    P.resolution = resolutionX;





    function mobileFullScreen(e) {
        if (e) e.preventDefault();
        document.documentElement.classList.toggle('fs');

        if (!e) {
            var el = document.documentElement;
            if (el.requestFullScreenWithKeys) {
                el.requestFullScreenWithKeys();
            } else if (el.webkitRequestFullScreen) {
                el.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
            } else if (el.mozRequestFullScreen) {
                el.mozRequestFullScreen();
            } else {
                console.warn('No full screen available.');
            }
        }
        updateFullScreen();
    }

    function updateFullScreen() {
        if (!stage) return;

        resolutionX = !resolutionX ? 480 : resolutionX;
        resolutionY = !resolutionY ? 360 : resolutionY;

        window.scrollTo(0, 0);
        var padding = 8;
        var w = window.innerWidth - padding * 2;
        var h = window.innerHeight - padding;
        w = Math.min(w, h * resolutionX / resolutionY);
        h = w * resolutionY / resolutionX;
        document.body.style.width = w + 'px';
        document.body.style.height = h + 'px';
        document.body.style.marginLeft = (window.innerWidth - w) / 2 + 'px';
        document.body.style.marginTop = (window.innerHeight - h + padding) / 2 + 'px';
        stage.setZoom(w / 480, w * resolutionY / resolutionX / 360);
    }


    if (P.hasTouchEvents) {
        window.addEventListener('load', function () {
            document.getElementById('fullscreenWarning').textContent = 'On mobile browsers, use two finger tap in portrait orientation and turn to landscape orientation for full screen.';
        });

        document.addEventListener('touchstart', function (e) {
            if (e.targetTouches.length >= 2)
                mobileFullScreen(e);
        });
    }



    window.addEventListener('resize', layout);

    if (P.hasTouchEvents) {
        document.addEventListener('touchmove', function (e) {
            e.preventDefault();
        });
    }





    load(projectId)
}());

function layout() {
    if (!stage) return;
    var w = Math.min(window.innerWidth, window.innerHeight * aspectX / aspectY);
    if (!fullScreen) w = resolutionX;
    var h = w * aspectY / aspectX;
    if (!fullScreen) h = resolutionY;
    player.style.left = (window.innerWidth - w) / 2 + 'px';
    player.style.top = (window.innerHeight - h) / 2 + 'px';
    stage.setZoom(w / 480, h / 360);
    stage.draw();
}

function showError(e) {
    error.style.display = 'table';
    bugLink.href = 'https://github.com/mittagskogel/sulfurous/issues/new?title=' + encodeURIComponent(projectTitle || '') + '&body=' + encodeURIComponent('\n\n\nhttps://scratch.mit.edu/projects/' + projectId + '\nhttps://newton.nes.aau.at/~sulfurous/#' + projectId + (e.stack ? '\n\n```\n' + e.stack + '\n```' : ''));
    console.error(e.stack);
}

function showWebGLError(e) {
    webGLError.style.display = 'table';
    legacyLink.href = location;
    legacyLink.href = legacyLink.href.replace('html', 'legacy/html');
    console.error(e);
}

function isSB2(id) {

    return new Promise(function (resolve, reject) {
        fetch('https://api.scratch.mit.edu/projects/' + id)
            .then(function (response) {
                console.log(response.data)
                if (response.status == 200) {

                    resolve(true);
                } else if (response.status == 404) {

                    resolve(false);
                }
            })
    })


}

async function load(id) {

    if (isPackage) {

        fetch("../project.sb2").then(async (res) => {

            var request = P.IO.loadSB2File(await res.blob());

            request.onload = function (s) {
                splash.style.display = 'none';

                stage = s;
                layout();

                stage.isTurbo = turbo;
                stage.start();
                stage.triggerGreenFlag();

                player.appendChild(stage.root);
                stage.focus();
                stage.handleError = showError;
            };
            request.onerror = showError;
            request.onprogress = function (e) {
                progressBar.style.width = (10 + e.loaded / e.total * 90) + '%';
            };




        })


    } else if (await isSB2(id)) {
        console.log("SB2")
        var request = P.IO.loadScratchr2Project(id,"1684772801_cf64050c1a5873f0d68cb963441f00573cbe50614c0fb42a6825c05d08a7722e8621b47d770595f5da55c90c3267942f136b2ea2a6a227a4f5ab97b9a1f6affc");

        request.onload = function (s) {
            splash.style.display = 'none';

            stage = s;
            layout();

            stage.isTurbo = turbo;
            stage.start();
            stage.triggerGreenFlag();

            player.appendChild(stage.root);
            stage.focus();
            stage.handleError = showError;
        };
        request.onerror = showError;
        request.onprogress = function (e) {
            progressBar.style.width = (10 + e.loaded / e.total * 90) + '%';
        };
    } else {
        console.log("SB3")
        socket.emit("sendSB3ID", id);
    }
}







function loadFromSocket(data) {

    console.log(data)

    var blob = new Blob([data]);

    var request = P.IO.loadSB2File(blob);

    request.onload = function (s) {
        splash.style.display = 'none';

        stage = s;
        layout();

        stage.isTurbo = turbo;
        stage.start();
        stage.triggerGreenFlag();

        player.appendChild(stage.root);
        stage.focus();
        stage.handleError = showError;
    };
    request.onerror = showError;
    request.onprogress = function (e) {
        progressBar.style.width = (10 + e.loaded / e.total * 90) + '%';
    };
}