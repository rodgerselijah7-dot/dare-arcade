// ================= LONG SHOT · ENGINE =================
let M=null,B=BIOMES.meadow;
const G={mode:'boot',sub:null,cfg:null,diff:1,bo:3,elem:true,seed:1,round:0,wins:[],turnCount:0,wind:0,state:'boot',timer:0,
 A:[],order:[],oi:0,turn:0,arrows:[],stuck:[],parts:[],floats:[],rings:[],bolts:[],fires:[],toxic:[],clouds:[],wx:[],birds:[],bubbles:[],shields:[],targets:[],
 cam:{x:0,y:300,z:1},shake:0,slow:1,slowT:0,kill:0,killOn:false,flashA:0,ab:0,ltT:5,bgBolt:null,lastImpact:null,platT:0,platT0:0,cpu:null,netRes:null,skipNet:false,
 winTeam:-1,ms:null,snap:null,replay:null,me:0,pi:0,t:0,acc:0,score:0,arrowsLeft:0,dmgTaken:0,roundKO:false,camp:-1,cup:null,mods:{},shotEnded:false};
const A=i=>G.A[i];
const feet=i=>({x:G.A[i].x,y:G.A[i].h});
const alive=i=>!G.A[i].dead;
const enemiesOf=i=>G.A.map((a,j)=>j).filter(j=>j!==i&&G.A[j].team!==G.A[i].team&&!G.A[j].dead);
const outOf=i=>OUT[G.A[i].out];
function isHuman(i){const a=G.A[i];return!!a&&a.human}
function isLocalTurn(){const a=G.A[G.turn];return a&&a.human&&(G.sub!=='online'||G.turn===G.me)}

// ---------- MAP ----------
function genMap(seed,cfg){const r=rng(seed);const n=cfg.slots.length,lay=cfg.layout;let xs=[],hs=[],D;
 const H=()=>Math.round(50+r()*200);
 if(lay==='range'){D=1700;xs=[0];hs=[Math.round(90+r()*90)]}
 else if(lay==='siege'){D=1400;xs=n>1?[0,-240]:[0];const h0=Math.round(90+r()*80);hs=n>1?[h0,h0+80]:[h0]}
 else if(lay==='team'){D=Math.round(1000+r()*500);const h0=H(),h1=H();xs=[0,D,-240,D+240];hs=[h0,h1,h0+70+Math.round(r()*40),h1+70+Math.round(r()*40)]}
 else if(lay==='ffa'){D=n===3?Math.round(1500+r()*400):Math.round(1900+r()*400);for(let k=0;k<n;k++){xs.push(Math.round(D*k/(n-1)));hs.push(H())}}
 else{D=Math.round(950+r()*600);xs=[0,D];hs=[H(),H()]}
 const bk=cfg.biome||window.__forceBiome||BKEYS[r()*BKEYS.length|0];const ph=[];for(let i=0;i<14;i++)ph.push(r()*100);
 const stars=[];for(let i=0;i<180;i++)stars.push([r(),r()*.7,r()*1.5+.3,r()*6]);
 const obs=[];const maxh=Math.max(...hs);const roll=r();
 if(lay==='duel'||lay==='team'){const mx=D*(.42+r()*.16);
  if(cfg.mods.wall||(!cfg.mods.plat&&roll<.16&&!cfg.mods.clear))obs.push({type:'wall',x:mx,w:46,h:maxh+90+r()*110,hp:4,mhp:4,seed:r()*1e6|0});
  else if(cfg.mods.plat||(roll<.3&&!cfg.mods.clear))obs.push({type:'plat',x:mx,w:170,th:26,y0:maxh+60+r()*80,amp:90+r()*80,sp:.8+r()*.6,ph:r()*6.3});
  else if(roll<.48&&!cfg.mods.clear)obs.push({type:'rock',x:mx,w:60+r()*40,h:maxh+60+r()*200,seed:r()*1e6|0});
  else if(roll<.64&&!cfg.mods.clear)obs.push({type:'ruin',x:mx,w:60+r()*40,h:maxh+60+r()*200,seed:r()*1e6|0})}
 return{D,xs,hs,bk,ph,stars,obs,wood:xs.map(()=>false),minX:Math.min(...xs),maxX:Math.max(...xs)}}
const platY=(o,pt)=>o.y0+o.amp*Math.sin(o.ph+o.sp*pt);
const tgtPos=(g,pt)=>({x:g.x,y:g.y+(g.amp?g.amp*Math.sin(g.ph+g.sp*pt):0)});

// ---------- HIT TEST ----------
function hitTest(x,y,owner,t,pt){
 const ow=G.A[owner];
 for(const s of G.shields){if(s.team!==ow.team&&Math.abs(x-s.x)<10&&y>s.y0&&y<s.y0+s.h)return{k:'shield',s}}
 for(let i=0;i<G.A.length;i++){const a=G.A[i];if(a.dead)continue;if(i===owner&&t<.2)continue;const fx=a.x,fy=a.h,d=a.face;
  const hx=fx+d*3,hy=fy+96;if((x-hx)*(x-hx)+(y-hy)*(y-hy)<14*14)return{k:'head',i};
  if(x>fx-14&&x<fx+14&&y>fy+42&&y<fy+84)return{k:'body',i};
  if(x>fx-13&&x<fx+14&&y>fy&&y<=fy+42)return{k:'legs',i}}
 for(const g of G.targets){if(!g.alive)continue;const p=tgtPos(g,pt);if((x-p.x)*(x-p.x)+(y-p.y)*(y-p.y)<g.r*g.r)return{k:'target',g,p}}
 for(let i=0;i<M.xs.length;i++){if(x>M.xs[i]-58&&x<M.xs[i]+58&&y<M.hs[i])return{k:'wall'}}
 for(const o of G.obsLive){if(o.dead)continue;
  if(o.type==='plat'){const py=platY(o,pt);if(x>o.x-o.w/2&&x<o.x+o.w/2&&y>py&&y<py+o.th)return{k:'plat',o}}
  else if(x>o.x-o.w/2&&x<o.x+o.w/2&&y<o.h)return{k:o.type==='wall'?'brick':'wall',o}}
 if(y<=0)return{k:'ground'};
 if(x<M.minX-1800||x>M.maxX+1800||y>6000)return{k:'out'};
 return null}

// ---------- ARROWS ----------
function launchPos(i,a){const f=feet(i);return{x:f.x+Math.cos(a)*34,y:f.y+79+Math.sin(a)*34}}
function mkArrow(i,a,p,kind,perf){const s=launchPos(i,a),me=G.A[i];let tgt=-1,bd=1e9;for(const j of enemiesOf(i)){const d=Math.abs(G.A[j].x-me.x);if(d<bd){bd=d;tgt=j}}
 return{x:s.x,y:s.y,vx:Math.cos(a)*VMAX*p,vy:Math.sin(a)*VMAX*p,t:0,o:i,k:kind,p,wm:(OUT[me.out].id==='jade'?.5:1),tgt,split:false,child:false,trail:[],x0:s.x,perf:!!perf}}
function stepArrow(ar,env){const wa=env.wind*WINDK*ar.wm;ar.vx+=wa*STEP;ar.vy-=GRAV*STEP;
 if(ar.k==='magnet'&&ar.vy<0&&ar.tgt>=0){const T=G.A[ar.tgt];if(!T.dead){const dx=T.x-ar.x,dy=T.h+70-ar.y,d=Math.hypot(dx,dy)||1;ar.vx+=dx/d*1150*STEP;ar.vy+=dy/d*1150*STEP}}
 ar.x+=ar.vx*STEP;ar.y+=ar.vy*STEP;ar.t+=STEP;
 if(ar.k==='split'&&!ar.split&&ar.vy<=0)return{k:'split'};
 return hitTest(ar.x,ar.y,ar.o,ar.t,env.pt0+ar.t)}
function splitArrow(ar){ar.split=true;const kids=[];for(const da of[-.14,.14]){const c=Math.cos(da),s=Math.sin(da);kids.push(Object.assign({},ar,{vx:ar.vx*c-ar.vy*s,vy:ar.vx*s+ar.vy*c,split:true,child:true,trail:[]}))}return kids}
function predict(i,a,p,kind,perf){const ar=mkArrow(i,a,p,kind,perf);const env={wind:G.wind,pt0:G.platT};for(let n=0;n<3400;n++){const h=stepArrow(ar,env);if(h&&h.k!=='split')return{h,ar}}return{h:{k:'out'},ar}}

