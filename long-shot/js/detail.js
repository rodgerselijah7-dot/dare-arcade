// ================= LONG SHOT · HIGH-DETAIL RENDER LAYER =================
// Loaded after render.js: overrides some draw functions with richer versions and adds new layers.
const OUTL='rgba(12,7,4,.55)';
function lightX(){const s=B.sun||B.moon;return s?(s.x<.5?-1:1):1}
const HQ=()=>SV.set.gfx!=='low';

// ---------- limbs: ink outline + cylindrical highlight ----------
function limb(x1,y1,x2,y2,w,c){ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=OUTL;ctx.lineWidth=w+2.2;ctx.stroke();ctx.strokeStyle=c;ctx.lineWidth=w;ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.13)';ctx.lineWidth=w*.32;ctx.stroke()}
function limb3(a,b,c,w,col){ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(c[0],c[1]);ctx.strokeStyle=OUTL;ctx.lineWidth=w+2.2;ctx.stroke();ctx.strokeStyle=col;ctx.lineWidth=w;ctx.stroke();ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=w*.3;ctx.stroke()}

// ---------- arrows: grain, cresting, barbed fletching, steel head ----------
function arrowShape(len,kind,head=true,glow=false){const kc=KC(kind),el=kind&&kind!=='std';
 if(glow&&el){ctx.save();ctx.shadowColor=kc;ctx.shadowBlur=18;ctx.fillStyle=kc;ctx.beginPath();ctx.arc(0,0,5+Math.sin(G.t*30)*1.5,0,7);ctx.fill();ctx.restore()}
 ctx.strokeStyle=OUTL;ctx.lineWidth=4;ctx.lineCap='butt';ctx.beginPath();ctx.moveTo(-len,0);ctx.lineTo(-2,0);ctx.stroke();
 const sg=ctx.createLinearGradient(0,-1.5,0,1.5);sg.addColorStop(0,'#f6e6c4');sg.addColorStop(.5,'#c9a46e');sg.addColorStop(1,'#8a6a40');ctx.strokeStyle=sg;ctx.lineWidth=2.8;ctx.beginPath();ctx.moveTo(-len,0);ctx.lineTo(0,0);ctx.stroke();
 ctx.strokeStyle='rgba(90,60,30,.35)';ctx.lineWidth=.5;ctx.beginPath();for(let k=-len+14;k<-6;k+=9){ctx.moveTo(k,-.6);ctx.lineTo(k+5,-.6)}ctx.stroke();
 if(head){const hg=ctx.createLinearGradient(-7,-5,4,5);if(el){hg.addColorStop(0,shade(kc,.35));hg.addColorStop(1,shade(kc,-.25))}else{hg.addColorStop(0,'#f4f7fa');hg.addColorStop(.5,'#aab4be');hg.addColorStop(1,'#5f6a75')}
  ctx.fillStyle=hg;ctx.beginPath();if(kind==='split'){ctx.moveTo(8,0);ctx.lineTo(-6,6.5);ctx.lineTo(-2,0);ctx.lineTo(-6,-6.5)}else if(kind==='magnet'){ctx.arc(1,0,4.8,0,7)}else{ctx.moveTo(8,0);ctx.lineTo(-7,5.5);ctx.lineTo(-4.5,0);ctx.lineTo(-7,-5.5)}ctx.closePath();ctx.fill();ctx.strokeStyle=OUTL;ctx.lineWidth=.9;ctx.stroke();
  ctx.fillStyle='rgba(255,255,255,.7)';ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-5.5,4);ctx.lineTo(-4,0);ctx.fill();ctx.fillStyle='#3a2a1a';ctx.fillRect(-6,-1.8,3,3.6)}
 const fc=el?kc:'#f4f4f4',fd=el?shade(kc,-.3):'#c9c9c9';
 for(const s of[1,-1]){const fg=ctx.createLinearGradient(0,0,0,7*s);fg.addColorStop(0,fd);fg.addColorStop(1,fc);ctx.fillStyle=fg;ctx.beginPath();ctx.moveTo(-len+1,0);ctx.lineTo(-len-10,6.8*s);ctx.lineTo(-len+4,7*s);ctx.lineTo(-len+11,1*s);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=.5;ctx.beginPath();for(let k=0;k<4;k++){ctx.moveTo(-len-6+k*3.5,4.5*s);ctx.lineTo(-len-3+k*3.5,1.4*s)}ctx.stroke()}
 ctx.fillStyle='#c0392b';ctx.fillRect(-len+12,-1.7,2.2,3.4);ctx.fillStyle='#14110e';ctx.fillRect(-len+15.5,-1.7,1.4,3.4);ctx.fillStyle='#e8d9b0';ctx.fillRect(-len-1.5,-1.5,2,3)}

