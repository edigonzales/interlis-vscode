const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {inspectLinks} = require('../../scripts/stage-runtime.cjs');

test('runtime materialization keeps legal notices and refuses links outside the root', t => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'interlis-jdk-'));
  t.after(() => fs.rmSync(directory, {recursive: true, force: true}));
  const root = path.join(directory, 'runtime');
  fs.mkdirSync(root);
  fs.writeFileSync(path.join(root, 'LICENSE'), 'vendor license');
  fs.symlinkSync('LICENSE', path.join(root, 'NOTICE'), 'file');
  inspectLinks(root, true);
  assert.equal(fs.readFileSync(path.join(root, 'NOTICE'), 'utf8'), 'vendor license');
  assert.ok(fs.lstatSync(path.join(root, 'NOTICE')).isFile());

  fs.writeFileSync(path.join(directory, 'outside'), 'outside');
  fs.symlinkSync('../outside', path.join(root, 'escape'), 'file');
  assert.throws(() => inspectLinks(root, true), /Unsafe JDK symlink/);
});