// ---------- DAMAGE ----------
function impactCalc(h,ar){const N=G.A.length,ev=new Array(N).fill(0),burn=new Array(N).fill(0),poison=new Array(N).fill(0),frost=new Array(N).fill(0);
 const sh=G.A[ar.o],so=OUT[sh.out].id,kind=ar.k,sp=Math.hypot(ar.vx,ar.vy),out=h.k==='out'||h.k==='shield';
 if(h.i!==undefined){const i=h.i;let b={head:50,body:28,legs:16}[h.k]*(.82+.3*clamp(sp/VMAX,0,1));
  if(kind==='split')b*=.6;if(kind==='magnet')b*=.85;if(kind==='shield')b=10;if(ar.perf)b=b*1.25+4;
  if(h.k==='head'&&so==='gold')b+=10;if(so==='red'&&ar.p>=.95)b+=8;if(so==='don'&&!sh.firstHit&&G.A[i].team!==sh.team)b+=12;
  if(kind==='fire'){b+=6;burn[i]=so==='ash'?3:2}if(kind==='ice'){b+=4+(so==='frost'?6:0);frost[i]=1}if(kind==='poison'){b+=3;poison[i]=3}
  ev[i]+=b}
 if(!out){for(let j=0;j<N;j++){const a=G.A[j];if(a.dead)continue;const dx=Math.abs(ar.x-a.x),dc=Math.hypot(ar.x-a.x,ar.y-a.h);
  if(kind==='bolt'&&dx<125&&Math.abs(ar.y-(a.h+50))<170)ev[j]+=18;
  if(h.i===undefined){if(kind==='fire'&&dc<85)burn[j]=Math.max(burn[j],1);if(kind==='ice'&&dc<70)frost[j]=1;if(kind==='poison'&&dc<95)poison[j]=Math.max(poison[j],2)}}}
 for(let j=0;j<N;j++){const tid=OUT[G.A[j].out].id;if(ev[j]>0){if(tid==='violet')ev[j]*=.85;ev[j]=Math.max(1,Math.round(ev[j]))}if(tid==='frost')frost[j]=0;if(tid==='ash')burn[j]=0}
 return{ev,burn,poison,frost}}

// ---------- MATCH SETUP ----------
// cfg:{mode,sub,layout,slots:[{out,human,diff,nm,quiver,bow,trail,pose,boss}],bo,elem,seed,biome,mods,me,pi}
function startMatch(cfg){cfg.mods=cfg.mods||{};G.cfg=cfg;G.mode=cfg.mode;G.sub=cfg.sub;G.bo=cfg.bo||3;G.elem=cfg.elem!==false;G.seed=(cfg.seed>>>0)||1;G.round=0;G.me=cfg.me||0;G.pi=cfg.pi||0;G.mods=cfg.mods||{};
 const teams=new Set(cfg.slots.map((s,k)=>s.team!=null?s.team:k));G.wins=[];teams.forEach(t=>G.wins[t]=0);
 G.ms=cfg.slots.map(()=>({shots:0,hits:0,heads:0,dmg:0,kos:0,longs:0,killcams:0,burns:0,freezes:0,zaps:0,splits:0,venoms:0,seeks:0,blocks:0,walls:0,bulls:0,selfzap:0,perfect:0,comebacks:0,roundsWon:0,biomes:[]}));
 G.bump=0;G.score=0;G.ironUsed=cfg.slots.map(()=>false);G.winTeam=-1;
 if(G.mode!=='demo'){hideAll();hudBuild()}startRound()}
const winsNeed=()=>G.bo===5?3:G.bo===1?1:2;
function startRound(quiet){const cfg=G.cfg;M=genMap(G.seed+G.round*977+(G.bump||0)*1337,cfg);B=BIOMES[M.bk];G.obsLive=JSON.parse(JSON.stringify(M.obs));
 G.A=cfg.slots.map((s,k)=>mkArcher(s,k,M.xs[k],M.hs[k],quiet));
 for(const a of G.A){const e=enemiesOf(a.i);const tx=e.length?G.A[e[0]].x:a.x+1;a.face=tx>=a.x?1:-1;if(G.A.length===1)a.face=1;a.a=a.face>0?.45:Math.PI-.45}
 G.decals=[];G.flashes=[];G.stuck=[];G.parts=[];G.floats=[];G.rings=[];G.bolts=[];G.fires=[];G.toxic=[];G.shields=[];G.bubbles=[];G.arrows=[];G.netRes=null;G.cpu=null;G.kill=0;G.killOn=false;G.slow=1;G.slowT=0;G.snap=null;G.replay=null;G.platT=0;
 G.targets=[];if(cfg.layout==='range')spawnTargets();
 G.order=G.A.map((a,k)=>k);G.oi=(G.round)%G.order.length;G.turn=G.order[G.oi];G.turnCount=0;
 if(cfg.layout==='siege'){G.wave=1;G.kills=0;spawnWave()}G.windMul=G.mods.wind||1;setWind();
 G.clouds=[];const r=rng(G.seed+G.round);for(let i=0;i<(B.heavy?14:8);i++)G.clouds.push({x:r()*2400,y:B.heavy?r()*.22:.06+r()*.3,s:.7+r()*1.2,v:6+r()*16});
 G.birds=[];initWeather();const ov=overview();G.cam.x=ov.x;G.cam.y=ov.y;G.cam.z=ov.z;
 G.state='intro';G.timer=quiet?1:(cfg.layout==='range'?1.2:2.5);
 if(!quiet&&G.mode!=='demo'){const fin=G.wins.length===2&&G.wins[0]===winsNeed()-1&&G.wins[1]===winsNeed()-1&&winsNeed()>1;
  if(cfg.layout==='range')banner(G.mode==='daily'?'DAILY CHALLENGE':'PRACTICE RANGE',B.name);else banner(fin?'FINAL ROUND':'ROUND '+(G.round+1),B.name);
  if(G.mode!=='demo'&&cfg.layout!=='range')setTimeout(()=>say(fin?'Final round':'Round '+(G.round+1)),400)}
 setAmbient(B);musicMode(G.mode==='demo'?0:1,B.key);hudUpd()}
function mkArcher(s,k,X,Hh,quiet){const q=(s.quiver||[]).slice(0,3);const ch={};for(const x of SPECIALS)ch[x]=0;if(G.elem||s.boss)q.forEach(x=>ch[x]=(ch[x]||0)+1);
  if(OUT[s.out].id==='neon'&&q.length){const r=rng(G.seed+G.round*31+k*7)();ch[q[r*q.length|0]]++}
  const mh=s.hp||100;
  return{i:k,team:s.team!=null?s.team:k,out:s.out,bow:s.bow||'oak',trail:s.trail||'classic',pose:s.pose||'raise',quiver:q,human:!!s.human,diff:s.diff??1,nm:s.nm||'',
   x:X,h:Hh,hp:mh,maxhp:mh,burn:0,poison:0,frost:0,ch,dead:false,fall:0,fallDir:1,lean:0,lv:0,crouch:0,cv:0,hsnap:0,hv:0,recoil:0,vic:0,taunt:0,tpose:'raise',sel:'std',
   a:0,p:0,face:1,stuckB:[],firstHit:false,walk:quiet?0:1,dmgRound:0}}
