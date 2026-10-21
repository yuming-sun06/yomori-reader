'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const read=name=>fs.readFileSync(path.join(__dirname,name),'utf8');

test('TXT decoding supports UTF-8, GB18030 and UTF-16',()=>{
 const source=read('app.js');const context=vm.createContext({TextDecoder,Uint8Array});
 vm.runInContext(source.slice(source.indexOf('function detectTextEncoding('),source.indexOf('async function previewTXT')),context);
 context.input=Uint8Array.from([0xd6,0xd0,0xce,0xc4]);assert.equal(vm.runInContext('decodeText(input)',context),'中文');
 context.input=Uint8Array.from([0xff,0xfe,...Buffer.from('Chapter 1: A new journey','utf16le')]);assert.equal(vm.runInContext('decodeText(input)',context),'Chapter 1: A new journey');
 context.input=new TextEncoder().encode('A simple English book.');assert.equal(vm.runInContext('decodeText(input)',context),'A simple English book.');
});

test('touch taps fire once while swipes and long presses are ignored',()=>{
 let now=1000;const handlers={},hits=[];const context=vm.createContext({Date:{now:()=>now},Math,window:{getSelection:()=>({toString:()=>''})}});
 vm.runInContext(read('reading-tap.js'),context);context.bindReadingTap({addEventListener:(name,handler)=>handlers[name]=handler},target=>hits.push(target));
 const p={identifier:1,clientX:20,clientY:30},target={};const start=()=>handlers.touchstart({touches:[p],target});const end=point=>handlers.touchend({touches:[],changedTouches:[point||p],target});
 start();now+=100;end();assert.equal(hits.length,1);now+=300;handlers.click({target,button:0});assert.equal(hits.length,1);
 now+=2000;start();handlers.touchmove({touches:[{...p,clientY:80}]});end({...p,clientY:80});assert.equal(hits.length,1);
 now+=2000;start();now+=900;end();assert.equal(hits.length,1);
});

test('UI language changes are reversible and do not change book content',()=>{
 const source=read('ui-language.js');const context=vm.createContext({WeakMap,localStorage:{getItem:()=>null}});
 vm.runInContext(source.slice(0,source.indexOf("document.getElementById('uiLanguage').addEventListener")),context);
 assert.equal(context.translateUI('阅读设置'),'Reading settings');
 assert.equal(context.translateUI('第 3 节 · 已读 42%'),'Section 3 · 42% read');
 const node={data:'阅读设置',parentElement:{closest:()=>null}};context.localizeTextNode(node);assert.equal(node.data,'Reading settings');
 vm.runInContext("uiLanguage='zh-CN'",context);context.localizeTextNode(node);assert.equal(node.data,'阅读设置');
 vm.runInContext("uiLanguage='en'",context);const bookNode={data:'阅读设置',parentElement:{closest:()=>({id:'readingContent'})}};context.localizeTextNode(bookNode);assert.equal(bookNode.data,'阅读设置');
});

test('all linked local app assets exist and hosting identity is excluded',()=>{
 const html=read('index.html');for(const [,name] of html.matchAll(/(?:src|href)="\.\/([^"]+)"/g)){assert(fs.existsSync(path.join(__dirname,name)),name)}
 const manifest=JSON.parse(read('manifest.webmanifest'));for(const icon of manifest.icons)assert(fs.existsSync(path.join(__dirname,icon.src)));
 assert(!fs.existsSync(path.join(__dirname,'.openai')));assert(!fs.existsSync(path.join(__dirname,'.env')));
});

