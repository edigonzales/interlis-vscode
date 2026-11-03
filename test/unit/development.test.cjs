const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const cp = require('node:child_process');
const {stageCore} = require('../../scripts/stage-core.cjs');
const {findJavaHome} = require('../../scripts/prepare-dev.cjs');

test('release staging still rejects local Core changes before running the build', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'interlis-dirty-core-'));
  const git = args => cp.execFileSync('git', args, {cwd: dir, stdio: 'pipe'});
  try {
    git(['init']);
    fs.writeFileSync(path.join(dir, 'source.txt'), 'original');
    git(['add', 'source.txt']);
    git(['-c', 'user.name=Test', '-c', 'user.email=test@example.invalid', 'commit', '-m', 'fixture']);
    fs.appendFileSync(path.join(dir, 'source.txt'), 'local edit');
    assert.throws(() => stageCore(dir, {output: path.join(dir, 'output')}), /Core tracked tree must be clean/);
    assert.equal(fs.existsSync(path.join(dir, 'output')), false);
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
});

test('an explicitly configured invalid development JDK fails instead of using another Java', () => {
  assert.throws(() => findJavaHome({INTERLIS_DEV_JAVA_HOME: '/nonexistent/interlis-jdk'}), /must point to a Java 25 JDK/);
});