function spawnWave(){const w=G.wave,r=rng(G.seed+w*911),np=G.cfg.slots.length;
 G.A=G.A.slice(0,np);M.xs.length=np;M.hs.length=np;M.wood.length=np;G.ms.length=np;G.ironUsed.length=np;G.stuck=[];G.shields=[];
 const boss=w%5===0;const n=boss?1+Math.min(2,Math.floor(w/5)):Math.min(1+Math.floor((w+1)/2),4);
 for(let k=0;k<n;k++){const isB=boss&&k===0;const x=Math.round(950+k*270+r()*140),h=isB?Math.round(160+r()*60):Math.round(30+r()*190);const o=cpuLoad();
  const s={out:isB?OIDX('don'):o.out,bow:isB?'gold':o.bow,trail:'classic',pose:o.pose,quiver:w>=3?o.quiver:[],human:false,diff:w<3?0:w<7?1:2,team:1,nm:isB?'WARLORD':'RAIDER',boss:isB,hp:isB?150+w*12:Math.min(140,40+w*10)};
  const idx=G.A.length;M.xs.push(x);M.hs.push(h);M.wood.push(true);G.A.push(mkArcher(s,idx,x,h,false));G.A[idx].face=-1;G.A[idx].a=Math.PI-.45;
  G.ms.push({shots:0,hits:0,heads:0,dmg:0,kos:0,longs:0,killcams:0,burns:0,freezes:0,zaps:0,splits:0,venoms:0,seeks:0,blocks:0,walls:0,bulls:0,selfzap:0,perfect:0,comebacks:0,roundsWon:0,biomes:[],perfects:0});G.ironUsed.push(false)}
 M.minX=Math.min(...M.xs);M.maxX=Math.max(...M.xs);G.order=G.A.map((a,k)=>k);G.oi=0;G.turn=0;while(G.A[G.turn].dead){G.oi++;G.turn=G.order[G.oi]}
 if(typeof hudUpd==='function')hudUpd()}
function siegeWaveClear(){const w=G.wave;const bonus=250*w;G.score+=bonus;if(G.ms)G.ms[G.pi].waves=(G.ms[G.pi].waves||0)+1;
 G.A.forEach(a=>{if(a.team===0){if(a.dead){a.dead=false;a.fall=0;a.hp=40;a.koShown=false}else a.hp=Math.min(a.maxhp,a.hp+30);a.burn=a.poison=a.frost=0;a.stuckB=[];const q=a.quiver;for(const x of SPECIALS)a.ch[x]=0;q.forEach(x=>a.ch[x]++)}});
 G.state='waveEnd';G.timer=2.6;banner('WAVE '+w+' CLEARED','+'+bonus+' · TOWER REPAIRED');sfx.win();say('Wave cleared');hudUpd();scoreUpd()}
function setWind(){let w;if(G.mode==='daily'){const r=rng(strHash(todayKey())+G.turnCount*977);r();w=Math.round((r()*2-1)*8)/10}
 else if(G.mode==='practice'){w=G.practiceWind||0}
 else{const r=rng(G.seed*7+G.round*131+G.turnCount*7919+3);r();w=Math.round((r()*2-1)*(G.turnCount<1?6:10))/10}
 G.wind=clamp(w*G.windMul,-1.6,1.6);windUpd()}
function spawnTargets(){const r=G.mode==='daily'?rng(strHash(todayKey())):Math.random;const n=G.mode==='daily'?5:4;
 for(let k=0;k<n;k++)G.targets.push(mkTarget(r,k,n))}
function mkTarget(r,k,n){const x=420+k*(1250/n)+r()*160;const mv=r()<(G.mode==='daily'?.45:.3);return{x,y:40+r()*260,r:30,amp:mv?40+r()*70:0,sp:.8+r()*1.2,ph:r()*6.3,alive:true}}

// ---------- TURNS ----------
function beginTurn(){if(G.mode==='demo'||G.state==='boot'){}
 const i=G.turn,a=G.A[i];
 if(!a.dead){const oid=OUT[a.out].id;
  if(oid==='child'&&a.hp<a.maxhp&&G.turnCount>=G.A.length){const h=Math.min(4,a.maxhp-a.hp);a.hp+=h;float(a.x,a.h+130,'+'+h,'#7dffa0',1);sfx.at(a.x).heal()}
  let dot=0,lbl='';if(a.burn>0){a.burn--;dot+=6;lbl='BURN';for(let k=0;k<18;k++)spawnFlame(a.x+(Math.random()-.5)*26,a.h+20+Math.random()*70,1);sfx.at(a.x).burn()}
  if(a.poison>0){a.poison--;dot+=5;lbl=lbl?'BURN+VENOM':'VENOM';for(let k=0;k<10;k++)G.parts.push({x:a.x+(Math.random()-.5)*30,y:a.h+20+Math.random()*70,vx:0,vy:30,life:0,max:1,s:6,type:'toxic'})}
  if(dot){applyDmg(i,dot,-1);float(a.x,a.h+130,lbl+' -'+dot,a.burn>=0&&lbl.startsWith('B')?'#ff8a2a':'#8cff5a',1.1);a.lv+=.2;hudUpd();
   if(a.dead){G.lastImpact={x:a.x,y:a.h+60};G.state='resolve';G.timer=2;G.skipNet=true;G.roundKO=false;return}}}
 for(const s of G.shields)if(s.owner===i)s.turns--;G.shields=G.shields.filter(s=>s.turns>0&&s.hits>0);
 G.state='aim';G.cpu=null;a.p=0;if(!a.sel||(a.sel!=='std'&&!(a.ch[a.sel]>0)))a.sel='std';
 if(G.mode!=='demo')tagTurn();
 if(!a.human)planCpu(i)}
function applyDmg(j,d,src){const a=G.A[j];if(a.dead)return 0;let hp=a.hp-d;
 if(hp<=0&&OUT[a.out].id==='steel'&&!G.ironUsed[j]){G.ironUsed[j]=true;hp=1;float(a.x,a.h+190,'IRON WILL','#ff9a3a',1.4,1);sfx.at(a.x).block()}
 const dealt=a.hp-Math.max(0,hp);a.hp=Math.max(0,hp);a.dmgRound+=dealt;if(src>=0&&G.ms&&G.A[src].team!==a.team)G.ms[src].dmg+=dealt;
 if(a.hp<=0){a.dead=true;if(src>=0&&G.ms&&G.A[src].team!==a.team)G.ms[src].kos++}return dealt}

function fire(a,p,kind,remote,pt0,perf){if(G.state!=='aim')return;const i=G.turn,A_=G.A[i];kind=kind||'std';
 if(kind!=='std'){if(!(A_.ch[kind]>0))kind='std';else if(G.mode!=='demo'&&G.mode!=='practice')A_.ch[kind]--}
 if(!remote&&perf==null)perf=A_.human?isPerfect(A_):!!(G.cpuPerf);G.cpuPerf=false;A_.drawT=0;if(A_.frost&&!remote)a+=wobble();A_.frost=0;A_.a=a;A_.p=p;A_.recoil=1;A_.face=Math.cos(a)>=0?1:-1;
 if(pt0!=null)G.platT=pt0;G.platT0=G.platT;
 const ar=mkArrow(i,a,p,kind,perf);G.arrows=[ar];G.flightT=0;
 if(perf){float(A_.x,A_.h+160,'PERFECT','#ffd75a',1.1,1);sfx.at(A_.x).perfect();buzz([10,20,10]);G.rings.push({x:s0x(i,a),y:s0y(i,a),r:0,max:70,c:'255,215,90',life:0});if(G.ms)G.ms[i].perfects=(G.ms[i].perfects||0)+1;if(A_.human)say('Perfect')}if(G.ms)G.ms[i].shots++;
 G.snap={i,a,p,kind,perf,wind:G.wind,pt0:G.platT0,dead:G.A.map(x=>x.dead),obs:JSON.stringify(G.obsLive),shields:JSON.stringify(G.shields),targets:JSON.stringify(G.targets)};
 G.kill=0;G.killOn=false;
 if(G.mode!=='demo'&&kind!=='split'&&G.cfg.layout!=='range'){const pr=predict(i,a,p,kind,perf),c=impactCalc(pr.h,pr.ar);const willDie=G.A.map((x,j)=>x.dead||(c.ev[j]>0&&c.ev[j]>=x.hp&&!(OUT[x.out].id==='steel'&&!G.ironUsed[j])));const tl=new Set();G.A.forEach((x,j)=>{if(!willDie[j])tl.add(x.team)});if(pr.ar.t>.6&&tl.size<=1&&G.A.some((x,j)=>willDie[j]&&!x.dead&&x.team!==A_.team))G.kill=pr.ar.t}
 G.state='flight';G.shotEnded=false;tagHide();
 sfx.at(A_.x).twang(p);setTimeout(()=>sfx.whoosh(),60);({fire:()=>sfx.fire(),ice:()=>sfx.ice(),poison:()=>sfx.venom(),magnet:()=>sfx.seek(),shield:()=>sfx.shield()})[kind]?.();buzz(12);
 if(G.mode==='daily'){G.arrowsLeft--;scoreUpd()}
 if(G.sub==='online'&&!remote)send({t:'shot',a,p,k:kind,pt0:G.platT0,pf:perf?1:0})}