test('chapter scrolling advances once per downward gesture and ignores restoration',()=>{
 let now=1000,bottom=false,allowed=true,hits=0;
 const rootEvents={},windowEvents={};
 const context=vm.createContext({Date:{now:()=>now},window:{addEventListener:(name,handler)=>windowEvents[name]=handler}});
 vm.runInContext(read('reading-tap.js'),context);
 const root={addEventListener:(name,handler)=>rootEvents[name]=handler};
 const controller=context.bindChapterAdvance(root,{canAdvance:()=>allowed,atBottom:()=>bottom,advance:()=>{hits++;controller.reset()}});
 const target={closest:()=>null};
 const wheel=deltaY=>rootEvents.wheel({target,deltaY});
 // A long chapter advances only when downward scrolling reaches the bottom.
 wheel(100);windowEvents.scroll();assert.equal(hits,0);
 bottom=true;windowEvents.scroll();assert.equal(hits,1);
 // Momentum cannot skip a second, short chapter.
 now+=50;wheel(100);windowEvents.scroll();assert.equal(hits,1);
 now+=500;wheel(100);assert.equal(hits,2);
 now+=500;wheel(-100);windowEvents.scroll();assert.equal(hits,2);
 // Restoring progress and the last chapter/dialog guard never trigger navigation.
 controller.reset();windowEvents.scroll();assert.equal(hits,2);
 allowed=false;now+=500;wheel(100);assert.equal(hits,2);
 allowed=true;
 // Even a chapter shorter than the viewport can advance with an upward swipe.
 rootEvents.touchstart({target,touches:[{clientY:400}]});
 rootEvents.touchmove({touches:[{clientY:300}]});assert.equal(hits,3);
 rootEvents.touchmove({touches:[{clientY:200}]});windowEvents.scroll();assert.equal(hits,3);
 rootEvents.touchstart({target,touches:[{clientY:200}]});
 rootEvents.touchmove({touches:[{clientY:300}]});windowEvents.scroll();assert.equal(hits,3);
 rootEvents.touchcancel();windowEvents.scroll();assert.equal(hits,3);
 // Navigation controls and settings do not count as reading gestures.
 now+=500;rootEvents.wheel({target:{closest:()=>({})},deltaY:100});assert.equal(hits,3);
 windowEvents.keydown({target,key:'PageDown',repeat:false});assert.equal(hits,4);
 windowEvents.keydown({target,key:'PageDown',repeat:true});assert.equal(hits,4);
 windowEvents.keyup();windowEvents.keydown({target,key:'PageDown',repeat:false});assert.equal(hits,5);
});

test('scrolling toward the top returns to the previous chapter once per gesture',()=>{
 let now=1000,top=false,allowed=true,hits=0;
 const rootEvents={},windowEvents={};
 const context=vm.createContext({Date:{now:()=>now},window:{addEventListener:(name,handler)=>windowEvents[name]=handler}});
 vm.runInContext(read('reading-tap.js'),context);
 const controller=context.bindChapterAdvance({addEventListener:(n,h)=>rootEvents[n]=h},{canAdvance:()=>false,atBottom:()=>false,advance:()=>assert.fail('Wrong direction'),canRetreat:()=>allowed,atTop:()=>top,retreat:()=>{hits++;controller.reset()}});
 const target={closest:()=>null};const wheel=deltaY=>rootEvents.wheel({target,deltaY});
 wheel(-100);windowEvents.scroll();assert.equal(hits,0);
 top=true;windowEvents.scroll();assert.equal(hits,1);
 now+=50;wheel(-100);windowEvents.scroll();assert.equal(hits,1);
 now+=500;wheel(-100);assert.equal(hits,2);
 controller.reset();windowEvents.scroll();assert.equal(hits,2);
 // At the first chapter or with a dialog open, the guard blocks navigation.
 allowed=false;now+=500;wheel(-100);assert.equal(hits,2);allowed=true;
 rootEvents.touchstart({target,touches:[{clientY:200}]});
 rootEvents.touchmove({touches:[{clientY:300}]});assert.equal(hits,3);
 rootEvents.touchmove({touches:[{clientY:400}]});windowEvents.scroll();assert.equal(hits,3);
 rootEvents.touchstart({target,touches:[{clientY:400}]});
 rootEvents.touchmove({touches:[{clientY:200}]});assert.equal(hits,3);
 windowEvents.keydown({target,key:'PageUp',repeat:false});assert.equal(hits,4);
 windowEvents.keydown({target,key:'PageUp',repeat:true});assert.equal(hits,4);
 windowEvents.keyup();windowEvents.keydown({target,key:' ',shiftKey:true,repeat:false});assert.equal(hits,5);
});
