'use strict';
// Integration gate: verify the exact producer result, then attack copies of its bytes.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const cp = require('node:child_process');
const {readAndVerifyBundle, importCoreBundle} = require('./stage-core.cjs');
const result = JSON.parse(fs.readFileSync(process.argv[2]));
const reference = {coreCommit: result.coreCommit, manifestSha256: result.manifestSha256};
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'interlis-bundle-gate-'));
let count = 0;
try {
  const bundle = readAndVerifyBundle(result.directory, reference, {development: true});
  const exec = cp.execFileSync, spawn = cp.spawnSync;
  cp.execFileSync = cp.spawnSync = () => {throw Error('Importer started a process');};
  try {
    importCoreBundle(bundle, {output: path.join(temporary, 'positive'), development: true});
    count++;
  } finally {cp.execFileSync = exec; cp.spawnSync = spawn;}
  assert.throws(() => readAndVerifyBundle(result.directory, {...reference, coreCommit: '0'.repeat(40)}, {development: true}), /incompatible/); count++;
  const cases = [
    ['missing JAR', dir => fs.unlinkSync(path.join(dir, bundle.manifest.files.find(f => f.path.startsWith('server/')).path))],
    ['changed JAR', dir => fs.appendFileSync(path.join(dir, bundle.manifest.files.find(f => f.path.startsWith('server/')).path), 'changed')],
    ['extra JAR', dir => fs.writeFileSync(path.join(dir, 'server/lib/foreign.jar'), 'foreign')],
    ['broken renderer', dir => fs.appendFileSync(path.join(dir, 'diagram-ui/diagram-ui.js'), 'changed')],
  ];
  for (const [name, mutate] of cases) {
    const dir = path.join(temporary, name); fs.cpSync(result.directory, dir, {recursive: true}); mutate(dir);
    assert.throws(() => readAndVerifyBundle(dir, reference, {development: true}), undefined, name); count++;
  }
  for (const [name, mutate] of [
    ['unknown root', m => m.launch.moduleName='guru.interlis.missing'],
    ['arbitrary JVM options', m => m.launch.javaArgs=['--add-opens=ALL-UNNAMED']],
    ['own automatic module', m => {Object.values(m.moduleInventory).find(x=>x.name==='guru.interlis.lsp').explicit=false;}],
  ]) {
    const dir=path.join(temporary,name);fs.cpSync(result.directory,dir,{recursive:true});
    const file=path.join(dir,'manifest.json'),manifest=JSON.parse(fs.readFileSync(file));mutate(manifest);fs.writeFileSync(file,JSON.stringify(manifest));
    const manifestSha256=require('node:crypto').createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    assert.throws(()=>readAndVerifyBundle(dir,{...reference,manifestSha256},{development:true}),undefined,name);count++;
  }
  const unsafe = path.join(temporary, 'unsafe');fs.mkdirSync(unsafe);
  const outside = path.join(temporary, 'outside');fs.mkdirSync(outside);fs.writeFileSync(path.join(outside, 'sentinel'), 'preserved');
  fs.symlinkSync(outside, path.join(unsafe, 'artifacts'));
  assert.throws(() => importCoreBundle(bundle, {output: unsafe, development: true}), /Symlink/);
  assert.equal(fs.readFileSync(path.join(outside, 'sentinel'), 'utf8'), 'preserved'); count++;
  const unowned=path.join(temporary,'unowned');fs.mkdirSync(unowned);fs.writeFileSync(path.join(unowned,'sentinel'),'preserved');
  assert.throws(() => importCoreBundle(bundle,{output:unowned,development:true}), /unowned/);
  assert.equal(fs.readFileSync(path.join(unowned,'sentinel'),'utf8'),'preserved');count++;
  if (bundle.manifest.dirty) {assert.throws(() => readAndVerifyBundle(result.directory, reference), /incompatible/); count++;}
  console.log(JSON.stringify({schemaVersion: 1, checks: count, result: 'PASS', reference, source: result.directory}));
} finally {fs.rmSync(temporary, {recursive: true, force: true});}
