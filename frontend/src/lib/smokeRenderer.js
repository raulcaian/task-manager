/*
 * Full-screen smoke drawn by a WebGL fragment shader: layered noise (fbm)
 * warped by itself so it curls, with a hole that opens from the centre as
 * `uClear` goes from 0 to 1, a soft red glow behind it (the tail lights)
 * and a small swirl around the mouse pointer.
 */

const VERTEX = 'attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}';

const FRAGMENT = `precision highp float;
uniform vec2 uRes; uniform float uTime,uClear,uLight; uniform vec2 uMouse;
float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}
float noise(vec2 p){vec2 i=floor(p),f=fract(p);vec2 u=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),u.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),u.x),u.y);}
float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<6;i++){v+=a*noise(p);p=m*p;a*=.5;}return v;}
void main(){
  vec2 p=(gl_FragCoord.xy-.5*uRes)/uRes.y;
  float t=uTime*.055;
  vec2 dir=p/(length(p)+.001);
  vec2 q=p*1.5-dir*uClear*1.1+vec2(0.,-t*.7);
  vec2 m=(uMouse-.5*uRes)/uRes.y; vec2 dm=p-m; float mf=exp(-length(dm)*5.);
  q+=mf*.35*vec2(-dm.y,dm.x)/(length(dm)+.05);
  vec2 w=vec2(fbm(q+vec2(0.,t)),fbm(q+vec2(5.2,1.3)-t));
  vec2 w2=vec2(fbm(q+3.*w+vec2(1.7,9.2)+t*.5),fbm(q+3.*w+vec2(8.3,2.8)-t*.4));
  float d=fbm(q+3.2*w2);
  float r=length(p*vec2(.85,1.25))+(d-.5)*.55;
  float hole=smoothstep(uClear*1.9-.35,uClear*1.9+.05,r);
  hole=mix(1.,hole,smoothstep(0.,.04,uClear));
  float dens=(.62+.7*smoothstep(.2,.85,d))*hole*(1.-smoothstep(.7,1.,uClear));
  dens*=1.-mf*.35;
  float a=clamp(dens,0.,1.);
  vec3 col=mix(vec3(.04,.04,.05),vec3(.72,.73,.76),pow(d,1.5));
  vec2 L=vec2(0.,-.2);
  float gl=exp(-length((p-L)*vec2(.75,2.4))*3.)*uLight;
  col+=vec3(1.,.05,.08)*gl*(.2+1.1*d)*.9;
  col+=vec3(.9,.92,1.)*.12*smoothstep(.55,.9,w2.x)*(1.-gl);
  gl_FragColor=vec4(col*a,a);
}`;

/** The smoke is soft anyway, so it is drawn at 60 % resolution and scaled up. */
export const SMOKE_SCALE = 0.6;

function compile(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(log || 'Shader did not compile');
  }
  return shader;
}

/**
 * Returns `{ resize, draw, dispose }`, or null when WebGL is not available
 * (old devices, or disabled): the caller then shows a plain gradient instead.
 */
export function createSmokeRenderer(canvas) {
  let gl = null;
  try {
    gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
  } catch {
    gl = null;
  }
  if (!gl) return null;

  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl, gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(program, compile(gl, gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Program did not link');
  } catch {
    return null;
  }
  gl.useProgram(program);

  // One triangle that covers the whole screen.
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'a');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  const uniform = Object.fromEntries(
    ['uRes', 'uTime', 'uClear', 'uLight', 'uMouse'].map((name) => [name, gl.getUniformLocation(program, name)]),
  );

  return {
    resize(width, height) {
      canvas.width = Math.max(1, Math.round(width * SMOKE_SCALE));
      canvas.height = Math.max(1, Math.round(height * SMOKE_SCALE));
      gl.viewport(0, 0, canvas.width, canvas.height);
    },
    /** `mouse` is in CSS pixels from the top-left of the canvas. */
    draw({ time, clear, light, mouse }) {
      gl.uniform2f(uniform.uRes, canvas.width, canvas.height);
      gl.uniform1f(uniform.uTime, time);
      gl.uniform1f(uniform.uClear, clear);
      gl.uniform1f(uniform.uLight, light);
      // WebGL counts y from the bottom.
      gl.uniform2f(uniform.uMouse, mouse[0] * SMOKE_SCALE, canvas.height - mouse[1] * SMOKE_SCALE);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    dispose() {
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    },
  };
}
