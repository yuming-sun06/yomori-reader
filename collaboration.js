'use strict';
// No application server: MQTT carries encrypted signaling only. Book state uses RTC.
(function(root){
 const encoder=new TextEncoder(),decoder=new TextDecoder();
 const hex=bytes=>Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');
 const random=()=>hex(crypto.getRandomValues(new Uint8Array(16)));
 const validCode=code=>typeof code==='string'&&/^[a-f0-9]{32}$/.test(code);
 const text=(value,max)=>typeof value==='string'&&value.length<=max;
 const anchor=a=>a&&Number.isInteger(a.chapter)&&a.chapter>=0&&Number.isInteger(a.start)&&a.start>=0&&Number.isInteger(a.end)&&a.end>a.start&&a.end-a.start<=4000&&text(a.quote,4000)&&a.quote.length===a.end-a.start;
 function validMessage(m){
  if(!m||m.v!==1||!text(m.book,64)||!/^[a-f0-9]{64}$/.test(m.book))return false;
  if(m.type==='position')return Number.isInteger(m.chapter)&&m.chapter>=0&&Number.isFinite(m.fraction)&&m.fraction>=0&&m.fraction<=1;
  if(m.type==='selection')return m.anchor===null||!!anchor(m.anchor);
  if(m.type==='comment')return validCode(m.id)&&!!anchor(m.anchor)&&text(m.body,2000)&&!!m.body.trim();
  return false;
 }
 function packet(type,body){let n=body.length,header=[type];do{let b=n%128;n=Math.floor(n/128);header.push(b|(n?128:0))}while(n);return new Uint8Array([...header,...body])}
 function mqttString(s){const b=encoder.encode(s);return [b.length>>8,b.length&255,...b]}
 class Relay {
  constructor(code,onmessage,onstatus,options={}){this.code=code;this.onmessage=onmessage;this.onstatus=onstatus;this.url=options.url||'wss://broker.emqx.io:8084/mqtt';this.WebSocket=options.WebSocket||root.WebSocket;this.retry=0;this.closed=false;this.topic='yomori/v1/'+code;this.queue=Promise.resolve()}
  async start(){this.key=await crypto.subtle.importKey('raw',Uint8Array.from(this.code.match(/../g),b=>parseInt(b,16)),'AES-GCM',false,['encrypt','decrypt']);this.topic='yomori/v1/'+hex(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(this.code))));if(!this.closed)this.connect()}
  connect(){if(this.closed)return;this.onstatus('Connecting to signaling relay…');const ws=this.socket=new this.WebSocket(this.url,'mqtt');ws.binaryType='arraybuffer';this.buffer=new Uint8Array();
   const timeout=setTimeout(()=>ws.close(),15000);
   ws.onopen=()=>ws.send(packet(0x10,[...mqttString('MQTT'),4,2,0,30,...mqttString('yomori-'+random())]));
   ws.onmessage=e=>{if(ws!==this.socket||this.closed)return;this.lastMessage=Date.now();const next=new Uint8Array(e.data);if(this.buffer.length+next.length>131072){ws.close();return}this.buffer=new Uint8Array([...this.buffer,...next]);this.parse()};
   ws.onerror=()=>ws.close();ws.onclose=()=>{clearTimeout(timeout);clearInterval(this.ping);if(this.closed||ws!==this.socket)return;this.ready=false;this.onstatus('Relay disconnected; reconnecting…');this.timer=setTimeout(()=>this.connect(),Math.min(30000,1000*2**Math.min(this.retry++,5)))};
   this.connectionTimeout=timeout;
  }
  parse(){while(this.buffer.length>1){let length=0,multiplier=1,i=1,b;do{if(i>=this.buffer.length)return;b=this.buffer[i++];length+=(b&127)*multiplier;multiplier*=128;if(i>5){this.socket.close();return}}while(b&128);if(length>65536){this.socket.close();return}if(this.buffer.length<i+length)return;const type=this.buffer[0]>>4,body=this.buffer.slice(i,i+length);this.buffer=this.buffer.slice(i+length);
    if(type===2){if(body[1]!==0){this.socket.close();return}this.socket.send(packet(0x82,[0,1,...mqttString(this.topic),0]))}
    if(type===9){if(body.length<3||body[2]===128){this.socket.close();return}clearTimeout(this.connectionTimeout);this.ready=true;this.retry=0;this.onstatus('Waiting for readers…');this.ping=setInterval(()=>{if(Date.now()-this.lastMessage>45000){this.socket.close();return}if(this.socket.readyState===1)this.socket.send(packet(0xc0,[]))},15000)}
    if(type===3&&body.length>2){const size=(body[0]<<8)+body[1];if(decoder.decode(body.slice(2,2+size))!==this.topic)continue;const data=body.slice(2+size);this.queue=this.queue.then(async()=>{try{if(data.length<29)return;const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:data.slice(0,12)},this.key,data.slice(12));if(!this.closed)await this.onmessage(JSON.parse(decoder.decode(plain)))}catch{/* Foreign or malformed signaling is ignored. */}})}
   }}
  send(message){this.outgoing=(this.outgoing||Promise.resolve()).catch(()=>{}).then(async()=>{if(!this.ready||this.closed)return;const ws=this.socket,iv=crypto.getRandomValues(new Uint8Array(12));const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},this.key,encoder.encode(JSON.stringify(message))));if(!this.closed&&ws===this.socket&&ws.readyState===1)ws.send(packet(0x30,[...mqttString(this.topic),...iv,...cipher]))});return this.outgoing}
  close(){this.closed=true;this.ready=false;clearTimeout(this.timer);clearTimeout(this.connectionTimeout);clearInterval(this.ping);this.socket?.close()}
 }
 class Room {
  constructor({code,onmessage=()=>{},onstatus=()=>{},onpeer=()=>{},RelayClass=Relay,PeerConnection=root.RTCPeerConnection}){
   if(!validCode(code))throw Error('Invite code must contain 32 hexadecimal characters');
   if(typeof PeerConnection!=='function')throw Error('WebRTC is not available in this browser');
   this.code=code;this.id=random();this.peers=new Map();this.onmessage=onmessage;this.onstatus=onstatus;this.onpeer=onpeer;this.PeerConnection=PeerConnection;this.closed=false;
   this.relay=new RelayClass(code,m=>this.signal(m),s=>onstatus(s));
  }
  async start(){await this.relay.start();if(this.closed)return;this.tick();this.timer=setInterval(()=>this.tick(),5000)}
  sendSignal(data){if(!this.closed)this.relay.send({v:1,from:this.id,...data}).catch(()=>{})}
  tick(){if(this.closed)return;this.sendSignal({type:'hello'});for(const [id,p] of this.peers){if(p.pc.connectionState==='connected')continue;if(Date.now()-p.seen>20000){this.drop(id);continue}if(['failed','closed'].includes(p.pc.connectionState)||Date.now()-p.created>20000){this.drop(id);if(this.id<id)this.offer(id)}}}
  make(id){if(this.peers.size>=8)return null;const pc=new this.PeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});const p={pc,seen:Date.now(),created:Date.now(),pending:[]};this.peers.set(id,p);
   pc.onicecandidate=e=>{if(e.candidate)this.sendSignal({type:'ice',to:id,candidate:e.candidate.toJSON()})};
   pc.ondatachannel=e=>this.channel(id,p,e.channel);
   pc.onconnectionstatechange=()=>{if(this.peers.get(id)!==p)return;this.onstatus(pc.connectionState==='connected'?'Connected via WebRTC':'Reconnecting to reader…')};return p;
  }
  channel(id,p,channel){if(channel.label!=='yomori'){channel.close();return}p.channel=channel;channel.onopen=()=>{if(this.peers.get(id)===p)this.onpeer(id,true)};channel.onclose=()=>{if(this.peers.get(id)===p){this.drop(id)}};channel.onmessage=e=>{if(this.closed||this.peers.get(id)!==p||typeof e.data!=='string'||e.data.length>16384)return;try{const m=JSON.parse(e.data);if(validMessage(m))this.onmessage(id,m)}catch{}}}
  async offer(id){const p=this.make(id);if(!p)return;this.channel(id,p,p.pc.createDataChannel('yomori'));try{await p.pc.setLocalDescription(await p.pc.createOffer());this.sendSignal({type:'offer',to:id,description:p.pc.localDescription})}catch{this.drop(id)}}
  async signal(m){if(this.closed||!m||m.v!==1||!validCode(m.from)||m.from===this.id||(m.to&&m.to!==this.id))return;const id=m.from;let p=this.peers.get(id);if(p)p.seen=Date.now();try{
    if(m.type==='hello'){if(!p&&this.id<id)await this.offer(id);return}
    if(m.type==='offer'&&this.id>id&&m.description?.type==='offer'&&text(m.description.sdp,50000)){if(p)this.drop(id);p=this.make(id);if(!p)return;await p.pc.setRemoteDescription(m.description);await p.pc.setLocalDescription(await p.pc.createAnswer());this.sendSignal({type:'answer',to:id,description:p.pc.localDescription})}
    else if(m.type==='answer'&&p&&p.pc.signalingState==='have-local-offer'&&m.description?.type==='answer'&&text(m.description.sdp,50000)){await p.pc.setRemoteDescription(m.description);for(const c of p.pending.splice(0))await p.pc.addIceCandidate(c)}
    else if(m.type==='ice'&&p&&m.candidate&&text(m.candidate.candidate,4096)){if(p.pc.remoteDescription)await p.pc.addIceCandidate(m.candidate);else if(p.pending.length<100)p.pending.push(m.candidate)}
   }catch{this.drop(id)}}
  broadcast(message){if(!validMessage(message)||this.closed)return;const data=JSON.stringify(message);for(const p of this.peers.values()){const c=p.channel;if(c?.readyState!=='open')continue;
    if(message.type==='comment'){p.outbox=p.outbox||[];if(p.outbox.length<500)p.outbox.push(data);c.bufferedAmountLowThreshold=32768;c.onbufferedamountlow=()=>this.flush(p);this.flush(p)}
    else if(c.bufferedAmount<65536)try{c.send(data)}catch{/* Presence repairs closed channels. */}
   }}
  flush(p){const c=p.channel;while(p.outbox?.length&&c.readyState==='open'&&c.bufferedAmount<65536){try{c.send(p.outbox[0]);p.outbox.shift()}catch{break}}}
  drop(id){const p=this.peers.get(id);if(!p)return;this.peers.delete(id);p.pc.close();this.onpeer(id,false)}
  close(){this.closed=true;clearInterval(this.timer);this.relay.close();for(const id of this.peers.keys())this.drop(id)}
 }
 root.YomoriCollaboration={Room,Relay,random,validCode,validMessage,packet};
 if(typeof module!=='undefined')module.exports=root.YomoriCollaboration;
})(typeof globalThis!=='undefined'?globalThis:window);
