// ================= LONG SHOT · RENDER =================
const cv=document.createElement('canvas');let ctx=cv.getContext('2d');ctx.imageSmoothingQuality='high';const MAIN=ctx;
const CBC={fire:'#E69F00',ice:'#56B4E9',bolt:'#F0E442',split:'#CC79A7',poison:'#009E73',magnet:'#0072B2',shield:'#ffffff',std:'#ffffff'};
const KC=k=>SV.set.cb?CBC[k]||'#fff':(ARW[k]||ARW.std).c;
const TEAMC=t=>SV.set.cb?['#E69F00','#56B4E9','#CC79A7','#009E73'][t%4]:['#f2c94c','#e2283c','#4fb3e6','#1fa37a'][t%4];
function curPT(){const st=G.state;if((st==='flight'||st==='replay'||st==='replayEnd')&&(G.replay||G.state==='flight'))return(st==='replay'||st==='replayEnd'?G.replay.env.pt0:G.platT0)+(G.flightT||0);return G.platT}

// ---------- BACKGROUND ----------
function nz(u,ph,k){return(Math.sin(u*.0021+ph[k])*.5+Math.sin(u*.0057+ph[k+1])*.3+Math.sin(u*.013+ph[k+2])*.2)*.5+.5}
function layerH(st,u,ph,k){
 if(st==='mount')return nz(u,ph,k);
 if(st==='hills')return(Math.sin(u*.0017+ph[k])*.6+Math.sin(u*.0049+ph[k+1])*.4)*.5+.5;
 if(st==='peaks')return .62*Math.pow(1-Math.abs(Math.sin(u*.0026+ph[k])),1.7)+.38*Math.pow(1-Math.abs(Math.sin(u*.0071+ph[k+1])),2.2);
 if(st==='mesa'){const v=nz(u*.8,ph,k);return clamp((v-.45)*7,0,1)*.75+v*.25}
 if(st==='rocks')return nz(u*2.3,ph,k)*.8+Math.pow(Math.max(0,Math.sin(u*.031+ph[k+2])),6)*.3;
 if(st==='pines')return(Math.sin(u*.0023+ph[k])*.5+.5)*.45;
 if(st==='city')return .12;
 return .5}
function drawSky(){const z=G.cam.z;const g=ctx.createLinearGradient(0,0,0,H);B.sky.forEach((c,i)=>g.addColorStop(i/(B.sky.length-1),c));ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
 if(B.stars){for(const s of M.stars){const tw=.55+.45*Math.sin(G.t*1.5+s[3]);ctx.globalAlpha=tw*(M.bk==='city'?.5:.9);ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(((s[0]*W-G.cam.x*z*.01)%W+W)%W,s[1]*H*(M.bk==='city'?.6:1),s[2]*DPR,0,7);ctx.fill()}ctx.globalAlpha=1;
  if(M.bk!=='city'){const mg=ctx.createLinearGradient(0,H*.05,W,H*.45);mg.addColorStop(0,'rgba(120,140,255,0)');mg.addColorStop(.5,'rgba(150,160,255,.08)');mg.addColorStop(1,'rgba(120,140,255,0)');ctx.fillStyle=mg;ctx.fillRect(0,0,W,H*.6)}}
 if(B.sun){const s=B.sun,x=s.x*W-G.cam.x*z*.02,y=s.y*H,R=s.r*DPR;const gg=ctx.createRadialGradient(x,y,0,x,y,R*6);gg.addColorStop(0,s.c);gg.addColorStop(.16,s.c);gg.addColorStop(.2,`rgba(${s.g},.5)`);gg.addColorStop(.45,`rgba(${s.g},.14)`);gg.addColorStop(1,`rgba(${s.g},0)`);ctx.fillStyle=gg;ctx.fillRect(x-R*6,y-R*6,R*12,R*12);
  if(B.rays){ctx.save();ctx.globalCompositeOperation='lighter';for(let k=0;k<9;k++){const a=Math.PI*.5+(k-4)*.32+Math.sin(G.t*.15+k)*.06;const L=Math.max(W,H)*1.4,wd=.06+hash(k)*.05;ctx.fillStyle=`rgba(${s.g},${.025+hash(k+9)*.03})`;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a-wd)*L,y+Math.sin(a-wd)*L);ctx.lineTo(x+Math.cos(a+wd)*L,y+Math.sin(a+wd)*L);ctx.fill()}ctx.restore()}}
 if(B.moon){const m=B.moon,x=m.x*W-G.cam.x*z*.02,y=m.y*H,R=m.r*DPR;const gg=ctx.createRadialGradient(x,y,R*.8,x,y,R*5);gg.addColorStop(0,'rgba(190,210,255,.35)');gg.addColorStop(1,'rgba(190,210,255,0)');ctx.fillStyle=gg;ctx.fillRect(x-R*5,y-R*5,R*10,R*10);
  const mg=ctx.createRadialGradient(x-R*.3,y-R*.3,R*.1,x,y,R);mg.addColorStop(0,'#ffffff');mg.addColorStop(1,'#c9d3ec');ctx.fillStyle=mg;ctx.beginPath();ctx.arc(x,y,R,0,7);ctx.fill();ctx.fillStyle='rgba(140,150,190,.35)';[[-.3,-.2,.22],[.25,.15,.16],[-.05,.38,.12],[.35,-.35,.09]].forEach(q=>{ctx.beginPath();ctx.arc(x+q[0]*R,y+q[1]*R,q[2]*R,0,7);ctx.fill()})}
 if(G.bgBolt){const b=G.bgBolt;ctx.save();ctx.strokeStyle=`rgba(220,230,255,${1-b.life/.3})`;ctx.lineWidth=2.5*DPR;ctx.shadowColor='#bcd4ff';ctx.shadowBlur=20*DPR;ctx.beginPath();b.pts.forEach((p,k)=>k?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.stroke();ctx.restore()}
 skyExtras();const span=W+900*DPR;
 for(const cl of G.clouds){let x=((cl.x*DPR*.6-G.cam.x*z*.04)%span+span)%span-450*DPR;const y=cl.y*H,s=cl.s*DPR*(B.heavy?1.8:1);const parts=[[0,0,90,24],[42,-15,52,26],[-38,-9,46,20],[80,-4,40,16],[-75,0,36,14]];
  ctx.fillStyle=B.cloudSh;parts.forEach(e=>{ctx.beginPath();ctx.ellipse(x+e[0]*s,y+e[1]*s+6*s,e[2]*s,e[3]*s,0,0,7);ctx.fill()});ctx.fillStyle=B.cloud;parts.forEach(e=>{ctx.beginPath();ctx.ellipse(x+e[0]*s,y+e[1]*s,e[2]*s,e[3]*s,0,0,7);ctx.fill()})}
 const gsy=H/2+G.cam.y*z;
 B.layers.forEach((L,li)=>{const f=L.f,sc=.4+.6*f;const by=gsy+(H*.56-gsy)*(1-f)*.85;
  if(L.st==='sea'){const top=by-20*DPR;const sg=ctx.createLinearGradient(0,top,0,H);sg.addColorStop(0,'#3a4a5a');sg.addColorStop(.15,'#1e2a36');sg.addColorStop(1,'#0b1118');ctx.fillStyle=sg;ctx.fillRect(0,top,W,H-top);
   ctx.strokeStyle='rgba(200,215,230,.18)';ctx.lineWidth=1.4*DPR;ctx.beginPath();for(let r=0;r<16;r++){const yy=top+Math.pow(r/16,1.6)*(H-top);const sp=(30+r*14)*DPR;const off=((G.t*(20+r*4)*DPR-G.cam.x*z*f)%sp+sp)%sp;for(let x=-sp+off;x<W;x+=sp){const w=sp*.35;ctx.moveTo(x,yy+Math.sin(G.t*2+x*.01)*2);ctx.lineTo(x+w,yy+Math.sin(G.t*2+x*.01)*2)}}ctx.stroke();
   if(G.flashA>0){ctx.fillStyle=`rgba(200,220,255,${G.flashA*.25})`;ctx.fillRect(0,top,W,H-top)}return}
  const A_=L.amp*z*(.6+f),lift=A_*(L.lift||0)*2.2;
  if(L.st==='city'){const ux0=G.cam.x*f-(W/2)/z*sc-200,ux1=G.cam.x*f+(W/2)/z*sc+200;ctx.fillStyle=L.col;const base=by-lift+A_*.2;ctx.fillRect(0,base,W,H-base);
   let u=Math.floor(ux0/50)*50;while(u<ux1){const hh=hash(u*.13+li*7),bw=(40+hash(u*.7+li)*70),bh=(.25+hh*.85)*A_*1.5;const px=W/2+(u-G.cam.x*f)*z/sc,pw=bw*z/sc;ctx.fillStyle=L.col;ctx.fillRect(px,base-bh,pw+1,bh+2);
    if(hash(u*3.1)>.7){ctx.fillRect(px+pw*.4,base-bh-12*z,2*DPR,12*z)}
    const ws=Math.max(1.5*DPR,3.2*z/sc),wg=ws*2.1;for(let wy=base-bh+wg;wy<base-wg*.5;wy+=wg)for(let wx=px+wg*.6;wx<px+pw-wg*.4;wx+=wg){const hv=hash(wx*.31+wy*.17);if(hv>.55){const fl=hv>.97?(.75+.25*Math.sin(G.t*1.2+hv*50)):1;ctx.fillStyle=`rgba(${L.win},${(.35+hv*.5)*fl})`;ctx.fillRect(wx,wy,ws,ws*1.2)}}
    u+=bw+8+hash(u)*20}
   if(li===1)drawNeonSigns(f,sc,base,A_);
   const fg=ctx.createLinearGradient(0,base-A_,0,base+30*DPR);fg.addColorStop(0,`rgba(${B.fog},0)`);fg.addColorStop(1,`rgba(${B.fog},.22)`);ctx.fillStyle=fg;ctx.fillRect(0,base-A_,W,H);return}
  ctx.fillStyle=L.col;ctx.beginPath();ctx.moveTo(0,H);const pts=[];
  for(let px=0;px<=W+8;px+=8){const u=G.cam.x*f+(px-W/2)/z*sc;const h=layerH(L.st,u,M.ph,li*3);const y=by-h*A_-lift;pts.push(y);ctx.lineTo(px,y)}
  ctx.lineTo(W,H);ctx.closePath();ctx.fill();
  if(L.snow&&L.st==='peaks'){ctx.fillStyle='rgba(250,252,255,.85)';ctx.beginPath();let k=0;for(let px=0;px<=W+8;px+=8,k++)ctx.lineTo(px,pts[k]);k--;for(let px=W+8-((W+8)%8);px>=0;px-=8,k--){const u=G.cam.x*f+(px-W/2)/z*sc;const h=layerH(L.st,u,M.ph,li*3);const th=Math.max(0,h-.55)*.6;ctx.lineTo(px,pts[k]+th*A_*1.4)}ctx.closePath();ctx.fill()}
  if(L.towers||L.boards)hillProps(L,li,f,sc,by,A_,lift);
  if(L.st==='pines'){const ux0=G.cam.x*f-(W/2)/z*sc,ux1=G.cam.x*f+(W/2)/z*sc;let sp=34;if((ux1-ux0)/sp>140)sp=(ux1-ux0)/140;ctx.fillStyle=L.tree||L.col;
   for(let u=Math.floor(ux0/sp)*sp;u<ux1+sp;u+=sp){const hh=hash(u*.37+li);const uu=u+hh*sp*.6;const px=W/2+(uu-G.cam.x*f)*z/sc;const h=layerH(L.st,uu,M.ph,li*3);const base=by-h*A_-lift+4*DPR;const th=(.35+hash(u*.11)*.4)*A_*1.1,tw=th*.32;
    ctx.beginPath();for(let t=0;t<3;t++){const yb=base-th*t*.28,yt=yb-th*.55;const ww=tw*(1-t*.22);ctx.moveTo(px-ww,yb);ctx.lineTo(px,yt);ctx.lineTo(px+ww,yb)}ctx.fill();
    if(L.snow){ctx.fillStyle='rgba(245,250,255,.75)';ctx.beginPath();for(let t=0;t<3;t++){const yb=base-th*t*.28,yt=yb-th*.55;const ww=tw*(1-t*.22)*.4;ctx.moveTo(px-ww,yt+th*.22);ctx.lineTo(px,yt);ctx.lineTo(px+ww,yt+th*.22)}ctx.fill();ctx.fillStyle=L.tree}}}
  const fg=ctx.createLinearGradient(0,by-A_*.6-lift,0,by+30*DPR);fg.addColorStop(0,`rgba(${B.fog},0)`);fg.addColorStop(1,`rgba(${B.fog},${li===2?.16:.34})`);ctx.fillStyle=fg;ctx.fillRect(0,by-A_*.6-lift,W,H)});
 ctx.strokeStyle=B.stars?'rgba(0,0,0,.5)':'rgba(30,25,35,.7)';ctx.lineWidth=1.6*DPR;ctx.lineCap='round';
 for(const b of G.birds){for(const f of b.fl){const x=b.x+f.ox*b.dir,y=b.y+f.oy,fl=Math.sin(G.t*9+f.ph)*4*DPR,s=6*DPR;ctx.beginPath();ctx.moveTo(x-s,y-fl);ctx.quadraticCurveTo(x-s*.4,y-fl*.3-2*DPR,x,y);ctx.quadraticCurveTo(x+s*.4,y-fl*.3-2*DPR,x+s,y-fl);ctx.stroke()}}}

