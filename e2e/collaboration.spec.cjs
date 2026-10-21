const {test,expect}=require('@playwright/test');
const {importBook,expectChapter}=require('./helpers.cjs');

// Real RTC connections; only public relay discovery is replaced with a local bus.
// Two isolated browser contexts represent independent devices and local storage.
test('two readers share position, selection and comments and reconnect',async({browser})=>{
 test.setTimeout(60000);
 const contexts=await Promise.all([browser.newContext(),browser.newContext()]);
 const pages=await Promise.all(contexts.map(c=>c.newPage()));
 try{
  test.skip(!await pages[0].evaluate(()=>typeof RTCPeerConnection==='function'),'This browser build does not include WebRTC');
  for(let i=0;i<2;i++){
   await pages[i].exposeFunction('testSignal',async m=>{await pages[1-i].evaluate(m=>window.relayReceiver?.(m),m)});
   await importBook(pages[i]);
   await pages[i].evaluate(()=>{
    const Original=YomoriCollaboration.Room,Native=RTCPeerConnection;
    window.connections=[];
    class LocalRelay{constructor(code,receive){window.relayReceiver=receive}async start(){}async send(m){await window.testSignal(m)}close(){window.relayReceiver=null}}
    class LocalRTC{constructor(){const pc=new Native({iceServers:[]});window.connections.push(pc);return pc}}
    YomoriCollaboration.Room=class extends Original{constructor(options){super({...options,RelayClass:LocalRelay,PeerConnection:LocalRTC})}};
   });
  }
  const [a,b]=pages;
  await a.locator('#collabButton').click();await a.locator('#collabCreate').click();
  await expect(a.locator('#collabCode')).toHaveValue(/^[a-f0-9]{32}$/);
  const code=await a.locator('#collabCode').inputValue();
  await b.locator('#collabButton').click();await b.locator('#collabInvite').fill(code);await b.locator('#collabJoin').click();
  await expect(a.locator('#collabReaders')).toContainText('section 1',{timeout:15000});
  await expect(b.locator('#collabReaders')).toContainText('section 1');
  await a.locator('#collabDialog .close').click();await a.locator('#nextChapter').click();
  await expect(b.locator('#collabReaders')).toContainText('section 2');await expectChapter(b,1);
  await b.locator('#collabReaders button').click();await expectChapter(b,2);
  await a.locator('#collabButton').click();await a.locator('#collabSelect').click();
  await a.evaluate(()=>{const node=document.querySelector('#readingContent p .tap-word').firstChild;const r=document.createRange();r.setStart(node,0);r.setEnd(node,8);const s=getSelection();s.removeAllRanges();s.addRange(r)});
  await expect(a.locator('#collabAddComment')).toBeEnabled();
  if(await b.evaluate(()=>!!CSS.highlights))await expect.poll(()=>b.evaluate(()=>CSS.highlights.get('collab')?.size||0)).toBeGreaterThan(0);
  await a.locator('#collabCommentBody').fill('<img src=x onerror=alert(1)> a shared thought');await a.locator('#collabAddComment').click();
  await expect(b.locator('.collab-note')).toHaveCount(1);await b.locator('.collab-note').click();
  await expect(b.locator('#collabComments')).toContainText('<img src=x onerror=alert(1)> a shared thought');
  await expect(b.locator('#collabComments img')).toHaveCount(0);
  // Destroy data channels; the presence loop must negotiate fresh RTC sessions.
  await a.evaluate(()=>{for(const pc of window.connections)pc.close()});
  await expect.poll(()=>a.evaluate(()=>window.connections.length),{timeout:25000}).toBeGreaterThan(1);
  await expect(b.locator('#collabReaders')).toContainText('section 2',{timeout:25000});
  await expect(b.locator('#collabComments li')).toHaveCount(1);
  await b.locator('#collabLeave').click();await expect(b.locator('#collabReaders')).toBeEmpty();await expect(b.locator('.collab-note')).toHaveCount(0);
  await b.locator('#collabJoin').click();await expect(b.locator('#collabComments li')).toHaveCount(1);
 }finally{await Promise.all(contexts.map(c=>c.close()))}
});

test('collaboration UI validates book identity and anchors, preserves selection and persists comments',async({page})=>{
 await importBook(page);
 await page.evaluate(()=>{YomoriCollaboration.Room=class{constructor(options){this.options=options;this.sent=[];window.mockRoom=this;this.code=options.code}async start(){this.options.onpeer('f'.repeat(32),true)}broadcast(m){this.sent.push(m)}close(){}tick(){}}});
 await page.locator('#collabButton').click();await page.locator('#collabCreate').click();
 await expect(page.locator('#collabLeave')).toBeEnabled();
 await page.evaluate(()=>{const m=mockRoom.sent.find(m=>m.type==='position');mockRoom.options.onmessage('f'.repeat(32),{...m,chapter:1,fraction:0.5})});
 await expect(page.locator('#collabReaders')).toContainText('section 2');await expectChapter(page,1);
 await page.evaluate(()=>{const m=mockRoom.sent[0];mockRoom.options.onmessage('f'.repeat(32),{...m,book:'e'.repeat(64)})});
 await expect(page.locator('#collabReaders')).toContainText('different book');await expect(page.locator('#collabReaders button')).toBeDisabled();
 await page.locator('#collabSelect').click();
 await page.evaluate(()=>{const n=document.querySelector('#readingContent p .tap-word').firstChild,r=document.createRange();r.setStart(n,0);r.setEnd(n,8);getSelection().removeAllRanges();getSelection().addRange(r)});
 await expect(page.locator('#collabAddComment')).toBeEnabled();
 await page.locator('#collabCommentBody').fill('<img src=x onerror=alert(1)> safe text');await page.locator('#collabAddComment').click();
 await expect(page.locator('.collab-note')).toHaveCount(1);
 await page.locator('#collabComposerClose').click();await page.locator('#collabButton').click();
 await expect(page.locator('#collabComments')).toContainText('<img src=x onerror=alert(1)> safe text');await expect(page.locator('#collabComments img')).toHaveCount(0);
 await page.locator('#collabLeave').click();await expect(page.locator('.collab-note')).toHaveCount(0);await page.locator('#collabJoin').click();await expect(page.locator('#collabComments li')).toHaveCount(1);
});
