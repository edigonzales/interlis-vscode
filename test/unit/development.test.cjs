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

test('macOS development Node selection works without a shell-initialized PATH', {skip: process.platform !== 'darwin'}, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'interlis node selection '));
  const writeNode = (file, version) => {
    fs.mkdirSync(path.dirname(file), {recursive: true});
    fs.writeFileSync(file, '#!/bin/sh\nprintf "%s\\n" ' + version + '\n', {mode: 0o700});
  };
  try {
    fs.writeFileSync(path.join(dir, 'gradle.properties'), 'nodeVersion=99.12.34\n');
    const env = {HOME: dir, PATH: '/usr/bin:/bin'};
    const installed = path.join(dir, 'Library/Application Support/fnm/node-versions/v99.12.34/installation/bin/node');
    const onPath = path.join(dir, 'bin/node');
    const override = path.join(dir, 'override node');
    const resolve = extra => cp.spawnSync('/bin/sh', [
      path.resolve(__dirname, '../../scripts/prepare-dev-macos.sh'), '--resolve-node', dir,
    ], {env: {...env, ...extra}, encoding: 'utf8'});
    const selected = (result, expected) => {
      assert.equal(result.status, 0, result.stderr);
      assert.equal(result.stdout.trim(), expected);
    };

    writeNode(installed, 'v99.12.34');
    selected(resolve(), installed);
    writeNode(onPath, 'v98.0.0');
    const withPath = {PATH: path.dirname(onPath) + ':' + env.PATH};
    selected(resolve(withPath), installed);
    writeNode(override, 'v99.12.34');
    selected(resolve({INTERLIS_NODE: override}), override);
    const badOverride = resolve({INTERLIS_NODE: onPath});
    assert.equal(badOverride.status, 1);
    assert.ok(badOverride.stderr.includes(onPath));
    assert.match(badOverride.stderr, /v99\.12\.34 \(found v98\.0\.0\)/);
    assert.equal(resolve({INTERLIS_NODE: 'bin/node'}).status, 1);

    const custom = path.join(dir, 'custom fnm');
    const customNode = path.join(custom, 'node-versions/v99.12.34/installation/bin/node');
    writeNode(customNode, 'v99.12.34');
    selected(resolve({FNM_DIR: custom}), customNode);

    fs.unlinkSync(installed);
    const missing = resolve(withPath);
    assert.equal(missing.status, 1);
    assert.match(missing.stderr, /fnm install 99\.12\.34/);
    writeNode(onPath, 'v99.12.34');
    selected(resolve(withPath), onPath);
  } finally { fs.rmSync(dir, {recursive: true, force: true}); }
});