// ---------- towers: per-brick masonry, crenellations, slits, doors, moss, ivy ----------
function drawTower(i){if(M.wood&&M.wood[i])return drawScaffold(i);const x=M.xs[i],h=M.hs[i],w=116,S=B.stone,a=G.A[i],d=towerSide(i),L=lightX();
 ctx.fillStyle=shade(S[2],-.35);ctx.fillRect(x-w/2,0,w,h);
 const bh=18,bw=28;
 for(let y=0,row=0;y<h-13;y+=bh,row++){const off=row%2?14:0;for(let bx=-w/2-off;bx<w/2;bx+=bw){const x0=Math.max(x-w/2,x+bx),x1=Math.min(x+w/2,x+bx+bw);if(x1-x0<4)continue;
  const hv=hash(x*.13+bx*7.1+y*3.7),ls=((x0+x1)/2-x)/(w/2)*L;ctx.fillStyle=shade(S[0],(hv-.5)*.24-.12+ls*.14);ctx.fillRect(x0+1.2,y+1.2,x1-x0-2.4,bh-2.4);
  ctx.fillStyle='rgba(255,255,255,.08)';ctx.fillRect(x0+1.2,y+bh-3.4,x1-x0-2.4,2);ctx.fillStyle='rgba(0,0,0,.12)';ctx.fillRect(x0+1.2,y+1.2,x1-x0-2.4,2);
  if(hv>.85){ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.arc(x0+(x1-x0)*hash(hv*9),y+5+hash(hv*3)*8,1.5+hv*2,0,7);ctx.fill()}
  if(B.snowcap&&hv>.7){ctx.fillStyle='rgba(250,252,255,.85)';ctx.fillRect(x0+1,y+bh-2.5,x1-x0-2,2.5)}}}
 const sh=ctx.createLinearGradient(x-w/2,0,x+w/2,0);sh.addColorStop(0,L>0?'rgba(0,0,0,.32)':'rgba(255,255,255,.05)');sh.addColorStop(.5,'rgba(0,0,0,0)');sh.addColorStop(1,L>0?'rgba(255,255,255,.06)':'rgba(0,0,0,.32)');ctx.fillStyle=sh;ctx.fillRect(x-w/2,0,w,h);
 if(B.lightning||B.wx==='rain'){ctx.fillStyle='rgba(200,220,240,.07)';for(let k=0;k<6;k++){const sx=x-w/2+hash(x+k)*w;ctx.fillRect(sx,0,2,h*(.4+hash(k+x)*.6))}}
 // cracks
 ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=1.1;ctx.beginPath();for(let k=0;k<2;k++){let cx=x-w/2+hash(x*3+k)*w,cy=h*(.3+hash(x+k*5)*.5);ctx.moveTo(cx,cy);for(let s=0;s<5;s++){cx+=(hash(cx+s)-.5)*10;cy-=6+hash(cy+s)*6;ctx.lineTo(cx,cy)}}ctx.stroke();
 // arrow slit
 if(h>110){const sy=h*.52;ctx.fillStyle=shade(S[1],-.1);ctx.fillRect(x-8,sy-16,16,32);ctx.fillStyle='#0a0806';ctx.beginPath();ctx.moveTo(x-2.5,sy-12);ctx.lineTo(x+2.5,sy-12);ctx.lineTo(x+2.5,sy+10);ctx.arc(x,sy+10,2.5,0,Math.PI);ctx.closePath();ctx.fill();
  if(B.torch){ctx.fillStyle='rgba(255,170,80,.75)';ctx.fillRect(x-1.5,sy-10,3,18)}}
 // door
 if(h>150){ctx.fillStyle=shade(S[2],-.2);ctx.beginPath();ctx.moveTo(x-19,0);ctx.lineTo(x-19,40);ctx.arc(x,40,19,Math.PI,0,true);ctx.lineTo(x+19,0);ctx.fill();
  const dg=ctx.createLinearGradient(x-15,0,x+15,0);dg.addColorStop(0,'#3a2412');dg.addColorStop(.5,'#6b4423');dg.addColorStop(1,'#2a1a0c');ctx.fillStyle=dg;ctx.beginPath();ctx.moveTo(x-15,0);ctx.lineTo(x-15,40);ctx.arc(x,40,15,Math.PI,0,true);ctx.lineTo(x+15,0);ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.4)';ctx.lineWidth=1;ctx.beginPath();for(let k=-10;k<=10;k+=5){ctx.moveTo(x+k,0);ctx.lineTo(x+k,52-Math.abs(k)*.6)}ctx.stroke();ctx.fillStyle='#2a2a30';ctx.fillRect(x-15,12,30,3);ctx.fillRect(x-15,32,30,3);ctx.fillStyle='#9aa3ad';for(let k=-12;k<=12;k+=6){ctx.fillRect(x+k-.8,12.6,1.6,1.6);ctx.fillRect(x+k-.8,32.6,1.6,1.6)}ctx.fillStyle='#c9a24a';ctx.beginPath();ctx.arc(x+9,24,1.8,0,7);ctx.fill()}
 // cap + crenellations
 const capG=ctx.createLinearGradient(0,h-14,0,h);capG.addColorStop(0,shade(S[1],-.15));capG.addColorStop(1,S[0]);ctx.fillStyle=capG;ctx.fillRect(x-w/2-8,h-14,w+16,14);ctx.fillStyle='rgba(0,0,0,.35)';ctx.fillRect(x-w/2-8,h-16,w+16,3);ctx.fillStyle='rgba(255,255,255,.18)';ctx.fillRect(x-w/2-8,h-1.5,w+16,1.5);
 for(const mx of[x-w/2-8,x+w/2-14]){const mg=ctx.createLinearGradient(mx,0,mx+22,0);mg.addColorStop(0,shade(S[0],-.1));mg.addColorStop(1,shade(S[1],-.1));ctx.fillStyle=mg;ctx.fillRect(mx,h,22,15);ctx.fillStyle='rgba(255,255,255,.15)';ctx.fillRect(mx,h+13.5,22,1.5);ctx.strokeStyle=OUTL;ctx.lineWidth=1;ctx.strokeRect(mx,h,22,15);if(B.snowcap){ctx.fillStyle='#f6faff';ctx.beginPath();ctx.ellipse(mx+11,h+15,13,3.5,0,0,7);ctx.fill()}}
 // moss drips & ivy
 const mossy=B.ground.st==='grass'&&!B.snowcap;
 if(mossy){ctx.fillStyle=shade(B.ground.top,-.25);for(let k=0;k<12;k++){const mx=x-w/2-6+k*(w+12)/11,len=4+hash(x+k*3)*14;ctx.beginPath();ctx.ellipse(mx,h-15,6,3,0,0,7);ctx.fill();if(hash(k+x)>.5)ctx.fillRect(mx-1,h-15-len,2,len)}
  if(hash(x*.77)>.45){const side=hash(x)>.5?1:-1,vx=x+side*(w/2-10);ctx.strokeStyle=shade(B.ground.top,-.35);ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(vx,h-14);let cy=h-14,cx=vx;const end=Math.max(10,h*(.25+hash(x*1.3)*.5));while(cy>end){cy-=8;cx=vx+Math.sin(cy*.12)*5;ctx.lineTo(cx,cy)}ctx.stroke();
   ctx.fillStyle=shade(B.ground.top,-.1);for(let yy=h-20;yy>end;yy-=9){const lx=vx+Math.sin(yy*.12)*5;ctx.beginPath();ctx.ellipse(lx+(yy%18?4:-4),yy,4,2.4,yy%18?.6:-.6,0,7);ctx.fill()}}}
 // banner
 if(a&&!a._noBanner){const o=OUT[a.out],bx=x+d*(w/2+2);const wave=Math.sin(G.t*3+i)*4+G.wind*6;ctx.save();ctx.translate(bx,h-16);ctx.scale(d,1);
  ctx.fillStyle='#2a2a30';ctx.fillRect(-3,-2,32,4);
  const bg=ctx.createLinearGradient(0,0,24,0);bg.addColorStop(0,o.dark);bg.addColorStop(.6,o.main);bg.addColorStop(1,shade(o.main,.15));ctx.fillStyle=bg;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(24,0);ctx.quadraticCurveTo(25+wave*.2,-30,24+wave*.3,-60);ctx.lineTo(12+wave*.5,-50);ctx.lineTo(0+wave*.3,-60);ctx.quadraticCurveTo(1+wave*.2,-30,0,0);ctx.closePath();ctx.fill();ctx.strokeStyle=OUTL;ctx.lineWidth=1;ctx.stroke();
  ctx.strokeStyle=o.acc;ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(2,-3);ctx.lineTo(22,-3);ctx.stroke();ctx.beginPath();ctx.moveTo(2+wave*.28,-55);ctx.lineTo(12+wave*.45,-46);ctx.lineTo(22+wave*.28,-55);ctx.stroke();
  ctx.fillStyle=o.acc;ctx.beginPath();ctx.moveTo(12+wave*.15,-15);ctx.lineTo(18+wave*.18,-25);ctx.lineTo(12+wave*.2,-35);ctx.lineTo(6+wave*.18,-25);ctx.fill();ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(16,-56,8,54);
  if(G.cfg&&G.cfg.layout==='team'){ctx.fillStyle=TEAMC(a.team);ctx.fillRect(0,-60,24,5)}ctx.restore()}
 if(B.torch){const tx=x-d*48;if(B.lamp){const lg=ctx.createLinearGradient(tx-3,0,tx+3,0);lg.addColorStop(0,'#0e0d12');lg.addColorStop(.5,'#3a3846');lg.addColorStop(1,'#0e0d12');ctx.fillStyle=lg;ctx.fillRect(tx-2.5,h,5,92);ctx.fillRect(tx-2.5,h+88,d*-18,5);ctx.fillStyle='#ffe2b0';ctx.beginPath();ctx.ellipse(tx-d*18,h+86,7,4,0,0,7);ctx.fill()}
  else{ctx.fillStyle='#2a1a10';ctx.fillRect(tx-2,h,4,44);ctx.fillStyle='#4a3020';ctx.beginPath();ctx.moveTo(tx-7,h+44);ctx.lineTo(tx+7,h+44);ctx.lineTo(tx+4,h+52);ctx.lineTo(tx-4,h+52);ctx.fill();ctx.strokeStyle='#1a1008';ctx.lineWidth=1;ctx.strokeRect(tx-6,h+44,12,3)}}
 if(B.snowcap){ctx.fillStyle='#f6faff';ctx.beginPath();ctx.moveTo(x-w/2-10,h);for(let k=0;k<=10;k++)ctx.lineTo(x-w/2-10+k*(w+20)/10,h+4+hash(x+k)*6);ctx.lineTo(x+w/2+10,h);ctx.lineTo(x+w/2+6,h-8);ctx.lineTo(x-w/2-6,h-8);ctx.fill();ctx.fillStyle='rgba(160,190,230,.4)';ctx.fillRect(x-w/2-6,h-8,w+12,2)}
 else{ctx.fillStyle=B.ground.st==='sand'?'#b8834e':B.ground.st==='asphalt'?'#3a3644':B.ground.top;for(let k=0;k<9;k++){const kx=x-w/2-6+k*(w+12)/8;ctx.beginPath();ctx.ellipse(kx,h,8,3.5,0,0,7);ctx.fill()}}
 const ao=ctx.createLinearGradient(0,0,0,60);ao.addColorStop(0,'rgba(0,0,0,.45)');ao.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=ao;ctx.fillRect(x-w/2,0,w,60);
 ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(x-L*30,0,w*.75,8,0,0,7);ctx.fill()}

