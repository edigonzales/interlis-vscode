const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
process.chdir(root);
const target = process.platform + '-' + process.arch;
const output = path.resolve('build/ci/smoke-' + target);
const vsix = path.resolve('build/packages/interlis-editor-' + target + '.vsix');
fs.mkdirSync(output, {recursive: true});
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
  const expected = require('../distribution-metadata.cjs').distributionManifest(require('../../package.json'));
  const {manifest: packaged, xml} = await require('../vsix.cjs').readVSIX(vsix);
  for (const key of ['name', 'publisher', 'displayName', 'version']) assert.equal(packaged[key], expected[key]);
  for (const attribute of [`Version="${packaged.version}"`, `Publisher="${packaged.publisher}"`,
    `Id="${packaged.name}"`, `TargetPlatform="${target}"`]) assert.ok(xml.includes(attribute), 'VSIX metadata differs: ' + attribute);
  assert.equal(xml.includes('Id="Microsoft.VisualStudio.Code.PreRelease" Value="true"'),
    process.env.INTERLIS_CI_PRERELEASE === 'true');
  const extensionId = packaged.publisher + '.' + packaged.name;
  Object.assign(report, {extensionId, version: packaged.version});
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
    const quote = value => {if (/[&|<>^%!\r\n"\0]/.test(value)) throw Error('Unexpected Windows command metacharacter in generated smoke path'); return '"' + value + '"';};
    const command = '"' + [shim, ...args].map(quote).join(' ') + '"';
    return run(process.env.ComSpec || 'C:\\Windows\\System32\\cmd.exe', ['/d', '/s', '/c', command], {}, {windowsVerbatimArguments: true});
  }
  const extensions = path.join(output, 'Installed Extensions ä');
  fs.rmSync(extensions, {recursive: true, force: true});
  const user = path.join(output, 'User profile ä');
  runCli(['--shared-data-dir', path.join(output, 'Shared profile ä'), '--user-data-dir', user, '--extensions-dir', extensions, '--install-extension', vsix, '--force']);
  const ids = runCli(['--shared-data-dir', path.join(output, 'Shared profile ä'), '--user-data-dir', user, '--extensions-dir', extensions, '--list-extensions', '--show-versions']);
  assert.ok(ids.split(/\r?\n/).map(line => line.trim()).includes(extensionId + '@' + packaged.version), 'Installed CLI identity/version differs');
  const installed = fs.readdirSync(extensions).filter(name => name.startsWith(extensionId + '-'));
  assert.equal(installed.length, 1, 'Expected one installed test extension');
  const extension = path.join(extensions, installed[0]);
  assert.deepEqual(fs.readdirSync(path.join(extension, 'runtime')), [target]);
  assert.ok(fs.existsSync(path.join(extension, 'licenses/interlis-lsp/INTERLIS.txt')));
  assert.ok(fs.existsSync(path.join(extension, 'runtime', target, 'legal/java.base/LICENSE')));
  await require('../../build/diagram-assets.cjs').verifyDiagramAssets(extension);
  const {resolveLaunchPlan} = require('../../build/launch.cjs');
  const plan = await resolveLaunchPlan(extension);
  assert.ok(plan.java.startsWith(extension + path.sep));
  report.launch = {java: plan.java, runtimeSource: plan.runtimeSource};
  run(process.execPath, ['--test', 'test/protocol.test.cjs'], {INTERLIS_JAVA: '', INTERLIS_TEST_EXTENSION_ROOT: extension});
  report.https = await require('./https-smoke.cjs').check(plan.java, output, run, extension);
  report.status = 'passed';
})().catch(error => {report.status = 'failed'; report.error = error.stack; process.exitCode = 1; console.error(error);}).finally(() => {
  report.finishedAt = new Date().toISOString();
  report.elapsedMs = Date.parse(report.finishedAt) - Date.parse(report.startedAt);
  fs.writeFileSync(path.join(output, 'result.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({target, status: report.status, elapsedMs: report.elapsedMs}));
});
