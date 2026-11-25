// ================= LONG SHOT · UI / FLOW =================
const glc=$('glc');cv.id='c2d';document.body.insertBefore(cv,glc);
let POSTON=false,drag=null,lastSend=0,photoFilter='none',PREVS=[];
function gfxDPR(){return Math.min(window.devicePixelRatio||1,SV.set.gfx==='ultra'?3:SV.set.gfx==='high'?2.5:1.5)}
function resize(){DPR=gfxDPR();W=cv.width=Math.round(innerWidth*DPR);H=cv.height=Math.round(innerHeight*DPR);glc.width=W;glc.height=H;if(POST.ok)postSize(W,H);initWeather()}
function setGfx(q){SV.set.gfx=q;if(q!=='low'&&!POST.ok)postInit(glc);POSTON=q!=='low'&&POST.ok;glc.style.display=POSTON?'block':'none';cv.style.display=POSTON?'none':'block';resize();save()}
addEventListener('resize',resize);

// ---------- SCREENS ----------
function show(id){document.querySelectorAll('.scr').forEach(s=>s.classList.toggle('on',s.id===id));if(id==='sMenu')menuUpd()}
function hideAll(){document.querySelectorAll('.scr').forEach(s=>s.classList.remove('on'))}
const onScreen=id=>$(id).classList.contains('on');
function banner(t,s){const b=$('banner');b.innerHTML='<div class="t">'+t+'</div>'+(s?'<small>'+s+'</small>':'');b.classList.remove('show');void b.offsetWidth;b.classList.add('show')}
const TQ=[];let tqOn=false;function toast(t,s,icon){TQ.push([t,s,icon]);if(!tqOn)tqNext()}
function tqNext(){const n=TQ.shift();if(!n){tqOn=false;return}tqOn=true;const[t,s,icon]=n;const d=document.createElement('div');d.className='toast';d.innerHTML=`<div class="ti">${icon||'<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2l2.6 6.3L21 9l-5 4.4L17.5 20 12 16.5 6.5 20 8 13.4 3 9l6.4-.7z"/></svg>'}</div><div><b>${t}</b><span>${s||''}</span></div>`;$('toasts').appendChild(d);sfx.ach();setTimeout(()=>d.remove(),3700);setTimeout(tqNext,2300)}
function setHud(on){const r=on&&G.cfg&&G.cfg.layout==='range';$('hud').style.display=on&&!r?'flex':'none';$('scoreBox').style.display=r?'flex':'none';$('pauseBtn').style.display=on?'flex':'none';$('emoteBtn').style.display=on&&!r?'grid':'none';if(!on){tagHide();$('emoteWheel').style.display='none'}}
function hurtFlash(){$('flash').style.opacity=1;setTimeout(()=>$('flash').style.opacity=0,180)}

// ---------- HUD ----------
let HC=[];
function hudBuild(){const L=$('hudL'),R=$('hudR');L.innerHTML='';R.innerHTML='';HC=[];const lay=G.cfg.layout;setHud(true);
 $('arrowsLeftBox').style.display=G.mode==='daily'?'':'none';$('bWind').style.display=G.mode==='practice'?'':'none';if(lay==='range'){scoreUpd();return}
 const left=[],right=[];G.cfg.slots.forEach((s,k)=>{const t=s.team!=null?s.team:k;if(lay==='team'||lay==='siege')(t===0?left:right).push(k);else if(lay==='ffa')(k%2===0?left:right).push(k);else(k===0?left:right).push(k)});
 const small=G.cfg.slots.length>2||(lay==='siege'&&G.cfg.slots.length>1);document.body.classList.toggle('hud4',small);
 [[left,L],[right,R]].forEach(([arr,el],side)=>arr.forEach((k,n)=>{const s=G.cfg.slots[k];const d=document.createElement('div');d.className='pc'+(small?' small':'');
  d.innerHTML='<div class="av"><canvas width="96" height="96"></canvas></div><div class="pinfo"><div class="nm"></div><div class="bar"><b></b><i></i><u></u></div><div class="meta"><div class="pips"></div><span class="st burn"></span><span class="st venom"></span><span class="st frost">FROZEN</span></div></div>';
  el.appendChild(d);const c={el:d,nm:d.querySelector('.nm'),i:d.querySelector('.bar i'),b:d.querySelector('.bar b'),pips:d.querySelector('.pips'),sb:d.querySelector('.burn'),sv:d.querySelector('.venom'),sf:d.querySelector('.frost')};
  c.nm.textContent=s.nm;c.showPips=lay!=='siege'&&(lay==='ffa'||n===0);if(c.showPips)for(let w=0;w<winsNeed();w++)c.pips.appendChild(document.createElement('span'));
  drawAvatar(d.querySelector('canvas'),s.out,side?-1:1);HC[k]=c}));
 if(lay==='siege')R.innerHTML='<div class="wavebox"><span>WAVE</span><b id="wvN">1</b><small id="wvE"></small><small id="wvS">SCORE 0</small></div>'}
function drawAvatar(c,oi,d){const cc=c.getContext('2d');cc.setTransform(1,0,0,1,0,0);const o=OUT[oi];const g=cc.createLinearGradient(0,0,0,96);g.addColorStop(0,o.dark);g.addColorStop(1,'#000');cc.fillStyle=g;cc.fillRect(0,0,96,96);
 const prev=ctx;ctx=cc;ctx.setTransform(2.2,0,0,-2.2,48-d*8,246);drawFigure(o,{hp:1,dead:false,fall:0,lean:0,crouch:0,hsnap:0,recoil:0,vic:0,taunt:0,a:d>0?.2:Math.PI-.2,p:0,sel:'std',bow:'oak'},d,{aiming:false});ctx=prev}
function hudUpd(){if(!G.cfg||G.mode==='demo')return;G.A.forEach((a,k)=>{const c=HC[k];if(!c)return;const v=Math.max(0,a.hp/a.maxhp*100)+'%';c.i.style.width=v;c.b.style.width=v;const o=OUT[a.out];
 c.i.style.background=G.cfg.layout==='team'?`linear-gradient(90deg,${shade(TEAMC(a.team),-.45)},${TEAMC(a.team)})`:`linear-gradient(90deg,${o.dark},${o.main} 55%,${o.light})`;
 if(c.showPips){const p=c.pips.children;for(let w=0;w<p.length;w++)p[w].classList.toggle('on',(G.wins[a.team]||0)>w)}
 c.sb.style.display=a.burn>0?'':'none';c.sb.textContent='BURN '+a.burn;c.sv.style.display=a.poison>0?'':'none';c.sv.textContent='VENOM '+a.poison;c.sf.style.display=a.frost>0?'':'none';
 c.el.classList.toggle('dead',a.dead);c.el.classList.toggle('turn',G.turn===k&&G.state==='aim')});scoreUpd()}
function windUpd(){const s=G.wind;$('wtxt').textContent=Math.abs(s)<.05?'CALM':Math.abs(s*10).toFixed(0)+' MPH '+(s>0?'›':'‹');const f=$('wfill');
 if(s>=0){f.style.left='50%';f.style.right='auto';f.style.width=Math.min(50,s*50)+'%'}else{f.style.right='50%';f.style.left='auto';f.style.width=Math.min(50,-s*50)+'%'}
 $('bWind').textContent='WIND: '+(Math.abs(s)<.05?'CALM':Math.abs(s*10).toFixed(0)+' MPH')}
function tagTurn(){const a=G.A[G.turn];let txt;if(G.cfg.layout==='range')txt=G.mode==='daily'?'ARROW '+(9-G.arrowsLeft)+' OF 8':'FREE FIRE';else if(G.sub==='local'&&a.human)txt=a.nm+' · YOUR SHOT';else if(isLocalTurn())txt='YOUR SHOT';else txt=a.nm+' IS AIMING';
 const tg=$('tag');tg.textContent=txt;tg.style.display='block';tg.style.color=G.cfg.layout==='team'?TEAMC(a.team):OUT[a.out].light;
 $('hint').style.display=isLocalTurn()&&(SV.stats.matches||0)<2&&G.turnCount<2?'block':'none';arrowsUpd();hudUpd()}
function tagHide(){$('tag').style.display='none';$('hint').style.display='none';$('arrows').style.display='none'}
function arrowsUpd(){const el=$('arrows');const a=G.A[G.turn];const show=G.state==='aim'&&isLocalTurn()&&G.mode!=='daily'&&G.mode!=='demo'&&(G.elem||G.mode==='practice')&&a.quiver.length>0;el.style.display=show?'flex':'none';if(!show)return;
 const inf=G.mode==='practice';const ks=['std',...a.quiver.filter((k,i,arr)=>arr.indexOf(k)===i)];
 el.innerHTML=ks.map(k=>`<button data-k="${k}" style="--c:${KC(k)}">${ICON[k]}<span>${ARW[k].n}</span><b>${k==='std'||inf?'∞':a.ch[k]}</b></button>`).join('');
 el.querySelectorAll('button').forEach(b=>{const k=b.dataset.k;const ok=k==='std'||inf||a.ch[k]>0;b.classList.toggle('sel',a.sel===k);if(!ok)b.classList.add('off');
  b.addEventListener('pointerdown',e=>{e.stopPropagation();if(!ok)return;a.sel=k;sfx.ui();el.querySelectorAll('button').forEach(x=>x.classList.toggle('sel',x===b));if(G.sub==='online')send({t:'sel',k})})})}