// ---------- ground props ----------
function nearTower(u){for(const tx of M.xs)if(Math.abs(u-tx)<90)return true;for(const o of G.obsLive)if(!o.dead&&o.type!=='plat'&&Math.abs(u-o.x)<o.w/2+30)return true;return false}
function drawProps(){if(!HQ())return;const c=G.cam,z=c.z,x0=c.x-W/2/z-80,x1=c.x+W/2/z+80,st=B.ground.st,bk=M.bk,sp=64;
 for(let u=Math.floor(x0/sp)*sp;u<x1;u+=sp){const hv=hash(u*.71+3),x=u+hash(u*1.9)*30;if(nearTower(x))continue;ctx.save();ctx.translate(x,0);const s=.7+hash(u*2.3)*.7;ctx.scale(s,s);
  if(bk==='meadow'){if(hv<.35){const cols=['#ff5a6a','#ffd75a','#ffffff','#b388ff','#ff9a3a'];for(let k=0;k<3;k++){const fx=(k-1)*6,fh=12+hash(u+k)*10,sw=Math.sin(G.t*2+u+k)*1.5;ctx.strokeStyle='#4f8a2a';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(fx,0);ctx.quadraticCurveTo(fx+sw,fh*.5,fx+sw*1.5,fh);ctx.stroke();ctx.fillStyle=cols[(hash(u+k*7)*5)|0];for(let p=0;p<5;p++){ctx.beginPath();ctx.arc(fx+sw*1.5+Math.cos(p*1.26)*2.3,fh+Math.sin(p*1.26)*2.3,1.7,0,7);ctx.fill()}ctx.fillStyle='#ffe08a';ctx.beginPath();ctx.arc(fx+sw*1.5,fh,1.2,0,7);ctx.fill()}}
   else if(hv<.5)rockProp(hv);else if(hv<.65)bushProp('#3f7a2a','#5f9e3a')}
  else if(bk==='highlands'){if(hv<.25){for(let k=0;k<3;k++){const mx=(k-1)*7,mh=5+hash(u+k)*7;ctx.fillStyle='#d8d0c0';ctx.fillRect(mx-1,0,2,mh);ctx.fillStyle='#4fd8c8';ctx.beginPath();ctx.ellipse(mx,mh,4.5,2.6,0,Math.PI,0,true);ctx.fill();ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=.35+.25*Math.sin(G.t*2+u+k);ctx.fillStyle='#4fffe0';ctx.beginPath();ctx.arc(mx,mh+1,7,0,7);ctx.fill();ctx.restore()}}else if(hv<.45)rockProp(hv);else if(hv<.6)fernProp('#1f4a3a')}
  else if(bk==='canyon'){if(hv<.25)cactusProp();else if(hv<.45)rockProp(hv);else if(hv<.6)shrubProp('#7a5a3a')}
  else if(bk==='frost'){if(hv<.35){rockProp(hv);ctx.fillStyle='#f6faff';ctx.beginPath();ctx.ellipse(0,12*(.6+hv),14,4,0,0,7);ctx.fill()}else if(hv<.55)shrubProp('#5a6070')}
  else if(bk==='storm'){if(hv<.3)rockProp(hv);else if(hv<.45){ctx.fillStyle='#5a4a3a';ctx.save();ctx.rotate(.05);ctx.fillRect(-22,0,44,6);ctx.restore();ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(-20,3);ctx.lineTo(20,3);ctx.stroke()}else if(hv<.6){ctx.fillStyle='rgba(120,150,180,.35)';ctx.beginPath();ctx.ellipse(0,1,24,3,0,0,7);ctx.fill();ctx.fillStyle='rgba(220,235,255,.25)';ctx.fillRect(-10,1,10,1)}}
  else if(bk==='city'){if(hv<.18){ctx.fillStyle='#c0392b';ctx.fillRect(-5,0,10,16);ctx.fillRect(-7,14,14,4);ctx.beginPath();ctx.arc(0,18,5,Math.PI,0,true);ctx.fill();ctx.fillStyle='#e8e0d0';ctx.fillRect(-8,7,16,3)}
   else if(hv<.34){ctx.fillStyle='#3a3a44';ctx.fillRect(-8,0,16,22);ctx.fillStyle='#4a4a56';ctx.fillRect(-9,22,18,3);ctx.strokeStyle='rgba(255,255,255,.12)';ctx.lineWidth=1;ctx.beginPath();for(let k=-5;k<=5;k+=5){ctx.moveTo(k,2);ctx.lineTo(k,20)}ctx.stroke()}
   else if(hv<.46){ctx.fillStyle='#ff7a1a';ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(8,0);ctx.lineTo(2,20);ctx.lineTo(-2,20);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(-4.5,8,9,3)}}
  ctx.restore()}}
