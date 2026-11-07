// Build the common, locked Core bundle once; native jobs only link/package it.
const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process');
const root = path.resolve(__dirname, '../..'); process.chdir(root);
const core = path.resolve(root, '../core'), output = path.resolve('build/common');
const git = (dir, args) => cp.execFileSync('git', ['-C', dir, ...args], {encoding: 'utf8'}).trim();
const lock = JSON.parse(fs.readFileSync('release/editor-artifacts.lock.json'));
if (git(core, ['rev-parse', 'HEAD']) !== lock.coreCommit) throw Error('Wrong Core checkout');
const {bundleManifestSha256} = require('../stage-core.cjs').stageCore(core, {output});
const stagedLock = JSON.parse(fs.readFileSync(path.join(output, 'release/editor-artifacts.lock.json')));
// The producer manifest binds this build's inventory. Match the locked product files independently.
require('node:assert/strict').deepEqual(stagedLock, {...lock, bundleManifestSha256},
  'Core rebuild differs from committed server/renderer lock');
const record = {schemaVersion: 1, coreSha: lock.coreCommit, bundleManifestSha256, extensionSha: git(root, ['rev-parse', 'HEAD']), extensionId: 'edigonzales.interlis-editor', version: require('../distribution-metadata.cjs').distributionManifest(require('../../package.json')).version};
fs.writeFileSync(path.join(output, 'build-provenance.json'), JSON.stringify(record, null, 2) + '\n');
if (git(root, ['status', '--porcelain', '--untracked-files=no'])) throw Error('Common build changed tracked sources');
// Archive transport preserves executable modes; upload-artifact alone does not.
cp.execFileSync('tar', ['-czf', path.resolve('build/common.tar.gz'), '-C', output, '.']);
