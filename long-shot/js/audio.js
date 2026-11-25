// ================= LONG SHOT · AUDIO =================
let AC=null,noiseB=null,master=null,sfxBus=null,musBus=null,musFilter=null,amb=null,PAN=0;
function ac(){try{if(!AC){AC=new(window.AudioContext||window.webkitAudioContext)();master=AC.createGain();master.connect(AC.destination);
  sfxBus=AC.createGain();sfxBus.connect(master);musFilter=AC.createBiquadFilter();musFilter.type='lowpass';musFilter.frequency.value=18000;musBus=AC.createGain();musBus.connect(musFilter).connect(master);
  const n=AC.sampleRate*2;noiseB=AC.createBuffer(1,n,AC.sampleRate);const d=noiseB.getChannelData(0);let b=0;for(let i=0;i<n;i++){const w=Math.random()*2-1;b=(b+.02*w)/1.02;d[i]=w*.6+b*3}applyVol()}
 if(AC.state==='suspended'&&!document.hidden)AC.resume()}catch(e){}return AC}
function applyVol(){if(!AC)return;master.gain.value=SV.set.sound?1:0;sfxBus.gain.value=SV.set.sfx;musBus.gain.value=SV.set.music*.55}
function out(node){if(AC.createStereoPanner&&Math.abs(PAN)>.02){const p=AC.createStereoPanner();p.pan.value=clamp(PAN,-1,1);node.connect(p).connect(sfxBus)}else node.connect(sfxBus)}
function env(g,t,a,peak,dec){g.gain.setValueAtTime(0.0001,t);g.gain.exponentialRampToValueAtTime(peak,t+a);g.gain.exponentialRampToValueAtTime(0.0001,t+a+dec)}
function noise(type,f0,f1,dur,vol,q=1,delay=0){if(!AC)return;const t=AC.currentTime+delay,s=AC.createBufferSource(),fl=AC.createBiquadFilter(),g=AC.createGain();s.buffer=noiseB;fl.type=type;fl.Q.value=q;fl.frequency.setValueAtTime(f0,t);fl.frequency.exponentialRampToValueAtTime(f1,t+dur);env(g,t,0.008,vol,dur);s.connect(fl).connect(g);out(g);s.start(t,Math.random()*1.5);s.stop(t+dur+.1)}
function tone(type,f0,f1,dur,vol,delay=0){if(!AC)return;const t=AC.currentTime+delay,o=AC.createOscillator(),g=AC.createGain();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);env(g,t,0.005,vol,dur);o.connect(g);out(g);o.start(t);o.stop(t+dur+.05)}
const sfx={
 at(x){PAN=(typeof camPan==='function')?camPan(x):0;return this},
 draw(){noise('bandpass',260,900,.4,.06,7)},tick(){tone('sine',900,900,.04,.04)},
 twang(p){tone('triangle',160+p*90,62,.32,.38);tone('sine',440,180,.14,.12);noise('highpass',3500,1500,.07,.14)},
 whoosh(){noise('bandpass',500,2600,.5,.13,2)},
 thunk(){tone('sine',150,45,.2,.55);noise('lowpass',1800,250,.14,.35)},
 dirt(){noise('lowpass',900,150,.28,.4);tone('sine',90,40,.16,.3)},snowp(){noise('lowpass',2400,400,.25,.3)},
 hit(){tone('sine',115,38,.28,.75);noise('lowpass',2600,180,.22,.5);tone('square',95,50,.08,.07)},
 head(){this.hit();tone('triangle',1500,2000,.2,.16,.05);tone('triangle',2200,2700,.26,.1,.12)},
 fire(){noise('lowpass',300,2200,.5,.35,1);noise('bandpass',900,300,.8,.18,1,.1)},
 ice(){[2600,3300,4100,3700].forEach((f,i)=>tone('triangle',f,f*1.02,.25,.06,i*.04));noise('highpass',5000,2500,.3,.2)},
 bolt(){noise('highpass',6000,1500,.12,.5);noise('lowpass',900,60,1.6,.7,1,.05);tone('sawtooth',80,30,.6,.15,.02)},
 rumble(d=0){noise('lowpass',300,40,2.4,.45,1,d)},
 split(){[900,1200,1500].forEach((f,i)=>tone('square',f,f*.7,.08,.05,i*.03))},
 venom(){noise('bandpass',1200,400,.5,.25,4);tone('sine',300,120,.4,.1)},
 seek(){tone('sine',600,1400,.3,.08)},
 shield(){tone('sine',300,900,.35,.18);tone('triangle',600,1800,.35,.08,.05)},
 block(){tone('square',1200,300,.15,.15);noise('highpass',4000,1000,.2,.3)},
 crumble(){noise('lowpass',600,60,1,.6);tone('sine',70,30,.5,.4)},
 target(){tone('sine',1320,1320,.1,.15);tone('sine',1760,1760,.15,.12,.08)},
 burn(){noise('bandpass',600,300,.35,.2,2)},heal(){tone('sine',660,990,.25,.1);tone('sine',990,1320,.25,.08,.1)},
 win(){[523,659,784,1046,1318].forEach((f,i)=>tone('triangle',f,f,.4,.16,i*.11))},
 lose(){[392,330,262,196].forEach((f,i)=>tone('triangle',f,f*.97,.45,.14,i*.17))},
 perfect(){[1318,1760,2637].forEach((f,i)=>tone('triangle',f,f,.22,.13,i*.05));noise('highpass',7000,4000,.25,.15)},
 ting(){tone('sine',2093,2093,.12,.07);tone('sine',3136,3136,.1,.04,.03)},
 ui(){tone('sine',660,990,.08,.07)},buy(){[784,1046,1318].forEach((f,i)=>tone('triangle',f,f,.18,.12,i*.06))},
 ach(){[880,1108,1318,1760].forEach((f,i)=>tone('triangle',f,f,.25,.11,i*.07))},
 enter(){tone('sine',220,440,.5,.15);noise('bandpass',400,3000,.6,.12,2)}};