function rockProp(hv){const g=ctx.createLinearGradient(-14,0,14,14);g.addColorStop(0,shade(B.stone[0],.05));g.addColorStop(1,shade(B.stone[2],-.1));ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-16,0);ctx.lineTo(-12,8+hv*6);ctx.lineTo(-3,13+hv*5);ctx.lineTo(8,11+hv*4);ctx.lineTo(15,4);ctx.lineTo(16,0);ctx.closePath();ctx.fill();ctx.strokeStyle=OUTL;ctx.lineWidth=1;ctx.stroke();ctx.fillStyle='rgba(255,255,255,.15)';ctx.beginPath();ctx.moveTo(-10,8+hv*6);ctx.lineTo(-3,12+hv*5);ctx.lineTo(4,11);ctx.lineTo(-4,8);ctx.fill()}
function bushProp(a,b){[[-8,7,9],[6,8,10],[0,13,9]].forEach((e,k)=>{ctx.fillStyle=k===2?b:a;ctx.beginPath();ctx.arc(e[0],e[1],e[2],0,7);ctx.fill()});ctx.fillStyle='rgba(255,255,255,.1)';ctx.beginPath();ctx.arc(-1,16,4,0,7);ctx.fill()}
function fernProp(c){ctx.strokeStyle=c;ctx.lineWidth=1.4;for(let k=-2;k<=2;k++){ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(k*6,14,k*12,16-Math.abs(k)*3);ctx.stroke()}}
function cactusProp(){const g=ctx.createLinearGradient(-5,0,5,0);g.addColorStop(0,'#2f5a2a');g.addColorStop(.5,'#5a8a3a');g.addColorStop(1,'#2a4a24');ctx.fillStyle=g;const rr=(x,y,w,h)=>{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+h-w/2);ctx.arc(x+w/2,y+h-w/2,w/2,Math.PI,0,true);ctx.lineTo(x+w,y);ctx.fill()};
 rr(-5,0,10,48);rr(-17,20,8,18);ctx.fillRect(-13,20,10,6);rr(9,26,8,14);ctx.fillRect(3,26,10,6);ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(0,2);ctx.lineTo(0,44);ctx.stroke()}
