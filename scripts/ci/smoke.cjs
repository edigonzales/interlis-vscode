const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
process.chdir(root);
const target = process.platform + '-' + process.arch;
const label = process.env.INTERLIS_SMOKE_LABEL || 'selected';
if (!/^[a-z-]+$/.test(label)) throw Error('Invalid smoke label');
const output = path.resolve('build/ci/smoke-' + target + '-' + label);
const packages = path.resolve(process.env.INTERLIS_SMOKE_PACKAGES || 'build/packages');
fs.mkdirSync(output, {recursive: true});
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const report = {startedAt: new Date().toISOString(), target, node: process.version, guiTested: false, commands: [], status: 'running'};
function run(exe, args, env = {}, nativeOptions = {}) {
  const result = cp.spawnSync(exe, args, {encoding: 'utf8', env: {...process.env, ...env}, timeout: 120000, windowsHide: true, ...nativeOptions});
  const index = report.commands.length;
  fs.writeFileSync(path.join(output, 'command-' + index + '.log'), (result.stdout || '') + (result.stderr || ''));
  report.commands.push({exe, args, exit: result.status, signal: result.signal, error: result.error?.message});
  if (result.status !== 0) throw Error('Smoke command failed: ' + exe + ' ' + args.join(' '));
  return result.stdout;
}
(async () => {
  assert.ok(['darwin-arm64', 'linux-x64', 'win32-x64'].includes(target));
  const vsix = path.join(packages, 'interlis-editor-' + target + '.vsix');
  const inventory = JSON.parse(fs.readFileSync(vsix.replace(/\.vsix$/, '.inventory.json')));
  const provenance = JSON.parse(fs.readFileSync(path.join(packages, 'build-provenance.json')));
  const extensionSha = cp.execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
  assert.equal(provenance.extensionSha, extensionSha);
  assert.equal(hash(vsix), inventory.vsixSha256);
  Object.assign(report, {extensionSha, coreSha: provenance.coreSha, vsixSha256: hash(vsix)});
  const unpack = path.join(output, 'Unicode Modelle ä');
  fs.rmSync(unpack, {recursive: true, force: true});
  await require('../vsix.cjs').extractVSIX(vsix, unpack);
  const extension = path.join(unpack, 'extension');
  const manifest = JSON.parse(fs.readFileSync(path.join(extension, 'package.json')));
  const expected = require('../distribution-metadata.cjs').distributionManifest(require('../../package.json'));
  for (const key of ['name', 'publisher', 'displayName', 'version']) assert.equal(manifest[key], expected[key]);
  const extensionId = manifest.publisher + '.' + manifest.name;
  assert.equal(inventory.extensionId, extensionId);
  assert.equal(inventory.version, manifest.version);
  assert.equal(provenance.extensionId, extensionId);
  assert.equal(provenance.version, manifest.version);
  Object.assign(report, {extensionId, version: manifest.version});
  const lock = JSON.parse(fs.readFileSync(path.join(extension, 'release/editor-artifacts.lock.json')));
  assert.equal(lock.coreCommit, provenance.coreSha);
  // Build test adapters using the exact assets extracted from the actual VSIX.
  for (const name of fs.readdirSync(path.join(extension, 'artifacts'))) {
    if (name === 'runtime') continue;
    fs.rmSync(path.resolve('artifacts', name), {recursive: true, force: true});
    fs.cpSync(path.join(extension, 'artifacts', name), path.resolve('artifacts', name), {recursive: true});
  }
  run(process.execPath, ['scripts/build.cjs']);
  const {resolveLaunchPlan} = require('../../build/launch.cjs');
  const plan = await resolveLaunchPlan(extension);
  assert.ok(plan.java.startsWith(extension + path.sep));
  report.launch = {java: plan.java, coreCommit: plan.coreCommit, bundleDigest: plan.bundleDigest, runtimeDigest: plan.runtimeDigest, runtimeSource: plan.runtimeSource};
  run(process.execPath, ['--test', 'test/protocol.test.cjs'], {INTERLIS_JAVA: '', INTERLIS_TEST_EXTENSION_ROOT: extension});
  run(process.execPath, ['--test', 'test/unit/runtime.test.cjs'], {INTERLIS_TEST_EXTENSION_ROOT: extension});
  report.https = await require('./https-smoke.cjs').check(plan.java, output, run, extension);
  // Exercise VS Code's genuine installation CLI, without starting an Electron GUI.
  const {downloadAndUnzipVSCode} = require('@vscode/test-electron');
  let code = await downloadAndUnzipVSCode({version: '1.140.0'});
  if (process.platform === 'darwin' && !fs.existsSync(code)) {
    const plist = path.resolve(path.dirname(code), '../Info.plist');
    const executable = cp.execFileSync('/usr/libexec/PlistBuddy', ['-c', 'Print :CFBundleExecutable', plist], {encoding: 'utf8'}).trim();
    if (!/^[\w -]+$/.test(executable)) throw Error('Invalid VS Code bundle executable');
    code = path.join(path.dirname(code), executable);
  }
  const cli = process.platform === 'darwin' ? path.resolve(path.dirname(code), '../Resources/app/out/cli.js') : path.join(path.dirname(code), 'resources/app/out/cli.js');
  function runCli(args) {
    if (process.platform !== 'win32') return run(code, [cli, ...args], {ELECTRON_RUN_AS_NODE: '1'});
    // Use the vendor's Windows CLI shim, whose entrypoint layout can differ.
    const shim = require('@vscode/test-electron').resolveCliPathFromVSCodeExecutablePath(code);
    report.cliShim = {path: shim, sha256: hash(shim), text: fs.readFileSync(shim, 'utf8')};
    const quote = value => {if (/[&|<>^%!\r\n"\0]/.test(value)) throw Error('Unexpected Windows command metacharacter in generated smoke path'); return '"' + value + '"';};
    const command = '"' + [shim, ...args].map(quote).join(' ') + '"';
    return run(process.env.ComSpec || 'C:\\Windows\\System32\\cmd.exe', ['/d', '/s', '/c', command], {}, {windowsVerbatimArguments: true});
  }
  const extensions = path.join(output, 'Installed Extensions ä');
  const user = path.join(output, 'User profile ä');
  runCli(['--shared-data-dir', path.join(output, 'Shared profile ä'), '--user-data-dir', user, '--extensions-dir', extensions, '--install-extension', vsix, '--force']);
  const ids = runCli(['--shared-data-dir', path.join(output, 'Shared profile ä'), '--user-data-dir', user, '--extensions-dir', extensions, '--list-extensions', '--show-versions']);
  assert.ok(ids.split(/\r?\n/).map(line => line.trim()).includes(extensionId + '@' + manifest.version), 'Installed CLI identity/version differs');
  report.cliInstalled = true;
  report.extensionRoot = extension;
  report.code = code;
  const missing = path.join(extension, 'artifacts/server', lock.files.find(f => /interlis-lsp.*\.jar$/.test(f.path)).path);
  const backup = fs.readFileSync(missing);
  fs.unlinkSync(missing);
  try { await assert.rejects(resolveLaunchPlan(extension), /missing|ENOENT|inventory|digest/i); report.missingServerRejected = true; }
  finally {fs.writeFileSync(missing, backup);}
  report.status = 'passed';
})().catch(error => {report.status = 'failed'; report.error = error.stack; process.exitCode = 1; console.error(error);}).finally(() => {
  report.finishedAt = new Date().toISOString();
  report.elapsedMs = Date.parse(report.finishedAt) - Date.parse(report.startedAt);
  fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({target, status: report.status, elapsedMs: report.elapsedMs}));
});
