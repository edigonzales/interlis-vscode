const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {resolveLaunchPlan} = require('../../build/launch.cjs');

test('launch uses the native bundled JVM and the fixed JPMS entry point', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'interlis launch ä '));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const lib = path.join(root, 'lsp/lib'), jar = path.join(lib, 'interlis-lsp-test.jar');
  fs.mkdirSync(lib, {recursive: true});
  await assert.rejects(resolveLaunchPlan(root), /Missing INTERLIS LSP JAR/);
  fs.writeFileSync(jar, '');
  fs.mkdirSync(path.join(root, 'runtime/wrong-platform/bin'), {recursive: true});
  await assert.rejects(resolveLaunchPlan(root), /Install the matching VSIX/);
  const java = path.join(root, 'runtime', process.platform + '-' + process.arch, 'bin',
    process.platform === 'win32' ? 'java.exe' : 'java');
  fs.mkdirSync(path.dirname(java), {recursive: true});
  await assert.rejects(resolveLaunchPlan(root), /Missing bundled Java/);
  fs.writeFileSync(java, '', {mode: 0o755});
  const plan = await resolveLaunchPlan(root);
  assert.equal(plan.java, java);
  assert.deepEqual(plan.args, ['--module-path', lib, '--module', 'guru.interlis.lsp/guru.interlis.lsp.Main']);
  assert.equal(plan.runtimeSource, 'bundled');
  await assert.rejects(resolveLaunchPlan(root, 'java'), /absolute executable/);
  await assert.rejects(resolveLaunchPlan(root, process.execPath), /Cannot run Java 25 executable|requires Java 25/);
});