// ---------- WORLD ----------
function towerSide(i){if(!M)return 1;const mid=(M.minX+M.maxX)/2;return M.xs[i]<=mid?1:-1}
function lampFlicker(i,base){const t=G.t;return base*(.9+.06*Math.sin(t*1.7+i*2.1)+.04*Math.sin(t*3.3+i*5.7))}
function worldT(){const c=G.cam,z=c.z;if(G._shT!==G.t){G._shT=G.t;G.shx=(Math.random()-.5)*G.shake*DPR;G.shy=(Math.random()-.5)*G.shake*DPR}const sx=G.shx||0,sy=G.shy||0;ctx.setTransform(z,0,0,-z,W/2-c.x*z+sx,H/2+c.y*z+sy)}
function toScreen(x,y){const c=G.cam;return[W/2+(x-c.x)*c.z+(G.shx||0),H/2-(y-c.y)*c.z+(G.shy||0)]}
function drawGround(){const c=G.cam,z=c.z,x0=c.x-W/2/z-60,x1=c.x+W/2/z+60,gd=B.ground;
 const g=ctx.createLinearGradient(0,0,0,-600);g.addColorStop(0,gd.a);g.addColorStop(1,gd.b);ctx.fillStyle=g;ctx.fillRect(x0,-3000,x1-x0,3000);
 ctx.fillStyle=gd.top;ctx.fillRect(x0,-12,x1-x0,13);ctx.fillStyle='rgba(0,0,0,.16)';ctx.fillRect(x0,-26,x1-x0,14);const st=gd.st;
 if(st==='grass'){ctx.fillStyle=gd.top;ctx.beginPath();const s=7;for(let x=Math.floor(x0/s)*s;x<x1;x+=s){const r=hash(x);const h=6+r*16,sw=Math.sin(G.t*2.2+x*.02)*(2+Math.abs(G.wind)*3)+G.wind*4;ctx.moveTo(x-2.6,0);ctx.lineTo(x+sw,h);ctx.lineTo(x+2.6,0)}ctx.fill();
  ctx.fillStyle='rgba(0,0,0,.25)';for(let x=Math.floor(x0/90)*90;x<x1;x+=90){const r=hash(x*.3);if(r>.6){ctx.beginPath();ctx.ellipse(x+r*40,-40-r*200,10+r*14,5+r*6,0,0,7);ctx.fill()}}}
 if(st==='sand'){ctx.strokeStyle='rgba(120,60,30,.25)';ctx.lineWidth=2;ctx.beginPath();for(let r=1;r<8;r++){const y=-r*28;for(let x=Math.floor(x0/60)*60;x<x1;x+=60){const o=hash(x+r)*30;ctx.moveTo(x+o,y);ctx.quadraticCurveTo(x+o+15,y+5,x+o+30,y)}}ctx.stroke();
  ctx.fillStyle='rgba(60,30,15,.4)';for(let x=Math.floor(x0/40)*40;x<x1;x+=40){const r=hash(x*1.7);if(r>.55){ctx.beginPath();ctx.ellipse(x,-4-r*8,3+r*5,2+r*3,0,0,7);ctx.fill()}}}
 if(st==='snow'){ctx.fillStyle='#ffffff';for(let x=Math.floor(x0/120)*120;x<x1;x+=120){const r=hash(x*.7);ctx.beginPath();ctx.ellipse(x+r*60,0,50+r*50,6+r*8,0,0,Math.PI);ctx.fill()}
  for(let x=Math.floor(x0/23)*23;x<x1;x+=23){const r=hash(x*2.3);const tw=Math.sin(G.t*3+r*20);if(tw>.8){ctx.globalAlpha=(tw-.8)*5;ctx.fillRect(x,-6-r*60,2.5,2.5)}}ctx.globalAlpha=1}
 if(st==='asphalt'){ctx.fillStyle='#4a4652';ctx.fillRect(x0,-4,x1-x0,5);ctx.fillStyle='rgba(255,210,120,.5)';for(let x=Math.floor(x0/140)*140;x<x1;x+=140)ctx.fillRect(x,-70,60,5);
  for(let x=Math.floor(x0/170)*170;x<x1;x+=170){const r=hash(x*.9);if(r>.5){const pg=ctx.createLinearGradient(x,0,x+80,0);pg.addColorStop(0,'rgba(255,120,200,0)');pg.addColorStop(.5,`rgba(255,${120+r*100|0},200,.18)`);pg.addColorStop(1,'rgba(255,120,200,0)');ctx.fillStyle=pg;ctx.beginPath();ctx.ellipse(x+40,-30-r*60,46,7,0,0,7);ctx.fill()}}}}
function drawScaffold(i){const x=M.xs[i],h=M.hs[i];const wd=['#6b4423','#8a5a30','#3e2612'];
 ctx.strokeStyle=wd[0];ctx.lineWidth=9;ctx.lineCap='butt';ctx.beginPath();ctx.moveTo(x-40,0);ctx.lineTo(x-34,h);ctx.moveTo(x+40,0);ctx.lineTo(x+34,h);ctx.stroke();
 ctx.strokeStyle=wd[2];ctx.lineWidth=5;ctx.beginPath();for(let y=0;y<h-20;y+=60){const y2=Math.min(h-12,y+60);ctx.moveTo(x-38,y);ctx.lineTo(x+36,y2);ctx.moveTo(x+38,y);ctx.lineTo(x-36,y2)}ctx.stroke();
 const g=ctx.createLinearGradient(0,h-14,0,h);g.addColorStop(0,wd[2]);g.addColorStop(1,wd[1]);ctx.fillStyle=g;ctx.fillRect(x-56,h-14,112,14);ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=1.5;ctx.beginPath();for(let k=-56;k<56;k+=16){ctx.moveTo(x+k,h-14);ctx.lineTo(x+k,h)}ctx.stroke();
 ctx.fillStyle='#8a1c1c';ctx.beginPath();ctx.moveTo(x+30,h);ctx.lineTo(x+30,h+70);ctx.lineTo(x+60,h+60);ctx.lineTo(x+30,h+50);ctx.fill();ctx.fillStyle='#2a1a10';ctx.fillRect(x+28,h,3,72)}
