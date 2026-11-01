// Cumulative installed editor regression plus native webview interactions.
if(!process.env.INTERLIS_GUI_DIAGRAM_ONLY)require('./editor.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {By,Key,WebView}=require('vscode-extension-tester');const ui=require('./workbench.cjs');
const evidence=process.env.INTERLIS_GUI_EVIDENCE;let webview,original,dirty,sourceHash,nodeTransform,edgeIdentity;
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
async function back(){await ui.driver.switchTo().defaultContent();}
async function openSource(name){await back();await ui.palette('View: Focus First Editor Group');await ui.openFile(name);}
async function enter(){await back();await ui.driver.wait(async()=>{for(const frame of await ui.driver.findElements(By.css('iframe.webview.ready'))){if(!await frame.isDisplayed())continue;await ui.driver.switchTo().frame(frame);const inner=await ui.driver.findElements(By.id('active-frame'));if(inner.length){await ui.driver.switchTo().frame(inner[0]);if((await ui.driver.findElements(By.id('canvas'))).length)return true;}await back();}return false;},15000,'Visible UML webview missing');}
async function fresh(){await ui.waitFor(async()=>['FRESH','PARTIAL'].includes(await (await ui.driver.findElement(By.id('canvas'))).getAttribute('data-status')),'Diagram did not reach a current real view');}
async function click(id){await (await ui.driver.findElement(By.id(id))).click();}
async function rect(element){return element.getRect();}
async function dragElement(element,dx,dy){await ui.driver.actions().move({origin:element}).press().move({x:dx,y:dy,origin:'pointer',duration:500}).release().perform();}
async function node(label){return ui.driver.findElement(By.css('[data-label='+JSON.stringify(label)+']'));}
async function unchanged(){await back();await openSource('Interactive.ili');assert.equal(await ui.copyText(),original);assert.equal(await ui.editor.isDirty(),dirty);assert.equal(digest(path.join(evidence,'Unicode Modelle/Interactive.ili')),sourceHash);}
function record(id,actions,assertions){ui.record(id,actions,assertions);}
async function copySelection(){const clipboard=(await import('clipboardy')).default,previous=clipboard.readSync();try{clipboard.writeSync('interlis-selection-pending');await ui.driver.actions().keyDown(Key.COMMAND).sendKeys('c').keyUp(Key.COMMAND).perform();await ui.waitFor(()=>clipboard.readSync()!=='interlis-selection-pending','Native selected-text copy did not finish');return clipboard.readSync();}finally{clipboard.writeSync(previous);}}

describe('Installed live Java diagram and native Sprotty editor',function(){
 this.timeout(120000);this.bail(true);
 before(async()=>{if(process.env.INTERLIS_GUI_DIAGRAM_ONLY){await ui.initialize();await openSource('Example.ili');await ui.waitFor(()=>ui.status('Ready'),'Server did not initialize');}});
 afterEach(async function(){if(this.currentTest.state==='failed'){await ui.capture('failure-'+this.currentTest.title.slice(0,6));fs.writeFileSync(path.join(evidence,'failure-uml-dom.html'),await ui.driver.getPageSource());fs.writeFileSync(path.join(evidence,'failure-uml.json'),JSON.stringify({message:this.currentTest.err?.message,stack:this.currentTest.err?.stack},null,2));}await back();});
 it('GUI-12 opens the selected actual Java model in its real Sprotty custom editor',async()=>{
  await openSource('Interactive.ili');original=await ui.copyText();dirty=await ui.editor.isDirty();sourceHash=digest(path.join(evidence,'Unicode Modelle/Interactive.ili'));
  await ui.palette('INTERLIS: Show Diagram for This File');await enter();await fresh();
  assert.equal(await (await ui.driver.findElement(By.id('follow'))).getText(),'Pinned');
  for(const kind of ['MODEL','TOPIC','CLASS','STRUCTURE','DOMAIN','VIEW','ASSOCIATION'])assert.ok((await ui.driver.findElements(By.css('[data-kind="'+kind+'"]'))).length>0,'Missing semantic kind '+kind);
  assert.ok((await ui.driver.findElements(By.css('svg.sprotty-graph .sprotty-edge'))).length>=10);
  assert.ok((await (await node('State')).getText()).includes('first'));assert.ok((await (await node('State')).getText()).includes('second'));assert.ok((await (await node('A')).findElements(By.css('[data-compartment=CONSTRAINTS]'))).length>0);await ui.capture('GUI-12-current');
  fs.writeFileSync(path.join(evidence,'GUI-12-view-dom.html'),await ui.driver.getPageSource());
  record('GUI-12',['open Interactive.ili from Explorer','Show Diagram for This File command','wait for current custom editor'],['MODEL/TOPIC and actual projected node categories','real SVG Sprotty edges','pinned default','current Java result']);
 });
 it('GUI-13 moves a node and a complete topic with native pointer drag and preserves source',async()=>{
  await enter();await fresh();await click('fit');let a=await node('A'),r=await rect(a);const before=await a.getAttribute('transform');const edgeBefore=await ui.driver.executeScript('return [...document.querySelectorAll(".sprotty-edge path")].map(e=>e.getAttribute("d"))');
  await ui.capture('GUI-13-before');await dragElement(await a.findElement(By.css('.interlis-title')),55,25);await ui.waitFor(async()=>await a.getAttribute('transform')!==before,'Node did not move');nodeTransform=await a.getAttribute('transform');
  const edgesAfter=await ui.driver.executeScript('return [...document.querySelectorAll(".sprotty-edge path")].map(e=>e.getAttribute("d"))');assert.notDeepEqual(edgesAfter,edgeBefore);await ui.capture('GUI-13-node-moved');
  const topic=await ui.driver.findElement(By.css('[data-kind="TOPIC"]')),t=await rect(topic),childBefore=await rect(a),topicBefore=await topic.getAttribute('transform');await dragElement(await topic.findElement(By.css('.interlis-title')),40,20);await ui.waitFor(async()=>await topic.getAttribute('transform')!==topicBefore,'Topic did not move');const childAfter=await rect(a);assert.ok(childAfter.x-childBefore.x>25);assert.ok(childAfter.y-childBefore.y>10);
  await ui.capture('GUI-13-container-moved');fs.writeFileSync(path.join(evidence,'GUI-13-geometry.json'),JSON.stringify({before,nodeTransform,topicBefore,topicAfter:await topic.getAttribute('transform'),childBefore,childAfter},null,2));await unchanged();
  record('GUI-13',['native mouse drag class A','native mouse drag Topic header','copy buffer through native clipboard'],['node and incident paths moved','children move with container','disk hash text and dirty state unchanged']);
 });
 it('GUI-14 edits a real interior route without reconnecting semantic endpoints',async()=>{
  await enter();await fresh();await click('fit');const pair=await ui.driver.executeScript('const groups=new Map();for(const e of document.querySelectorAll(".sprotty-edge")){const key=e.dataset.source+"→"+e.dataset.target;const values=groups.get(key)||[];values.push(e.dataset.edgeId);groups.set(key,values);}return [...groups.values()].find(values=>values.length>=2);');assert.ok(pair,'Expected actual parallel role edges');const id=pair.at(-1),edge=await ui.driver.findElement(By.css('.sprotty-edge[data-edge-id='+JSON.stringify(id)+']'));const line=await edge.findElement(By.css('path'));
  edgeIdentity=[await edge.getAttribute('data-source'),await edge.getAttribute('data-target')];
  const before=await line.getAttribute('d'),other=await ui.driver.executeScript('return Object.fromEntries([...document.querySelectorAll(".sprotty-edge")].map(e=>[e.dataset.edgeId,e.querySelector("path")?.getAttribute("d")]))');
  const hit=await ui.driver.executeScript('const p=arguments[0],edge=p.closest(".sprotty-edge");for(const fraction of Array.from({length:39},(_,i)=>(i+1)/40)){const point=p.getPointAtLength(p.getTotalLength()*fraction),s=new DOMPoint(point.x,point.y).matrixTransform(p.getScreenCTM());if(document.elementFromPoint(s.x,s.y)?.closest(".sprotty-edge")===edge)return {x:s.x,y:s.y};}return null;',line);assert.ok(hit,'No visible selectable edge segment');
  const canvas=await ui.driver.findElement(By.id('canvas')),canvasBox=await ui.driver.executeScript('const r=arguments[0].getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};',canvas);await ui.driver.actions().move({origin:canvas,x:Math.round(hit.x-canvasBox.x-canvasBox.width/2),y:Math.round(hit.y-canvasBox.y-canvasBox.height/2)}).click().perform();
  await ui.waitFor(async()=>(await ui.driver.findElements(By.css('[data-edge-id='+JSON.stringify(id)+'] [data-handle-kind]'))).length>0,'Interior handles missing');
  assert.equal((await ui.driver.findElements(By.css('[data-handle-kind="source"],[data-handle-kind="target"]'))).length,0);
  const handle=await ui.driver.findElement(By.css('[data-edge-id='+JSON.stringify(id)+'] [data-handle-kind]')),r=await rect(handle);await ui.capture('GUI-14-handle-before');await dragElement(handle,28,28);
  await ui.waitFor(async()=>await line.getAttribute('d')!==before,'Route did not change');assert.deepEqual([await edge.getAttribute('data-source'),await edge.getAttribute('data-target')],edgeIdentity);
  const after=await ui.driver.executeScript('return Object.fromEntries([...document.querySelectorAll(".sprotty-edge")].map(e=>[e.dataset.edgeId,e.querySelector("path")?.getAttribute("d")]))');for(const [otherId,d]of Object.entries(other))if(otherId!==id)assert.equal(after[otherId],d,'Unrelated edge route changed');
  await ui.capture('GUI-14-route-after');fs.writeFileSync(path.join(evidence,'GUI-14-route.json'),JSON.stringify({id,edgeIdentity,before,after:await line.getAttribute('d')},null,2));await unchanged();
  record('GUI-14',['click real edge path','drag native routing handle','check another route'],['route changed','no source/target handles','semantic endpoints unchanged','other routes unchanged','source unchanged']);
 });
 it('GUI-15 navigates exact CRLF emoji class member association and readonly imported anchors',async()=>{
  for(const [label,needle,member]of [['A','CLASS A=',false],['number','number:Number',true],['Many','ASSOCIATION Many=',false]]){
   await enter();await fresh();const target=member?await (await node('A')).findElement(By.css('[data-member-id]')):await node(label);
   await ui.driver.actions().doubleClick(target).perform();await back();await ui.waitEditor('Interactive.ili');
   const lines=original.split(/\r?\n/),line=lines.findIndex(text=>text.includes(needle)),column=lines[line].indexOf(needle)+(member?0:needle.lastIndexOf(label))+1;
   await ui.waitFor(async()=>{const p=await ui.editor.getCoordinates();return p[0]===line+1&&p[1]===column+label.length;},'Wrong exact selected source range for '+label);
   assert.equal(await copySelection(),label);
   await ui.capture('GUI-15-'+label);assert.equal(await ui.copyText(),original);
  }
  await openSource('External.ili');await ui.palette('INTERLIS: Show Diagram for This File');await enter();await fresh();const remote=await node('RemoteHeight');await ui.driver.actions().doubleClick(remote).perform();await back();await ui.waitEditor('RemoteMiddle.ili');
  const before=await ui.copyText();assert.match(await ui.editor.getFileUri(),/interlis-source/);await ui.go(4,8);await ui.driver.actions().sendKeys('READONLY_ATTACK').perform();assert.equal(await ui.copyText(),before);assert.equal(await ui.editor.isDirty(),false);await ui.capture('GUI-15-readonly');
  // Return to the original pinned diagram through the real command.
  await openSource('Interactive.ili');await ui.palette('INTERLIS: Show Diagram for This File');
  record('GUI-15',['double click class member and association','double click imported domain','type into readonly import'],['exact UTF-16 line/column after CRLF/emoji','correct URI','readonly imported source remains unchanged']);
 });
 it('GUI-16 preserves ternary attribution composition end notation and actual self edges',async()=>{
  await enter();await fresh();const many=await node('Many'),text=await many.getText();for(const label of ['one','two','three','note'])assert.ok(text.includes(label),'N-ary association lost '+label);
  const composition=await ui.driver.findElements(By.css('[data-aggregation="COMPOSITION"]'));assert.ok(composition.length>0,'Composition marker missing');await ui.capture('GUI-16-entity');
  const select=await ui.driver.findElement(By.id('association'));await select.findElement(By.css('option[value="COMPACT_BINARY"]')).click();await fresh();
  await ui.waitFor(async()=>await ui.driver.executeScript('return [...document.querySelectorAll(".sprotty-edge")].some(e=>e.dataset.source===e.dataset.target)'),'Compact self relationship not rendered');
  assert.ok((await (await node('Many')).getText()).includes('note'));assert.ok(await ui.driver.executeScript('const groups={};for(const e of document.querySelectorAll(".sprotty-edge")){const key=e.dataset.source+"→"+e.dataset.target;groups[key]=(groups[key]||0)+1;}return Object.values(groups).some(count=>count>=2);'),'Parallel semantic associations were lost');const labels=await ui.driver.executeScript('return [...document.querySelectorAll(".interlis-end-label")].map(e=>({text:e.textContent,box:(()=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};})()}))');
  for(const role of ['parent','children','owner','items','one','two','three'])assert.ok(labels.some(label=>label.text.includes(role)),'Missing end role '+role);
  for(let i=0;i<labels.length;i++)for(let j=i+1;j<labels.length;j++){const a=labels[i].box,b=labels[j].box;assert.ok(!(a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y),'End labels overlap: '+labels[i].text+' / '+labels[j].text);}
  await ui.capture('GUI-16-compact-self');fs.writeFileSync(path.join(evidence,'GUI-16-end-labels.json'),JSON.stringify(labels,null,2));await unchanged();
  record('GUI-16',['inspect ternary association members','select Compact binary through native option','inspect self path and end notation'],['three roles and own attribute retained','composition diamond present','self edge visible','all role/cardinality labels readable without overlaps','source unchanged']);
 });
 it('GUI-17 rejects a held actual worker response and preserves a manually moved stable node',async()=>{
  await enter();await fresh();const before=await (await node('A')).getAttribute('transform');
  // Controlled transport fault: hold one genuine ELK result after computation. No success or model is fabricated.
  await ui.driver.executeScript(`const NativeWorker=window.Worker;window.__heldLayouts=[];window.__holdNextLayout=true;window.Worker=class extends NativeWorker {set onmessage(callback){super.onmessage=event=>{if(window.__holdNextLayout&&event.data?.data?.children){window.__holdNextLayout=false;window.__heldLayouts.push(()=>callback.call(this,event));}else callback.call(this,event);};}};`);
  await click('refresh');await ui.waitFor(async()=>await ui.driver.executeScript('return window.__heldLayouts.length===1'),'Actual layout response was not held');await ui.capture('GUI-17-held');
  await back();await openSource('Interactive.ili');const partial=original.replace('CLASS C=END C;','CLASS C=partialAttribute:MissingDiagramType;END C;');await ui.replaceText(partial);await enter();await ui.waitFor(async()=>await (await ui.driver.findElement(By.id('canvas'))).getAttribute('data-status')==='PARTIAL','Erroneous source was not marked partial');await ui.capture('GUI-17-partial');
  await back();await openSource('Interactive.ili');const changed=original.replace('CLASS C=END C;','CLASS C=newAttribute:TEXT*12;END C;');await ui.replaceText(changed);assert.equal(await ui.copyText(),changed);
  await enter();await ui.waitFor(async()=>await ui.driver.executeScript('return document.querySelector("[data-label=\\"C\\"]")?.textContent.includes("newAttribute")&&["FRESH","PARTIAL"].includes(document.getElementById("canvas").dataset.status)'),'Current source did not replace the held generation');
  const current=await (await node('A')).getAttribute('transform');assert.equal(current,before,'Stable moved node lost its position');
  await ui.driver.executeScript('for(const release of window.__heldLayouts.splice(0))release();');await ui.waitFor(async()=>(await (await node('C')).getText()).includes('newAttribute'),'Late result replaced current view');assert.equal(await (await node('A')).getAttribute('transform'),before);await ui.capture('GUI-17-current');
  await back();await openSource('Interactive.ili');await ui.replaceText(original);assert.equal(await ui.copyText(),original);await enter();await fresh();
  record('GUI-17',['hold one real ELK Worker response','add source attribute with native paste','wait for newer live analysis','release the old actual response'],['current attribute shown','obsolete worker cannot publish','stable moved node retains geometry','source changes only through explicit text editing']);
 });
 it('GUI-18 keeps explicit panels isolated and follows another ILI file only after explicit activation',async()=>{
  await enter();await fresh();assert.equal(await (await ui.driver.findElement(By.id('follow'))).getText(),'Pinned');const firstRoot=await (await ui.driver.findElement(By.id('root'))).getText();assert.match(firstRoot,/Interactive\.ili$/);
  await back();await openSource('Other.ili');await enter();assert.equal(await (await ui.driver.findElement(By.id('root'))).getText(),firstRoot,'Pinned diagram silently followed the other editor');
  await click('follow');await ui.waitFor(async()=>await (await ui.driver.findElement(By.id('follow'))).getText()==='Following','Follow was not enabled');await back();await openSource('Other.ili');await enter();await fresh();await ui.waitFor(async()=>/Other\.ili$/.test(await (await ui.driver.findElement(By.id('root'))).getText()),'Explicit follow did not switch source');assert.ok((await (await node('A')).getText()).includes('otherAttribute'));
  await click('follow');await back();await openSource('Other.ili');await ui.palette('INTERLIS: Show Diagram for This File');await enter();await fresh();const other=await node('A');await dragElement(await other.findElement(By.css('.interlis-title')),45,18);const otherPosition=await other.getAttribute('transform'),otherId=await other.getAttribute('data-element-id');await openSource('Interactive.ili');await ui.palette('INTERLIS: Show Diagram for This File');await enter();await fresh();await ui.capture('GUI-18-parallel');
  // Two separately opened custom documents remain independent, including their opaque root labels.
  assert.match(await (await ui.driver.findElement(By.id('root'))).getText(),/Interactive\.ili$/);assert.ok(!(await (await node('A')).getText()).includes('otherAttribute'));assert.notEqual(await (await node('A')).getAttribute('data-element-id'),otherId);
  await openSource('Other.ili');await ui.palette('INTERLIS: Show Diagram for This File');await enter();await fresh();assert.equal(await (await node('A')).getAttribute('transform'),otherPosition,'Other panel lost its own dragged geometry');await ui.capture('GUI-18-other-retained');
  record('GUI-18',['activate B while A is pinned','explicitly enable Follow','activate B again','pin B and open A separately'],['pinned A retains source','only explicit follow switches to B','A/B labels and layout are separate']);
 });
});
