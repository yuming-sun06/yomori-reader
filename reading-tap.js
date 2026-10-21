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

// Advance only after downward user input, once per wheel burst or touch gesture.
function bindChapterAdvance(root,{canAdvance,atBottom,advance}){
 let active=false,used=true,touch=null,lastWheel=-Infinity;
 const blocked=target=>target?.closest?.('button,a,input,textarea,select,dialog,.reader-top,.reader-bottom,.word-popup');
 const check=()=>{if(!active||used||!canAdvance()||!atBottom())return;used=true;active=false;advance();return true};
 const reset=()=>{active=false;used=true;touch=null;lastWheel=Date.now()};
 root.addEventListener('wheel',event=>{if(blocked(event.target)||event.ctrlKey)return;const now=Date.now();if(now-lastWheel>220)used=false;lastWheel=now;active=event.deltaY>0;if(check()&&event.cancelable)event.preventDefault()},{passive:false});
 root.addEventListener('touchstart',event=>{active=false;used=false;touch=event.touches.length===1&&!blocked(event.target)?event.touches[0].clientY:null},{passive:true});
 root.addEventListener('touchmove',event=>{if(touch===null||event.touches.length!==1)return;const y=event.touches[0].clientY;active=touch-y>12;if(y-touch>12)touch=y;if(check()&&event.cancelable)event.preventDefault()},{passive:false});
 root.addEventListener('touchcancel',reset,{passive:true});
 window.addEventListener('keydown',event=>{if(blocked(event.target)||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;if(!['ArrowDown','PageDown','End',' '].includes(event.key))return;if(!event.repeat)used=false;active=true;if(check())event.preventDefault?.()});
 window.addEventListener('keyup',()=>{active=false});
 window.addEventListener('scroll',check,{passive:true});
 return {reset};
}
