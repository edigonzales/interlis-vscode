const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {VSBrowser,Workbench,TextEditor,ProblemsView,MarkerType,By,Key}=require('vscode-extension-tester');
const ui=require('./workbench.cjs');const {capture,waitFor,readText,copyText,focusEditor,palette,go,select,replaceText,status,record}=ui;
const evidence=process.env.INTERLIS_GUI_EVIDENCE;let driver,wb,editor;
function heightReference(text){
 const lines=text.split('\n');
 const index=lines.findIndex(line=>/^\s*height\s*:\s*Height\s*;/.test(line));
 assert.ok(index>=0,'Expected the height attribute to reference Height');
 return {line:index+1,column:lines[index].indexOf('Height')+1};
}
describe('Installed INTERLIS editor smoke',function(){
 this.timeout(120000);
 before(async()=>{await ui.initialize();driver=ui.driver;wb=ui.wb;});
 afterEach(async function(){if(this.currentTest.state==='failed'){await capture('failure-'+this.currentTest.title.slice(0,6));fs.writeFileSync(path.join(evidence,'failure-dom.html'),await driver.getPageSource());}});
 it('GUI-01 installs and activates its own real language server from Explorer',async()=>{
  await palette('View: Show Explorer');
  const file=await driver.wait(async()=>{const files=await driver.findElements(By.css('[role="tree"][aria-label="Files Explorer"] [role="treeitem"][aria-label="Example.ili"]'));return files[0];},15000,'Fixture missing in Explorer');
  await driver.actions().doubleClick(file).perform();editor=new TextEditor();ui.editor=editor;
  await waitFor(()=>status(process.env.INTERLIS_GUI_CANARY==='missing-status'?'Impossible readiness canary':'Ready'),process.env.INTERLIS_GUI_CANARY==='missing-status'?'Negative canary: impossible visible status was not present':'Packaged server did not become ready');
  await waitFor(()=>driver.executeScript("return !!document.getElementById('workbench.panel.markers')?.offsetHeight"),'Problems did not open automatically');
  assert.equal(await driver.executeScript("return !!document.activeElement.closest('.part.editor .monaco-editor')"),true,'Problems took keyboard focus from the editor');
  assert.equal(await wb.getStatusBar().getCurrentLanguage(),'INTERLIS');
  assert.match(await readText(),/MODEL Example/);
  await capture('GUI-01-ready');
  record('GUI-01',['Explorer double click Example.ili','wait visible INTERLIS Ready'],['language INTERLIS','real source visible','server ready','Problems visible with editor focus']);
 });
 it('GUI-02 types a real type error, navigates Problems and corrects it',async()=>{
  const reference=heightReference(await copyText());
  await select(reference.line,reference.column,6);await driver.actions().sendKeys('MissingHeight').perform();
  const problems=new ProblemsView();
  await waitFor(async()=>(await problems.getAllVisibleMarkers(MarkerType.Error)).length>0,'Missing live type diagnostic');
  const errors=await problems.getAllVisibleMarkers(MarkerType.Error);const labels=await Promise.all(errors.map(x=>x.getText()));
  fs.writeFileSync(path.join(evidence,'GUI-02-problems.json'),JSON.stringify(labels,null,2));
  await capture('GUI-02-error');const missing=errors[labels.findIndex(label=>label.includes('MissingHeight'))];assert.ok(missing,'Expected MissingHeight diagnostic row');await driver.actions().doubleClick(missing).perform();
  const coordinates=await editor.getCoordinates();assert.equal(coordinates[0],reference.line);
  const errorToken=await driver.findElement(By.xpath('//div[contains(@class,"view-lines")]//span[text()="MissingHeight"]'));await driver.actions().doubleClick(errorToken).sendKeys('Height').perform();
  await waitFor(async()=>(await problems.getAllVisibleMarkers(MarkerType.Error)).length===0,'Corrected document still has errors');
  await capture('GUI-02-corrected');record('GUI-02',['type MissingHeight','Problems row double click','type Height'],['live diagnostic appears','Problems navigates to the height attribute','diagnostic disappears']);
 });
 it('GUI-03 executes F12, formatting, undo/redo, stop and restart without losing the dirty buffer',async()=>{
  const original=await copyText();const reference=heightReference(original);
  const declarationLine=original.split('\n').findIndex(line=>/^\s*Height\s*=/.test(line))+1;
  assert.ok(declarationLine>0,'Expected the Height declaration');
  await go(reference.line,reference.column+2);await driver.actions().sendKeys(Key.F12).perform();
  await waitFor(async()=>(await editor.getCoordinates())[0]===declarationLine,'F12 did not navigate to Height declaration');
  const unformatted=original.replace(/^ +/gm,'');await replaceText(unformatted);assert.equal(await readText(),unformatted,'Unformatted preparation was not applied');await capture('GUI-03-unformatted');
  await palette('Format Document');await waitFor(async()=>(await copyText())!==unformatted,'Formatting did not change layout');
  const formatted=await copyText();fs.writeFileSync(path.join(evidence,'GUI-03-buffers.json'),JSON.stringify({unformatted,formatted},null,2));await capture('GUI-03-formatted');assert.equal(formatted.replace(/\s/g,''),unformatted.replace(/\s/g,''));
  await focusEditor();await palette('Undo');
  await waitFor(async()=>(await copyText())===unformatted,'Undo did not restore unformatted buffer');
  await focusEditor();await palette('Redo');
  await waitFor(async()=>(await copyText())===formatted,'Redo did not restore formatted buffer');assert.equal(await editor.isDirty(),true);
  await palette('INTERLIS: Stop Language Server');await waitFor(()=>status('Stopped'),'Server did not stop');
  await capture('GUI-03-stopped');await palette('INTERLIS: Restart Language Server');await waitFor(()=>status('Ready'),'Server did not restart');
  assert.equal(await copyText(),formatted);assert.equal(await editor.isDirty(),true);
  const restartedProblems=new ProblemsView();const formattedReference=heightReference(formatted);
  await select(formattedReference.line,formattedReference.column,6);await driver.actions().sendKeys('MissingHeight').perform();
  await waitFor(async()=>(await restartedProblems.getAllVisibleMarkers(MarkerType.Error)).length>0,'Restarted server did not publish fresh diagnostics');
  await capture('GUI-03-restarted-error');await select(formattedReference.line,formattedReference.column,13);await driver.actions().sendKeys('Height').perform();
  await waitFor(async()=>(await restartedProblems.getAllVisibleMarkers(MarkerType.Error)).length===0,'Restarted server did not clear corrected diagnostic');assert.equal(await copyText(),formatted);
  await capture('GUI-03-restarted');
  await palette('INTERLIS: Show Language Server Output');await capture('GUI-03-output');
  record('GUI-03',['F12','Format Document','Palette Undo','Palette Redo','Stop Language Server','Restart Language Server'],['definition at Height declaration','semantically same formatted text','Undo restores original','Redo restores format','dirty buffer preserved through restart','fresh diagnostic and correction after restart']);
 });
});
