P.player = (function() {
  'use strict';
  
  var aspectX;
  var aspectY;
  var resolutionX = 480;
  var resolutionY = 360;
  
  var stage;
  var frameId = null;
  var isFullScreen = false;

  var progressBar = document.querySelector('.progress-bar');
  var player = document.querySelector('.player');
  var projectLink = document.querySelector('.project-link');
  var bugLink = document.querySelector('#bug-link');

  var controls = document.querySelector('.controls');
  var flag = document.querySelector('.flag');
  var turbo = document.querySelector('.turbo');
  var pause = document.querySelector('.pause');
  var stop = document.querySelector('.stop');
  var fullScreen = document.querySelector('.full-screen');

  var error = document.querySelector('.internal-error');
  var errorBugLink = document.querySelector('#error-bug-link');

  var webGLError = document.querySelector('.webgl-error');
  var legacyLink = document.querySelector('#legacy-link');
  
  var flagTouchTimeout;

  function setResolution(resX, resY){
    resolutionX = resX;
	resolutionY = resY;
    player.style.width = resolutionX + 'px';
    player.style.height = resolutionY + 'px'
  } 
  
  function flagTouchStart() {
    flagTouchTimeout = setTimeout(function() {
      turboClick();
      flagTouchTimeout = true;
    }, 500);
  }
  function turboClick() {
    stage.isTurbo = !stage.isTurbo;
    flag.title = stage.isTurbo ? 'Turbo mode enabled. Shift+click to disable.' : 'Shift+click to enable turbo mode.';
    turbo.style.display = stage.isTurbo ? 'block' : 'none';
  }
  function flagClick(e) {
    if (!stage) return;
    if (flagTouchTimeout === true) return;
    if (flagTouchTimeout) {
      clearTimeout(flagTouchTimeout);
    }
    if (e.shiftKey) {
      turboClick();
    } else {
      stage.start();
      pause.className = 'pause';
      stage.stopAll();
      stage.triggerGreenFlag();
    }
    stage.focus();
    e.preventDefault();
  }

  function pauseClick(e) {
    if (!stage) return;
    if (stage.isRunning) {
      stage.pause();
      pause.className = 'play';
    } else {
      stage.start();
      pause.className = 'pause';
    }
    stage.focus();
    e.preventDefault();
  }

  function stopClick(e) {
	  
	  console.log('stop');
	  
    if (!stage) return;
    stage.start();
    pause.className = 'pause';
    stage.stopAll();
    stage.focus();
    e.preventDefault();
  }

  function fullScreenClick(e) {
    if (e) e.preventDefault();
    if (!stage) return;
    document.documentElement.classList.toggle('fs');
    isFullScreen = !isFullScreen;
    if (!e || !e.shiftKey) {
      if (isFullScreen) {
        var el = document.documentElement;
        if (el.requestFullScreenWithKeys) {
		  el.requestFullScreenWithKeys();
        } else if (el.webkitRequestFullScreen) {
          el.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
        }
		else if (el.mozRequestFullScreen){
		  el.mozRequestFullScreen();
		}
		else{
		  console.warn("No full screen available.");
		}
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
          document.webkitCancelFullScreen();
        }
      }
    }
    if (!isFullScreen) {
	  document.body.style.width = resolutionX + 'px';
      document.body.style.height =
      document.body.style.marginLeft =
      document.body.style.marginTop = '';
    }
    updateFullScreen();
    if (!stage.isRunning) {
      stage.draw();
    }
    stage.focus();
  }

  function exitFullScreen(e) {
    if (isFullScreen && e.keyCode === 27) {
      fullScreenClick(e);
    }
  }

  function updateFullScreen() {
    if (!stage) return;
    if (isFullScreen) {
      window.scrollTo(0, 0);
      var padding = 8;
      var w = window.innerWidth - padding * 2;
      var h = window.innerHeight - padding - controls.offsetHeight;
      w = Math.min(w, h * resolutionX / resolutionY);
      h = w * resolutionY / resolutionX + controls.offsetHeight;
      document.body.style.width = w + 'px';
      document.body.style.height = h + 'px';
      document.body.style.marginLeft = (window.innerWidth - w) / 2 + 'px';
      document.body.style.marginTop =  (window.innerHeight - h + padding) / 2 + 'px';
      stage.setZoom(w / 480, w * resolutionY / resolutionX / 360);
    } else {
      stage.setZoom(resolutionX ? resolutionX/480 : 1, resolutionY ? resolutionY/360 : 1);
    }
  }

  function preventDefault(e) {
    e.preventDefault();
  }
	
  window.addEventListener('resize', updateFullScreen);
  if (P.hasTouchEvents) {
    flag.addEventListener('touchstart', flagTouchStart);
    flag.addEventListener('touchend', flagClick);
    pause.addEventListener('touchend', pauseClick);
    stop.addEventListener('touchend', stopClick);
    fullScreen.addEventListener('touchend', fullScreenClick);

    flag.addEventListener('touchstart', preventDefault);
    pause.addEventListener('touchstart', preventDefault);
    stop.addEventListener('touchstart', preventDefault);
    fullScreen.addEventListener('touchstart', preventDefault);

    document.addEventListener('touchmove', function(e) {
      if (isFullScreen) e.preventDefault();
    });	
  }
  
  flag.addEventListener('click', flagClick);
  pause.addEventListener('click', pauseClick);
  stop.addEventListener('click', stopClick);
  fullScreen.addEventListener('click', fullScreenClick);
    

  document.addEventListener("fullscreenchange", function () {
    if (isFullScreen !== document.fullscreen) fullScreenClick();
  });
  document.addEventListener("mozfullscreenchange", function () {
    if (isFullScreen !== document.mozFullScreen) fullScreenClick();
  });
  document.addEventListener("webkitfullscreenchange", function () {
    if (isFullScreen !== document.webkitIsFullScreen) fullScreenClick();
  });

  function load(id, cb, titleCallback) {    
    P.player.projectId = id;
    P.player.projectURL = id ? 'https://scratch.mit.edu/projects/' + id + '/' : '';
  
    if (stage) {
      stage.stopAll();
      stage.pause();
    }
    while (player.firstChild) player.removeChild(player.lastChild);
    turbo.style.display = 'none';
    error.style.display = 'none';
    webGLError.style.display = 'none';
    pause.className = 'pause';
    progressBar.style.display = 'none';

    if (id) {
      showProgress(P.IO.loadScratchr2Project(id), cb);
      P.IO.loadScratchr2ProjectTitle(id, function(title) {
        if (titleCallback) titleCallback(P.player.projectTitle = title);
      });
    } else {
      if (titleCallback) setTimeout(function() {
        titleCallback('');
      });
    }
  }

  function showError(e) {
    error.style.display = 'block';
    errorBugLink.href = 'https://github.com/nathan/phosphorus/issues/new?title=' + encodeURIComponent(P.player.projectTitle || P.player.projectURL) + '&body=' + encodeURIComponent('\n\n\n' + P.player.projectURL + '\nhttps://phosphorus.github.io/#' + P.player.projectId + '\n' + navigator.userAgent + (e.stack ? '\n\n```\n' + e.stack + '\n```' : ''));
    console.error(e);
  }
  
  function showWebGLError(e) {
    webGLError.style.display = 'block';
    if(document.querySelector('#player-area'))
      document.querySelector('#player-area').style.height = 'auto';
    legacyLink.href = 'https://sulfurous.aau.at/legacy/#' + P.player.projectId;
    console.error(e);
  }

  function showProgress(request, loadCallback) {
    progressBar.style.display = 'none';
    setTimeout(function() {
      progressBar.style.width = '10%';
      progressBar.className = 'progress-bar';
      progressBar.style.opacity = 1;
      progressBar.style.display = 'block';
    });
    request.onload = function(s) {
      progressBar.style.width = '100%';
      setTimeout(function() {
        progressBar.style.opacity = 0;
        setTimeout(function() {
          progressBar.style.display = 'none';
        }, 300);
      }, 100);

      var zoomX = stage ? stage.zoomX : 1;
	  var zoomY = stage ? stage.zoomY : 1;
      zoomX = resolutionX ? resolutionX/480 : zoomX;
	  zoomY = resolutionY ? resolutionY/360 : zoomY;
      
      window.stage = stage = s;
      stage.start();
      stage.setZoom(zoomX, zoomY);
      
      stage.root.addEventListener('keydown', exitFullScreen);
      stage.handleError = showError;

      player.appendChild(stage.root);
      stage.focus();
      if (loadCallback) {
        loadCallback(stage);
        loadCallback = null;
      }
    };
    request.onerror = function(e) {
      progressBar.style.width = '100%';
      progressBar.className = 'progress-bar error';
      console.error(e.stack);
    };
    request.onprogress = function(e) {
      progressBar.style.width = (10 + e.loaded / e.total * 90) + '%';
    };
  }
  
  P.showWebGLError = showWebGLError;

  return {
    load: load,
    showProgress: showProgress,
    setResolution: setResolution,
  };

}());
