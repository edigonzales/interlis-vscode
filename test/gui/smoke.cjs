const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {VSBrowser,Workbench,TextEditor,ProblemsView,MarkerType,By,Key}=require('vscode-extension-tester');
const evidence=process.env.INTERLIS_GUI_EVIDENCE;if(!evidence)throw new Error('Missing GUI evidence directory');
const completed=[];let driver,wb,editor;
async function capture(name){fs.writeFileSync(path.join(evidence,name+'.png'),await driver.takeScreenshot(),'base64');}
async function waitFor(fn,message){await driver.wait(async()=>{try{return await fn();}catch{return false;}},20000,message);}
async function readText(){return await driver.executeScript('return [...document.querySelectorAll(".monaco-editor .view-lines .view-line")].map(e=>e.textContent.replace(/\\u00a0/g," ").replace(/\\u200b/g,"")).join("\\n")');}
async function focusEditor(){await driver.actions().clear();await driver.wait(async()=>{try{for(const span of await driver.findElements(By.css('.monaco-editor .view-lines .view-line span span')))if((await span.getText()).trim()&&await span.isDisplayed()){await span.click();return true;}return false;}catch(error){if(error.name==='StaleElementReferenceError')return false;throw error;}},5000,'No stable visible editor text to focus');}
async function palette(command, raw=false){
 await driver.actions().clear();await driver.actions().sendKeys(Key.F1).perform();
 const input=await driver.wait(async()=>{const fields=await driver.findElements(By.css('.quick-input-widget input'));for(const field of fields)if(await field.isDisplayed())return field;return false;},5000,'Palette input not visible');
 await input.sendKeys(Key.chord(Key.COMMAND,'a'),raw?command:'>'+command);
 await waitFor(async()=>await input.getAttribute('value')===(raw?command:'>'+command),'Palette text mismatch');
 if(!raw){await waitFor(async()=>{const rows=await driver.findElements(By.css('.quick-input-list .monaco-list-row'));for(const row of rows)if((await row.getText()).split('\n')[0]===command){await row.click();return true;}return false;},'Command not offered: '+command);}
 else await driver.actions().sendKeys(Key.ENTER).perform();
 await waitFor(async()=>{const widgets=await driver.findElements(By.css('.quick-input-widget'));return (await Promise.all(widgets.map(x=>x.isDisplayed()))).every(x=>!x);},'Palette did not close');await driver.actions().clear();
}
async function go(line,col){
 await focusEditor();await driver.actions().keyDown(Key.CONTROL).sendKeys('g').keyUp(Key.CONTROL).perform();
 const input=await driver.wait(async()=>{for(const field of await driver.findElements(By.css('.quick-input-widget input')))if(await field.isDisplayed())return field;return false;},5000,'Go to line input not visible');
 await input.sendKeys(Key.chord(Key.COMMAND,'a'),':'+line+','+col);await input.sendKeys(Key.ENTER);
 await waitFor(async()=>{const p=await editor.getCoordinates();return p[0]===line&&p[1]===col;},'Cursor did not reach target');
}
async function select(line,col,length){await go(line,col);await driver.actions().keyDown(Key.SHIFT).sendKeys(...Array(length).fill(Key.RIGHT)).keyUp(Key.SHIFT).perform();}
async function replaceText(text){
 const clipboard=(await import('clipboardy')).default;const previous=clipboard.readSync();
 try{clipboard.writeSync(text);await focusEditor();await driver.actions().keyDown(Key.COMMAND).sendKeys('a').keyUp(Key.COMMAND).keyDown(Key.COMMAND).sendKeys('v').keyUp(Key.COMMAND).perform();await waitFor(async()=>await readText()===text,'Pasted buffer differs from prepared text');}
 finally{clipboard.writeSync(previous);}
}
async function status(text){return !!await wb.getStatusBar().getItem(`INTERLIS: ${text}`);}
function record(id,actions,assertions){completed.push({id,actions,assertions,at:new Date().toISOString()});fs.writeFileSync(path.join(evidence,'cases.json'),JSON.stringify(completed,null,2));}
describe('Installed INTERLIS editor smoke',function(){
 this.timeout(120000);
 before(async()=>{driver=VSBrowser.instance.driver;wb=new Workbench();await VSBrowser.instance.waitForWorkbench();});
 afterEach(async function(){if(this.currentTest.state==='failed'){await capture('failure-'+this.currentTest.title.slice(0,6));fs.writeFileSync(path.join(evidence,'failure-dom.html'),await driver.getPageSource());}});
 it('GUI-01 installs and activates its own real language server from Explorer',async()=>{
  await palette('View: Show Explorer');
  const file=await driver.wait(async()=>{const files=await driver.findElements(By.css('[role="tree"][aria-label="Files Explorer"] [role="treeitem"][aria-label="Example.ili"]'));return files[0];},15000,'Fixture missing in Explorer');
  await driver.actions().doubleClick(file).perform();editor=new TextEditor();
  await waitFor(()=>status(process.env.INTERLIS_GUI_CANARY?'Impossible readiness canary':'Ready'),process.env.INTERLIS_GUI_CANARY?'Negative canary: impossible visible status was not present':'Packaged server did not become ready');
  assert.equal(await wb.getStatusBar().getCurrentLanguage(),'INTERLIS');
  assert.match(await readText(),/MODEL Example/);
  await capture('GUI-01-ready');
  record('GUI-01',['Explorer double click Example.ili','wait visible INTERLIS Ready'],['language INTERLIS','real source visible','server ready']);
 });
 it('GUI-02 types a real type error, navigates Problems and corrects it',async()=>{
  await select(8,16,6);await driver.actions().sendKeys('MissingHeight').perform();
  await palette('View: Toggle Problems');
  const problems=new ProblemsView();
  await waitFor(async()=>(await problems.getAllVisibleMarkers(MarkerType.Error)).length>0,'Missing live type diagnostic');
  const errors=await problems.getAllVisibleMarkers(MarkerType.Error);const labels=await Promise.all(errors.map(x=>x.getText()));
  fs.writeFileSync(path.join(evidence,'GUI-02-problems.json'),JSON.stringify(labels,null,2));
  await capture('GUI-02-error');await driver.actions().doubleClick(errors[0]).perform();
  const coordinates=await editor.getCoordinates();assert.equal(coordinates[0],8);
  const errorToken=await driver.findElement(By.xpath('//div[contains(@class,"view-lines")]//span[text()="MissingHeight"]'));await driver.actions().doubleClick(errorToken).sendKeys('Height').perform();
  await waitFor(async()=>(await problems.getAllVisibleMarkers(MarkerType.Error)).length===0,'Corrected document still has errors');
  await capture('GUI-02-corrected');record('GUI-02',['type MissingHeight','Problems row double click','type Height'],['live diagnostic appears','Problems navigation line8','diagnostic disappears']);
 });
 it('GUI-03 executes F12, formatting, undo/redo, stop and restart without losing the dirty buffer',async()=>{
  await go(8,18);await driver.actions().sendKeys(Key.F12).perform();
  await waitFor(async()=>(await editor.getCoordinates())[0]===5,'F12 did not navigate to Height declaration');
  const original=await readText();const unformatted=original.replace(/^ +/gm,'');await replaceText(unformatted);assert.equal(await readText(),unformatted,'Unformatted preparation was not applied');await capture('GUI-03-unformatted');
  await palette('Format Document');await waitFor(async()=>(await readText())!==unformatted,'Formatting did not change layout');
  const formatted=await readText();fs.writeFileSync(path.join(evidence,'GUI-03-buffers.json'),JSON.stringify({unformatted,formatted},null,2));await capture('GUI-03-formatted');assert.equal(formatted.replace(/\s/g,''),unformatted.replace(/\s/g,''));
  await focusEditor();await palette('Undo');
  await waitFor(async()=>(await readText())===unformatted,'Undo did not restore unformatted buffer');
  await focusEditor();await palette('Redo');
  await waitFor(async()=>(await readText())===formatted,'Redo did not restore formatted buffer');assert.equal(await editor.isDirty(),true);
  await palette('INTERLIS: Stop Language Server');await waitFor(()=>status('Stopped'),'Server did not stop');
  await capture('GUI-03-stopped');await palette('INTERLIS: Restart Language Server');await waitFor(()=>status('Ready'),'Server did not restart');
  assert.equal(await readText(),formatted);assert.equal(await editor.isDirty(),true);
  const restartedProblems=new ProblemsView();const references=await driver.findElements(By.xpath('//div[contains(@class,"view-lines")]//span[text()="Height"]'));assert.ok(references.length>=2);
  await driver.actions().doubleClick(references[references.length-1]).sendKeys('MissingHeight').perform();
  await waitFor(async()=>(await restartedProblems.getAllVisibleMarkers(MarkerType.Error)).length>0,'Restarted server did not publish fresh diagnostics');
  await capture('GUI-03-restarted-error');const missing=await driver.findElement(By.xpath('//div[contains(@class,"view-lines")]//span[text()="MissingHeight"]'));await driver.actions().doubleClick(missing).sendKeys('Height').perform();
  await waitFor(async()=>(await restartedProblems.getAllVisibleMarkers(MarkerType.Error)).length===0,'Restarted server did not clear corrected diagnostic');assert.equal(await readText(),formatted);
  await capture('GUI-03-restarted');
  await palette('INTERLIS: Show Language Server Output');await capture('GUI-03-output');
  record('GUI-03',['F12','Format Document','Palette Undo','Palette Redo','Stop Language Server','Restart Language Server'],['definition line5','semantically same formatted text','Undo restores original','Redo restores format','dirty buffer preserved through restart','fresh diagnostic and correction after restart']);
 });
});
