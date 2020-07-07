var urlInput = document.querySelector('.url');
var examples = document.querySelector('#examples');

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

document.body.addEventListener('dragover', cancel);
document.body.addEventListener('dragenter', cancel);

function cancel(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
}

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