function drawTower(i){if(M.wood&&M.wood[i])return drawScaffold(i);const x=M.xs[i],h=M.hs[i],w=116,S=B.stone,a=G.A[i],d=a?a.face:1;
 const g=ctx.createLinearGradient(x-w/2,0,x+w/2,0);g.addColorStop(0,S[2]);g.addColorStop(.3,S[0]);g.addColorStop(.75,S[1]);g.addColorStop(1,S[2]);ctx.fillStyle=g;ctx.fillRect(x-w/2,0,w,h);
 ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=1.6;ctx.beginPath();let row=0;for(let y=18;y<h-8;y+=18,row++){ctx.moveTo(x-w/2,y);ctx.lineTo(x+w/2,y);for(let bx=(row%2?-w/2+14:-w/2+28);bx<w/2;bx+=28){ctx.moveTo(x+bx,y);ctx.lineTo(x+bx,y-18)}}ctx.stroke();
 ctx.fillStyle='rgba(255,255,255,.08)';for(let y=0,r2=0;y<h-8;y+=18,r2++)for(let bx=(r2%2?-w/2+14:-w/2);bx<w/2;bx+=28)if(hash(x+bx*3+y)>.7)ctx.fillRect(x+bx+2,y+2,24,14);
 ctx.fillStyle='rgba(0,0,0,.18)';ctx.fillRect(x+w/2-10,0,10,h);
 ctx.fillStyle=S[1];ctx.fillRect(x-w/2-8,h-14,w+16,14);ctx.fillStyle=S[0];ctx.fillRect(x-w/2-8,h-4,w+16,4);ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(x-w/2-8,h-14,w+16,3);
 if(a){const o=OUT[a.out],bx=x+d*(w/2+2);const wave=Math.sin(G.t*3+i)*4+G.wind*6;ctx.save();ctx.translate(bx,h-16);ctx.scale(d,1);
  const bg=ctx.createLinearGradient(0,0,22,0);bg.addColorStop(0,o.dark);bg.addColorStop(1,o.main);ctx.fillStyle=bg;ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(24,0);ctx.lineTo(24+wave*.3,-58);ctx.lineTo(12+wave*.5,-48);ctx.lineTo(0+wave*.3,-58);ctx.closePath();ctx.fill();
  ctx.fillStyle=o.acc;ctx.beginPath();ctx.moveTo(12+wave*.15,-14);ctx.lineTo(18+wave*.18,-24);ctx.lineTo(12+wave*.2,-34);ctx.lineTo(6+wave*.18,-24);ctx.fill();ctx.fillRect(-2,-2,28,4);
  if(G.cfg&&G.cfg.layout==='team'){ctx.fillStyle=TEAMC(a.team);ctx.fillRect(0,-58,24,5)}ctx.restore()}
 if(B.torch){const tx=x-d*48;if(B.lamp){ctx.fillStyle='#1c1a22';ctx.fillRect(tx-2.5,h,5,92);ctx.fillRect(tx-2.5,h+88,d*-18,5);ctx.fillStyle='#ffd9a0';ctx.beginPath();ctx.ellipse(tx-d*18,h+86,7,4,0,0,7);ctx.fill()}
  else{ctx.fillStyle='#2a1a10';ctx.fillRect(tx-2,h,4,44);ctx.fillStyle='#4a3020';ctx.beginPath();ctx.moveTo(tx-7,h+44);ctx.lineTo(tx+7,h+44);ctx.lineTo(tx+4,h+52);ctx.lineTo(tx-4,h+52);ctx.fill()}}
 if(B.snowcap){ctx.fillStyle='#f6faff';ctx.beginPath();ctx.moveTo(x-w/2-10,h);for(let k=0;k<=10;k++)ctx.lineTo(x-w/2-10+k*(w+20)/10,h+4+hash(x+k)*6);ctx.lineTo(x+w/2+10,h);ctx.lineTo(x+w/2+6,h-8);ctx.lineTo(x-w/2-6,h-8);ctx.fill()}
 else{ctx.fillStyle=B.ground.st==='sand'?'#b8834e':B.ground.st==='asphalt'?'#3a3644':B.ground.top;for(let k=0;k<9;k++){const kx=x-w/2-6+k*(w+12)/8;ctx.beginPath();ctx.ellipse(kx,h,8,3.5,0,0,7);ctx.fill()}}
 const sg=ctx.createLinearGradient(0,0,0,60);sg.addColorStop(0,'rgba(0,0,0,.4)');sg.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=sg;ctx.fillRect(x-w/2,0,w,60)}
function drawObs(o){const S=B.stone;if(o.dead)return;ctx.save();const r=rng(o.seed||7);
 if(o.type==='rock'){const g=ctx.createLinearGradient(o.x-o.w/2,0,o.x+o.w/2,0);g.addColorStop(0,S[2]);g.addColorStop(.4,S[0]);g.addColorStop(1,S[2]);ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(o.x-o.w/2-16,0);
  const n=9;for(let k=0;k<=n;k++){const y=o.h*k/n,sh=1-k/n*.45;ctx.lineTo(o.x-o.w/2*sh-r()*8,y)}ctx.lineTo(o.x+2,o.h+8);for(let k=n;k>=0;k--){const y=o.h*k/n,sh=1-k/n*.45;ctx.lineTo(o.x+o.w/2*sh+r()*8,y)}ctx.lineTo(o.x+o.w/2+16,0);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.25)';ctx.lineWidth=2;ctx.beginPath();for(let k=0;k<7;k++){const y=r()*o.h;ctx.moveTo(o.x-o.w*.3,y);ctx.lineTo(o.x+o.w*(r()*.4-.1),y+12+r()*20)}ctx.stroke()}
 else if(o.type==='ruin'){const w=o.w;const g=ctx.createLinearGradient(o.x-w/2,0,o.x+w/2,0);g.addColorStop(0,S[2]);g.addColorStop(.3,S[0]);g.addColorStop(1,S[1]);ctx.fillStyle=g;ctx.fillRect(o.x-w/2,0,w,o.h-20);
  ctx.beginPath();ctx.moveTo(o.x-w/2,o.h-20);ctx.lineTo(o.x-w/2+w*.2,o.h);ctx.lineTo(o.x-w*.05,o.h-12);ctx.lineTo(o.x+w*.18,o.h+4);ctx.lineTo(o.x+w/2,o.h-26);ctx.closePath();ctx.fill();
  ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=2;ctx.beginPath();for(let x=o.x-w/2+w/4;x<o.x+w/2;x+=w/4){ctx.moveTo(x,0);ctx.lineTo(x,o.h-30)}ctx.stroke();ctx.fillStyle=S[1];ctx.fillRect(o.x-w/2-8,0,w+16,22)}
 else if(o.type==='wall'){const w=o.w,dmg=1-o.hp/o.mhp;const g=ctx.createLinearGradient(o.x-w/2,0,o.x+w/2,0);g.addColorStop(0,'#5a2a1e');g.addColorStop(.4,'#9a4a32');g.addColorStop(1,'#4a2016');ctx.fillStyle=g;
  ctx.beginPath();ctx.moveTo(o.x-w/2,0);ctx.lineTo(o.x-w/2,o.h);for(let k=0;k<=4;k++)ctx.lineTo(o.x-w/2+k*w/4,o.h+(k%2?6:0)-dmg*hash(k+o.x)*40);ctx.lineTo(o.x+w/2,0);ctx.fill();
  ctx.strokeStyle='rgba(40,15,10,.6)';ctx.lineWidth=1.4;ctx.beginPath();for(let y=14,rw=0;y<o.h;y+=14,rw++){ctx.moveTo(o.x-w/2,y);ctx.lineTo(o.x+w/2,y);for(let bx=rw%2?-w/2+12:-w/2+24;bx<w/2;bx+=24){ctx.moveTo(o.x+bx,y);ctx.lineTo(o.x+bx,y-14)}}ctx.stroke();
  if(dmg>0){ctx.strokeStyle='rgba(0,0,0,.75)';ctx.lineWidth=2.2;ctx.beginPath();const cr=rng(o.seed+3);for(let k=0;k<dmg*8;k++){let x=o.x+(cr()-.5)*w,y=cr()*o.h;ctx.moveTo(x,y);for(let s=0;s<4;s++){x+=(cr()-.5)*18;y+=(cr()-.5)*24;ctx.lineTo(x,y)}}ctx.stroke()}
  ctx.fillStyle='rgba(255,255,255,.9)';for(let k=0;k<o.mhp;k++){ctx.fillStyle=k<o.hp?'#ffd27a':'rgba(255,255,255,.2)';ctx.fillRect(o.x-o.mhp*7+k*14,o.h+20,10,5)}}
 else if(o.type==='plat'){const y=platY(o,curPT());ctx.strokeStyle='rgba(120,255,230,.25)';ctx.lineWidth=2;ctx.setLineDash([6,8]);ctx.beginPath();ctx.moveTo(o.x,o.y0-o.amp);ctx.lineTo(o.x,o.y0+o.amp+o.th);ctx.stroke();ctx.setLineDash([]);
  const g=ctx.createLinearGradient(0,y,0,y+o.th);g.addColorStop(0,S[1]);g.addColorStop(1,S[0]);ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(o.x-o.w/2,y+o.th);ctx.lineTo(o.x+o.w/2,y+o.th);ctx.lineTo(o.x+o.w/2-14,y);ctx.lineTo(o.x-o.w/2+14,y);ctx.closePath();ctx.fill();
  ctx.save();ctx.shadowColor='#5affd8';ctx.shadowBlur=14;ctx.fillStyle='rgba(90,255,216,.85)';for(let k=-2;k<=2;k++){ctx.fillRect(o.x+k*26-3,y+2,6,3)}ctx.restore();
  ctx.globalCompositeOperation='lighter';const gg=ctx.createRadialGradient(o.x,y-6,2,o.x,y-6,70);gg.addColorStop(0,'rgba(90,255,216,.35)');gg.addColorStop(1,'rgba(90,255,216,0)');ctx.fillStyle=gg;ctx.fillRect(o.x-70,y-76,140,80);ctx.globalCompositeOperation='source-over'}
 if(B.snowcap&&o.type!=='plat'&&o.type!=='wall'){ctx.fillStyle='#f6faff';ctx.beginPath();ctx.ellipse(o.x,o.h-4,o.w*.42,9,0,0,7);ctx.fill()}
 ctx.restore()}