function scoreUpd(){if($('wvN')&&G.cfg&&G.cfg.layout==='siege'){$('wvN').textContent=G.wave;const e=G.A.filter(a=>a.team===1&&!a.dead).length;$('wvE').textContent=e+(e===1?' RAIDER LEFT':' RAIDERS LEFT');$('wvS').textContent='SCORE '+G.score}$('scoreV').textContent=G.score;$('arrowsV').textContent=Math.max(0,G.arrowsLeft)}
$('bWind').onclick=e=>{e.stopPropagation();const seq=[0,.4,-.6,1,-1];const i=(seq.indexOf(G.practiceWind||0)+1)%seq.length;G.practiceWind=seq[i];setWind();sfx.ui()};

// ---------- INPUT ----------
function canAim(){return G.state==='aim'&&isLocalTurn()}
let pdrag=null;
function onDown(e){ac();$('emoteWheel').style.display='none';
 if(G.state==='replay'||G.state==='replayEnd'){G.arrows=[];G.state='replayEnd';G.timer=.15;return}
 if(G.state==='photo'){pdrag={x:e.clientX,y:e.clientY};return}
 if(!canAim())return;drag={sx:e.clientX,sy:e.clientY,cx:e.clientX,cy:e.clientY,id:e.pointerId,snd:false};try{e.target.setPointerCapture(e.pointerId)}catch(_){}}
function onMove(e){if(G.state==='photo'&&pdrag){G.cam.x-=(e.clientX-pdrag.x)*DPR/G.cam.z;G.cam.y+=(e.clientY-pdrag.y)*DPR/G.cam.z;pdrag={x:e.clientX,y:e.clientY};return}
 if(!drag||e.pointerId!==drag.id)return;drag.cx=e.clientX;drag.cy=e.clientY;const dx=drag.cx-drag.sx,dy=drag.cy-drag.sy,len=Math.hypot(dx,dy);if(len<6)return;
 const P=G.A[G.turn];P.a=Math.atan2(dy,-dx);P.face=Math.cos(P.a)>=0?1:-1;const np=clamp(len/(Math.min(innerWidth,innerHeight)*.42/SV.set.sens),0,1);
 if(Math.floor(np*10)>Math.floor(P.p*10))sfx.at(P.x).tick();P.p=np;if(!drag.snd&&np>.15){drag.snd=true;sfx.draw()}
 if(G.sub==='online'&&performance.now()-lastSend>70){lastSend=performance.now();send({t:'aim',a:P.a,p:P.p})}}
function onUp(e){pdrag=null;if(!drag||e.pointerId!==drag.id)return;drag=null;const P=G.A[G.turn];if(!canAim())return;if(P.p>.12)fire(P.a,P.p,P.sel);else{P.p=0;if(G.sub==='online')send({t:'aim',a:P.a,p:0})}}
for(const c of[cv,glc]){c.addEventListener('pointerdown',onDown);c.addEventListener('pointermove',onMove);c.addEventListener('pointerup',onUp);c.addEventListener('pointercancel',onUp)}
$('emoteBtn').onclick=e=>{e.stopPropagation();const w=$('emoteWheel');w.style.display=w.style.display==='flex'?'none':'flex'};
$('emoteWheel').querySelectorAll('button').forEach(b=>b.onclick=e=>{e.stopPropagation();$('emoteWheel').style.display='none';let i=G.pi;if(G.sub==='local'&&G.A[G.turn].human)i=G.turn;if(G.sub==='online')i=G.me;emote(i,b.textContent);if(G.sub==='online')send({t:'emo',k:b.textContent})});

// ---------- REPLAY / CLIP ----------
let rec=null,recChunks=[],clipURL=null,clipBlob=null,DL=null;
try{if(window.claude&&claude.use)claude.use('downloads').then(d=>{DL=d}).catch(()=>{})}catch(e){}
function d2b(u){const[h,b]=u.split(',');const bin=atob(b);const a=new Uint8Array(bin.length);for(let i=0;i<bin.length;i++)a[i]=bin.charCodeAt(i);return new Blob([a],{type:h.slice(5).split(';')[0]})}
function dlHook(el,name,get){el.addEventListener('click',e=>{if(!DL)return;e.preventDefault();const d=get();if(!d)return;DL.save({filename:name,data:d}).then(()=>sfx.ui()).catch(()=>{})})}
function replayUI(on){$('replayTag').style.display=on?'flex':'none';if(G.cfg&&G.mode!=='demo'&&G.cfg.layout!=='range')$('hud').style.display=on?'none':($('pauseBtn').style.display==='flex'?'flex':'none');if(on){tagHide();say('Instant replay')}}
function clipStart(){try{const c=POSTON?glc:cv;if(!c.captureStream||!window.MediaRecorder)return;const st=c.captureStream(30);const mt=MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported('video/webm;codecs=vp9')?'video/webm;codecs=vp9':'video/webm';rec=new MediaRecorder(st,{mimeType:mt});recChunks=[];rec.ondataavailable=e=>{if(e.data&&e.data.size)recChunks.push(e.data)};rec.onstop=()=>{if(clipURL)URL.revokeObjectURL(clipURL);clipBlob=new Blob(recChunks,{type:'video/webm'});clipURL=URL.createObjectURL(clipBlob)};rec.start()}catch(e){rec=null}}
function clipStop(){try{if(rec&&rec.state!=='inactive')rec.stop()}catch(e){}rec=null}

// ---------- LOADOUTS ----------
const myLoad=()=>({out:OIDX(SV.eq.out),bow:SV.eq.bow,trail:SV.eq.trail,pose:SV.eq.pose,quiver:SV.eq.quiver.slice()});
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[a[i],a[j]]=[a[j],a[i]]}return a};
function cpuLoad(exclude){let o;do{o=Math.random()*OUT.length|0}while(o===exclude&&OUT.length>1);return{out:o,bow:shuffle(Object.keys(BOWS))[0],trail:'classic',pose:shuffle(Object.keys(POSES))[0],quiver:shuffle(SPECIALS).slice(0,3)}}
let usedNames=[];const cpuName=()=>{const n=shuffle(CUPNAMES).find(x=>!usedNames.includes(x))||'CPU';usedNames.push(n);return n};

// ---------- DEMO / MENU ----------
function startDemo(){const a=cpuLoad(),b=cpuLoad(a.out);startMatch({mode:'demo',sub:'cpu',layout:'duel',slots:[Object.assign(a,{human:false,diff:1,team:0,nm:'A'}),Object.assign(b,{human:false,diff:1,team:1,nm:'B'})],bo:9,elem:true,seed:Math.random()*1e9|0})}
function toMenu(){netClose();clipStop();setHud(false);hideAll();replayUI(false);startDemo();show('sMenu')}
function menuUpd(){const r=rankOf(SV.level);for(const id of['mRank','pRank']){$(id).textContent=SV.level;$(id).style.setProperty('--rc',r[1])}$('mRankN').textContent=r[0];$('mRankN').style.color=r[1];$('mLvl').textContent='LEVEL '+SV.level;
 $('mXp').style.width=(SV.xp/xpNeed(SV.level)*100)+'%';$('mCrowns').textContent=SV.crowns;$('mCamp').textContent=campCleared()+' / 8 chapters';
 $('mDaily').textContent=SV.daily.date===todayKey()&&SV.daily.done?'Daily done · streak '+SV.daily.streak:'New daily ready';
 const n=Object.keys(SV.ach).length;$('mProf').textContent=n+' / '+ACH.length+' · Tier '+seasonTier();const rd=msnReady().length;$('mBadge').style.display=rd?'block':'none';$('mBadge').textContent=rd;$('mMis').textContent=rd?rd+' ready to claim':'Daily · Weekly'}
document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>{sfx.ui();show(b.dataset.go)}));
// ---------- DARE ARCADE FULL GAME ----------
// Free tryout: VS CPU, 2 Player, practice, daily, missions, online duels, Campaign chapters 1-2 and Siege waves 1-5.
// Full game: Campaign chapters 3-8, Siege wave 6 and up, 2v2, free-for-all and the Crown Cup.
const FULL='long-shot',FREE_CH=2,FREE_WAVES=5;
const fullOwned=()=>!window.DARE||DARE.owned(FULL);
function needFull(title,then,onExit){if(fullOwned())return then();DARE.gate(FULL,()=>{paintLocks();then()},{title,exitLabel:'Not now',onExit:()=>{paintLocks();onExit&&onExit()}})}
function paintLocks(){const own=fullOwned();document.querySelectorAll('[data-act="team"],[data-act="ffa"],[data-act="cup"]').forEach(b=>b.classList.toggle('full',!own));
 const ps=$('pSiege');if(ps)ps.textContent=own?'Defend your tower against endless waves':'Waves 1 to 5 free · endless waves in the full game'}
function siegeLock(){if(G.mode!=='siege'||G.wave<FREE_WAVES||fullOwned())return false;G.state='gate';tagHide();
 DARE.gate(FULL,()=>{paintLocks();G.state='waveEnd';G.timer=0},{title:'You held the tower through wave '+FREE_WAVES,exitLabel:'End run',onExit:()=>{G.siegeEnd=1;G.state='over';G.timer=.8;G.matchWinner=1;banner('RUN COMPLETE','WAVE '+FREE_WAVES+' · SCORE '+G.score);musicMode(0)}});return true}
if(window.DARE){DARE.onChange(paintLocks);setTimeout(paintLocks,0)}
document.querySelectorAll('[data-act]').forEach(b=>b.addEventListener('click',()=>{ac();sfx.ui();const a=b.dataset.act;
 if(a==='team'||a==='ffa'||a==='cup'){const nm={team:'2v2 Teams',ffa:'Free-for-all',cup:'The Crown Cup'}[a];return needFull(nm+' is in the full game',()=>a==='cup'?openCup():openSetup(a))}
 if(a==='camp')openCamp();else if(a==='online')openOnline();else if(a==='armory')openArmory();else if(a==='chal')openChal();else if(a==='profile')openProfile('ach');else if(a==='settings')openSettings('sMenu');
 else if(a==='cup')openCup();else if(a==='missions')openMissions();else openSetup(a)}));

