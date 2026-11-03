const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const {pipeline} = require('node:stream/promises');
const {Readable} = require('node:stream');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const json = file => JSON.parse(fs.readFileSync(file));
const writeJSON = (file, value) => {fs.mkdirSync(path.dirname(file), {recursive: true}); fs.writeFileSync(file, JSON.stringify(value, null, 2) + '\n');};

async function download(source, cache) {
  fs.mkdirSync(cache, {recursive: true});
  const file = path.join(cache, source.archive.name);
  function verify(candidate) {
    if (fs.statSync(candidate).size !== source.archive.size || hash(candidate) !== source.archive.sha256) throw Error('Runtime archive size/digest mismatch: ' + candidate);
  }
  if (fs.existsSync(file)) {verify(file); return file;}
  const response = await fetch(source.archive.url, {signal: AbortSignal.timeout(240000)});
  if (!response.ok) throw Error('Runtime download HTTP ' + response.status);
  const temporary = file + '.' + process.pid + '.tmp';
  try {
    await pipeline(Readable.fromWeb(response.body), fs.createWriteStream(temporary, {flags: 'wx'}));
    verify(temporary);
    const check = await fetch(source.checksumUrl, {signal: AbortSignal.timeout(30000)});
    if (!check.ok || !(await check.text()).trim().startsWith(source.archive.sha256)) throw Error('Vendor checksum sidecar mismatch');
    fs.renameSync(temporary, file);
  } finally {fs.rmSync(temporary, {force: true});}
  return file;
}

async function extract(source, archive, temporary, runtimeInventory) {
  // Windows runners ship bsdtar, which supports both ZIP and tar.gz.
  const tar = process.platform === 'win32' ? path.join(process.env.SystemRoot || 'C:\\Windows', 'System32/tar.exe') : 'tar';
  const entries = cp.execFileSync(tar, ['-tf', archive], {encoding: 'utf8', maxBuffer: 16 * 1024 * 1024}).split(/\r?\n/).filter(Boolean);
  if (entries.some(name => name.startsWith('/') || /^[A-Za-z]:/.test(name) || name.includes('\\') || name.split('/').includes('..'))) throw Error('Unsafe runtime archive entry');
  cp.execFileSync(tar, ['-xf', archive, '-C', temporary]);
  const roots = fs.readdirSync(temporary);
  if (roots.length !== 1) throw Error('Unexpected runtime archive roots');
  const home = path.join(temporary, roots[0], ...(source.os === 'mac' ? ['Contents', 'Home'] : []));
  if (!fs.existsSync(path.join(home, source.java)) || !fs.existsSync(path.join(home, 'legal/java.base/LICENSE'))) throw Error('Runtime launcher or vendor license absent');
  await runtimeInventory(home);
  return home;
}

