// ================= LONG SHOT · GPU POST-PROCESSING =================
const POST={gl:null,ok:false,w:0,h:0,progs:{},fb:[],tex:null,buf:null};
function postInit(cnv){try{const gl=cnv.getContext('webgl',{alpha:false,antialias:false,premultipliedAlpha:false,preserveDrawingBuffer:false});if(!gl)return false;POST.gl=gl;
 const VS='attribute vec2 p;varying vec2 uv;void main(){uv=p*.5+.5;gl_Position=vec4(p,0.,1.);}';
 const FS={
  bright:'precision mediump float;varying vec2 uv;uniform sampler2D t;uniform float th;void main(){vec3 c=texture2D(t,uv).rgb;float l=max(max(c.r,c.g),c.b);gl_FragColor=vec4(c*smoothstep(th,1.,l)*1.2,1.);}',
  blur:'precision mediump float;varying vec2 uv;uniform sampler2D t;uniform vec2 d;void main(){vec3 c=texture2D(t,uv).rgb*.227;c+=texture2D(t,uv+d*1.38).rgb*.316;c+=texture2D(t,uv-d*1.38).rgb*.316;c+=texture2D(t,uv+d*3.23).rgb*.07;c+=texture2D(t,uv-d*3.23).rgb*.07;gl_FragColor=vec4(c,1.);}',
  fin:`precision mediump float;varying vec2 uv;uniform sampler2D s;uniform sampler2D b;uniform float bs,tm,ab,shim,grain,vig,flash,sat,sharp;uniform vec3 grade;uniform vec2 res;
   float rnd(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
   void main(){vec2 u=uv;if(shim>0.){float w=smoothstep(.0,.55,.62-uv.y)*smoothstep(-.1,.2,uv.y);u.x+=sin(uv.y*140.+tm*5.)*.0014*shim*w;u.y+=cos(uv.x*90.+tm*3.)*.0008*shim*w;}
   vec2 dd=(uv-.5)*ab;vec3 c=vec3(texture2D(s,u+dd).r,texture2D(s,u).g,texture2D(s,u-dd).b);
   vec2 px=1./res;vec3 nb=texture2D(s,u+vec2(px.x,0.)).rgb+texture2D(s,u-vec2(px.x,0.)).rgb+texture2D(s,u+vec2(0.,px.y)).rgb+texture2D(s,u-vec2(0.,px.y)).rgb;c+=(c*4.-nb)*sharp;
   c+=texture2D(b,uv).rgb*bs*vec3(1.06,1.,.94);c*=grade;float l=dot(c,vec3(.299,.587,.114));c=mix(vec3(l),c,sat);c=(c-.5)*1.06+.5;vec3 a=max(c,0.)*1.05;vec3 tmap=(a*(2.51*a+.03))/(a*(2.43*a+.59)+.14);c=mix(c,tmap,.32);
   c*=1.-vig*dot(uv-.5,uv-.5)*1.7;c+=(rnd(uv*res+tm)-.5)*grain;c=mix(c,vec3(1.),flash);gl_FragColor=vec4(c,1.);}`};
 const mk=(src,t)=>{const s=gl.createShader(t);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw gl.getShaderInfoLog(s);return s};
 for(const k in FS){const p=gl.createProgram();gl.attachShader(p,mk(VS,gl.VERTEX_SHADER));gl.attachShader(p,mk(FS[k],gl.FRAGMENT_SHADER));gl.bindAttribLocation(p,0,'p');gl.linkProgram(p);if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw'link';const U={};const n=gl.getProgramParameter(p,gl.ACTIVE_UNIFORMS);for(let i=0;i<n;i++){const a=gl.getActiveUniform(p,i);U[a.name]=gl.getUniformLocation(p,a.name)}POST.progs[k]={p,U}}
 POST.buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,POST.buf);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);gl.enableVertexAttribArray(0);gl.vertexAttribPointer(0,2,gl.FLOAT,false,0,0);
 POST.tex=mkTex();POST.ok=true;return true}catch(e){console.warn('post off',e);POST.ok=false;return false}}
function mkTex(){const gl=POST.gl,t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);return t}
function postSize(w,h){const gl=POST.gl;if(!POST.ok)return;POST.w=w;POST.h=h;const bw=Math.max(2,w>>2),bh=Math.max(2,h>>2);POST.bw=bw;POST.bh=bh;
 POST.fb.forEach(f=>{gl.deleteFramebuffer(f.f);gl.deleteTexture(f.t)});POST.fb=[0,1].map(()=>{const t=mkTex();gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,bw,bh,0,gl.RGBA,gl.UNSIGNED_BYTE,null);const f=gl.createFramebuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,f);gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,t,0);return{t,f}});gl.bindFramebuffer(gl.FRAMEBUFFER,null)}
function postFrame(src,o){const gl=POST.gl;if(!POST.ok)return false;
 gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,POST.tex);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,src);
 const draw=(name,fb,w,h,set)=>{const P=POST.progs[name];gl.useProgram(P.p);gl.bindFramebuffer(gl.FRAMEBUFFER,fb);gl.viewport(0,0,w,h);set(P.U);gl.drawArrays(gl.TRIANGLE_STRIP,0,4)};
 const[A,B]=POST.fb;
 draw('bright',A.f,POST.bw,POST.bh,U=>{gl.bindTexture(gl.TEXTURE_2D,POST.tex);gl.uniform1i(U.t,0);gl.uniform1f(U.th,o.th)});
 for(let k=0;k<o.passes;k++){const r=1+k*1.5;
  draw('blur',B.f,POST.bw,POST.bh,U=>{gl.bindTexture(gl.TEXTURE_2D,A.t);gl.uniform1i(U.t,0);gl.uniform2f(U.d,r/POST.bw,0)});
  draw('blur',A.f,POST.bw,POST.bh,U=>{gl.bindTexture(gl.TEXTURE_2D,B.t);gl.uniform1i(U.t,0);gl.uniform2f(U.d,0,r/POST.bh)})}
 draw('fin',null,POST.w,POST.h,U=>{gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,A.t);gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,POST.tex);
  gl.uniform1i(U.s,0);gl.uniform1i(U.b,1);gl.uniform1f(U.bs,o.bloom);gl.uniform1f(U.tm,o.t);gl.uniform1f(U.ab,o.ab);gl.uniform1f(U.shim,o.shim);gl.uniform1f(U.grain,o.grain);gl.uniform1f(U.vig,o.vig);gl.uniform1f(U.flash,o.flash);gl.uniform1f(U.sat,o.sat);gl.uniform1f(U.sharp,o.sharp||0);gl.uniform3f(U.grade,o.grade[0],o.grade[1],o.grade[2]);gl.uniform2f(U.res,POST.w,POST.h)});
 return true}