function drawShields(){for(const s of G.shields){const fl=.75+.25*Math.sin(G.t*10+s.x);ctx.save();ctx.globalCompositeOperation='lighter';
 const g=ctx.createLinearGradient(s.x-16,0,s.x+16,0);g.addColorStop(0,'rgba(90,255,216,0)');g.addColorStop(.5,`rgba(90,255,216,${.45*fl})`);g.addColorStop(1,'rgba(90,255,216,0)');ctx.fillStyle=g;ctx.fillRect(s.x-16,s.y0,32,s.h);
 ctx.strokeStyle=`rgba(200,255,245,${.8*fl})`;ctx.lineWidth=2;ctx.beginPath();for(let y=s.y0;y<s.y0+s.h;y+=18){ctx.moveTo(s.x-6,y);ctx.lineTo(s.x+6,y+9);ctx.lineTo(s.x-6,y+18)}ctx.stroke();
 ctx.fillStyle=TEAMC(s.team);for(let k=0;k<s.hits;k++)ctx.fillRect(s.x-9+k*12,s.y0+s.h+8,8,4);ctx.restore()}}
function drawTargets(){const pt=curPT();for(const g of G.targets){if(!g.alive)continue;const p=tgtPos(g,pt);
 ctx.fillStyle='#5a3a1e';ctx.fillRect(p.x-3,0,6,Math.max(0,p.y-g.r));if(g.amp){ctx.strokeStyle='rgba(255,255,255,.25)';ctx.setLineDash([4,6]);ctx.beginPath();ctx.moveTo(p.x+g.r+8,g.y-g.amp);ctx.lineTo(p.x+g.r+8,g.y+g.amp);ctx.stroke();ctx.setLineDash([])}
 const R=g.r;[[1,'#d9b77a'],[.86,'#fff4e0'],[.7,'#c0392b'],[.55,'#fff4e0'],[.4,'#c0392b'],[.22,'#f2c94c']].forEach(([k,c])=>{ctx.fillStyle=c;ctx.beginPath();ctx.arc(p.x,p.y,R*k,0,7);ctx.fill()});
 ctx.strokeStyle='rgba(0,0,0,.3)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p.x,p.y,R,0,7);ctx.stroke()}}

// ---------- ARCHER RIG ----------
function arrowShape(len,kind,head=true,glow=false){const kc=KC(kind);
 if(glow&&kind&&kind!=='std'){ctx.save();ctx.shadowColor=kc;ctx.shadowBlur=18;ctx.fillStyle=kc;ctx.beginPath();ctx.arc(0,0,5+Math.sin(G.t*30)*1.5,0,7);ctx.fill();ctx.restore()}
 const sg=ctx.createLinearGradient(0,-1.5,0,1.5);sg.addColorStop(0,'#f0dcb6');sg.addColorStop(1,'#a07e52');ctx.strokeStyle=sg;ctx.lineWidth=2.8;ctx.beginPath();ctx.moveTo(-len,0);ctx.lineTo(0,0);ctx.stroke();
 if(head){ctx.fillStyle=kind&&kind!=='std'?kc:'#d7dee6';ctx.beginPath();if(kind==='split'){ctx.moveTo(7,0);ctx.lineTo(-6,6);ctx.lineTo(-2,0);ctx.lineTo(-6,-6)}else if(kind==='magnet'){ctx.arc(0,0,4.5,0,7)}else{ctx.moveTo(7,0);ctx.lineTo(-7,5);ctx.lineTo(-4.5,0);ctx.lineTo(-7,-5)}ctx.closePath();ctx.fill();ctx.fillStyle='rgba(255,255,255,.6)';ctx.beginPath();ctx.moveTo(7,0);ctx.lineTo(-6,4);ctx.lineTo(-4.5,0);ctx.fill()}
 ctx.fillStyle=kind&&kind!=='std'?kc:'#f4f4f4';ctx.beginPath();ctx.moveTo(-len,0);ctx.lineTo(-len-10,6.5);ctx.lineTo(-len+9,1);ctx.closePath();ctx.moveTo(-len,0);ctx.lineTo(-len-10,-6.5);ctx.lineTo(-len+9,-1);ctx.closePath();ctx.fill();
 ctx.fillStyle='#c0392b';ctx.fillRect(-len+10,-1.7,3,3.4)}
function limb(x1,y1,x2,y2,w,c){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke()}
function limb3(a,b,c,w,col){ctx.strokeStyle=col;ctx.lineWidth=w;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.lineTo(c[0],c[1]);ctx.stroke()}
function drawHead(o,P,aiming){const sk=o.skin;
 ctx.fillStyle=shade(sk,-.25);ctx.fillRect(-3.5,-15,8,9);
 const hg=ctx.createRadialGradient(4,4,2,0,0,13);hg.addColorStop(0,shade(sk,.18));hg.addColorStop(1,shade(sk,-.12));ctx.fillStyle=hg;ctx.beginPath();ctx.arc(0,0,11.5,0,7);ctx.fill();
 ctx.fillStyle=shade(sk,-.1);ctx.beginPath();ctx.moveTo(10.5,2);ctx.lineTo(14,-1.5);ctx.lineTo(10.8,-3);ctx.fill();
 ctx.fillStyle=shade(sk,-.3);ctx.beginPath();ctx.ellipse(-2,0,2.6,3.4,0,0,7);ctx.fill();
 const g=o.gear;
 if(g!=='hood'&&g!=='helm'){ctx.fillStyle='#120c08';ctx.beginPath();ctx.arc(0,0,12.3,Math.PI*.12,Math.PI*1.08);ctx.lineTo(-2,-3);ctx.closePath();ctx.fill()}
 if(!P.dead){const sq=aiming?.45:1;ctx.fillStyle='#fff';ctx.beginPath();ctx.ellipse(6.5,2,2.7,2*sq,0,0,7);ctx.fill();ctx.fillStyle=o.glow&&!aiming?o.glow:'#120c08';ctx.beginPath();ctx.arc(7.4,2,1.35*Math.min(1,sq+.3),0,7);ctx.fill();
  ctx.strokeStyle='#120c08';ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(3.5,5.2+(aiming?-.6:0));ctx.lineTo(9.5,5.6+(aiming?-1.2:0));ctx.stroke();ctx.strokeStyle=shade(sk,-.45);ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(7,-6);ctx.lineTo(10,-5.6);ctx.stroke()}
 else{ctx.strokeStyle='#120c08';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(5,0);ctx.lineTo(9,4);ctx.moveTo(9,0);ctx.lineTo(5,4);ctx.stroke()}
 {const ls=G._ls||1;ctx.fillStyle='rgba(255,255,255,.14)';ctx.beginPath();ctx.ellipse(8,-2,2.4,1.6,0,0,7);ctx.fill();ctx.fillStyle=shade(sk,-.35);ctx.beginPath();ctx.moveTo(11,-1.5);ctx.lineTo(13.4,-1.6);ctx.lineTo(11.4,-3);ctx.fill();
  if(['gold','don','steel','ash'].includes(o.id)){ctx.fillStyle='rgba(18,12,8,.55)';for(let k=0;k<18;k++){const a=-1.2+k*.09,r=9+(k%3);ctx.fillRect(Math.cos(a)*r,Math.sin(a)*r-1,1,1)}}
  if(!P.dead){ctx.fillStyle='rgba(255,255,255,.95)';ctx.fillRect(7.8,2.6,.9,.9)}
  ctx.strokeStyle=`rgba(${B.rim},.55)`;ctx.lineWidth=1.6;ctx.beginPath();if(ls>0)ctx.arc(0,0,11.3,-.9,.9);else ctx.arc(0,0,11.3,Math.PI-.9,Math.PI+.9);ctx.stroke();
  ctx.strokeStyle=OUTL;ctx.lineWidth=1;ctx.beginPath();ctx.arc(0,0,11.8,-.5,.25);ctx.stroke()}
 if(g==='crown'){const cg=ctx.createLinearGradient(0,8,0,22);cg.addColorStop(0,'#a8761a');cg.addColorStop(.5,'#ffe08a');cg.addColorStop(1,'#c9961f');ctx.fillStyle=cg;ctx.beginPath();ctx.moveTo(-9,8.5);ctx.lineTo(-9,20);ctx.lineTo(-5,14);ctx.lineTo(-1,22);ctx.lineTo(3,14);ctx.lineTo(7,20);ctx.lineTo(7,9.5);ctx.closePath();ctx.fill();ctx.fillStyle='#e2283c';ctx.beginPath();ctx.arc(-1,12,1.8,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-1,22,1.4,0,7);ctx.arc(-9,20,1.2,0,7);ctx.arc(7,20,1.2,0,7);ctx.fill()}
 if(g==='hood'){const hg2=ctx.createLinearGradient(-14,0,12,0);hg2.addColorStop(0,o.dark);hg2.addColorStop(1,o.main);ctx.fillStyle=hg2;ctx.beginPath();ctx.arc(0,1,14.5,Math.PI*.1,Math.PI*1.18);ctx.quadraticCurveTo(-10,-14,-4,-16);ctx.lineTo(2,-10);ctx.quadraticCurveTo(-6,0,2,9);ctx.quadraticCurveTo(8,12,13.5,6);ctx.closePath();ctx.fill();ctx.strokeStyle='rgba(0,0,0,.35)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,1,12.8,Math.PI*.1,Math.PI*.55);ctx.stroke()}
 if(g==='band'){ctx.strokeStyle=o.capeIn;ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,0,12,Math.PI*.05,Math.PI*.95);ctx.stroke();const wv=Math.sin(G.t*6)*3,ww=-(G.wind||0)*4;ctx.fillStyle=o.capeIn;ctx.beginPath();ctx.moveTo(-11,6);ctx.quadraticCurveTo(-20,8+wv,-28+ww,2-wv);ctx.lineTo(-27+ww,-1-wv);ctx.quadraticCurveTo(-19,4+wv,-11,2);ctx.fill();ctx.beginPath();ctx.moveTo(-11,5);ctx.quadraticCurveTo(-18,0-wv,-24+ww,-6+wv);ctx.lineTo(-22+ww,-8+wv);ctx.quadraticCurveTo(-16,-2-wv,-10,2);ctx.fill()}
 if(g==='helm'){const mg=ctx.createLinearGradient(0,14,0,-2);mg.addColorStop(0,'#eef1f5');mg.addColorStop(.5,'#9aa3ad');mg.addColorStop(1,'#4a5058');ctx.fillStyle=mg;ctx.beginPath();ctx.arc(0,1,13.5,-.15,Math.PI+.25);ctx.closePath();ctx.fill();ctx.fillStyle='#3a3f46';ctx.fillRect(-13,-1,26,3);ctx.fillStyle=o.acc;ctx.fillRect(-1.5,1,3,13);ctx.fillStyle=o.main==='#7d8590'?o.trim:o.main;ctx.beginPath();ctx.moveTo(-1,13);ctx.quadraticCurveTo(-8,26+Math.sin(G.t*4)*2,-24,16);ctx.quadraticCurveTo(-12,18,-3,10);ctx.fill()}
 if(g==='fedora'){ctx.fillStyle='#0c0c10';ctx.beginPath();ctx.ellipse(1,8,19,3.6,-.06,0,7);ctx.fill();ctx.beginPath();ctx.moveTo(-10,8);ctx.lineTo(-8,21);ctx.quadraticCurveTo(1,25,10,21);ctx.lineTo(12,8);ctx.closePath();ctx.fill();ctx.fillStyle=o.trim;ctx.fillRect(-9.5,9,21,3.4);ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(-8,15,18,1.5)}}
function bowGrad(bk,tipY){const b=BOWS[bk]||BOWS.oak;const g=ctx.createLinearGradient(30,-tipY,30,tipY);g.addColorStop(0,b.c[0]);g.addColorStop(.5,b.c[1]);g.addColorStop(1,b.c[0]);return g}
function worldToLocal(px,py,ox,oy,ang){const dx=px-ox,dy=py-oy,c=Math.cos(-ang),s=Math.sin(-ang);return[dx*c-dy*s,dx*s+dy*c]}

function drawFigure(o,P,d,opt){const t=G.t,br=Math.sin(t*2.1+(d>0?0:1.7))*1.1;const aiming=opt.aiming,frozen=P.frost>0&&!P.dead;const bowK=P.bow||'oak';
 const fa=P.fall,fe=fa>0?easeOutBack(fa):0,fd=(P.fallDir||-d)===d?-1:1;
 const pose=P.vic>0?P.pose:P.taunt>0?P.tpose:null;
 ctx.save();
 const wk=P.walk||0,wx=-d*wk*46,wph=wk*16;ctx.translate(wx,0);
 ctx.fillStyle='rgba(0,0,0,.3)';ctx.beginPath();ctx.ellipse(-d*fe*24*fd,1,26+fe*26,4.5,0,0,7);ctx.fill();
 if(fa>0){ctx.translate(-d*fe*12*fd,0);ctx.rotate(d*fe*1.42*fd)}
 const hop=pose==='raise'||pose==='crown'?Math.abs(Math.sin(t*5.5))*7:0;ctx.translate(0,hop+(wk>0?Math.abs(Math.sin(wph))*2:0));
 const cr=clamp(P.crouch||0,0,.8);const lean=clamp(P.lean,-.6,.6)+(aiming?-.04*P.p:0)+(pose==='flex'?.12:0);
 let aw=P.a;if(pose==='raise'||pose==='crown')aw=d>0?1.25:Math.PI-1.25;else if(pose==='salute'||pose==='flex')aw=d>0?-.95:Math.PI+.95;else if(pose==='spin')aw=d>0?.05:Math.PI-.05;
 if(frozen&&aiming)aw+=wobble();if(fa>0)aw+=-d*fe*1.1*fd;if(wk>0)aw=d>0?-.7:Math.PI+.7;
 let el=d>0?aw:Math.PI-aw;el=Math.atan2(Math.sin(el),Math.cos(el));const tilt=clamp(el*.3,-.3,.35)+(P.hsnap||0)*.9;
 ctx.save();ctx.scale(d,1);
 const hip=[-lean*6,44-cr*12],sh=[hip[0]-Math.sin(lean)*34,hip[1]+Math.cos(lean)*34+br*.5];
 const wv=Math.sin(t*3.1)*4-(G.wind||0)*d*9,wv2=Math.sin(t*3.1+1.2)*5-(G.wind||0)*d*12;
 const cg=ctx.createLinearGradient(sh[0],sh[1],sh[0]-20,14);cg.addColorStop(0,o.cape);cg.addColorStop(1,shade(o.cape,.08));ctx.fillStyle=cg;
 ctx.beginPath();ctx.moveTo(sh[0]+2,sh[1]+2);ctx.quadraticCurveTo(sh[0]-22+wv,sh[1]-20,sh[0]-26+wv2,16);ctx.lineTo(sh[0]-14+wv2*.6,12);ctx.quadraticCurveTo(sh[0]-8,40,hip[0]+6,hip[1]+6);ctx.closePath();ctx.fill();
 ctx.strokeStyle=o.capeIn;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(sh[0]-26+wv2,16);ctx.lineTo(sh[0]-14+wv2*.6,12);ctx.stroke();
 const kb=Math.max(0,P.lean)*8,sw=wk>0?Math.sin(wph)*9:0;
 limb3([hip[0]-2,hip[1]],[-6-kb+sw*.5-cr*4,23-cr*6],[-11+sw,4],10,shade(o.pants,-.15));
 limb3([hip[0]+2,hip[1]],[8-kb*.5-sw*.5+cr*6,24-cr*8],[12-sw,4],10,o.pants);
 ctx.fillStyle='#120d0a';ctx.beginPath();ctx.ellipse(-9+sw,3.5,8.5,4.5,0,0,7);ctx.ellipse(14-sw,3.5,8.5,4.5,0,0,7);ctx.fill();ctx.fillStyle='rgba(255,255,255,.16)';ctx.fillRect(-16+sw,1.2,14,1.2);ctx.fillRect(7-sw,1.2,14,1.2);ctx.fillStyle='rgba(255,255,255,.12)';ctx.beginPath();ctx.ellipse(-6+sw,5.5,3,1.4,0,0,7);ctx.ellipse(17-sw,5.5,3,1.4,0,0,7);ctx.fill();ctx.fillStyle=o.dark;ctx.fillRect(-15+sw,7,10,3);ctx.fillRect(8-sw,7,10,3);
 ctx.save();ctx.translate(sh[0]-12,sh[1]-14);ctx.rotate(-.42+lean);const qg=ctx.createLinearGradient(-6,0,6,0);qg.addColorStop(0,'#3a2412');qg.addColorStop(1,'#7a4f2a');ctx.fillStyle=qg;ctx.fillRect(-6,-22,12,38);ctx.fillStyle=o.acc;ctx.fillRect(-6,10,12,3);ctx.fillRect(-6,-16,12,2);
 [o.main,'#fff',o.light].forEach((c,k)=>{ctx.fillStyle='#d9c3a0';ctx.fillRect(-4+k*3.5,16,1.4,6);ctx.fillStyle=c;ctx.beginPath();ctx.moveTo(-4+k*3.5,20);ctx.lineTo(-6+k*3.5,29);ctx.lineTo(-1.5+k*3.5,29);ctx.fill()});ctx.restore();
 ctx.save();ctx.translate(hip[0],hip[1]);ctx.rotate(lean);
 ctx.fillStyle=shade(o.main,-.35);ctx.beginPath();ctx.moveTo(-13,4);ctx.lineTo(13,4);ctx.lineTo(16,-13);ctx.lineTo(4,-10);ctx.lineTo(-4,-14);ctx.lineTo(-16,-12);ctx.closePath();ctx.fill();
 const tg=ctx.createLinearGradient(-14,0,14,0);tg.addColorStop(0,o.dark);tg.addColorStop(.5,o.main);tg.addColorStop(1,o.light);ctx.fillStyle=tg;
 ctx.beginPath();ctx.moveTo(-13,-2);ctx.lineTo(13,-2);ctx.lineTo(12.5,31+br*.4);ctx.quadraticCurveTo(0,38+br*.4,-11.5,31+br*.4);ctx.closePath();ctx.fill();ctx.strokeStyle=OUTL;ctx.lineWidth=1.3;ctx.stroke();
 ctx.strokeStyle=shade(o.main,-.4);ctx.globalAlpha=.55;ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(-5,30);ctx.quadraticCurveTo(-8,16,-6,3);ctx.moveTo(6,29);ctx.quadraticCurveTo(8.5,15,5,4);ctx.moveTo(0,33);ctx.lineTo(1,24);ctx.stroke();ctx.globalAlpha=1;
 ctx.fillStyle=o.acc;ctx.fillRect(-12.6,-2,25.2,2.2);ctx.beginPath();ctx.moveTo(1,23);ctx.lineTo(4,19.5);ctx.lineTo(1,16);ctx.lineTo(-2,19.5);ctx.fill();ctx.fillStyle='rgba(255,255,255,.22)';ctx.beginPath();ctx.moveTo(1,23);ctx.lineTo(4,19.5);ctx.lineTo(1,19.5);ctx.fill();
 if(o.glow){ctx.save();ctx.shadowColor=o.glow;ctx.shadowBlur=12;ctx.strokeStyle=o.glow;ctx.lineWidth=1.6;ctx.beginPath();ctx.moveTo(-13,-2);ctx.lineTo(-11.5,31);ctx.moveTo(13,-2);ctx.lineTo(12.5,31);ctx.stroke();ctx.strokeStyle=o.acc;ctx.beginPath();ctx.moveTo(-10,12);ctx.lineTo(10,12);ctx.stroke();ctx.restore()}
 {const ls=lightX()*d;ctx.strokeStyle=`rgba(${B.rim},.6)`;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(12.6*ls,0);ctx.lineTo(12.2*ls,30);ctx.stroke();ctx.fillStyle='rgba(0,0,0,.2)';ctx.beginPath();ctx.moveTo(-13*ls,-2);ctx.lineTo(-6*ls,-2);ctx.lineTo(-5*ls,34);ctx.lineTo(-11.5*ls,31);ctx.closePath();ctx.fill()}
 ctx.strokeStyle='#3a2412';ctx.lineWidth=3.2;ctx.beginPath();ctx.moveTo(-11,30);ctx.lineTo(12,2);ctx.stroke();
 ctx.fillStyle='#17110c';ctx.fillRect(-13.5,0,27,5.5);ctx.fillStyle='rgba(255,255,255,.12)';ctx.fillRect(-13.5,4.2,27,1);ctx.fillStyle=o.acc;ctx.fillRect(-2.5,-.5,6,6.5);ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(-1,1.2,3,3);ctx.fillStyle='#4a2f1a';ctx.fillRect(-12.5,-5,6.5,8);ctx.strokeStyle=OUTL;ctx.lineWidth=.8;ctx.strokeRect(-12.5,-5,6.5,8);ctx.fillStyle=o.acc;ctx.fillRect(-10.6,1,2.6,1.4);
 ctx.fillStyle=o.acc;ctx.beginPath();ctx.ellipse(5,31,9,5.5,-.2,0,7);ctx.fill();ctx.fillStyle='rgba(255,255,255,.25)';ctx.beginPath();ctx.ellipse(6,33,5,2,-.2,0,7);ctx.fill();
 ctx.restore();
 const hc=[sh[0]+Math.sin(-lean)*15+2,sh[1]+Math.cos(lean)*15];
 ctx.save();ctx.translate(hc[0],hc[1]);ctx.rotate(lean*.6+tilt);G._ls=lightX()*d;drawHead(o,P,aiming);ctx.restore();
 ctx.restore();
 if(P.stuckB)for(const s of P.stuckB){ctx.save();ctx.translate(s.dx,s.dy);ctx.rotate(s.ang);arrowShape(36,s.k,false);ctx.restore()}
 // arms + bow
 const SW=[sh[0]*d,sh[1]];const p=aiming?P.p:0;const s=Math.cos(aw)>=0?1:-1;
 ctx.save();ctx.translate(SW[0],SW[1]);ctx.rotate(aw);
 const tipX=24-p*9,tipY=44-p*4;
 limb3([0,0],[18,-2*s],[35,0],7.5,o.main);limb(20,-1.5*s,35,0,6.8,o.dark);ctx.fillStyle=o.acc;ctx.save();ctx.translate(27,-.8*s);ctx.fillRect(-5,-3.6,10,7.2);ctx.restore();
 ctx.save();if(pose==='spin'){ctx.translate(37,0);ctx.rotate(t*14);ctx.translate(-37,0)}
 const bw=BOWS[bowK]||BOWS.oak;if(bw.glow){ctx.shadowColor=bw.glow;ctx.shadowBlur=14}
 ctx.strokeStyle=bowGrad(bowK,tipY);ctx.lineWidth=5;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(tipX+4,tipY+4);ctx.quadraticCurveTo(tipX-1,tipY+1,tipX,tipY);ctx.quadraticCurveTo(46+p*5,tipY*.55,38,6);ctx.lineTo(38,-6);ctx.quadraticCurveTo(46+p*5,-tipY*.55,tipX,-tipY);ctx.quadraticCurveTo(tipX-1,-tipY-1,tipX+4,-tipY-4);ctx.stroke();ctx.shadowBlur=0;
 ctx.strokeStyle='rgba(255,240,200,.35)';ctx.lineWidth=1.2;ctx.beginPath();ctx.moveTo(tipX+1,tipY-2);ctx.quadraticCurveTo(44+p*5,tipY*.5,39,5);ctx.stroke();
 ctx.fillStyle=o.acc;ctx.fillRect(35,-7,6,14);ctx.strokeStyle='rgba(0,0,0,.45)';ctx.lineWidth=.8;ctx.beginPath();for(let k=-6;k<=5;k+=2.2){ctx.moveTo(35,k);ctx.lineTo(41,k+1.3)}ctx.stroke();ctx.fillStyle='#dfe4ea';ctx.beginPath();ctx.arc(tipX+3.5,tipY+3.5,1.7,0,7);ctx.fill();ctx.beginPath();ctx.arc(tipX+3.5,-tipY-3.5,1.7,0,7);ctx.fill();
 let nx;if(aiming)nx=tipX-p*34;else nx=tipX+Math.sin(t*95)*P.recoil*6;
 ctx.strokeStyle='rgba(255,255,255,.85)';ctx.lineWidth=1.1;ctx.beginPath();ctx.moveTo(tipX,tipY);ctx.lineTo(nx,0);ctx.lineTo(tipX,-tipY);ctx.stroke();{const ux=(tipX-nx),uy=tipY,ul=Math.hypot(ux,uy)||1;ctx.strokeStyle='#e9e2d0';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(nx+ux/ul*7,uy/ul*7);ctx.lineTo(nx,0);ctx.lineTo(nx+ux/ul*7,-uy/ul*7);ctx.stroke()}
 if(aiming){ctx.save();ctx.translate(nx+66,0);arrowShape(66,P.sel,true,true);ctx.restore()}
 ctx.restore();
 ctx.fillStyle=o.skin;ctx.beginPath();ctx.arc(36,0,4.4,0,7);ctx.fill();
 let Hh;if(aiming)Hh=[nx,0];
 else if(pose==='salute'||pose==='crown'){const hw=[hc[0]*d+d*8,hc[1]+(pose==='crown'?16:6)];Hh=worldToLocal(hw[0],hw[1],SW[0],SW[1],aw)}
 else if(pose==='flex'){const hw=[SW[0]-d*6,SW[1]+30];Hh=worldToLocal(hw[0],hw[1],SW[0],SW[1],aw)}
 else Hh=[lerp(tipX-2,-16,P.recoil),P.recoil*7*s];
 const E=pose&&!aiming?[Hh[0]*.5-6*s*0,Hh[1]*.5+(pose==='flex'?-10:6)*s]:[Math.max(-34,Hh[0]-13),(5+P.recoil*4)*s];
 limb3([0,0],E,Hh,7,shade(o.main,-.12));limb(E[0],E[1],Hh[0],Hh[1],6,o.dark);ctx.fillStyle=o.skin;ctx.beginPath();ctx.arc(Hh[0],Hh[1],4,0,7);ctx.fill();
 ctx.restore();
 if(frozen){ctx.save();ctx.fillStyle='rgba(170,230,255,.45)';ctx.strokeStyle='rgba(255,255,255,.8)';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(-20,0);[[-22,14],[-16,30],[-8,26],[-2,38],[6,28],[14,34],[20,18],[22,0]].forEach(q=>ctx.lineTo(q[0],q[1]));ctx.closePath();ctx.fill();ctx.stroke();ctx.restore()}
 if(P.poison>0&&!P.dead){ctx.save();ctx.globalAlpha=.25+.1*Math.sin(t*5);ctx.fillStyle='#8cff5a';ctx.beginPath();ctx.ellipse(0,60,24,62,0,0,7);ctx.fill();ctx.restore()}
 ctx.restore()}
function drawArcher(i){const a=G.A[i];ctx.save();ctx.translate(a.x,a.h);drawFigure(OUT[a.out],a,a.face,{aiming:G.state==='aim'&&G.turn===i&&!a.dead});ctx.restore()}

function drawPreview(){if(G.state!=='aim'||G.mode==='demo')return;const i=G.turn,P=G.A[i];if(!P||P.p<.05||P.frost)return;if(!isLocalTurn())return;if(G.mods.noGuide)return;
 const s=launchPos(i,P.a);let x=s.x,y=s.y,vx=Math.cos(P.a)*VMAX*P.p,vy=Math.sin(P.a)*VMAX*P.p;const dt=1/60;let N=G.mode==='practice'?120:G.sub==='cpu'?[26,20,15][G.diff]:18;const kc=KC(P.sel);
 const wa=G.mode==='practice'?G.wind*WINDK*(OUT[P.out].id==='jade'?.5:1):0;
 for(let n=0;n<N;n++){vx+=wa*dt;vy-=GRAV*dt;x+=vx*dt;y+=vy*dt;if(y<0)break;if(n%2)continue;ctx.globalAlpha=(1-n/N)*.95;ctx.fillStyle=kc;ctx.beginPath();ctx.arc(x,y,3.6-n/N*2,0,7);ctx.fill()}ctx.globalAlpha=1}
const TRC={classic:'255,255,255',gold:'255,215,90',ember:'255,138,42',star:'200,225,255',smoke:'160,160,170',prism:null};
function drawFlight(){for(const ar of G.arrows){const tr=ar.trail,trk=G.A[ar.o].trail;
 if(tr.length>4){ctx.lineCap='round';if(ar.k==='bolt'){ctx.save();ctx.strokeStyle='rgba(255,240,150,.85)';ctx.shadowColor='#ffe14a';ctx.shadowBlur=12;ctx.lineWidth=2;ctx.beginPath();for(let k=0;k<tr.length;k+=2){const j=(Math.random()-.5)*10;k?ctx.lineTo(tr[k]+j,tr[k+1]+j):ctx.moveTo(tr[k],tr[k+1])}ctx.stroke();ctx.restore()}
  const rgb=ar.k==='fire'?'255,150,60':ar.k==='ice'?'160,230,255':ar.k==='poison'?'140,255,90':ar.k==='magnet'?'179,136,255':ar.k==='split'?'255,90,209':TRC[trk];
  for(let k=2;k<tr.length;k+=2){ctx.strokeStyle=rgb?`rgba(${rgb},${k/tr.length*.5})`:`hsla(${(k*12+G.t*300)%360},100%,65%,${k/tr.length*.7})`;ctx.lineWidth=k/tr.length*(ar.k==='std'&&trk==='classic'?3:5);ctx.beginPath();ctx.moveTo(tr[k-2],tr[k-1]);ctx.lineTo(tr[k],tr[k+1]);ctx.stroke()}}
 ctx.save();ctx.translate(ar.x,ar.y);ctx.rotate(Math.atan2(ar.vy,ar.vx));arrowShape(60,ar.k,true,true);ctx.restore()}}
function drawParts(){for(const p of G.parts){const k=p.life/p.max;
 if(p.type==='flame'){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=(1-k)*(p.torch?.55:.85);ctx.fillStyle=k<.25?'#fff1b0':k<.55?'#ff9a2a':'#c8301a';ctx.beginPath();ctx.arc(p.x,p.y,p.s*(1-k*.6),0,7);ctx.fill();ctx.globalCompositeOperation='source-over'}
 else if(p.type==='smoke'){ctx.globalAlpha=(1-k)*.25;ctx.fillStyle=B.ground.st==='snow'?'#fff':'#9a9590';ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,7);ctx.fill()}
 else if(p.type==='toxic'){ctx.globalAlpha=(1-k)*.35;ctx.fillStyle=k<.4?'#b6ff7a':'#4caf2a';ctx.beginPath();ctx.arc(p.x,p.y,p.s,0,7);ctx.fill()}
 else if(p.type==='spark'||p.type==='glint'){ctx.globalCompositeOperation='lighter';ctx.globalAlpha=1-k;if(p.type==='glint'){ctx.fillStyle=p.c;const s=p.s*(1-k*.5);ctx.fillRect(p.x-s/2,p.y-s*1.5,s,s*3);ctx.fillRect(p.x-s*1.5,p.y-s/2,s*3,s)}else{ctx.strokeStyle=p.c;ctx.lineWidth=p.s*.7;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-p.vx*.025,p.y-p.vy*.025);ctx.stroke()}ctx.globalCompositeOperation='source-over'}
 else if(p.type==='shard'){ctx.globalAlpha=1-k;ctx.fillStyle=p.c;ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot);ctx.beginPath();ctx.moveTo(0,p.s*1.6);ctx.lineTo(p.s*.6,0);ctx.lineTo(0,-p.s*1.6);ctx.lineTo(-p.s*.6,0);ctx.fill();ctx.restore()}
 else{ctx.globalAlpha=1-k;ctx.fillStyle=p.c;ctx.fillRect(p.x-p.s/2,p.y-p.s/2,p.s,p.s)}}ctx.globalAlpha=1;
 for(const r of G.rings){const rr=r.max*Math.sqrt(r.life);ctx.strokeStyle=`rgba(${r.c},${(1-r.life)*.8})`;ctx.lineWidth=6*(1-r.life)+1;ctx.beginPath();ctx.ellipse(r.x,r.y,rr,rr*.5,0,0,7);ctx.stroke()}
 for(const b of G.bolts){const a=1-b.life/b.max;ctx.save();ctx.globalCompositeOperation='lighter';ctx.shadowColor='#fff3a0';ctx.shadowBlur=30;
  const dr=(pts,w)=>{ctx.beginPath();pts.forEach((p,k)=>k?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));ctx.lineWidth=w;ctx.stroke()};
  ctx.strokeStyle=`rgba(255,240,160,${a*.6})`;dr(b.pts,14);ctx.strokeStyle=`rgba(255,255,255,${a})`;dr(b.pts,4);b.br.forEach(br=>{ctx.strokeStyle=`rgba(255,250,200,${a*.7})`;dr(br,2.5)});ctx.restore()}}