function shrubProp(c){ctx.strokeStyle=c;ctx.lineWidth=1.2;ctx.lineCap='round';ctx.beginPath();for(let k=0;k<7;k++){const a=(k-3)*.28,len=12+hash(k*1.7)*9;ctx.moveTo(0,0);ctx.lineTo(Math.sin(a)*len,Math.cos(a)*len);ctx.moveTo(Math.sin(a)*len*.6,Math.cos(a)*len*.6);ctx.lineTo(Math.sin(a+.4)*len*.8,Math.cos(a+.4)*len*.8)}ctx.stroke()}

// ---------- decals & impact flashes ----------
function drawDecals(){for(const dc of G.decals||[]){ctx.save();ctx.translate(dc.x,dc.y);const g=ctx.createRadialGradient(0,0,0,0,0,dc.r);const c=dc.k==='fire'||dc.k==='bolt'?'20,14,10':dc.k==='ice'?'200,235,255':dc.k==='poison'?'90,200,60':'40,28,18';const a=dc.k==='ice'?.55:dc.k==='poison'?.35:.5;
 g.addColorStop(0,`rgba(${c},${a})`);g.addColorStop(1,`rgba(${c},0)`);ctx.fillStyle=g;ctx.scale(1,.22);ctx.beginPath();ctx.arc(0,0,dc.r,0,7);ctx.fill();ctx.restore()}}
