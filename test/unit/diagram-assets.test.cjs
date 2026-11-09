const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {verifyDiagramAssets}=require('../../build/diagram-assets.cjs');
test('the complete exact neutral renderer and schemas pass separate integrity verification',async()=>{await verifyDiagramAssets(process.cwd());});
test('a modified worker and unsafe renderer path fail closed',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'interlis-diagram-integrity-'));try{
  fs.cpSync('artifacts',path.join(root,'artifacts'),{recursive:true});fs.mkdirSync(path.join(root,'release'));const lock=JSON.parse(fs.readFileSync('release/editor-artifacts.lock.json'));
  fs.writeFileSync(path.join(root,'release/editor-artifacts.lock.json'),JSON.stringify(lock));
  fs.cpSync('out/diagram',path.join(root,'out/diagram'),{recursive:true});
  const worker=path.join(root,'out/diagram/diagram-layout-worker.js');fs.appendFileSync(worker,'\n/* altered worker */');await assert.rejects(verifyDiagramAssets(root),/digest mismatch/);
  const manifestFile=path.join(root,'out/diagram/manifest.json'),manifest=JSON.parse(fs.readFileSync(manifestFile));
  manifest.assets.unshift({path:'../../escape.js',sha256:'0'.repeat(64)});
  fs.writeFileSync(manifestFile,JSON.stringify(manifest));
  await assert.rejects(verifyDiagramAssets(root),/Invalid diagram artifact inventory/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
