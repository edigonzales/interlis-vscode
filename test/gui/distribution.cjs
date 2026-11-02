require('./native-launch.cjs').useSealedCode();
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ui=require('./workbench.cjs'),v=require('./v5-common.cjs');
describe('Installed offline macOS distribution',function(){
 v.failureHooks(this);
 before(async()=>{await ui.initialize();});
 it('GUI-36 uses only bundled runtime and assets in an offline isolated workspace',async()=>{
  await ui.openFile('Example.ili');await ui.waitFor(()=>ui.status('Ready'),'Bundled offline Java server did not become Ready');
  const boundary=JSON.parse(fs.readFileSync(path.join(v.evidence,'offline-boundary.json')));assert.notEqual(boundary.sourceDenied.exit,0);assert.notEqual(boundary.externalNetworkDenied.exit,0);assert.equal(boundary.allowed.exit,0);
  const m=v.manifest();assert.ok(m.installed.runtime.java.startsWith(m.installed.path+path.sep));assert.match(v.serverLog(),/runtime=[a-f0-9]{64} bundled packaged distribution/);
  await v.open('Example.ili');await ui.capture('GUI-36-offline-diagram');const file=await v.save('GUI-36-offline-ä.svg');assert.match(fs.readFileSync(file,'utf8'),/Building/);await v.back();
  ui.record('GUI-36',['native Explorer open and Show Diagram','native SVG Save in network/source sandbox'],['Ready from bundled Java25','no JVM on child PATH','source repository read denied','external IP network denied','real UML and SVG content']);
 });
 it('GUI-42 starts from Unicode paths and exposes exact installed identities',async()=>{
  await v.source('Example.ili');assert.equal(await ui.wb.getStatusBar().getCurrentLanguage(),'INTERLIS');assert.ok(v.manifest().installed.path.includes('extensions'));assert.ok(v.manifest().storage!==process.cwd());await ui.capture('GUI-42-Unicode-install');
  ui.record('GUI-42',['native open from Unicode Modelle workspace','read exact fresh installed VSIX/runtime identity'],['real installed Ready and UML export','separate missing-server canary is required by aggregate qualification']);
 });
});