function drawFlashes(){const L=G.flashes||[];ctx.save();ctx.globalCompositeOperation='lighter';for(let k=L.length-1;k>=0;k--){const f=L[k],t=(G.t-f.t0)/f.dur;if(t>=1){L.splice(k,1);continue}const r=f.r*(.6+t*.8);const g=ctx.createRadialGradient(f.x,f.y,0,f.x,f.y,r);g.addColorStop(0,`rgba(${f.c},${(1-t)*.9})`);g.addColorStop(1,`rgba(${f.c},0)`);ctx.fillStyle=g;ctx.fillRect(f.x-r,f.y-r,r*2,r*2)}ctx.restore()}
function addFlash(x,y,r,c,dur){(G.flashes=G.flashes||[]).push({x,y,r,c,dur:dur||.25,t0:G.t})}
function addDecal(x,y,r,k){const L=(G.decals=G.decals||[]);L.push({x,y,r,k});if(L.length>40)L.shift()}

// ---------- sky extras: aurora, shooting stars, neon ----------
function skyExtras(){if(!HQ())return;
 if(M.bk==='highlands'){ctx.save();ctx.globalCompositeOperation='lighter';const cols=[['60,255,170'],['80,200,255'],['190,110,255']];
  cols.forEach((c,k)=>{const yb=H*(.12+k*.06);ctx.beginPath();const pts=[];for(let x=-20;x<=W+20;x+=16*DPR){const y=yb+Math.sin(x*.0028/DPR+G.t*.25+k*1.7)*H*.05+Math.sin(x*.009/DPR-G.t*.4+k)*H*.015;pts.push([x,y])}
   ctx.moveTo(pts[0][0],pts[0][1]);pts.forEach(p=>ctx.lineTo(p[0],p[1]));for(let q=pts.length-1;q>=0;q--)ctx.lineTo(pts[q][0],pts[q][1]+H*.14);ctx.closePath();const g=ctx.createLinearGradient(0,yb-H*.05,0,yb+H*.2);g.addColorStop(0,`rgba(${c},0)`);g.addColorStop(.25,`rgba(${c},.22)`);g.addColorStop(1,`rgba(${c},0)`);ctx.fillStyle=g;ctx.fill();
   ctx.strokeStyle=`rgba(${c},.06)`;ctx.lineWidth=2*DPR;ctx.beginPath();for(let q=0;q<pts.length;q+=2){ctx.moveTo(pts[q][0],pts[q][1]);ctx.lineTo(pts[q][0],pts[q][1]+H*.12*(.5+.5*Math.sin(q+G.t)))}ctx.stroke()});ctx.restore()}
 if(B.stars){G.shoot=G.shoot||[];if(Math.random()<.004)G.shoot.push({x:Math.random()*W,y:Math.random()*H*.3,vx:(Math.random()<.5?-1:1)*900*DPR,vy:300*DPR,t:0});
  ctx.save();ctx.globalCompositeOperation='lighter';for(let k=G.shoot.length-1;k>=0;k--){const s=G.shoot[k];s.t+=1/60;s.x+=s.vx/60;s.y+=s.vy/60;if(s.t>.7){G.shoot.splice(k,1);continue}const g=ctx.createLinearGradient(s.x,s.y,s.x-s.vx*.12,s.y-s.vy*.12);g.addColorStop(0,`rgba(255,255,255,${1-s.t/.7})`);g.addColorStop(1,'rgba(255,255,255,0)');ctx.strokeStyle=g;ctx.lineWidth=2*DPR;ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.lineTo(s.x-s.vx*.12,s.y-s.vy*.12);ctx.stroke()}ctx.restore()}}
