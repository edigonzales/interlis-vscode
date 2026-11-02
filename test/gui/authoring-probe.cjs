require('./smoke.cjs');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {Key}=require('vscode-extension-tester'),ui=require('./workbench.cjs');
describe('Installed standard on-type formatting cursor probe',function(){
 this.timeout(90000);
 it('GUI-30 probes native Enter block close and body caret',async()=>{
  await ui.palette('Preferences: Open User Settings (JSON)');await ui.waitEditor('settings.json');const settings={...JSON.parse(await ui.copyText()),'editor.formatOnType':true};await ui.replaceText(JSON.stringify(settings));await ui.driver.actions().keyDown(Key.COMMAND).sendKeys('s').keyUp(Key.COMMAND).perform();await ui.waitFor(async()=>!(await ui.editor.isDirty()),'Settings not saved');
  await ui.openFile('Example.ili');const prefix='INTERLIS 2.4;\nMODEL Example AT "x" VERSION "1" =\nCLASS Auto =';await ui.replaceText(prefix);await ui.go(3,13);await ui.driver.actions().sendKeys(Key.ENTER).perform();
  await ui.waitFor(async()=>(await ui.readText()).includes('END Auto;'),'Java on-type formatting did not close the actual CLASS');const coordinates=await ui.editor.getCoordinates();await ui.capture('GUI-30-standard-on-type');const buffer=await ui.copyText();fs.writeFileSync(path.join(process.env.INTERLIS_GUI_EVIDENCE,'GUI-30-standard-on-type.json'),JSON.stringify({coordinates,buffer},null,2));assert.deepEqual(coordinates,[4,3],'Caret must stay on the indented body line');assert.match(buffer,/CLASS Auto =\n  \nEND Auto;/);
  ui.record('GUI-30',['native Enter after parsed CLASS header','standard onTypeFormatting through Java LSP'],['actual END Auto; inserted','caret on body line4 column3']);
 });
});
