const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {VSBrowser,Workbench,TextEditor,ProblemsView,MarkerType,By,Key}=require('vscode-extension-tester');
const evidence=process.env.INTERLIS_GUI_EVIDENCE;if(!evidence)throw new Error('Missing GUI evidence directory');
const completed=[];let driver,wb,editor;
async function capture(name){fs.writeFileSync(path.join(evidence,name+'.png'),await driver.takeScreenshot(),'base64');}
async function waitFor(fn,message){await driver.wait(async()=>{try{return await fn();}catch{return false;}},20000,message);}
async function readText(){return await driver.executeScript('return [...document.querySelectorAll(".part.editor .monaco-editor .view-lines .view-line")].map(e=>e.textContent.replace(/\\u00a0/g," ").replace(/\\u200b/g,"")).join("\\n")');}
async function focusEditor(){await driver.actions().clear();await driver.wait(async()=>{try{for(const span of await driver.findElements(By.css('.part.editor .monaco-editor .view-lines .view-line span span')))if((await span.getText()).trim()&&await span.isDisplayed()){try{await span.click();return true;}catch(error){if(error.name==='ElementClickInterceptedError')continue;throw error;}}return false;}catch(error){if(error.name==='StaleElementReferenceError')return false;throw error;}},5000,'No stable visible editor text to focus');await waitFor(async()=>await driver.executeScript("return !!document.activeElement.closest('.part.editor .monaco-editor') && document.activeElement.getAttribute('role')==='textbox'"),'Editor text input did not receive focus');}
async function palette(command, raw=false,keepOpen=false){
 const trace=async stage=>fs.appendFileSync(path.join(evidence,'palette-events.jsonl'),JSON.stringify({at:new Date().toISOString(),command,stage,visible:await driver.executeScript('return [...document.querySelectorAll(".quick-input-widget")].some(e=>e.offsetHeight>0)'),active:await driver.executeScript('return document.activeElement?.outerHTML.slice(0,500)')})+'\n');
 await driver.actions().clear();await driver.actions().sendKeys(Key.F1).perform();
 const input=await driver.wait(async()=>{const fields=await driver.findElements(By.css('.quick-input-widget input'));for(const field of fields)if(await field.isDisplayed())return field;return false;},5000,'Palette input not visible');
 await input.sendKeys(Key.chord(Key.COMMAND,'a'),raw?command:'>'+command);
 await waitFor(async()=>await input.getAttribute('value')===(raw?command:'>'+command),'Palette text mismatch');
 await trace('typed');
 if(!raw){const choice=await driver.wait(async()=>{try{for(const row of await driver.findElements(By.css('.quick-input-widget:not([style*="display: none"]) .quick-input-list .monaco-list-row'))){const label=await row.getAttribute('aria-label');if(label===command||label.startsWith(command+', '))return row;}return false;}catch(error){if(error.name==='StaleElementReferenceError')return false;throw error;}},20000,'Command not offered: '+command);await trace('select');await choice.findElement(By.css('.label-name')).click();await trace('selected');}
 else await driver.actions().sendKeys(Key.ENTER).perform();
 if(keepOpen){await driver.actions().clear();return;}
 await waitFor(async()=>{const widgets=await driver.findElements(By.css('.quick-input-widget'));return (await Promise.all(widgets.map(x=>x.isDisplayed()))).every(x=>!x);},'Palette did not close');await driver.actions().clear();
}
async function go(line,col){
 await focusEditor();await driver.actions().keyDown(Key.CONTROL).sendKeys('g').keyUp(Key.CONTROL).perform();
 const input=await driver.wait(async()=>{for(const field of await driver.findElements(By.css('.quick-input-widget input')))if(await field.isDisplayed())return field;return false;},5000,'Go to line input not visible');
 await input.sendKeys(Key.chord(Key.COMMAND,'a'),':'+line+','+col);await input.sendKeys(Key.ENTER);
 await waitFor(async()=>{const p=await editor.getCoordinates();return p[0]===line&&p[1]===col;},'Cursor did not reach target '+line+','+col);
}
async function select(line,col,length){await go(line,col);await driver.actions().keyDown(Key.SHIFT).sendKeys(...Array(length).fill(Key.RIGHT)).keyUp(Key.SHIFT).perform();}
async function replaceText(text){
 const clipboard=(await import('clipboardy')).default;const previous=clipboard.readSync();
 try{clipboard.writeSync(text);await focusEditor();await driver.actions().keyDown(Key.COMMAND).sendKeys('a').keyUp(Key.COMMAND).keyDown(Key.COMMAND).sendKeys('v').keyUp(Key.COMMAND).perform();await waitFor(async()=>await readText()===text,'Pasted buffer differs from prepared text');}
 finally{clipboard.writeSync(previous);}
}
async function status(text){return !!await wb.getStatusBar().getItem(`INTERLIS: ${text}`);}
function record(id,actions,assertions){completed.push({id,actions,assertions,at:new Date().toISOString()});fs.writeFileSync(path.join(evidence,'cases.json'),JSON.stringify(completed,null,2));}