function drawWeather(){const t=B.wx;if(!t)return;
 if(t==='rain'||t==='drizzle'){ctx.strokeStyle=t==='rain'?'rgba(190,210,235,.42)':'rgba(255,190,230,.28)';ctx.lineCap='round';ctx.beginPath();const sx=(G.wind*500-60)/1500;for(const p of G.wx){const l=(10+p.z*18)*DPR;ctx.lineWidth=p.z*1.4*DPR;ctx.moveTo(p.x,p.y);ctx.lineTo(p.x-sx*l,p.y-l)}ctx.stroke()}
 else if(t==='snow'){ctx.fillStyle='#fff';for(const p of G.wx){ctx.globalAlpha=.4+p.z*.5;ctx.beginPath();ctx.arc(p.x,p.y,(1+p.z*2.6)*DPR,0,7);ctx.fill()}ctx.globalAlpha=1}
 else if(t==='leaves'){for(const p of G.wx){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.ph);ctx.scale(1,Math.sin(p.ph*1.3));ctx.fillStyle=p.c<.5?'#8fbf3a':p.c<.8?'#e2b33c':'#d0662a';ctx.beginPath();ctx.ellipse(0,0,5*DPR*p.z+2,2.4*DPR*p.z+1,0,0,7);ctx.fill();ctx.restore()}}
 else if(t==='dust'){ctx.globalCompositeOperation='lighter';for(const p of G.wx){ctx.globalAlpha=.25+.25*Math.sin(G.t*2+p.ph);ctx.fillStyle='#ffd7a0';ctx.beginPath();ctx.arc(p.x,p.y,(1+p.z*1.6)*DPR,0,7);ctx.fill()}ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}
 else if(t==='fireflies'){ctx.globalCompositeOperation='lighter';for(const p of G.wx){if(p.y<H*.35)continue;const a=Math.max(0,Math.sin(G.t*1.7+p.ph*5));ctx.globalAlpha=a;const r=(6+p.z*8)*DPR;const g=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,r);g.addColorStop(0,'rgba(230,255,140,1)');g.addColorStop(.25,'rgba(190,255,90,.5)');g.addColorStop(1,'rgba(190,255,90,0)');ctx.fillStyle=g;ctx.fillRect(p.x-r,p.y-r,r*2,r*2)}ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over'}}