const NEON=[['DARE','255,79,216'],['GOLDEN CHILD','242,201,76'],['LVTDTF','56,240,255'],['THE LAST DON','255,90,90'],['RARE','255,79,216']];
function drawNeonSigns(f,sc,base,A_){const z=G.cam.z;const ux0=G.cam.x*f-(W/2)/z*sc-400,ux1=G.cam.x*f+(W/2)/z*sc+400,sp=620;
 for(let u=Math.floor(ux0/sp)*sp;u<ux1;u+=sp){const hv=hash(u*.33+5);if(hv<.35)continue;const n=NEON[(hash(u)*NEON.length)|0];const px=W/2+(u+hv*200-G.cam.x*f)*z/sc,py=base-A_*(.55+hv*.6);
  const fl=.88+.12*Math.sin(G.t*1.4+u*.01);const fs=Math.max(10,22*z/sc*1.1);ctx.save();ctx.font=`400 ${fs}px "Bebas Neue",Impact,sans-serif`;ctx.textAlign='center';const tw=ctx.measureText(n[0]).width;
  ctx.fillStyle='rgba(10,6,16,.85)';ctx.fillRect(px-tw/2-fs*.35,py-fs*.95,tw+fs*.7,fs*1.25);ctx.strokeStyle=`rgba(${n[1]},${.5*fl})`;ctx.lineWidth=Math.max(1,fs*.06);ctx.strokeRect(px-tw/2-fs*.35,py-fs*.95,tw+fs*.7,fs*1.25);
  ctx.shadowColor=`rgb(${n[1]})`;ctx.shadowBlur=fs*.8*fl;ctx.fillStyle=`rgba(${n[1]},${fl})`;ctx.fillText(n[0],px,py);ctx.restore()}}

// ---------- foreground silhouettes (depth) ----------
function drawForeground(){if(!HQ()||G.state==='photo')return;const z=G.cam.z,par=1.3,off=G.cam.x*z*par,st=B.ground.st,step=8*DPR;const base=H+4*DPR;
 const col=st==='snow'?'rgba(225,235,248,.92)':st==='sand'?'rgba(40,20,12,.88)':st==='asphalt'?'rgba(8,6,12,.9)':'rgba(6,12,8,.9)';ctx.fillStyle=col;ctx.beginPath();ctx.moveTo(0,H);
 if(st==='snow'){for(let x=-step;x<=W+step;x+=step){const k=Math.floor((x+off)/step);ctx.lineTo(x,base-(14+Math.sin(k*.15)*10+hash(k)*4)*DPR)}}
 else if(st==='asphalt'){ctx.lineTo(0,base-14*DPR);ctx.lineTo(W,base-14*DPR)}
 else{for(let x=-step;x<=W+step;x+=step){const k=Math.floor((x+off)/step),hh=hash(k*.37);const bh=(5+hh*hh*20)*DPR,sw=Math.sin(G.t*2+k*.3)*(3+Math.abs(G.wind)*6)*DPR+G.wind*8*DPR;const xx=x-((x+off)%step+step)%step;ctx.lineTo(xx,base-4*DPR);ctx.lineTo(xx+step*.5+sw,base-bh);ctx.lineTo(xx+step,base-4*DPR)}}
 ctx.lineTo(W,H);ctx.closePath();ctx.fill()}

