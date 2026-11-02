// Real installed editor suite. The common smoke cases run in the same workbench first.
require('./smoke.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {TextEditor,ProblemsView,MarkerType,By,Key}=require('vscode-extension-tester');
const ui=require('./workbench.cjs');
const evidence=process.env.INTERLIS_GUI_EVIDENCE;
async function settings(patch){
 await ui.palette('Preferences: Open User Settings (JSON)');
 await ui.waitEditor('settings.json');
 const config={...JSON.parse(await ui.copyText()),...patch};
 await ui.replaceText(JSON.stringify(config));
 await ui.driver.actions().keyDown(Key.COMMAND).sendKeys('s').keyUp(Key.COMMAND).perform();
 await ui.waitFor(async()=>!(await ui.editor.isDirty()),'Settings were not saved');
 fs.writeFileSync(path.join(evidence,'settings.json'),JSON.stringify(config,null,2));
}
async function errorRows(){return ui.driver.findElements(By.css('[id="workbench.panel.markers"] .monaco-list-row[aria-label^="Error:"]'));}
async function hasError(text){for(const item of await errorRows())if((await item.getText()).includes(text))return item;return false;}
function fixture(name){return fs.readFileSync(path.join(__dirname,'../fixtures/workspace-imports',name),'utf8').trimEnd();}

describe('Installed INTERLIS repository and editor parity',function(){
 this.timeout(120000);this.bail(true);
 afterEach(async function(){if(this.currentTest.state==='failed'){fs.writeFileSync(path.join(evidence,'failure-'+this.currentTest.title.slice(0,6)+'.json'),JSON.stringify({message:this.currentTest.err?.message,stack:this.currentTest.err?.stack},null,2));await ui.capture('failure-'+this.currentTest.title.slice(0,6));fs.writeFileSync(path.join(evidence,'failure-dom.html'),await ui.driver.getPageSource());}});
 it('GUI-04 localizes a real conflict and navigates its related declaration',async()=>{
  await settings({'interlisGuru.diagnostics.language':'de'});await ui.openFile('Conflict.ili');
  const valid=fixture('Conflict.ili'),conflict=valid.replace('  END Data;','    CLASS Item =\n      second : TEXT*20;\n    END Item;\n  END Data;');
  await ui.replaceText(conflict);await ui.palette('View: Toggle Problems');
  await ui.waitFor(()=>hasError('Namensraum'),'German conflict diagnostic missing');
  const german=await (await hasError('Namensraum')).getText();assert.ok(!german.includes('diagnostic.'));assert.ok(!german.includes('\u001b'));
  await ui.capture('GUI-04-german');
  const row=await hasError('Namensraum');if((await row.getAttribute('aria-expanded'))==='false')await row.findElement(By.css('.monaco-tl-twistie')).click();
  await ui.waitFor(async()=>{for(const item of await ui.driver.findElements(By.css('[id="workbench.panel.markers"] .related-info-resource')))if(await item.isDisplayed())return item;return false;},'Related information did not expand');
  const related=await ui.driver.findElements(By.css('[id="workbench.panel.markers"] .related-info-resource'));
  await ui.driver.actions().doubleClick(related[0]).perform();
  await ui.waitFor(async()=>(await ui.editor.getCoordinates())[0]===5,'Related declaration did not navigate to original class');await ui.capture('GUI-04-related');
  await settings({'interlisGuru.diagnostics.language':'en'});await ui.openFile('Conflict.ili');
  await ui.waitFor(()=>hasError('namespace'),'English conflict diagnostic missing');
  const english=await (await hasError('namespace')).getText();assert.equal(english.match(/ILI-[A-Z]+-\d+/)?.[0],german.match(/ILI-[A-Z]+-\d+/)?.[0]);assert.equal(english.match(/\[Ln[^\]]+\]/)?.[0],german.match(/\[Ln[^\]]+\]/)?.[0]);await ui.capture('GUI-04-english');
  fs.writeFileSync(path.join(evidence,'GUI-04-messages.json'),JSON.stringify({german,english},null,2));
  await ui.replaceText(valid);await ui.waitFor(async()=>!(await hasError('namespace')),'Conflict did not clear');
  ui.record('GUI-04',['edit duplicate class','save DE/EN language settings through Settings editor','expand Problems and double-click related declaration'],['readable DE/EN messages','no message keys or ANSI','original declaration line5']);
 });
 it('GUI-05 hovers and follows both qualified segments from the unsaved buffer',async()=>{
  await ui.openFile('Example.ili');const original=await ui.readText();
  const changed=original.replaceAll('Height','CurrentHeight').replace(/height\s*:\s*CurrentHeight/,'height: Example.CurrentHeight');
  await ui.replaceText(changed);
  const line=changed.split('\n')[7];await ui.go(8,line.indexOf('CurrentHeight')+2);
  await ui.palette('Show or Focus Hover');
  await ui.waitFor(async()=>{for(const hover of await ui.driver.findElements(By.css('.monaco-hover')))if((await hover.getText()).includes('CurrentHeight'))return true;return false;},'Hover did not describe the dirty qualified domain');
  await ui.capture('GUI-05-hover');await ui.driver.actions().sendKeys(Key.ESCAPE).perform();
  await ui.go(8,line.indexOf('Example')+2);await ui.driver.actions().sendKeys(Key.F12).perform();await ui.waitFor(async()=>(await ui.editor.getCoordinates())[0]===3,'Qualified model segment did not resolve to MODEL');
  await ui.go(8,line.indexOf('CurrentHeight')+2);await ui.driver.actions().sendKeys(Key.F12).perform();await ui.waitFor(async()=>(await ui.editor.getCoordinates())[0]===5,'Qualified dirty domain segment did not resolve');
  assert.equal(await ui.editor.isDirty(),true);assert.equal(await ui.readText(),changed);assert.ok(!fs.readFileSync(path.join(evidence,'Unicode Modelle/Example.ili'),'utf8').includes('CurrentHeight'));
  await ui.capture('GUI-05-definition');await ui.replaceText(original);
  ui.record('GUI-05',['paste changed declaration and qualified use into dirty editor','Show or Focus Hover','F12 on model segment','F12 on domain segment'],['current domain in hover','model line3','domain line5','disk remains original','dirty text preserved']);
 });
 it('GUI-06 finds semantic references and opens the previously closed declaration file',async()=>{
  await ui.openFile('Survey.ili');const lines=fixture('Survey.ili').split('\n');await ui.go(12,lines[11].indexOf('BaseBuilding')+2);
  await ui.palette('References: Find All References');
  await ui.waitFor(async()=>{for(const row of await ui.driver.findElements(By.css('.monaco-list-row')))if((await row.getText()).includes('Base.ili'))return true;return false;},'Reference tree does not contain closed Base.ili');
  await ui.capture('GUI-06-references');
  const rows=await ui.driver.findElements(By.css('.monaco-list-row'));let target;
  for(const row of rows)if(await row.isDisplayed() && (await row.getText()).includes('Base.ili')){if((await row.getAttribute('aria-expanded'))==='false')await row.findElement(By.css('.monaco-tl-twistie')).click();break;}
  await ui.waitFor(async()=>{for(const row of await ui.driver.findElements(By.css('.monaco-list-row')))if(await row.isDisplayed() && (await row.getText()).includes('CLASS BaseBuilding')){target=row;return true;}return false;},'Declaration reference row missing');
  await target.findElement(By.css('.label-name')).click();await ui.driver.actions().sendKeys(Key.ENTER).perform();await ui.waitEditor('Base.ili');
  await ui.waitFor(async()=>(await ui.editor.getTitle()).includes('Base.ili'),'Reference selection did not open Base');assert.equal((await ui.editor.getCoordinates())[0],13);await ui.capture('GUI-06-declaration');
  ui.record('GUI-06',['Find All References on imported class','expand Base.ili','click declaration result and press Enter'],['both source files in semantic result list','closed declaration opens at line13']);
 });
 it('GUI-07 applies a project rename and undo across declarations END names and uses',async()=>{
  await ui.driver.actions().keyDown(Key.COMMAND).sendKeys('w').keyUp(Key.COMMAND).perform();
  await ui.openFile('Survey.ili');await ui.go(12,fixture('Survey.ili').split('\n')[11].indexOf('BaseBuilding')+2);
  await ui.driver.actions().sendKeys(Key.F2).perform();
  const input=await ui.driver.wait(async()=>{for(const item of await ui.driver.findElements(By.css('.rename-box input')))if(await item.isDisplayed())return item;return false;},5000,'Rename input did not appear');
  await input.sendKeys(Key.chord(Key.COMMAND,'a'),'RenamedBuilding',Key.ENTER);
  await ui.waitFor(async()=>(await ui.readText()).includes('Base.Common.RenamedBuilding'),'Survey rename was not applied');await ui.capture('GUI-07-reference');
  await ui.openFile('Base.ili');const renamed=await ui.readText();assert.ok(renamed.includes('CLASS RenamedBuilding'));assert.ok(renamed.includes('END RenamedBuilding;'));await ui.capture('GUI-07-declaration');
  await ui.focusEditor();await ui.palette('Undo');
  const dialogs=await ui.driver.findElements(By.css('.monaco-dialog-box'));for(const dialog of dialogs)if(await dialog.isDisplayed()){for(const button of await dialog.findElements(By.css('.monaco-button')))if((await button.getText()).includes('Undo')){await button.click();break;}}
  await ui.waitFor(async()=>(await ui.readText()).includes('CLASS BaseBuilding'),'Undo did not restore Base declaration');
  await ui.openFile('Survey.ili');assert.ok((await ui.readText()).includes('Base.Common.BaseBuilding'));assert.ok(!(await ui.readText()).includes('RenamedBuilding'));
  await ui.capture('GUI-07-undone');ui.record('GUI-07',['close declaration tab','F2 rename imported class','confirm Enter','open changed Base','Undo workspace rename'],['declaration and END changed','qualified uses changed','both sources restored by Undo','no direct test file writes']);
 });
 it('GUI-08 compiles the current root independently of a broken neighbour',async()=>{
  await ui.openFile('Broken.ili');await ui.replaceText(fixture('Broken.ili').replace('0..10','10..0'));
  await ui.openFile('Example.ili');await ui.palette('INTERLIS: Compile Current Model');
  await ui.waitFor(async()=>{for(const item of await ui.driver.findElements(By.css('.notification-list-item-message')))if((await item.getText()).includes('compilation succeeded'))return true;return false;},'Valid current root was not compiled successfully');await ui.capture('GUI-08-valid-root');
  await ui.openFile('Broken.ili');await ui.palette('INTERLIS: Compile Current Model');
  await ui.waitFor(async()=>{for(const item of await ui.driver.findElements(By.css('.notification-list-item-message')))if((await item.getText()).includes('compilation rejected'))return true;return false;},'Broken root was not rejected');await ui.capture('GUI-08-broken-root');
  await ui.openFile('Broken.ili');await ui.replaceText(fixture('Broken.ili'));
  ui.record('GUI-08',['make numeric range invalid in neighbour','Compile Current Model in Example','Compile Current Model in Broken','restore neighbour'],['valid root succeeds','selected invalid root rejected','open buffers retained']);
 });
 it('GUI-09 navigates a pinned transitive closure then restarts offline without HTTP',async()=>{
  const fixtureData=JSON.parse(fs.readFileSync(path.join(evidence,'repository-fixtures.json')));
  await ui.openFile('External.ili');await ui.go(6,fixture('External.ili').split('\n')[5].indexOf('RemoteHeight')+2);await ui.driver.actions().sendKeys(Key.F12).perform();await ui.waitEditor('RemoteMiddle.ili');
  assert.equal(await ui.copyText(),fixtureData.sources['RemoteMiddle.ili']);const before=await ui.editor.getFileUri();await ui.capture('GUI-09-online-middle');
  await ui.go(5,fixtureData.sources['RemoteMiddle.ili'].split('\n')[4].indexOf('RemoteCount')+2);await ui.driver.actions().sendKeys(Key.F12).perform();await ui.waitEditor('RemoteLeaf2.ili');assert.equal(await ui.copyText(),fixtureData.sources['RemoteLeaf2.ili']);await ui.capture('GUI-09-online-leaf');
  const count=JSON.parse(fs.readFileSync(path.join(evidence,'repository-stats.json'))).requests.length;
  await settings({'interlisGuru.offline':true});await ui.palette('INTERLIS: Restart Language Server');await ui.waitFor(()=>ui.status('Ready'),'Offline server did not restart');
  await ui.openFile('External.ili');await ui.waitCurrentAnalysis();await ui.go(6,fixture('External.ili').split('\n')[5].indexOf('RemoteHeight')+2);await ui.driver.actions().sendKeys(Key.F12).perform();await ui.waitEditor('RemoteMiddle.ili');assert.equal(await ui.copyText(),fixtureData.sources['RemoteMiddle.ili']);assert.notEqual(await ui.editor.getFileUri(),before);assert.equal(JSON.parse(fs.readFileSync(path.join(evidence,'repository-stats.json'))).requests.length,count);await ui.capture('GUI-09-offline');
  for(let repeat=0;repeat<2;repeat++){const oldHandle=await ui.editor.getFileUri();await ui.palette('INTERLIS: Restart Language Server');await ui.waitFor(()=>ui.status('Ready'),'Repeated offline restart did not become ready');await ui.openFile('External.ili');await ui.waitCurrentAnalysis();await ui.go(6,fixture('External.ili').split('\n')[5].indexOf('RemoteHeight')+2);await ui.driver.actions().sendKeys(Key.F12).perform();await ui.waitEditor('RemoteMiddle.ili');assert.equal(await ui.copyText(),fixtureData.sources['RemoteMiddle.ili']);assert.notEqual(await ui.editor.getFileUri(),oldHandle);assert.equal(JSON.parse(fs.readFileSync(path.join(evidence,'repository-stats.json'))).requests.length,count);await ui.capture('GUI-09-offline-repeat-'+(repeat+1));}

  await settings({'interlisGuru.repositories':[fixtureData.base+'uncached/']});await ui.openFile('External.ili');await ui.palette('View: Toggle Problems');
  await ui.waitFor(()=>hasError('offline'),'Empty offline search did not show concrete cause');await ui.capture('GUI-09-offline-miss');assert.equal(JSON.parse(fs.readFileSync(path.join(evidence,'repository-stats.json'))).requests.length,count);
  await settings({'interlisGuru.repositories':[fixtureData.base]});
  await ui.openFile('Conflict.ili');await ui.replaceText(fixture('Base.ili'));await ui.openFile('Survey.ili');
  await ui.waitFor(()=>hasError('ambiguous'),'Duplicate local model did not remain ambiguous');await ui.capture('GUI-09-ambiguity');
  await ui.openFile('Conflict.ili');await ui.replaceText(fixture('Conflict.ili'));
  ui.record('GUI-09',['F12 through two remote imports','copy complete readonly contents','enable offline in Settings JSON','restart server three times','navigate cached source after each restart','select uncached repository offline','introduce and remove duplicate local model'],['exact pinned leaf version2 bytes','same cached middle bytes after restart','fresh session handles','zero offline HTTP requests','specific offline miss','local duplicate remains ambiguous']);
 });
 it('GUI-10 keeps the external source readonly after it has been opened',async()=>{
  const fixtureData=JSON.parse(fs.readFileSync(path.join(evidence,'repository-fixtures.json')));
  await ui.openFile('External.ili');await ui.go(6,fixture('External.ili').split('\n')[5].indexOf('RemoteHeight')+2);await ui.driver.actions().sendKeys(Key.F12).perform();await ui.waitEditor('RemoteMiddle.ili');const uri=await ui.editor.getFileUri();assert.match(uri,/interlis-source/);
  const original=await ui.copyText();await ui.go(4,8);await ui.driver.actions().sendKeys('TAMPERED').perform();await ui.capture('GUI-10-blocked-input');assert.equal(await ui.copyText(),original);assert.equal(await ui.editor.isDirty(),false);
  await ui.go(4,9);await ui.driver.actions().sendKeys(Key.F2).perform();
  const renameBoxes=await ui.driver.findElements(By.css('.rename-box input'));for(const box of renameBoxes)assert.equal(await box.isDisplayed(),false,'Readonly editor offered an editable rename input');
  assert.equal(await ui.copyText(),fixtureData.sources['RemoteMiddle.ili']);await ui.capture('GUI-10-readonly');await ui.driver.actions().sendKeys(Key.ESCAPE).perform();
  await ui.go(4,9);await ui.palette('Show or Focus Hover');await ui.waitFor(async()=>{for(const h of await ui.driver.findElements(By.css('.monaco-hover')))if((await h.getText()).includes('RemoteHeight'))return true;return false;},'Readonly source lost hover context');await ui.capture('GUI-10-hover');await ui.driver.actions().sendKeys(Key.ESCAPE).perform();
  ui.record('GUI-10',['F12 external source','type into readonly buffer','F2 readonly symbol','request hover'],['opaque readonly URI','text unchanged','editor not dirty','readonly editor offers no rename input','hover still works']);
 });
 it('GUI-11 uses nested outline folding qualified completion and theme-aware tokens',async()=>{
  await ui.openFile('Survey.ili');await ui.palette('Explorer: Focus on Outline View');
  for(const name of ['Survey','Data','Building']) {
   const item=await ui.driver.wait(async()=>{for(const row of await ui.driver.findElements(By.css('[aria-label="Outline"] .monaco-list-row, .outline-pane .monaco-list-row')))if((await row.getText()).split('\n')[0]===name)return row;return false;},8000,'Outline item missing: '+name);
   await item.click();await ui.driver.actions().sendKeys(Key.RIGHT).perform();
  }
  const attribute=await ui.driver.wait(async()=>{for(const row of await ui.driver.findElements(By.css('[aria-label="Outline"] .monaco-list-row, .outline-pane .monaco-list-row')))if((await row.getText()).split('\n')[0]==='height')return row;return false;},5000,'Nested attribute missing');await attribute.findElement(By.css('.label-name')).click();await ui.driver.actions().sendKeys(Key.ENTER).perform();await ui.waitFor(async()=>(await ui.editor.getCoordinates())[0]===13,'Outline did not navigate to attribute line13');await ui.capture('GUI-11-outline');
  await ui.go(12,5);await ui.palette('Fold');await ui.capture('GUI-11-fold');await ui.palette('Unfold');
  const original=await ui.copyText(),line=original.split('\n')[12],col=line.indexOf('Count')+1;assert.ok(col>0,'Count absent from fixture line13');
  await ui.select(13,col,5);await ui.driver.actions().sendKeys('Co').perform();await ui.palette('Trigger Suggest');
  const suggestion=await ui.driver.wait(async()=>{for(const row of await ui.driver.findElements(By.css('.suggest-widget .monaco-list-row')))if((await row.getText()).includes('Count'))return row;return false;},8000,'Qualified Count completion missing');await ui.driver.actions().doubleClick(suggestion).perform();await ui.waitFor(async()=>(await ui.readText()).includes('Base.Count'),'Qualified completion did not preserve prefix');assert.equal(await ui.copyText(),original,'Completion changed more than the selected identifier');await ui.capture('GUI-11-completion');
  await ui.palette('Preferences: Color Theme',false,true);
  const field=await ui.driver.wait(async()=>{for(const input of await ui.driver.findElements(By.css('.quick-input-widget input')))if(await input.isDisplayed())return input;return false;},5000,'Theme picker missing');await field.sendKeys(Key.chord(Key.COMMAND,'a'),'Light Modern');
  const theme=await ui.driver.wait(async()=>{for(const row of await ui.driver.findElements(By.css('.quick-input-list .monaco-list-row')))if(await row.isDisplayed() && /^Light Modern(?:\s|$)/.test((await row.getText()).trim()))return row;return false;},5000,'Built-in Light Modern theme was not offered');
  await theme.click();await ui.waitFor(async()=>await ui.driver.executeScript('return document.querySelector(".monaco-workbench").classList.contains("vs")'),'Workbench did not actually switch to light theme');await ui.capture('GUI-11-light');
  await ui.openFile('Base.ili');await ui.capture('GUI-11-tokens');
  ui.record('GUI-11',['expand semantic MODEL→TOPIC→CLASS outline','select attribute','fold and unfold class','accept qualified completion','select light theme'],['hierarchical outline selection line13','source prefix preserved','completion Count offered','semantic coloring visible in screenshots']);
 });

});
