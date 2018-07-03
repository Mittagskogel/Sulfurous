Shader = {};

// Pen

Shader.penVert = `
  precision mediump float;

  attribute vec4 vertexData;
  attribute vec2 lineData;
  attribute vec4 colorData;
  
  varying vec4 fragColor;
  
  
  //vertexData:
  //[0] = x1
  //[1] = y1
  //[2] = x2
  //[3] = y2
  
  //lineData:
  //[0] = thickened vertex direction
  //[1] = thickened vertex distance
  
  //colorData:
  //[0] = red
  //[1] = green
  //[2] = blue
  //[3] = alpha
  
  
  
  void main(){
    
    vec2 lineDir = normalize(vertexData.zw - vertexData.xy);
    
    mat2 rot;
    rot[0] = vec2(cos(lineData.x), sin(lineData.x));
    rot[1] = vec2(-sin(lineData.x), cos(lineData.x));
    
    lineDir *= rot * lineData.y;
    
    vec2 p = (vertexData.xy + lineDir);
    p.x /= 240.0;
    p.y /= 180.0;
    
    gl_Position = vec4(p, 0.0, 1.0);
    fragColor = colorData;
  }
`;
  
  
Shader.penFrag = `
  precision mediump float;

  varying vec4 fragColor;

  void main(){
    
    gl_FragColor = vec4(fragColor.xyz / 255.0, fragColor.w);
  }
`;


// DrawImage

Shader.imgVert = `
  attribute vec2 position;
  attribute vec2 texcoord;
  
  uniform mat4 u_matrix;
  
  varying vec2 fragTexcoord;
  
  void main(){
    gl_Position = u_matrix * vec4(position, 0, 1);
    fragTexcoord = texcoord;
  }
`;

Shader.imgFrag = `
  precision mediump float;
  
  varying vec2 fragTexcoord;
  
  uniform sampler2D u_texture;
  
  uniform vec2 texSize;
  
  uniform vec2 colorEffect;
  uniform mat4 colorMatrix;
  // colorEffect[0] = brightness
  // colorEffect[1] = ghost
  
  uniform vec4 texEffect;
  // texEffect[0] = fisheye
  // texEffect[1] = whirl
  // texEffect[2] = pixelate
  // texEffect[3] = mosaic
  
  void main(){
    
    vec2 texCoord = fragTexcoord;
    
    vec2 m = vec2(0.5, 0.5);    
    float d = distance(texCoord, m);   
    
    
    //fisheye
    if(texEffect[0] != 0.0){
      texCoord = m + normalize(texCoord - m) * pow(0.5 / d,  texEffect[0]) / 2.0;
    }
    
    //whirl
    if(texEffect[1] != 0.0){
      float d2 = max(0.5 - d, 0.0);
      float phi = atan(0.5 - texCoord.x, 0.5 - texCoord.y);
      texCoord = vec2(0.5 - sin(phi + texEffect[1] * d2) * d,
                      0.5 - cos(phi + texEffect[1] * d2) * d);
    }
    
    //pixelate
    if(texEffect[2] != 1.0){
      texCoord = vec2(floor(texCoord.x * texSize.x / texEffect[2]) / texSize.x * texEffect[2],
                      floor(texCoord.y * texSize.y / texEffect[2]) / texSize.y * texEffect[2]);
    }
    
    //mosaic
    if(texEffect[3] != 1.0){
      texCoord = vec2(mod(texCoord.x * texEffect[3], 1.0),
                      mod(texCoord.y * texEffect[3], 1.0));    
    }
    
    vec4 c = texture2D(u_texture, texCoord);    
    
    gl_FragColor = vec4(c.xyz + colorEffect.x, c.w) * colorEffect.y * colorMatrix;
  }
`;

/*
Shader.imgVert = `
  attribute vec2 position;
  attribute vec2 texcoord;
  
  uniform mat4 u_matrix;
  
  varying vec2 fragTexcoord;
  
  void main(){
    gl_Position = u_matrix * vec4(position, 0, 1);
    fragTexcoord = texcoord;
  }
`;

Shader.imgFrag = `
  precision mediump float;
  
  varying vec2 fragTexcoord;
  
  uniform sampler2D u_texture;
  
  void main(){
    gl_FragColor = texture2D(u_texture, fragTexcoord);
    //gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
  }
`;
*/

Shader.touchingVert = `
  attribute vec2 position;
  attribute vec2 texcoord;
  
  uniform mat4 u_matrix;
  
  varying vec2 fragTexcoord;
  
  void main(){
    gl_Position = u_matrix * vec4(position, 0, 1);
    fragTexcoord = texcoord;
  }
`;

Shader.touchingFrag = `
  precision mediump float;
  
  varying vec2 fragTexcoord;
  
  uniform sampler2D u_texture;
  
  uniform vec4 tColor;
  
  uniform vec2 texSize;
  
  uniform vec2 colorEffect;
  uniform mat4 colorMatrix;
  // colorEffect[0] = brightness
  // colorEffect[1] = ghost
  
  uniform vec4 texEffect;
  // texEffect[0] = fisheye
  // texEffect[1] = whirl
  // texEffect[2] = pixelate
  // texEffect[3] = mosaic
  
  void main(){  
    vec2 texCoord = fragTexcoord;
    
    vec2 m = vec2(0.5, 0.5);    
    float d = distance(texCoord, m);   

    //fisheye
    if(texEffect[0] != 0.0){
      texCoord = m + normalize(texCoord - m) * pow(0.5 / d,  texEffect[0]) / 2.0;
    }
    
    //whirl
    if(texEffect[1] != 0.0){
      float d2 = max(0.5 - d, 0.0);
      float phi = atan(0.5 - texCoord.x, 0.5 - texCoord.y);
      texCoord = vec2(0.5 - sin(phi + texEffect[1] * d2) * d,
                      0.5 - cos(phi + texEffect[1] * d2) * d);
    }
    
    //pixelate
    if(texEffect[2] != 1.0){
      texCoord = vec2(floor(texCoord.x * texSize.x / texEffect[2]) / texSize.x * texEffect[2],
                      floor(texCoord.y * texSize.y / texEffect[2]) / texSize.y * texEffect[2]);
    }
    
    //mosaic
    if(texEffect[3] != 1.0){
      texCoord = vec2(mod(texCoord.x * texEffect[3], 1.0),
                      mod(texCoord.y * texEffect[3], 1.0));    
    }    
    
    vec4 c = texture2D(u_texture, texCoord);    
    
    if(tColor.w == 1.0 && c.xyz == tColor.xyz && c.w != 0.0){
      c = vec4(1.0, 1.0, 1.0, 1.0);
    }
    else if(tColor.w == 0.0 && c.w > 0.0){
      c = vec4(1.0, 1.0, 1.0, 1.0);
    }
    else{
      c = vec4(0.0, 0.0, 0.0, 0.0);
    }
    
    gl_FragColor = c;
  }
`;