// ---------- PREVIEW CANVASES ----------
function regPrev(cnv,fn){PREVS=PREVS.filter(p=>p.cnv.isConnected&&p.cnv!==cnv);PREVS.push({cnv,fn})}
function renderPrevs(){for(const p of PREVS){const s=p.cnv.closest('.scr');if(!s||!s.classList.contains('on'))continue;p.fn(p.cnv)}}

// ---------- SETUP ----------
const SETUP={kind:'duel-cpu',diff:1,bo:3,elem:1,ffaN:4,slots:[]};
function seg(el,val,cb){el.innerHTML=el.innerHTML;el.querySelectorAll('button').forEach(b=>{b.classList.toggle('on',b.dataset.v==String(val));b.onclick=()=>{el.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));sfx.ui();cb(b.dataset.v)}})}
function mkSeg(opts,val,cb){const d=document.createElement('div');d.className='seg';d.innerHTML=opts.map(o=>`<button data-v="${o[0]}">${o[1]}</button>`).join('');seg(d,val,cb);return d}
function lbl(t){const d=document.createElement('div');d.className='optl';d.textContent=t;return d}
function mkPicker(who,getI,setI,d){const el=document.createElement('div');el.className='pick';el.innerHTML=`<div class="who">${who}</div><canvas width="420" height="280"></canvas><div class="lock"></div><div class="on"></div><div class="ab"></div><div class="dots">${OUT.map(()=>'<i></i>').join('')}</div><button class="ar l">‹</button><button class="ar r">›</button>`;
 const ref=()=>{const o=OUT[getI()],own=isOwned('out',o.id);el.querySelector('.on').textContent=o.n;el.querySelector('.on').style.color=o.light==='#ffffff'?o.trim:o.light;el.querySelector('.ab').innerHTML=`<b>${o.ab.n}</b> · ${o.ab.d}`;el.classList.toggle('locked',!own);el.querySelector('.lock').textContent='🔒 '+reqText('out',o.id);
  [...el.querySelectorAll('.dots i')].forEach((x,i)=>{x.classList.toggle('on',i===getI());x.classList.toggle('lk',!isOwned('out',OUT[i].id))});startOk()};
 const step=s=>{setI((getI()+s+OUT.length)%OUT.length);sfx.ui();ref()};el.querySelector('.l').onclick=()=>step(-1);el.querySelector('.r').onclick=()=>step(1);
 regPrev(el.querySelector('canvas'),c=>figureTo(c,getI(),d,2.1,262,true,{bow:d>0&&who!=='PLAYER 2'?SV.eq.bow:'oak'}));ref();return el}
function startOk(){const two=SETUP.kind==='duel-local'||(SETUP.kind==='siege'&&(SETUP.siegeN||1)>1);const bad=!isOwned('out',SV.eq.out)||(two&&!isOwned('out',SV.p2));$('bStart').disabled=bad}
function quiverChips(){const d=document.createElement('div');d.className='mini';d.innerHTML=SV.eq.quiver.map(k=>`<span class="chip" style="color:${KC(k)}">${ARW[k].n}</span>`).join('')+'<button class="chip" id="qEdit">EDIT</button>';d.querySelector('#qEdit').onclick=()=>openArmory('quiver','sSetup');return d}
function openSetup(kind){SETUP.kind=kind;const body=$('setupBody');body.innerHTML='';usedNames=[];
 $('setupT').textContent={'duel-cpu':'VS CPU','duel-local':'2 PLAYER DUEL','team':'2V2 TEAMS','ffa':'FREE-FOR-ALL','siege':'SIEGE'}[kind];
 if(kind==='siege'){$('bStart').textContent='DEFEND THE TOWER';body.appendChild(lbl('DEFENDERS'));body.appendChild(mkSeg([[1,'SOLO'],[2,'CO-OP · 2 PLAYERS']],SETUP.siegeN||1,v=>{SETUP.siegeN=+v;openSetup('siege')}));const pk=document.createElement('div');pk.className='pickers';pk.appendChild(mkPicker((SETUP.siegeN||1)>1?'PLAYER 1':'YOU',()=>OIDX(SV.eq.out),i=>{SV.eq.out=OUT[i].id;save()},1));if((SETUP.siegeN||1)>1)pk.appendChild(mkPicker('PLAYER 2',()=>OIDX(SV.p2),i=>{SV.p2=OUT[i].id;save()},1));body.appendChild(pk);body.appendChild(quiverChips());const n=document.createElement('div');n.className='note small';n.textContent='Waves of raiders attack from the right. Every 5th wave brings a Warlord. Clear a wave to repair the tower and refill your quiver. Best: wave '+(SV.siege.best||0)+' · '+(SV.siege.score||0)+' pts';body.appendChild(n);show('sSetup');startOk();return}
 $('bStart').textContent=kind==='team'?'START 2V2':kind==='ffa'?'START BRAWL':'START DUEL';
 if(kind==='duel-cpu'||kind==='duel-local'){const pk=document.createElement('div');pk.className='pickers';
  pk.appendChild(mkPicker(kind==='duel-cpu'?'YOU':'PLAYER 1',()=>OIDX(SV.eq.out),i=>{SV.eq.out=OUT[i].id;save()},1));
  if(kind==='duel-local')pk.appendChild(mkPicker('PLAYER 2',()=>OIDX(SV.p2),i=>{SV.p2=OUT[i].id;save()},-1));body.appendChild(pk);body.appendChild(quiverChips())}
 else{if(kind==='ffa'){body.appendChild(lbl('ARCHERS'));body.appendChild(mkSeg([[3,'3 ARCHERS'],[4,'4 ARCHERS']],SETUP.ffaN,v=>{SETUP.ffaN=+v;buildSlots()}))}
  const sl=document.createElement('div');sl.className='slots';sl.id='slotList';body.appendChild(sl);buildSlots()}
 if(kind!=='duel-local'){body.appendChild(lbl('CPU SKILL'));body.appendChild(mkSeg([[0,'ROOKIE'],[1,'MARKSMAN'],[2,'LEGEND']],SETUP.diff,v=>SETUP.diff=+v))}
 body.appendChild(lbl('MATCH'));body.appendChild(mkSeg([[1,'1 ROUND'],[3,'BEST OF 3'],[5,'BEST OF 5']],SETUP.bo,v=>SETUP.bo=+v));
 body.appendChild(lbl('ELEMENTAL ARROWS'));body.appendChild(mkSeg([[1,'ON'],[0,'OFF']],SETUP.elem,v=>SETUP.elem=+v));
 show('sSetup');startOk()}
function buildSlots(){const n=SETUP.kind==='team'?4:SETUP.ffaN;const sl=$('slotList');if(!sl)return;sl.innerHTML='';
 const labels=SETUP.kind==='team'?['YOU','ALLY','RIVAL','RIVAL']:['YOU','ARCHER 2','ARCHER 3','ARCHER 4'];const teams=SETUP.kind==='team'?[0,0,1,1]:[0,1,2,3];
 while(SETUP.slots.length<4)SETUP.slots.push({human:false,out:Math.random()*OUT.length|0});SETUP.slots[0].human=true;SETUP.slots[0].out=OIDX(SV.eq.out);
 for(let k=0;k<n;k++){const s=SETUP.slots[k];const row=document.createElement('div');row.className='slot';row.innerHTML=`<div class="tm" style="background:${TEAMC(teams[k])}"></div><canvas width="96" height="96"></canvas><div class="sn"><b>${OUT[s.out].n}</b><span>${labels[k]}${k?' · TAP ARCHER TO CHANGE':''}</span></div>${k?`<button class="${s.human?'hum':''}">${s.human?'HUMAN':'CPU'}</button>`:''}`;
  sl.appendChild(row);const cnv=row.querySelector('canvas');drawAvatar(cnv,s.out,1);
  if(k){cnv.onclick=()=>{s.out=(s.out+1)%OUT.length;sfx.ui();buildSlots()};row.querySelector('button').onclick=()=>{s.human=!s.human;sfx.ui();buildSlots()}}
  else cnv.onclick=()=>openArmory('out','sSetup')}}
$('bStart').onclick=()=>{ac();const k=SETUP.kind,L=myLoad();let cfg;usedNames=[];
 if(k==='siege'){const n=SETUP.siegeN||1;const slots=[Object.assign(L,{human:true,nm:n>1?'PLAYER 1':'YOU',team:0})];if(n>1)slots.push({out:OIDX(SV.p2),bow:'oak',trail:'classic',pose:'raise',quiver:SV.eq.quiver.slice(),human:true,nm:'PLAYER 2',team:0});startMatch({mode:'siege',sub:n>1?'local':'cpu',layout:'siege',slots,bo:1,elem:true,seed:Math.random()*1e9|0,pi:0,me:0});G.score=0;scoreUpd();return}
 if(k==='duel-cpu'){const c=cpuLoad(L.out);cfg={mode:'versus',sub:'cpu',layout:'duel',slots:[Object.assign(L,{human:true,nm:'YOU',team:0}),Object.assign(c,{human:false,diff:SETUP.diff,nm:cpuName(),team:1})]}}
 else if(k==='duel-local'){cfg={mode:'versus',sub:'local',layout:'duel',slots:[Object.assign(L,{human:true,nm:'PLAYER 1',team:0}),{out:OIDX(SV.p2),bow:'oak',trail:'classic',pose:'raise',quiver:SV.eq.quiver.slice(),human:true,nm:'PLAYER 2',team:1}]}}
 else{const n=k==='team'?4:SETUP.ffaN;const teams=k==='team'?[0,0,1,1]:[0,1,2,3];let hn=1;
  // team order in-engine: [you(t0), rival(t1), ally(t0), rival(t1)]
  const ord=k==='team'?[0,2,1,3]:[0,1,2,3].slice(0,n);const slots=ord.map(si=>{const s=SETUP.slots[si];if(si===0)return Object.assign(myLoad(),{human:true,nm:'YOU',team:0});const c=cpuLoad();c.out=s.out;return Object.assign(c,{human:s.human,diff:SETUP.diff,team:teams[si],nm:s.human?'PLAYER '+(++hn):cpuName()})});
  cfg={mode:'versus',sub:slots.filter(s=>s.human).length>1?'local':'cpu',layout:k==='team'?'team':'ffa',slots}}
 cfg.bo=SETUP.bo;cfg.elem=!!SETUP.elem;cfg.seed=Math.random()*1e9|0;cfg.pi=0;cfg.me=0;cfg.kind=k;startMatch(cfg)};

