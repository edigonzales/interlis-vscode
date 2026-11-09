const fs = require('node:fs'), cp = require('node:child_process'), path = require('node:path'), crypto = require('node:crypto');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const json = file => JSON.parse(fs.readFileSync(file));
async function packageVSIX({target, input = process.cwd(), runtimeRoot = input, output = path.resolve('build/packages'), build = true, preRelease = false}) {
  if (!['darwin-arm64', 'linux-x64', 'win32-x64'].includes(target)) throw Error('Unsupported VSIX target');
  for (const dir of [input, runtimeRoot, output]) if (!path.isAbsolute(dir)) throw Error('Package input/runtime/output must be absolute');
  if (build) cp.execFileSync(process.execPath, [path.resolve('scripts/build.cjs')], {stdio: 'inherit'});
  const manifest = require('./distribution-metadata.cjs').distributionManifest(require('../package.json'));
  const {runtimeInventory} = require('../build/runtime.cjs'), {resolveLaunchPlan} = require('../build/launch.cjs');
  const runtimeLock = json(path.join(runtimeRoot, 'release/runtime-artifacts.lock.json')), record = runtimeLock.targets[target];
  if (!record) throw Error('Stage the pinned runtime for ' + target + ' first');
  const inventory = await runtimeInventory(path.join(runtimeRoot, 'artifacts/runtime', target), target !== 'win32-x64');
  if (JSON.stringify(inventory) !== JSON.stringify(record.files)) throw Error('Runtime inventory differs from its lock');
  fs.mkdirSync('build/package-stage', {recursive: true});
  const stage = fs.mkdtempSync(path.resolve('build/package-stage', target + '-'));
  let inspected;
  try {
    for (const name of ['package.json', 'README.md', 'LICENSE', '.vscodeignore', 'out', 'resources', 'licenses']) fs.cpSync(name, path.join(stage, name), {recursive: true, verbatimSymlinks: true});
    fs.writeFileSync(path.join(stage, 'package.json'), JSON.stringify(manifest, null, 2) + '\n');
    fs.mkdirSync(path.join(stage, 'release'));
    fs.copyFileSync(path.join(input, 'release/editor-artifacts.lock.json'), path.join(stage, 'release/editor-artifacts.lock.json'));
    for (const name of ['runtime-sources.lock.json', 'runtime-link.json']) fs.copyFileSync(path.join('release', name), path.join(stage, 'release', name));
    for (const name of ['runtime-artifacts.lock.json', 'runtime-build.json']) {
      const source = path.join(runtimeRoot, 'release', name);
      if (fs.existsSync(source)) fs.copyFileSync(source, path.join(stage, 'release', name));
    }
    fs.copyFileSync(path.join(runtimeRoot, 'licenses/runtime-NOTICE.txt'), path.join(stage, 'licenses/runtime-NOTICE.txt'));
    fs.copyFileSync(path.join(input, 'licenses/interlis-java.txt'), path.join(stage, 'licenses/interlis-java.txt'));
    fs.mkdirSync(path.join(stage, 'artifacts'));
    for (const name of fs.readdirSync(path.join(input, 'artifacts'))) if (name !== 'runtime') fs.cpSync(path.join(input, 'artifacts', name), path.join(stage, 'artifacts', name), {recursive: true, verbatimSymlinks: true});
    fs.mkdirSync(path.join(stage, 'artifacts/runtime'));
    fs.cpSync(path.join(runtimeRoot, 'artifacts/runtime', target), path.join(stage, 'artifacts/runtime', target), {recursive: true, verbatimSymlinks: true});
    const runtimeLockSha256 = hash(path.join(stage, 'release/runtime-artifacts.lock.json'));
    fs.writeFileSync(path.join(stage, 'release/distribution.json'), JSON.stringify({schemaVersion: 1, target, runtimeLockSha256}, null, 2) + '\n');
    const native = target === process.platform + '-' + process.arch;
    if (native) await resolveLaunchPlan(stage);
    fs.mkdirSync(output, {recursive: true});
    const vsix = path.join(output, 'interlis-editor-' + target + '.vsix');
    await require('@vscode/vsce').createVSIX({cwd: stage, packagePath: vsix, target, dependencies: false, preRelease});
    inspected = fs.mkdtempSync(path.resolve('build/vsix-inspect-'));
    const archive = await require('./vsix.cjs').extractVSIX(vsix, inspected), installed = path.join(inspected, 'extension');
    const packagedManifest = json(path.join(installed, 'package.json'));
    for (const key of ['name', 'publisher', 'displayName', 'version']) if (packagedManifest[key] !== manifest[key]) throw Error('VSIX manifest differs: ' + key);
    for (const key of ['homepage', 'bugs', 'repository']) {
      if (JSON.stringify(packagedManifest[key]) !== JSON.stringify(manifest[key])) throw Error('VSIX project link differs: ' + key);
    }
    const xml = fs.readFileSync(path.join(inspected, 'extension.vsixmanifest'), 'utf8');
    for (const attribute of [`Version="${manifest.version}"`, `Publisher="${manifest.publisher}"`, `Id="${manifest.name}"`, `TargetPlatform="${target}"`]) if (!xml.includes(attribute)) throw Error('VSIX XML identity/version/target differs: ' + attribute);
    if (xml.includes('Id="Microsoft.VisualStudio.Code.PreRelease" Value="true"') !== preRelease) throw Error('VSIX pre-release metadata differs');
    await require('../build/diagram-assets.cjs').verifyDiagramAssets(installed);
    if (hash(path.join(installed, 'release/runtime-artifacts.lock.json')) !== runtimeLockSha256) throw Error('VSIX lost its runtime inventory');
    const actual = await runtimeInventory(path.join(installed, 'artifacts/runtime', target), target !== 'win32-x64');
    if (JSON.stringify(actual) !== JSON.stringify(record.files)) throw Error('Packaged runtime bytes or modes differ');
    if (JSON.stringify(fs.readdirSync(path.join(installed, 'artifacts/runtime'))) !== JSON.stringify([target])) throw Error('VSIX contains another target runtime');
    if (native) await resolveLaunchPlan(installed);
    const report = {target, extensionId: manifest.publisher + '.' + manifest.name, version: manifest.version, vsixSha256: hash(vsix), runtimeArchiveSha256: record.archiveSha256, entries: archive.entries, uncompressedBytes: archive.uncompressedBytes, runtimeBytes: require('./runtime-selection.cjs').directoryBytes(path.join(installed, 'artifacts/runtime', target)), extractedInventoryVerified: true, temporaryInspectionRemoved: true, nativeRuntimeProbe: native};
    fs.writeFileSync(vsix.replace(/\.vsix$/, '.inventory.json'), JSON.stringify(report, null, 2) + '\n');
    console.log('Verified actual VSIX with exactly one pinned runtime: ' + vsix);
    return {vsix, ...report};
  } finally {
    if (inspected) fs.rmSync(inspected, {recursive: true, force: true});
    fs.rmSync(stage, {recursive: true, force: true});
  }
}
if (require.main === module) {
  const options = {};
  for (let i = 2; i < process.argv.length; i += 2) {
    const key = {'--target': 'target', '--input': 'input', '--runtime-root': 'runtimeRoot', '--output': 'output'}[process.argv[i]];
    if (!key || !process.argv[i + 1]) throw Error('Usage: package --target target [--input absolute-root] [--runtime-root absolute-root] [--output absolute-directory]');
    options[key] = process.argv[i + 1];
  }
  packageVSIX(options).catch(error => {console.error(error); process.exitCode = 1;});
}
module.exports = {packageVSIX};
