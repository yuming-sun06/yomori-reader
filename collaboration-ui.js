'use strict';
// Reader adapter: anchors are UTF-16 offsets in rendered chapter text, independent
// of dictionary spans. Remote messages never mutate book HTML or saved progress.
(function(){
 const api=YomoriCollaboration,content=document.getElementById('readingContent');
 let room=null,book=null,session=0,selection=null,timer=null,lastPosition='',comments=new Map(),readers=new Map();
 const el=id=>document.getElementById(id);
 const status=s=>{el('collabStatus').textContent=s};
 function storageKey(){return 'yomori-room:'+room.code+':'+book}
 function persist(){try{localStorage.setItem(storageKey(),JSON.stringify([...comments.values()]))}catch{status('Comments could not be saved on this device')}}
 function send(m){if(room&&book)room.broadcast({v:1,book,...m})}
 function position(){if(!room||!current||restoring||!book)return;const m={type:'position',chapter:current.progress.chapter,fraction:readFraction()},key=JSON.stringify(m);if(key!==lastPosition){lastPosition=key;send(m)}}
 function rangeFor(a){if(!current||a.chapter!==current.progress.chapter||a.end>content.textContent.length||content.textContent.slice(a.start,a.end)!==a.quote)return null;const walker=document.createTreeWalker(content,NodeFilter.SHOW_TEXT);let node,offset=0,start=null,end=null;while(node=walker.nextNode()){const next=offset+node.length;if(!start&&a.start>=offset&&a.start<next)start=[node,a.start-offset];if(a.end>offset&&a.end<=next){end=[node,a.end-offset];break}offset=next}if(!start||!end)return null;const r=document.createRange();r.setStart(...start);r.setEnd(...end);return r}
 function render(){
  el('collabReaders').replaceChildren();for(const [id,r] of readers){const row=document.createElement('div'),b=document.createElement('button');b.textContent=r.mismatch?'Reader '+id.slice(0,4)+': different book':r.position?'Reader '+id.slice(0,4)+': section '+(r.position.chapter+1)+' · '+Math.round(r.position.fraction*100)+'%':'Reader '+id.slice(0,4)+': connected';b.disabled=!r.position||r.mismatch;b.onclick=()=>{showChapter(r.position.chapter,r.position.fraction);el('collabDialog').close()};row.append(b);el('collabReaders').append(row)}
  const ranges=[];for(const r of readers.values()){const range=r.selection&&rangeFor(r.selection);if(range)ranges.push(range)}
  el('collabAnnotations').replaceChildren();el('collabComments').replaceChildren();
  for(const c of comments.values()){const item=document.createElement('li'),jump=document.createElement('button'),body=document.createElement('p');jump.textContent='Section '+(c.anchor.chapter+1)+': “'+c.anchor.quote.slice(0,100)+'”';jump.onclick=()=>{showChapter(c.anchor.chapter);el('collabDialog').close();requestAnimationFrame(()=>rangeFor(c.anchor)?.startContainer.parentElement.scrollIntoView({block:'center'}))};body.textContent=c.body;item.append(jump,body);el('collabComments').append(item);const range=rangeFor(c.anchor);if(range){ranges.push(range);const rect=range.getBoundingClientRect(),badge=document.createElement('button');badge.className='collab-note';badge.textContent='💬';badge.setAttribute('aria-label',c.body);badge.title=c.body;badge.style.top=(rect.top+scrollY)+'px';badge.style.left=Math.max(0,Math.min(innerWidth-36,rect.right+4))+'px';badge.onclick=()=>{el('collabDialog').showModal();item.scrollIntoView({block:'nearest'})};el('collabAnnotations').append(badge)}}
  if(globalThis.CSS?.highlights&&globalThis.Highlight)CSS.highlights.set('collab',new Highlight(...ranges));
 }
 function receive(id,m){if(!room||!book||!current)return;const r=readers.get(id)||{};readers.set(id,r);r.mismatch=m.book!==book;if(r.mismatch){r.position=null;r.selection=null;render();return}if(m.chapter>=current.chapters.length||m.anchor?.chapter>=current.chapters.length)return;
  if(m.type==='position')r.position=m;
  if(m.type==='selection')r.selection=m.anchor;
  if(m.type==='comment'&&!comments.has(m.id)&&comments.size<500){comments.set(m.id,m);persist()}
  render();
 }
 async function fingerprint(value){const parsed=value.chapters.map(c=>{const doc=new DOMParser().parseFromString(c.html,'text/html');return [c.title,doc.body.textContent]});const bytes=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify(parsed))));return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')}
 function leave(){session++;clearInterval(timer);timer=null;const previous=room;room=null;previous?.close();book=null;selection=null;comments.clear();readers.clear();lastPosition='';el('collabCode').value='';el('collabLeave').disabled=true;el('collabAddComment').disabled=true;el('collabCreate').disabled=false;el('collabJoin').disabled=false;el('collabInvite').readOnly=false;status('Not in a room');render()}
 async function join(code){if(!current)return;if(!api.validCode(code)){status('Enter a 32-character invite code');return}leave();const generation=session,source=current;status('Checking book…');try{const hash=await fingerprint(source);if(generation!==session||source!==current)return;book=hash;room=new api.Room({code,onstatus:status,onmessage:receive,onpeer:(id,connected)=>{if(!room)return;if(connected){readers.set(id,{});lastPosition='';position();for(const c of comments.values())send(c)}else readers.delete(id);render()}});try{const saved=JSON.parse(localStorage.getItem(storageKey())||'[]');if(Array.isArray(saved))for(const c of saved.slice(0,500))if(api.validMessage(c)&&c.type==='comment'&&c.book===book)comments.set(c.id,c)}catch{}
   el('collabCode').value=code;el('collabInvite').value=code;el('collabInvite').readOnly=true;el('collabLeave').disabled=false;el('collabCreate').disabled=true;el('collabJoin').disabled=true;await room.start();if(generation!==session)return;timer=setInterval(position,300);render();
  }catch(error){if(generation!==session)return;leave();status('Could not connect: '+error.message)}}
 el('collabButton').onclick=()=>{closeWordPopup();el('collabDialog').showModal()};
 el('collabCreate').onclick=()=>join(api.random());el('collabJoin').onclick=()=>join(el('collabInvite').value.trim().toLowerCase());el('collabLeave').onclick=leave;
 el('collabCopy').onclick=async()=>{try{await navigator.clipboard.writeText(el('collabCode').value);status('Invite code copied')}catch{el('collabCode').select();status('Select and copy the invite code')}};
 document.addEventListener('selectionchange',()=>{if(document.activeElement?.closest('#collabComposer, #collabDialog'))return;selection=null;if(room&&book&&current){const s=window.getSelection();if(s?.rangeCount&&!s.isCollapsed){const range=s.getRangeAt(0);if(content.contains(range.startContainer)&&content.contains(range.endContainer)){const before=document.createRange();before.selectNodeContents(content);before.setEnd(range.startContainer,range.startOffset);const start=before.toString().length,quote=range.toString();if(quote.trim()&&quote.length<=4000)selection={chapter:current.progress.chapter,start,end:start+quote.length,quote}}}send({type:'selection',anchor:selection})}el('collabAddComment').disabled=!selection});
 el('collabAddComment').onclick=()=>{const body=el('collabCommentBody').value.trim();if(!room||!selection||!body||body.length>2000||comments.size>=500)return;const c={v:1,book,type:'comment',id:api.random(),anchor:{...selection},body};comments.set(c.id,c);persist();send(c);el('collabCommentBody').value='';render()};
 // A non-modal panel lets users select text while writing an inline comment.
 el('collabSelect').onclick=()=>{el('collabDialog').close();el('collabComposer').hidden=false};
 el('collabComposerClose').onclick=()=>{el('collabComposer').hidden=true};
 document.addEventListener('yomori:bookclose',()=>{leave();el('collabComposer').hidden=true});
 document.addEventListener('yomori:chapter',()=>{selection=null;el('collabAddComment').disabled=true;send({type:'selection',anchor:null});lastPosition='';render()});
 new ResizeObserver(()=>{if(room)render()}).observe(content);
 window.addEventListener('online',()=>room?.tick());window.addEventListener('pagehide',leave);
})();