// ---------- CAMPAIGN ----------
function openCamp(){const L=$('campList');L.innerHTML='';$('campStars').textContent=campStars()+' / 24 STARS';
 CAMP.forEach((c,k)=>{const un=k===0||SV.camp[k-1]>0;const st=SV.camp[k]||0;const b=document.createElement('button');b.className='citem'+(un?'':' lk');
  b.innerHTML=`<div class="num">${k+1}</div><div><b>${c.n}</b><span>${un?'VS '+c.boss+' · '+BIOMES[c.b].name.split(' · ')[0]+(k>=FREE_CH&&!fullOwned()?' · FULL GAME':''):'Clear chapter '+k+' to unlock'}</span></div><div class="stars">${'★'.repeat(st)}${'☆'.repeat(3-st)}</div>`;
  if(un)b.onclick=()=>{sfx.ui();openStory(k)};L.appendChild(b)});show('sCamp')}
let campSel=0;
function openStory(k){if(k>=FREE_CH&&!fullOwned())return needFull('Chapter '+(k+1)+' is in the full game',()=>openStory(k),()=>openCamp());campSel=k;const c=CAMP[k];$('storyCh').textContent='CHAPTER '+(k+1)+' · '+BIOMES[c.b].name;$('storyT').textContent=c.n;$('storyBossN').textContent=c.boss;$('storyTxt').textContent=c.story;
 const m=[];if(c.mods.wind)m.push('Heavy wind');if(c.mods.noGuide)m.push('No aim guide');if(c.mods.wall)m.push('Breakable wall');if(c.mods.plat)m.push('Moving platform');if(c.mods.bossHp)m.push('Boss has '+c.mods.bossHp+' HP');if(c.mods.bossQ)m.push('Boss quiver: '+c.mods.bossQ.map(x=>ARW[x].n).join(', '));m.push(c.bo===1?'Single round':'Best of '+c.bo);m.push(['Rookie','Marksman','Legend'][c.diff]+' AI');
 $('storyMods').textContent=m.join(' · ');regPrev($('storyBoss'),cv2=>figureTo(cv2,c.o,-1,2.1,262,true,{bow:k>=6?'gold':'ebony'}));show('sStory')}
$('bFight').onclick=()=>{ac();const k=campSel,c=CAMP[k];const L=myLoad();
 startMatch({mode:'camp',sub:'cpu',layout:'duel',slots:[Object.assign(L,{human:true,nm:'YOU',team:0}),{out:c.o,human:false,diff:c.diff,nm:c.boss,quiver:c.mods.bossQ||['fire','ice','bolt'],bow:k>=6?'gold':'ebony',trail:'ember',pose:'flex',team:1,boss:true,hp:c.mods.bossHp||100}],bo:c.bo,elem:true,seed:Math.random()*1e9|0,biome:c.b,mods:Object.assign({},c.mods),pi:0,me:0,camp:k})};

// ---------- CUP ----------
let CUP=null;
function newCup(){usedNames=[];const me={nm:'YOU',out:OIDX(SV.eq.out),me:true};const ent=[me];for(let k=0;k<7;k++){ent.push({nm:cpuName(),out:Math.random()*OUT.length|0})}CUP={stage:0,ent,qf:[[0,1],[2,3],[4,5],[6,7]],sf:null,f:null,w:{}}}
function cupOpp(){const st=CUP.stage;const pairs=st===0?CUP.qf:st===1?CUP.sf:[CUP.f];const p=pairs.find(p=>p.includes(0));return p[0]===0?p[1]:p[0]}
function cupAdvance(){const st=CUP.stage;const rnd=st===0?CUP.qf:st===1?CUP.sf:[CUP.f];const winners=rnd.map(p=>p.includes(0)?0:(Math.random()<.5?p[0]:p[1]));rnd.forEach((p,k)=>CUP.w[st+':'+k]=winners[k]);
 if(st===0)CUP.sf=[[winners[0],winners[1]],[winners[2],winners[3]]];if(st===1)CUP.f=[winners[0],winners[1]];CUP.stage++}
function openCup(){if(!CUP)newCup();const E=CUP.ent;const mt=(p,st,k)=>{const w=CUP.w[st+':'+k];return`<div class="mt">${p.map(i=>`<div class="${w==null?'':w===i?'w':'l'} ${i===0?'me':''}"><span>${E[i].nm}</span></div>`).join('')}</div>`};
 const col=(lbl2,pairs,st,n)=>`<div class="rnd"><div class="rl">${lbl2}</div><div class="ms">${pairs?pairs.map((p,k)=>mt(p,st,k)).join(''):'<div class="mt"><div>TBD</div><div>TBD</div></div>'.repeat(n)}</div></div>`;
 $('cupBracket').innerHTML=col('QUARTERS',CUP.qf,0,4)+col('SEMIS',CUP.sf,1,2)+col('FINAL',CUP.f?[CUP.f]:null,2,1);
 $('bCup').textContent=['QUARTERFINAL','SEMIFINAL','THE FINAL'][CUP.stage]+' · '+['ROOKIE','MARKSMAN','LEGEND'][CUP.stage];show('sCup')}
$('bCup').onclick=()=>{ac();const o=CUP.ent[cupOpp()];const c=cpuLoad();c.out=o.out;
 startMatch({mode:'cup',sub:'cpu',layout:'duel',slots:[Object.assign(myLoad(),{human:true,nm:'YOU',team:0}),Object.assign(c,{human:false,diff:CUP.stage,nm:o.nm,team:1})],bo:CUP.stage===0?1:3,elem:true,seed:Math.random()*1e9|0,pi:0,me:0})};

// ---------- CHALLENGES ----------
function openChal(){const done=SV.daily.date===todayKey()&&SV.daily.done;$('dTitle').textContent=BIOMES[BKEYS[strHash(todayKey())%BKEYS.length]].name.split(' · ')[0];
 $('dInfo').textContent=`8 arrows · 5 targets, some moving · same layout for everyone today. ${done?'Today’s best: '+SV.daily.best+' · Streak '+SV.daily.streak:'Streak: '+(SV.daily.streak||0)+' · Rewards: 100+ XP, 30 crowns'}`;$('bDaily').textContent=done?'PLAY AGAIN':'PLAY DAILY';show('sChal')}
$('bDaily').onclick=()=>{ac();const k=todayKey();startMatch({mode:'daily',sub:'cpu',layout:'range',slots:[Object.assign(myLoad(),{human:true,nm:'YOU',team:0,quiver:[]})],bo:1,elem:false,seed:strHash(k),biome:BKEYS[strHash(k)%BKEYS.length],mods:{clear:1},pi:0});G.arrowsLeft=8;scoreUpd()};
$('bPractice').onclick=()=>{ac();G.practiceWind=0;startMatch({mode:'practice',sub:'cpu',layout:'range',slots:[Object.assign(myLoad(),{human:true,nm:'YOU',team:0})],bo:1,elem:true,seed:Math.random()*1e9|0,mods:{clear:1},pi:0})};
function dailyOver(){const first=!(SV.daily.date===todayKey()&&SV.daily.done);const sc=G.score;let R=null;
 if(first){const y=new Date(Date.now()-864e5);const yk=y.getFullYear()+'-'+(y.getMonth()+1)+'-'+y.getDate();SV.daily.streak=SV.daily.last===yk?SV.daily.streak+1:1;SV.daily.last=todayKey();SV.daily.date=todayKey();SV.daily.done=true;SV.daily.best=sc;
  SV.stats.dailies=(SV.stats.dailies||0)+1;SV.stats.bulls=(SV.stats.bulls||0)+(G.ms[0].bulls||0);const before=ownedSnapshot();R=applyXp(100+Math.round(sc/10),30,before)}
 else{SV.daily.best=Math.max(SV.daily.best,sc);SV.stats.bulls=(SV.stats.bulls||0)+(G.ms[0].bulls||0);save()}
 const best=SV.daily.best;addStat('perfects',G.ms[0].perfects||0);showResults({title:sc>=best&&first?'NEW BEST':'RANGE CLEAR',sub:'SCORE '+sc,stats:[[sc,'SCORE'],[best,'TODAY BEST'],[SV.daily.streak,'STREAK'],[G.ms[0].bulls,'BULLSEYES'],[G.ms[0].shots,'ARROWS'],[G.ms[0].shots?Math.round(G.ms[0].bulls/G.ms[0].shots*100)+'%':'0%','BULL RATE']],R,next:'PLAY AGAIN',nextFn:()=>$('bDaily').onclick()})}

