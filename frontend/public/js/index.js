(function () {
    'use strict';

    setupWebsocket()

    var qrcode = new QRCode("qrcode");

    var prefix = 'https://scratch.mit.edu/projects/';

    var initialId = location.hash.substr(1);
    if (initialId === 'zip') initialId = '';

    var titleArea = document.querySelector('#title-area');
    var playerArea = document.querySelector('#player-area');
    var projectArea = document.querySelector('#project-area');

    playerArea.style.height = projectArea.style.height = 'auto';
    var titleAreaHeight = titleArea.offsetHeight;
    var playerAreaHeight = playerArea.offsetHeight;
    var projectAreaHeight = projectArea.offsetHeight;
    playerArea.style.height = projectArea.style.height = 0;

    var examples = document.querySelector('#examples');
    var urlInput = document.querySelector('.url');
    urlInput.value = prefix + initialId;

    var progressBar = document.querySelector('.progress-bar');
    var player = document.querySelector('.player');
    var projectLink = document.querySelector('.project-link');
    var bugLink = document.querySelector('#bug-link');

    /**********   Package   **********/
    var packageLink = document.querySelector('#package-link');
    var packageTurbo = document.querySelector('#package-turbo');

    var packageFullScreen = document.querySelector('#package-full-screen');
    var packageFullScreenAspectRatio = document.querySelector('#package-full-screen-aspect-ratio');
    var packageAspectRatioX = document.querySelector('#package-aspect-ratio-x');
    var packageAspectRatioY = document.querySelector('#package-aspect-ratio-y');

    var packageStandardResolution = document.querySelector('#package-standard-resolution');
    var packageDoubleResolution = document.querySelector('#package-double-resolution');
    var packageCustomResolution = document.querySelector('#package-custom-resolution');
    var packageCustomResolutionXValue = document.querySelector('#package-custom-resolution-x-value');
    var packageCustomResolutionYValue = document.querySelector('#package-custom-resolution-y-value');

    /**********    Embed    **********/
    var embedCode = document.querySelector('#embed-code');
    var embedAutoStart = document.querySelector('#embed-auto-start');
    var embedLightContent = document.querySelector('#embed-light-content');
    var embedHideControls = document.querySelector('#embed-hide-controls');
    var embedStandardResolution = document.querySelector('#embed-standard-resolution');
    var embedDoubleResolution = document.querySelector('#embed-double-resolution');
    var embedCustomResolution = document.querySelector('#embed-custom-resolution');
    var embedCustomResolutionXValue = document.querySelector('#embed-custom-resolution-x-value');
    var embedCustomResolutionYValue = document.querySelector('#embed-custom-resolution-y-value');

    var timeout;
    urlInput.addEventListener('input', function () {
        var ss = urlInput.selectionStart;
        var se = urlInput.selectionEnd;
        var url = urlInput.value;
        var id = url.match(/\d+/g) || [''];
        while (id.length > 1 && id.indexOf(P.player.projectId) > -1) {
            id.splice(id.indexOf(P.player.projectId), 1);
        }
        id = id[0];
        urlInput.value = url = prefix + id;
        urlInput.selectionStart = urlInput.selectionEnd = Math.max(prefix.length, ss);
        clearTimeout(timeout);
        if (P.player.projectId !== id) {
            timeout = setTimeout(function () {
                location.hash = '#' + id;

            }, 300);
        }
    });
    urlInput.addEventListener('focus', function () {
        setTimeout(function () {
            if (/\d/.test(urlInput.value)) {
                urlInput.select();
            }
        });
    });

    examples.addEventListener('change', function () {
        if (examples.value) {
            location.hash = '#' + examples.value;
            examples.selectedIndex = 0;
        }
    });

    window.addEventListener('hashchange', function () {

        var id = location.hash.substr(1);
        if (id !== 'zip') {
            if (+id !== +id) id = '';
            urlInput.value = prefix + id;
        }

        load(id);
    });

    function show(id) {
        titleArea.style.height = id ? 0 : titleAreaHeight + 'px';
        playerArea.style.height = id ? playerAreaHeight + 'px' : 0
        projectArea.style.height = id ? projectAreaHeight + 'px' : 0;
        if (!id) urlInput.focus();
    }

    async function load(id) {

        if (id !== 'zip') {
            show(id);
        } else {
            id = '';
        }

        document.title = 'sulfurous';

        await loadProject(id);

        console.log("load after")
        P.player.projectId = id;
        projectLink.href = P.player.projectURL;
        updateBugLink();
        updatePackageLink();
        updateEmbedCode();
    }

    function updateBugLink() {
        bugLink.href = P.player.projectId ? 'https://github.com/mittagskogel/sulfurous/issues/new?title=' + encodeURIComponent(P.player.projectTitle || P.player.projectURL) + '&body=' + encodeURIComponent('\n\n\n' + P.player.projectURL + '\nhttps://sulfurous.aau.at/#' + P.player.projectId + '\n' + navigator.userAgent) : 'https://github.com/mittagskogel/sulfurous/issues/new?body=' + encodeURIComponent('\n\n\n' + navigator.userAgent);
    }

    function updatePackageLink() {
        if (packageFullScreen.checked) {
            packageCustomResolutionXValue.value = null;
            packageCustomResolutionYValue.value = null;

            if (!packageFullScreenAspectRatio.checked) {
                packageAspectRatioX.value = 4;
                packageAspectRatioY.value = 3;
            }
        }
        else {
            packageAspectRatioX.value = null;
            packageAspectRatioY.value = null;
        }
        if (packageStandardResolution.checked) {
            packageCustomResolutionXValue.value = 480;
            packageCustomResolutionYValue.value = 360;
        }
        if (packageDoubleResolution.checked) {
            packageCustomResolutionXValue.value = 960;
            packageCustomResolutionYValue.value = 720;
        }
        // remember to change link before uploading!
        packageLink.href = P.player.projectId ? 'https://sulfurous.aau.at/html/app.html?id=' + P.player.projectId +
            '&turbo=' + packageTurbo.checked +
            '&full-screen=' + packageFullScreen.checked +
            '&aspect-x=' + packageAspectRatioX.value +
            '&aspect-y=' + packageAspectRatioY.value +
            '&resolution-x=' + packageCustomResolutionXValue.value +
            '&resolution-y=' + packageCustomResolutionYValue.value :
            'about:blank';
        packageCustomResolutionXValue.disabled = !packageCustomResolution.checked;
        packageCustomResolutionYValue.disabled = !packageCustomResolution.checked;

        packageFullScreenAspectRatio.disabled = !packageFullScreen.checked;
        packageAspectRatioX.disabled = !(packageFullScreenAspectRatio.checked && packageFullScreen.checked);
        packageAspectRatioY.disabled = !(packageFullScreenAspectRatio.checked && packageFullScreen.checked);

        qrcode.makeCode(packageLink.href);

    }

    packageTurbo.addEventListener('change', updatePackageLink);
    packageFullScreen.addEventListener('change', updatePackageLink);
    packageFullScreenAspectRatio.addEventListener('change', updatePackageLink);
    packageAspectRatioX.addEventListener('change', updatePackageLink);
    packageAspectRatioY.addEventListener('change', updatePackageLink);
    packageStandardResolution.addEventListener('change', updatePackageLink);
    packageDoubleResolution.addEventListener('change', updatePackageLink);
    packageCustomResolution.addEventListener('change', updatePackageLink);
    packageCustomResolutionXValue.addEventListener('change', updatePackageLink);
    packageCustomResolutionYValue.addEventListener('change', updatePackageLink);

    function updateEmbedCode(e) {
        if (embedStandardResolution.checked) {
            embedCustomResolutionXValue.value = 480;
            embedCustomResolutionYValue.value = 360;
        }
        if (embedDoubleResolution.checked) {
            embedCustomResolutionXValue.value = 960;
            embedCustomResolutionYValue.value = 480;
        }
        // remember to change link before uploading!
        embedCode.value = P.player.projectId ? '<script src=\'https://sulfurous.aau.at/js/embed.js?id=' + P.player.projectId +
            '&resolution-x=' + embedCustomResolutionXValue.value +
            '&resolution-y=' + embedCustomResolutionYValue.value +
            (embedHideControls.checked ? '&ui=false' :
                '&auto-start=' + embedAutoStart.checked +
                '&light-content=' + embedLightContent.checked) +
            '\'></' + 'script>' : '';
        embedCustomResolutionXValue.disabled = !embedCustomResolution.checked;
        embedCustomResolutionYValue.disabled = !embedCustomResolution.checked;
        embedAutoStart.disabled =
            embedLightContent.disabled = embedHideControls.checked;
        if (embedHideControls.checked) embedAutoStart.checked = true;
        if (e) embedCode.focus();
    }

    function selectEmbedCode() {
        setTimeout(function () {
            embedCode.select();
        });
    }

    embedCode.addEventListener('focus', selectEmbedCode);
    embedCode.addEventListener('click', selectEmbedCode);
    embedHideControls.addEventListener('change', updateEmbedCode);
    embedAutoStart.addEventListener('change', updateEmbedCode);
    embedLightContent.addEventListener('change', updateEmbedCode);
    embedStandardResolution.addEventListener('change', updateEmbedCode);
    embedDoubleResolution.addEventListener('change', updateEmbedCode);
    embedCustomResolution.addEventListener('change', updateEmbedCode);
    embedCustomResolutionXValue.addEventListener('change', updateEmbedCode);
    embedCustomResolutionYValue.addEventListener('change', updateEmbedCode);

    load(initialId);

    setTimeout(function () {
        function setTransition(el) {
            el.style.WebkitTransition =
                el.style.MozTransition =
                el.style.OTransition =
                el.style.transition = 'height 0.2s';
        }
        setTransition(titleArea);
        setTransition(playerArea);
        setTransition(projectArea);
    });

    function cancel(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
    }
    document.body.addEventListener('dragover', cancel);
    document.body.addEventListener('dragenter', cancel);

    document.body.addEventListener('drop', async function (e) {
        e.preventDefault();

        var f = e.dataTransfer.files[0];



        if (f) {
            location.hash = '#zip';
            show('zip');
            var ext = f.name.split('.').pop();
            if (ext === 'sb2' || ext === 'zip') {
                var request = P.IO.loadSB2File(f);
            } else if (ext === 'json') {
                request = P.IO.loadJSONFile(f);
            } else if (ext === 'sb3') {
                console.log("SB3 Converter WIP Experimental Alpha");
                console.log(f)

                socket.emit("sendSB3file", f);

            }
            if (request) {
                P.player.showProgress(request, function (stage) {
                    stage.triggerGreenFlag();
                });
            }
        }
    });

}());

function loadProject(id) {

    return new Promise(function (resolve, reject) {
        fetch('https://projects.scratch.mit.edu/internalapi/project/' + id + '/get')
            .then(function (response) {
                console.log(response.status)
                if (response.status == 200) {
                    P.player.load(id, function (stage) {

                        stage.triggerGreenFlag();
                    }, function (title) {
                        document.title = title ? title + ' \xb7 sulfurous' : 'sulfurous';
                        updateBugLink();

                    });
                    resolve();
                } else if (response.status == 404) {
                    socket.emit("sendSB3ID", id);
                    document.getElementById("sb3loading").innerHTML = "loading...."
                    resolve();
                }
            })
    })


}


function loadSP2FileFromSocket(data) {

    console.log(data)

    var blob = new Blob([data]);

    var request = P.IO.loadSB2File(blob);

    if (request) {
        P.player.showProgress(request, function (stage) {
            stage.triggerGreenFlag();
            document.getElementById("sb3loading").innerHTML = ""
            document.getElementsByClassName("project-link")[0].href = 'https://scratch.mit.edu/projects/' + P.player.projectId
        })
    }
}



var saveData = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (data, fileName) {

        blob = new Blob([data], { type: "octet/stream" }),
            url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}());