function drawLights(){ctx.save();ctx.globalCompositeOperation='lighter';const z=G.cam.z;
 const glow=(x,y,r,c,a)=>{const[sx,sy]=toScreen(x,y);const R=r*z;if(sx<-R||sx>W+R)return;const g=ctx.createRadialGradient(sx,sy,0,sx,sy,R);g.addColorStop(0,`rgba(${c},${a})`);g.addColorStop(1,`rgba(${c},0)`);ctx.fillStyle=g;ctx.fillRect(sx-R,sy-R,R*2,R*2)};
 if(B.torch&&M)for(let i=0;i<M.xs.length;i++){if(M.wood&&M.wood[i])continue;const d=towerSide(i);if(B.lamp)glow(M.xs[i]-d*66,M.hs[i]+84,220,'255,190,120',.3);else glow(M.xs[i]-d*48,M.hs[i]+58,lampFlicker(i,170),'255,150,60',lampFlicker(i+3,.3))}
 for(const F of G.fires)glow(F.x,F.y+10,160,'255,120,40',.35*Math.min(1,F.t));
 for(const F of G.toxic)glow(F.x,F.y+10,120,'120,255,80',.18*Math.min(1,F.t));
 for(const s of G.shields)glow(s.x,s.y0+s.h/2,140,'90,255,216',.16);
 for(const ar of G.arrows)if(ar.k!=='std'){const c=KC(ar.k);const n=parseInt(c.slice(1),16);glow(ar.x,ar.y,120,`${n>>16},${n>>8&255},${n&255}`,.35)}
 for(const a of G.A){if(a.burn>0&&!a.dead)glow(a.x,a.h+50,120,'255,120,40',.22);if(OUT[a.out].glow&&!a.dead)glow(a.x,a.h+60,90,'255,79,216',.12)}
 ctx.restore()}