function setAmbient(b){if(!AC)return;try{if(!amb){const s=AC.createBufferSource();s.buffer=noiseB;s.loop=true;const f=AC.createBiquadFilter(),g=AC.createGain();g.gain.value=0;s.connect(f).connect(g).connect(sfxBus);s.start();amb={s,f,g}}
 const c=b.amb;amb.f.type=c[0];amb.f.frequency.setTargetAtTime(c[1],AC.currentTime,.5);amb.g.gain.setTargetAtTime(c[2],AC.currentTime,1)}catch(e){}}

// ---------- MUSIC: generative hip-hop score ----------
const MUS={on:false,step:0,next:0,bpm:86,key:0,int:0,timer:null};
const PROG=[0,8,3,10];
function mkick(t,v){const o=AC.createOscillator(),g=AC.createGain();o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(42,t+.18);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+.35);o.connect(g).connect(musBus);o.start(t);o.stop(t+.4)}
function mnoise(t,type,f,dur,v,q=1){const s=AC.createBufferSource(),fl=AC.createBiquadFilter(),g=AC.createGain();s.buffer=noiseB;fl.type=type;fl.frequency.value=f;fl.Q.value=q;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+dur);s.connect(fl).connect(g).connect(musBus);s.start(t,Math.random());s.stop(t+dur+.05)}
function mnote(t,type,f,dur,v,cut=1200){const o=AC.createOscillator(),fl=AC.createBiquadFilter(),g=AC.createGain();o.type=type;o.frequency.value=f;fl.type='lowpass';fl.frequency.value=cut;g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+Math.min(.4,dur*.3));g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(fl).connect(g).connect(musBus);o.start(t);o.stop(t+dur+.05)}
function musTick(){if(!AC||!MUS.on)return;const sp=60/MUS.bpm/4;
 while(MUS.next<AC.currentTime+.18){const t=MUS.next,s=MUS.step%16,bar=Math.floor(MUS.step/16)%4,root=55*Math.pow(2,(MUS.key+PROG[bar])/12),I=MUS.int;
  const sw=s%2?sp*.18:0;
  if(s===0){[1,1.189,1.498,2].forEach((m,k)=>{mnote(t,'sawtooth',root*4*m*(1+(k-1.5)*.003),sp*16,I?.035:.05,I?900:700)})}
  if(I>=1){if(s===0||s===7||s===10)mkick(t,.55);if(s===4||s===12){mnoise(t,'bandpass',1800,.18,.32,.8);mnoise(t,'highpass',5000,.08,.12)}
   if(s%2===0||I>1)mnoise(t+sw,'highpass',8000,.04,s%4===2?.09:.05);
   if(s===0||s===3||s===8||s===10||s===14)mnote(t,'sine',root*(s===14?1.498:1),sp*2.2,.22,400)}
  else{if(s===0)mkick(t,.25);if(s%4===2)mnoise(t+sw,'highpass',9000,.03,.03)}
  if(I>=1&&s%8===6&&Math.random()<.5){const sc=[0,3,5,7,10,12];mnote(t,'triangle',root*8*Math.pow(2,sc[Math.random()*6|0]/12),sp*1.5,.04,3000)}
  MUS.next+=sp;MUS.step++}}