// ---------- RESULTS ----------
function addStat(k,n){if(n)SV.stats[k]=(SV.stats[k]||0)+n}
function ownedSnapshot(){const s=[];OUT.forEach(o=>{if(isOwned('out',o.id))s.push('out:'+o.id)});for(const[c,set]of[['bow',BOWS],['trail',TRAILS],['pose',POSES]])for(const id in set)if(isOwned(c,id))s.push(c+':'+id);return s}
function checkAch(){const out=[];SV.stats.camp=campCleared();SV.stats.stars=campStars();SV.stats.level=SV.level;SV.stats.cups=SV.cups;for(const a of ACH){if(SV.ach[a.id])continue;if((SV.stats[a.stat]||0)>=a.goal){SV.ach[a.id]=1;SV.crowns+=a.cr;out.push(a)}}return out}
function applyXp(xp,cr,before){const lv0=SV.level,f0=SV.xp/xpNeed(SV.level);SV.xp+=xp;SV.crowns+=cr;const t0=seasonTier();SV.sxp+=xp;
 while(SV.xp>=xpNeed(SV.level)){SV.xp-=xpNeed(SV.level);SV.level++}
 const t1=seasonTier(),tiers=[];for(let t=t0+1;t<=t1;t++){if(!SV.claimed.includes(t)){SV.claimed.push(t);const rw=SEASON.tiers[t-1];if(rw[0]==='crowns')SV.crowns+=rw[1];tiers.push(t)}}
 const achs=checkAch();const items=ownedSnapshot().filter(x=>!before.includes(x));save();return{xp,cr,lv0,lv1:SV.level,f0,f1:SV.xp/xpNeed(SV.level),tiers,achs,items}}
function grantRewards(won){const ms=G.ms[G.pi],me=G.A[G.pi];const before=ownedSnapshot();
 let xp=(won?150:60)+ms.hits*20+ms.heads*40+ms.kos*30+ms.longs*30+ms.perfect*40,cr=(won?40:15)+ms.heads*5+ms.kos*5;
 const legend=G.A.some(a=>a.team!==me.team&&!a.human&&a.diff===2);if(won&&legend){xp+=60;cr+=20}if(G.mode==='camp'&&won){xp+=100;cr+=50}
 addStat('matches',1);if(won)addStat('wins',1);['hits','heads','kos','longs','killcams','burns','freezes','zaps','splits','venoms','seeks','blocks','walls','perfect','comebacks','selfzap','perfects'].forEach(k=>addStat(k,ms[k]||0));
 ms.biomes.forEach(b=>addStat('bw_'+b,1));if(won){addStat('aw_'+OUT[me.out].id,1);if(legend)addStat('legend',1);if(G.cfg.layout==='team')addStat('teamw',1);if(G.cfg.layout==='ffa')addStat('ffaw',1);if(G.sub==='online')addStat('onlinew',1)}
 return applyXp(xp,cr,before)}
function matchOver(){clipStop();if(G.cfg.layout==='siege')return siegeOver();const me=G.A[G.pi];const won=G.matchWinner===me.team;const n=teamName(G.matchWinner);let next='REMATCH',nextFn=()=>startMatch(Object.assign({},G.cfg,{seed:Math.random()*1e9|0})),bonus=null;
 if(G.mode==='camp'){const k=G.cfg.camp;if(won){const stars=1+(G.wins[1]===0?1:0)+(me.hp>=50?1:0);SV.camp[k]=Math.max(SV.camp[k]||0,stars);bonus=stars}next=won?(k<7?'NEXT CHAPTER':'CAMPAIGN COMPLETE'):'RETRY';nextFn=won?(k<7?()=>openStory(k+1):()=>openCamp()):()=>openStory(k)}
 if(G.mode==='cup'){if(won){cupAdvance();if(CUP.stage>=3){SV.cups++;SV.crowns+=300;bonus='cup';next='NEW CUP';CUP=null;nextFn=()=>openCup()}else{next=['','PLAY SEMIFINAL','PLAY THE FINAL'][CUP.stage];nextFn=()=>openCup()}}else{CUP=null;next='NEW CUP';nextFn=()=>openCup()}}
 if(G.sub==='online'){next=G.me===1?'ASK FOR REMATCH':'REMATCH';nextFn=()=>{if(G.me===0)hostStart();else{send({t:'rematch'});$('bNext').textContent='WAITING…'}}}
 const R=grantRewards(won);const ms=G.ms[G.pi];const acc=ms.shots?Math.round(ms.hits/ms.shots*100):0;
 let title=G.sub==='local'&&G.mode==='versus'?n+' WINS':won?'VICTORY':'DEFEAT';if(bonus==='cup')title='CHAMPION';
 showResults({title,sub:scoreLine()+(typeof bonus==='number'?'  ·  '+'★'.repeat(bonus)+'☆'.repeat(3-bonus):''),stats:[[ms.shots,'SHOTS'],[ms.hits,'HITS'],[acc+'%','ACCURACY'],[ms.heads,'HEADSHOTS'],[ms.dmg,'DAMAGE'],[ms.kos,'KNOCKOUTS']],R,next,nextFn})}
function showResults(o){setHud(false);replayUI(false);$('overTitle').innerHTML='<span class="lt">'+o.title+'</span>';$('overSub').textContent=o.sub;$('stats').innerHTML=o.stats.map(x=>`<div><b>${x[0]}</b><span>${x[1]}</span></div>`).join('');
 const R=o.R,ul=$('unlocks');ul.innerHTML='';
 if(R){$('xpBox').style.display='';$('xpLvl').textContent='LEVEL '+R.lv1;$('xpGain').textContent='+'+R.xp+' XP';$('crGain').textContent='+'+R.cr+' CROWNS';const f=$('xpFill');f.style.transition='none';f.style.width=(R.f0*100)+'%';void f.offsetWidth;f.style.transition='';
  setTimeout(()=>{f.style.width=R.lv1>R.lv0?'100%':(R.f1*100)+'%';if(R.lv1>R.lv0)setTimeout(()=>{f.style.transition='none';f.style.width='0';void f.offsetWidth;f.style.transition='';f.style.width=(R.f1*100)+'%'},1300)},250);
  const add=(tag,txt)=>{const d=document.createElement('div');d.className='unl';d.innerHTML=`<em>${tag}</em>${txt}`;ul.appendChild(d)};
  if(R.lv1>R.lv0){add('LEVEL UP','Level '+R.lv1+' · '+rankOf(R.lv1)[0]);toast('LEVEL '+R.lv1,rankOf(R.lv1)[0]+' RANK')}
  R.tiers.forEach(t=>{const rw=SEASON.tiers[t-1];add('SEASON '+t,rw[0]==='crowns'?rw[1]+' crowns':'New '+rw[0]+': '+itemCat(rw[0])[rw[1]].n)});
  R.items.forEach(x=>{const[c,id]=x.split(':');add('UNLOCKED',c==='out'?OUT[OIDX(id)].n:itemCat(c)[id].n)});
  R.achs.forEach(a=>{add('ACHIEVEMENT',a.n+' · +'+a.cr);toast(a.n,a.d+' · +'+a.cr+' crowns')})}
 else $('xpBox').style.display='none';
 const nb=$('bNext');nb.textContent=o.next;nb.onclick=()=>{ac();sfx.ui();o.nextFn()};
 const cl=$('bClip');if(clipURL&&G.mode!=='daily'){cl.style.display='block';cl.href=clipURL}else cl.style.display='none';
 show('sOver');musicMode(0);setTimeout(msnNotify,600)}
$('bMenu').onclick=toMenu;$('bMsgOk').onclick=toMenu;

// ---------- PAUSE / PHOTO ----------
let pausedFrom=null;
$('pauseBtn').onclick=e=>{e.stopPropagation();if(G.state==='paused'||G.state==='photo')return;pausedFrom=G.state;if(G.sub!=='online')G.state='paused';show('sPause')};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&G.cfg&&G.mode!=='demo'&&G.sub!=='online'&&!['paused','photo','done','gate','boot'].includes(G.state)&&$('pauseBtn').style.display==='flex')$('pauseBtn').click()});
$('bResume').onclick=()=>{hideAll();if(G.state==='paused')G.state=pausedFrom};
$('bQuit').onclick=toMenu;
$('bPauseSet').onclick=()=>openSettings('sPause');
$('bPhoto').onclick=()=>{hideAll();G.photoPrev=pausedFrom;G.state='photo';setHud(false);$('photoUI').style.display='flex';$('phZoom').value=G.cam.z/zBase();sfx.ui()};
$('phZoom').oninput=e=>{G.cam.z=zBase()*(+e.target.value)};
$('photoUI').querySelectorAll('.phtop button').forEach(b=>b.onclick=()=>{photoFilter=b.dataset.f;$('photoUI').querySelectorAll('.phtop button').forEach(x=>x.classList.toggle('on',x===b));cv.style.filter=POSTON?'':({none:'',noir:'grayscale(1) contrast(1.2)',gold:'sepia(.45) saturate(1.3)',vintage:'sepia(.7) contrast(.9)',vivid:'saturate(1.6)'}[photoFilter])});
$('phExit').onclick=()=>{$('photoUI').style.display='none';photoFilter='none';cv.style.filter='';G.state=G.photoPrev==='paused'?'aim':G.photoPrev;if(G.sub==='online'||G.mode!=='demo')setHud(true);if(G.state==='aim'&&G.mode!=='demo')tagTurn()};
$('phSnap').onclick=()=>{render();if(POSTON)postFrame(cv,postParams());let url='';try{url=(POSTON?glc:cv).toDataURL('image/png')}catch(e){}if(!url)return;$('phImg').src=url;$('phSave').href=url;$('photoOut').style.display='flex';sfx.ui();addStat('photos',1);const a=checkAch();save();a.forEach(x=>toast(x.n,x.d))};
dlHook($('bClip'),'long-shot-ko.webm',()=>clipBlob);dlHook($('phSave'),'long-shot-photo.png',()=>{const s=$('phImg').src;return s?d2b(s):null});
$('phClose').onclick=()=>{$('photoOut').style.display='none'};