async function stageRuntime({target, variant = 'full-jre', output = process.cwd(), input = process.cwd(), cache = path.resolve('build/runtime-downloads')}) {
  const sources = json('release/runtime-sources.lock.json');
  const source = variant === 'jlink' ? sources.targets[target]?.jdk : sources.targets[target];
  if (!source || !['full-jre', 'jlink'].includes(variant)) throw Error('Unsupported runtime target or variant');
  if (variant === 'jlink' && target !== process.platform + '-' + process.arch) throw Error('jlink requires a native target runner');
  for (const dir of [output, input, cache]) if (!path.isAbsolute(dir)) throw Error('Runtime input/output/cache must be absolute');
  fs.mkdirSync('build', {recursive: true});
  require('esbuild').buildSync({entryPoints: ['src/host/runtime.ts'], outfile: 'build/runtime.cjs', bundle: true, platform: 'node', format: 'cjs'});
  const {runtimeInventory} = require('../build/runtime.cjs');
  const archive = await download(source, cache);
  const temporary = fs.mkdtempSync(path.resolve('build/runtime-extract-'));
  const destination = path.join(output, 'artifacts/runtime', target);
  const serverLock = path.join(input, 'release/editor-artifacts.lock.json');
  const server = json(serverLock);
  const provenance = {schemaVersion: 1, target, variant, version: source.version, archiveSha256: source.archive.sha256, archiveUrl: source.archive.url,
    coreCommit: server.coreCommit, serverLockSha256: hash(serverLock), serverFiles: server.files, modules: [], linkerOptions: []};
  try {
    const home = await extract(source, archive, temporary, runtimeInventory);
    fs.mkdirSync(path.dirname(destination), {recursive: true});
    fs.rmSync(destination, {recursive: true, force: true});
    if (variant === 'full-jre') fs.cpSync(home, destination, {recursive: true, dereference: true});
    else {
      const suffix = process.platform === 'win32' ? '.exe' : '';
      const run = (tool, args) => cp.execFileSync(path.join(home, 'bin', tool + suffix), args, {encoding: 'utf8', maxBuffer: 16 * 1024 * 1024});
      run('java', ['-version']);
      const jars = server.files.map(file => {
        const jar = path.join(input, 'artifacts/server', file.path);
        if (!/^lib\/[\w.-]+\.jar$/.test(file.path) || hash(jar) !== file.sha256) throw Error('Invalid locked server JAR: ' + file.path);
        return jar;
      });
      const actual = fs.readdirSync(path.join(input, 'artifacts/server/lib')).sort();
      if (JSON.stringify(actual) !== JSON.stringify(server.files.map(file => path.basename(file.path)).sort())) throw Error('Unexpected server libraries');
      const analysis = run('jdeps', ['--multi-release', '25', '--print-module-deps', '--class-path', jars.join(path.delimiter), ...jars]);
      const lines = analysis.trim().split(/\r?\n/);
      const detected = lines.at(-1);
      if (!/^[a-zA-Z][\w.]*(?:,[a-zA-Z][\w.]*)*$/.test(detected)) throw Error('Invalid jdeps module result: ' + analysis);
      const config = json('release/runtime-link.json');
      const modules = [...new Set([...detected.split(','), ...config.additionalModules])].sort();
      const args = ['--module-path', path.join(home, 'jmods'), '--add-modules', modules.join(','), ...config.options, '--output', destination];
      run('jlink', args);
      // Materialize legal-file links consistently with the full-JRE package.
      await runtimeInventory(destination);
      const materialized = destination + '.materialized';
      fs.cpSync(destination, materialized, {recursive: true, dereference: true});
      fs.rmSync(destination, {recursive: true}); fs.renameSync(materialized, destination);
      if (hash(path.join(destination, 'lib/security/cacerts')) !== hash(path.join(home, 'lib/security/cacerts'))) throw Error('jlink changed vendor trust anchors');
      Object.assign(provenance, {modules, moduleReasons: config.moduleReasons, linkerOptions: config.options, linkConfigurationSha256: hash('release/runtime-link.json'), jdepsOutput: analysis.replaceAll(input, '<common>'), linkedModules: runImage(destination, ['--list-modules'])});
    }
    const record = {version: source.version, archiveSha256: source.archive.sha256, java: source.java, files: await runtimeInventory(destination, target !== 'win32-x64')};
    const lockFile = path.join(output, 'release/runtime-artifacts.lock.json');
    const lock = fs.existsSync(lockFile) ? json(lockFile) : {schemaVersion: 1, targets: {}};
    lock.targets[target] = record;
    writeJSON(lockFile, lock);
    writeJSON(path.join(output, 'release/runtime-build.json'), provenance);
    fs.mkdirSync(path.join(output, 'licenses'), {recursive: true});
    fs.writeFileSync(path.join(output, 'licenses/runtime-NOTICE.txt'), `Eclipse Adoptium Temurin Java 25 (${source.version}), ${target}.\n` +
      (variant === 'jlink' ? 'Custom runtime generated from the vendor JDK using jlink; see release/runtime-build.json for modules and options.\n' : 'Vendor JRE binaries unmodified; legal-file links materialized for portable VSIX extraction.\n') +
      `Vendor licenses and notices retained under artifacts/runtime/${target}/legal.\nOpenJDK is GPLv2 with the Classpath Exception, with component-specific notices.\nVendor source/build metadata: ${source.releaseUrl}\nSCM: ${source.scmRef}\nArchive: ${source.archive.url}\nSHA256: ${source.archive.sha256}\n`);
    console.log(`Staged ${target} ${variant}: ${record.files.length} locked files`);
    return provenance;
  } finally {fs.rmSync(temporary, {recursive: true, force: true});}
}
function runImage(root, args) {
  return cp.execFileSync(path.join(root, 'bin', process.platform === 'win32' ? 'java.exe' : 'java'), args, {encoding: 'utf8'});
}
if (require.main === module) {
  const options = {};
  for (let i = 2; i < process.argv.length; i += 2) {
    if (!['--target', '--variant', '--output', '--input', '--cache'].includes(process.argv[i]) || !process.argv[i + 1]) throw Error('Usage: stage-runtime --target target|all [--variant full-jre|jlink] [--input absolute-root] [--output absolute-root] [--cache absolute-directory]');
    options[process.argv[i].slice(2)] = process.argv[i + 1];
  }
  (async () => {
    const targets = options.target === 'all' ? Object.keys(json('release/runtime-sources.lock.json').targets) : [options.target];
    const records = {}, notices = [], output = options.output || process.cwd();
    for (const target of targets) {
      records[target] = await stageRuntime({...options, target});
      notices.push(fs.readFileSync(path.join(output, 'licenses/runtime-NOTICE.txt'), 'utf8'));
    }
    if (targets.length > 1) {
      writeJSON(path.join(output, 'release/runtime-build.json'), {schemaVersion: 1, targets: records});
      fs.writeFileSync(path.join(output, 'licenses/runtime-NOTICE.txt'), notices.join('\n'));
    }
  })().catch(error => {console.error(error); process.exitCode = 1;});
}
module.exports = {stageRuntime, download};
