'use strict';
// Handle the real touch end, rather than waiting for iOS's synthetic click.
function bindReadingTap(root,onTap){
 let touch=null,suppressClickUntil=0;
 const selected=()=>window.getSelection()?.toString().trim()||'';
 const element=target=>target?.nodeType===3?target.parentElement:target;
 root.addEventListener('touchstart',event=>{suppressClickUntil=Date.now()+1000;if(event.touches.length!==1){touch=null;return}const p=event.touches[0];touch={id:p.identifier,x:p.clientX,y:p.clientY,time:Date.now(),moved:false,selection:selected()}},{passive:true});
 root.addEventListener('touchmove',event=>{if(!touch)return;const p=[...event.touches].find(p=>p.identifier===touch.id);if(!p||Math.hypot(p.clientX-touch.x,p.clientY-touch.y)>12)touch.moved=true},{passive:true});
 root.addEventListener('touchcancel',()=>{touch=null;suppressClickUntil=Date.now()+1000},{passive:true});
 root.addEventListener('touchend',event=>{suppressClickUntil=Date.now()+1000;const start=touch;touch=null;if(!start||start.moved||event.touches.length)return;const p=[...event.changedTouches].find(p=>p.identifier===start.id);if(!p||Math.hypot(p.clientX-start.x,p.clientY-start.y)>12||Date.now()-start.time>600)return;const selection=selected();if(selection&&selection!==start.selection)return;onTap(element(event.target),{kind:'touch',selectionAtStart:start.selection})},{passive:true});
 root.addEventListener('click',event=>{if(Date.now()<suppressClickUntil||(event.button!==undefined&&event.button!==0))return;onTap(element(event.target),{kind:'click',selectionAtStart:''})});
}