async function initialize(){driver=VSBrowser.instance.driver;wb=new Workbench();await VSBrowser.instance.waitForWorkbench();}
async function waitEditor(name){
 await waitFor(async()=>{
  for(const code of await driver.findElements(By.css('.part.editor .monaco-editor[data-uri]')))if(await code.isDisplayed()){
   const uri=await code.getAttribute('data-uri');if(decodeURIComponent(new URL(uri).pathname).endsWith('/'+name))return true;
  }
  return false;
 },'Active editor DOM is not '+name);
 editor=new TextEditor();return editor;
}
async function openFile(name){
 await palette('View: Show Explorer');
 const file=await driver.wait(async()=>{for(const item of await driver.findElements(By.css('[role="tree"][aria-label="Files Explorer"] [role="treeitem"]')))if((await item.getAttribute('aria-label'))===name)return item;return false;},10000,'Explorer file missing: '+name);
 await driver.actions().doubleClick(file).perform();await waitEditor(name);await focusEditor();return editor;
}
module.exports={initialize,openFile,waitEditor,capture,waitFor,readText,focusEditor,palette,go,select,replaceText,status,record};
Object.defineProperties(module.exports,{driver:{get:()=>driver},wb:{get:()=>wb},editor:{get:()=>editor,set:value=>{editor=value;}}});
module.exports.copyText=async function(){
 const clipboard=(await import('clipboardy')).default,previous=clipboard.readSync();
 try{const sentinel='interlis-copy-'+require('node:crypto').randomUUID();clipboard.writeSync(sentinel);await focusEditor();await driver.actions().keyDown(Key.COMMAND).sendKeys('a').keyUp(Key.COMMAND).keyDown(Key.COMMAND).sendKeys('c').keyUp(Key.COMMAND).perform();await waitFor(async()=>clipboard.readSync()!==sentinel,'Native copy did not finish');return clipboard.readSync();}
 finally{clipboard.writeSync(previous);}
};
/** Read the actual current process trace as a readiness oracle; all user actions remain native UI. */
module.exports.waitCurrentAnalysis=async function(){
 const uri=await editor.getFileUri(),manifest=JSON.parse(fs.readFileSync(path.join(evidence,'manifest.json')));
 const walk=folder=>fs.existsSync(folder)?fs.readdirSync(folder,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(folder,e.name)):[path.join(folder,e.name)]):[];
 await waitFor(async()=>{
  const logs=walk(path.join(manifest.storage,'settings/logs')).filter(p=>p.endsWith('INTERLIS Language Server.log'));
  for(const log of logs){const all=fs.readFileSync(log,'utf8'),current=all.slice(all.lastIndexOf('Server start pid='));for(const match of current.matchAll(/Received notification 'interlis\/analysisReady'\.\r?\nParams: (\{[\s\S]*?\r?\n\})/g)){try{const value=JSON.parse(match[1]);if(Object.keys(value.documentVersions||{}).some(key=>decodeURIComponent(key)===decodeURIComponent(uri)))return true;}catch{}}}
  return false;
 },'Current server has not accepted analysis containing this real editor');
};
