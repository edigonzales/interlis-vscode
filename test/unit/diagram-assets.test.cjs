const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {verifyDiagramAssets} = require('../../build/diagram-assets.cjs');

test('the built renderer supplies the required webview assets', async () => {
  await verifyDiagramAssets(process.cwd());
});

test('a missing worker is rejected before rendering', async t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'interlis-diagram-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  fs.cpSync('out/diagram', path.join(root, 'out/diagram'), {recursive: true});
  fs.unlinkSync(path.join(root, 'out/diagram/diagram-layout-worker.js'));
  await assert.rejects(verifyDiagramAssets(root), /Missing or unsafe diagram asset: diagram-layout-worker.js/);
});
