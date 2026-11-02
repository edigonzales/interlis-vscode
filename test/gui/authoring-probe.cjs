require('./smoke.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {Key}=require('vscode-extension-tester'),ui=require('./workbench.cjs');
describe('Installed negotiated Java editor assistance cursor probe',function(){
 this.timeout(90000);
 it('GUI-30 probes native Enter block close and body caret',async()=>{
  await ui.palette('Preferences: Open User Settings (JSON)');await ui.waitEditor('settings.json');const settings={...JSON.parse(await ui.copyText()),'editor.formatOnType':true};await ui.replaceText(JSON.stringify(settings));await ui.driver.actions().keyDown(ui.primaryModifier).sendKeys('s').keyUp(ui.primaryModifier).perform();await ui.waitFor(async()=>!(await ui.editor.isDirty()),'Settings not saved');
  await ui.openFile('Example.ili');const prefix='INTERLIS 2.4;\nMODEL Example AT "x" VERSION "1" =\nCLASS Auto =';await ui.replaceText(prefix);await ui.go(3,13);await ui.driver.actions().sendKeys(Key.ENTER).perform();
  await ui.waitFor(async()=>(await ui.readText()).includes('END Auto;'),'Java editor assistance did not close the actual CLASS');await ui.waitFor(async()=>{const c=await ui.editor.getCoordinates();return c[0]===4&&c[1]===3;},'Java-planned body caret was not applied');const coordinates=await ui.editor.getCoordinates();await ui.capture('GUI-30-native-assist');const buffer=await ui.copyText();fs.writeFileSync(path.join(process.env.INTERLIS_GUI_EVIDENCE,'GUI-30-native-assist.json'),JSON.stringify({coordinates,buffer},null,2));assert.deepEqual(coordinates,[4,3],'Caret must stay on the indented body line');assert.match(buffer,/CLASS Auto =\n  \nEND Auto;/);
  ui.record('GUI-30',['native Enter after parsed CLASS header','negotiated versioned editorAssist through Java LSP'],['actual END Auto; inserted','caret on body line4 column3']);
 });
});