const s0x=(i,a)=>launchPos(i,a).x,s0y=(i,a)=>launchPos(i,a).y;
const PCYC=1.3;function isPerfect(a){if(!a||a.p<.3)return false;const t=a.drawT||0;if(t<1)return false;const ph=t%PCYC;return ph>=1.0&&ph<1.2}
const wobble=()=>Math.sin(G.t*4.3)*.06+Math.sin(G.t*7.7)*.035;

function onImpact(ar,h,isReplay){const ang=Math.atan2(ar.vy,ar.vx),kind=ar.k,demo=G.mode==='demo';sfx.at(ar.x);
 if(h.k==='shield'){h.s.hits--;sfx.block();burst(ar.x,ar.y,22,['#5affd8','#dffff8','#fff'],300,ang+Math.PI,'spark');G.rings.push({x:ar.x,y:ar.y,r:0,max:80,c:'90,255,216',life:0});const ow=h.s.owner;if(G.ms&&!isReplay)G.ms[ow].blocks++;if(h.s.hits<=0)G.shields=G.shields.filter(s=>s!==h.s);float(ar.x,ar.y+30,'BLOCKED','#5affd8',.9);return}
 if(h.k==='target'){const g=h.g,d=Math.hypot(ar.x-h.p.x,ar.y-h.p.y)/g.r;let pts=d<.22?100:d<.58?50:25;const bonus=1+Math.max(0,g.x-400)/1800;pts=Math.round(pts*bonus);
  g.alive=false;burst(h.p.x,h.p.y,26,['#f2e2b0','#c0392b','#fff','#d9a06a'],320,ang+Math.PI,'chip');sfx.target();G.score+=pts;
  float(h.p.x,h.p.y+40,(d<.22?'BULLSEYE +':'+')+pts,d<.22?'#ffd75a':'#fff',1.2,d<.22);if(d<.22&&G.ms){G.ms[0].bulls++;say('Bullseye');buzz([15,30,15])}
  if(G.mode==='practice'){const gi=G.targets.indexOf(g);setTimeout(()=>{if(G.mode==='practice')G.targets[gi]=mkTarget(Math.random,gi,4)},900)}
  G.lastImpact={x:h.p.x,y:Math.max(h.p.y,60)};scoreUpd();return}
 const c=impactCalc(h,ar);const sh=G.A[ar.o];
 if(h.i!==undefined){const i=h.i,a=G.A[i];
  if(h.k==='head'){a.hv+=.9;}else if(h.k==='legs'){a.cv+=.9}else a.lv+=.4;a.fallDir=Math.sign(ar.vx)||1;
  a.stuckB.push({dx:ar.x-a.x,dy:ar.y-a.h,ang,k:kind});addFlash(ar.x,ar.y,h.k==='head'?60:42,'255,210,170',.2);burst(ar.x,ar.y,h.k==='head'?24:15,['#b3121f','#e0303f','#7a0a12'],260,ang+Math.PI,'chip');
  if(h.k==='head'){sfx.head();G.shake=16;G.slow=Math.min(G.slow,.25);G.slowT=.7;G.ab=1;float(ar.x,ar.y+56,'HEADSHOT','#ffd75a',1.4,1);if(!isReplay){say('Headshot!');buzz([20,30,40])}}else{sfx.hit();G.shake=Math.max(G.shake,9);G.ab=.5;buzz(30)}
  if(!demo&&!isReplay&&G.ms){G.ms[ar.o].hits++;if(h.k==='head')G.ms[ar.o].heads++;if(Math.abs(ar.x-ar.x0)>=1400){G.ms[ar.o].longs++;float(ar.x,ar.y+90,'LONG SHOT','#9fe7ff',1.3);say('Long shot!')}
   if(kind==='split')G.ms[ar.o].splits++;if(kind==='magnet')G.ms[ar.o].seeks++}
  if(!demo&&!isReplay&&G.sub!=='local'&&a.human&&(G.sub!=='online'||i===G.me))hurtFlash()
 }else if(h.k==='brick'){const o=h.o;addFlash(ar.x,ar.y,30,'255,230,180',.15);o.hp-=(kind==='bolt'||kind==='fire')?2:1;sfx.thunk();burst(ar.x,ar.y,16,[B.stone[0],B.stone[1],'#ddd'],240,ang+Math.PI,'chip');smoke(ar.x,ar.y,3);G.shake=Math.max(G.shake,6);
  if(o.hp<=0){o.dead=true;sfx.crumble();for(let k=0;k<70;k++)G.parts.push({x:o.x+(Math.random()-.5)*o.w,y:Math.random()*o.h,vx:(Math.random()-.5)*300,vy:Math.random()*300,life:0,max:1.2+Math.random(),c:k%2?B.stone[0]:B.stone[1],s:5+Math.random()*9,type:'chip',rot:0,vr:(Math.random()-.5)*10});smoke(o.x,20,10);G.shake=18;float(o.x,o.h*.6,'WALL DOWN','#fff',1.3,1);if(G.ms&&!isReplay)G.ms[ar.o].walls++}}
 else if(h.k==='plat'){sfx.thunk();burst(ar.x,ar.y,12,[B.stone[0],'#ddd'],200,ang+Math.PI,'chip')}
 else if(h.k!=='out'){G.stuck.push({x:ar.x,y:Math.max(ar.y,-2),ang,k:kind});
  if(h.k==='ground'){addDecal(ar.x,0,kind==='fire'||kind==='bolt'?62:kind==='ice'||kind==='poison'?55:16,kind==='std'?'dirt':kind);const st=B.ground.st;if(st==='snow'){sfx.snowp();burst(ar.x,2,18,['#fff','#e6eef8','#cfdbe8'],200,Math.PI/2,'chip')}else{sfx.dirt();burst(ar.x,2,16,st==='sand'?['#d9a06a','#b07a4a','#f0c690']:st==='asphalt'?['#55525e','#33303a','#777']:['#6b4a2a','#8a6a44','#4f7f2a'],190,Math.PI/2,'chip')}smoke(ar.x,6,5)}
  else{sfx.thunk();addFlash(ar.x,ar.y,28,'255,230,180',.15);burst(ar.x,ar.y,12,['#ddd','#999','#ffd27a'],200,ang+Math.PI,'spark')}
  G.shake=Math.max(G.shake,4)}
 if(h.k!=='out'){
  if(kind==='fire'){addFlash(ar.x,ar.y,110,'255,150,60',.35);for(let k=0;k<40;k++)spawnFlame(ar.x+(Math.random()-.5)*20,ar.y+(Math.random()-.5)*16,1.6);burst(ar.x,ar.y,20,['#ffd27a','#ff9a3a','#fff'],420,Math.PI/2,'spark');G.rings.push({x:ar.x,y:ar.y,r:0,max:120,c:'255,140,40',life:0});if(h.i===undefined)G.fires.push({x:ar.x,y:Math.max(ar.y,0),t:3.2});sfx.fire()}
  if(kind==='ice'){burst(ar.x,ar.y,26,['#e8fbff','#9fe7ff','#5ac8fa'],380,ang+Math.PI,'shard');G.rings.push({x:ar.x,y:ar.y,r:0,max:110,c:'160,230,255',life:0});sfx.ice()}
  if(kind==='bolt'){strike(ar.x,ar.y)}
  if(kind==='poison'){G.toxic.push({x:ar.x,y:Math.max(ar.y,0),t:3});for(let k=0;k<26;k++)G.parts.push({x:ar.x+(Math.random()-.5)*40,y:ar.y+(Math.random()-.5)*20,vx:(Math.random()-.5)*60,vy:20+Math.random()*40,life:0,max:1.4,s:10+Math.random()*10,type:'toxic'});sfx.venom()}
  if(kind==='shield'&&h.i===undefined&&!isReplay){G.shields.push({x:ar.x,y0:Math.max(0,ar.y-110),h:230,team:sh.team,owner:ar.o,hits:2,turns:3,born:G.t});sfx.shield();G.rings.push({x:ar.x,y:ar.y,r:0,max:100,c:'90,255,216',life:0})}
  if(kind==='split'){sfx.split()}}
 if(isReplay){for(let j=0;j<G.A.length;j++)if(c.ev[j]>0&&G.A[j].hp<=0){G.A[j].dead=true}return}
 if(!demo){for(let j=0;j<G.A.length;j++){const a=G.A[j];
  if(c.ev[j]>0){const dealt=applyDmg(j,c.ev[j],ar.o);if(a.team!==sh.team)sh.firstHit=true;float(a.x+(Math.random()-.5)*20,a.h+(h.i===j?(ar.y-a.h)+24:150),'-'+dealt,kind==='std'?'#fff':ARW[kind].c,1.1);
   if(kind==='bolt'&&h.i!==j){a.lv+=.45;float(a.x,a.h+170,'SHOCK','#ffe14a',1)}
   if(kind==='bolt'&&G.ms){if(j===ar.o)G.ms[ar.o].selfzap++;else if(a.team!==sh.team)G.ms[ar.o].zaps++}}
  if(c.burn[j]){a.burn=Math.max(a.burn,c.burn[j]);float(a.x,a.h+175,'ABLAZE','#ff8a2a',1.1);if(G.ms&&a.team!==sh.team)G.ms[ar.o].burns++}
  if(c.poison[j]){a.poison=Math.max(a.poison,c.poison[j]);float(a.x,a.h+200,'POISONED','#8cff5a',1.1);if(G.ms&&a.team!==sh.team)G.ms[ar.o].venoms++}
  if(c.frost[j]){a.frost=1;float(a.x,a.h+175,'FROZEN','#9fe7ff',1.1);if(G.ms&&a.team!==sh.team)G.ms[ar.o].freezes++}
  if(a.dead&&a.fall===0&&!a.koShown){a.koShown=true;if(G.cfg.layout==='siege'&&a.team===1&&sh.team===0){const pts=100*G.wave+(h.i===j&&h.k==='head'?50:0)+(ar.perf?50:0);G.score+=pts;G.kills++;float(a.x,a.h+250,'+'+pts,'#ffd75a',1.3);scoreUpd()}G.slow=Math.min(G.slow,.3);G.slowT=1.1;G.shake=18;float(a.x,a.h+220,'K.O.','#ff4d5e',1.8,1);say('Knockout!');buzz(90);if(sh.human&&!demo&&a.team!==sh.team&&Math.random()<.4&&!a.human)emote(ar.o,'TOO EASY')}}}
 if(!demo&&!isReplay&&h.i!==undefined&&!G.A[h.i].dead&&h.k==='head'&&!G.A[h.i].human&&Math.random()<.35)setTimeout(()=>emote(h.i,'NICE SHOT'),700);
 G.lastImpact={x:ar.x,y:Math.max(ar.y,60)};hudUpd()}

