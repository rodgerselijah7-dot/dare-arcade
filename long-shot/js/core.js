// ================= LONG SHOT · CORE =================
const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>v<a?a:v>b?b:v,lerp=(a,b,t)=>a+(b-a)*t;
const hash=x=>{const h=Math.sin(x*127.1+311.7)*43758.5453;return h-Math.floor(h)};
function rng(s){s=s>>>0;return()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function gauss(){return Math.sqrt(-2*Math.log(Math.random()+1e-9))*Math.cos(6.2832*Math.random())}
function easeOutBack(t){const c=1.4;return 1+(c+1)*Math.pow(t-1,3)+c*Math.pow(t-1,2)}
function shade(hex,amt){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;if(amt>0){r+=(255-r)*amt;g+=(255-g)*amt;b+=(255-b)*amt}else{r*=1+amt;g*=1+amt;b*=1+amt}return`rgb(${r|0},${g|0},${b|0})`}
function strHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
const todayKey=()=>{const d=new Date();return d.getFullYear()+'-'+(d.getMonth()+1)+'-'+d.getDate()};

const GRAV=980,VMAX=1550,WINDK=240,STEP=1/240;

// ---------- ARCHERS (outfit + signature ability) ----------
const OUT=[
 {id:'gold',n:'SOUTHSIDE GOLD',main:'#e2b33c',light:'#fff0b8',dark:'#6e4c0c',trim:'#17120a',acc:'#f2c94c',cape:'#17120a',capeIn:'#c9961f',pants:'#2a2420',skin:'#8a5534',gear:'crown',ab:{n:"CROWN'S FAVOR",d:'Headshots deal +10'},u:{}},
 {id:'red',n:'RISK TAKER RED',main:'#d1253a',light:'#ff9aa4',dark:'#5e0915',trim:'#f2c94c',acc:'#f2c94c',cape:'#3d050d',capeIn:'#d1253a',pants:'#211a1a',skin:'#6b3f24',gear:'hood',ab:{n:'ALL IN',d:'Full-power shots (95%+) deal +8'},u:{}},
 {id:'jade',n:'MIDNIGHT JADE',main:'#1fa37a',light:'#8ff5d2',dark:'#0a4a35',trim:'#eadfbe',acc:'#eadfbe',cape:'#062a1f',capeIn:'#1fa37a',pants:'#1d2421',skin:'#a2683f',gear:'band',ab:{n:'WINDREADER',d:'Wind pushes your arrows half as much'},u:{}},
 {id:'violet',n:'ROYAL VIOLET',main:'#7b4fd6',light:'#d6c4ff',dark:'#2e1866',trim:'#f2c94c',acc:'#f2c94c',cape:'#1a0d3d',capeIn:'#7b4fd6',pants:'#1f1b2a',skin:'#c08a5b',gear:'helm',ab:{n:'ROYAL GUARD',d:'Take 15% less damage'},u:{}},
 {id:'frost',n:'FROSTBITE',main:'#4fb3e6',light:'#e4f7ff',dark:'#1a4c70',trim:'#ffffff',acc:'#ffffff',cape:'#0d2a40',capeIn:'#4fb3e6',pants:'#1c2733',skin:'#8a5534',gear:'hood',ab:{n:'COLD BLOOD',d:'Immune to Frost · your Frost arrows +6'},u:{lvl:5}},
 {id:'ash',n:'ASH & EMBER',main:'#45454e',light:'#b0b0bc',dark:'#151519',trim:'#ff7a2a',acc:'#ff7a2a',cape:'#0d0d10',capeIn:'#ff7a2a',pants:'#18181c',skin:'#6b3f24',gear:'band',ab:{n:'EMBER SOUL',d:'Immune to Burn · your Fire burns 3 turns'},u:{lvl:10}},
 {id:'child',n:'GOLDEN CHILD',main:'#f4efe4',light:'#ffffff',dark:'#b9a77a',trim:'#d4a21f',acc:'#d4a21f',cape:'#d4a21f',capeIn:'#fff4cf',pants:'#e8e0cc',skin:'#8a5534',gear:'crown',ab:{n:'CRADLE TO CROWN',d:'Heal 4 HP at the start of each of your turns'},u:{camp:4}},
 {id:'don',n:'THE LAST DON',main:'#1b1b20',light:'#55555f',dark:'#050506',trim:'#d4a21f',acc:'#d4a21f',cape:'#0a0a0c',capeIn:'#d4a21f',pants:'#101014',skin:'#6b3f24',gear:'fedora',ab:{n:'MADE MAN',d:'Your first hit each round deals +12'},u:{camp:8}},
 {id:'neon',n:'RARE NEON',main:'#141418',light:'#ff4fd8',dark:'#050507',trim:'#ff4fd8',acc:'#38f0ff',cape:'#0a0a10',capeIn:'#ff4fd8',pants:'#0e0e12',skin:'#a2683f',gear:'band',glow:'#ff4fd8',ab:{n:'RARE FIND',d:'+1 charge of a random quiver arrow each round'},u:{price:600}},
 {id:'steel',n:'SOUTHSIDE STEEL',main:'#7d8590',light:'#dfe5ec',dark:'#2d3238',trim:'#ff7a2a',acc:'#ff7a2a',cape:'#22262b',capeIn:'#ff7a2a',pants:'#22252a',skin:'#c08a5b',gear:'helm',ab:{n:'IRON WILL',d:'Once per match, survive a lethal hit with 1 HP'},u:{wins:25}}];
const OIDX=id=>Math.max(0,OUT.findIndex(o=>o.id===id));

// ---------- COSMETICS ----------
const BOWS={oak:{n:'OAK',c:['#2a1708','#a8743e']},ebony:{n:'EBONY',c:['#09090c','#55556a'],price:150},bone:{n:'BONE',c:['#7a705e','#f4ecd8'],price:250},
 gold:{n:'GILDED',c:['#6e4c0c','#ffe08a'],price:450,glow:'#ffd75a'},crystal:{n:'CRYSTAL',c:['#2a6fd6','#e4f8ff'],lvl:15,glow:'#8fe0ff'},dragon:{n:'DRAGONBONE',c:['#2a0505','#ff4a2a'],season:20,glow:'#ff5a2a'}};
const TRAILS={classic:{n:'CLASSIC'},smoke:{n:'SMOKE',price:150},gold:{n:'GOLD DUST',price:250},ember:{n:'EMBER',lvl:8},star:{n:'STARLIGHT',season:12},prism:{n:'PRISM',season:26}};
const POSES={raise:{n:'BOW RAISE'},salute:{n:'SALUTE',lvl:4},flex:{n:'FLEX',price:150},spin:{n:'BOW SPIN',price:350},crown:{n:'CROWN ME',season:8}};

// ---------- ARROWS ----------
const ARW={
 std:{n:'STEEL',c:'#ffffff',d:'Standard arrow. Unlimited.'},
 fire:{n:'FIRE',c:'#ff7a1a',d:'+6 damage. Target burns 6 a turn for 2 turns. Lights the ground.'},
 ice:{n:'FROST',c:'#7fdcff',d:'+4 damage. Freezes: their next shot shakes and loses its guide.'},
 bolt:{n:'THUNDER',c:'#ffe14a',d:'Lightning strikes where it lands. 18 to anyone close, even you.'},
 split:{n:'SPLIT',c:'#ff5ad1',d:'Splits into 3 at the top of its arc. Each deals 60%.'},
 poison:{n:'VENOM',c:'#8cff5a',d:'+3 damage. Poisons for 5 a turn for 3 turns. Leaves a toxic cloud.'},
 magnet:{n:'SEEKER',c:'#b388ff',d:'Bends toward the nearest rival after its peak. 85% damage.'},
 shield:{n:'BARRIER',c:'#5affd8',d:'Raises an energy wall where it lands. Blocks 2 enemy arrows.'}};
const SPECIALS=['fire','ice','bolt','split','poison','magnet','shield'];
const ICON={
 std:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20L20 4M20 4h-6M20 4v6M4 20l3-1M4 20l1-3"/></svg>',
 fire:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-4-1-6 1-9z"/></svg>',
 ice:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7M12 2l-2.5 2.5M12 2l2.5 2.5M12 22l-2.5-2.5M12 22l2.5-2.5"/></svg>',
 bolt:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h6l-1 8 9-12h-6z"/></svg>',
 split:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 18L12 9M12 9l9-5M12 9l9 0M12 9l9 5"/></svg>',
 poison:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12z"/><circle cx="10" cy="14" r="1.6" fill="#0b1a06"/><circle cx="14" cy="16" r="1.2" fill="#0b1a06"/></svg>',
 magnet:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M6 4v8a6 6 0 0 0 12 0V4"/><path d="M6 8h3M15 8h3" stroke-width="3"/></svg>',
 shield:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/></svg>'};

// ---------- BIOMES ----------
const BIOMES={
 meadow:{bloom:0.35,name:'GREEN VALE · HIGH NOON',sky:['#1d58b8','#3a84d8','#7ab9ec','#cfe8f9','#eef7e6'],sun:{x:.24,y:.15,r:52,c:'#fffbea',g:'255,240,190'},cloud:'rgba(255,255,255,.8)',cloudSh:'rgba(170,195,225,.7)',
  layers:[{f:.06,amp:340,col:'#9cb9d6',st:'mount',lift:.42},{f:.18,amp:200,col:'#6f9a8a',st:'hills',lift:.18},{f:.38,amp:110,col:'#3f6e4c',st:'pines',lift:.04,tree:'#2f5a3c'}],
  fog:'215,232,248',ground:{top:'#7dbb42',a:'#4f7f2a',b:'#1f3517',st:'grass'},stone:['#c4bcb0','#867c72','#4e4842'],wx:'leaves',birds:1,rim:'255,250,230',grade:[1.04,1.0,.96],amb:['lowpass',420,.035],key:0},
 canyon:{bloom:0.8,name:'RED CANYON · GOLDEN HOUR',sky:['#1a0d2e','#4a1b46','#a4385a','#ee7a43','#ffc678'],sun:{x:.7,y:.5,r:95,c:'#ffe2a6',g:'255,170,90'},cloud:'rgba(255,175,145,.4)',cloudSh:'rgba(150,60,90,.35)',
  layers:[{f:.06,amp:300,col:'#8a3d55',st:'mesa',lift:.3},{f:.18,amp:230,col:'#6a2a3c',st:'mesa',lift:.12},{f:.38,amp:110,col:'#3a1626',st:'rocks',lift:.02}],
  fog:'255,150,100',ground:{top:'#d0915a',a:'#9a5e34',b:'#3b1f12',st:'sand'},stone:['#cf9870','#8e5a3e','#5a3424'],wx:'dust',rays:1,birds:1,shimmer:1,rim:'255,160,90',tint:'rgba(255,110,50,.06)',grade:[1.1,.98,.88],amb:['bandpass',380,.03],key:3},
 highlands:{bloom:1.1,name:'BLACK HIGHLANDS · MIDNIGHT',sky:['#02040c','#071029','#122052','#25387a'],moon:{x:.78,y:.17,r:38},stars:1,cloud:'rgba(110,130,200,.12)',cloudSh:'rgba(0,0,0,0)',
  layers:[{f:.06,amp:330,col:'#25325e',st:'mount',lift:.4},{f:.18,amp:200,col:'#18234a',st:'hills',lift:.15},{f:.38,amp:130,col:'#0c142e',st:'pines',lift:.03,tree:'#08102a'}],
  fog:'70,95,170',ground:{top:'#2f5244',a:'#1b2e27',b:'#070c0a',st:'grass'},stone:['#6c7390','#40455c','#24273a'],wx:'fireflies',torch:1,rim:'150,180,255',tint:'rgba(10,20,70,.2)',grade:[.9,.98,1.12],amb:['lowpass',300,.03],key:5},
 frost:{bloom:0.3,name:'FROST PEAKS · WHITEOUT',sky:['#5d7290','#8ea5bf','#c4d3e2','#e9f0f7'],sun:{x:.3,y:.2,r:40,c:'#ffffff',g:'235,240,255'},cloud:'rgba(245,248,255,.7)',cloudSh:'rgba(150,170,200,.5)',
  layers:[{f:.06,amp:400,col:'#8299b4',st:'peaks',lift:.4,snow:1},{f:.18,amp:240,col:'#5d7591',st:'peaks',lift:.15,snow:1},{f:.38,amp:120,col:'#2f4257',st:'pines',lift:.03,tree:'#233547',snow:1}],
  fog:'230,238,250',ground:{top:'#f4f8fc',a:'#cfdbe8',b:'#7d90a6',st:'snow'},stone:['#aebbcb','#6f7d90','#424c5a'],wx:'snow',snowcap:1,rim:'230,240,255',grade:[.94,1,1.08],amb:['bandpass',520,.05],key:2},
 storm:{bloom:1,name:'STORM COAST · THUNDERHEAD',sky:['#0b0f16','#1c2430','#2e3a48','#4a5866'],cloud:'rgba(16,21,28,.9)',cloudSh:'rgba(60,70,85,.6)',heavy:1,
  layers:[{f:.06,amp:260,col:'#2a3542',st:'mount',lift:.4},{f:.12,st:'sea',lift:.16},{f:.38,amp:90,col:'#141b22',st:'rocks',lift:.02}],
  fog:'90,105,120',ground:{top:'#3e5140',a:'#25332a',b:'#0c120e',st:'grass'},stone:['#727b86','#454c55','#262b31'],wx:'rain',lightning:1,torch:1,rim:'180,200,230',tint:'rgba(10,20,30,.16)',grade:[.92,.98,1.06],amb:['lowpass',1600,.09],key:1},
 city:{bloom:1.1,name:'SOUTHSIDE · AFTER DARK',sky:['#07051a','#1a0f3a','#3d1a52','#7a2f5a','#d0613e'],stars:1,cloud:'rgba(120,70,140,.18)',cloudSh:'rgba(0,0,0,0)',
  layers:[{f:.06,amp:300,col:'#3a1d4e',st:'mount',lift:.3},{f:.18,amp:200,col:'#21122f',st:'hills',lift:.1,towers:1},{f:.38,amp:90,col:'#0c0814',st:'hills',lift:.02,boards:1}],
  fog:'200,90,140',ground:{top:'#2c2a33',a:'#1c1a22',b:'#08070b',st:'asphalt'},stone:['#7a6f78','#4a424a','#2a242a'],wx:'drizzle',torch:1,lamp:1,birds:0,rim:'255,120,200',tint:'rgba(40,10,60,.16)',grade:[1.06,.94,1.08],amb:['lowpass',700,.04],key:4}};
const BKEYS=Object.keys(BIOMES);

// ---------- CAMPAIGN ----------
const CAMP=[
 {n:'THE BOTTOM',boss:'LIL DEUCE',o:2,b:'meadow',diff:0,bo:1,story:'Every legend starts somewhere. Lil Deuce runs the range on the Bottom and talks like he owns it. Make him prove it.',mods:{}},
 {n:'EVANS AVE',boss:'TWO-TONE',o:1,b:'canyon',diff:1,bo:1,story:'Two-Tone never misses twice. The wind down Evans is wild tonight, so read it before you let go.',mods:{wind:1.6}},
 {n:'RIVERSIDE',boss:'GHOST',o:5,b:'highlands',diff:1,bo:1,story:'Nobody sees Ghost coming. No aim guide out here. Trust your hands.',mods:{noGuide:1}},
 {n:'FROST LINE',boss:'ICE MAE',o:4,b:'frost',diff:1,bo:3,story:'Ice Mae keeps her quiver cold and her heart colder. Expect to get frozen.',mods:{bossQ:['ice','ice','ice']}},
 {n:'STORM COAST',boss:'THUNDER JONES',o:3,b:'storm',diff:2,bo:3,story:'Thunder Jones calls down the sky. Keep your distance or get lit up.',mods:{bossQ:['bolt','bolt','bolt']}},
 {n:'THE WALL',boss:'BRICK',o:9,b:'city',diff:2,bo:3,story:'Brick built a wall between you. Tear it down arrow by arrow, or go over the top.',mods:{wall:1}},
 {n:'MOVING GROUND',boss:'SLICK',o:1,b:'canyon',diff:2,bo:3,story:'Slick hides behind a floating slab that never stops moving. Time your shot.',mods:{plat:1}},
 {n:'CROWN WARD',boss:'THE LAST DON',o:7,b:'city',diff:2,bo:3,story:'One crown. One Don. He has 150 HP and every element. Take the crown.',mods:{bossHp:150,bossQ:['fire','bolt','poison']}}];
const CUPNAMES=['DEADEYE','LOW KEY','BIG TEX','SPARROW','DOLLA','VIPER','NOVA','HAWK','BANDIT','RICO','JUNE','KINGPIN'];

// ---------- RANKS / XP ----------
const RANKS=[['BRONZE','#c98a52'],['SILVER','#cfd6de'],['GOLD','#f2c94c'],['PLATINUM','#7fe3d6'],['DIAMOND','#8fb8ff'],['LEGEND','#ff5a6a']];
const xpNeed=l=>200+l*60;
const rankOf=l=>RANKS[Math.min(5,Math.floor((l-1)/10))];

// ---------- SEASON ----------
const SEASON={n:'SEASON 1 · CROWN SEASON',tierXp:300,tiers:[]};
(()=>{const special={4:['crowns',150],8:['pose','crown'],12:['trail','star'],16:['crowns',300],20:['bow','dragon'],24:['crowns',400],26:['trail','prism'],30:['crowns',1000]};
 for(let t=1;t<=30;t++)SEASON.tiers.push(special[t]||['crowns',t%2?40:75])})();

// ---------- ACHIEVEMENTS ----------
const ACH=[];
(()=>{const T=(stat,tiers,nm,desc,cr)=>tiers.forEach((g,k)=>ACH.push({id:stat+'_'+g,stat,goal:g,n:nm[k]||nm[nm.length-1]+' '+(k+1),d:(g===1?desc.replace(/# (\w+?)e?s\b/,(m,w)=>'1 '+(w==='archer'||w==='match'?w+(w==='match'?'':''):w)).replace(/# /,'1 '):desc.replace('#',g)),cr:cr[k]||cr[cr.length-1]}));
 T('wins',[1,10,25,50,100],['FIRST BLOOD','CONTENDER','VETERAN','WARLORD','CENTURION'],'Win # matches',[25,60,120,250,500]);
 T('hits',[10,100,500],['ON TARGET','SHARPSHOOTER','ARROW STORM'],'Land # hits',[20,80,250]);
 T('heads',[1,10,50,150],['BETWEEN THE EYES','HEADHUNTER','SKULL CRUSHER','CROWN TAKER'],'Land # headshots',[25,75,200,400]);
 T('kos',[1,25,100],['LIGHTS OUT','KNOCKOUT ARTIST','UNTOUCHABLE'],'Knock out # archers',[20,100,300]);
 T('longs',[1,10,40],['LONG SHOT','SNIPER','ACROSS THE MAP'],'Hit # shots from 140 m or farther',[30,100,250]);
 T('killcams',[1,10],['CINEMATIC','DIRECTOR'],'Finish # rounds with a kill cam shot',[25,100]);
 T('burns',[5,25],['PYRO','ARSONIST'],'Set rivals ablaze # times',[30,100]);
 T('freezes',[5,25],['COLD SHOULDER','ABSOLUTE ZERO'],'Freeze rivals # times',[30,100]);
 T('zaps',[5,25],['STATIC','STORMBRINGER'],'Hit rivals with Thunder # times',[30,100]);
 T('splits',[5],['FORKED TONGUE'],'Land # Split arrow hits',[40]);
 T('venoms',[5],['SNAKEBITE'],'Poison rivals # times',[40]);
 T('seeks',[5],['HEAT SEEKER'],'Land # Seeker hits',[40]);
 T('blocks',[3,15],['WALL UP','FORTRESS'],'Block # arrows with Barrier',[30,100]);
 T('walls',[3],['DEMOLITION'],'Destroy # walls',[40]);
 T('perfect',[1,10],['FLAWLESS','UNTOUCHED'],'Win # rounds without taking damage',[50,200]);
 T('comebacks',[1,5],['NOT TODAY','COMEBACK KID'],'Win # rounds with 10 HP or less',[50,150]);
 T('legend',[1,10],['GIANT KILLER','LEGEND SLAYER'],'Beat a Legend CPU # times',[60,250]);
 T('camp',[1,4,8],['CHAPTER ONE','HALFWAY HOME','TAKE THE CROWN'],'Clear # campaign chapters',[30,100,500]);
 T('stars',[12,24],['STAR STUDDED','PERFECTIONIST'],'Earn # campaign stars',[100,400]);
 T('cups',[1,5],['CUP WINNER','DYNASTY'],'Win the Crown Cup # times',[150,500]);
 T('teamw',[1,10],['SQUAD UP','BAND OF ARCHERS'],'Win # 2v2 matches',[40,150]);
 T('ffaw',[1,10],['LAST ONE STANDING','BATTLE ROYALE'],'Win # free-for-all matches',[40,150]);
 T('onlinew',[1,10],['ONLINE DEBUT','NETWORK KING'],'Win # online duels',[50,200]);
 T('dailies',[1,7,30],['DAILY GRIND','WEEKLY WARRIOR','MONTHLY MASTER'],'Complete # daily challenges',[30,150,500]);
 T('bulls',[10,100],['BULLSEYE','DEAD CENTER'],'Hit # bullseyes',[30,150]);
 T('photos',[1],['SHUTTERBUG'],'Take # photo in photo mode',[20]);
 T('replays',[5],['WATCH IT BACK'],'Watch # instant replays',[20]);
 T('selfzap',[1],['OOPS'],'Hit yourself with your own Thunder',[15]);
 T('level',[5,10,20,30,50],['RISING','ESTABLISHED','GOLD RANK','PLATINUM RANK','LEGEND RANK'],'Reach level #',[50,100,200,300,1000]);
 BKEYS.forEach(b=>ACH.push({id:'biome_'+b,stat:'bw_'+b,goal:1,n:'CONQUER '+BIOMES[b].name.split(' · ')[0],d:'Win a round in '+BIOMES[b].name.split(' · ')[0].toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()),cr:20}));
 OUT.forEach(o=>ACH.push({id:'arch_'+o.id,stat:'aw_'+o.id,goal:5,n:'MASTER: '+o.n,d:'Win 5 matches as '+o.n.toLowerCase().replace(/\b\w/g,c=>c.toUpperCase()),cr:50}))})();

// ---------- SAVE ----------
const DEF={xp:0,level:1,crowns:0,sxp:0,stats:{},ach:{},own:{out:[],bow:[],trail:[],pose:[]},eq:{out:'gold',bow:'oak',trail:'classic',pose:'raise',quiver:['fire','ice','bolt']},p2:'red',camp:[],siege:{best:0,score:0},missions:{},daily:{date:'',best:0,streak:0,last:'',done:false},claimed:[],cups:0,
 set:{gfx:'high',music:.55,sfx:.9,voice:true,haptics:true,sens:1,lefty:false,cb:false,sound:true}};
(()=>{const add=(stat,tiers,nm,desc,cr)=>tiers.forEach((g,k)=>ACH.push({id:stat+'_'+g,stat,goal:g,n:nm[k],d:g===1?desc.replace('#','1').replace(/(releases|waves)/,m=>m.slice(0,-1)):desc.replace('#',g),cr:cr[k]}));
 add('perfects',[1,25,100],['PERFECT FORM','FLAWLESS TECHNIQUE','ONE WITH THE BOW'],'Land # perfect releases',[25,100,300]);
 add('waves',[10,50,150],['HOLD THE LINE','FORTRESS KEEPER','UNBREAKABLE'],'Clear # siege waves',[40,150,400]);
 add('siegebest',[5,10,20],['WARLORD SLAYER','LAST TOWER STANDING','SIEGE LEGEND'],'Survive to siege wave #',[60,200,500]);
 add('missions',[5,25,100],['ON A MISSION','TASKMASTER','MISSION CONTROL'],'Claim # missions',[30,120,400])})();
let SV;
function loadSave(){let s=null;try{s=JSON.parse(localStorage.getItem('longshot.v1')||'null')}catch(e){}SV=Object.assign(JSON.parse(JSON.stringify(DEF)),s||{});
 for(const k of['stats','ach','own','eq','set','daily'])SV[k]=Object.assign(JSON.parse(JSON.stringify(DEF[k])),SV[k]||{})}
function save(){try{localStorage.setItem('longshot.v1',JSON.stringify(SV))}catch(e){}}
loadSave();
const seasonTier=()=>Math.min(30,Math.floor(SV.sxp/SEASON.tierXp));
function campCleared(){return SV.camp.filter(x=>x>0).length}
function campStars(){return SV.camp.reduce((a,b)=>a+(b||0),0)}
function itemCat(cat){return cat==='out'?null:cat==='bow'?BOWS:cat==='trail'?TRAILS:POSES}
function reqOf(cat,id){if(cat==='out'){return OUT[OIDX(id)].u}return itemCat(cat)[id]}
function isOwned(cat,id){const r=reqOf(cat,id);if(SV.own[cat].includes(id))return true;
 if(r.price)return false;if(r.lvl)return SV.level>=r.lvl;if(r.camp)return campCleared()>=r.camp;if(r.wins)return(SV.stats.wins||0)>=r.wins;if(r.season)return seasonTier()>=r.season;return true}
function reqText(cat,id){const r=reqOf(cat,id);if(r.price)return r.price+' CROWNS';if(r.lvl)return'REACH LEVEL '+r.lvl;if(r.camp)return'CLEAR CAMPAIGN CH. '+r.camp;if(r.wins)return'WIN '+r.wins+' MATCHES';if(r.season)return'SEASON TIER '+r.season;return''}