// ---------- lens flare ----------
function drawLensFlare(){if(SV.set.gfx==='low'||!B.sun||G.state==='photo')return;const s=B.sun,z=G.cam.z,sx=s.x*W-G.cam.x*z*.02,sy=s.y*H;if(sx<-50||sx>W+50)return;const cx=W/2,cy=H/2,dx=cx-sx,dy=cy-sy;
 ctx.save();ctx.globalCompositeOperation='lighter';[[.35,26,'255,220,160',.12],[.6,12,'160,200,255',.14],[.85,40,'255,180,120',.06],[1.2,18,'200,255,220',.1],[1.45,60,'255,200,140',.05]].forEach(([t,r,c,a])=>{const x=sx+dx*t,y=sy+dy*t,R=r*DPR*1.4;const g=ctx.createRadialGradient(x,y,0,x,y,R);g.addColorStop(0,`rgba(${c},${a})`);g.addColorStop(.7,`rgba(${c},${a*.5})`);g.addColorStop(1,`rgba(${c},0)`);ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,R,0,7);ctx.fill()});ctx.restore()}

// ---------- arrow motion streak ----------
function drawStreaks(){for(const ar of G.arrows){const sp=Math.hypot(ar.vx,ar.vy);if(sp<300)continue;const L=Math.min(140,sp*.08),ux=ar.vx/sp,uy=ar.vy/sp;const g=ctx.createLinearGradient(ar.x,ar.y,ar.x-ux*L,ar.y-uy*L);g.addColorStop(0,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');ctx.strokeStyle=g;ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(ar.x-ux*6,ar.y-uy*6);ctx.lineTo(ar.x-ux*L,ar.y-uy*L);ctx.stroke()}}

// ---------- Southside hill props: radio towers + DARE billboards (fixed world spacing = no popping) ----------
function hillProps(L,li,f,sc,by,A_,lift){const z=G.cam.z,ux0=G.cam.x*f-(W/2)/z*sc-300,ux1=G.cam.x*f+(W/2)/z*sc+300;
 const gy=u=>by-layerH(L.st,u,M.ph,li*3)*A_-lift,sx=u=>W/2+(u-G.cam.x*f)*z/sc,k=z/sc;
 if(L.towers){const sp=900;for(let u=Math.floor(ux0/sp)*sp;u<ux1;u+=sp){const uu=u+hash(u*.13)*300,x=sx(uu),y=gy(uu)+2*DPR,th=(140+hash(u)*90)*k,bw=14*k;
  ctx.strokeStyle=L.col;ctx.lineWidth=Math.max(1,2*k);ctx.beginPath();ctx.moveTo(x-bw,y);ctx.lineTo(x,y-th);ctx.lineTo(x+bw,y);for(let s=1;s<7;s++){const t=s/7,yy=y-th*t,w=bw*(1-t);ctx.moveTo(x-w,yy);ctx.lineTo(x+w*(1-1/7),yy-th/7)}ctx.stroke();
  const on=.55+.45*Math.sin(G.t*1.6+u);ctx.save();ctx.globalCompositeOperation='lighter';const r=10*k*1.5;const g=ctx.createRadialGradient(x,y-th,0,x,y-th,r*2.5);g.addColorStop(0,`rgba(255,60,60,${.9*on})`);g.addColorStop(1,'rgba(255,60,60,0)');ctx.fillStyle=g;ctx.fillRect(x-r*2.5,y-th-r*2.5,r*5,r*5);ctx.restore()}}
 if(L.boards){const sp=1100;for(let u=Math.floor(ux0/sp)*sp;u<ux1;u+=sp){const uu=u+hash(u*.31)*400;if(hash(u*.7)<.25)continue;const n=NEON[(hash(u)*NEON.length)|0];const x=sx(uu),y=gy(uu)+4*DPR,ph=70*k,fs=Math.max(9,26*k);
  ctx.font=`400 ${fs}px "Bebas Neue",Impact,sans-serif`;ctx.textAlign='center';const tw=ctx.measureText(n[0]).width,bw=tw+fs*.9,bh=fs*1.4;
  ctx.fillStyle='#0a0710';ctx.fillRect(x-bw*.3,y-ph,3*k+1,ph);ctx.fillRect(x+bw*.3,y-ph,3*k+1,ph);ctx.fillStyle='#120c1c';ctx.fillRect(x-bw/2,y-ph-bh,bw,bh);
  const gl=.9+.1*Math.sin(G.t*1.2+u*.01);ctx.save();ctx.strokeStyle=`rgba(${n[1]},${.7*gl})`;ctx.lineWidth=Math.max(1,fs*.07);ctx.shadowColor=`rgb(${n[1]})`;ctx.shadowBlur=fs*.7;ctx.strokeRect(x-bw/2+fs*.15,y-ph-bh+fs*.15,bw-fs*.3,bh-fs*.3);ctx.fillStyle=`rgba(${n[1]},${gl})`;ctx.fillText(n[0],x,y-ph-bh*.28);ctx.restore()}}}