function musicStart(){if(!AC||MUS.on)return;MUS.on=true;MUS.next=AC.currentTime+.1;MUS.timer=setInterval(musTick,40)}
function musicMode(int,key){MUS.int=int;if(key!=null)MUS.key=key;if(musFilter)musFilter.frequency.setTargetAtTime(int===2?600:18000,AC.currentTime,.15)}

// ---------- VOICE ----------
let VOICE=null;
function pickVoice(){try{const vs=speechSynthesis.getVoices();VOICE=vs.find(v=>/en-US/.test(v.lang)&&/male|david|alex|daniel|fred|guy/i.test(v.name))||vs.find(v=>/^en/.test(v.lang))||null}catch(e){}}
try{speechSynthesis.onvoiceschanged=pickVoice;pickVoice()}catch(e){}
function say(txt){if(!SV.set.voice||!SV.set.sound)return;try{if(!window.speechSynthesis)return;speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(txt);if(VOICE)u.voice=VOICE;u.rate=1.02;u.pitch=.62;u.volume=Math.min(1,SV.set.sfx);speechSynthesis.speak(u)}catch(e){}}
function buzz(p){if(!SV.set.haptics)return;try{navigator.vibrate&&navigator.vibrate(p)}catch(e){}}

// ---------- LEAVING THE PAGE ----------
// Back to the arcade, app switch or screen lock: stop music, effects, the announcer and vibration at once,
// and pick the music back up where it was when the game is shown again.
let HUSH=false;
function hush(on,gone){if(on===HUSH&&!gone)return;HUSH=on;try{
 if(on){if(window.speechSynthesis)speechSynthesis.cancel();if(navigator.vibrate)navigator.vibrate(0);if(MUS.timer){clearInterval(MUS.timer);MUS.timer=null}
  if(AC){if(gone){AC.close().catch(()=>{});AC=null;MUS.on=false}else if(AC.state==='running')AC.suspend().catch(()=>{})}}
 else if(AC&&AC.state!=='closed'){AC.resume().catch(()=>{});if(MUS.on&&!MUS.timer){MUS.next=AC.currentTime+.1;MUS.timer=setInterval(musTick,40)}}}catch(e){}}
document.addEventListener('visibilitychange',()=>hush(document.hidden));
addEventListener('pagehide',e=>hush(true,!e.persisted));
addEventListener('pageshow',()=>{if(!document.hidden)hush(false)});
