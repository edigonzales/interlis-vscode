const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
process.chdir(root);
const target = process.platform + '-' + process.arch;
const output = path.resolve('build/ci/smoke-' + target);
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
  assert.ok(['linux-x64', 'win32-x64'].includes(target));
  const vsix = path.resolve('build/packages/interlis-vscode-' + target + '.vsix');
  const inventory = JSON.parse(fs.readFileSync(vsix.replace(/\.vsix$/, '.inventory.json')));
  const provenance = JSON.parse(fs.readFileSync('build/packages/build-provenance.json'));
  const extensionSha = cp.execFileSync('git', ['rev-parse', 'HEAD'], {encoding: 'utf8'}).trim();
  assert.equal(provenance.extensionSha, extensionSha);
  assert.equal(hash(vsix), inventory.vsixSha256);
  Object.assign(report, {extensionSha, coreSha: provenance.coreSha, vsixSha256: hash(vsix)});
  const unpack = path.join(output, 'Unicode Modelle ä');
  await require('../vsix.cjs').extractVSIX(vsix, unpack);
  const extension = path.join(unpack, 'extension');
  const lock = JSON.parse(fs.readFileSync(path.join(extension, 'release/editor-artifacts.lock.json')));
  assert.equal(lock.coreCommit, provenance.coreSha);
  // Build test adapters using the exact assets extracted from the actual VSIX.
  fs.cpSync(path.join(extension, 'artifacts'), path.resolve('artifacts'), {recursive: true});
  run(process.execPath, ['scripts/build.cjs']);
  const {resolveLaunchPlan} = require('../../build/launch.cjs');
  const plan = await resolveLaunchPlan(extension);
  assert.ok(plan.java.startsWith(extension + path.sep));
  report.launch = {java: plan.java, coreCommit: plan.coreCommit, bundleDigest: plan.bundleDigest, runtimeDigest: plan.runtimeDigest, runtimeSource: plan.runtimeSource};
  run(process.execPath, ['--test', 'test/protocol.test.cjs'], {INTERLIS_JAVA: '', INTERLIS_TEST_EXTENSION_ROOT: extension});
  // Exercise VS Code's genuine installation CLI, without starting an Electron GUI.
  const {downloadAndUnzipVSCode} = require('@vscode/test-electron');
  const code = await downloadAndUnzipVSCode({version: '1.140.0'});
  const cli = path.join(path.dirname(code), 'resources/app/out/cli.js');
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
  assert.match(ids, /edigonzales\.interlis-vscode@0\.0\.1/);
  report.cliInstalled = true;
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