function drawBubbles(){for(const b of G.bubbles){const a=G.A[b.i];if(!a)continue;const[x,y]=toScreen(a.x,a.h+150);ctx.globalAlpha=Math.min(1,b.t*3);ctx.font=`400 ${20*DPR}px "Bebas Neue",Impact,sans-serif`;const tw=ctx.measureText(b.txt).width+24*DPR;
 ctx.fillStyle='rgba(255,255,255,.95)';ctx.beginPath();ctx.roundRect?ctx.roundRect(x-tw/2,y-30*DPR,tw,30*DPR,15*DPR):ctx.rect(x-tw/2,y-30*DPR,tw,30*DPR);ctx.fill();ctx.beginPath();ctx.moveTo(x-6*DPR,y);ctx.lineTo(x+6*DPR,y);ctx.lineTo(x,y+8*DPR);ctx.fill();
 ctx.fillStyle='#111';ctx.textAlign='center';ctx.fillText(b.txt,x,y-8*DPR);ctx.globalAlpha=1}}
function drawTags(){if(!G.cfg||G.cfg.layout==='duel'||G.cfg.layout==='range'||G.mode==='demo')return;for(const a of G.A){if(a.dead)continue;const[x,y]=toScreen(a.x,a.h+128);const w=46*DPR;
 ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(x-w/2,y,w,6*DPR);ctx.fillStyle=TEAMC(a.team);ctx.fillRect(x-w/2,y,w*a.hp/a.maxhp,6*DPR);
 if(G.turn===a.i&&G.state==='aim'){ctx.fillStyle='#fff';ctx.beginPath();const yy=y-10*DPR+Math.sin(G.t*6)*3*DPR;ctx.moveTo(x-7*DPR,yy-8*DPR);ctx.lineTo(x+7*DPR,yy-8*DPR);ctx.lineTo(x,yy);ctx.fill()}}}