// ---------- SETTINGS ----------
let setBack='sMenu';
function openSettings(back){setBack=back;seg($('setGfx'),SV.set.gfx,v=>setGfx(v));
 const sl=(id,k,lab)=>{const el=$(id);el.value=SV.set[k];const upd=()=>{$(lab).textContent=k==='sens'?(+SV.set[k]).toFixed(2)+'×':Math.round(SV.set[k]*100)+'%'};upd();el.oninput=()=>{SV.set[k]=+el.value;upd();applyVol();save()}};
 sl('setMus','music','vMus');sl('setSfx','sfx','vSfx');sl('setSens','sens','vSens');
 document.querySelectorAll('.tg button').forEach(b=>{const k=b.dataset.k;const on=()=>k==='replay'?SV.set.replay!==false:!!SV.set[k];b.classList.toggle('on',on());b.onclick=()=>{SV.set[k]=!on();b.classList.toggle('on',on());applyVol();applyLefty();save();sfx.ui();if(k==='cb'&&G.cfg)hudUpd()}});show('sSettings')}
$('bSetBack').onclick=()=>{sfx.ui();show(setBack)};
function applyLefty(){document.body.classList.toggle('lefty',!!SV.set.lefty)}

// ---------- ARMORY ----------
const ARM={tab:'out',sel:null,back:'sMenu'};
function openArmory(tab,back){ARM.back=back||(onScreen('sOnline')?'sOnline':'sMenu');ARM.tab=tab||'out';ARM.sel=null;armRender();show('sArmory')}
$('bArmBack').onclick=()=>{sfx.ui();if(ARM.back==='sSetup')openSetup(SETUP.kind);else if(ARM.back==='sOnline')openOnline();else show(ARM.back)};
$('armTabs').querySelectorAll('button').forEach(b=>b.onclick=()=>{ARM.tab=b.dataset.t;ARM.sel=null;sfx.ui();armRender()});
function armRender(){const t=ARM.tab;$('aCrowns').textContent=SV.crowns;$('armTabs').querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));const g=$('armGrid');g.innerHTML='';
 let items;if(t==='out')items=OUT.map(o=>[o.id,o.n,`<div class="sw" style="background:linear-gradient(135deg,${o.light},${o.main} 50%,${o.dark})"></div>`]);
 else if(t==='quiver')items=SPECIALS.map(k=>[k,ARW[k].n,`<div class="sw" style="color:${KC(k)};background:rgba(255,255,255,.08)">${ICON[k]}</div>`]);
 else{const set=itemCat(t);items=Object.keys(set).map(id=>[id,set[id].n,t==='bow'?`<div class="sw" style="background:linear-gradient(135deg,${set[id].c[1]},${set[id].c[0]})"></div>`:t==='trail'?`<div class="sw" style="background:${id==='prism'?'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)':TRC[id]?'rgb('+TRC[id]+')':'#fff'}"></div>`:`<div class="sw" style="background:rgba(255,255,255,.1)">${ICON.std}</div>`])}
 const eqv=t==='quiver'?null:SV.eq[t];if(!ARM.sel)ARM.sel=t==='quiver'?SV.eq.quiver[0]:eqv;
 for(const[id,n,sw]of items){const own=t==='quiver'?true:isOwned(t,id);const d=document.createElement('button');d.className='gi'+(ARM.sel===id?' sel':'')+((t==='quiver'?SV.eq.quiver.includes(id):eqv===id)?' eq':'')+(own?'':' lk');
  d.innerHTML=`${sw}<b>${n}</b><small>${own?(t==='quiver'?(SV.eq.quiver.includes(id)?'IN QUIVER':'TAP TO ADD'):'OWNED'):reqText(t,id)}</small>`;
  d.onclick=()=>{ARM.sel=id;sfx.ui();if(t==='quiver'){const q=SV.eq.quiver;if(q.includes(id)){if(q.length>1)q.splice(q.indexOf(id),1)}else{if(q.length>=3)q.shift();q.push(id)}save()}armRender()};g.appendChild(d)}
 const id=ARM.sel,act=$('armAct');let nm,desc;
 if(t==='out'){const o=OUT[OIDX(id)];nm=o.n;desc=`${o.ab.n}: ${o.ab.d}.`}else if(t==='quiver'){nm=ARW[id].n+' ARROW';desc=ARW[id].d+` Quiver: ${SV.eq.quiver.map(k=>ARW[k].n).join(' · ')} (${SV.eq.quiver.length}/3).`}else{const it=itemCat(t)[id];nm=it.n;desc={bow:'Bow skin. Cosmetic only.',trail:'Arrow trail effect for your steel arrows.',pose:'Victory pose and taunt.'}[t]}
 $('armName').textContent=nm;$('armDesc').textContent=desc;
 if(t==='quiver'){act.style.display='none'}else{act.style.display='';const own=isOwned(t,id),r=reqOf(t,id),eq=SV.eq[t]===id;act.disabled=false;
  if(eq){act.textContent='EQUIPPED';act.disabled=true}else if(own){act.textContent='EQUIP';act.onclick=()=>{SV.eq[t]=id;save();sfx.ui();armRender()}}
  else if(r.price){act.textContent='BUY · '+r.price+' CROWNS';act.disabled=SV.crowns<r.price;act.onclick=()=>{if(SV.crowns<r.price)return;SV.crowns-=r.price;SV.own[t].push(id);SV.eq[t]=id;save();sfx.buy();toast('UNLOCKED',nm);armRender()}}
  else{act.textContent='LOCKED · '+reqText(t,id);act.disabled=true}}
 regPrev($('armPrev'),c=>{const t2=ARM.tab,s=ARM.sel;if(t2==='out')figureTo(c,OIDX(s),1,2.1,262,true,{bow:SV.eq.bow});else if(t2==='bow')figureTo(c,OIDX(SV.eq.out),1,2.1,262,true,{bow:s});else if(t2==='pose')figureTo(c,OIDX(SV.eq.out),1,2.1,262,false,{vic:1,pose:s,bow:SV.eq.bow});
  else if(t2==='trail'){figureTo(c,OIDX(SV.eq.out),1,2.1,262,true,{bow:SV.eq.bow});const cc=c.getContext('2d');cc.setTransform(1,0,0,1,0,0);const rgb=TRC[s];for(let k=0;k<26;k++){const x=230+k*7,y=120-Math.sin(k*.12)*40+((G.t*60)%14);cc.fillStyle=rgb?`rgba(${rgb},${k/26})`:`hsla(${(k*14+G.t*300)%360},100%,65%,${k/26})`;cc.beginPath();cc.arc(x,y,2+k*.12,0,7);cc.fill()}}
  else figureTo(c,OIDX(SV.eq.out),1,2.1,262,true,{bow:SV.eq.bow,sel:s})})}

// ---------- PROFILE ----------
function openProfile(tab){const r=rankOf(SV.level);$('pRankN').textContent=r[0];$('pRankN').style.color=r[1];$('pLvl').textContent=`LEVEL ${SV.level} · ${SV.xp} / ${xpNeed(SV.level)} XP · ${SV.crowns} CROWNS`;$('pXp').style.width=(SV.xp/xpNeed(SV.level)*100)+'%';menuUpd();
 $('profTabs').querySelectorAll('button').forEach(b=>{b.classList.toggle('on',b.dataset.t===tab);b.onclick=()=>{sfx.ui();openProfile(b.dataset.t)}});const B_=$('profBody');B_.innerHTML='';checkAch();save();
 if(tab==='ach'){const done=ACH.filter(a=>SV.ach[a.id]).length;const h=document.createElement('div');h.className='kick';h.textContent=done+' OF '+ACH.length+' UNLOCKED';B_.appendChild(h);
  ACH.slice().sort((a,b)=>(SV.ach[b.id]?1:0)-(SV.ach[a.id]?1:0)).forEach(a=>{const v=Math.min(a.goal,SV.stats[a.stat]||0);const d=document.createElement('div');d.className='ach'+(SV.ach[a.id]?' done':'');
   d.innerHTML=`<div class="ai"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M12 2l2.6 6.3L21 9l-5 4.4L17.5 20 12 16.5 6.5 20 8 13.4 3 9l6.4-.7z"/></svg></div><div class="ad"><b>${a.n}</b><span>${a.d}${SV.ach[a.id]?'':' · '+v+' / '+a.goal}</span>${SV.ach[a.id]?'':`<div class="xpbar"><i style="width:${v/a.goal*100}%"></i></div>`}</div><div class="cr">+${a.cr}</div>`;B_.appendChild(d)})}
 else if(tab==='season'){const cur=seasonTier();const h=document.createElement('div');h.className='kick';h.textContent=SEASON.n+' · TIER '+cur+' / 30 · '+(SV.sxp%SEASON.tierXp)+' / '+SEASON.tierXp+' XP TO NEXT';B_.appendChild(h);
  SEASON.tiers.forEach((rw,k)=>{const t=k+1;const d=document.createElement('div');d.className='tier'+(t<=cur?' got':'')+(t===cur+1?' cur':'');const txt=rw[0]==='crowns'?rw[1]+' CROWNS':(rw[0]==='bow'?'BOW: ':rw[0]==='trail'?'TRAIL: ':'POSE: ')+itemCat(rw[0])[rw[1]].n;d.innerHTML=`<div class="tn">${t}</div><b>${txt}</b><span>${t<=cur?'CLAIMED':t===cur+1?'NEXT':''}</span>`;B_.appendChild(d)})}
 else{const S=SV.stats;const rows=[[S.matches||0,'MATCHES'],[S.wins||0,'WINS'],[(S.matches?Math.round((S.wins||0)/S.matches*100):0)+'%','WIN RATE'],[S.hits||0,'HITS'],[S.heads||0,'HEADSHOTS'],[S.kos||0,'KNOCKOUTS'],[S.longs||0,'LONG SHOTS'],[S.killcams||0,'KILL CAMS'],[S.perfect||0,'PERFECT ROUNDS'],[campStars(),'CAMPAIGN STARS'],[SV.cups,'CUPS'],[SV.daily.best||0,'DAILY BEST'],[S.burns||0,'BURNS'],[S.freezes||0,'FREEZES'],[S.zaps||0,'ZAPS']];
  const g=document.createElement('div');g.className='sgrid';g.innerHTML=rows.map(x=>`<div><b>${x[0]}</b><span>${x[1]}</span></div>`).join('');B_.appendChild(g)}
 show('sProfile')}

