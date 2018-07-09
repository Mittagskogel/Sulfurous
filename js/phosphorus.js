
/*
 Sulfurous - an html5 player for Scratch projects
 
 Version: 0.93 July 09, 2018

 Sulfurous was created by Mittagskogel and further developed by FRALEX
 as part of their work at the Alpen-Adria-University Klagenfurt.
 Sulfurous is based off Phosphorus, which was created by Nathan Dinsmore.
 Its CPS-style compilation and overall design was inspired by Rhys Simpson's
 sb2.js. It would have more bugs if not for Truman Kilen. It uses the JSZip
 library, created by Stuart Knightley, David Duponchel, Franz Buchinger, and
 António Afonso, to read .sb2 files and compressed projects, and the canvg 
 library, created by Gabe Lerner, to render SVGs in <canvas> elements.
 
 Sulfurous is released under the MIT license, the full source is available
 at https://github.com/mittagskogel/sulfurous
 
 We got help from: https://github.com/htmlgames
*/
var ASCII = false;
var ProjectID;
var P = (function() {
	
	
	
	
  'use strict';

  var SCALE = window.devicePixelRatio || 1;

  var hasTouchEvents = 'ontouchstart' in document;

  var inherits = function(cla, sup) {
    cla.prototype = Object.create(sup.prototype);
    cla.parent = sup;
    cla.base = function(self, method /*, args... */) {
      return sup.prototype[method].call(self, [].slice.call(arguments, 2));
    };
  };

  var addEvents = function(cla /*, events... */) {
    [].slice.call(arguments, 1).forEach(function(event) {
      addEvent(cla, event);
    });
  };

  var addEvent = function(cla, event) {
    var capital = event[0].toUpperCase() + event.substr(1);

    cla.prototype.addEventListener = cla.prototype.addEventListener || function(event, listener) {
      var listeners = this['$' + event] = this['$' + event] || [];
      listeners.push(listener);
      return this;
    };

    cla.prototype.removeEventListener = cla.prototype.removeEventListener || function(event, listener) {
      var listeners = this['$' + event];
      if (listeners) {
        var i = listeners.indexOf(listener);
        if (i !== -1) {
          listeners.splice(i, 1);
        }
      }
      return this;
    };

    cla.prototype.dispatchEvent = cla.prototype.dispatchEvent || function(event, arg) {
      var listeners = this['$' + event];
      if (listeners) {
        listeners.forEach(function(listener) {
          listener(arg);
        });
      }
      var listener = this['on' + event];
      if (listener) {
        listener(arg);
      }
      return this;
    };

    cla.prototype['on' + capital] = function(listener) {
      this.addEventListener(event, listener);
      return this;
    };

    cla.prototype['dispatch' + capital] = function(arg) {
      this.dispatchEvent(event, arg);
      return this;
    };
  };

  
  //  WebGL generic drawing functions to be used by Stage and Sprite.

  var initShaderProgram = function(gl, vsSource, fsSource){
    const vertexShader   = loadShader(gl, gl.VERTEX_SHADER, vsSource);
    const fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
    
    const shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);
    
    if(!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
      console.warn('Could not initialize shaders. ' + gl.getProgramInfoLog(shaderProgram));
      return null;
    }
    
    return shaderProgram;
  }
  
  var loadShader = function(gl, type, source){
    const shader = gl.createShader(type);
    
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    
    if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
      console.warn('Could not compile shader. ' + gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    
    return shader;
  }

  var initImgBuffers = function(gl){
    var position = gl.createBuffer();
    var texcoord = gl.createBuffer();

    var positionLocation = [
      -1,  1,
       1,  1,
      -1, -1,
      -1, -1,
       1, -1,
       1,  1,
    ];
    
    var texcoordLocation = [
       0,  1,
       1,  1,
       0,  0,
       0,  0,
       1,  0,
       1,  1,
    ];
    
    gl.bindBuffer(gl.ARRAY_BUFFER, position);
    gl.bufferData(gl.ARRAY_BUFFER,
                  new Float32Array(positionLocation),
                  gl.STATIC_DRAW);
                      
                  
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoord);
    gl.bufferData(gl.ARRAY_BUFFER,
                  new Float32Array(texcoordLocation),
                  gl.STATIC_DRAW);
                  
    return {
      position: position,
      texcoord: texcoord,
    }
  }    
  
  var glMakeTexture = function(gl, canvas){
    //console.log('glMakeTexture');
    
    var tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    
    
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    
    var textureInfo = {
      width: canvas.width,
      height: canvas.height,
      texture: tex,
    };
    
    return textureInfo;
  }
  
  var glDrawImage = function(gl, programInfo, buffers, imgInfo, x, y, width, height, rot, originX, originY, effect, tColor){
 
    var cWidth = gl.canvas.width;
    var cHeight = gl.canvas.height;
   
    if(cWidth >= cHeight * 0.75)
      var zoom = Math.max(cWidth, cHeight * 0.75);
    else
      var zoom = Math.max(cHeight * 1.25, cHeight);
    
    gl.viewport(0, cHeight - zoom * 0.875, zoom, zoom);
    
    gl.blendFunc(programInfo.blendSource, programInfo.blendDest);
    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);   
    
    gl.bindTexture(gl.TEXTURE_2D, imgInfo.texture);
    
    gl.useProgram(programInfo.program);
    
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);   
    gl.vertexAttribPointer(
      programInfo.attribLocations.position,
      2,
      gl.FLOAT,
      false,
      0,
      0);
     
    gl.enableVertexAttribArray(programInfo.attribLocations.position);
    
    
    
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texcoord); 
    gl.vertexAttribPointer(
      programInfo.attribLocations.texcoord,
      2,
      gl.FLOAT,
      false,
      0,
      0);
      
    gl.enableVertexAttribArray(programInfo.attribLocations.texcoord);   

    
    var q = quat.create();
    quat.fromEuler(q, 0, 0, rot);
    
    var v = vec3.fromValues(x / 240, y / 240, 0);
    
    var s = vec3.fromValues(1, 1, 1);
    
    var o = vec3.fromValues(originX / 240, originY / 240, 0);
    
    var matrix = mat4.create();
    mat4.fromRotationTranslationScaleOrigin(matrix, q, v, s, o);
    
    mat4.scale(matrix, matrix, vec3.fromValues(width / 480, -height / 480, 0));
    
    gl.uniformMatrix4fv(programInfo.uniformLocations.matrix, false, matrix);
    
    if(tColor) gl.uniform4fv(programInfo.uniformLocations.tColor, tColor);
    gl.uniform1i(programInfo.uniformLocations.texture, 0);
    gl.uniform2f(programInfo.uniformLocations.texSize, imgInfo.width, imgInfo.height);
    
    //Effects:
    //effect[0] = color
    //effect[1] = fisheye
    //effect[2] = whirl
    //effect[3] = pixelate
    //effect[4] = mosaic
    //effect[5] = brightness
    //effect[6] = ghost

    if(!effect) effect = [0, 0, 0, 1, 1, 0, 1];
      
	
	 ;
	  if(effect[5] > 0){
		 effect[5] = effect[5] /100 * 30 ;
		 effect[0] = effect[0] + effect[5]*1.8;
	  }
	  
	
    var colorMatrix = mat4.create();
    mat4.fromRotation(colorMatrix, effect[0], vec3.fromValues(1.0, 1.0, 1.0));  
      
    //ghost, brightness
    gl.uniform2f(programInfo.uniformLocations.colorEffect, effect[5], effect[6]);
    //color
    gl.uniformMatrix4fv(programInfo.uniformLocations.colorMatrix, false, colorMatrix);
    //texture
    gl.uniform4f(programInfo.uniformLocations.texEffect, effect[1], effect[2], effect[3], effect[4]);
    
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    
    /*
    var err
    if(err = gl.getError()){
      console.log('WebGL Error: ' + err);
    }
    */
  }  
  
  var Request = function() {
    this.loaded = 0;
  };
  addEvents(Request, 'load', 'progress', 'error');

  Request.prototype.progress = function(loaded, total, lengthComputable) {
    this.loaded = loaded;
    this.total = total;
    this.lengthComputable = lengthComputable;
    this.dispatchProgress({
      loaded: loaded,
      total: total,
      lengthComputable: lengthComputable
    });
  };

  Request.prototype.load = function(result) {
    this.result = result;
    this.isDone = true;
    this.dispatchLoad(result);
  };

  Request.prototype.error = function(error) {
    this.result = error;
    this.isError = true;
    this.isDone = true;
    this.dispatchError(error);
  };

  var CompositeRequest = function() {
    this.requests = [];
    this.isDone = true;
    this.update = this.update.bind(this);
    this.error = this.error.bind(this);
  };
  inherits(CompositeRequest, Request);

  CompositeRequest.prototype.add = function(request) {
    if (request instanceof CompositeRequest) {
      for (var i = 0; i < request.requests.length; i++) {
        this.add(request.requests[i]);
      }
    } else {
      this.requests.push(request);
      request.addEventListener('progress', this.update);
      request.addEventListener('load', this.update);
      request.addEventListener('error', this.error);
      this.update();
    }
  };

  CompositeRequest.prototype.update = function() {
    if (this.isError) return;
    var requests = this.requests;
    var i = requests.length;
    var total = 0;
    var loaded = 0;
    var lengthComputable = true;
    var uncomputable = 0;
    var done = 0;
    while (i--) {
      var r = requests[i];
      loaded += r.loaded;
      if (r.isDone) {
        total += r.loaded;
        done += 1;
      } else if (r.lengthComputable) {
        total += r.total;
      } else {
        lengthComputable = false;
        uncomputable += 1;
      }
    }
    if (!lengthComputable && uncomputable !== requests.length) {
      var each = total / (requests.length - uncomputable) * uncomputable;
      i = requests.length;
      total = 0;
      loaded = 0;
      lengthComputable = true;
      while (i--) {
        var r = requests[i];
        if (r.lengthComputable) {
          loaded += r.loaded;
          total += r.total;
        } else {
          total += each;
          if (r.isDone) loaded += each;
        }
      }
    }
    this.progress(loaded, total, lengthComputable);
    this.doneCount = done;
    this.isDone = done === requests.length;
    if (this.isDone && !this.defer) {
      this.load(this.getResult());
    }
  };

  CompositeRequest.prototype.getResult = function() {
    throw new Error('Users must implement getResult()');
  };

  var wavFiles = {AcousticGuitar_F3:'instruments/AcousticGuitar_F3_22k.wav',AcousticPiano_As3:'instruments/AcousticPiano(5)_A%233_22k.wav',AcousticPiano_C4:'instruments/AcousticPiano(5)_C4_22k.wav',AcousticPiano_G4:'instruments/AcousticPiano(5)_G4_22k.wav',AcousticPiano_F5:'instruments/AcousticPiano(5)_F5_22k.wav',AcousticPiano_C6:'instruments/AcousticPiano(5)_C6_22k.wav',AcousticPiano_Ds6:'instruments/AcousticPiano(5)_D%236_22k.wav',AcousticPiano_D7:'instruments/AcousticPiano(5)_D7_22k.wav',AltoSax_A3:'instruments/AltoSax_A3_22K.wav',AltoSax_C6:'instruments/AltoSax(3)_C6_22k.wav',Bassoon_C3:'instruments/Bassoon_C3_22k.wav',BassTrombone_A2_2:'instruments/BassTrombone_A2(2)_22k.wav',BassTrombone_A2_3:'instruments/BassTrombone_A2(3)_22k.wav',Cello_C2:'instruments/Cello(3b)_C2_22k.wav',Cello_As2:'instruments/Cello(3)_A%232_22k.wav',Choir_F3:'instruments/Choir(4)_F3_22k.wav',Choir_F4:'instruments/Choir(4)_F4_22k.wav',Choir_F5:'instruments/Choir(4)_F5_22k.wav',Clarinet_C4:'instruments/Clarinet_C4_22k.wav',ElectricBass_G1:'instruments/ElectricBass(2)_G1_22k.wav',ElectricGuitar_F3:'instruments/ElectricGuitar(2)_F3(1)_22k.wav',ElectricPiano_C2:'instruments/ElectricPiano_C2_22k.wav',ElectricPiano_C4:'instruments/ElectricPiano_C4_22k.wav',EnglishHorn_D4:'instruments/EnglishHorn(1)_D4_22k.wav',EnglishHorn_F3:'instruments/EnglishHorn(1)_F3_22k.wav',Flute_B5_1:'instruments/Flute(3)_B5(1)_22k.wav',Flute_B5_2:'instruments/Flute(3)_B5(2)_22k.wav',Marimba_C4:'instruments/Marimba_C4_22k.wav',MusicBox_C4:'instruments/MusicBox_C4_22k.wav',Organ_G2:'instruments/Organ(2)_G2_22k.wav',Pizz_A3:'instruments/Pizz(2)_A3_22k.wav',Pizz_E4:'instruments/Pizz(2)_E4_22k.wav',Pizz_G2:'instruments/Pizz(2)_G2_22k.wav',SteelDrum_D5:'instruments/SteelDrum_D5_22k.wav',SynthLead_C4:'instruments/SynthLead(6)_C4_22k.wav',SynthLead_C6:'instruments/SynthLead(6)_C6_22k.wav',SynthPad_A3:'instruments/SynthPad(2)_A3_22k.wav',SynthPad_C6:'instruments/SynthPad(2)_C6_22k.wav',TenorSax_C3:'instruments/TenorSax(1)_C3_22k.wav',Trombone_B3:'instruments/Trombone_B3_22k.wav',Trumpet_E5:'instruments/Trumpet_E5_22k.wav',Vibraphone_C3:'instruments/Vibraphone_C3_22k.wav',Violin_D4:'instruments/Violin(2)_D4_22K.wav',Violin_A4:'instruments/Violin(3)_A4_22k.wav',Violin_E5:'instruments/Violin(3b)_E5_22k.wav',WoodenFlute_C5:'instruments/WoodenFlute_C5_22k.wav',BassDrum:'drums/BassDrum(1b)_22k.wav',Bongo:'drums/Bongo_22k.wav',Cabasa:'drums/Cabasa(1)_22k.wav',Clap:'drums/Clap(1)_22k.wav',Claves:'drums/Claves(1)_22k.wav',Conga:'drums/Conga(1)_22k.wav',Cowbell:'drums/Cowbell(3)_22k.wav',Crash:'drums/Crash(2)_22k.wav',Cuica:'drums/Cuica(2)_22k.wav',GuiroLong:'drums/GuiroLong(1)_22k.wav',GuiroShort:'drums/GuiroShort(1)_22k.wav',HiHatClosed:'drums/HiHatClosed(1)_22k.wav',HiHatOpen:'drums/HiHatOpen(2)_22k.wav',HiHatPedal:'drums/HiHatPedal(1)_22k.wav',Maracas:'drums/Maracas(1)_22k.wav',SideStick:'drums/SideStick(1)_22k.wav',SnareDrum:'drums/SnareDrum(1)_22k.wav',Tambourine:'drums/Tambourine(3)_22k.wav',Tom:'drums/Tom(1)_22k.wav',Triangle:'drums/Triangle(1)_22k.wav',Vibraslap:'drums/Vibraslap(1)_22k.wav',WoodBlock:'drums/WoodBlock(1)_22k.wav'};

  var IO = {};

  IO.PROJECT_URL = 'https://projects.scratch.mit.edu/internalapi/project/';
  IO.ASSET_URL = 'https://cdn.assets.scratch.mit.edu/internalapi/asset/';
  
	//https://sulfurous.aau.at/
	
  IO.SOUNDBANK_URL = 'soundbank/';

   IO.FONTS = {
    '': 'Helvetica',
    Scratch: 'Scratch',	  
    Donegal: 'Donegal One',
    Gloria: 'Gloria Hallelujah',
    Marker: 'Permanent Marker',
    Mystery: 'Mystery Quest'
  };

  IO.LINE_HEIGHTS = {
    'Helvetica': 1.13,
    'Scratch': 1.0,
    'Donegal One': 1.25,
    'Gloria Hallelujah': 1.97,
    'Permanent Marker': 1.43,
    'Mystery Quest': 1.37
  };
  
  IO.ADPCM_STEPS = [7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 19, 21, 23, 25, 28, 31, 34, 37, 41, 45, 50, 55, 60, 66, 73, 80, 88, 97, 107, 118, 130, 143, 157, 173, 190, 209, 230, 253, 279, 307, 337, 371, 408, 449, 494, 544, 598, 658, 724, 796, 876, 963, 1060, 1166, 1282, 1411, 1552, 1707, 1878, 2066, 2272, 2499, 2749, 3024, 3327, 3660, 4026, 4428, 4871, 5358, 5894, 6484, 7132, 7845, 8630, 9493, 10442, 11487, 12635, 13899, 15289, 16818, 18500, 20350, 22385, 24623, 27086, 29794, 32767];
  IO.ADPCM_INDEX = [-1, -1, -1, -1, 2, 4, 6, 8, -1, -1, -1, -1, 2, 4, 6, 8];

  IO.init = function(request) {
    IO.projectRequest = request;
    IO.zip = null;
  };

  IO.parseJSONish = function(json) {
    if (!/^\s*\{/.test(json)) throw new SyntaxError('Bad JSON');
    try {
      return JSON.parse(json);
    } catch (e) {}
    if (/[^,:{}\[\]0-9\.\-+EINaefilnr-uy \n\r\t]/.test(json.replace(/"(\\.|[^"\\])*"/g, ''))) {
      throw new SyntaxError('Bad JSON');
    }
    return (1, eval)('(' + json + ')');
  };


  IO.load = function(url, callback, self, type) {
  
   var request = new Request;
    var xhr = new XMLHttpRequest;
    xhr.open('GET', url, true);
	
	 
    xhr.onprogress = function(e) {
		
		
      request.progress(e.loaded, e.total, e.lengthComputable);
    };
    xhr.onload = function() {
      if (xhr.status === 200) {
        request.load(xhr.response);
      } else {
		  
        request.error(new Error('HTTP ' + xhr.status + ': ' + xhr.statusText));
      }
    };
    xhr.onerror = function() {
     request.error(new Error('XHR Error'));
    };
    xhr.responseType = type || '';
    setTimeout(xhr.send.bind(xhr));

    if (callback) request.onLoad(callback.bind(self));
	
    return request;
	
  };

  IO.loadImage = function(url, callback, self) {
    var request = new Request;
    var image = new Image;
	  var bForcedBlank = false;
    image.crossOrigin = 'anonymous';
    image.src = url;
    image.onload = function() {
      request.load(image);
    };
    image.onerror = function() {
     // request.error(new Error('Failed to load image: ' + url));
	  console.log('Failed to load image (forcing blank): ' + url);
      bForcedBlank = true;
      image.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAABBJREFUeNpi+P//PwNAgAEACPwC/tuiTRYAAAAASUVORK5CYII=";
  
    };
    if (callback) request.onLoad(callback.bind(self));
     return (bForcedBlank) ? request : request;
  };
		
  IO.loadScratchr2Project = function(id, callback, self) {
    var request = new CompositeRequest;
    IO.init(request);
	
	ProjectID = id;
	
    request.defer = true;
    var url = IO.PROJECT_URL + id + '/get/';
    
	console.log(url);
	
	request.add(IO.load(url).onLoad(function(contents) {
		
		
      try {
        var json = IO.parseJSONish(contents);
      } catch (e) {
        request.add(IO.load(url, null, null, 'arraybuffer').onLoad(function(ab) {
          var request2 = new Request;
          request.add(request2);
          request.add(IO.loadSB2Project(ab, function(stage) {
			
            request.getResult = function() {
              return stage;
            };
            request2.load();
          }));
          request.defer = false;
        }));
        return;
      }
      try {
        IO.loadProject(json);
        if (callback) request.onLoad(callback.bind(self));
        if (request.isDone) {
          request.load(new Stage().fromJSON(json));
        } else {
          request.defer = false;
          request.getResult = function() {
            return new Stage().fromJSON(json);
          };
        }
      } catch (e) {
        request.error(e);
      }
    }));

    return request;
  };

  IO.loadScratchr2ProjectTitle = function(id, callback, self) {
    var request = new CompositeRequest;    
    
    request.defer = true;
    request.add(P.IO.load('https://scratch.mit.edu/projects/' + id + '/').onLoad(function(data) {
      var m = /<title>\s*(.+?)(\s+on\s+Scratch)?\s*<\/title>/.exec(data);
      if (callback) request.onLoad(callback.bind(self));
      if (m) {
        var d = document.createElement('div');
        d.innerHTML = m[1];
        request.load(d.innerText);
	
      } else {
        request.error(new Error('No title'));
      }
    }));

    return request;
  };

  IO.loadJSONProject = function(json, callback, self) {
    var request = new CompositeRequest;
    IO.init(request);

    try {
      IO.loadProject(json);
      if (callback) request.onLoad(callback.bind(self));
      if (request.isDone) {
        request.load(new Stage().fromJSON(json));
      } else {
        request.defer = false;
        request.getResult = function() {
          return new Stage().fromJSON(json);
        };
      }
    } catch (e) {
      request.error(e);
    }

    return request;
  };

  IO.loadSB2Project = function(ab, callback, self) {
    var request = new CompositeRequest;
    IO.init(request);

    try {
      IO.zip = new JSZip(ab);
      var json = IO.parseJSONish(IO.zip.file('project.json').asText());

      IO.loadProject(json);
      if (callback) request.onLoad(callback.bind(self));
      if (request.isDone) {
        request.load(new Stage().fromJSON(json));
      } else {
        request.defer = false;
        request.getResult = function() {
          return new Stage().fromJSON(json);
        };
      }
    } catch (e) {
      request.error(e);
    }

    return request;
  };

  IO.loadSB2File = function(f, callback, self) {
    var cr = new CompositeRequest;
    cr.defer = true;
    var request = new Request;
    cr.add(request);
    var reader = new FileReader;
    reader.onloadend = function() {
      cr.defer = true;
      cr.add(IO.loadSB2Project(reader.result, function(result) {
        cr.defer = false;
        cr.getResult = function() {
          return result;
        };
        cr.update();
      }));
      request.load();
    };
    reader.onprogress = function(e) {
      request.progress(e.loaded, e.total, e.lengthComputable);
    };
    reader.readAsArrayBuffer(f);
    if (callback) cr.onLoad(callback.bind(self));
    return cr;
  };

  IO.loadProject = function(data) {
    IO.loadWavs();
    IO.loadArray(data.children, IO.loadObject);
    IO.loadBase(data);
  };

  IO.wavBuffers = Object.create(null);
  IO.loadWavs = function() {
    if (!audioContext) return;

    for (var name in wavFiles) {
      if (IO.wavBuffers[name]) {
        if (IO.wavBuffers[name] instanceof Request) {
          IO.projectRequest.add(IO.wavBuffers[name]);
        }
      } else {
        IO.projectRequest.add(IO.wavBuffers[name] = IO.loadWavBuffer(name));
      }
    }
  };
  
  IO.arrayBufferToBase64 = function(buffer){
    var bytes = new Uint8Array(buffer);
    var len = buffer.byteLength;
    var base64 = '';
    for(var i = 0; i < len; i++){
      base64 += String.fromCharCode(bytes[i]);
    }
    return btoa(base64);
  }
  
  IO.base64ToArrayBuffer = function(base64){
    var binaryString = atob(base64);
    var len = binaryString.length;
    var bytes = new Uint8Array(len);
    for(var i = 0; i < len; i++){
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  
  //IO.base64output = '';
  
  IO.loadWavBuffer = function(name) {
    var request = new Request;
	

		
    IO.load(IO.SOUNDBANK_URL + wavFiles[name], function(ab) {
      
      //Code for exporting soundbank to text file.
      /*
      IO.base64output = IO.base64output + 'A.' + name + ' = \'' + IO.arrayBufferToBase64(ab) + '\'\n';
      var el = document.createElement("a");
      el.setAttribute('href', 'data:application/octet-stream;charset=utf-8,' + encodeURIComponent(IO.base64output));
      el.appendChild(document.createTextNode('wav files'));
      document.body.appendChild(el);
      console.log(name);
      */     
      
      IO.decodeAudio(ab, function(buffer) {
        IO.wavBuffers[name] = buffer;
        request.load();
      });
    }, null, 'arraybuffer').onError(function(err) {
      request.error(err);
    });
    return request;
  };

  
  IO.decodeAudio = function(ab, cb) {
    if (audioContext) {
       IO.decodeADPCMAudio(ab, function(err, buffer) {
        if (buffer) return setTimeout(function() {cb(buffer)});
        var p = audioContext.decodeAudioData(ab, function(buffer) {
          cb(buffer);
        }, function(err2) {
          console.warn(err, err2);
          cb(null);
        });
        if (p.catch) p.catch(function() {});
      });
    } else {
      setTimeout(cb);
    }
  };

  IO.decodeADPCMAudio = function(ab, cb) {
    var dv = new DataView(ab);
    if (dv.getUint32(0) !== 0x52494646 || dv.getUint32(8) !== 0x57415645) {
      return cb(new Error('Unrecognized audio format'));
    }

    var blocks = {};
    var i = 12, l = dv.byteLength - 8;
    while (i < l) {
      blocks[String.fromCharCode(
        dv.getUint8(i),
        dv.getUint8(i + 1),
        dv.getUint8(i + 2),
        dv.getUint8(i + 3))] = i;
      i += 8 + dv.getUint32(i + 4, true);
    }

    var format        = dv.getUint16(20, true);
    var channels      = dv.getUint16(22, true);
    var sampleRate    = dv.getUint32(24, true);
    var byteRate      = dv.getUint32(28, true);
    var blockAlign    = dv.getUint16(32, true);
    var bitsPerSample = dv.getUint16(34, true);

    if (format === 17) {
      var samplesPerBlock = dv.getUint16(38, true);
      var blockSize = ((samplesPerBlock - 1) / 2) + 4;

      var frameCount = dv.getUint32(blocks.fact + 8, true);

      var buffer = audioContext.createBuffer(1, frameCount, sampleRate);
      var channel = buffer.getChannelData(0);

      var sample, index = 0;
      var step, code, delta;
      var lastByte = -1;

      var offset = blocks.data + 8;
      i = offset;
      var j = 0;
      while (true) {
        if ((((i - offset) % blockSize) == 0) && (lastByte < 0)) {
          if (i >= dv.byteLength) break;
          sample = dv.getInt16(i, true); i += 2;
          index = dv.getUint8(i); i += 1;
          i++;
          if (index > 88) index = 88;
          channel[j++] = sample / 32767;
        } else {
          if (lastByte < 0) {
            if (i >= dv.byteLength) break;
            lastByte = dv.getUint8(i); i += 1;
            code = lastByte & 0xf;
          } else {
            code = (lastByte >> 4) & 0xf;
            lastByte = -1;
          }
          step = IO.ADPCM_STEPS[index];
          delta = 0;
          if (code & 4) delta += step;
          if (code & 2) delta += step >> 1;
          if (code & 1) delta += step >> 2;
          delta += step >> 3;
          index += IO.ADPCM_INDEX[code];
          if (index > 88) index = 88;
          if (index < 0) index = 0;
          sample += (code & 8) ? -delta : delta;
          if (sample > 32767) sample = 32767;
          if (sample < -32768) sample = -32768;
          channel[j++] = sample / 32768;
        }
      }
      return cb(null, buffer);
    }
    cb(new Error('Unrecognized WAV format ' + format));
  };
  
  IO.loadBase = function(data) {
    data.scripts = data.scripts || [];
    data.costumes = IO.loadArray(data.costumes, IO.loadCostume);
    data.sounds = IO.loadArray(data.sounds, IO.loadSound);
    data.variables = data.variables || [];
    data.lists = data.lists || [];
  };

	//process an array of several inputs (such as costumes, sounds, ...)
  IO.loadArray = function(data, process) {
    if (!data) return [];
    for (var i = 0; i < data.length; i++) {
      process(data[i]);
    }
    return data;
  };

  IO.loadObject = function(data) {
    if (!data.cmd && !data.listName) {
      IO.loadBase(data);
    }
  };

  IO.loadCostume = function(data) {
    IO.loadMD5(data.baseLayerMD5, data.baseLayerID, function(asset) {
      data.$image = asset;
    }, false);
    if (data.textLayerMD5) {
      IO.loadMD5(data.textLayerMD5, data.textLayerID, function(asset) {
        data.$text = asset;
      }, false);
    }
  };

  IO.loadSound = function(data) {
    IO.loadMD5(data.md5, data.soundID, function(asset) {
      data.$buffer = asset;
    }, true);
  };

  IO.fixSVG = function(svg, element) {
	  
	  
	  
    if (element.nodeType !== 1) return element;
    if (element.nodeName.slice(0, 4).toLowerCase() === 'svg:') {
     /*
      var newElement = document.createElementNS('https://www.w3.org/2000/svg', element.localName);
      var attributes = element.attributes;
      var newAttributes = newElement.attributes;
      for (var i = attributes.length; i--;) {
        newAttributes.setNamedItemNS(attributes[i].cloneNode());
      }
      while (element.firstChild) {
        newElement.appendChild(element.firstChild);
      }
      element = newElement;
     */
    }
    
    //Embed fonts in svg:
    if (element.nodeName === 'svg') {
      var defs = document.createElement('defs');
      element.appendChild(defs);
      
      var style = document.createElement('style');
      defs.appendChild(style);
      
      var embedText = '';
      
      
      if(element.querySelector('[font-family="Scratch"]')){
        embedText += '@font-face{\n';
        embedText += 'font-family: Scratch;\nsrc: url(\"data:application/x-font-ttf;base64,';
        embedText += F.Scratch;
        embedText += '\");\n';
        embedText += '}\n';
      }
      
      if(element.querySelector('[font-family="Donegal"]')){
        embedText += '@font-face{\n';
        embedText += 'font-family: Donegal One;\nsrc: url(\"data:application/x-font-ttf;base64,';
        embedText += F.Donegal;
        embedText += '\");\n';
        embedText += '}\n';      
      }
      
      if(element.querySelector('[font-family="Gloria"]')){
        embedText += '@font-face{\n';
        embedText += 'font-family: Gloria Hallelujah;\nsrc: url(\"data:application/x-font-ttf;base64,';
        embedText += F.Gloria;
        embedText += '\");\n';
        embedText += '}\n';      
      }
      
      if(element.querySelector('[font-family="Marker"]')){
        embedText += '@font-face{\n';
        embedText += 'font-family: Permanent Marker;\nsrc: url(\"data:application/x-font-ttf;base64,';
        embedText += F.Marker;
        embedText += '\");\n';
        embedText += '}\n';      
      }
      
      if(element.querySelector('[font-family="Mystery"]')){
        embedText += '@font-face{\n';
        embedText += 'font-family: Mystery Quest;\nsrc: url(\"data:application/x-font-ttf;base64,';
        embedText += F.Mystery;
        embedText += '\");\n';
        embedText += '}\n';            
      }
      
      var info = document.createTextNode(embedText);
      style.appendChild(info);
    }
    
    if (element.nodeName === 'text') {
      
      var font = element.getAttribute('font-family') || '';
      
      font = IO.FONTS[font] || font;
      if (font) {
        element.setAttribute('font-family', font);
        if (font === 'Helvetica') element.style.fontWeight = 'bold';
      }
      var size = +element.getAttribute('font-size');
      if (!size) {
        element.setAttribute('font-size', size = 18);
      }
			
			
			// Set default fill for svgs that the Scratch exporter forgets...
			if(element.getAttribute('fill') === 'none')
				element.setAttribute('fill', '#7F7F7F');
      
      
      //TODO: Find out what actual values have to be put here.
      //element.setAttribute('x', 0);
      //element.setAttribute('y', size*IO.LINE_HEIGHTS[font]);
      var bb = element ? element.getBBox() : null;
      var x = 4 - .6 * element.transform.baseVal.consolidate().matrix.a;
      var y = (element.getAttribute('y') - bb.y) * 1.1;
      element.setAttribute('x', x);
      element.setAttribute('y', y);
      
      
      var lines = element.textContent.split('\n');
      if (lines.length > 1) {
        element.textContent = lines[0];
        var lineHeight = IO.LINE_HEIGHTS[font] || 1;
        for (var i = 1, l = lines.length; i < l; i++) {
          var tspan = document.createElementNS("http://www.w3.org/2000/svg", 'tspan');
          tspan.textContent = lines[i];
          tspan.setAttribute('x', x);
          tspan.setAttribute('y', y + size * i * lineHeight);
          element.appendChild(tspan);
        }
        
      }
      
      
      
    } else if ((element.hasAttribute('x') || element.hasAttribute('y')) && element.hasAttribute('transform')) {
      element.setAttribute('x', 0);
      element.setAttribute('y', 0);
    }
    
    if (element.nodeName === 'linearGradient'){
      element.setAttribute('id', element.getAttribute('id') + svg.getAttribute('id'));
        element.setAttribute('gradientUnits', 'objectBoundingBox');
        //I really don't know what kind of algorithm scratch is following here, so this is just guesswork.
        var x1 = Number(element.getAttribute('x1'));
        var x2 = Number(element.getAttribute('x2'));
        var y1 = Number(element.getAttribute('y1'));
        var y2 = Number(element.getAttribute('y2'));
        
        if(x1 === x2){
          x1 = 0;
          x2 = 0;
        }
        else if(x1 < x2){
          x1 = 0;
          x2 = 1;
        }
        else{
          x1 = 1;
          x2 = 0;
        }
        if(y1 === y2){
          y1 = 0;
          y2 = 0;
        }
        else if(y1 < y2){
          y1 = 0;
          y2 = 1;
        }
        else{
          y1 = 1;
          y2 = 0;
        }
        
        element.setAttribute('x1', x1);
        element.setAttribute('x2', x2);
        element.setAttribute('y1', y1);
        element.setAttribute('y2', y2);
 
    }
	
		if(element.nodeName === 'radialGradient'){
			element.setAttribute('id', element.getAttribute('id') + svg.getAttribute('id'));
			element.setAttribute('gradientUnits', 'objectBoundingBox');
		}
    
    if (element.getAttribute('fill') ? element.getAttribute('fill').indexOf("url") > -1 : false){
      element.setAttribute('fill', element.getAttribute('fill').replace(/.$/, svg.getAttribute('id')));
    }
    
    if (element.getAttribute('stroke') ? element.getAttribute('stroke').indexOf("url") > -1 : false){
      element.setAttribute('stroke', element.getAttribute('stroke').replace(/.$/, svg.getAttribute('id')));
    }
    
    [].forEach.call(element.childNodes, function(child){
	  var newChild = IO.fixSVG(svg, child);
      if (newChild !== child) {
        element.replaceChild(newChild, child);
      }
	});
	return element;
  };

  IO.loadMD5 = function(md5, id, callback, isAudio) {
		if (IO.zip) {
      var f = isAudio ? IO.zip.file(id + '.wav') : IO.zip.file(id + '.gif') || IO.zip.file(id + '.png') || IO.zip.file(id + '.jpg') || IO.zip.file(id + '.svg');
      md5 = f.name;
    }
		//get file extension
    var ext = md5.split('.').pop();
		//special handling for svg
    if (ext === 'svg') {
      var cb = function(source) {
        var div = document.createElement('div');
        //div.innerHTML = source;
        //var svg = div.getElementsByTagName('svg')[0];
        //div.innerHTML = source.replace(/(<\/?)svg:/g, '$1');
        //var svg = div.firstElementChild;		
				
        var parser = new DOMParser();
        var doc = parser.parseFromString(source, 'image/svg+xml');
        var svg = doc.documentElement;
        doc = parser.parseFromString('<body>' + source, 'text/html');
        svg = doc.querySelector('svg');
        
        svg.id = 'svg' + md5.split('.')[0];
        if(svg.getAttribute('width') === '0' || svg.getAttribute('height') === '0'){
          svg = document.createElementNS('https://www.w3.org/2000/svg', svg.localName);
        }
        else{
          document.body.appendChild(svg);
          svg = IO.fixSVG(svg, svg);
        }
		
		//Some svg tags are completely emty for some reason, so we simply ignore these
		if(!svg.style) return;		
		//When viewBox doesn't exist yet, some browsers don't automatically create an object,
		//so we need to do that manually. (SVGRect doesn't seem to have a constructor either)
        var viewBox = svg.viewBox && svg.viewBox.baseVal ? svg.viewBox.baseVal : {width: 0, height: 0, x: 0, y: 0};
		
        if (svg.querySelector("path") || svg.querySelector("image")) {
        var bb = svg.getBBox();
        viewBox.width  = svg.width.baseVal.value = Math.ceil(bb.x + bb.width + 1);
        viewBox.height = svg.height.baseVal.value = Math.ceil(bb.y + bb.height + 1);				
        viewBox.x = 0;
        viewBox.y = 0;
      }
				//get the viewbox of the svg
        if (viewBox && (viewBox.x || viewBox.y)) {
          //svg.width.baseVal.value = viewBox.width - viewBox.x;
          //svg.height.baseVal.value = viewBox.height - viewBox.y;
          //viewBox.x = 0;
          //viewBox.y = 0;
          //viewBox.width = 0;
          //viewBox.height = 0;
          var bb = svg.getBBox();
          viewBox.width  = svg.width.baseVal.value = Math.ceil(bb.x + bb.width + 1);
          viewBox.height = svg.height.baseVal.value = Math.ceil(bb.y + bb.height + 1);	
          viewBox.x = 0;
          viewBox.y = 0;
        }

        //IO.fixSVG(svg, svg);
        //while (div.firstChild) div.removeChild(div.lastChild);
        //div.appendChild(svg);
        //svg.style.visibility = 'visible';
        //svg.style.cssText = '';

        svg.style['image-rendering'] = '-moz-crisp-edges';
        svg.style['image-rendering'] = 'pixelated';
		
        //svg.style.overflow = 'visible';
        //svg.style.width = '100%';
        
        var request = new Request;
        var image = new Image;

				//serialize the svg code to a single compact string
        var newSource = (new XMLSerializer()).serializeToString(svg)
				//convert the svg to a base-64 string
        image.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(newSource))); 
        
        //svg.style.display = 'none';
        document.body.removeChild(svg);
        
        image.onload = function() {
          if (callback) callback(image);
          request.load();
        };
        image.onerror = function(e) {
          //console.error(e, image);
          console.log(image.src);
          console.error(md5, image.src);
          request.error(new Error());
        };
        IO.projectRequest.add(request);		
      };
      if (IO.zip) {
        cb(f.asText());
      } else {
        IO.projectRequest.add(IO.load(IO.ASSET_URL + md5 + '/get/', cb));
      }
    } else if (ext === 'wav') {
      var request = new Request;
      var cb = function(ab) {
        IO.decodeAudio(ab, function(buffer) {
          callback(buffer);
          request.load(buffer);
        });
      }
      IO.projectRequest.add(request);
      if (IO.zip) {
        var audio = new Audio;
        var ab = f.asArrayBuffer();
        cb(ab);
      } else {
        IO.projectRequest.add(IO.load(IO.ASSET_URL + md5 + '/get/', cb, null, 'arraybuffer'));
      }
    } else {
      if (IO.zip) {
        var request = new Request;
        var image = new Image;
        image.onload = function() {
          if (callback) callback(image);
          request.load();
        };
        image.src = 'data:image/' + (ext === 'jpg' ? 'jpeg' : ext) + ';base64,' + btoa(f.asBinary());
        IO.projectRequest.add(request);
      } else {
        IO.projectRequest.add(
          IO.loadImage(IO.ASSET_URL + md5 + '/get/', function(result) {
            callback(result);
          }));
      }
    }
  };

  var Base = function() {
    this.isClone = false;
    this.costumes = [];
    this.currentCostumeIndex = 0;
    this.objName = '';
    this.instrument = 0;
    this.volume = 1;

    this.soundRefs = Object.create(null);
    this.sounds = [];

    this.vars = Object.create(null);
    this.watchers = Object.create(null);
    this.lists = Object.create(null);

    this.procedures = {};
    this.listeners = {
      whenClicked: [],
      whenCloned: [],
      whenGreenFlag: [],
      whenIReceive: {},
      whenKeyPressed: [],
      whenSceneStarts: [],
      whenSensorGreaterThan: []
    };
    for (var i = 0; i < 128; i++) {
      this.listeners.whenKeyPressed.push([]);
    }
    this.fns = [];
    this.scripts = [];

    this.filters = {
      color: 0,
      fisheye: 0,
      whirl: 0,
      pixelate: 0,
      mosaic: 0,
      brightness: 0,
      ghost: 0
    };
  };

  Base.prototype.fromJSON = function(data) {
    this.objName = data.objName;
    this.scripts = data.scripts;
    this.currentCostumeIndex = data.currentCostumeIndex || 0;
    this.costumes = data.costumes.map(function(d, i) {
      return new Costume(d, i, this);
    }, this);
    this.addSounds(data.sounds);
    this.addLists(data.lists);
    this.addVariables(data.variables);

    return this;
  };

  Base.prototype.addSounds = function(sounds) {
    for (var i = 0; i < sounds.length; i++) {
      var s = new Sound(sounds[i]);
      this.sounds.push(s);
      this.soundRefs[s.name] = s;
    }
  };

  Base.prototype.addVariables = function(variables) {
	


  	loadCookie();
	
	
	
    for (var i = 0; i < variables.length; i++) {
      
	
		
		
	 
	  
	  	if(variables[i].name.substring(variables[i].name.indexOf(".")+1,variables[i].name.indexOf(".")+3) == 'p.' ){
				
				if(sulfCookieSaved[variables[i].name] == null){
					
					sulfCookieSaved[variables[i].name] = " ";
					
				}
				
				this.vars[variables[i].name] = sulfCookieSaved[variables[i].name];
				
			}else{
				this.vars[variables[i].name] = variables[i].value;
			}
      
    }
  };

  Base.prototype.addLists = function(lists) {
    for (var i = 0; i < lists.length; i++) {
      if (lists[i].isPeristent) {
        throw new Error('Cloud lists are not supported');
      }
      this.lists[lists[i].listName] = lists[i].contents;
      // TODO list watchers
    }
  };

  Base.prototype.showVariable = function(name, visible) {
    var watcher = this.watchers[name];
    var stage = this.stage;
    if (!watcher) {
      watcher = this.watchers[name] = new P.Watcher(stage);
      watcher.x = stage.defaultWatcherX;
      watcher.y = stage.defaultWatcherY;
      stage.defaultWatcherY += 26;
      if (stage.defaultWatcherY >= 450) {
        stage.defaultWatcherY = 10;
        stage.defaultWatcherX += 150;
      }
      watcher.target = this;
      watcher.label = (watcher.target === stage ? '' : watcher.target.objName + ': ') + name;
      watcher.param = name;
      stage.children.push(watcher);
    } else {
      var i = stage.children.indexOf(watcher);
      if (i !== stage.children.length - 1) {
        stage.children.splice(i, 1);
        stage.children.push(watcher);
      }
    }
    watcher.visible = visible;
  };

  Base.prototype.showNextCostume = function() {
    this.currentCostumeIndex = (this.currentCostumeIndex + 1) % this.costumes.length;
    if (this.isStage) this.updateBackdrop();
    if (this.saying) this.updateBubble();
  };

  Base.prototype.showPreviousCostume = function() {
    var length = this.costumes.length;
    this.currentCostumeIndex = (this.currentCostumeIndex + length - 1) % length;
    if (this.isStage) this.updateBackdrop();
    if (this.saying) this.updateBubble();
  };

  Base.prototype.getCostumeName = function() {
    return this.costumes[this.currentCostumeIndex] ? this.costumes[this.currentCostumeIndex].costumeName : '';
  };

  Base.prototype.setCostume = function(costume) {	
  if(typeof costume == 'string'){
  
		for (var i = 0; i < this.costumes.length; i++) {
        if (this.costumes[i].costumeName === costume) {
          this.currentCostumeIndex = i;
          if (this.isStage) this.updateBackdrop();
          if (this.saying) this.updateBubble();
          return;
        }
      }
      if (costume === (this.isSprite ? 'next costume' : 'next backdrop')) {
        this.showNextCostume();
        return;
      }
      if (costume === (this.isSprite ? 'previous costume' : 'previous backdrop')) {
        this.showPreviousCostume();
        return;
      }
  }
     if(!isNaN(parseInt(costume))){
	
	
		var i = (Math.round(Number(costume)) - 1) % this.costumes.length;
		if (i < 0) i += this.costumes.length;
		this.currentCostumeIndex = i;
		if (this.isStage) this.updateBackdrop();
		if (this.saying) this.updateBubble();
	 }
  };

  Base.prototype.setFilter = function(name, value) {
    var min = 0;
    var max = 100;
    switch (name) {
      case 'whirl':
      case 'fisheye':
      case 'brightness':
      case 'pixelate': // absolute value
      case 'mosaic': // absolute value
        min = -Infinity;
        max = Infinity;
        break;
      case 'color':
	  
        value = value % 200;
        if (value < 0) value += 200;
        max = 200;
		
        break;
    }
    if (value < min) value = min;
    if (value > max) value = max;
    value = Math.min(max, Math.max(min, value));
    this.filters[name] = value;
    if (this.isStage) this.updateFilters();
  };

  Base.prototype.changeFilter = function(name, value) {
    this.setFilter(name, this.filters[name] + value);
  };

  Base.prototype.resetFilters = function() {
    this.filters = {
      color: 0,
      fisheye: 0,
      whirl: 0,
      pixelate: 0,
      mosaic: 0,
      brightness: 0,
      ghost: 0
    };
  };

  Base.prototype.getSound = function(name) {
    if (typeof name === 'string') {
      var s = this.soundRefs[name];
      if (s) return s;
      name = +name;
    }
    var l = this.sounds.length;
    if (l && typeof name === 'number' && name === name) {
      var i = Math.round(name - 1) % l;
      if (i < 0) i += l;
      return this.sounds[i];
    }
  };

  Base.prototype.stopSounds = function() {
    if (this.node) {
      this.node.disconnect();
      this.node = null;
    }
    for (var i = this.sounds.length; i--;) {
      var s = this.sounds[i];
      if (s.node) {
        s.node.disconnect();
        s.node = null;
      }
    }
  };

  Base.prototype.ask = function(question) {
    var stage = this.stage;
    if (question) {
      if (this.isSprite && this.visible) {
        this.say(question);
        stage.promptTitle.style.display = 'none';
      } else {
        stage.promptTitle.style.display = 'block';
        stage.promptTitle.textContent = question;
      }
    } else {
      stage.promptTitle.style.display = 'none';
    }
    stage.hidePrompt = false;
    stage.prompter.style.display = 'block';
    stage.prompt.value = '';
    stage.prompt.focus();
  };

  var Stage = function() {
    this.stage = this;

    Stage.parent.call(this);

    this.children = [];
    this.defaultWatcherX = 10;
    this.defaultWatcherY = 10;

    this.info = {};
    this.answer = '';
    this.promptId = 0;
    this.nextPromptId = 0;
    this.tempoBPM = 60;
    this.videoAlpha = 1;
    this.zoomX = 1;
	  this.zoomY = 1;
    this.maxZoomX = SCALE;
	  this.maxZoomY = SCALE;
    this.baseNow = 0;
    this.baseTime = 0;
    this.timerStart = 0;

    this.keys = []
    this.keys[128] = 0;
    this.rawMouseX = 0;
    this.rawMouseY = 0;
    this.mouseX = 0;
    this.mouseY = 0;
    this.mousePressed = false;
			this.alpha = 0;
			this.beta = 1;
			this.gamma = 2;

    this.root = document.createElement('div');
    this.root.style.position = 'absolute';
    this.root.style.overflow = 'hidden';
    this.root.style.width = '480px';
    this.root.style.height = '360px';
    this.root.style.fontSize = '10px';
    this.root.style.background = '#fff';
    this.root.style.WebkitUserSelect =
    this.root.style.MozUserSelect =
    this.root.style.MSUserSelect =
    this.root.style.WebkitUserSelect = 'none';

    /********************   BACKDROP Canvas   ********************/
    
    this.backdropCanvas = document.createElement('canvas');
    this.root.appendChild(this.backdropCanvas);
    this.backdropCanvas.width = SCALE * 480;
    this.backdropCanvas.height = SCALE * 360;
    this.backdropCanvas.setAttribute('id', 'backdropCanvas');
    //this.backdropContext = this.backdropCanvas.getContext('2d');
    this.backdropContext = this.backdropCanvas.getContext('webgl') ||
                           this.backdropCanvas.getContext('experimental-webgl');
    
    if(!this.backdropContext) P.showWebGLError('backdropContext could not be initialized.');
    
    this.backdropContext.imgShader = initShaderProgram(this.backdropContext, Shader.imgVert, Shader.imgFrag);
    
    this.backdropContext.imgShaderInfo = {
      program: this.backdropContext.imgShader,
      attribLocations: {
        position: this.backdropContext.getAttribLocation(this.backdropContext.imgShader, 'position'),
        texcoord: this.backdropContext.getAttribLocation(this.backdropContext.imgShader, 'texcoord'),
      },
      uniformLocations: {
        matrix:      this.backdropContext.getUniformLocation(this.backdropContext.imgShader, 'u_matrix'),
        texture:     this.backdropContext.getUniformLocation(this.backdropContext.imgShader, 'u_texture'),
        texSize:     this.backdropContext.getUniformLocation(this.backdropContext.imgShader, 'texSize'),
        colorEffect: this.backdropContext.getUniformLocation(this.backdropContext.imgShader, 'colorEffect'),
        colorMatrix: this.backdropContext.getUniformLocation(this.backdropContext.imgShader, 'colorMatrix'),
        texEffect:   this.backdropContext.getUniformLocation(this.backdropContext.imgShader, 'texEffect'),        
      },
      blendSource: this.backdropContext.SRC_ALPHA,
      blendDest: this.backdropContext.ONE_MINUS_SRC_ALPHA,      
    }
    this.backdropContext.imgBuffers = initImgBuffers(this.backdropContext);
    
    /********************   PEN Canvas   ********************/
    
    this.penCanvas = document.createElement('canvas');
    this.root.appendChild(this.penCanvas);
    this.penCanvas.width = SCALE * 480;
    this.penCanvas.height = SCALE * 360;
    this.penCanvas.setAttribute('id', 'penCanvas');
    //this.penCanvas.setAttribute('style', 'display: none');
    //this.penContext = this.penCanvas.getContext('2d');
    //this.penContext.lineCap = 'butt';
    //this.penContext.scale(SCALE, SCALE);
    this.penContext = this.penCanvas.getContext('webgl', {preserveDrawingBuffer: true}) ||
                      this.penCanvas.getContext('experimental-webgl', {preserveDrawingBuffer: true});
    
    if(!this.penContext) P.showWebGLError('penContext could not be initialized.');
    
		// Scene is automatically redrawn when arrays are full.
		// Thus, we don't need to call new float32Array() when creating the VBOs,
		// which would cause stutter due to garbage collection.
		//
		// Possibly tweak values for optimal performance.
    this.penCoords = new Float32Array(65536);
    this.penLines  = new Float32Array(32768);
    this.penColors = new Float32Array(65536);
    this.penCoordIndex = 0;
    this.penLineIndex  = 0;
    this.penColorIndex = 0;
    
    // Load and compile shaders
    this.penContext.penShader = initShaderProgram(this.penContext, Shader.penVert, Shader.penFrag);
    
    this.penContext.penShaderInfo = {
      program: this.penContext.penShader,
      attribLocations: {
        vertexData:       this.penContext.getAttribLocation(this.penContext.penShader, 'vertexData'),
        lineData:         this.penContext.getAttribLocation(this.penContext.penShader, 'lineData'),
        colorData:        this.penContext.getAttribLocation(this.penContext.penShader, 'colorData'),
      },
      uniformLocations: {
        projectionMatrix: this.penContext.getUniformLocation(this.penContext.penShader, 'uProjectionMatrix'),
        modelViewMatrix:  this.penContext.getUniformLocation(this.penContext.penShader, 'uModelViewMatrix'),
      },     
    };  
    this.penContext.penBuffers = {
      position: this.penContext.createBuffer(),
      line: this.penContext.createBuffer(),
      color: this.penContext.createBuffer(), 
    };
    
    
    this.penContext.imgShader = initShaderProgram(this.penContext, Shader.imgVert, Shader.imgFrag);
    
    this.penContext.imgShaderInfo = {
      program: this.penContext.imgShader,
      attribLocations: {
        position: this.penContext.getAttribLocation(this.penContext.imgShader, 'position'),
        texcoord: this.penContext.getAttribLocation(this.penContext.imgShader, 'texcoord'),
      },
      uniformLocations: {
        matrix:      this.penContext.getUniformLocation(this.penContext.imgShader, 'u_matrix'),
        texture:     this.penContext.getUniformLocation(this.penContext.imgShader, 'u_texture'),
        texSize:     this.penContext.getUniformLocation(this.penContext.imgShader, 'texSize'),
        colorEffect: this.penContext.getUniformLocation(this.penContext.imgShader, 'colorEffect'),
        colorMatrix: this.penContext.getUniformLocation(this.penContext.imgShader, 'colorMatrix'),
        texEffect:   this.penContext.getUniformLocation(this.penContext.imgShader, 'texEffect'),             
      },
      blendSource: this.penContext.SRC_ALPHA,
      blendDest: this.penContext.ONE_MINUS_SRC_ALPHA,      
    }
    this.penContext.imgBuffers = initImgBuffers(this.penContext);
    
    /********************   COSTUME Canvas   ********************/
    
    this.canvas = document.createElement('canvas');
    this.root.appendChild(this.canvas);
    this.canvas.width = SCALE * 480;
    this.canvas.height = SCALE * 360;
    this.canvas.setAttribute('id', 'canvas');
    //this.context = this.canvas.getContext('2d');
    this.context = this.canvas.getContext('webgl') ||
                   this.canvas.getContext('experimental-webgl');
    
    if(!this.context) P.showWebGLError('context could not be initialized.');
    
    this.context.imgShader = initShaderProgram(this.context, Shader.imgVert, Shader.imgFrag);
    
    this.context.imgShaderInfo = {
      program: this.context.imgShader,
      attribLocations: {
        position:    this.context.getAttribLocation(this.context.imgShader, 'position'),
        texcoord:    this.context.getAttribLocation(this.context.imgShader, 'texcoord'),
      },
      uniformLocations: {
        matrix:      this.context.getUniformLocation(this.context.imgShader, 'u_matrix'),
        texture:     this.context.getUniformLocation(this.context.imgShader, 'u_texture'),
        texSize:     this.context.getUniformLocation(this.context.imgShader, 'texSize'),
        colorEffect: this.context.getUniformLocation(this.context.imgShader, 'colorEffect'),
        colorMatrix: this.context.getUniformLocation(this.context.imgShader, 'colorMatrix'),
        texEffect:   this.context.getUniformLocation(this.context.imgShader, 'texEffect'),
      },
      blendSource: this.context.SRC_ALPHA,
      blendDest: this.context.ONE_MINUS_SRC_ALPHA,      
    }
    this.context.imgBuffers = initImgBuffers(this.context);
    
    /********************   COLLISION Canvas   ********************/
    
    this.glCollisionCanvas = document.createElement('canvas');
    this.root.appendChild(this.glCollisionCanvas);
    this.glCollisionCanvas.width = 480;
    this.glCollisionCanvas.height = 360;
    this.glCollisionCanvas.setAttribute('id', 'glCollisionCanvas');
    this.glCollisionCanvas.setAttribute('style', 'display: none;');
    this.glCollisionContext = this.glCollisionCanvas.getContext('webgl', {preserveDrawingBuffer: true}) ||
                              this.glCollisionCanvas.getContext('experimental-webgl', {preserveDrawingBuffer: true});
    
    if(!this.glCollisionContext) P.showWebGLError('glCollisionContext could not be initialized.');

    //Scissor test for faster collision detection.
    this.stage.glCollisionContext.enable(this.stage.glCollisionContext.SCISSOR_TEST);    
    this.stage.glCollisionContext.scissor(0, 0, 480, 360);
 
    this.glCollisionContext.imgShader = initShaderProgram(this.glCollisionContext, Shader.imgVert, Shader.imgFrag);
    
    this.glCollisionContext.imgShaderInfo = {
      program: this.glCollisionContext.imgShader,
      attribLocations: {
        position:    this.glCollisionContext.getAttribLocation(this.glCollisionContext.imgShader, 'position'),
        texcoord:    this.glCollisionContext.getAttribLocation(this.glCollisionContext.imgShader, 'texcoord'),
      },
      uniformLocations: {
        matrix:      this.glCollisionContext.getUniformLocation(this.glCollisionContext.imgShader, 'u_matrix'),
        texture:     this.glCollisionContext.getUniformLocation(this.glCollisionContext.imgShader, 'u_texture'),
        texSize:     this.glCollisionContext.getUniformLocation(this.glCollisionContext.imgShader, 'texSize'),
        colorEffect: this.glCollisionContext.getUniformLocation(this.glCollisionContext.imgShader, 'colorEffect'),
        colorMatrix: this.glCollisionContext.getUniformLocation(this.glCollisionContext.imgShader, 'colorMatrix'),
        texEffect:   this.glCollisionContext.getUniformLocation(this.glCollisionContext.imgShader, 'texEffect'),
      },  
      blendSource: this.glCollisionContext.SRC_ALPHA,
      blendDest: this.glCollisionContext.ONE_MINUS_SRC_ALPHA,
    }
    this.glCollisionContext.imgBuffers = initImgBuffers(this.glCollisionContext);    
    
    
    
    this.glCollisionContext.touchingShader = initShaderProgram(this.glCollisionContext, Shader.touchingVert, Shader.touchingFrag);
    
    this.glCollisionContext.touchingShaderInfo = {
      program: this.glCollisionContext.touchingShader,
      attribLocations: {
        position:    this.glCollisionContext.getAttribLocation(this.glCollisionContext.touchingShader, 'position'),
        texcoord:    this.glCollisionContext.getAttribLocation(this.glCollisionContext.touchingShader, 'texcoord'),        
      },
      uniformLocations: {
        matrix:      this.glCollisionContext.getUniformLocation(this.glCollisionContext.touchingShader, 'u_matrix'),
        texture:     this.glCollisionContext.getUniformLocation(this.glCollisionContext.touchingShader, 'u_texture'),
        tColor:      this.glCollisionContext.getUniformLocation(this.glCollisionContext.touchingShader, 'tColor'),
        texSize:     this.glCollisionContext.getUniformLocation(this.glCollisionContext.touchingShader, 'texSize'),
        colorEffect: this.glCollisionContext.getUniformLocation(this.glCollisionContext.touchingShader, 'colorEffect'),
        colorMatrix: this.glCollisionContext.getUniformLocation(this.glCollisionContext.touchingShader, 'colorMatrix'),
        texEffect:   this.glCollisionContext.getUniformLocation(this.glCollisionContext.touchingShader, 'texEffect'),   
      },
      blendSource: this.glCollisionContext.DST_ALPHA,
      blendDest: this.glCollisionContext.ZERO,      
    }
    
    
    this.canvas.tabIndex = 0;
    this.canvas.style.outline = 'none';
    this.backdropCanvas.style.position =
    this.penCanvas.style.position =
    this.canvas.style.position =
    this.glCollisionCanvas.style.position = 'absolute';
    this.backdropCanvas.style.width =
    this.penCanvas.style.width =
    this.canvas.style.width =
    this.glCollisionCanvas.style.width = '480px';
    this.backdropCanvas.style.height =
    this.penCanvas.style.height =
    this.canvas.style.height =
    this.glCollisionCanvas.style.height = '360px';
    
    //this.glCollisionCanvas.style.width = '240px';
    //this.glCollisionCanvas.style.height = '180px';
    
    this.backdropContext.clearColor(0.0, 0.0, 0.0, 0.0);
    this.penContext.clearColor(0.0, 0.0, 0.0, 0.0);
    this.context.clearColor(0.0, 0.0, 0.0, 0.0);
    this.glCollisionContext.clearColor(0.0, 0.0, 0.0, 0.0);

    // hardware acceleration
    this.root.style.WebkitTransform = 'translateZ(0)';

    // added old way here and split...
	  
     this.root.addEventListener('keypress', function(e) { // pf shift symbols helper.
       if (ASCII) {
	 
           if (e.altKey || e.metaKey || e.keyCode === 27) { // tjvr
             //return; // PF allow e.ctrlKey || allow e.shiftkey
           }
           var key = e.keyCode;

           //console.log(this.keys[key]); // debug only
           if (e.target === this.canvas && !this.keys[key]) {

	     ShiftKey = false;
	     if (key > 64 && key < 91) {
	       ShiftKey = true;	 
	     }		   
		   
	     this.keys[key] = true; // mandatory for symbols
	     self.key = key; // resets symbol keys
	     e.stopPropagation();
             e.preventDefault();
             //this.trigger('whenKeyPressed', key); // *
           }
	 
       } else {
	     // TODO: as before (not needed)      
       }	       
    }.bind(this));

    this.root.addEventListener('keydown', function(e) { // pf inc. arrow keys and shift key mapper
      if (ASCII) {

          if (e.altKey || e.metaKey || e.keyCode === 27) { // tjvr
            return; // PF allow e.ctrlKey || 
          }
          var key = e.keyCode;
	        //console.log(key); // debug only
          e.stopPropagation();
          if (e.target === this.canvas && !this.keys[key] && "16.17.37.38.39.40".match(key.toString())) { // 
	    if (key == 16) key = 128; // (Shift key hack) was 0
	    //if (key == 17) key = 0;  
	    if (key == 37) key = 28;
	    if (key == 39) key = 29;
	    if (key == 38) key = 30;
	    if (key == 40) key = 31;
	    this.keys[key] = true; // pf done in keypress?
	    self.key = key;
            e.preventDefault();
	    if (ShiftKey) {
	      //console.log("Shift Pressed\n"); // debug only
              this.trigger('whenKeyPressed', 128);
	      //this.trigger('whenKeyPressed', key);
	    } else {
	      this.trigger('whenKeyPressed', key);	    
	    }
          }
	
      } else {
        // TODO: as before    
        if (e.altKey || e.metaKey || e.keyCode === 27) { // tjvr
          return; // PF allow e.ctrlKey || 
        }
        //console.log(e.keyCode)+"\n";
        this.keys[e.keyCode] = true;
        e.stopPropagation();
        if (e.target === this.canvas) {
          e.preventDefault();
          this.trigger('whenKeyPressed', e.keyCode);
        }	       
      }	       
    }.bind(this));	  
	  
    this.root.addEventListener('keyup', function(e) {
      if (ASCII) {
    
          var key = e.keyCode;
	  if (key == 16) key = 128; 
          //console.log(key); // db2
          this.keys[key] = false;
          if (key > 64 && key < 91) this.keys[key+32] = false; // was +32
          this.keys[self.key] = false;
          if (ShiftKey) {
	    //this.keys[128] = false;
	  } else {
	    //console.log (self.key + " :: " + key); // debug only
	  }
          e.stopPropagation();
          if (e.target === this.canvas) {
            e.preventDefault();
          }

      } else {
	// TODO: as before   
        this.keys[e.keyCode] = false;
        e.stopPropagation();
        if (e.target === this.canvas) {
          e.preventDefault();
        }	       
      }
    }.bind(this));
	
	//Changed this to include both event listeners, otherwise Hybrid laptops may not work. Possibly add extra option for hybrids instead.
    //if (hasTouchEvents) {

      document.addEventListener('touchstart', function(e) {
        this.mousePressed = true;
        for (var i = 0; i < e.changedTouches.length; i++) {
          this.updateMouse(e.changedTouches[i]);
          if (e.target === this.canvas) {
            this.clickMouse();
          }
        }
        if (e.target === this.canvas) e.preventDefault();
      }.bind(this));

      document.addEventListener('touchmove', function(e) {
        this.updateMouse(e.changedTouches[0]);
      }.bind(this));

      document.addEventListener('touchend', function(e) {
        this.releaseMouse();
      }.bind(this));
	  
	  // Eventlistener for starting audio on mobile.
	  document.addEventListener('touchend', function(e) {
		if(!audioContext.mInit){
		  audioContext.mInit = true;
		  var osc = audioContext.createOscillator();
		  osc.frequency.value = 0;
		  osc.connect(audioContext.destination);
		  osc.start(0);
		  osc.stop(0);
		}
	  }.bind(this));
	  
	  
	  //if(hasTouchEvents){

    //} else {

      document.addEventListener('mousedown', function(e) {
        this.updateMouse(e);
        this.mousePressed = true;

        if (e.target === this.canvas) {
          this.clickMouse();
          e.preventDefault();
          this.canvas.focus();
        }
      }.bind(this));

      document.addEventListener('mousemove', function(e) {
        this.updateMouse(e);
      }.bind(this));

      document.addEventListener('mouseup', function(e) {
        this.updateMouse(e);
        this.releaseMouse();
      }.bind(this));
    //}

	
	
    this.prompter = document.createElement('div');
    this.root.appendChild(this.prompter);
    this.prompter.style.zIndex = '1';
    this.prompter.style.pointerEvents = 'auto';
    this.prompter.style.position = 'absolute';
    this.prompter.style.left =
    this.prompter.style.right = '1.4em';
    this.prompter.style.bottom = '.6em';
    this.prompter.style.padding = '.5em 3.0em .5em .5em';
    this.prompter.style.border = '.3em solid rgb(46, 174, 223)';
    this.prompter.style.borderRadius = '.8em';
    this.prompter.style.background = '#fff';
    this.prompter.style.display = 'none';

    this.promptTitle = document.createElement('div');
    this.prompter.appendChild(this.promptTitle);
    this.promptTitle.textContent = '';
    this.promptTitle.style.cursor = 'default';
    this.promptTitle.style.font = 'bold 1.3em sans-serif';
    this.promptTitle.style.margin = '0 '+(-25/13)+'em '+(5/13)+'em 0';
    this.promptTitle.style.whiteSpace = 'pre';
    this.promptTitle.style.overflow = 'hidden';
    this.promptTitle.style.textOverflow = 'ellipsis';

    this.prompt = document.createElement('input');
    this.prompter.appendChild(this.prompt);
    this.prompt.style.border = '0';
    this.prompt.style.background = '#eee';
    this.prompt.style.MozBoxSizing =
    this.prompt.style.boxSizing = 'border-box';
    this.prompt.style.font = '1.3em sans-serif';
    this.prompt.style.padding = '0 '+(3/13)+'em';
    this.prompt.style.outline = '0';
    this.prompt.style.margin = '0';
    this.prompt.style.width = '100%';
    this.prompt.style.height = ''+(20/13)+'em';
    this.prompt.style.display = 'block';
    this.prompt.style.WebkitBorderRadius =
    this.prompt.style.borderRadius = '0';
    this.prompt.style.WebkitBoxShadow =
    this.prompt.style.boxShadow = 'inset '+(1/13)+'em '+(1/13)+'em '+(2/13)+'em rgba(0, 0, 0, .2), inset '+(-1/13)+'em '+(-1/13)+'em '+(1/13)+'em rgba(255, 255, 255, .2)';
    this.prompt.style.WebkitAppearance = 'none';

    this.promptButton = document.createElement('div');
    this.prompter.appendChild(this.promptButton);
    this.promptButton.style.width = '2.2em';
    this.promptButton.style.height = '2.2em';
    this.promptButton.style.position = 'absolute';
    this.promptButton.style.right = '.4em';
    this.promptButton.style.bottom = '.4em';
    this.promptButton.style.background = 'url(/img/icons.svg) -16.5em -3.7em';
    this.promptButton.style.backgroundSize = '32.0em 9.6em';

    this.prompt.addEventListener('keydown', function(e) {
      if (e.keyCode === 13) {
        this.submitPrompt();
      }
    }.bind(this));

    this.promptButton.addEventListener(hasTouchEvents ? 'touchstart' : 'mousedown', this.submitPrompt.bind(this));

    this.initRuntime();
  };
  inherits(Stage, Base);

  Stage.prototype.isStage = true;

  Stage.prototype.fromJSON = function(data) {
    Stage.parent.prototype.fromJSON.call(this, data);

    data.children.forEach(function(d) {
      if (d.listName) return;
      this.children.push(new (d.cmd ? Watcher : Sprite)(this).fromJSON(d));
    }, this);

    this.children.forEach(function(child) {
      if (child.resolve) child.resolve();
    }, this);

    P.compile(this);

    return this;
  };

  Stage.prototype.focus = function() {
    if (this.promptId < this.nextPromptId) {
      this.prompt.focus();
    } else {
      this.canvas.focus();
    }
  };

  Stage.prototype.updateMouse = function(e) {
    var bb = this.canvas.getBoundingClientRect();
	 var z = Math.max(this.zoomX, this.zoomY);
    var x = (e.clientX - bb.left) / z - 240;
    var y = 180 - (e.clientY - bb.top) / z;
    this.rawMouseX = x;
    this.rawMouseY = y;
    if (x < -240) x = -240;
    if (x > 240) x = 240;
    if (y < -180) y = -180;
    if (y > 180) y = 180;
    this.mouseX = x;
    this.mouseY = y;
  };

  Stage.prototype.updateOrientation = function(data) {
			self.stage.alpha = data.do.alpha;
			self.stage.beta = data.do.beta;
			self.stage.gamma = data.do.gamma;
	}
  
  
  Stage.prototype.updateBackdrop = function() {
    this.backdropCanvas.width = this.zoomX * SCALE * 480;
    this.backdropCanvas.height = this.zoomY * SCALE * 360;
    var costume = this.costumes[this.currentCostumeIndex];
    
    /*
    this.backdropContext.save();
    var s = Math.max(this.zoomX * SCALE * costume.scale, this.zoomY * SCALE * costume.scale);
    this.backdropContext.scale(s, s);    
    this.backdropContext.drawImage(costume.image, 0, 0, costume.image.width/costume.resScale, costume.image.height/costume.resScale);    
    this.backdropContext.restore();
    */
    
    var imgInfo = costume.image.imgInfo;
    
    glDrawImage(
      this.backdropContext,
      this.backdropContext.imgShaderInfo,
      this.backdropContext.imgBuffers,
      imgInfo,
      //(imgInfo.width / costume.resScale / 2 - costume.rotationCenterX / 480 * imgInfo.width / costume.resScale) * costume.scale,
      (imgInfo.width / costume.resScale * costume.scale - 480) / 2,
      -(imgInfo.height / costume.resScale * costume.scale - 360) / 2,
      imgInfo.width / costume.resScale * costume.scale,
      imgInfo.height / costume.resScale * costume.scale,
      0,
      0,
      0);
  };
	
  Stage.prototype.updateFilters = function() {
	  
    this.backdropCanvas.style.opacity = Math.max(0, Math.min(1, 1 - this.filters.ghost / 100));
  };

  Stage.prototype.setZoom = function(zoomX, zoomY) {
    if ((this.zoomX === zoomX) && (this.zoomY === zoomY)) return;
	  var ps = Math.max(zoomX, zoomY);
    if ((this.maxZoomX < zoomX * SCALE) || (this.maxZoomY < zoomY * SCALE)) {
      this.maxZoomX = zoomX * SCALE;
	    this.maxZoomY = zoomY * SCALE;
      //var canvas = document.createElement('canvas');
      //canvas.width = this.penCanvas.width;
      //canvas.height = this.penCanvas.height;
      //canvas.getContext('2d').drawImage(this.penCanvas, 0, 0);
      
      var imgInfo = glMakeTexture(this.penContext, this.penCanvas);

      this.penCanvas.width = 480 * ps * SCALE;
      this.penCanvas.height = 360 * ps * SCALE;
      
      glDrawImage(
        this.penContext,
        this.penContext.imgShaderInfo,
        this.penContext.imgBuffers,
        imgInfo,
        0,
        0,
        480,
        360,
        0,
        0,
        0);
      
      this.penContext.deleteTexture(imgInfo.texture);
      imgInfo = null;
      
      //this.penContext.drawImage(canvas, 0, 0, 480 * ps * SCALE, 360 * ps * SCALE);
      //this.penContext.scale(this.maxZoomX, this.maxZoomY);
      //this.penContext.lineCap = 'butt';	
    }
    
    
    this.canvas.width = 
    this.backdropCanvas.width =
    this.glCollisionContext.width = (480 * zoomX | 0);
    this.canvas.height = 
    this.backdropCanvas.height =
    this.glCollisionContext.height = (360 * zoomY | 0);
    
    
    this.root.style.width =
    this.canvas.style.width =
    this.backdropCanvas.style.width =
    this.glCollisionCanvas.style.width = (480 * zoomX | 0) + 'px';
    this.penCanvas.style.width = (480 * ps | 0) + 'px';
    this.root.style.height =
    this.canvas.style.height =
    this.backdropCanvas.style.height =
    this.glCollisionCanvas.style.height = (360 * zoomY | 0) + 'px';
    this.penCanvas.style.height = (360 * ps | 0) + 'px';
    this.root.style.fontSize = ps * 10 + 'px';
    this.zoomX = zoomX;
	  this.zoomY = zoomY;
    this.updateBackdrop();
  };

  Stage.prototype.clickMouse = function() {
    this.mouseSprite = undefined;
    for (var i = this.children.length; i--;) {
      var c = this.children[i];
      if (c.isSprite && c.visible && c.filters.ghost < 100 && c.touching('_mouse_')) {
        if (c.isDraggable) {
          this.mouseSprite = c;
          c.mouseDown();
        } else {
          this.triggerFor(c, 'whenClicked');
        }
        return;
      }
    }
    this.triggerFor(this, 'whenClicked');
  };

  Stage.prototype.releaseMouse = function() {
    this.mousePressed = false;
    if (this.mouseSprite) {
      this.mouseSprite.mouseUp();
      this.mouseSprite = undefined;
    }
  };

  Stage.prototype.stopAllSounds = function() {
    for (var children = this.children, i = children.length; i--;) {
      if (children[i].isSprite) {
        children[i].stopSounds();
      }
    }
    this.stopSounds();
  };

  Stage.prototype.removeAllClones = function() {
    var i = this.children.length;
    while (i--) {
      if (this.children[i].isClone) {
        this.children[i].remove();
        this.children.splice(i, 1);
      }
    }
  };

  Stage.prototype.getObject = function(name) {
    for (var i = 0; i < this.children.length; i++) {
      var c = this.children[i];
      if (c.objName === name && !c.isClone) {
        return c;
      }
    }
    if (name === '_stage_' || name === this.objName) {
      return this;
    }
  };

  Stage.prototype.getObjects = function(name) {
    var result = [];
    for (var i = 0; i < this.children.length; i++) {
      if (this.children[i].objName === name) {
        result.push(this.children[i]);
      }
    }
    return result;
  };

  Stage.prototype.draw = function() {
    var context = this.context;
	
    //this.canvas.width = 480 * this.zoomX * SCALE; // clear
    //this.canvas.height = 360 * this.zoomY * SCALE;
    
    context.clear(context.COLOR_BUFFER_BIT);
    
	  var s = Math.max(this.zoomX * SCALE, this.zoomY * SCALE);
    //context.scale(s, s);
    this.drawOn(context);
    
    if (this.hidePrompt) {
      this.hidePrompt = false;
      this.prompter.style.display = 'none';
      this.canvas.focus();
    }
    
		if(this.penCoordIndex){
      this.renderPen(this.penContext, this.penContext.penShaderInfo, this.penContext.penBuffers);
      this.penCoordIndex = 0;
      this.penLineIndex  = 0;
      this.penColorIndex = 0;
		}
  };

  Stage.prototype.drawOn = function(context, except) {
    for (var i = 0; i < this.children.length; i++) {
      if (this.children[i].visible && this.children[i] !== except ){
        this.children[i].draw(context);
      }
    }
  };

  Stage.prototype.drawAllOn = function(context, except) {
    var costume = this.costumes[this.currentCostumeIndex];
    
    /*
    context.save();
    context.scale(costume.scale, costume.scale);
    context.globalAlpha = Math.max(0, Math.min(1, 1 - this.filters.ghost / 100));    
    context.drawImage(costume.image, 0, 0, costume.image.width/costume.resScale, costume.image.height/costume.resScale);
    context.restore();
    */
 
    var tempTest = performance.now();
 
    glDrawImage(
      context,
      context.imgShaderInfo,
      context.imgBuffers,
      costume.image.collisionImgInfo,
      0,
      0,
      480,
      360,
      0,
      0,
      0);


      
    /*
    context.save();
	  var s = Math.max(this.maxZoomX, this.maxZoomY);
    context.scale(1 / s, 1 / s);
    context.drawImage(this.penCanvas, 0, 0);
    context.restore();
    */
    

    
    var imgInfo = glMakeTexture(context, this.penCanvas);
    
    glDrawImage(
      context,
      context.imgShaderInfo,
      context.imgBuffers,
      imgInfo,
      0,
      0,
      480,
      360,
      0,
      0,
      0);
      
    context.deleteTexture(imgInfo.texture);
    imgInfo = null;

    
    //console.log(performance.now() - tempTest);
    
    //this.drawOn(context, except);
    

    
    for (var i = 0; i < this.children.length; i++) {
      if (this.children[i].visible && this.children[i] !== except && !(this.children[i] instanceof Watcher)) {
        this.children[i].draw(context);
      }
    }    
  };

  Stage.prototype.moveTo = function() {};

  Stage.prototype.submitPrompt = function() {
    if (this.promptId < this.nextPromptId) {
      this.answer = this.prompt.value;
      this.promptId += 1;
      if (this.promptId >= this.nextPromptId) {
        this.hidePrompt = true;
      }
    }
  };
  
  Stage.prototype.renderPen = function(gl, programInfo, buffers){       
    gl.viewport(0, 0, this.penCanvas.width, this.penCanvas.height);
    
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    gl.disable(gl.DEPTH_TEST);
		
    //set up position buffer for coordinates
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
    gl.bufferData(gl.ARRAY_BUFFER,
                  this.penCoords,
                  gl.STREAM_DRAW);
    gl.vertexAttribPointer(
      programInfo.attribLocations.vertexData,
      4,
      gl.FLOAT,
      false,
      0,
      0);
    gl.enableVertexAttribArray(programInfo.attribLocations.vertexData);

    //set up line description buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.line);
    gl.bufferData(gl.ARRAY_BUFFER,
                  this.penLines,
                  gl.STREAM_DRAW);
    gl.vertexAttribPointer(
      programInfo.attribLocations.lineData,
      2,
      gl.FLOAT,
      false,
      0,
      0);
    gl.enableVertexAttribArray(programInfo.attribLocations.lineData);
    
    //set up color buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
    gl.bufferData(gl.ARRAY_BUFFER,
                  this.penColors,
                  gl.STREAM_DRAW);
    gl.vertexAttribPointer(
      programInfo.attribLocations.colorData,
      4,
      gl.FLOAT,
      false,
      0,
      0);
    gl.enableVertexAttribArray(programInfo.attribLocations.colorData);
		
    //draw pen lines as triangles.
    gl.useProgram(programInfo.program);
    gl.drawArrays(gl.TRIANGLES, 0, (this.penCoordIndex + 1) / 4);    
    
    /*
    var err
    if(err = gl.getError())
      console.log('WebGL Error: ' + err);
    */
  }
  
  var KEY_CODES = {
    'space': 32,
	  'ctrl': 17,
	  'shift': 16,
    'left arrow': 37,
    'up arrow': 38,
    'right arrow': 39,
    'down arrow': 40,
    'any': 128
	
  };

  var getKeyCode = function(keyName) {
	  if(typeof keyName !== 'string') keyName = "" + keyName;
	
  	return KEY_CODES[keyName.toLowerCase()] || keyName.toUpperCase().charCodeAt(0);
  };

  var Sprite = function(stage) {
    this.stage = stage;

    Sprite.parent.call(this);

    this.direction = 90;
    this.indexInLibrary = -1;
    this.isDraggable = false;
    this.isDragging = false;
    this.rotationStyle = 'normal';
    this.scale = 1;
    this.scratchX = 0;
    this.scratchY = 0;
    this.spriteInfo = {};
    this.visible = true;

    this.Hue = 240;
    this.penHue = 250;
    this.penSaturation = 100;
    this.penLightness = 50;

    this.penSize = 1;
    this.isPenDown = false;
    this.isSprite = true;
    this.bubble = null;
    this.saying = false;
    this.thinking = false;
    this.sayId = 0;
  };
  inherits(Sprite, Base);

  Sprite.prototype.fromJSON = function(data) {

    Sprite.parent.prototype.fromJSON.call(this, data);

    this.direction = data.direction;
    this.indexInLibrary = data.indexInLibrary;
    this.isDraggable = data.isDraggable;
    this.rotationStyle = data.rotationStyle;
    this.scale = data.scale;
    this.scratchX = data.scratchX;
    this.scratchY = data.scratchY;
    this.spriteInfo = data.spriteInfo;
    this.visible = data.visible;

    return this;
  };

  Sprite.prototype.clone = function() {
    var c = new Sprite(this.stage);

    c.isClone = true;
    c.costumes = this.costumes;
    c.currentCostumeIndex = this.currentCostumeIndex;
    c.objName = this.objName;
    c.soundRefs = this.soundRefs;
    c.sounds = this.sounds;

    var keys = Object.keys(this.vars);
    for (var i = keys.length; i--;) {
      var k = keys[i];
      c.vars[k] = this.vars[k];
    }

    var keys = Object.keys(this.lists);
    for (var i = keys.length; i--;) {
      var k = keys[i];
      c.lists[k] = this.lists[k].slice(0);
    }

    c.procedures = this.procedures;
    c.listeners = this.listeners;
    c.fns = this.fns;
    c.scripts = this.scripts;

    c.filters = {
      color: this.filters.color,
      fisheye: this.filters.fisheye,
      whirl: this.filters.whirl,
      pixelate: this.filters.pixelate,
      mosaic: this.filters.mosaic,
      brightness: this.filters.brightness,
      ghost: this.filters.ghost
    };

    c.direction = this.direction;
    c.indexInLibrary = this.indexInLibrary;
    c.isDraggable = this.isDraggable;
    c.rotationStyle = this.rotationStyle;
    c.scale = this.scale;
    c.volume = this.volume;
    c.scratchX = this.scratchX;
    c.scratchY = this.scratchY;
    c.visible = this.visible;
    c.penColor = this.penColor;
    
    // Pen color in RGB mode?
    c.penRGBA = this.penRGBA;
    // Pen color in RGBA
    c.penRed = this.penRed;
    c.penGreen = this.penGreen;
    c.penBlue = this.penBlue;
    c.penAlpha = this.penAlpha;
    //Pen color in HSL
    c.penHue = this.penHue;
    c.penSaturation = this.penSaturation;
    c.penLightness = this.penLightness;
    
    c.penSize = this.penSize;
    c.isPenDown = this.isPenDown;

    return c;
  };

  Sprite.prototype.mouseDown = function() {
    this.dragStartX = this.scratchX;
    this.dragStartY = this.scratchY;
    this.dragOffsetX = this.scratchX - this.stage.mouseX;
    this.dragOffsetY = this.scratchY - this.stage.mouseY;
    this.isDragging = true;
  };

  Sprite.prototype.mouseUp = function() {
    if (this.isDragging && this.scratchX === this.dragStartX && this.scratchY === this.dragStartY) {
      this.stage.triggerFor(this, 'whenClicked');
    }
    this.isDragging = false;
  };

  Sprite.prototype.forward = function(steps) {
    var d = (90 - this.direction) * Math.PI / 180;
    this.moveTo(this.scratchX + steps * Math.cos(d), this.scratchY + steps * Math.sin(d));
  };

  Sprite.prototype.moveTo = function(x, y) {
    var ox = this.scratchX;
    var oy = this.scratchY;
    if (ox === x && oy === y && !this.isPenDown) return;
    this.scratchX = x;
    this.scratchY = y;
    if (this.isPenDown && !this.isDragging) {
      var context = this.stage.penContext;
      if (this.penSize % 2 > .5 && this.penSize % 2 < 1.5) {
        ox -= .5;
        oy -= .5;
        x -= .5;
        y -= .5;
      }

      /*
      context.strokeStyle = this.penRGBA || 'hsl(' + this.penHue + ',' + this.penSaturation + '%,' + (this.penLightness > 100 ? 200 - this.penLightness : this.penLightness) + '%)';
      
      if(this.penSize > 2 * 480 / this.stage.penCanvas.width)
        this.dotPen();
      
      context.lineWidth = this.penSize;
      context.beginPath();
      context.moveTo(240 + ox, 180 - oy);
      context.lineTo(240 + x, 180 - y);
      context.stroke();    
      */			
      
      //calculate color for vertices
      var r, g, b, a;
      if(this.penRGBA){
        r = this.penRed;
        g = this.penGreen;
        b = this.penBlue;
        a = this.penAlpha;
      }
      else{
        var rgb = this.hsl2rgb(this.penHue, this.penSaturation, (this.penLightness > 100 ? 200 - this.penLightness : this.penLightness));
        r = rgb[0];
        g = rgb[1];
        b = rgb[2];
        a = 1;
      }
      
      /*
      console.log(this.penRGBA);
      console.log(this.penHue);
      console.log(this.penSaturation);
      console.log(this.penLightness);
      console.log(this.hsl2rgb(this.penHue, this.penSaturation, (this.penLightness > 100 ? 200 - this.penLightness : this.penLightness)));
      */
 
      var circleRes = Math.max(Math.ceil(this.penSize * Math.max(this.stage.zoomX, this.stage.zoomY)), 3);
 
			// Redraw when array is full.
			if(this.stage.penCoordIndex + 24 * (circleRes+1) > this.stage.penCoords.length){
				this.stage.renderPen(this.stage.penContext, this.stage.penContext.penShaderInfo, this.stage.penContext.penBuffers);
				this.stage.penCoordIndex = 0;
				this.stage.penLineIndex  = 0;
				this.stage.penColorIndex = 0;
			}
			
      // draw line
      {
      // first triangle
      // first coordinates
      this.stage.penCoords[this.stage.penCoordIndex] = ox;
      this.stage.penCoordIndex++;
      this.stage.penCoords[this.stage.penCoordIndex] = oy;
      this.stage.penCoordIndex++;

      // first coordinates supplement
      this.stage.penCoords[this.stage.penCoordIndex] = x;
      this.stage.penCoordIndex++;
      this.stage.penCoords[this.stage.penCoordIndex] = y;
      this.stage.penCoordIndex++;
      
      //first vertex description
      this.stage.penLines[this.stage.penLineIndex] = -Math.PI/2;
      this.stage.penLineIndex++;
      this.stage.penLines[this.stage.penLineIndex] = this.penSize/2;
      this.stage.penLineIndex++;
      
			
			
      // second coordinates
      this.stage.penCoords[this.stage.penCoordIndex] = x;
      this.stage.penCoordIndex++;
      this.stage.penCoords[this.stage.penCoordIndex] = y;
      this.stage.penCoordIndex++;

      // second coordinates supplement
      this.stage.penCoords[this.stage.penCoordIndex] = ox;
      this.stage.penCoordIndex++;
      this.stage.penCoords[this.stage.penCoordIndex] = oy;
      this.stage.penCoordIndex++;
      
      //second vertex description
      this.stage.penLines[this.stage.penLineIndex] = Math.PI/2;
      this.stage.penLineIndex++;
      this.stage.penLines[this.stage.penLineIndex] = this.penSize/2;
      this.stage.penLineIndex++;      
      
			
			
      // third coordinates
      this.stage.penCoords[this.stage.penCoordIndex] = ox;
      this.stage.penCoordIndex++;
      this.stage.penCoords[this.stage.penCoordIndex] = oy;
      this.stage.penCoordIndex++;

      // third coordinates supplement
      this.stage.penCoords[this.stage.penCoordIndex] = x;
      this.stage.penCoordIndex++;
      this.stage.penCoords[this.stage.penCoordIndex] = y;
      this.stage.penCoordIndex++;

      //second vertex description
      this.stage.penLines[this.stage.penLineIndex] = Math.PI/2;
      this.stage.penLineIndex++;
      this.stage.penLines[this.stage.penLineIndex] = this.penSize/2;
      this.stage.penLineIndex++;
      
      
      
      
      
      // second triangle
      // first coordinates
      this.stage.penCoords[this.stage.penCoordIndex] = ox;
      this.stage.penCoordIndex++;
      this.stage.penCoords[this.stage.penCoordIndex] = oy;
      this.stage.penCoordIndex++;

      // first coordinates supplement
      this.stage.penCoords[this.stage.penCoordIndex] = x;
      this.stage.penCoordIndex++;
      this.stage.penCoords[this.stage.penCoordIndex] = y;
      this.stage.penCoordIndex++;
      
      //first vertex description
      this.stage.penLines[this.stage.penLineIndex] = Math.PI/2;
      this.stage.penLineIndex++;
      this.stage.penLines[this.stage.penLineIndex] = this.penSize/2;
      this.stage.penLineIndex++;
      
			
			
      // second coordinates
      this.stage.penCoords[this.stage.penCoordIndex] = x;
      this.stage.penCoordIndex++;
      this.stage.penCoords[this.stage.penCoordIndex] = y;
      this.stage.penCoordIndex++;

      // second coordinates supplement
      this.stage.penCoords[this.stage.penCoordIndex] = ox;
      this.stage.penCoordIndex++;
      this.stage.penCoords[this.stage.penCoordIndex] = oy;
      this.stage.penCoordIndex++;
      
      //second vertex description
      this.stage.penLines[this.stage.penLineIndex] = -Math.PI/2;
      this.stage.penLineIndex++;
      this.stage.penLines[this.stage.penLineIndex] = this.penSize/2;
      this.stage.penLineIndex++;      
      
			
			
      // third coordinates
      this.stage.penCoords[this.stage.penCoordIndex] = x;
      this.stage.penCoordIndex++;
      this.stage.penCoords[this.stage.penCoordIndex] = y;
      this.stage.penCoordIndex++;

      // third coordinates supplement
      this.stage.penCoords[this.stage.penCoordIndex] = ox;
      this.stage.penCoordIndex++;
      this.stage.penCoords[this.stage.penCoordIndex] = oy;
      this.stage.penCoordIndex++;

      //second vertex description
      this.stage.penLines[this.stage.penLineIndex] = Math.PI/2;
      this.stage.penLineIndex++;
      this.stage.penLines[this.stage.penLineIndex] = this.penSize/2;
      this.stage.penLineIndex++;      
      }
      
     

      
      for(var i = 0; i < circleRes; i++){
        
        
        // first endcap
        // first coordinates
        this.stage.penCoords[this.stage.penCoordIndex] = x;
        this.stage.penCoordIndex++;
        this.stage.penCoords[this.stage.penCoordIndex] = y;
        this.stage.penCoordIndex++;

        // first coordinates supplement
        this.stage.penCoords[this.stage.penCoordIndex] = ox;
        this.stage.penCoordIndex++;
        this.stage.penCoords[this.stage.penCoordIndex] = oy;
        this.stage.penCoordIndex++;      

        // first vertex description
        this.stage.penLines[this.stage.penLineIndex] = 0;
        this.stage.penLineIndex++;
        this.stage.penLines[this.stage.penLineIndex] = 0;
        this.stage.penLineIndex++;       

        
        
         // second coordinates
        this.stage.penCoords[this.stage.penCoordIndex] = x;
        this.stage.penCoordIndex++;
        this.stage.penCoords[this.stage.penCoordIndex] = y;
        this.stage.penCoordIndex++;

        // second coordinates supplement
        this.stage.penCoords[this.stage.penCoordIndex] = ox;
        this.stage.penCoordIndex++;
        this.stage.penCoords[this.stage.penCoordIndex] = oy;
        this.stage.penCoordIndex++;      

        // second vertex description
        this.stage.penLines[this.stage.penLineIndex] = Math.PI/2 + i / circleRes * Math.PI;
        this.stage.penLineIndex++;
        this.stage.penLines[this.stage.penLineIndex] = this.penSize/2;
        this.stage.penLineIndex++; 
        
        
        
         // third coordinates
        this.stage.penCoords[this.stage.penCoordIndex] = x;
        this.stage.penCoordIndex++;
        this.stage.penCoords[this.stage.penCoordIndex] = y;
        this.stage.penCoordIndex++;

        // third coordinates supplement
        this.stage.penCoords[this.stage.penCoordIndex] = ox;
        this.stage.penCoordIndex++;
        this.stage.penCoords[this.stage.penCoordIndex] = oy;
        this.stage.penCoordIndex++;      

        // third vertex description
        this.stage.penLines[this.stage.penLineIndex] = Math.PI/2 + (i+1) / circleRes * Math.PI;
        this.stage.penLineIndex++;
        this.stage.penLines[this.stage.penLineIndex] = this.penSize/2;
        this.stage.penLineIndex++;     
        
        
        
        
        // second endcap
        // first coordinates
        this.stage.penCoords[this.stage.penCoordIndex] = ox;
        this.stage.penCoordIndex++;
        this.stage.penCoords[this.stage.penCoordIndex] = oy;
        this.stage.penCoordIndex++;

        // first coordinates supplement
        this.stage.penCoords[this.stage.penCoordIndex] = x;
        this.stage.penCoordIndex++;
        this.stage.penCoords[this.stage.penCoordIndex] = y;
        this.stage.penCoordIndex++;      

        // first vertex description
        this.stage.penLines[this.stage.penLineIndex] = 0;
        this.stage.penLineIndex++;
        this.stage.penLines[this.stage.penLineIndex] = 0;
        this.stage.penLineIndex++;       

        
        
         // second coordinates
        this.stage.penCoords[this.stage.penCoordIndex] = ox;
        this.stage.penCoordIndex++;
        this.stage.penCoords[this.stage.penCoordIndex] = oy;
        this.stage.penCoordIndex++;

        // second coordinates supplement
        this.stage.penCoords[this.stage.penCoordIndex] = x;
        this.stage.penCoordIndex++;
        this.stage.penCoords[this.stage.penCoordIndex] = y;
        this.stage.penCoordIndex++;      

        // second vertex description
        this.stage.penLines[this.stage.penLineIndex] = Math.PI/2 + i / circleRes * Math.PI;
        this.stage.penLineIndex++;
        this.stage.penLines[this.stage.penLineIndex] = this.penSize/2;
        this.stage.penLineIndex++; 
        
        
        
         // third coordinates
        this.stage.penCoords[this.stage.penCoordIndex] = ox;
        this.stage.penCoordIndex++;
        this.stage.penCoords[this.stage.penCoordIndex] = oy;
        this.stage.penCoordIndex++;

        // third coordinates supplement
        this.stage.penCoords[this.stage.penCoordIndex] = x;
        this.stage.penCoordIndex++;
        this.stage.penCoords[this.stage.penCoordIndex] = y;
        this.stage.penCoordIndex++;      

        // third vertex description
        this.stage.penLines[this.stage.penLineIndex] = Math.PI/2 + (i+1) / circleRes * Math.PI;
        this.stage.penLineIndex++;
        this.stage.penLines[this.stage.penLineIndex] = this.penSize/2;
        this.stage.penLineIndex++;         
      }
     
     
     
      
      // set color of vertices
      for(var i = 0; i < circleRes * 6 + 6; i++){
        this.stage.penColors[this.stage.penColorIndex] = r;
        this.stage.penColorIndex++;
        this.stage.penColors[this.stage.penColorIndex] = g;
        this.stage.penColorIndex++;
        this.stage.penColors[this.stage.penColorIndex] = b;
        this.stage.penColorIndex++;
        this.stage.penColors[this.stage.penColorIndex] = a;
        this.stage.penColorIndex++;
      }
      
      
      this.penState = true;
    }
    if (this.saying) {
      this.updateBubble();
    }
  };

  Sprite.prototype.dotPen = function() {
    var context = this.stage.penContext;
    var x = this.scratchX;
    var y = this.scratchY;
    /*
    context.fillStyle = this.penRGBA || 'hsl(' + this.penHue + ',' + this.penSaturation + '%,' + (this.penLightness > 100 ? 200 - this.penLightness : this.penLightness) + '%)';

    if(this.penSize <= 2 * 480 / this.stage.penCanvas.width){
      context.fillRect(240 + x - this.penSize, 180 - y, this.penSize, this.penSize);
    }
    else{
    context.beginPath();
      context.arc(240 + x, 180 - y, Math.floor(this.penSize / 2), 0, 2 * Math.PI, false);
      context.fill();
    }
    */
 
    //if(this.penSize > 2 * 480 / this.stage.penCanvas.width){
     
      //calculate color for vertices
      var r, g, b, a;
      if(this.penRGBA){
        r = this.penRed;
        g = this.penGreen;
        b = this.penBlue;
        a = this.penAlpha;
      }
      else{
        var rgb = this.hsl2rgb(this.penHue, this.penSaturation, (this.penLightness > 100 ? 200 - this.penLightness : this.penLightness));
        r = rgb[0];
        g = rgb[1];
        b = rgb[2];
        a = 1;
      }
   
      var circleRes = Math.max(Math.ceil(this.penSize * Math.max(this.stage.zoomX, this.stage.zoomY)), 3);
      
			// Redraw when array is full.
			if(this.stage.penCoordIndex + 12 * circleRes > this.stage.penCoords.length){
				this.stage.renderPen(this.stage.penContext, this.stage.penContext.penShaderInfo, this.stage.penContext.penBuffers);
				this.stage.penCoordIndex = 0;
				this.stage.penLineIndex  = 0;
				this.stage.penColorIndex = 0;
			}
			
      for(var i = 0; i < circleRes; i++){
        // first endcap
        // first coordinates
        this.stage.penCoords[this.stage.penCoordIndex] = x;
        this.stage.penCoordIndex++;
        this.stage.penCoords[this.stage.penCoordIndex] = y;
        this.stage.penCoordIndex++;

        // first coordinates supplement
        this.stage.penCoords[this.stage.penCoordIndex] = x;
        this.stage.penCoordIndex++;
        this.stage.penCoords[this.stage.penCoordIndex] = x;
        this.stage.penCoordIndex++;      

        // first vertex description
        this.stage.penLines[this.stage.penLineIndex] = 0;
        this.stage.penLineIndex++;
        this.stage.penLines[this.stage.penLineIndex] = 0;
        this.stage.penLineIndex++;       

        
        
         // second coordinates
        this.stage.penCoords[this.stage.penCoordIndex] = x;
        this.stage.penCoordIndex++;
        this.stage.penCoords[this.stage.penCoordIndex] = y;
        this.stage.penCoordIndex++;

        // second coordinates supplement
        this.stage.penCoords[this.stage.penCoordIndex] = x+1;
        this.stage.penCoordIndex++;
        this.stage.penCoords[this.stage.penCoordIndex] = y+1;
        this.stage.penCoordIndex++;      

        // second vertex description
        this.stage.penLines[this.stage.penLineIndex] = Math.PI/2 + i / circleRes * 2 * Math.PI;
        this.stage.penLineIndex++;
        this.stage.penLines[this.stage.penLineIndex] = this.penSize/2;
        this.stage.penLineIndex++; 
        
        
        
         // third coordinates
        this.stage.penCoords[this.stage.penCoordIndex] = x;
        this.stage.penCoordIndex++;
        this.stage.penCoords[this.stage.penCoordIndex] = y;
        this.stage.penCoordIndex++;

        // third coordinates supplement
        this.stage.penCoords[this.stage.penCoordIndex] = x+1;
        this.stage.penCoordIndex++;
        this.stage.penCoords[this.stage.penCoordIndex] = y+1;
        this.stage.penCoordIndex++;      

        // third vertex description
        this.stage.penLines[this.stage.penLineIndex] = Math.PI/2 + (i+1) / circleRes * 2 * Math.PI;
        this.stage.penLineIndex++;
        this.stage.penLines[this.stage.penLineIndex] = this.penSize/2;
        this.stage.penLineIndex++;           
      }    
      
      // set color of vertices
      for(var i = 0; i < circleRes * 3; i++){
        this.stage.penColors[this.stage.penColorIndex] = r;
        this.stage.penColorIndex++;
        this.stage.penColors[this.stage.penColorIndex] = g;
        this.stage.penColorIndex++;
        this.stage.penColors[this.stage.penColorIndex] = b;
        this.stage.penColorIndex++;
        this.stage.penColors[this.stage.penColorIndex] = a;
        this.stage.penColorIndex++;
      }
    
    //}
  };
  
  Sprite.prototype.hsl2rgb = function(h, s, l){
    var r, g, b;
    
    h = (h % 360) / 360;
    s = s / 100;
    l = (l - 10) / 100;
    
    if(s == 0){
        r = g = b = l; // achromatic
    }else{
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }
    return [Math.min(Math.floor(r * 256), 255), Math.min(Math.floor(g * 256), 255), Math.min(Math.floor(b * 256), 255)];
  }

  Sprite.prototype.draw = function(context, noEffects) {
    
		if(this.stage.penCoordIndex){
      this.stage.renderPen(this.stage.penContext, this.stage.penContext.penShaderInfo, this.stage.penContext.penBuffers);
      this.stage.penCoordIndex = 0;
      this.stage.penLineIndex  = 0;
      this.stage.penColorIndex = 0;
		}		
		
    var costume = this.costumes[this.currentCostumeIndex];
    
    if (this.isDragging) {
      this.moveTo(this.dragOffsetX + this.stage.mouseX, this.dragOffsetY + this.stage.mouseY);
    }
    
    
    if (costume && costume.image.imgInfo) {

      var z = Math.max(this.stage.zoomX, this.stage.zoomY);
      
      var tempTest
			
      if(costume.resScale < Math.min(this.scale * SCALE * z, 8) && costume.isSvg){
        if(costume.image.imgInfo){
          this.stage.context.deleteTexture(costume.image.imgInfo.texture);
          costume.image.imgInfo = null;
        }
        if(costume.image.penImgInfo){
          this.stage.penContext.deleteTexture(costume.image.penImgInfo.texture);
          costume.image.penImgInfo = null;
        }
        if(costume.image.collisionImgInfo){
          this.stage.glCollisionContext.deleteTexture(costume.image.collisionImgInfo.texture);
          costume.image.collisionImgInfo = null;
        }        
        
        costume.resScale = Math.min(Math.ceil(this.scale * SCALE * z), 8);
        
        console.log('scaling: ' + costume.resScale);
        
        costume.render();
      }
      
      
      var imgInfo;      
      if(context.canvas.id === 'canvas')
        imgInfo = costume.image.imgInfo;
      else if(context.canvas.id === 'penCanvas')
        imgInfo = costume.image.penImgInfo;
      else
        imgInfo = costume.image.collisionImgInfo;
      
      var color = -this.filters.color / 100 * Math.PI;
      var fisheye = this.filters.fisheye < -100 ? 0 : -this.filters.fisheye / 100 - 1;
      var whirl = -this.filters.whirl / 100 * Math.PI;
      var pixelate = Math.pow(Math.abs(this.filters.pixelate * costume.scale * this.scale), 0.6) + 1;
      var mosaic = Math.floor(Math.abs((this.filters.mosaic + 5) / 10)) + 1;
	  
	  if(this.filters.brightness > 100){
		  
		  this.filters.brightness = 100;
	  }
	  
      var brightness = this.filters.brightness / 100;
	  
      var ghost = noEffects ? 1 : Math.max(0, Math.min(1, 1 - this.filters.ghost / 100));
		
      glDrawImage(
        context,
        context.useTouchingShader ? context.touchingShaderInfo : context.imgShaderInfo,
        context.imgBuffers,
        imgInfo,
        this.scratchX + (imgInfo.width / costume.resScale / 2 - costume.rotationCenterX) * this.scale * costume.scale * (this.rotationStyle === 'leftRight' && this.direction < 0 ? -1 : 1),
        this.scratchY + (-imgInfo.height / costume.resScale / 2 + costume.rotationCenterY) * this.scale * costume.scale,
        imgInfo.width/costume.resScale * costume.scale * this.scale * (this.rotationStyle === 'leftRight' && this.direction < 0 ? -1 : 1),
        imgInfo.height/costume.resScale * costume.scale * this.scale,
        this.rotationStyle === 'normal' ? - this.direction + 90 : 0,
        (-imgInfo.width / costume.resScale / 2 + costume.rotationCenterX) * this.scale * costume.scale * (this.rotationStyle === 'leftRight' && this.direction < 0 ? -1 : 1),
        (imgInfo.height / costume.resScale / 2 - costume.rotationCenterY) * this.scale * costume.scale,
        [color, fisheye, whirl, pixelate, mosaic, brightness, ghost],
        this.stage.tColor);
    }
	
	
	
  };

	function hsvToRgb(h, s, v) {
  var r, g, b;

  var i = Math.floor(h * 6);
  var f = h * 6 - i;
  var p = v * (1 - s);
  var q = v * (1 - f * s);
  var t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
  }

  return {r: r * 255,g: g * 255,b: b * 255 };
  }

	function rgbToHsv(r, g, b) {
  r /= 255, g /= 255, b /= 255;

  var max = Math.max(r, g, b), min = Math.min(r, g, b);
  var h, s, v = max;

  var d = max - min;
  s = max == 0 ? 0 : d / max;

  if (max == min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }

    h /= 6;
  }

  return {	 h: h,
			s: s,
			v: v };
  }
	
  Sprite.prototype.setDirection = function(degrees) {
    var d = degrees % 360;
    if (d > 180) d -= 360;
    if (d <= -180) d += 360;
    this.direction = d;
    if (this.saying) this.updateBubble();
  };

  
  //Context for collision math
  var collisionCanvas = document.createElement('canvas');
  var collisionContext = collisionCanvas.getContext('2d');
  
  Sprite.prototype.touching = function(thing) {    
    var costume = this.costumes[this.currentCostumeIndex];

    if (thing === '_mouse_') {
      var bounds = this.rotatedBounds();
      var x = this.stage.rawMouseX;
      var y = this.stage.rawMouseY;
      if (x < bounds.left || y < bounds.bottom || x > bounds.right || y > bounds.top) {
        return false;
      }
      var cx = (x - this.scratchX) / this.scale
      var cy = (this.scratchY - y) / this.scale
      if (this.rotationStyle === 'normal' && this.direction !== 90) {
        var d = (90 - this.direction) * Math.PI / 180
        var ox = cx
        var s = Math.sin(d), c = Math.cos(d)
        cx = c * ox - s * cy
        cy = s * ox + c * cy
      } else if (this.rotationStyle === 'leftRight' && this.direction < 0) {
        cx = -cx
      }
      
      //var d = costume.context.getImageData(cx * costume.resScale * costume.bitmapResolution + costume.rotationCenterX * costume.resScale, cy * costume.resScale * costume.bitmapResolution + costume.rotationCenterY * costume.resScale, 1, 1).data;
      
      this.stage.glCollisionContext.scissor(this.stage.rawMouseX + 240, this.stage.rawMouseY + 179, 1, 1);
      
      this.stage.glCollisionContext.clear(this.stage.glCollisionContext.COLOR_BUFFER_BIT);
      this.stage.glCollisionContext.useTouchingShader = false;
      this.draw(this.stage.glCollisionContext, true);
      
      var d = new Uint8Array(4);
      
      
      this.stage.glCollisionContext.readPixels(
        this.stage.rawMouseX + 240,
        this.stage.rawMouseY + 179,
        1,
        1,
        this.stage.glCollisionContext.RGBA,
        this.stage.glCollisionContext.UNSIGNED_BYTE,
        d);
        
      this.stage.glCollisionContext.scissor(0, 0, 480, 360);
      
      return d[3] !== 0;
    } else if (thing === '_edge_') {
      var bounds = this.rotatedBounds();
      return bounds.left <= -240 || bounds.right >= 240 || bounds.top >= 180 || bounds.bottom <= -180;
    } else {
      if (!this.visible) return false;
      var sprites = this.stage.getObjects(thing);
      for (var i = sprites.length; i--;) {
        var sprite = sprites[i];
        if (!sprite.visible) continue;
		
		
		
        var mb = this.rotatedBounds();
        var ob = sprite.rotatedBounds();
		//console.log(sprite);
        if (mb.bottom >= ob.top || ob.bottom >= mb.top || mb.left >= ob.right || ob.left >= mb.right) {
          continue;
        }
        
        var left = Math.max(mb.left, ob.left);
        var top = Math.min(mb.top, ob.top);
        var right = Math.min(mb.right, ob.right);
        var bottom = Math.max(mb.bottom, ob.bottom);

        collisionCanvas.width = Math.max(right - left, 1);
        collisionCanvas.height = Math.max(top - bottom, 1);

        collisionContext.save();
        collisionContext.translate(-(left + 240), -(180 - top));

        //this.draw(collisionContext, true);
        //collisionContext.globalCompositeOperation = 'source-in';
        //sprite.draw(collisionContext, true);      
        
        this.stage.glCollisionContext.scissor(240 + left, 180 + bottom, Math.max(right - left, 1), Math.max(top - bottom, 1));
        
        this.stage.glCollisionContext.clear(this.stage.glCollisionContext.COLOR_BUFFER_BIT);
        this.stage.glCollisionContext.useTouchingShader = false;
        this.draw(this.stage.glCollisionContext, true);
        
        this.stage.glCollisionContext.touchingShaderInfo.blendSource = this.stage.glCollisionContext.DST_ALPHA;
        this.stage.glCollisionContext.touchingShaderInfo.blendDest = this.stage.glCollisionContext.ZERO;    
        this.stage.tColor = [0.0, 0.0, 0.0, 0.0]     
        this.stage.glCollisionContext.useTouchingShader = true;
        sprite.draw(this.stage.glCollisionContext, true);
        
        //collisionContext.restore();

        //var data = collisionContext.getImageData(0, 0, Math.max(right - left, 1), Math.max(top - bottom, 1)).data;

        costume = sprite.costumes[sprite.currentCostumeIndex];
        
        var data = new Uint8Array(Math.max(right - left, 1) * Math.max(top - bottom, 1) * 4);
        this.stage.glCollisionContext.readPixels(
          240 + left,
          180 + bottom,
          Math.max(right - left, 1),
          Math.max(top - bottom, 1),
          this.stage.glCollisionContext.RGBA,
          this.stage.glCollisionContext.UNSIGNED_BYTE,
          data);
       
       this.stage.glCollisionContext.scissor(0, 0, 480, 360);
       
        var length = data.length;
        for (var j = 0; j < length; j += 4) {
          if (data[j + 3]) {
			 
            return true;
          }
        }
      }
      return false;
    }
  };

  Sprite.prototype.touchingColor = function(rgb) {    
    var b = this.rotatedBounds();
    //collisionCanvas.width = Math.ceil(b.right - b.left);
    //collisionCanvas.height = Math.ceil(b.top - b.bottom);

    //collisionContext.save();
    //collisionContext.translate(-(240 + b.left), -(180 - b.top));
    
    /*
    this.stage.drawAllOn(collisionContext, this);
    collisionContext.globalCompositeOperation = 'destination-in';
    this.draw(collisionContext, true);
    */    
    

    
    //set context to size of sprite:
    //this.stage.glCollisionCanvas.width = Math.ceil(b.right - b.left);
    //this.stage.glCollisionCanvas.height = Math.ceil(b.top - b.bottom);
    //this.stage.glCollisionCanvas.collisionMode = b;
    
    this.stage.glCollisionContext.scissor(240 + b.left, 180 + b.bottom, Math.ceil(b.right) - Math.floor(b.left), Math.ceil(b.top) - Math.floor(b.bottom));
    
    this.stage.glCollisionContext.clear(this.stage.glCollisionContext.COLOR_BUFFER_BIT);
    this.stage.glCollisionContext.useTouchingShader = false;
    this.stage.drawAllOn(this.stage.glCollisionContext, this);

    
    this.stage.glCollisionContext.touchingShaderInfo.blendSource = this.stage.glCollisionContext.ZERO;
    this.stage.glCollisionContext.touchingShaderInfo.blendDest = this.stage.glCollisionContext.SRC_COLOR;
    this.stage.tColor = [0.0, 0.0, 0.0, 0.0]    
    this.stage.glCollisionContext.useTouchingShader = true;
    this.draw(this.stage.glCollisionContext, true);
 



 
    //collisionContext.restore();

    /*
    var width  = collisionCanvas.width;
    var height = collisionCanvas.height;
    
    if(width <= 0){
      width=1;
    }
    if(height <= 0){
      height=1;
    }
	  */
  
    //var data = collisionContext.getImageData(0, 0, width, height).data;
    
    //b.right = Math.min(b.right, 240);

    var tempTest = performance.now(); 
 
    var data = new Uint8Array((Math.ceil(b.right) - Math.floor(b.left)) * (Math.ceil(b.top) - Math.floor(b.bottom)) * 4);
    
    this.stage.glCollisionContext.finish();
    this.stage.glCollisionContext.readPixels(
      240 + b.left,
      180 + b.bottom,
      Math.ceil(b.right) - Math.floor(b.left),
      Math.ceil(b.top) - Math.floor(b.bottom),
      this.stage.glCollisionContext.RGBA,
      this.stage.glCollisionContext.UNSIGNED_BYTE,
      data);
      
    this.stage.glCollisionContext.scissor(0, 0, 480, 360);
 
    //console.log(performance.now() - tempTest);  
    
    //rgb = rgb & 0xffffff;
    var length = data.length;//Math.ceil(b.right - b.left) * Math.ceil(b.top - b.bottom) * 4;   
    for (var i = 0; i < length; i += 4) {
      if(((data[i] << 16 | data[i + 1] << 8 | data[i + 2]) & 0xf8f8f0) === (rgb & 0xf8f8f0) && (data[i + 3] === 0xff)){
        return true;
      }
    }
    return false;
  };
  
  Sprite.prototype.colorTouchingColor = function(rgb1, rgb2, first) {
    var b = this.rotatedBounds();
 
     this.stage.glCollisionContext.scissor(240 + b.left, 180 + b.bottom, Math.ceil(b.right) - Math.floor(b.left), Math.ceil(b.top) - Math.floor(b.bottom));
 
    this.stage.glCollisionContext.clear(this.stage.glCollisionContext.COLOR_BUFFER_BIT);
    this.stage.glCollisionContext.useTouchingShader = false;
    this.stage.drawAllOn(this.stage.glCollisionContext, this);  
    
    this.stage.glCollisionContext.touchingShaderInfo.blendSource = this.stage.glCollisionContext.ZERO;
    this.stage.glCollisionContext.touchingShaderInfo.blendDest = this.stage.glCollisionContext.SRC_COLOR;
    this.stage.tColor = [((rgb1 & 0xff0000) >> 16) / 255, ((rgb1 & 0x00ff00) >> 8) / 255, (rgb1 & 0x0000ff) / 255, 1.0];   
    this.stage.glCollisionContext.useTouchingShader = true;
    this.draw(this.stage.glCollisionContext, true);
    
    b.right = Math.min(b.right, 240);
    
    var data = new Uint8Array(Math.ceil(b.right - b.left) * Math.ceil(b.top - b.bottom) * 4);
    this.stage.glCollisionContext.finish();    
    this.stage.glCollisionContext.readPixels(
      240 + b.left,
      180 + b.bottom,
      b.right - b.left,
      b.top - b.bottom,
      this.stage.glCollisionContext.RGBA,
      this.stage.glCollisionContext.UNSIGNED_BYTE,
      data);
 
    this.stage.glCollisionContext.scissor(0, 0, 480, 360);
 
    //rgb = rgb & 0xffffff;
    var length = Math.ceil(b.right - b.left) * Math.ceil(b.top - b.bottom) * 4;   
    for (var i = 0; i < length; i += 4) {
      //if(Math.abs(data[i    ] - data[i + 1]) <= 4 &&
      //   Math.abs(data[i    ] - data[i + 2]) <= 4 &&
      //   Math.abs(data[i + 1] - data[i + 2]) <= 4){
      //  if(data[i + 2] === (rgb2 & 0x0000ff) && data[i + 3]){
      //    return true;
      //  }
      //}
      //else{
        if(((data[i] << 16 | data[i + 1] << 8 | data[i + 2]) & 0xf8f8f0) === (rgb2 & 0xf8f8f0) && data[i + 3]){
          return true;
        }
      //}
    }
    
    return false;    
  }

  Sprite.prototype.bounceOffEdge = function() {
    var b = this.rotatedBounds();
    var dl = 240 + b.left;
    var dt = 180 - b.top;
    var dr = 240 - b.right;
    var db = 180 + b.bottom;

    var d = Math.min(dl, dt, dr, db);
    if (d > 0) return;

    var dir = this.direction * Math.PI / 180;
    var dx = Math.sin(dir);
    var dy = -Math.cos(dir);

    switch (d) {
      case dl: dx = Math.max(0.2, Math.abs(dx)); break;
      case dt: dy = Math.max(0.2, Math.abs(dy)); break;
      case dr: dx = -Math.max(0.2, Math.abs(dx)); break;
      case db: dy = -Math.max(0.2, Math.abs(dy)); break;
    }

    this.direction = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    if (this.saying) this.updateBubble();

    b = this.rotatedBounds();
    var x = this.scratchX;
    var y = this.scratchY;
    if (b.left < -240) x += -240 - b.left;
    if (b.top > 180) y += 180 - b.top;
    if (b.right > 240) x += 240 - b.left;
    if (b.bottom < -180) y += -180 - b.top;
  };

  Sprite.prototype.rotatedBounds = function() {
    var costume = this.costumes[this.currentCostumeIndex];

    var s = costume.scale * this.scale;
    var left = -costume.rotationCenterX * s;
    var top = costume.rotationCenterY * s;
    var right = left + costume.image.width * s / costume.resScale;
    var bottom = top - costume.image.height * s / costume.resScale;

    if (this.rotationStyle !== 'normal') {
      if (this.rotationStyle === 'leftRight' && this.direction < 0) {
        right = -left;
        left = right - costume.image.width * costume.scale * this.scale / costume.resScale;
      }
      return {
        left: this.scratchX + left,
        right: this.scratchX + right,
        top: this.scratchY + top,
        bottom: this.scratchY + bottom
      };
    }

    var mSin = Math.sin(this.direction * Math.PI / 180);
    var mCos = Math.cos(this.direction * Math.PI / 180);

    var tlX = mSin * left - mCos * top;
    var tlY = mCos * left + mSin * top;

    var trX = mSin * right - mCos * top;
    var trY = mCos * right + mSin * top;

    var blX = mSin * left - mCos * bottom;
    var blY = mCos * left + mSin * bottom;

    var brX = mSin * right - mCos * bottom;
    var brY = mCos * right + mSin * bottom;

    return {
      left: this.scratchX + Math.min(tlX, trX, blX, brX),
      right: this.scratchX + Math.max(tlX, trX, blX, brX),
      top: this.scratchY + Math.max(tlY, trY, blY, brY),
      bottom: this.scratchY + Math.min(tlY, trY, blY, brY)
    };
  };

  Sprite.prototype.showRotatedBounds = function() {
    var bounds = this.rotatedBounds();
    var div = document.createElement('div');
    div.style.outline = '1px solid red';
    div.style.position = 'absolute';
    div.style.left = (240 + bounds.left) + 'px';
    div.style.top = (180 - bounds.top) + 'px';
    div.style.width = (bounds.right - bounds.left) + 'px';
    div.style.height = (bounds.top - bounds.bottom) + 'px';
    this.stage.canvas.parentNode.appendChild(div);
  };

  Sprite.prototype.distanceTo = function(thing) {
    if (thing === '_mouse_') {
      var x = this.stage.mouseX;
      var y = this.stage.mouseY;
    } else {
      var sprite = this.stage.getObject(thing);
      if (!sprite) return 0;
      x = sprite.scratchX;
      y = sprite.scratchY;
    }
    return Math.sqrt((this.scratchX - x) * (this.scratchX - x) + (this.scratchY - y) * (this.scratchY - y));
  };

  Sprite.prototype.gotoObject = function(thing) {
    if (thing === '_mouse_') {
      this.moveTo(this.stage.mouseX, this.stage.mouseY);
    } else if (thing === '_random_') {
      var x = Math.round(480 * Math.random() - 240);
      var y = Math.round(360 * Math.random() - 180);
      this.moveTo(x, y);
    } else {
      var sprite = this.stage.getObject(thing);
      if (!sprite) return 0;
      this.moveTo(sprite.scratchX, sprite.scratchY);
    }
  };

  Sprite.prototype.pointTowards = function(thing) {
    if (thing === '_mouse_') {
      var x = this.stage.mouseX;
      var y = this.stage.mouseY;
    } else {
      var sprite = this.stage.getObject(thing);
      if (!sprite) return 0;
      x = sprite.scratchX;
      y = sprite.scratchY;
    }
    var dx = x - this.scratchX;
    var dy = y - this.scratchY;
    this.direction = dx === 0 && dy === 0 ? 90 : Math.atan2(dx, dy) * 180 / Math.PI;
    if (this.saying) this.updateBubble();
  };

  Sprite.prototype.say = function(text, thinking) {
    text = '' + text;
    if (!text) {
      this.saying = false;
      if (!this.bubble) return;
      this.bubble.style.display = 'none';
      return ++this.sayId;
    }
    this.saying = true;
    this.thinking = thinking;
    if (!this.bubble) {
      this.bubble = document.createElement('div');
      this.bubble.style.maxWidth = ''+(127/14)+'em';
      this.bubble.style.minWidth = ''+(48/14)+'em';
      this.bubble.style.padding = ''+(8/14)+'em '+(10/14)+'em';
      this.bubble.style.border = ''+(3/14)+'em solid rgb(160, 160, 160)';
      this.bubble.style.borderRadius = ''+(10/14)+'em';
      this.bubble.style.background = '#fff';
      this.bubble.style.position = 'absolute';
      this.bubble.style.font = 'bold 1.4em sans-serif';
      this.bubble.style.whiteSpace = 'pre-wrap';
      this.bubble.style.wordWrap = 'break-word';
      this.bubble.style.textAlign = 'center';
      this.bubble.style.cursor = 'default';
      this.bubble.appendChild(this.bubbleText = document.createTextNode(''));
      this.bubble.appendChild(this.bubblePointer = document.createElement('div'));
      this.bubblePointer.style.position = 'absolute';
      this.bubblePointer.style.height = ''+(21/14)+'em';
      this.bubblePointer.style.width = ''+(44/14)+'em';
      this.bubblePointer.style.background = 'url(/img/icons.svg) '+(-195/14)+'em '+(-4/14)+'em';
      this.bubblePointer.style.backgroundSize = ''+(320/14)+'em '+(96/14)+'em';
      this.stage.root.appendChild(this.bubble);
    }
    this.bubblePointer.style.backgroundPositionX = ((thinking ? -259 : -195)/14)+'em';
    this.bubble.style.display = 'block';
    this.bubbleText.nodeValue = text;
    this.updateBubble();
    return ++this.sayId;
  };

  Sprite.prototype.updateBubble = function() {
	  
	//var bWidth = this.bubble.offsetWidth;
	//var bHeight = Math.max(this.stage.zoomX, this.stage.zoomY * 0.75);
	  
    if (!this.visible || !this.saying) {
      this.bubble.style.display = 'none';
      return;
    }
    var b = this.rotatedBounds();
	var z = Math.max(this.stage.zoomX, this.stage.zoomY);
    var width = this.bubble.offsetWidth / z;
    var height = this.bubble.offsetHeight / z;
	
	var stageTop;
	var stageRight;
	if(this.stage.zoomX <= this.stage.zoomY){
		stageTop = 360;
		stageRight = 480 * this.stage.zoomX / this.stage.zoomY;		
	}
	else{
		stageTop = 360 * this.stage.zoomY / this.stage.zoomX;
		stageRight = 480;
	}
	
    var left = 240 + b.right;
	var bottom = stageTop - 180 + b.top;

	
    this.bubblePointer.style.top = ((height - 6) / 14) + 'em';
    if (left + width + 2 > stageRight) {
      this.bubble.style.right = ((stageRight - 240 - b.left) / 14) + 'em';
      this.bubble.style.left = 'auto';
      this.bubblePointer.style.right = (3/14)+'em';
      this.bubblePointer.style.left = 'auto';
      this.bubblePointer.style.backgroundPositionY = (-36/14)+'em';
    } else {
      this.bubble.style.left = (left / 14) + 'em';
      this.bubble.style.right = 'auto';
      this.bubblePointer.style.left = (3/14)+'em';
      this.bubblePointer.style.right = 'auto';
      this.bubblePointer.style.backgroundPositionY = (-4/14)+'em';
    }
    if (bottom + height + 2 > stageTop) {
      bottom = stageTop - height - 2;
    }
    if (bottom < 19) {
      bottom = 19;
    }
    this.bubble.style.bottom = (bottom / 14) + 'em';
  };

  Sprite.prototype.remove = function() {
    if (this.bubble) {
      this.stage.root.removeChild(this.bubble);
      this.bubble = null;
    }
    if (this.node) {
      this.node.disconnect();
      this.node = null;
    }
  };

  var Costume = function(data, index, base) {
    
    this.index = index;
    this.base = base;
    this.baseLayerID = data.baseLayerID;
    this.baseLayerMD5 = data.baseLayerMD5;
    this.baseLayer = data.$image ? data.$image : new Image(0, 0);
    this.bitmapResolution = data.bitmapResolution || 1;
    this.scale = 1 / this.bitmapResolution;
    this.costumeName = data.costumeName;
    this.rotationCenterX = data.rotationCenterX;
    this.rotationCenterY = data.rotationCenterY;
    this.textLayer = data.$text;
    //Increases dynamically as needed.
    this.resScale = 1;
		
		//Is this an svg, i.e. does it need to be rescaled for good resolution?
		this.isSvg = this.baseLayerMD5.split('.')[1] === 'svg';
    
    //this.image = document.createElement('canvas');
    //this.context = this.image.getContext('2d');

    this.render();
    this.baseLayer.onload = function() {
      this.render();
    }.bind(this);
    if (this.textLayer) {
      this.textLayer.onload = this.baseLayer.onload;
    }
  };
  addEvents(Costume, 'load');

  Costume.prototype.render = function() {
    this.image = document.createElement('canvas');
    this.context = this.image.getContext('2d');
    
    if (!this.baseLayer.width || this.textLayer && !this.textLayer.width) {
      return;
    }
    this.image.width = this.baseLayer.width*this.resScale;
    this.image.height = this.baseLayer.height*this.resScale;
    
    this.context.imageSmoothingEnabled = false;
    this.context.msImageSmoothingEnabled = false;
    
    this.context.drawImage(this.baseLayer, 0, 0, this.image.width, this.image.height);
    if (this.textLayer) {
		
      this.context.drawImage(this.textLayer, 0, 0, this.image.width, this.image.height);
    }
    if (this.base.isStage && this.index == this.base.currentCostumeIndex) {      
      setTimeout(function() {
        this.base.updateBackdrop();
      }.bind(this));
    }
    
    //console.log('making texture');
    if(this.base.isStage){
      this.image.imgInfo = glMakeTexture(this.base.stage.backdropContext, this.image);
    }
    else{
      this.image.imgInfo = glMakeTexture(this.base.stage.context, this.image);
      this.image.penImgInfo = glMakeTexture(this.base.stage.penContext, this.image);
    }
    this.image.collisionImgInfo = glMakeTexture(this.base.stage.glCollisionContext, this.image);    
    
    //destroy context and canvas after rendering.
    this.context = null;
    this.image.remove();
  };

  var Sound = function(data) {
    this.name = data.soundName;
    this.buffer = data.$buffer;
    this.duration = this.buffer ? this.buffer.duration : 0;
  };

  var Watcher = function(stage) {
    this.stage = stage;

    this.cmd = 'getVar:';
    this.color = '#ee7d16';
    this.isDiscrete = true;
    this.label = 'watcher';
    this.mode = 1;
    this.param = 'var';
    this.sliderMax = 100;
    this.sliderMin = 0;
    this.target = undefined;
    this.visible = true;
    this.x = 0;
    this.y = 0;
  };

  Watcher.prototype.fromJSON = function(data) {
    this.cmd = data.cmd || 'getVar:';
    if (data.color) {
      var c = (data.color < 0 ? data.color + 0x1000000 : data.color).toString(16);
      this.color = '#000000'.slice(0, -c.length) + c;
    }
    this.isDiscrete = data.isDiscrete == null ? true : data.isDiscrete;
    this.label = data.label || '';
    this.mode = data.mode || 1;
    this.param = data.param;
    this.sliderMax = data.sliderMax == null ? 100 : data.sliderMax;
    this.sliderMin = data.sliderMin || 0;
    this.targetName = data.target;
    this.visible = data.visible == null ? true : data.visible;
    this.x = data.x || 0;
    this.y = data.y || 0;

    return this;
  };

  Watcher.prototype.resolve = function() {
    this.target = this.stage.getObject(this.targetName);
    if (this.target && this.cmd === 'getVar:') {
      this.target.watchers[this.param] = this;
    }
    if (!this.label) {
      this.label = this.getLabel();
      if (this.target.isSprite) this.label = this.target.objName + ': ' + this.label;
    }
  };

  var WATCHER_LABELS = {
    'costumeIndex': 'costume #',
    'xpos': 'x position',
    'ypos': 'y position',
    'heading': 'direction',
    'scale': 'size',
    'backgroundIndex': 'background #',
    'sceneName': 'background name',
    'tempo': 'tempo',
    'volume': 'volume',
    'answer': 'answer',
    'timer': 'timer',
    'soundLevel': 'loudness',
    'isLoud': 'loud?',
    'xScroll': 'x scroll',
    'yScroll': 'y scroll'
  };

  Watcher.prototype.getLabel = function() {
    switch (this.cmd) {
      case 'getVar:': return this.param;
      case 'sensor:': return this.param + ' sensor value';
      case 'sensorPressed': return 'sensor ' + this.param + '?';
      case 'timeAndDate': return this.param;
      case 'senseVideoMotion': return 'video ' + this.param;
    }
    return WATCHER_LABELS[this.cmd] || '';
  };
  
  
 

  Watcher.prototype.draw = function(destContext) {    
    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');
    
    var z = Math.min(this.stage.zoomX, this.stage.zoomY);
    
    canvas.width = 480 * z;
    canvas.height = 360 * z;
    
    context.scale(z, z);
    
    context.imageSmoothingEnabled = false;
    context.msImageSmoothingEnabled = false;  
    
    var value = 0;
    if (!this.target) return;
    switch (this.cmd) {
      case 'answer':
        value = this.stage.answer;
        break;
      case 'backgroundIndex':
        value = this.stage.currentCostumeIndex + 1;
        break;
      case 'costumeIndex':
        value = this.target.currentCostumeIndex + 1;
        break;
      case 'getVar:':
        value = this.target.vars[this.param];
        if (this.mode === 3 && this.stage.mousePressed) {
          var x = this.stage.mouseX + 240 - this.x - 5;
          var y = 180 - this.stage.mouseY - this.y - 20;
          if (x >= 0 && y >= 0 && x <= this.width - 5 - 5 && y <= 9) {
            value = this.sliderMin + Math.max(0, Math.min(1, (x - 2.5) / (this.width - 5 - 5 - 5))) * (this.sliderMax - this.sliderMin);
            value = this.isDiscrete ? Math.round(value) : Math.round(value * 100) / 100;
            this.target.vars[this.param] = value;
          }
        }
        break;
      case 'heading':
        value = this.target.direction;
        break;
      case 'scale':
        value = this.target.scale * 100;
        break;
      case 'sceneName':
        value = this.stage.getCostumeName();
        break;
      case 'senseVideoMotion':
        // TODO
        break;
      case 'soundLevel':
        // TODO
        break;
      case 'tempo':
        value = this.stage.tempoBPM;
        break;
      case 'timeAndDate':
        value = this.timeAndDate(this.param);
        break;
      case 'timer':
        value = Math.round((this.stage.now() - this.stage.timerStart) / 100) / 10;
        break;
      case 'volume':
        value = this.target.volume * 100;
        break;
      case 'xpos':
        value = this.target.scratchX;
        break;
      case 'ypos':
        value = this.target.scratchY;
        break;
    }
    if (typeof value === 'number' && (value < 0.001 || value > 0.001)) {
      value = Math.round(value * 1000) / 1000;
    }
    value = '' + value;

    if (this.labelWidth == null) {
      context.font = 'bold 11px sans-serif';
      this.labelWidth = context.measureText(this.label).width;
    }

    context.save();
    context.translate(this.x, this.y);
	
	//drawing variables in here?
    
    if (this.mode === 1 || this.mode === 3) {
      
      context.font = 'bold 11px sans-serif';

      var dw = Math.max(41, 5 + context.measureText(value).width + 5);
      var r = 5;
      var w = this.width = 5 + this.labelWidth + 5 + dw + 5;
      var h = this.mode === 1 ? 21 : 32;

      context.strokeStyle = 'rgb(148, 145, 145)';
      context.fillStyle = 'rgb(193, 196, 199)';
      context.lineWidth = 2;
      context.beginPath();
      context.arc(r + 1, r + 1, r, Math.PI, Math.PI * 3/2, false);
      context.arc(w - r - 1, r + 1, r, Math.PI * 3/2, 0, false);
      context.arc(w - r - 1, h - r - 1, r, 0, Math.PI/2, false);
      context.arc(r + 1, h - r - 1, r, Math.PI/2, Math.PI, false);
      context.closePath();
      context.stroke();
      context.fill();

      context.fillStyle = '#000';
      context.fillText(this.label, 5, 14);

      var dh = 15;
      var dx = 5 + this.labelWidth + 5;
      var dy = 3;
      var dr = 4;

      context.save();
      context.translate(dx, dy);

      context.strokeStyle = '#fff';
      context.fillStyle = this.color;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(dr + 1, dr + 1, dr, Math.PI, Math.PI * 3/2, false);
      context.arc(dw - dr - 1, dr + 1, dr, Math.PI * 3/2, 0, false);
      context.arc(dw - dr - 1, dh - dr - 1, dr, 0, Math.PI/2, false);
      context.arc(dr + 1, dh - dr - 1, dr, Math.PI/2, Math.PI, false);
      context.closePath();
      context.stroke();
      context.fill();

      context.fillStyle = '#fff';
      context.textAlign = 'center';
      context.fillText(value, dw / 2, dh - 4);

      context.restore();

      if (this.mode === 3) {
        var sh = 5;
        var sw = w - 5 - 5;
        var sr = 1.5;
        var br = 4.5;

        context.save();
        context.translate(5, 22);

        context.strokeStyle = 'rgb(148, 145, 145)';
        context.fillStyle = 'rgb(213, 216, 219)';
        context.lineWidth = 2;
        context.beginPath();
        context.arc(sr + 1, sr + 1, sr, Math.PI, Math.PI * 3/2, false);
        context.arc(sw - sr - 1, sr + 1, sr, Math.PI * 3/2, 0, false);
        context.arc(sw - sr - 1, sh - sr - 1, sr, 0, Math.PI/2, false);
        context.arc(sr + 1, sh - sr - 1, sr, Math.PI/2, Math.PI, false);
        context.closePath();
        context.stroke();
        context.fill();

        var x = (sw - sh) * Math.max(0, Math.min(1, ((+value || 0) - this.sliderMin) / (this.sliderMax - this.sliderMin)));
        context.strokeStyle = 'rgb(108, 105, 105)';
        context.fillStyle = 'rgb(233, 236, 239)';
        context.beginPath();
        context.arc(x + sh / 2, sh / 2, br - 1, 0, Math.PI * 2, false);
        context.stroke();
        context.fill();

        context.restore();
      }
    } else if (this.mode === 2) {
      context.font = 'bold 15px sans-serif';

      dh = 21;
      dw = Math.max(41, 5 + context.measureText(value).width + 5);
      dr = 4;

      context.strokeStyle = '#fff';
      context.fillStyle = this.color;
      context.lineWidth = 2;
      context.beginPath();
      context.arc(dr + 1, dr + 1, dr, Math.PI, Math.PI * 3/2, false);
      context.arc(dw - dr - 1, dr + 1, dr, Math.PI * 3/2, 0, false);
      context.arc(dw - dr - 1, dh - dr - 1, dr, 0, Math.PI/2, false);
      context.arc(dr + 1, dh - dr - 1, dr, Math.PI/2, Math.PI, false);
      context.closePath();
      context.stroke();
      context.fill();

      context.fillStyle = '#fff';
      context.textAlign = 'center';
      context.fillText(value, dw / 2, dh - 5);
    }
    

    context.restore();

    var imgInfo = glMakeTexture(destContext, canvas);
    

    
    glDrawImage(
      destContext,
      destContext.imgShaderInfo,
      destContext.imgBuffers,
      imgInfo,
      0,
      0,
      480,
      360,
      0,
      0,
      0);
      
    destContext.deleteTexture(imgInfo.texture);
    imgInfo = null;
    
    canvas.remove();
  };

  var AudioContext = window.AudioContext || window.webkitAudioContext;
  var audioContext = AudioContext && new AudioContext;
  audioContext.mInit = false;
  
  return {
    hasTouchEvents: hasTouchEvents,
    getKeyCode: getKeyCode,
    audioContext: audioContext,
    IO: IO,
    Base: Base,
    Stage: Stage,
    Sprite: Sprite,
    Watcher: Watcher
  };

}());