function flightDone(){G.platT=G.platT0+(G.flightT||0);if(G.killOn){G.slow=.22;G.slowT=.9;G.ms&&(G.ms[G.turn].killcams++)}G.killOn=false;G.kill=0;musicMode(G.mode==='demo'?0:1);
 const anyDead=G.A.some((a,k)=>a.dead&&G.snap&&!G.snap.dead[k]);G.state='resolve';G.timer=anyDead?2.1:G.cfg.layout==='range'?.7:1.2;G.roundKO=anyDead;
 if(G.sub==='online'&&G.turn===G.me)send({t:'res',s:G.A.map(a=>[a.hp,a.burn,a.poison,a.frost,a.dead?1:0,a.firstHit?1:0]),iron:G.ironUsed})}

function teamsAlive(){const s=new Set();G.A.forEach(a=>{if(!a.dead)s.add(a.team)});return[...s]}
function endTurn(){
 if(G.sub==='online'&&G.turn!==G.me&&!G.skipNet){if(!G.netRes){G.state='wait';return}const R=G.netRes;G.netRes=null;R.s.forEach((v,k)=>{const a=G.A[k];a.hp=v[0];a.burn=v[1];a.poison=v[2];a.frost=v[3];if(v[4]&&!a.dead)a.dead=true;a.firstHit=!!v[5]});G.ironUsed=R.iron||G.ironUsed;hudUpd()}
 G.skipNet=false;
 if(G.cfg.layout==='range'){if(G.mode==='daily'&&(G.arrowsLeft<=0||!G.targets.some(t=>t.alive))){G.state='done';setTimeout(dailyOver,600);return}G.turnCount++;setWind();beginTurn();return}
 if(G.cfg.layout==='siege'){const pa=G.A.some(a=>a.team===0&&!a.dead),ea=G.A.some(a=>a.team===1&&!a.dead);
  if(!pa){G.state='over';G.timer=2.6;G.matchWinner=1;tagHide();banner('TOWER FALLEN','WAVE '+G.wave+' · SCORE '+G.score);sfx.lose();say('Tower fallen');musicMode(0);return}
  if(!ea){siegeWaveClear();return}}
 const ta=teamsAlive();
 if(ta.length<=1&&G.mode!=='demo'&&G.cfg.layout!=='siege'){
  if(G.roundKO&&G.snap&&!G.replay&&G.mode!=='demo'&&SV.set.replay!==false&&G.A.some(a=>a.dead)&&G.snap.kind){startReplay();return}
  roundOver(ta);return}
 if(G.mode==='demo'&&ta.length<=1){G.round++;startRound(true);return}
 let n=0;do{G.oi=(G.oi+1)%G.order.length;n++}while(G.A[G.order[G.oi]].dead&&n<10);G.turn=G.order[G.oi];G.turnCount++;setWind();beginTurn()}
function roundOver(ta){G.replay=null;replayUI(false);
 if(ta.length===0){banner('DRAW','REPLAY THE ROUND');G.state='roundEnd';G.timer=2.6;G.drawRound=true;return}
 const w=ta[0];G.wins[w]++;G.winTeam=w;G.A.forEach(a=>{if(a.team===w&&!a.dead){a.vic=.01}});G.drawRound=false;
 // round stats for profile archer
 const me=G.A[G.pi];if(me&&me.team===w&&G.ms){G.ms[G.pi].roundsWon++;if(me.dmgRound===0)G.ms[G.pi].perfect++;if(me.hp<=10)G.ms[G.pi].comebacks++;G.ms[G.pi].biomes.push(M.bk)}
 hudUpd();tagHide();const nm=teamName(w);
 if(G.wins[w]>=winsNeed()){G.state='over';G.timer=2.8;G.matchWinner=w;const myTeam=G.sub==='local'&&G.mode!=='camp'&&G.mode!=='cup'?-1:G.A[G.pi].team;if(myTeam<0||w===myTeam){sfx.win();say(myTeam<0?nm+' wins':'Victory')}else{sfx.lose();say('Defeat')}
  banner(myTeam===w?'VICTORY':nm+' WINS',scoreLine());musicMode(0);return}
 G.state='roundEnd';G.timer=2.8;banner(G.A[G.pi].team===w&&G.sub!=='local'?'ROUND WON':nm+' TAKES IT',scoreLine())}
function teamName(t){const mem=G.A.filter(a=>a.team===t);if(G.cfg.layout==='team')return t===G.A[G.pi].team&&G.sub!=='local'?'YOUR TEAM':'TEAM '+(t?'RED':'GOLD');return mem[0]?mem[0].nm:'?'}
function scoreLine(){return G.wins.filter(x=>x!=null).join(' — ')}

// ---------- REPLAY ----------
function startReplay(){const s=G.snap;G.replay={keep:{obs:JSON.stringify(G.obsLive),shields:JSON.stringify(G.shields),dead:G.A.map(a=>[a.dead,a.fall])},t:0};
 G.obsLive=JSON.parse(s.obs);G.shields=JSON.parse(s.shields);G.A.forEach((a,k)=>{a.dead=s.dead[k];if(!a.dead){a.fall=0;a.koShown=true}});
 const ar=mkArrow(s.i,s.a,s.p,s.kind,s.perf);G.A[s.i].a=s.a;G.arrows=[ar];G.flightT=0;G.replay.env={wind:s.wind,pt0:s.pt0};G.state='replay';G.slow=.38;G.acc=0;replayUI(true);
 if(G.ms){SV.stats.replays=(SV.stats.replays||0)+1}musicMode(2);clipStart()}