// ---------- HOW ----------
$('howList').innerHTML=[['std','<b>Drag back</b> anywhere to draw. Farther means more power. <b>Release</b> to fire. Read the <b>wind</b> every turn.'],
 [null,'<b>Headshot 50</b> · Body 28 · Legs 16. Faster arrows hit harder. Every archer has a <b>signature ability</b>.']].concat(SPECIALS.map(k=>[k,`<b>${ARW[k].n}</b>: ${ARW[k].d}`])).concat([[null,'<b>Perfect release:</b> hold your draw. A gold ring closes on your arrowhead. Let go when it flashes <b>PERFECT</b> for +25% damage.'],[null,'<b>Siege:</b> defend your tower against endless waves of raiders, solo or co-op. Every 5th wave brings a Warlord.'],[null,'<b>Missions:</b> 3 daily and 3 weekly goals. Claim them for crowns and XP.'],[null,'Pick <b>3 special arrows</b> for your quiver in the Armory. You get one of each per round.'],[null,'Earn <b>XP and crowns</b> from every match to rank up, climb the season pass and unlock archers, bows, trails and poses.']])
 .map(([k,t])=>`<div><div class="ic" style="color:${k?KC(k):'#f2c94c'}">${k?ICON[k]:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.6 6.3L21 9l-5 4.4L17.5 20 12 16.5 6.5 20 8 13.4 3 9l6.4-.7z"/></svg>'}</div><p>${t}</p></div>`).join('');

// ---------- ONLINE ----------
let peer=null,conn=null,hostId=null,oppL=null,netLost=false,reconTimer=null;const Q={on:false,k:1};const NOPT={bo:3,elem:1};
const netOK=()=>typeof Peer!=='undefined'&&typeof RTCPeerConnection!=='undefined';
function noNet(el){el.textContent='Online play runs on the DARE Arcade site. This preview blocks phone-to-phone connections. Every other mode works here.'}
function openOnline(){$('onName').textContent=OUT[OIDX(SV.eq.out)].n;$('onQ').textContent='Quiver: '+SV.eq.quiver.map(k=>ARW[k].n).join(' · ')+' · Bow: '+BOWS[SV.eq.bow].n;$('netMsg').textContent='';
 seg($('segBoO'),NOPT.bo,v=>NOPT.bo=+v);seg($('segElO'),NOPT.elem,v=>NOPT.elem=+v);regPrev($('onPrev'),c=>figureTo(c,OIDX(SV.eq.out),1,1.55,200,true,{bow:SV.eq.bow}));show('sOnline')}
function netClose(){clearInterval(reconTimer);Q.on=false;try{conn&&conn.close()}catch(e){}try{peer&&peer.destroy()}catch(e){}conn=null;peer=null;netLost=false}
function send(m){try{conn&&conn.open&&conn.send(m)}catch(e){}}
function wire(c){conn=c;c.on('data',onMsg);c.on('close',()=>{if(c===conn)onDrop()});c.on('error',()=>{})}
function hostHandlers(){peer.on('connection',c=>{if(conn&&conn.open&&!netLost){c.on('open',()=>{try{c.send({t:'busy'})}catch(e){}setTimeout(()=>c.close(),300)});return}
  wire(c);c.on('open',()=>{if(netLost&&G.sub==='online'){send(syncState());resumeNet()}})})}
function hostStart(){const seed=Math.random()*1e9|0;const L0=myLoad();send({t:'start',seed,bo:NOPT.bo,el:!!NOPT.elem,L:L0});Q.on=false;startOnline(0,seed,L0,oppL,NOPT.bo,!!NOPT.elem)}
function startOnline(me,seed,L0,L1,bo,el){const s0=Object.assign({},L0,{human:true,team:0,nm:me===0?'YOU':'RIVAL'}),s1=Object.assign({},L1||cpuLoad(),{human:true,team:1,nm:me===1?'YOU':'RIVAL'});
 startMatch({mode:'online',sub:'online',layout:'duel',slots:[s0,s1],bo,elem:el,seed,me,pi:me})}
function onMsg(m){if(!m||!m.t)return;
 if(m.t==='hello'){oppL=m.L;if(G.sub!=='online'||G.state==='done'){setTimeout(hostStart,250)}}
 else if(m.t==='start'){Q.on=false;startOnline(1,m.seed,m.L,myLoad(),m.bo,m.el)}
 else if(m.t==='busy'){if(Q.on){Q.k++;quickTry()}else $('netMsg').textContent='That duel is already in progress.'}
 else if(m.t==='rematch'&&G.me===0)hostStart();
 else if(m.t==='aim'&&G.state==='aim'&&G.turn!==G.me){const a=G.A[G.turn];a.a=m.a;a.p=m.p;a.face=Math.cos(m.a)>=0?1:-1}
 else if(m.t==='sel'&&G.turn!==G.me){G.A[G.turn].sel=m.k}
 else if(m.t==='shot'&&G.state==='aim'&&G.turn!==G.me){G.A[G.turn].sel=m.k;fire(m.a,m.p,m.k,true,m.pt0,!!m.pf)}
 else if(m.t==='res'){G.netRes=m}
 else if(m.t==='emo'){emote(1-G.me,m.k)}
 else if(m.t==='sync'){applySync(m)}}
function onDrop(){if(G.sub==='online'&&G.state!=='done'&&!netLost&&G.mode==='online'){netLost=true;G.prevNet=G.state;G.state='paused';$('msgT').textContent='RECONNECTING…';$('msgB').textContent='Connection dropped. Trying to get your rival back.';setHud(false);show('sMsg');
  if(G.me===1){let n=0;reconTimer=setInterval(()=>{n++;if(n>8){clearInterval(reconTimer);lostForGood();return}try{const c=peer.connect(hostId,{reliable:true});c.on('open',()=>{clearInterval(reconTimer);wire(c)})}catch(e){}},2500)}
  else setTimeout(()=>{if(netLost)lostForGood()},25000)}
 else if(G.sub==='online'&&G.state==='done'){$('bNext').textContent='RIVAL LEFT';$('bNext').disabled=true}}
function lostForGood(){netLost=false;$('msgT').textContent='DISCONNECTED';$('msgB').textContent='Your rival left the duel.';show('sMsg')}
function syncState(){return{t:'sync',round:G.round,wins:G.wins,turn:G.turn,oi:G.oi,tc:G.turnCount,platT:G.platT,A:G.A.map(a=>({hp:a.hp,burn:a.burn,poison:a.poison,frost:a.frost,dead:a.dead,ch:a.ch,fh:a.firstHit})),iron:G.ironUsed,obs:G.obsLive,sh:G.shields}}
function applySync(m){G.round=m.round;G.wins=m.wins;G.turn=m.turn;G.oi=m.oi;G.turnCount=m.tc;G.platT=m.platT;m.A.forEach((s,k)=>{Object.assign(G.A[k],{hp:s.hp,burn:s.burn,poison:s.poison,frost:s.frost,dead:s.dead,ch:s.ch,firstHit:s.fh})});G.ironUsed=m.iron;G.obsLive=m.obs;G.shields=m.sh;setWind();resumeNet()}
function resumeNet(){netLost=false;G.arrows=[];G.netRes=null;G.state='aim';hideAll();setHud(true);hudBuild();tagTurn();if(G.A[G.turn].p)G.A[G.turn].p=0}
$('bHost').onclick=()=>{ac();if(!netOK())return noNet($('netMsg'));netClose();const L='ABCDEFGHJKMNPQRSTUVWXYZ23456789';let code='';for(let k=0;k<4;k++)code+=L[Math.random()*L.length|0];
 $('code').textContent=code;$('hostMsg').textContent='Connecting…';show('sHost');hostId='dare-longshot-'+code;
 try{peer=new Peer(hostId);peer.on('open',()=>$('hostMsg').textContent='Waiting for rival to join…');hostHandlers();peer.on('error',e=>{$('hostMsg').textContent=e.type==='unavailable-id'?'Code taken. Cancel and host again.':'Connection error: '+e.type})}catch(e){noNet($('hostMsg'))}};
$('bJoin').onclick=()=>{ac();const code=$('joinCode').value.trim().toUpperCase();if(code.length!==4){$('netMsg').textContent='Enter the 4-character code.';return}
 if(!netOK())return noNet($('netMsg'));netClose();$('netMsg').textContent='Joining '+code+'…';hostId='dare-longshot-'+code;
 try{peer=new Peer();peer.on('open',()=>{const c=peer.connect(hostId,{reliable:true});wire(c);c.on('open',()=>{$('netMsg').textContent='Connected. Starting…';send({t:'hello',L:myLoad()})})});
  peer.on('error',e=>{$('netMsg').textContent=e.type==='peer-unavailable'?'No duel found with that code.':'Connection error: '+e.type})}catch(e){noNet($('netMsg'))}};
