// ================= LONG SHOT · ARCADE ONLINE (over /api/room) =================
// On the DARE Arcade site, online play runs over the arcade's match server (/api/room, Upstash Redis)
// instead of phone-to-phone WebRTC. This file provides the small part of the PeerJS API the game uses
// (new Peer(id), connect, on('open'|'connection'|'error'), conn.send/on('data'|'open'|'close')),
// carried inside each player's room presence: an outbox of numbered messages plus an ack of what it read.
(function(){
 if(!/^https?:$/.test(location.protocol)||window.claude)return; // preview keeps PeerJS
 const POLL=170,STALE=6000,rid=()=>Array.from(crypto.getRandomValues(new Uint8Array(14)),b=>'abcdefghijklmnopqrstuvwxyz0123456789'[b%36]).join('');
 const roomOf=id=>('longshot-'+String(id).replace(/^dare-longshot-/,'')).toLowerCase().replace(/[^a-z0-9_.-]/g,'').slice(0,48);
 const post=b=>fetch('/api/room',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(b),keepalive:!!b.leave}).then(r=>r.ok?r.json():r.json().then(e=>{throw e}));
 class Ev{constructor(){this.h={}}on(e,f){(this.h[e]=this.h[e]||[]).push(f);return this}emit(e,a){(this.h[e]||[]).slice().forEach(f=>{try{f(a)}catch(x){console.error(x)}})}}
 class Conn extends Ev{constructor(link){super();this.link=link;this.open=false;this.peer=link.other}
  send(m){const L=this.link;if(m&&m.t==='aim')L.out=L.out.filter(x=>!(x[1]&&x[1].t==='aim'));L.out.push([++L.seq,m]);let s=JSON.stringify(L.out);while(s.length>3200&&L.out.length>1){L.out.shift();s=JSON.stringify(L.out)}}
  close(){this.link.stop()}}
 class Link{constructor(peer,room,role){this.peer=peer;this.room=room;this.role=role;this.other=null;this.out=[];this.seq=0;this.seen=0;this.last=0;this.conn=null;this.alive=true;this.t0=Date.now();this.tick()}
  stop(){if(!this.alive)return;this.alive=false;clearTimeout(this.tm);post({room:this.room,peer:this.peer.id,leave:true}).catch(()=>{})}
  tick(){if(!this.alive)return;const me=this;
   post({room:me.room,peer:me.peer.id,presence:{r:me.role,c:me.claimed?1:0,w:me.other||'',o:me.out,a:me.seen}}).then(d=>{if(!me.alive)return;me.handle(d.peers||[])}).catch(e=>{if(me.role==='h'&&!me.conn)me.peer.emit('error',{type:'network'})})
    .finally(()=>{if(me.alive)me.tm=setTimeout(()=>me.tick(),POLL)})}
  handle(peers){const me=this,others=peers.filter(p=>p.peer!==me.peer.id);
   if(me.role==='h'){
    if(!me.claimed){const rival=others.find(p=>p.presence.r==='h');if(rival&&(rival.presence.c||rival.peer<me.peer.id)){me.stop();me.peer.emit('error',{type:'unavailable-id'});return}me.claimed=true;me.peer.emit('open',me.peer.id)}
    if(!me.other){const g=others.find(p=>p.presence.r==='g'&&(!p.presence.w||p.presence.w===me.peer.id));if(g){me.other=g.peer;me.out=[];me.seen=0;me.conn=new Conn(me);me.peer.emit('connection',me.conn);me.conn.open=true;setTimeout(()=>me.conn.emit('open'),0)}}}
   else{const h=others.find(p=>p.presence.r==='h');
    if(!me.other){if(h&&(!h.presence.w||h.presence.w===me.peer.id)){me.other=h.peer;me.conn.open=true;me.conn.emit('open')}
     else if(Date.now()-me.t0>(h?3000:4500)){me.stop();me.peer.emit('error',{type:'peer-unavailable'});return}}}
   if(!me.other)return;
   const o=others.find(p=>p.peer===me.other);
   if(!o){if(Date.now()-me.last>STALE&&me.last){me.conn.open=false;me.conn.emit('close');if(me.role==='h'){me.other=null;me.conn=null;me.last=0}else me.stop()}return}
   if(o.presence.w&&o.presence.w!==me.peer.id&&me.role==='g'){me.stop();me.conn.emit('data',{t:'busy'});return}
   me.last=Date.now();const ack=o.presence.a|0;me.out=me.out.filter(x=>x[0]>ack);
   for(const [s,m] of (o.presence.o||[]))if(s>me.seen){me.seen=s;me.conn.emit('data',m)}}}
 class RoomPeer extends Ev{constructor(id){super();this.id=rid();this.links=[];
   if(id){const l=new Link(this,roomOf(id),'h');this.links.push(l)}else setTimeout(()=>this.emit('open',this.id),0)}
  connect(id){const room=roomOf(id);this.links.filter(x=>x.room===room&&x.role==='g').forEach(x=>x.stop());this.links=this.links.filter(x=>x.alive);const l=new Link(this,room,'g');l.conn=new Conn(l);this.links.push(l);return l.conn}
  destroy(){this.links.forEach(l=>l.stop());this.links=[]}}
 window.Peer=RoomPeer;window.__ROOMNET=true;
})();