function endReplay(){if(!G.replay)return;const k=G.replay.keep;G.obsLive=JSON.parse(k.obs);G.shields=JSON.parse(k.shields);G.A.forEach((a,i)=>{a.dead=k.dead[i][0]});G.arrows=[];G.slow=1;G.replay=null;replayUI(false);clipStop();musicMode(1);roundOver(teamsAlive())}

// ---------- CPU ----------
function simShot(i,a,p,tgt,ti){const s=launchPos(i,a);let x=s.x,y=s.y,vx=Math.cos(a)*VMAX*p,vy=Math.sin(a)*VMAX*p,t=0,best=1e9;const dt=1/60,wa=G.wind*WINDK*(OUT[G.A[i].out].id==='jade'?.5:1);
 for(let n=0;n<480;n++){vx+=wa*dt;vy-=GRAV*dt;const nx=x+vx*dt,ny=y+vy*dt;
  for(let k=1;k<=4;k++){const px=x+(nx-x)*k/4,py=y+(ny-y)*k/4,d=Math.hypot(px-tgt.x,py-tgt.y);if(d<best)best=d;const h=hitTest(px,py,i,t+dt*k/4,G.platT+t);if(h)return h.i===ti?{d:0,k:h.k}:h.k==='target'&&h.g===tgt.g?{d:0}:{d:best+(h.i!==undefined&&G.A[h.i].team===G.A[i].team?400:30),k:h.k}}
  x=nx;y=ny;t+=dt}return{d:best}}
function planCpu(i){const me=G.A[i];const en=enemiesOf(i);let ti=-1,tg;
 if(G.cfg.layout==='range'){const t=G.targets.find(x=>x.alive);if(!t){G.cpu=null;return}tg={x:t.x,y:t.y,g:t}}
 else{let bs=1e9;for(const j of en){const s=G.A[j].hp+Math.abs(G.A[j].x-me.x)*.03;if(s<bs){bs=s;ti=j}}if(ti<0)return;}
 const diff=me.diff;const T=ti>=0?G.A[ti]:null;const wantHead=T&&diff===2&&Math.random()<.5;if(T)tg={x:T.x,y:T.h+(wantHead?96:62)};
 const dir=tg.x>=me.x?1:-1;let best=null;
 for(let deg=-12;deg<=74;deg+=1.5){const a=dir>0?deg*Math.PI/180:Math.PI-deg*Math.PI/180;
  for(let p=.3;p<=1.001;p+=.02){const r=simShot(i,a,p,tg,ti);const sc=r.d+Math.abs(deg-28)*.15+(r.k==='head'?-6:0);if(!best||sc<best.sc)best={a,p,sc}}}
 let err=[[5.5,.075],[2.6,.035],[1,.013]][diff];if(G.mode==='demo')err=[4,.05];if(me.frost)err=[err[0]*1.8,err[1]*1.6];
 const a=best.a+gauss()*err[0]*Math.PI/180,p=clamp(best.p+gauss()*err[1],.25,1);
 let k='std';const opts=SPECIALS.filter(x=>me.ch[x]>0&&x!=='shield');
 if(G.mode==='demo')k=['std','fire','ice','bolt','split','poison','magnet'][Math.random()*7|0];
 else if(opts.length&&Math.random()<(me.ch.bolt>1||me.ch.ice>1?.75:.5)){k=opts[Math.random()*opts.length|0];if(k==='bolt'&&T&&Math.abs(T.x-me.x)<450)k='std'}
 if(G.mode!=='demo'&&me.ch.shield>0&&me.hp<45&&Math.random()<.5){k='shield'}
 me.sel=k;const fast=G.cfg.layout==='siege'&&me.team===1;G.cpuPerf=Math.random()<(G.mode==='demo'?.3:[.1,.25,.45][diff]);G.cpu={a0:me.a,a1:a,p1:p,t:0,dur:fast?.6+Math.random()*.4:1.1+Math.random()*.7,delay:G.mode==='demo'?.8:fast?.2:.5}
 if(k==='shield'){const dirS=dir;G.cpu.a1=dirS>0?.9:Math.PI-.9;G.cpu.p1=.42}}

// ---------- FX ----------
function burst(x,y,n,cols,sp,dir,type){for(let k=0;k<n;k++){const a=dir+(Math.random()-.5)*2.4,v=sp*(.3+Math.random());G.parts.push({x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v+80,life:0,max:.5+Math.random()*.7,c:cols[k%cols.length],s:2+Math.random()*4,type,rot:Math.random()*6,vr:(Math.random()-.5)*20})}}
function spawnFlame(x,y,sc=1){G.parts.push({x,y,vx:(Math.random()-.5)*40,vy:40+Math.random()*90,life:0,max:.4+Math.random()*.5,s:(5+Math.random()*7)*sc,type:'flame'})}
function smoke(x,y,n){for(let k=0;k<n;k++)G.parts.push({x:x+(Math.random()-.5)*20,y,vx:(Math.random()-.5)*30,vy:20+Math.random()*30,life:0,max:1+Math.random(),s:10+Math.random()*10,type:'smoke'})}
function float(x,y,t,c,dur,big){G.floats.push({x,y,t,c,life:0,max:dur,big})}
function jag(x0,y0,x1,y1,dev,n){const pts=[[x0,y0]];for(let k=1;k<n;k++){const t=k/n;pts.push([lerp(x0,x1,t)+(Math.random()-.5)*dev,lerp(y0,y1,t)+(Math.random()-.5)*dev*.3])}pts.push([x1,y1]);return pts}
function strike(x,y){const pts=jag(x+(Math.random()-.5)*200,y+1600,x,y,90,22);const br=[];for(let k=0;k<3;k++){const s=pts[4+k*5|0];br.push(jag(s[0],s[1],s[0]+(Math.random()-.5)*300,s[1]-200-Math.random()*200,60,8))}
 G.bolts.push({pts,br,life:0,max:.45});addFlash(x,y,220,'255,245,200',.45);if(y<40)addDecal(x,0,80,'bolt');G.flashA=.85;G.shake=20;G.ab=1.2;sfx.at(x).bolt();burst(x,y,30,['#fff','#ffe14a','#9fe7ff'],520,Math.PI/2,'spark');G.rings.push({x,y,r:0,max:160,c:'255,235,120',life:0});smoke(x,y,6);buzz([30,20,60])}
function emote(i,txt){const a=G.A[i];if(!a)return;G.bubbles=G.bubbles.filter(b=>b.i!==i);G.bubbles.push({i,txt,t:2.4});a.taunt=1.6;a.tpose=txt==='GG'||txt==='NICE SHOT'?'salute':a.pose;sfx.ui()}

// ---------- CAMERA ----------
let W=0,H=0,DPR=1;
function zBase(){return Math.min(H/640,W/620)}
function overview(){if(!M)return{x:0,y:300,z:1};const top=Math.max(...M.hs,...(M.obs.map(o=>o.type==='plat'?o.y0+o.amp+40:o.h||0)),...G.targets.map(t=>t.y+(t.amp||0)))+260;const span=(M.cfgRange?1800:M.maxX-M.minX)+380;
 const z=Math.min(W/(G.cfg&&G.cfg.layout==='range'?2100:span),H/(top+140));return{x:G.cfg&&G.cfg.layout==='range'?850:(M.minX+M.maxX)/2,y:H/2/z-90,z}}
