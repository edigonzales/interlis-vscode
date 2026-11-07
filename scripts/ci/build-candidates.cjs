const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..'); process.chdir(root);
const target = process.platform + '-' + process.arch;
const input = path.resolve('build/common'), output = path.resolve('build/packages');
const git = args => cp.execFileSync('git', args, {encoding: 'utf8'}).trim();
function clean() {
  const dirty = git(['status', '--porcelain', '--untracked-files=no']);
  if (dirty) throw Error('CI changed tracked product files:\n' + dirty + '\n' + git(['diff', '--stat']) + '\n' + git(['diff', '--numstat']));
}
function run(script, env = {}) {cp.execFileSync(process.execPath, [script], {stdio: 'inherit', env: {...process.env, JAVA_TOOL_OPTIONS: '', JDK_JAVA_OPTIONS: '', _JAVA_OPTIONS: '', ...env}});}
(async () => {
  if (!['darwin-arm64', 'linux-x64', 'win32-x64'].includes(target) || (process.env.INTERLIS_CI_TARGET && process.env.INTERLIS_CI_TARGET !== target)) throw Error('Wrong native runner architecture: ' + target);
  clean();
  const provenance = JSON.parse(fs.readFileSync(path.join(input, 'build-provenance.json')));
  if (provenance.extensionSha !== git(['rev-parse', 'HEAD'])) throw Error('Foreign common build');
  const lock = JSON.parse(fs.readFileSync('release/editor-artifacts.lock.json'));
  const stagedLock = JSON.parse(fs.readFileSync(path.join(input, 'release/editor-artifacts.lock.json')));
  if (lock.coreCommit !== provenance.coreSha) throw Error('Foreign Core commit');
  require('node:assert/strict').deepEqual(stagedLock, {...lock, bundleManifestSha256: provenance.bundleManifestSha256},
    'Foreign Core artifact lock');
  // TypeScript builds consume the exact common renderer declarations.
  fs.rmSync('artifacts', {recursive: true, force: true});
  fs.cpSync(path.join(input, 'artifacts'), 'artifacts', {recursive: true});
  run('scripts/build.cjs'); run('scripts/verify-dependencies.cjs');
  cp.execFileSync(process.execPath, ['--test', 'test/unit/runtime-selection.test.cjs', 'test/unit/distribution-metadata.test.cjs'], {stdio: 'inherit'});
  const preRelease = process.env.INTERLIS_CI_PRERELEASE === 'true';
  const reports = {};
  for (const variant of (preRelease ? ['jlink'] : ['full-jre', 'jlink'])) {
    const runtimeRoot = path.resolve('build/runtimes', target, variant), packages = preRelease ? output : path.resolve('build/comparison', target, variant);
    await require('../stage-runtime.cjs').stageRuntime({target, variant, input, output: runtimeRoot});
    reports[variant] = await require('../package.cjs').packageVSIX({target, input, runtimeRoot, output: packages, build: false, preRelease});
    fs.copyFileSync(path.join(input, 'build-provenance.json'), path.join(packages, 'build-provenance.json'));
    run('scripts/ci/smoke.cjs', {INTERLIS_SMOKE_PACKAGES: packages, INTERLIS_SMOKE_LABEL: preRelease ? 'selected' : variant});
    clean();
  }
  if (preRelease) return;
  const decision = {...require('../runtime-selection.cjs').selectRuntime(fs.statSync(reports['full-jre'].vsix).size, fs.statSync(reports.jlink.vsix).size), target, fullJreRuntimeBytes: reports['full-jre'].runtimeBytes, jlinkRuntimeBytes: reports.jlink.runtimeBytes, candidateTests: 'passed'};
  const selected = reports[decision.variant];
  fs.mkdirSync(output, {recursive: true});
  const name = 'interlis-editor-' + target;
  for (const suffix of ['.vsix', '.inventory.json']) fs.copyFileSync(selected.vsix.replace(/\.vsix$/, suffix), path.join(output, name + suffix));
  fs.copyFileSync(path.join(input, 'build-provenance.json'), path.join(output, 'build-provenance.json'));
  run('scripts/ci/smoke.cjs', {INTERLIS_SMOKE_LABEL: 'selected'});
  decision.selectedTests = 'passed';
  decision.vsixSha256 = crypto.createHash('sha256').update(fs.readFileSync(path.join(output, name + '.vsix'))).digest('hex');
  fs.writeFileSync(path.join(output, name + '.selection.json'), JSON.stringify(decision, null, 2) + '\n');
  const summary = `| ${target} | ${decision.fullJreBytes} | ${decision.jlinkBytes} | ${decision.fullJreRuntimeBytes} | ${decision.jlinkRuntimeBytes} | ${(decision.savings * 100).toFixed(2)}% | ${decision.variant} | passed |\n`;
  if (process.env.GITHUB_STEP_SUMMARY) fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, '| Target | Full JRE VSIX bytes | jlink VSIX bytes | Full JRE runtime bytes | jlink runtime bytes | Savings | Selected | Tests |\n|---|---:|---:|---:|---:|---:|---|---|\n' + summary);
  clean(); console.log(JSON.stringify(decision));
})().catch(error => {console.error(error); process.exitCode = 1;});