var sulfCookieVars;

var sulfCookieSaved;

var loadCookie = function(){
	

	
	var name = ProjectID + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
	
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
			
			
          sulfCookieSaved = JSON.parse(lzw_decode(c.substring(name.length, c.length)));
		 
		  
        }
    }

	
};

window.onbeforeunload = WindowCloseHanlder;
function WindowCloseHanlder(){	

	stage.stopAll();

	setCookie();
	
	 
}


function setCookie() {
	
	if(sulfCookieVars == null){
	
		console.log('sulfCookieVars undefined');
		return;
	
	}
	
	
	cvalue = lzw_encode(JSON.stringify(sulfCookieVars));
	
    var d = new Date();
    d.setTime(d.getTime() + (10000*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = ProjectID + "=" + cvalue + ";" + expires + ";path=/";
}

function lzw_encode(s) {
    var dict = {};
    var data = (s + "").split("");
    var out = [];
    var currChar;
    var phrase = data[0];
    var code = 256;
    for (var i=1; i<data.length; i++) {
        currChar=data[i];
        if (dict[phrase + currChar] != null) {
            phrase += currChar;
        }
        else {
            out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
            dict[phrase + currChar] = code;
            code++;
            phrase=currChar;
        }
    }
    out.push(phrase.length > 1 ? dict[phrase] : phrase.charCodeAt(0));
    for (var i=0; i<out.length; i++) {
        out[i] = String.fromCharCode(out[i]);
    }
    return out.join("");
}

// Decompress an LZW-encoded string
function lzw_decode(s) {
    var dict = {};
    var data = (s + "").split("");
    var currChar = data[0];
    var oldPhrase = currChar;
    var out = [currChar];
    var code = 256;
    var phrase;
    for (var i=1; i<data.length; i++) {
        var currCode = data[i].charCodeAt(0);
        if (currCode < 256) {
            phrase = data[i];
        }
        else {
           phrase = dict[currCode] ? dict[currCode] : (oldPhrase + currChar);
        }
        out.push(phrase);
        currChar = phrase.charAt(0);
        dict[code] = oldPhrase + currChar;
        code++;
        oldPhrase = phrase;
    }
    return out.join("");
}

P.compile = (function() {
	
	
	
  'use strict';
  
  var LOG_PRIMITIVES;
  var DEBUG;
  // LOG_PRIMITIVES = true;
  // DEBUG = true;

  var EVENT_SELECTORS = [
    'procDef',
    'whenClicked',
    'whenCloned',
    'whenGreenFlag',
    'whenIReceive',
    'whenKeyPressed',
    'whenSceneStarts',
    'whenSensorGreaterThan' // TODO
  ];

  var compileScripts = function(object) {
    for (var i = 0; i < object.scripts.length; i++) {
      compileListener(object, object.scripts[i][2]);
    }
  };

  var warnings;
  var warn = function(message) {
    warnings[message] = (warnings[message] || 0) + 1;
  };

  var compileListener = function(object, script) {
    if (!script[0] || EVENT_SELECTORS.indexOf(script[0][0]) === -1) return;

    var nextLabel = function() {
      return object.fns.length + fns.length;
    };

    var label = function() {
      var id = nextLabel();
      fns.push(source.length);
      return id;
    };

    var delay = function() {
      source += 'return;\n';
      label();
    };

    var queue = function(id) {
      source += 'queue(' + id + ');\n';
      source += 'return;\n';
    };

    var forceQueue = function(id) {
      source += 'forceQueue(' + id + ');\n';
      source += 'return;\n';
    };

    var seq = function(script) {
      if (!script) return;
      for (var i = 0; i < script.length; i++) {
        compile(script[i]);
      }
    };

    var varRef = function(name) {
		
		
		
      if (typeof name !== 'string') {
        return 'getVars(' + val(name) + ')[' + val(name) + ']';
      }
      var o = object.stage.vars[name] !== undefined ? 'self' : 'S';
      return o + '.vars[' + val(name) + ']';
    };

    var listRef = function(name) {
      if (typeof name !== 'string') {
        return 'getLists(' + val(name) + ')[' + val(name) + ']';
      }
      var o = object.stage.lists[name] !== undefined ? 'self' : 'S';
      if (o === 'S' && !object.lists[name]) {
        object.lists[name] = [];
      }
      return o + '.lists[' + val(name) + ']';
    };

    var param = function(name, usenum, usebool) {
      if (typeof name !== 'string') {
        throw new Error('Dynamic parameters are not supported');
      }

      if (!inputs) return '0';

      var i = inputs.indexOf(name);
      if (i === -1) {
        return '0';
      }

      var t = types[i];
      var kind =
        t === '%n' || t === '%d' || t === '%c' ? 'num' :
        t === '%b' ? 'bool' : '';

      if (kind === 'num' && usenum) {
        return 'C.numargs[' + i + ']';
      }
      if (kind === 'bool' && usebool) {
        return 'C.boolargs[' + i + ']';
      }

      if (usenum) return '(+C.args[' + i + '] || 0)';
      if (usebool) return 'bool(C.args[' + i + '])';
      return 'C.args[' + i + ']';
    };

    var val = function(e, usenum, usebool) {
      var v;
      if (typeof e === 'number' || typeof e === 'boolean') {

        return '' + e;

      } else if (typeof e === 'string') {

        return '"' + e
          .replace(/\\/g, '\\\\')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r')
          .replace(/"/g, '\\"')
          .replace(/\{/g, '\\x7b')
          .replace(/\}/g, '\\x7d') + '"';

      } else if (e[0] === 'getParam') { /* Data */

        return param(e[1], usenum, usebool);

      } else if ((v = numval(e)) != null || (v = boolval(e)) != null) {

        return v;

      } else if (e[0] === 'costumeName') {

        return 'S.getCostumeName()';

      } else if (e[0] === 'sceneName') {

        return 'self.getCostumeName()';

      } else if (e[0] === 'readVariable') {
		    
			
        switch(e[1]){
			
          case 'sulf.time':
            return 'Date.now()';
          case 'sulf.version':
            return '0.93';
          case 'sulf.resolutionX':
            return 'self.canvas.width';
          case 'sulf.resolutionY':
            return 'self.canvas.height';
          case 'sulf.hasTouchEvents':
            return 'P.hasTouchEvents';		
          default:
            return varRef(e[1]);
        }

      } else if (e[0] === 'contentsOfList:') {

        return 'contentsOfList(' + listRef(e[1]) + ')';

      } else if (e[0] === 'getLine:ofList:') {

        return 'getLineOfList(' + listRef(e[2]) + ', ' + val(e[1]) + ')';

      } else if (e[0] === 'concatenate:with:') {

        return '("" + ' + val(e[1]) + ' + ' + val(e[2]) + ')';

      } else if (e[0] === 'letter:of:') {

        return '(("" + ' + val(e[2]) + ')[(' + num(e[1]) + ' | 0) - 1] || "")';

      } else if (e[0] === 'answer') { /* Sensing */
			
			
			
        return 'self.answer';

      } else if (e[0] === 'getAttribute:of:') {

        return 'attribute(' + val(e[1]) + ', ' + val(e[2]) + ')';

      } else if (e[0] === 'getUserId') {

        return '0';

      } else if (e[0] === 'getUserName') {

        return '""';

      } else {

        warn('Undefined val: ' + e[0]);

      }
    };

    var numval = function(e) {

      if (e[0] === 'xpos') { /* Motion */

        return 'S.scratchX';

      } else if (e[0] === 'ypos') {

        return 'S.scratchY';

      } else if (e[0] === 'heading') {

        return 'S.direction';

      } else if (e[0] === 'costumeIndex') { /* Looks */

        return '(S.currentCostumeIndex + 1)';

      } else if (e[0] === 'backgroundIndex') {

        return '(self.currentCostumeIndex + 1)';

      } else if (e[0] === 'scale') {
        
        return '(S.scale * 100)';

      } else if (e[0] === 'volume') { /* Sound */

        return '(S.volume * 100)';

      } else if (e[0] === 'tempo') {

        return 'self.tempoBPM';

      } else if (e[0] === 'lineCountOfList:') { /* Data */

        return listRef(e[1]) + '.length';

      } else if (e[0] === '+') { /* Operators */

        return '(' + num(e[1]) + ' + ' + num(e[2]) + ' || 0)';

      } else if (e[0] === '-') {

        return '(' + num(e[1]) + ' - ' + num(e[2]) + ' || 0)';

      } else if (e[0] === '*') {

        return '(' + num(e[1]) + ' * ' + num(e[2]) + ' || 0)';

      } else if (e[0] === '/') {

        return '(' + num(e[1]) + ' / ' + num(e[2]) + ' || 0)';

      } else if (e[0] === 'randomFrom:to:') {

        return 'random(' + num(e[1]) + ', ' + num(e[2]) + ')';

      } else if (e[0] === 'abs') {

        return 'Math.abs(' + num(e[1]) + ')';

      } else if (e[0] === 'sqrt') {

        return 'Math.sqrt(' + num(e[1]) + ')';

      } else if (e[0] === 'stringLength:') {

        return '("" + ' + val(e[1]) + ').length';

      } else if (e[0] === '%' || e[0] === '\\\\') {

        return 'mod(' + num(e[1]) + ', ' + num(e[2]) + ')';

      } else if (e[0] === 'rounded') {

        return 'Math.round(' + num(e[1]) + ')';

      } else if (e[0] === 'computeFunction:of:') {

        return 'mathFunc(' + val(e[1]) + ', ' + num(e[2]) + ')';

      } else if (e[0] === 'mouseX') { /* Sensing */

        return 'self.mouseX';

      } else if (e[0] === 'mouseY') {

        return 'self.mouseY';

      } else if (e[0] === 'timer') {

        return '((self.now() - self.timerStart) / 1000)';

      } else if (e[0] === 'distanceTo:') {

        return 'S.distanceTo(' + val(e[1]) + ')';

      // } else if (e[0] === 'soundLevel') {

      } else if (e[0] === 'timestamp') {

        return '((Date.now() - epoch) / 86400000)';

      } else if (e[0] === 'timeAndDate') {

        return 'timeAndDate(' + val(e[1]) + ')';

      // } else if (e[0] === 'sensor:') {

      }
    };

    var DIGIT = /\d/;
    var boolval = function(e) {

      if (e[0] === 'list:contains:') { /* Data */

        return 'listContains(' + listRef(e[1]) + ', ' + val(e[2]) + ')';

      } else if (e[0] === '<' || e[0] === '>') { /* Operators */

        if (typeof e[1] === 'string' && DIGIT.test(e[1]) || typeof e[1] === 'number') {
          var less = e[0] === '<';
          var x = e[1];
          var y = e[2];
        } else if (typeof e[2] === 'string' && DIGIT.test(e[2]) || typeof e[2] === 'number') {
          var less = e[0] === '>';
          var x = e[2];
          var y = e[1];
        }
        var nx = +x;
        if (x == null || nx !== nx) {
          return '(compare(' + val(e[1]) + ', ' + val(e[2]) + ') === ' + (e[0] === '<' ? -1 : 1) + ')';
        }
        return (less ? 'numLess' : 'numGreater') + '(' + nx + ', ' + val(y) + ')';

      } else if (e[0] === '=') {

        if (typeof e[1] === 'string' && DIGIT.test(e[1]) || typeof e[1] === 'number') {
          var x = e[1];
          var y = e[2];
        } else if (typeof e[2] === 'string' && DIGIT.test(e[2]) || typeof e[2] === 'number') {
          var x = e[2];
          var y = e[1];
        }
        var nx = +x;
        if (x == null || nx !== nx) {
          return '(equal(' + val(e[1]) + ', ' + val(e[2]) + '))';
        }
        return '(numEqual(' + nx + ', ' + val(y) + '))';

      } else if (e[0] === '&') {

        return '(' + bool(e[1]) + ' && ' + bool(e[2]) + ')';

      } else if (e[0] === '|') {

        return '(' + bool(e[1]) + ' || ' + bool(e[2]) + ')';

      } else if (e[0] === 'not') {

        return '!' + bool(e[1]) + '';

      } else if (e[0] === 'mousePressed') { /* Sensing */

        return 'self.mousePressed';

      } else if (e[0] === 'touching:') {
				
        return 'S.touching(' + val(e[1]) + ')';

      } else if (e[0] === 'touchingColor:') {
        
        return 'S.touchingColor(' + val(e[1]) + ')';

      } else if (e[0] === 'color:sees:') {
        
        return 'S.colorTouchingColor(' + val(e[1]) + ', ' + val(e[2]) + ')';

      } else if (e[0] === 'keyPressed:') {

        return '!!self.keys[P.getKeyCode(' + val(e[1]) + ')]';

      // } else if (e[0] === 'isLoud') {

      // } else if (e[0] === 'sensorPressed:') {

      }
    };

    var bool = function(e) {
      if (typeof e === 'boolean') {
        return e;
      }
      if (typeof e === 'number' || typeof e === 'string') {
        return +e !== 0 && e !== '' && e !== 'false' && e !== false;
      }
      var v = boolval(e);
      return v != null ? v : 'bool(' + val(e, false, true) + ')';
    };

    var num = function(e) {
      if (typeof e === 'number') {
        return e || 0;
      }
      if (typeof e === 'boolean' || typeof e === 'string') {
        return +e || 0;
      }
      var v = numval(e);
      return v != null ? v : '(+' + val(e, true) + ' || 0)';
    };

    var beatHead = function(dur) {
      source += 'save();\n';
      source += 'R.start = self.now();\n';
      source += 'R.duration = ' + num(dur) + ' * 60 / self.tempoBPM;\n';
      source += 'R.first = true;\n';
    };

    var beatTail = function(dur) {
        var id = label();
        source += 'if (self.now() - R.start < R.duration * 1000 || R.first) {\n';
        source += '  R.first = false;\n';
        forceQueue(id);
        source += '}\n';

        source += 'restore();\n';
    };

    var wait = function(dur) {
      source += 'save();\n';
      source += 'R.start = self.now();\n';
      source += 'R.duration = ' + dur + ';\n';
      source += 'R.first = true;\n';

      var id = label();
      source += 'if (self.now() - R.start < R.duration * 1000 || R.first) {\n';
      source += '  R.first = false;\n';
      forceQueue(id);
      source += '}\n';

      source += 'restore();\n';
    };

    var noRGB = '';
    noRGB += 'if (S.penRGBA) {\n';
    noRGB += '  var hsl = rgb2hsl(S.penColor & 0xffffff);\n';
    noRGB += '  S.penHue = hsl[0];\n';
    noRGB += '  S.penSaturation = hsl[1];\n';
    noRGB += '  S.penLightness = hsl[2];\n';
    noRGB += '  S.penRGBA = false;';
    noRGB += '}\n';

    var compile = function(block) {
      if (LOG_PRIMITIVES) {
        source += 'console.log(' + val(block[0]) + ');\n';
      }

      if (['turnRight:', 'turnLeft:', 'heading:', 'pointTowards:', 'setRotationStyle', 'lookLike:', 'nextCostume', 'say:duration:elapsed:from:', 'say:', 'think:duration:elapsed:from:', 'think:', 'changeGraphicEffect:by:', 'setGraphicEffect:to:', 'filterReset', 'changeSizeBy:', 'setSizeTo:', 'comeToFront', 'goBackByLayers:'].indexOf(block[0]) !== -1) {
        source += 'if (S.visible) VISUAL = true;\n';
      } else if (['forward:', 'gotoX:y:', 'gotoSpriteOrMouse:', 'changeXposBy:', 'xpos:', 'changeYposBy:', 'ypos:', 'bounceOffEdge', 'glideSecs:toX:y:elapsed:from:'].indexOf(block[0]) !== -1) {
        source += 'if (S.visible || S.isPenDown) VISUAL = true;\n';
      } else if (['showBackground:', 'startScene', 'nextBackground', 'nextScene', 'startSceneAndWait', 'show', 'hide', 'putPenDown', 'stampCostume', 'showVariable:', 'hideVariable:', 'doAsk', 'setVolumeTo:', 'changeVolumeBy:', 'setTempoTo:', 'changeTempoBy:'].indexOf(block[0]) !== -1) {
        source += 'VISUAL = true;\n';
      }

      if (block[0] === 'forward:') { /* Motion */

        source += 'S.forward(' + num(block[1]) + ');\n';

      } else if (block[0] === 'turnRight:') {

        source += 'S.setDirection(S.direction + ' + num(block[1]) + ');\n';

      } else if (block[0] === 'turnLeft:') {

        source += 'S.setDirection(S.direction - ' + num(block[1]) + ');\n';

      } else if (block[0] === 'heading:') {

        source += 'S.setDirection(' + num(block[1]) + ');\n';

      } else if (block[0] === 'pointTowards:') {

        source += 'S.pointTowards(' + val(block[1]) + ');\n';

      } else if (block[0] === 'gotoX:y:') {

        source += 'S.moveTo(' + num(block[1]) + ', ' + num(block[2]) + ');\n';

      } else if (block[0] === 'gotoSpriteOrMouse:') {

        source += 'S.gotoObject(' + val(block[1]) + ');\n';

      } else if (block[0] === 'changeXposBy:') {

        source += 'S.moveTo(S.scratchX + ' + num(block[1]) + ', S.scratchY);\n';

      } else if (block[0] === 'xpos:') {

        source += 'S.moveTo(' + num(block[1]) + ', S.scratchY);\n';

      } else if (block[0] === 'changeYposBy:') {

        source += 'S.moveTo(S.scratchX, S.scratchY + ' + num(block[1]) + ');\n';

      } else if (block[0] === 'ypos:') {

        source += 'S.moveTo(S.scratchX, ' + num(block[1]) + ');\n';

      } else if (block[0] === 'bounceOffEdge') {

        source += 'S.bounceOffEdge();\n';

      } else if (block[0] === 'setRotationStyle') {

        source += 'var style = ' + val(block[1]) + ';\n';
        source += 'S.rotationStyle = style === "left-right" ? "leftRight" : style === "don\'t rotate" ? "none" : "normal";\n';

      } else if (block[0] === 'lookLike:') { /* Looks */

        source += 'S.setCostume(' + val(block[1]) + ');\n';

      } else if (block[0] === 'nextCostume') {

        source += 'S.showNextCostume();\n';

      } else if (block[0] === 'showBackground:' ||
                 block[0] === 'startScene') {
		
		source += 'var bgname = self.getCostumeName();\n';
        source += 'self.setCostume(' + val(block[1]) + ');\n';
        source += 'var threads = (self.getCostumeName()!= bgname)? sceneChange(): "";\n';
        source += 'if (threads.indexOf(BASE) !== -1) return;\n';

      } else if (block[0] === 'nextBackground' ||
                 block[0] === 'nextScene') {

        source += 'S.showNextCostume();\n';
        source += 'var threads = sceneChange();\n';
        source += 'if (threads.indexOf(BASE) !== -1) return;\n';

      } else if (block[0] === 'startSceneAndWait') {

        source += 'save();\n';
        source += 'self.setCostume(' + val(block[1]) + ');\n';
        source += 'R.threads = sceneChange();\n';
        source += 'if (R.threads.indexOf(BASE) !== -1) return;\n';
        var id = label();
        source += 'if (!running(R.threads)) {\n';
        forceQueue(id);
        source += '}\n';
        source += 'restore();\n';

      } else if (block[0] === 'say:duration:elapsed:from:') {

        source += 'save();\n';
        source += 'R.id = S.say(' + val(block[1]) + ', false);\n';
        source += 'R.start = self.now();\n';
        source += 'R.duration = ' + num(block[2]) + ';\n';

        var id = label();
        source += 'if (self.now() - R.start < R.duration * 1000) {\n';
        forceQueue(id);
        source += '}\n';

        source += 'if (S.sayId === R.id) {\n';
        source += '  S.say("");\n';
        source += '}\n';
        source += 'restore();\n';

      } else if (block[0] === 'say:') {

        source += 'S.say(' + val(block[1]) + ', false);\n';

      } else if (block[0] === 'think:duration:elapsed:from:') {

        source += 'save();\n';
        source += 'R.id = S.say(' + val(block[1]) + ', true);\n';
        source += 'R.start = self.now();\n';
        source += 'R.duration = ' + num(block[2]) + ';\n';

        var id = label();
        source += 'if (self.now() - R.start < R.duration * 1000) {\n';
        forceQueue(id);
        source += '}\n';

        source += 'if (S.sayId === R.id) {\n';
        source += '  S.say("");\n';
        source += '}\n';
        source += 'restore();\n';

      } else if (block[0] === 'think:') {

        source += 'S.say(' + val(block[1]) + ', true);\n';

      } else if (block[0] === 'changeGraphicEffect:by:') {

        source += 'S.changeFilter(' + val(block[1]) + ', ' + num(block[2]) + ');\n';

      } else if (block[0] === 'setGraphicEffect:to:') {

        source += 'S.setFilter(' + val(block[1]) + ', ' + num(block[2]) + ');\n';

      } else if (block[0] === 'filterReset') {

        source += 'S.resetFilters();\n';

      } else if (block[0] === 'changeSizeBy:') {

        source += 'S.scale += ' + num(block[1]) + ' / 100;\n';
		    source += 'if (S.scale < 0) S.scale = 0;\n';
		
      } else if (block[0] === 'setSizeTo:') {

        source += 'S.scale = ' + num(block[1]) + ' / 100;\n';
		    source += 'if (S.scale < 0) S.scale = 0;\n';

      } else if (block[0] === 'show') {

        source += 'S.visible = true;\n';
        source += 'if (S.saying) S.updateBubble();\n';

      } else if (block[0] === 'hide') {

        source += 'S.visible = false;\n';
        source += 'if (S.saying) S.updateBubble();\n';

      } else if (block[0] === 'comeToFront') {

        source += 'var i = self.children.indexOf(S);\n';
        source += 'if (i !== -1) self.children.splice(i, 1);\n';
        source += 'self.children.push(S);\n';

      } else if (block[0] === 'goBackByLayers:') {

        source += 'var i = self.children.indexOf(S);\n';
        source += 'if (i !== -1) {\n';
        source += '  self.children.splice(i, 1);\n';
        source += '  self.children.splice(Math.max(0, i - ' + num(block[1]) + '), 0, S);\n';
        source += '}\n';

      // } else if (block[0] === 'setVideoState') {

      // } else if (block[0] === 'setVideoTransparency') {

      } else if (block[0] === 'playSound:') { /* Sound */

        if (P.audioContext) {
          source += 'var sound = S.getSound(' + val(block[1]) + ');\n';
          source += 'if (sound) playSound(sound);\n';
        }

      } else if (block[0] === 'doPlaySoundAndWait') {

        if (P.audioContext) {
          source += 'var sound = S.getSound(' + val(block[1]) + ');\n';
          source += 'if (sound) {\n';
          source += '  playSound(sound);\n';
          wait('sound.duration');
          source += '}\n';
        }

      } else if (block[0] === 'stopAllSounds') {

        if (P.audioContext) {
          source += 'self.stopAllSounds();\n';
        }

      // } else if (block[0] === 'drum:duration:elapsed:from:') {

      } else if (block[0] === 'playDrum') {

        beatHead(block[2]);
        if (P.audioContext) {
          source += 'playSpan(DRUMS[Math.round(' + num(block[1]) + ') - 1] || DRUMS[2], 60, 10);\n';
        }
        beatTail();

      } else if (block[0] === 'rest:elapsed:from:') {

        beatHead(block[1]);
        beatTail();

      } else if (block[0] === 'noteOn:duration:elapsed:from:') {

        beatHead(block[2]);
        if (P.audioContext) {
          source += 'playNote(' + num(block[1]) + ', R.duration);\n';
        }
        beatTail();

      // } else if (block[0] === 'midiInstrument:') {

      } else if (block[0] === 'instrument:') {

        source += 'S.instrument = Math.max(0, Math.min(INSTRUMENTS.length - 1, ' + num(block[1]) + ' - 1)) | 0;';

      } else if (block[0] === 'changeVolumeBy:' || block[0] === 'setVolumeTo:') {

        source += 'S.volume = Math.min(1, Math.max(0, ' + (block[0] === 'changeVolumeBy:' ? 'S.volume + ' : '') + num(block[1]) + ' / 100));\n';
        source += 'if (S.node) S.node.gain.setValueAtTime(S.volume, audioContext.currentTime);\n';
        source += 'for (var sounds = S.sounds, i = sounds.length; i--;) {\n';
        source += '  var sound = sounds[i];\n';
        source += '  if (sound.node && sound.target === S) {\n';
        source += '    sound.node.gain.setValueAtTime(S.volume, audioContext.currentTime);\n';
        source += '  }\n';
        source += '}\n';

      } else if (block[0] === 'changeTempoBy:') {

        source += 'self.tempoBPM += ' + num(block[1]) + ';\n';

      } else if (block[0] === 'setTempoTo:') {

        source += 'self.tempoBPM = ' + num(block[1]) + ';\n';

      } else if (block[0] === 'clearPenTrails') { /* Pen */

        //source += 'self.penCanvas.width = 480 * self.maxZoomX;\n';
		    //source += 'self.penCanvas.height = 360 * self.maxZoomY;\n';
        //source += 'self.penContext.scale(self.maxZoomX, self.maxZoomY);\n';
        //source += 'self.penContext.lineCap = "butt";\n'
        source += 'self.penContext.clear(self.penContext.COLOR_BUFFER_BIT);\n';

      } else if (block[0] === 'putPenDown') {

        source += 'S.isPenDown = true;\n';
        //source += 'S.penState = false;\n';
        source += 'S.dotPen();\n';

      } else if (block[0] === 'putPenUp') {

        source += 'S.isPenDown = false;\n';
        //source += 'if(!S.penState)\n';
        //source += 'S.dotPen();\n';
        //source += 'S.penState = null;\n';

      } else if (block[0] === 'penColor:') {

        source += 'var c = ' + num(block[1]) + ';\n';
        source += 'S.penColor = c;\n';
        source += 'var a = (c >> 24 & 0xff) / 0xff;\n';
        source += 'S.penRGBA = true;\n';
        source += 'S.penRed = c >> 16 & 0xff;\n';
        source += 'S.penGreen = c >> 8 & 0xff;\n';
        source += 'S.penBlue = c & 0xff;\n';
        source += 'S.penAlpha = a || 1;\n';

      } else if (block[0] === 'setPenHueTo:') {

        source += noRGB;
        source += 'S.penHue = ' + num(block[1]) + ' * 360 / 200;\n';
        source += 'S.penSaturation = 100;\n';
        source += 'S.penRGBA = false;\n';

      } else if (block[0] === 'changePenHueBy:') {
        
        source += noRGB;
        source += 'S.penHue += ' + num(block[1]) + ' * 360 / 200;\n';
        source += 'S.penSaturation = 100;\n';
        source += 'S.penRGBA = false;\n';
        
      } else if (block[0] === 'setPenShadeTo:') {

        source += noRGB;
        source += 'S.penLightness = ' + num(block[1]) + ' % 200;\n';
        source += 'if (S.penLightness < 0) S.penLightness += 200;\n';
        source += 'S.penSaturation = 100;\n';
        source += 'S.penRGBA = false;\n';

      } else if (block[0] === 'changePenShadeBy:') {

        source += noRGB;
        source += 'S.penLightness = (S.penLightness + ' + num(block[1]) + ') % 200;\n';
        source += 'if (S.penLightness < 0) S.penLightness += 200;\n';
        source += 'S.penSaturation = 100;\n';
        source += 'S.penRGBA = false;\n';

      } else if (block[0] === 'penSize:') {

        source += 'var f = ' + num(block[1]) + ';\n';
        source += 'S.penSize = f < 1 ? 1 : f;\n';

      } else if (block[0] === 'changePenSizeBy:') {

        source += 'var f = S.penSize + ' + num(block[1]) + ';\n';
        source += 'S.penSize = f < 1 ? 1 : f;\n';

      } else if (block[0] === 'stampCostume') {

        source += 'S.draw(self.penContext);\n';
 
      } else if (block[0] === 'setVar:to:') { /* Data */	
					
        source += varRef(block[1]) + ' = ' + val(block[2]) + ';\n';

      } else if (block[0] === 'changeVar:by:') {

        var ref = varRef(block[1]);
		
        source += ref + ' = (+' + ref + ' || 0) + ' + num(block[2]) + ';\n';

      } else if (block[0] === 'append:toList:') {

        source += 'appendToList(' + listRef(block[2]) + ', ' + val(block[1]) + ');\n';

      } else if (block[0] === 'deleteLine:ofList:') {

        source += 'deleteLineOfList(' + listRef(block[2]) + ', ' + val(block[1]) + ');\n';

      } else if (block[0] === 'insert:at:ofList:') {

        source += 'insertInList(' + listRef(block[3]) + ', ' + val(block[2]) + ', '+ val(block[1]) + ');\n';

      } else if (block[0] === 'setLine:ofList:to:') {

        source += 'setLineOfList(' + listRef(block[2]) + ', ' + val(block[1]) + ', '+ val(block[3]) + ');\n';

      } else if (block[0] === 'showVariable:' || block[0] === 'hideVariable:') {

        var isShow = block[0] === 'showVariable:';
        if (typeof block[1] !== 'string') {
          throw new Error('Dynamic variables are not supported');
        }
        var o = object.vars[block[1]] !== undefined ? 'S' : 'self';
			
		
		
		
		
        source += o + '.showVariable(' + val(block[1]) + ', ' + isShow + ');\n';

      // } else if (block[0] === 'showList:') {

      // } else if (block[0] === 'hideList:') {

      } else if (block[0] === 'broadcast:') { /* Control */

        source += 'var threads = broadcast(' + val(block[1]) + ');\n';
        source += 'if (threads.indexOf(BASE) !== -1) return;\n';

      } else if (block[0] === 'call') {
        
        if (DEBUG && block[1] === 'sulf.debug') {
          source += 'debugger;\n';
        } else if (block[1] === 'sulf.executeJavaScript %s'){
          //console.log('**********   Found embedded JavaScript:   **********');
          //console.log(String(block[2].replace(';', ';\n')));
          //console.log('**********    End embedded JavaScript.    **********');
          //source += block[2];
        } else {
          source += 'call(' + val(block[1]) + ', ' + nextLabel() + ', [';
          for (var i = 2; i < block.length; i++) {
            if (i > 2) {
              source += ', ';
            }
            source += val(block[i]);
          }
          source += ']);\n';
          delay();
        }

      } else if (block[0] === 'doBroadcastAndWait') {

        source += 'save();\n';
        source += 'R.threads = broadcast(' + val(block[1]) + ');\n';
        source += 'if (R.threads.indexOf(BASE) !== -1) return;\n';
        var id = label();
        source += 'if (running(R.threads)) {\n';
        forceQueue(id);
        source += '}\n';
        source += 'restore();\n';

      } else if (block[0] === 'doForever') {

        var id = label();
        seq(block[1]);
        forceQueue(id);

      } else if (block[0] === 'doForeverIf') {

        var id = label();

        source += 'if (' + bool(block[1]) + ') {\n';
        seq(block[2]);
        source += '}\n';

        forceQueue(id);

      // } else if (block[0] === 'doForLoop') {

      } else if (block[0] === 'doIf') {

        source += 'if (' + bool(block[1]) + ') {\n';
        seq(block[2]);
        source += '}\n';

      } else if (block[0] === 'doIfElse') {

        source += 'if (' + bool(block[1]) + ') {\n';
        seq(block[2]);
        source += '} else {\n';
        seq(block[3]);
        source += '}\n';

      } else if (block[0] === 'doRepeat') {

        source += 'save();\n';
        source += 'R.count = ' + num(block[1]) + ';\n';

        var id = label();

        source += 'if (R.count >= 0.5) {\n';
        source += '  R.count -= 1;\n';
        seq(block[2]);
        queue(id);
        source += '} else {\n';
        source += '  restore();\n';
        source += '}\n';

      } else if (block[0] === 'doReturn') {

        source += 'endCall();\n';
        source += 'return;\n';

      } else if (block[0] === 'doUntil') {

        var id = label();
        source += 'if (!' + bool(block[1]) + ') {\n';
        seq(block[2]);
        queue(id);
        source += '}\n';

      } else if (block[0] === 'doWhile') {

        var id = label();
        source += 'if (' + bool(block[1]) + ') {\n';
        seq(block[2]);
        queue(id);
        source += '}\n';

      } else if (block[0] === 'doWaitUntil') {

        var id = label();
        source += 'if (!' + bool(block[1]) + ') {\n';
        queue(id);
        source += '}\n';

      } else if (block[0] === 'glideSecs:toX:y:elapsed:from:') {

        source += 'save();\n';
        source += 'R.start = self.now();\n';
        source += 'R.duration = ' + num(block[1]) + ';\n';
        source += 'R.baseX = S.scratchX;\n';
        source += 'R.baseY = S.scratchY;\n';
        source += 'R.deltaX = ' + num(block[2]) + ' - S.scratchX;\n';
        source += 'R.deltaY = ' + num(block[3]) + ' - S.scratchY;\n';

        var id = label();
        source += 'var f = (self.now() - R.start) / (R.duration * 1000);\n';
        source += 'if (f > 1) f = 1;\n';
        source += 'S.moveTo(R.baseX + f * R.deltaX, R.baseY + f * R.deltaY);\n';

        source += 'if (f < 1) {\n';
        forceQueue(id);
        source += '}\n';
        source += 'restore();\n';

      } else if (block[0] === 'stopAll') {

        source += 'self.stopAll();\n';
        source += 'return;\n';

      } else if (block[0] === 'stopScripts') {

        source += 'switch (' + val(block[1]) + ') {\n';
        source += '  case "all":\n';
        source += '    self.stopAll();\n';
        source += '    return;\n';
        source += '  case "this script":\n';
        source += '    endCall();\n';
        source += '    return;\n';
        source += '  case "other scripts in sprite":\n';
        source += '  case "other scripts in stage":\n';
        source += '    for (var i = 0; i < self.queue.length; i++) {\n';
        source += '      if (i !== THREAD && self.queue[i] && self.queue[i].sprite === S) {\n';
        source += '        self.queue[i] = undefined;\n';
        source += '      }\n';
        source += '    }\n';
        source += '    break;\n';
        source += '}\n';

      } else if (block[0] === 'wait:elapsed:from:') {
		
			wait(num(block[1]));
		

      } else if (block[0] === 'warpSpeed') {

        source += 'WARP++;\n';
        seq(block[1]);
        source += 'WARP--;\n';

      } else if (block[0] === 'createCloneOf') {

        source += 'clone(' + val(block[1]) + ');\n';

      } else if (block[0] === 'deleteClone') {

        source += 'if (S.isClone) {\n';
        source += '  S.remove();\n';
        source += '  var i = self.children.indexOf(S);\n';
        source += '  if (i !== -1) self.children.splice(i, 1);\n';
        source += '  for (var i = 0; i < self.queue.length; i++) {\n';
        source += '    if (self.queue[i] && self.queue[i].sprite === S) {\n';
        source += '      self.queue[i] = undefined;\n';
        source += '    }\n';
        source += '  }\n';
        source += '  return;\n';
        source += '}\n';

      } else if (block[0] === 'doAsk') { /* Sensing */
				
        source += 'R.id = self.nextPromptId++;\n';

        var id = label();
        source += 'if (self.promptId < R.id) {\n';
        forceQueue(id);
        source += '}\n';

        source += 'S.ask(' + val(block[1]) + ');\n';
		 
        var id = label();
        source += 'if (self.promptId === R.id) {\n';
        forceQueue(id);
        source += '}\n';

      } else if (block[0] === 'timerReset') {

        source += 'self.timerStart = self.now();\n';

      } else {

        warn('Undefined command: ' + block[0]);

      }
	  
	// console.log(source);
	 
    };

    var source = '';
    var startfn = object.fns.length;
    var fns = [0];

    if (script[0][0] === 'procDef') {
      var inputs = script[0][2];
      var types = script[0][1].match(/%[snmdcb]/g) || [];
      for (var i = types.length; i--;) {
        var t = types[i];
        if (t === '%d' || t === '%n' || t === '%c') {
          source += 'C.numargs[' + i + '] = +C.args[' + i + '] || 0;\n';
        } else if (t === '%b') {
          source += 'C.boolargs[' + i + '] = bool(C.args[' + i + ']);\n';
        }
      }
    }

    for (var i = 1; i < script.length; i++) {
      compile(script[i]);
    }
		//console.log(source);
    if (script[0][0] === 'procDef') {
      source += 'endCall();\n';
      source += 'return;\n';
    }

    var createContinuation = function(source) {
      var result = '(function() {\n';
      var brackets = 0;
      var delBrackets = 0;
      var shouldDelete = false;
      var here = 0;
      var length = source.length;
      while (here < length) {
        var i = source.indexOf('{', here);
        var j = source.indexOf('}', here);
        if (i === -1 && j === -1) {
          if (!shouldDelete) {
            result += source.slice(here);
          }
          break;
        }
        if (i === -1) i = length;
        if (j === -1) j = length;
        if (shouldDelete) {
          if (i < j) {
            delBrackets++;
            here = i + 1;
          } else {
            delBrackets--;
            if (!delBrackets) {
              shouldDelete = false;
            }
            here = j + 1;
          }
        } else {
          if (i < j) {
            result += source.slice(here, i + 1);
            brackets++;
            here = i + 1;
          } else {
            result += source.slice(here, j);
            here = j + 1;
            if (source.substr(j, 8) === '} else {') {
              if (brackets > 0) {
                result += '} else {';
                here = j + 8;
              } else {
                shouldDelete = true;
                delBrackets = 0;
              }
            } else {
              if (brackets > 0) {
                result += '}';
                brackets--;
              }
            }
          }
        }
      }
      result += '})';
      return P.runtime.scopedEval(result);
    };

    for (var i = 0; i < fns.length; i++) {
      object.fns.push(createContinuation(source.slice(fns[i])));
    }

    var f = object.fns[startfn];

    if (script[0][0] === 'whenClicked') {
      object.listeners.whenClicked.push(f);
    } else if (script[0][0] === 'whenGreenFlag') {
      object.listeners.whenGreenFlag.push(f);
    } else if (script[0][0] === 'whenCloned') {
      object.listeners.whenCloned.push(f);
    } else if (script[0][0] === 'whenIReceive') {
      var key = script[0][1].toLowerCase();
      (object.listeners.whenIReceive[key] || (object.listeners.whenIReceive[key] = [])).push(f);
    } else if (script[0][0] === 'whenKeyPressed') {
      if (script[0][1] === 'any') {
        for (var i = 128; i--;) {
          object.listeners.whenKeyPressed[i].push(f);
        }
      } else {
        object.listeners.whenKeyPressed[P.getKeyCode(script[0][1])].push(f);
      }
    } else if (script[0][0] === 'whenSceneStarts') {
      var key = script[0][1].toLowerCase();
      (object.listeners.whenSceneStarts[key] || (object.listeners.whenSceneStarts[key] = [])).push(f);
    } else if (script[0][0] === 'procDef') {
      object.procedures[script[0][1]] = {
        inputs: inputs,
        warp: script[0][4],
        fn: f
      };
    } else {
      warn('Undefined event: ' + script[0][0]);
    }
  };

  return function(stage) {

    warnings = Object.create(null);

    compileScripts(stage);
    
    for (var i = 0; i < stage.children.length; i++) {
      if (!stage.children[i].cmd) {
        compileScripts(stage.children[i]);
      }
    }

    for (var key in warnings) {
      console.warn(key + (warnings[key] > 1 ? ' (repeated ' + warnings[key] + ' times)' : ''));
    }
  };

	
  
}());

P.runtime = (function() {
  'use strict';

	
	
  
  
  var self, S, R, STACK, C, WARP, CALLS, BASE, THREAD, IMMEDIATE, VISUAL;

  var bool = function(v) {
    return +v !== 0 && v !== '' && v !== 'false' && v !== false;
  };

  var DIGIT = /\d/;
  var compare = function(x, y) {
    if ((typeof x === 'number' || DIGIT.test(x)) && (typeof y === 'number' || DIGIT.test(y))) {
      var nx = +x;
      var ny = +y;
      if (nx === nx && ny === ny) {
        return nx < ny ? -1 : nx === ny ? 0 : 1;
      }
    }
    var xs = ('' + x).toLowerCase();
    var ys = ('' + y).toLowerCase();
    return xs < ys ? -1 : xs === ys ? 0 : 1;
  };
  var numLess = function(nx, y) {
    if (typeof y === 'number' || DIGIT.test(y)) {
      var ny = +y;
      if (ny === ny) {
        return nx < ny;
      }
    }
    var ys = ('' + y).toLowerCase();
    return '' + nx < ys;
  };
  var numGreater = function(nx, y) {
    if (typeof y === 'number' || DIGIT.test(y)) {
      var ny = +y;
      if (ny === ny) {
        return nx > ny;
      }
    }
    var ys = ('' + y).toLowerCase();
    return '' + nx > ys;
  };

  var equal = function(x, y) {
    if ((typeof x === 'number' || DIGIT.test(x)) && (typeof y === 'number' || DIGIT.test(y))) {
      var nx = +x;
      var ny = +y;
      if (nx === nx && ny === ny) {
        return nx === ny;
      }
    }
    var xs = ('' + x).toLowerCase();
    var ys = ('' + y).toLowerCase();
    return xs === ys;
  };
  var numEqual = function(nx, y) {
    if (typeof y === 'number' || DIGIT.test(y)) {
      var ny = +y;
      return ny === ny && nx === ny;
    }
    return false;
  };

  var mod = function(x, y) {
    var r = x % y;
    if (r / y < 0) {
      r += y;
    }
    return r;
  };

  var random = function(x, y) {
    x = +x || 0;
    y = +y || 0;
    if (x > y) {
      var tmp = y;
      y = x;
      x = tmp;
    }
    if (x % 1 === 0 && y % 1 === 0) {
      return Math.floor(Math.random() * (y - x + 1)) + x;
    }
    return Math.random() * (y - x) + x;
  };

  var rgb2hsl = function(rgb) {
    var r = (rgb >> 16 & 0xff) / 0xff;
    var g = (rgb >> 8 & 0xff) / 0xff;
    var b = (rgb & 0xff) / 0xff;

    var min = Math.min(r, g, b);
    var max = Math.max(r, g, b);

    if (min === max) {
      return [0, 0, r * 100];
    }

    var c = max - min;
    var l = (min + max) / 2;
    var s = c / (1 - Math.abs(2 * l - 1));

    var h;
    switch (max) {
      case r: h = ((g - b) / c + 6) % 6; break;
      case g: h = (b - r) / c + 2; break;
      case b: h = (r - g) / c + 4; break;
    }
    h *= 60;

    return [h, s * 100, l * 100];
  };

  var clone = function(name) {
    var parent = name === '_myself_' ? S : self.getObject(name);
    var c = parent.clone();
    self.children.splice(self.children.indexOf(parent), 0, c);
    self.triggerFor(c, 'whenCloned');
  };

  var epoch = Date.UTC(2000, 0, 1);

  var timeAndDate = P.Watcher.prototype.timeAndDate = function(format) {
    switch (format) {
      case 'year':
        return new Date().getFullYear();
      case 'month':
        return new Date().getMonth() + 1;
      case 'date':
        return new Date().getDate();
      case 'day of week':
        return new Date().getDay() + 1;
      case 'hour':
        return new Date().getHours();
      case 'minute':
        return new Date().getMinutes();
      case 'second':
        return new Date().getSeconds();
    }
    return 0;
  };

  var getVars = function(name) {
	  
    return self.vars[name] !== undefined ? self.vars : S.vars;
	
  };

  var getLists = function(name) {
    if (self.lists[name] !== undefined) return self.lists;
    if (S.lists[name] === undefined) {
      S.lists[name] = [];
    }
    return S.lists;
  };

  var listIndex = function(list, index, length) {
    var i = index | 0;
    if (i === index) return i > 0 && i <= length ? i - 1 : -1;
    if (index === 'random' || index === 'any') {
      return Math.random() * length | 0;
    }
    if (index === 'last') {
      return length - 1;
    }
    return i > 0 && i <= length ? i - 1 : -1;
  };

  var contentsOfList = function(list) {
    var isSingle = true;
    for (var i = list.length; i--;) {
      if (list[i].length !== 1) {
        isSingle = false;
        break;
      }
    }
    return list.join(isSingle ? '' : ' ');
  };

  var getLineOfList = function(list, index) {
    var i = listIndex(list, index, list.length);
    return i !== -1 ? list[i] : '';
  };

  var listContains = function(list, value) {
    for (var i = list.length; i--;) {
      if (equal(list[i], value)) return true;
    }
    return false;
  };

  var appendToList = function(list, value) {
    list.push(value);
  };

  var deleteLineOfList = function(list, index) {
    if (index === 'all') {
      list.length = 0;
    } else {
      var i = listIndex(list, index, list.length);
      if (i === list.length - 1) {
        list.pop();
      } else if (i !== -1) {
        list.splice(i, 1);
      }
    }
  };

  var insertInList = function(list, index, value) {
    var i = listIndex(list, index, list.length + 1);
    if (i === list.length) {
      list.push(value);
    } else if (i !== -1) {
      list.splice(i, 0, value);
    }
  };

  var setLineOfList = function(list, index, value) {
    var i = listIndex(list, index, list.length);
    if (i !== -1) {
      list[i] = value;
    }
  };

  var mathFunc = function(f, x) {
    switch (f) {
      case 'abs':
        return Math.abs(x);
      case 'floor':
        return Math.floor(x);
      case 'sqrt':
        return Math.sqrt(x);
      case 'ceiling':
        return Math.ceil(x);
      case 'cos':
        return Math.cos(x * Math.PI / 180);
      case 'sin':
        return Math.sin(x * Math.PI / 180);
      case 'tan':
        return Math.tan(x * Math.PI / 180);
      case 'asin':
        return Math.asin(x) * 180 / Math.PI;
      case 'acos':
        return Math.acos(x) * 180 / Math.PI;
      case 'atan':
        return Math.atan(x) * 180 / Math.PI;
      case 'ln':
        return Math.log(x);
      case 'log':
        return Math.log(x) / Math.LN10;
      case 'e ^':
        return Math.exp(x);
      case '10 ^':
        return Math.exp(x * Math.LN10);
    }
    return 0;
  };

  var attribute = function(attr, objName) {
    var o = self.getObject(objName);
    if (!o) return 0;
    if (o.isSprite) {
      switch (attr) {
        case 'x position': return o.scratchX;
        case 'y position': return o.scratchY;
        case 'direction': return o.direction;
        case 'costume #': return o.currentCostumeIndex + 1;
        case 'costume name': return o.costumes[o.currentCostumeIndex].costumeName;
        case 'size': return o.scale * 100;
        case 'volume': return 0; // TODO
      }
    } else {
      switch (attr) {
        case 'background #':
        case 'backdrop #': return o.currentCostumeIndex + 1;
        case 'backdrop name': return o.costumes[o.currentCostumeIndex].costumeName;
        case 'volume': return 0; // TODO
      }
    }
    var value = o.vars[attr];
    if (value !== undefined) {
      return value;
    }
    return 0;
  };

  var VOLUME = 0.3;

  var audioContext = P.audioContext;
  if (audioContext) {
    var wavBuffers = P.IO.wavBuffers;

    var volumeNode = audioContext.createGain();
    volumeNode.gain.value = VOLUME;
    volumeNode.connect(audioContext.destination);

    var playNote = function(id, duration) {
      var spans = INSTRUMENTS[S.instrument];
      for (var i = 0, l = spans.length; i < l; i++) {
        var span = spans[i];
        if (span.top >= id || span.top === 128) break;
      }
      playSpan(span, Math.max(0, Math.min(127, id)), duration);
    };

    var playSpan = function(span, id, duration) {
      if (!S.node) {
        S.node = audioContext.createGain();
        S.node.gain.value = S.volume;
        S.node.connect(volumeNode);
      }

      var source = audioContext.createBufferSource();
      var note = audioContext.createGain();
      var buffer = wavBuffers[span.name];
      if (!buffer) return;

      source.buffer = buffer;
      if (source.loop = span.loop) {
        source.loopStart = span.loopStart;
        source.loopEnd = span.loopEnd;
      }

      source.connect(note);
      note.connect(S.node);

      var time = audioContext.currentTime;
      source.playbackRate.value = Math.pow(2, (id - 69) / 12) / span.baseRatio;

      var gain = note.gain;
      gain.value = 0;
      gain.setValueAtTime(0, time);
      if (span.attackEnd < duration) {
        gain.linearRampToValueAtTime(1, time + span.attackEnd);
        if (span.decayTime > 0 && span.holdEnd < duration) {
          gain.linearRampToValueAtTime(1, time + span.holdEnd);
          if (span.decayEnd < duration) {
            gain.linearRampToValueAtTime(0, time + span.decayEnd);
          } else {
            gain.linearRampToValueAtTime(1 - (duration - holdEnd) / span.decayTime, time + duration);
          }
        } else {
          gain.linearRampToValueAtTime(1, time + duration);
        }
      } else {
        gain.linearRampToValueAtTime(1, time + duration);
      }
      gain.linearRampToValueAtTime(0, time + duration + 0.02267573696);

      source.start(time);
      source.stop(time + duration + 0.02267573696);
    };

    var playSound = function(sound) {
      if (!sound.buffer) return;
      if (!sound.node) {
        sound.node = audioContext.createGain();
        sound.node.gain.value = S.volume;
        sound.node.connect(volumeNode);
      }
      sound.target = S;
      sound.node.gain.setValueAtTime(S.volume, audioContext.currentTime);

      if (sound.source) {
        sound.source.disconnect();
      }
      sound.source = audioContext.createBufferSource();
      sound.source.buffer = sound.buffer;
      sound.source.connect(sound.node);

      sound.source.start(audioContext.currentTime);
    };
  }

  //these are javascript internal functions... what are they doing here???
  var save = function() {
    STACK.push(R);
    R = {};
  };

  var restore = function() {
    R = STACK.pop();
  };

  // var lastCalls = [];
  var call = function(spec, id, values) {
    // lastCalls.push(spec);
    // if (lastCalls.length > 10000) lastCalls.shift();
    var procedure = S.procedures[spec];
    if (procedure) {
      STACK.push(R);
      CALLS.push(C);
      C = {
        base: procedure.fn,
        fn: S.fns[id],
        args: values,
        numargs: [],
        boolargs: [],
        stack: STACK = [],
        warp: procedure.warp
      };
      R = {};
      if (C.warp || WARP) {
        WARP++;
        IMMEDIATE = procedure.fn;
      } else {
        for (var i = CALLS.length, j = 5; i-- && j--;) {
          if (CALLS[i].base === procedure.fn) {
            var recursive = true;
            break;
          }
        }
        if (recursive) {
          self.queue[THREAD] = {
            sprite: S,
            base: BASE,
            fn: procedure.fn,
            calls: CALLS
          };
        } else {
          IMMEDIATE = procedure.fn;
        }
      }
    } else {
      IMMEDIATE = S.fns[id];
    }
  };

  var endCall = function() {
    if (CALLS.length) {
      if (WARP) WARP--;
      IMMEDIATE = C.fn;
      C = CALLS.pop();
      STACK = C.stack;
      R = STACK.pop();
    }
  };

  var sceneChange = function() {
    return self.trigger('whenSceneStarts', self.costumes[self.currentCostumeIndex].costumeName);
  };

  var broadcast = function(name) {
    return self.trigger('whenIReceive', name);
  };

  var running = function(bases) {
	  
    for (var j = 0; j < self.queue.length; j++) {
      if (self.queue[j] && bases.indexOf(self.queue[j].base) !== -1) return true;
    }
    return false;
  };

  var queue = function(id) {
    if (WARP) {
      IMMEDIATE = S.fns[id];
    } else {
      forceQueue(id);
    }
  };

  var forceQueue = function(id) {
    self.queue[THREAD] = {
      sprite: S,
      base: BASE,
      fn: S.fns[id],
      calls: CALLS
    };
  };

  // Internal definition
  (function() {
    'use strict';

    P.Stage.prototype.framerate = 30;

    P.Stage.prototype.initRuntime = function() {
      this.queue = [];
      this.onError = this.onError.bind(this);
    };

    P.Stage.prototype.startThread = function(sprite, base) {
      var thread = {
        sprite: sprite,
        base: base,
        fn: base,
        calls: [{args: [], stack: [{}]}]
      };
      for (var i = 0; i < this.queue.length; i++) {
        var q = this.queue[i];
        if (q && q.sprite === sprite && q.base === base) {
          this.queue[i] = thread;
          return;
        }
      }
      this.queue.push(thread);
    };

    P.Stage.prototype.triggerFor = function(sprite, event, arg) {
      var threads;
      if (event === 'whenClicked') {
        threads = sprite.listeners.whenClicked;
      } else if (event === 'whenCloned') {
        threads = sprite.listeners.whenCloned;
      } else if (event === 'whenGreenFlag') {
        threads = sprite.listeners.whenGreenFlag;
      } else if (event === 'whenIReceive') {
        threads = sprite.listeners.whenIReceive[('' + arg).toLowerCase()];
      } else if (event === 'whenKeyPressed') {
        threads = sprite.listeners.whenKeyPressed[arg];
      } else if (event === 'whenSceneStarts') {
        threads = sprite.listeners.whenSceneStarts[('' + arg).toLowerCase()];
      }
      if (threads) {
        for (var i = 0; i < threads.length; i++) {
          this.startThread(sprite, threads[i]);
        }
      }
      return threads || [];
    };

    P.Stage.prototype.trigger = function(event, arg) {
      var threads = [];
      for (var i = this.children.length; i--;) {
        if (this.children[i].isSprite) {
          threads = threads.concat(this.triggerFor(this.children[i], event, arg));
        }
      }
      return threads.concat(this.triggerFor(this, event, arg));
    };

    P.Stage.prototype.triggerGreenFlag = function() {
      this.timerStart = this.now();
      this.trigger('whenGreenFlag');
    };

    P.Stage.prototype.start = function() {
      this.isRunning = true;
      if (this.interval) return;
      addEventListener('error', this.onError);
      this.baseTime = Date.now();
      this.interval = setInterval(this.step.bind(this), 1000 / this.framerate);
	  
    };

    P.Stage.prototype.pause = function() {
      if (this.interval) {
        this.baseNow = this.now();
        clearInterval(this.interval);
        delete this.interval;
        removeEventListener('error', this.onError);
      }
      this.isRunning = false;
    };

    P.Stage.prototype.stopAll = function() {
      this.hidePrompt = false;
      this.prompter.style.display = 'none';
      this.promptId = this.nextPromptId = 0;
      this.queue.length = 0;
      this.resetFilters();
      this.stopSounds();
      for (var i = 0; i < this.children.length; i++) {
        var c = this.children[i];
        if (c.isClone) {
          c.remove();
          this.children.splice(i, 1);
          i -= 1;
        } else if (c.isSprite) {
          c.resetFilters();
          if (c.saying) c.say('');
          c.stopSounds();
        }
      }
	  
	   sulfCookieVars = self.vars;
	  
    };

    P.Stage.prototype.now = function() {
      return this.baseNow + Date.now() - this.baseTime;
    };

    P.Stage.prototype.step = function() {

	 self = this;
	 
		
	 
      VISUAL = false;
      var start = Date.now();
      do {
        var queue = this.queue;
        for (THREAD = 0; THREAD < queue.length; THREAD++) {
          if (queue[THREAD]) {
            S = queue[THREAD].sprite;
            IMMEDIATE = queue[THREAD].fn;
            BASE = queue[THREAD].base;
            CALLS = queue[THREAD].calls;
            C = CALLS.pop();
            STACK = C.stack;
            R = STACK.pop();
            queue[THREAD] = undefined;
            WARP = 0;
            while (IMMEDIATE) {
              var fn = IMMEDIATE;
              IMMEDIATE = null;
              fn();
            }
            STACK.push(R);
            CALLS.push(C);
          }
        }
        for (var i = queue.length; i--;) {
          if (!queue[i]) queue.splice(i, 1);
        }
      } while ((self.isTurbo || !VISUAL) && Date.now() - start < 1000 / this.framerate && queue.length);
      this.draw();
      S = null;
    };

    P.Stage.prototype.onError = function(e) {
      this.handleError(e.error);
      clearInterval(this.interval);
    };

    P.Stage.prototype.handleError = function(e) {
      console.error(e.stack);
    };
    
  }());

  /*
    copy(JSON.stringify(instruments.map(function(g) {
      return g.map(function(r) {
        var attackTime = r[5] ? r[5][0] * 0.001 : 0;
        var holdTime = r[5] ? r[5][1] * 0.001 : 0;
        var decayTime = r[5] ? r[5][2] : 0;
        var baseRatio = Math.pow(2, (r[2] - 69) / 12);
        if (r[3] !== -1) {
          var length = r[4] - r[3];
          baseRatio = 22050 * Math.round(length * 440 * baseRatio / 22050) / length / 440;
        }
        return {
          top: r[0],
          name: r[1],
          baseRatio: baseRatio,
          loop: r[3] !== -1,
          loopStart: r[3] / 22050,
          loopEnd: r[4] / 22050,
          attackEnd: attackTime,
          holdEnd: attackTime + holdTime,
          decayEnd: attackTime + holdTime + decayTime
        }
      })
    })).replace(/"(\w+)":/g,'$1:').replace(/"/g, '\''));
  */
  var INSTRUMENTS = [[{top:38,name:'AcousticPiano_As3',baseRatio:0.5316313272700484,loop:true,loopStart:0.465578231292517,loopEnd:0.7733786848072562,attackEnd:0,holdEnd:0.1,decayEnd:22.1},{top:44,name:'AcousticPiano_C4',baseRatio:0.5905141892259927,loop:true,loopStart:0.6334693877551021,loopEnd:0.8605442176870748,attackEnd:0,holdEnd:0.1,decayEnd:20.1},{top:51,name:'AcousticPiano_G4',baseRatio:0.8843582887700535,loop:true,loopStart:0.5532879818594104,loopEnd:0.5609977324263039,attackEnd:0,holdEnd:0.08,decayEnd:18.08},{top:62,name:'AcousticPiano_C6',baseRatio:2.3557692307692304,loop:true,loopStart:0.5914739229024943,loopEnd:0.6020861678004535,attackEnd:0,holdEnd:0.08,decayEnd:16.08},{top:70,name:'AcousticPiano_F5',baseRatio:1.5776515151515151,loop:true,loopStart:0.5634920634920635,loopEnd:0.5879818594104308,attackEnd:0,holdEnd:0.04,decayEnd:14.04},{top:77,name:'AcousticPiano_Ds6',baseRatio:2.800762112139358,loop:true,loopStart:0.560907029478458,loopEnd:0.5836281179138322,attackEnd:0,holdEnd:0.02,decayEnd:10.02},{top:85,name:'AcousticPiano_Ds6',baseRatio:2.800762112139358,loop:true,loopStart:0.560907029478458,loopEnd:0.5836281179138322,attackEnd:0,holdEnd:0,decayEnd:8},{top:90,name:'AcousticPiano_Ds6',baseRatio:2.800762112139358,loop:true,loopStart:0.560907029478458,loopEnd:0.5836281179138322,attackEnd:0,holdEnd:0,decayEnd:6},{top:96,name:'AcousticPiano_D7',baseRatio:5.275119617224881,loop:true,loopStart:0.3380498866213152,loopEnd:0.34494331065759637,attackEnd:0,holdEnd:0,decayEnd:3},{top:128,name:'AcousticPiano_D7',baseRatio:5.275119617224881,loop:true,loopStart:0.3380498866213152,loopEnd:0.34494331065759637,attackEnd:0,holdEnd:0,decayEnd:2}],[{top:48,name:'ElectricPiano_C2',baseRatio:0.14870515241435123,loop:true,loopStart:0.6956009070294784,loopEnd:0.7873015873015873,attackEnd:0,holdEnd:0.08,decayEnd:10.08},{top:74,name:'ElectricPiano_C4',baseRatio:0.5945685670261941,loop:true,loopStart:0.5181859410430839,loopEnd:0.5449433106575964,attackEnd:0,holdEnd:0.04,decayEnd:8.04},{top:128,name:'ElectricPiano_C4',baseRatio:0.5945685670261941,loop:true,loopStart:0.5181859410430839,loopEnd:0.5449433106575964,attackEnd:0,holdEnd:0,decayEnd:6}],[{top:128,name:'Organ_G2',baseRatio:0.22283731584620914,loop:true,loopStart:0.05922902494331066,loopEnd:0.1510204081632653,attackEnd:0,holdEnd:0,decayEnd:0}],[{top:40,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:15},{top:56,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:13.5},{top:60,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:12},{top:67,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:8.5},{top:72,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:7},{top:83,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:5.5},{top:128,name:'AcousticGuitar_F3',baseRatio:0.3977272727272727,loop:true,loopStart:1.6628117913832199,loopEnd:1.6685260770975057,attackEnd:0,holdEnd:0,decayEnd:4.5}],[{top:40,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:15},{top:56,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:13.5},{top:60,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:12},{top:67,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:8.5},{top:72,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:7},{top:83,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:5.5},{top:128,name:'ElectricGuitar_F3',baseRatio:0.39615522817103843,loop:true,loopStart:1.5733333333333333,loopEnd:1.5848072562358277,attackEnd:0,holdEnd:0,decayEnd:4.5}],[{top:34,name:'ElectricBass_G1',baseRatio:0.11111671034065712,loop:true,loopStart:1.9007709750566892,loopEnd:1.9212244897959183,attackEnd:0,holdEnd:0,decayEnd:17},{top:48,name:'ElectricBass_G1',baseRatio:0.11111671034065712,loop:true,loopStart:1.9007709750566892,loopEnd:1.9212244897959183,attackEnd:0,holdEnd:0,decayEnd:14},{top:64,name:'ElectricBass_G1',baseRatio:0.11111671034065712,loop:true,loopStart:1.9007709750566892,loopEnd:1.9212244897959183,attackEnd:0,holdEnd:0,decayEnd:12},{top:128,name:'ElectricBass_G1',baseRatio:0.11111671034065712,loop:true,loopStart:1.9007709750566892,loopEnd:1.9212244897959183,attackEnd:0,holdEnd:0,decayEnd:10}],[{top:38,name:'Pizz_G2',baseRatio:0.21979665071770335,loop:true,loopStart:0.3879365079365079,loopEnd:0.3982766439909297,attackEnd:0,holdEnd:0,decayEnd:5},{top:45,name:'Pizz_G2',baseRatio:0.21979665071770335,loop:true,loopStart:0.3879365079365079,loopEnd:0.3982766439909297,attackEnd:0,holdEnd:0.012,decayEnd:4.012},{top:56,name:'Pizz_A3',baseRatio:0.503654636820466,loop:true,loopStart:0.5197278911564626,loopEnd:0.5287528344671202,attackEnd:0,holdEnd:0,decayEnd:4},{top:64,name:'Pizz_A3',baseRatio:0.503654636820466,loop:true,loopStart:0.5197278911564626,loopEnd:0.5287528344671202,attackEnd:0,holdEnd:0,decayEnd:3.2},{top:72,name:'Pizz_E4',baseRatio:0.7479647218453188,loop:true,loopStart:0.7947845804988662,loopEnd:0.7978231292517007,attackEnd:0,holdEnd:0,decayEnd:2.8},{top:80,name:'Pizz_E4',baseRatio:0.7479647218453188,loop:true,loopStart:0.7947845804988662,loopEnd:0.7978231292517007,attackEnd:0,holdEnd:0,decayEnd:2.2},{top:128,name:'Pizz_E4',baseRatio:0.7479647218453188,loop:true,loopStart:0.7947845804988662,loopEnd:0.7978231292517007,attackEnd:0,holdEnd:0,decayEnd:1.5}],[{top:41,name:'Cello_C2',baseRatio:0.14870515241435123,loop:true,loopStart:0.3876643990929705,loopEnd:0.40294784580498866,attackEnd:0,holdEnd:0,decayEnd:0},{top:52,name:'Cello_As2',baseRatio:0.263755980861244,loop:true,loopStart:0.3385487528344671,loopEnd:0.35578231292517004,attackEnd:0,holdEnd:0,decayEnd:0},{top:62,name:'Violin_D4',baseRatio:0.6664047388781432,loop:true,loopStart:0.48108843537414964,loopEnd:0.5151927437641723,attackEnd:0,holdEnd:0,decayEnd:0},{top:75,name:'Violin_A4',baseRatio:0.987460815047022,loop:true,loopStart:0.14108843537414967,loopEnd:0.15029478458049886,attackEnd:0.07,holdEnd:0.07,decayEnd:0.07},{top:128,name:'Violin_E5',baseRatio:1.4885238523852387,loop:true,loopStart:0.10807256235827664,loopEnd:0.1126530612244898,attackEnd:0,holdEnd:0,decayEnd:0}],[{top:30,name:'BassTrombone_A2_3',baseRatio:0.24981872564125807,loop:true,loopStart:0.061541950113378686,loopEnd:0.10702947845804989,attackEnd:0,holdEnd:0,decayEnd:0},{top:40,name:'BassTrombone_A2_2',baseRatio:0.24981872564125807,loop:true,loopStart:0.08585034013605441,loopEnd:0.13133786848072562,attackEnd:0,holdEnd:0,decayEnd:0},{top:55,name:'Trombone_B3',baseRatio:0.5608240680183126,loop:true,loopStart:0.12,loopEnd:0.17673469387755103,attackEnd:0,holdEnd:0,decayEnd:0},{top:88,name:'Trombone_B3',baseRatio:0.5608240680183126,loop:true,loopStart:0.12,loopEnd:0.17673469387755103,attackEnd:0.05,holdEnd:0.05,decayEnd:0.05},{top:128,name:'Trumpet_E5',baseRatio:1.4959294436906376,loop:true,loopStart:0.1307936507936508,loopEnd:0.14294784580498865,attackEnd:0,holdEnd:0,decayEnd:0}],[{top:128,name:'Clarinet_C4',baseRatio:0.5940193965517241,loop:true,loopStart:0.6594104308390023,loopEnd:0.7014965986394558,attackEnd:0,holdEnd:0,decayEnd:0}],[{top:40,name:'TenorSax_C3',baseRatio:0.2971698113207547,loop:true,loopStart:0.4053968253968254,loopEnd:0.4895238095238095,attackEnd:0,holdEnd:0,decayEnd:0},{top:50,name:'TenorSax_C3',baseRatio:0.2971698113207547,loop:true,loopStart:0.4053968253968254,loopEnd:0.4895238095238095,attackEnd:0.02,holdEnd:0.02,decayEnd:0.02},{top:59,name:'TenorSax_C3',baseRatio:0.2971698113207547,loop:true,loopStart:0.4053968253968254,loopEnd:0.4895238095238095,attackEnd:0.04,holdEnd:0.04,decayEnd:0.04},{top:67,name:'AltoSax_A3',baseRatio:0.49814747876378096,loop:true,loopStart:0.3875736961451247,loopEnd:0.4103854875283447,attackEnd:0,holdEnd:0,decayEnd:0},{top:75,name:'AltoSax_A3',baseRatio:0.49814747876378096,loop:true,loopStart:0.3875736961451247,loopEnd:0.4103854875283447,attackEnd:0.02,holdEnd:0.02,decayEnd:0.02},{top:80,name:'AltoSax_A3',baseRatio:0.49814747876378096,loop:true,loopStart:0.3875736961451247,loopEnd:0.4103854875283447,attackEnd:0.02,holdEnd:0.02,decayEnd:0.02},{top:128,name:'AltoSax_C6',baseRatio:2.3782742681047764,loop:true,loopStart:0.05705215419501134,loopEnd:0.0838095238095238,attackEnd:0,holdEnd:0,decayEnd:0}],[{top:61,name:'Flute_B5_2',baseRatio:2.255113636363636,loop:true,loopStart:0.08430839002267573,loopEnd:0.10244897959183673,attackEnd:0,holdEnd:0,decayEnd:0},{top:128,name:'Flute_B5_1',baseRatio:2.255113636363636,loop:true,loopStart:0.10965986394557824,loopEnd:0.12780045351473923,attackEnd:0,holdEnd:0,decayEnd:0}],[{top:128,name:'WoodenFlute_C5',baseRatio:1.1892952324548416,loop:true,loopStart:0.5181859410430839,loopEnd:0.7131065759637188,attackEnd:0,holdEnd:0,decayEnd:0}],[{top:57,name:'Bassoon_C3',baseRatio:0.29700969827586204,loop:true,loopStart:0.11011337868480725,loopEnd:0.19428571428571428,attackEnd:0,holdEnd:0,decayEnd:0},{top:67,name:'Bassoon_C3',baseRatio:0.29700969827586204,loop:true,loopStart:0.11011337868480725,loopEnd:0.19428571428571428,attackEnd:0.04,holdEnd:0.04,decayEnd:0.04},{top:76,name:'Bassoon_C3',baseRatio:0.29700969827586204,loop:true,loopStart:0.11011337868480725,loopEnd:0.19428571428571428,attackEnd:0.08,holdEnd:0.08,decayEnd:0.08},{top:84,name:'EnglishHorn_F3',baseRatio:0.39601293103448276,loop:true,loopStart:0.341859410430839,loopEnd:0.4049886621315193,attackEnd:0.04,holdEnd:0.04,decayEnd:0.04},{top:128,name:'EnglishHorn_D4',baseRatio:0.6699684005833739,loop:true,loopStart:0.22027210884353743,loopEnd:0.23723356009070296,attackEnd:0,holdEnd:0,decayEnd:0}],[{top:39,name:'Choir_F3',baseRatio:0.3968814788643197,loop:true,loopStart:0.6352380952380953,loopEnd:1.8721541950113378,attackEnd:0,holdEnd:0,decayEnd:0},{top:50,name:'Choir_F3',baseRatio:0.3968814788643197,loop:true,loopStart:0.6352380952380953,loopEnd:1.8721541950113378,attackEnd:0.04,holdEnd:0.04,decayEnd:0.04},{top:61,name:'Choir_F3',baseRatio:0.3968814788643197,loop:true,loopStart:0.6352380952380953,loopEnd:1.8721541950113378,attackEnd:0.06,holdEnd:0.06,decayEnd:0.06},{top:72,name:'Choir_F4',baseRatio:0.7928898424161845,loop:true,loopStart:0.7415419501133786,loopEnd:2.1059410430839,attackEnd:0,holdEnd:0,decayEnd:0},{top:128,name:'Choir_F5',baseRatio:1.5879576065654504,loop:true,loopStart:0.836281179138322,loopEnd:2.0585487528344673,attackEnd:0,holdEnd:0,decayEnd:0}],[{top:38,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0.1,decayEnd:8.1},{top:48,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0.1,decayEnd:7.6},{top:59,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0.06,decayEnd:7.06},{top:70,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0.04,decayEnd:6.04},{top:78,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0.02,decayEnd:5.02},{top:86,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0,decayEnd:4},{top:128,name:'Vibraphone_C3',baseRatio:0.29829545454545453,loop:true,loopStart:0.2812698412698413,loopEnd:0.28888888888888886,attackEnd:0,holdEnd:0,decayEnd:3}],[{top:128,name:'MusicBox_C4',baseRatio:0.5937634640241276,loop:true,loopStart:0.6475283446712018,loopEnd:0.6666666666666666,attackEnd:0,holdEnd:0,decayEnd:2}],[{top:128,name:'SteelDrum_D5',baseRatio:1.3660402567543959,loop:false,loopStart:-0.000045351473922902495,loopEnd:-0.000045351473922902495,attackEnd:0,holdEnd:0,decayEnd:2}],[{top:128,name:'Marimba_C4',baseRatio:0.5946035575013605,loop:false,loopStart:-0.000045351473922902495,loopEnd:-0.000045351473922902495,attackEnd:0,holdEnd:0,decayEnd:0}],[{top:80,name:'SynthLead_C4',baseRatio:0.5942328422565577,loop:true,loopStart:0.006122448979591836,loopEnd:0.06349206349206349,attackEnd:0,holdEnd:0,decayEnd:0},{top:128,name:'SynthLead_C6',baseRatio:2.3760775862068964,loop:true,loopStart:0.005623582766439909,loopEnd:0.01614512471655329,attackEnd:0,holdEnd:0,decayEnd:0}],[{top:38,name:'SynthPad_A3',baseRatio:0.4999105065330231,loop:true,loopStart:0.1910204081632653,loopEnd:3.9917006802721087,attackEnd:0.05,holdEnd:0.05,decayEnd:0.05},{top:50,name:'SynthPad_A3',baseRatio:0.4999105065330231,loop:true,loopStart:0.1910204081632653,loopEnd:3.9917006802721087,attackEnd:0.08,holdEnd:0.08,decayEnd:0.08},{top:62,name:'SynthPad_A3',baseRatio:0.4999105065330231,loop:true,loopStart:0.1910204081632653,loopEnd:3.9917006802721087,attackEnd:0.11,holdEnd:0.11,decayEnd:0.11},{top:74,name:'SynthPad_A3',baseRatio:0.4999105065330231,loop:true,loopStart:0.1910204081632653,loopEnd:3.9917006802721087,attackEnd:0.15,holdEnd:0.15,decayEnd:0.15},{top:86,name:'SynthPad_A3',baseRatio:0.4999105065330231,loop:true,loopStart:0.1910204081632653,loopEnd:3.9917006802721087,attackEnd:0.2,holdEnd:0.2,decayEnd:0.2},{top:128,name:'SynthPad_C6',baseRatio:2.3820424708835755,loop:true,loopStart:0.11678004535147392,loopEnd:0.41732426303854875,attackEnd:0,holdEnd:0,decayEnd:0}]];

  /*
    copy(JSON.stringify(drums.map(function(d) {
      var decayTime = d[4] || 0;
      var baseRatio = Math.pow(2, (60 - d[1] - 69) / 12);
      if (d[2]) {
        var length = d[3] - d[2];
        baseRatio = 22050 * Math.round(length * 440 * baseRatio / 22050) / length / 440;
      }
      return {
        name: d[0],
        baseRatio: baseRatio,
        loop: !!d[2],
        loopStart: d[2] / 22050,
        loopEnd: d[3] / 22050,
        attackEnd: 0,
        holdEnd: 0,
        decayEnd: decayTime
      }
    })).replace(/"(\w+)":/g,'$1:').replace(/"/g, '\''));
  */
  var DRUMS = [{name:'SnareDrum',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'Tom',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'SideStick',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'Crash',baseRatio:0.8908987181403393,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'HiHatOpen',baseRatio:0.9438743126816935,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'HiHatClosed',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'Tambourine',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'Clap',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'Claves',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'WoodBlock',baseRatio:0.7491535384383408,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'Cowbell',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'Triangle',baseRatio:0.8514452780229479,loop:true,loopStart:0.7638548752834468,loopEnd:0.7825396825396825,attackEnd:0,holdEnd:0,decayEnd:2},{name:'Bongo',baseRatio:0.5297315471796477,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'Conga',baseRatio:0.7954545454545454,loop:true,loopStart:0.1926077097505669,loopEnd:0.20403628117913833,attackEnd:0,holdEnd:0,decayEnd:2},{name:'Cabasa',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'GuiroLong',baseRatio:0.5946035575013605,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'Vibraslap',baseRatio:0.8408964152537145,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0},{name:'Cuica',baseRatio:0.7937005259840998,loop:false,loopStart:null,loopEnd:null,attackEnd:0,holdEnd:0,decayEnd:0}];

  return {
    scopedEval: function(source) {
      return eval(source);
    }
  };

}());