function camPan(x){return clamp((x-G.cam.x)*G.cam.z/(W/2),-1,1)}
function camTarget(){const zb=zBase();if(!M)return{x:0,y:300,z:zb};const st=G.state;
 if(st==='photo')return G.cam;
 if(st==='intro'||st==='roundEnd'||st==='waveEnd')return overview();
 if(st==='over'||st==='done'){if(G.cfg.layout==='range')return overview();const w=G.A.find(a=>a.team===G.matchWinner&&!a.dead)||G.A[0];const z=zb*1.5;return{x:w.x+w.face*40,y:Math.max(w.h+70,H/2/z-60),z}}
 if(G.mode==='demo'&&st==='aim'){const z=zb*.85;return{x:(M.minX+M.maxX)/2+Math.sin(G.t*.12)*(M.maxX-M.minX)*.32,y:Math.max(220,H/2/z-70),z}}
 if((st==='flight'||st==='replay')&&G.arrows.length){const ar=G.arrows[0];const z=G.killOn?zb*1.7:st==='replay'?zb*1.3:zb*.92;return{x:ar.x+ar.vx*(G.killOn||st==='replay'?.02:.12),y:Math.max(ar.y,H/2/z-70),z}}
 if((st==='resolve'||st==='wait')&&G.lastImpact){const z=zb*1.05;return{x:G.lastImpact.x,y:Math.max(G.lastImpact.y,H/2/z-70),z}}
 const a=G.A[G.turn];if(!a)return overview();const z=zb;const off=Math.min(W/z*.28,260);return{x:a.x+a.face*off,y:Math.max(a.h+100,H/2/z-70),z}}

// ---------- WEATHER ----------
function initWeather(){G.wx=[];if(!M)return;const t=B.wx,n={rain:240,drizzle:110,snow:170,leaves:26,dust:70,fireflies:46}[t]||0;
 for(let k=0;k<n;k++)G.wx.push({x:Math.random()*W,y:Math.random()*H,z:.35+Math.random()*.65,ph:Math.random()*6.3,c:Math.random()})}
function updWeather(dt,camDX){const t=B.wx,w=G.wind;
 for(const p of G.wx){p.x-=camDX*p.z*.6;
  if(t==='rain'||t==='drizzle'){p.y+=(t==='rain'?1500:1100)*DPR*p.z*dt;p.x+=(w*500-60)*DPR*p.z*dt}
  else if(t==='snow'){p.y+=(40+70*p.z)*DPR*dt;p.x+=(w*160+Math.sin(G.t*1.3+p.ph)*30)*DPR*p.z*dt}
  else if(t==='leaves'){p.y+=(30+40*p.z)*DPR*dt;p.x+=(w*120+Math.sin(G.t*.9+p.ph)*50)*DPR*dt;p.ph+=dt*2}
  else if(t==='dust'){p.y+=Math.sin(G.t*.5+p.ph)*8*DPR*dt;p.x+=(w*80+12)*DPR*p.z*dt}
  else if(t==='fireflies'){p.y+=Math.sin(G.t*.8+p.ph*3)*16*DPR*dt;p.x+=Math.cos(G.t*.6+p.ph)*16*DPR*dt}
  const m=40*DPR;if(p.y>H+m){p.y=-m;p.x=Math.random()*W}if(p.y<-m*2)p.y=H;if(p.x>W+m)p.x-=W+2*m;if(p.x<-m)p.x+=W+2*m}
 if(B.birds&&Math.random()<dt*.06&&G.birds.length<2){const dir=Math.random()<.5?1:-1;const n=3+Math.random()*5|0;const by=H*(.12+Math.random()*.2);const fl=[];for(let k=0;k<n;k++)fl.push({ox:-k*18*DPR*(Math.random()*.4+.8),oy:(k%2?1:-1)*k*7*DPR,ph:Math.random()*6});G.birds.push({x:dir>0?-100*DPR:W+100*DPR,y:by,dir,fl,v:(60+Math.random()*40)*DPR})}
 for(let k=G.birds.length-1;k>=0;k--){const b=G.birds[k];b.x+=b.dir*b.v*dt-camDX*.15;if(b.x<-400*DPR||b.x>W+400*DPR)G.birds.splice(k,1)}
 if(B.lightning){G.ltT-=dt;if(G.ltT<=0){G.ltT=4+Math.random()*8;G.flashA=Math.max(G.flashA,.55);const x=Math.random()*W;G.bgBolt={pts:jag(x,0,x+(Math.random()-.5)*W*.3,H*(.35+Math.random()*.15),60*DPR,14),life:0};sfx.rumble(.2+Math.random()*.6)}}
 if(G.bgBolt){G.bgBolt.life+=dt;if(G.bgBolt.life>.3)G.bgBolt=null}
 G.flashA=Math.max(0,G.flashA-dt*2.2)}