$('bQuick').onclick=()=>{ac();if(!netOK())return noNet($('netMsg'));netClose();Q.on=true;Q.k=1;show('sQuick');$('quickMsg').textContent='Searching the lobby…';quickTry()};
function quickTry(){if(!Q.on)return;if(Q.k>8){$('quickMsg').textContent='The lobby is full right now. Try again in a minute.';Q.on=false;return}const id='dare-longshot-q'+Q.k;
 try{conn=null;try{peer&&peer.destroy()}catch(e){}peer=new Peer(id);
  peer.on('open',()=>{hostId=id;$('quickMsg').textContent='Waiting for a rival to join… (lobby '+Q.k+')';hostHandlers()});
  peer.on('error',e=>{if(!Q.on)return;if(e.type==='unavailable-id'){try{peer.destroy()}catch(_){}peer=new Peer();let ok=false;
    peer.on('open',()=>{const c=peer.connect(id,{reliable:true});wire(c);c.on('open',()=>{ok=true;hostId=id;$('quickMsg').textContent='Rival found. Starting…';send({t:'hello',L:myLoad()})});setTimeout(()=>{if(!ok&&Q.on){Q.k++;quickTry()}},4500)});
    peer.on('error',()=>{if(Q.on&&!ok){Q.k++;quickTry()}})}else{$('quickMsg').textContent='Connection error: '+e.type}})}catch(e){noNet($('quickMsg'))}}
$('bQuickBack').onclick=()=>{netClose();openOnline()};$('bOnBack')&&($('bOnBack').onclick=()=>{netClose();show('sMenu')});
$('bHostBack').onclick=()=>{netClose();openOnline()};

// ---------- LOOP ----------
function postParams(){const q=SV.set.gfx,ul=q==='ultra';let grade=B.grade||[1,1,1],sat=1.06;
 if(G.state==='photo'){if(photoFilter==='noir'){sat=0;grade=[1.12,1.12,1.12]}else if(photoFilter==='gold'){grade=[1.18,1,.78];sat=.9}else if(photoFilter==='vintage'){grade=[1.08,.98,.84];sat=.55}else if(photoFilter==='vivid')sat=1.5}
 return{sharp:ul?.2:.12,th:.72,passes:ul?3:2,bloom:(ul?.9:.7)*(B.bloom||1),t:G.t,ab:(ul?.006:.003)*G.ab+(G.killOn||G.state==='replay'?.0025:0),shim:ul&&B.shimmer?1:0,grain:ul?.05:.03,vig:.55+(G.killOn||G.state==='replay'?.45:0),flash:G.flashA*.45,sat,grade}}
let last=performance.now();
function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;try{if(G.state!=='paused')update(dt);render();if(POSTON)postFrame(cv,postParams());renderPrevs()}catch(e){console.error(e)}requestAnimationFrame(loop)}

// ---------- BOOT ----------
(async()=>{applyLefty();const bar=$('loadBar');bar.style.width='20%';
 try{await Promise.race([document.fonts?document.fonts.ready:Promise.resolve(),new Promise(r=>setTimeout(r,1500))])}catch(e){}bar.style.width='55%';
 setGfx(SV.set.gfx);bar.style.width='80%';startDemo();requestAnimationFrame(loop);
 setTimeout(()=>{bar.style.width='100%';setTimeout(()=>show('sSplash'),300)},300)})();
let entered=false;
$('sSplash').addEventListener('pointerdown',()=>{if(entered)return;entered=true;ac();applyVol();sfx.enter();setAmbient(B);musicStart();musicMode(0,B.key);show('sMenu')});
window.__G=G;window.__SV=SV;

// ---------- SIEGE RESULTS ----------
function siegeOver(){const ms=G.ms[0];const ended=G.siegeEnd;G.siegeEnd=0;const waves=G.wave-(ended?0:1);const before=ownedSnapshot();const rec=waves>(SV.siege.best||0);
 SV.siege.best=Math.max(SV.siege.best||0,waves);SV.siege.score=Math.max(SV.siege.score||0,G.score);SV.stats.siegebest=Math.max(SV.stats.siegebest||0,waves);
 addStat('matches',1);addStat('waves',waves);['hits','heads','kos','longs','killcams','burns','freezes','zaps','splits','venoms','seeks','blocks','perfects'].forEach(k=>addStat(k,ms[k]||0));
 const R=applyXp(60+waves*50+ms.kos*15+(ms.perfects||0)*10,10+waves*12+ms.kos*2,before);
 showResults({title:rec?'NEW RECORD':ended?'TOWER HELD':'TOWER FALLEN',sub:(ended?'CLEARED WAVE ':'REACHED WAVE ')+G.wave+' · SCORE '+G.score,stats:[[waves,'WAVES CLEARED'],[G.kills,'RAIDERS DOWN'],[G.score,'SCORE'],[ms.heads,'HEADSHOTS'],[ms.perfects||0,'PERFECTS'],[SV.siege.best,'BEST WAVE']],R,next:'DEFEND AGAIN',nextFn:()=>{startMatch(Object.assign({},G.cfg,{seed:Math.random()*1e9|0}));G.score=0;scoreUpd()}})}

// ---------- MISSIONS ----------
const MTPL=[['wins','Win # matches',[2,3],[60,90]],['heads','Land # headshots',[3,5],[60,90]],['perfects','Land # perfect releases',[3,6],[60,100]],['kos','Knock out # archers',[3,5],[50,80]],
 ['longs','Land # long shots (140 m+)',[2,3],[70,100]],['burns','Set # rivals ablaze',[2,4],[50,80]],['freezes','Freeze # rivals',[2,4],[50,80]],['zaps','Zap # rivals with Thunder',[2,4],[50,80]],
 ['waves','Clear # siege waves',[3,6],[70,110]],['bulls','Hit # bullseyes',[2,4],[50,80]],['hits','Land # hits',[10,20],[50,80]],['matches','Play # matches',[3,5],[40,60]],['killcams','Trigger # kill cams',[1,2],[60,90]]];
const weekKey=()=>'W'+Math.floor((Date.now()/864e5+3)/7);
function msnRoll(kind,key){const r=rng(strHash(kind+key));const pool=MTPL.slice();const out=[];while(out.length<3){const t=pool.splice(r()*pool.length|0,1)[0];const gi=r()<.5?0:1;const goal=kind==='d'?t[2][gi]:t[2][1]*4;const cr=kind==='d'?t[3][gi]:t[3][1]*3;
 out.push({id:kind+key+t[0],stat:t[0],d:t[1].replace('#',goal).replace(/^(\w+) 1 (\w+?)s\b/,'$1 1 $2'),goal,cr,xp:kind==='d'?80:250,base:SV.stats[t[0]]||0})}return out}
function msnRefresh(){const m=SV.missions;const dk=todayKey(),wk=weekKey();let ch=false;if(m.dk!==dk||!m.daily){m.dk=dk;m.daily=msnRoll('d',dk);ch=true}if(m.wk!==wk||!m.weekly){m.wk=wk;m.weekly=msnRoll('w',wk);ch=true}m.claimed=m.claimed||{};m.noted=m.noted||{};if(ch)save()}
const msnProg=m=>clamp((SV.stats[m.stat]||0)-m.base,0,m.goal);
function msnAll(){msnRefresh();return[...SV.missions.daily,...SV.missions.weekly]}
function msnReady(){return msnAll().filter(m=>msnProg(m)>=m.goal&&!SV.missions.claimed[m.id])}
function msnNotify(){for(const m of msnReady())if(!SV.missions.noted[m.id]){SV.missions.noted[m.id]=1;toast('MISSION COMPLETE',m.d+' · claim it in Missions')}save()}
function openMissions(){msnRefresh();const L=$('misList');L.innerHTML='';const now=new Date();const hrs=24-now.getHours();const wd=7-((Math.floor(Date.now()/864e5)+3)%7);
 const sec=(t,r,arr)=>{const h=document.createElement('div');h.className='msec';h.innerHTML=`<span>${t}</span><span>RESETS IN ${r}</span>`;L.appendChild(h);
  arr.forEach(m=>{const p=msnProg(m),done=SV.missions.claimed[m.id],ready=p>=m.goal&&!done;const d=document.createElement('div');d.className='mis'+(ready?' ready':'')+(done?' done':'');
   d.innerHTML=`<div class="md"><b>${m.d}</b><span>${p} / ${m.goal} · +${m.cr} CROWNS · +${m.xp} XP</span><div class="xpbar"><i style="width:${p/m.goal*100}%"></i></div></div><button>${done?'CLAIMED':ready?'CLAIM':'IN PROGRESS'}</button>`;
   if(ready)d.querySelector('button').onclick=()=>{const before=ownedSnapshot();SV.missions.claimed[m.id]=1;addStat('missions',1);const R=applyXp(m.xp,m.cr,before);sfx.buy();toast('+'+m.cr+' CROWNS','+'+m.xp+' XP · '+m.d);if(R.lv1>R.lv0)toast('LEVEL '+R.lv1,rankOf(R.lv1)[0]+' RANK');R.achs.forEach(a=>toast(a.n,a.d+' · +'+a.cr+' crowns'));openMissions()};
   L.appendChild(d)})};
 sec('DAILY',hrs+'H',SV.missions.daily);sec('WEEKLY',wd+(wd===1?' DAY':' DAYS'),SV.missions.weekly);show('sMissions')}
