const {test} = require('node:test');
const assert = require('node:assert/strict');
const {distributionManifest} = require('../../scripts/distribution-metadata.cjs');
const source = require('../../package.json');

test('local builds retain 0.1.0 without mutating the source manifest', () => {
  const before = JSON.stringify(source);
  assert.equal(distributionManifest(source, {}).version, '0.1.0');
  assert.equal(JSON.stringify(source), before);
});

test('all run attempts use the workflow run number, never the run ID or attempt', () => {
  for (const attempt of ['1', '2']) {
    const manifest = distributionManifest(source, {
      GITHUB_ACTIONS: 'true', GITHUB_RUN_NUMBER: '42',
      GITHUB_RUN_ID: '41500206767', GITHUB_RUN_ATTEMPT: attempt,
    });
    assert.equal(manifest.version, '0.1.42');
    assert.equal(manifest.publisher + '.' + manifest.name, 'edigonzales.interlis-editor');
    assert.equal(manifest.displayName, 'INTERLIS Editor');
  }
  assert.equal(source.version, '0.1.0');
});

test('missing CI run number and malformed numbers fail before packaging', () => {
  assert.throws(() => distributionManifest(source, {GITHUB_ACTIONS: 'true'}), /requires GITHUB_RUN_NUMBER/);
  for (const run of ['', '0', '01', '-1', '1.2', '42-dev', ' 42', '9007199254740992']) {
    assert.throws(() => distributionManifest(source, {GITHUB_RUN_NUMBER: run}), /positive safe integer/);
  }
});

test('Windows checkout preserves lock bytes and rebuilding LF notices keeps Git clean', () => {
  const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
  const cp = require('node:child_process');
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'interlis-distribution-eol-'));
  const git = args => cp.execFileSync('git', args, {cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
  const files = {'release/editor-artifacts.lock.json': '{"schemaVersion":1}\n', 'licenses/bundled-node-notices.txt': 'Generated notices\n'};
  try {
    git(['init']); git(['config', 'core.autocrlf', 'true']);
    fs.copyFileSync(path.resolve('.gitattributes'), path.join(root, '.gitattributes'));
    for (const [name, bytes] of Object.entries(files)) {
      fs.mkdirSync(path.dirname(path.join(root, name)), {recursive: true});
      fs.writeFileSync(path.join(root, name), bytes);
    }
    git(['add', '.']);
    git(['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'fixture']);
    for (const name of Object.keys(files)) fs.unlinkSync(path.join(root, name));
    git(['checkout', '--', ...Object.keys(files)]);
    assert.equal(fs.readFileSync(path.join(root, 'release/editor-artifacts.lock.json'), 'utf8'), files['release/editor-artifacts.lock.json']);
    fs.writeFileSync(path.join(root, 'licenses/bundled-node-notices.txt'), files['licenses/bundled-node-notices.txt']);
    assert.equal(git(['status', '--porcelain', '--untracked-files=no']).trim(), '');
  } finally {fs.rmSync(root, {recursive: true, force: true});}
});