// ---------- UPDATE ----------
function update(dt){G.t+=dt;const prevX=G.cam.x;if(G.state==='photo'){return}
 for(const c of G.clouds)c.x+=c.v*dt;
 if(G.slowT>0&&!G.killOn){G.slowT-=dt;if(G.slowT<=0)G.slow=G.state==='replay'?.38:1}
 const sdt=dt*G.slow;const st=G.state;
 if(st==='aim'||st==='intro'||st==='resolve'||st==='wait'||st==='roundEnd')G.platT+=dt;
 if(st==='intro'){G.timer-=dt;if(G.timer<=0)beginTurn()}
 else if(st==='aim'&&G.cpu){const c=G.cpu,a=G.A[G.turn];if(c.delay>0)c.delay-=dt;else{c.t+=dt;const k=clamp(c.t/c.dur,0,1),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;a.a=lerp(c.a0,c.a1,e);a.face=Math.cos(a.a)>=0?1:-1;const pp=c.p1*e;if(Math.floor(pp*10)>Math.floor(a.p*10)&&G.mode!=='demo')sfx.at(a.x).tick();a.p=pp;
   if(k>=1){G.cpu=null;const turn=G.turn,mode=G.mode;setTimeout(()=>{if(G.state==='aim'&&G.turn===turn&&G.mode===mode&&!isHuman(turn))fire(a.a,a.p,a.sel)},220)}}}
 else if((st==='flight'||st==='replay')&&G.arrows.length){const env=st==='replay'?G.replay.env:{wind:G.wind,pt0:G.platT0};const lead=G.arrows[0];
  if(st==='flight'&&G.kill&&!G.killOn&&lead.t>G.kill-.5){G.killOn=true;G.slow=.2;musicMode(2)}
  G.acc+=sdt;
  while(G.acc>=STEP&&G.arrows.length){G.acc-=STEP;const add=[],rem=[];
   for(const ar of G.arrows){const h=stepArrow(ar,env);if(h&&h.k==='split'){add.push(...splitArrow(ar));continue}if(h||ar.t>14){rem.push(ar);onImpact(ar,h||{k:'out'},st==='replay')}}
   if(rem.length)G.arrows=G.arrows.filter(a=>!rem.includes(a));if(add.length)G.arrows.push(...add)}
  if(G.arrows.length)G.flightT=G.arrows[0].t;for(const ar of G.arrows){ar.trail.push(ar.x,ar.y);if(ar.trail.length>48)ar.trail.splice(0,2);trailFx(ar)}
  if(!G.arrows.length){if(st==='replay'){G.timer=1.4;G.state='replayEnd'}else flightDone()}}
 else if(st==='flight'&&!G.arrows.length)flightDone();
 else if(st==='waveEnd'){G.timer-=dt;if(G.timer<=0){G.wave++;spawnWave();G.state='intro';G.timer=1.8;const b=G.wave%5===0;banner('WAVE '+G.wave,b?'WARLORD INCOMING':(G.A.length-G.cfg.slots.length)+' RAIDERS');musicMode(1);if(b)say('Warlord incoming')}}
 else if(st==='replayEnd'){G.timer-=dt;if(G.timer<=0)endReplay()}
 else if(st==='resolve'){G.timer-=dt;if(G.timer<=0)endTurn()}
 else if(st==='wait'){if(G.netRes)endTurn()}
 else if(st==='roundEnd'){G.timer-=dt;if(G.timer<=0){if(!G.drawRound)G.round++;else G.bump=(G.bump||0)+1;startRound()}}
 else if(st==='over'){G.timer-=dt;if(G.timer<=0){G.state='done';matchOver()}}
 if(st!=='flight'&&st!=='replay')G.acc=0;
 for(const a of G.A){if(a.dead)a.fall=Math.min(1,a.fall+sdt*1.6);
  a.lv+=(-a.lean*90-a.lv*9)*sdt;a.lean+=a.lv*sdt*6;a.cv+=(-a.crouch*90-a.cv*9)*sdt;a.crouch+=a.cv*sdt*6;a.hv+=(-a.hsnap*120-a.hv*10)*sdt;a.hsnap+=a.hv*sdt*6;
  a.recoil=Math.max(0,a.recoil-sdt*2.2);if(G.state==='aim'&&G.turn===a.i&&a.human&&a.p>=.3){const pv=a.drawT||0;a.drawT=pv+dt;if(Math.floor((a.drawT-1)/PCYC)!==Math.floor((pv-1)/PCYC)&&a.drawT>=1&&isLocalTurn())sfx.at(a.x).ting()}else if(G.state==='aim'&&G.turn===a.i&&a.human)a.drawT=0;if(a.vic)a.vic=Math.min(1,a.vic+dt);if(a.taunt>0)a.taunt-=dt;if(a.walk>0&&(st==='intro'||st==='aim'))a.walk=Math.max(0,a.walk-dt*.8);
  if(!a.dead&&G.state!=='flight'&&G.turn!==a.i&&G.cfg.layout!=='range'){const e=enemiesOf(a.i);if(e.length){let nj=e[0],bd=1e9;for(const j of e){const d=Math.abs(G.A[j].x-a.x);if(d<bd){bd=d;nj=j}}const f=G.A[nj].x>=a.x?1:-1;if(f!==a.face){a.face=f;a.a=Math.PI-a.a}}}
  if(a.burn>0&&!a.dead&&Math.random()<dt*14)spawnFlame(a.x+(Math.random()-.5)*22,a.h+15+Math.random()*70,.55);
  if(a.poison>0&&!a.dead&&Math.random()<dt*6)G.parts.push({x:a.x+(Math.random()-.5)*26,y:a.h+20+Math.random()*60,vx:0,vy:20,life:0,max:1,s:5,type:'toxic'});
  if(a.frost>0&&Math.random()<dt*6)G.parts.push({x:a.x+(Math.random()-.5)*40,y:a.h+Math.random()*90,vx:0,vy:-10,life:0,max:.8,c:'#e8fbff',s:2,type:'spark'})}
 if(B.torch&&M&&!B.lamp){G.torchT=(G.torchT||0)+dt;while(G.torchT>.06){G.torchT-=.06;for(let i=0;i<M.xs.length;i++){if(M.wood&&M.wood[i])continue;const d=towerSide(i);G.parts.push({x:M.xs[i]-d*48+(Math.random()-.5)*3,y:M.hs[i]+52,vx:(Math.random()-.5)*14,vy:45+Math.random()*25,life:0,max:.5,s:4.2,type:'flame',torch:1})}}}
 for(let k=G.fires.length-1;k>=0;k--){const F=G.fires[k];F.t-=dt;if(Math.random()<dt*30)spawnFlame(F.x+(Math.random()-.5)*36,F.y+2,.9*Math.max(.05,Math.min(1,F.t)));if(F.t<=0)G.fires.splice(k,1)}
 for(let k=G.toxic.length-1;k>=0;k--){const F=G.toxic[k];F.t-=dt;if(Math.random()<dt*12)G.parts.push({x:F.x+(Math.random()-.5)*70,y:F.y+Math.random()*20,vx:(Math.random()-.5)*20,vy:15,life:0,max:1.4,s:12+Math.random()*10,type:'toxic'});if(F.t<=0)G.toxic.splice(k,1)}
 for(let k=G.parts.length-1;k>=0;k--){const p=G.parts[k];p.life+=sdt;
  if(p.type==='flame'){p.vy+=60*sdt;p.vx*=.98;p.x+=p.vx*sdt+G.wind*30*sdt;p.y+=p.vy*sdt}
  else if(p.type==='smoke'||p.type==='toxic'){p.x+=(p.vx+G.wind*40)*sdt;p.y+=p.vy*sdt;p.s+=10*sdt}
  else if(p.type==='glint'){p.x+=p.vx*sdt;p.y+=p.vy*sdt}
  else{p.vy-=(p.type==='spark'?500:900)*sdt;p.x+=p.vx*sdt;p.y+=p.vy*sdt;p.rot+=(p.vr||0)*sdt;if(p.y<0){p.y=0;p.vy*=-.3;p.vx*=.6;p.vr*=.5}}
  if(p.life>p.max)G.parts.splice(k,1)}
 if(G.parts.length>1000)G.parts.splice(0,G.parts.length-1000);
 for(let k=G.floats.length-1;k>=0;k--){const f=G.floats[k];f.life+=dt;f.y+=36*dt;if(f.life>f.max)G.floats.splice(k,1)}
 for(let k=G.rings.length-1;k>=0;k--){const r=G.rings[k];r.life+=sdt*2.2;if(r.life>1)G.rings.splice(k,1)}
 for(let k=G.bolts.length-1;k>=0;k--){const b=G.bolts[k];b.life+=dt;if(b.life>b.max)G.bolts.splice(k,1)}
 for(let k=G.bubbles.length-1;k>=0;k--){G.bubbles[k].t-=dt;if(G.bubbles[k].t<=0)G.bubbles.splice(k,1)}
 // winner sparkle
 if(G.state==='over'||G.state==='done'){for(const a of G.A)if(a.vic&&Math.random()<dt*20)G.parts.push({x:a.x+(Math.random()-.5)*80,y:a.h+Math.random()*140,vx:0,vy:30,life:0,max:1,c:'#ffe08a',s:3,type:'glint'})}
 const T=camTarget(),c=G.cam,kk=st==='flight'||st==='replay'?7:G.mode==='demo'?1.2:3;c.x+=(T.x-c.x)*Math.min(1,dt*kk);c.y+=(T.y-c.y)*Math.min(1,dt*kk);c.z+=(T.z-c.z)*Math.min(1,dt*(G.killOn?4:2.4));
 G.shake=Math.max(0,G.shake-dt*30);G.ab=Math.max(0,G.ab-dt*2.5);
 if(M)updWeather(dt,(c.x-prevX)*c.z)}
function trailFx(ar){const tr=G.A[ar.o]?G.A[ar.o].trail:'classic';
 if(ar.k==='fire'&&Math.random()<.9)spawnFlame(ar.x-ar.vx*.01,ar.y-ar.vy*.01,.8);
 if(ar.k==='ice'&&Math.random()<.5)G.parts.push({x:ar.x,y:ar.y,vx:(Math.random()-.5)*40,vy:(Math.random()-.5)*40,life:0,max:.6,c:'#dff7ff',s:2.5,type:'spark'});
 if(ar.k==='bolt'&&Math.random()<.4)G.parts.push({x:ar.x,y:ar.y,vx:(Math.random()-.5)*200,vy:(Math.random()-.5)*200,life:0,max:.18,c:'#fff6a8',s:2,type:'spark'});
 if(ar.k==='poison'&&Math.random()<.5)G.parts.push({x:ar.x,y:ar.y,vx:0,vy:-20,life:0,max:.8,s:5,type:'toxic'});
 if(tr==='gold'&&Math.random()<.8)G.parts.push({x:ar.x,y:ar.y,vx:(Math.random()-.5)*30,vy:(Math.random()-.5)*30,life:0,max:.7,c:Math.random()<.5?'#ffe08a':'#fff3c4',s:2.5,type:'glint'});
 if(tr==='ember'&&Math.random()<.7)G.parts.push({x:ar.x,y:ar.y,vx:(Math.random()-.5)*60,vy:(Math.random()-.5)*60,life:0,max:.5,c:'#ff8a2a',s:2.2,type:'spark'});
 if(tr==='star'&&Math.random()<.5)G.parts.push({x:ar.x,y:ar.y,vx:(Math.random()-.5)*20,vy:(Math.random()-.5)*20,life:0,max:1,c:'#ffffff',s:3,type:'glint'});
 if(tr==='smoke'&&Math.random()<.5)G.parts.push({x:ar.x,y:ar.y,vx:0,vy:10,life:0,max:.9,s:5,type:'smoke'});
 if(tr==='prism'&&Math.random()<.9)G.parts.push({x:ar.x,y:ar.y,vx:(Math.random()-.5)*20,vy:(Math.random()-.5)*20,life:0,max:.6,c:`hsl(${(G.t*400)%360},100%,65%)`,s:3,type:'glint'})}
