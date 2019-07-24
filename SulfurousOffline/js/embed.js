(function(global) {
  'use strict';

  var script = document.currentScript || (function(scripts) {
    return scripts[scripts.length - 1];
  })(document.getElementsByTagName('script'));

  var hasUI = true;
  var resolutionX = 480;
  var resolutionY = 360;
  var params = script.src.split('?')[1].split('&');
  params.forEach(function(p) {
    var parts = p.split('=');
    if (parts.length > 1 && parts[0] === 'ui') {
      hasUI = parts[1] !== 'false';
    }
    if (parts.length > 1 && parts[0] === 'resolution-x'){
      resolutionX = Number(parts[1]);
    }
	if (parts.length > 1 && parts[0] === 'resolution-y'){
      resolutionY = Number(parts[1]);
	}
  });
  
  var iframe = document.createElement('iframe');
  iframe.setAttribute('allowfullscreen', true);
  iframe.setAttribute('allowtransparency', true);
  iframe.src = script.src.replace(/^https:/, 'https:').replace(/js\/embed\.js/, 'html/embed.html');
  //width: 482, height: 393
  iframe.width = hasUI ? resolutionX + 2 : resolutionX;
  iframe.height = hasUI ? resolutionY + 33 : resolutionY;
  iframe.style.border = '0';
  iframe.className = 'phosphorus';

  script.parentNode.replaceChild(iframe, script);

}(this));