function render(){ctx=MAIN;ctx.setTransform(1,0,0,1,0,0);if(!M){ctx.fillStyle='#07070a';ctx.fillRect(0,0,W,H);return}
 drawSky();worldT();
 for(const o of G.obsLive)drawObs(o);for(let i=0;i<M.xs.length;i++)drawTower(i);drawGround();drawDecals();drawProps();drawTargets();
 for(const s of G.stuck){ctx.save();ctx.translate(s.x,s.y);ctx.rotate(s.ang);arrowShape(42,s.k,false);ctx.restore()}
 drawShields();for(let i=0;i<G.A.length;i++)drawArcher(i);drawPreview();drawStreaks();drawFlight();drawParts();drawFlashes();
 ctx.setTransform(1,0,0,1,0,0);
 if(B.tint){ctx.fillStyle=B.tint;ctx.fillRect(0,0,W,H)}
 drawLights();drawWeather();drawForeground();drawLensFlare();
 if(!POSTON){if(G.flashA>0){ctx.fillStyle=`rgba(235,240,255,${G.flashA*.55})`;ctx.fillRect(0,0,W,H)}const vg=ctx.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.78);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.45)');ctx.fillStyle=vg;ctx.fillRect(0,0,W,H)}
 if(G.killOn||G.state==='replay'||G.state==='replayEnd'){ctx.fillStyle='rgba(0,0,0,.88)';const bh=H*.09;ctx.fillRect(0,0,W,bh);ctx.fillRect(0,H-bh,W,bh)}
 if(G.state==='photo')return;
 drawTags();drawBubbles();
 for(const f of G.floats){const[x,y]=toScreen(f.x,f.y);const k=f.life/f.max;ctx.globalAlpha=k<.7?1:1-(k-.7)/.3;const sz=(f.big?46:f.t.length>4?30:34)*DPR*(k<.1?1+(.1-k)*5:1);ctx.font=`${sz}px "Bebas Neue",Impact,sans-serif`;ctx.textAlign='center';ctx.lineJoin='round';ctx.lineWidth=6*DPR;ctx.strokeStyle='rgba(0,0,0,.75)';ctx.strokeText(f.t,x,y);ctx.fillStyle=f.c;ctx.fillText(f.t,x,y)}ctx.globalAlpha=1;
 if(G.state==='aim'&&G.mode!=='demo'&&isLocalTurn()){const i=G.turn,P=G.A[i];
  const pw=isPerfect(P);if(P.p>=.3&&!P.frost){const t=P.drawT||0,ws=t<1?1:1+Math.ceil((t-1)/PCYC)*PCYC,tw_=ws-t;const lp=launchPos(i,P.a);const[tx,ty]=toScreen(lp.x+Math.cos(P.a)*44,lp.y+Math.sin(P.a)*44);
   if(pw){ctx.save();ctx.globalCompositeOperation='lighter';ctx.translate(tx,ty);ctx.rotate(G.t*3);ctx.fillStyle='rgba(255,220,110,.95)';for(let k=0;k<4;k++){ctx.rotate(Math.PI/4);ctx.beginPath();ctx.moveTo(0,-22*DPR);ctx.lineTo(3*DPR,0);ctx.lineTo(0,22*DPR);ctx.lineTo(-3*DPR,0);ctx.fill()}const gg=ctx.createRadialGradient(0,0,0,0,0,26*DPR);gg.addColorStop(0,'rgba(255,240,180,.9)');gg.addColorStop(1,'rgba(255,200,80,0)');ctx.fillStyle=gg;ctx.fillRect(-26*DPR,-26*DPR,52*DPR,52*DPR);ctx.restore()}
   else{const k=clamp(1-tw_/.55,0,1);if(tw_<=.55){ctx.strokeStyle=`rgba(255,215,90,${.25+k*.7})`;ctx.lineWidth=(1.5+k*2)*DPR;ctx.beginPath();ctx.arc(tx,ty,lerp(48,9,k)*DPR,0,7);ctx.stroke()}}}
  if(P.p>0){const[x,y]=toScreen(P.x,P.h+150);const deg=Math.round((P.face>0?P.a:Math.PI-P.a)*180/Math.PI);ctx.font=`${21*DPR}px "Bebas Neue",Impact,sans-serif`;ctx.textAlign='center';const tx=`${deg}°  ·  ${Math.round(P.p*100)}%`;const tw=ctx.measureText(tx).width;ctx.fillStyle='rgba(0,0,0,.55)';ctx.beginPath();ctx.roundRect?ctx.roundRect(x-tw/2-14*DPR,y-20*DPR,tw+28*DPR,28*DPR,14*DPR):ctx.rect(x-tw/2-14*DPR,y-20*DPR,tw+28*DPR,28*DPR);ctx.fill();
   ctx.fillStyle='rgba(255,255,255,.2)';ctx.fillRect(x-tw/2-6*DPR,y+3*DPR,tw+12*DPR,3*DPR);ctx.fillStyle=pw?'#ffd75a':KC(P.sel);ctx.fillRect(x-tw/2-6*DPR,y+3*DPR,(tw+12*DPR)*P.p,3*DPR);ctx.fillStyle=pw?'#ffd75a':'#fff';ctx.fillText(pw?'PERFECT!':tx,x,y-2*DPR)}
  for(const j of enemiesOf(i)){const o=G.A[j];const[ox,oy]=toScreen(o.x,o.h+90);const m=40*DPR;if(ox<m||ox>W-m||oy<m||oy>H-m){const cx=clamp(ox,m,W-m),cy=clamp(oy,m*3,H-m*2.6);ctx.save();ctx.translate(cx,cy);ctx.rotate(Math.atan2(oy-cy,ox-cx));ctx.fillStyle=OUT[o.out].main;ctx.beginPath();ctx.moveTo(16*DPR,0);ctx.lineTo(-6*DPR,-10*DPR);ctx.lineTo(-6*DPR,10*DPR);ctx.fill();ctx.restore();
   ctx.font=`800 ${11*DPR}px Inter`;ctx.textAlign=ox>W/2?'right':'left';ctx.fillStyle='#fff';ctx.fillText(Math.round(Math.abs(o.x-P.x)/10)+' M',cx+(ox>W/2?-22:22)*DPR,cy+4*DPR)}}
  if(drag){ctx.strokeStyle='rgba(255,255,255,.35)';ctx.lineWidth=2*DPR;ctx.setLineDash([6*DPR,8*DPR]);ctx.beginPath();ctx.moveTo(drag.sx*DPR,drag.sy*DPR);ctx.lineTo(drag.cx*DPR,drag.cy*DPR);ctx.stroke();ctx.setLineDash([]);ctx.strokeStyle='rgba(255,255,255,.5)';ctx.lineWidth=2*DPR;ctx.beginPath();ctx.arc(drag.sx*DPR,drag.sy*DPR,16*DPR,0,7);ctx.stroke();ctx.fillStyle=KC(P.sel);ctx.beginPath();ctx.arc(drag.cx*DPR,drag.cy*DPR,10*DPR,0,7);ctx.fill()}}}

// ---------- PREVIEWS ----------
function figureTo(cnv,oi,d,scale,cy,aim,extra){const c=cnv.getContext('2d');const w=cnv.width,h=cnv.height;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);const prev=ctx;ctx=c;ctx.setTransform(scale,0,0,-scale,w/2,cy);
 const P=Object.assign({hp:100,burn:0,poison:0,frost:0,dead:false,fall:0,lean:0,crouch:0,hsnap:0,recoil:0,vic:0,taunt:0,sel:'std',a:d>0?.35+Math.sin(G.t*.8)*.08:Math.PI-.35,p:aim?.45+Math.sin(G.t*1.2)*.15:0,bow:'oak',pose:'raise',walk:0},extra||{});
 drawFigure(OUT[oi],P,d,{aiming:aim&&!P.vic});ctx=prev}
