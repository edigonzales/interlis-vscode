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
