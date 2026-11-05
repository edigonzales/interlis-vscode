const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const cp = require('node:child_process');
const crypto = require('node:crypto');

function javaVersion(home) {
  if (!fs.existsSync(path.join(home, 'bin', process.platform === 'win32' ? 'javac.exe' : 'javac'))) return false;
  const executable = path.join(home, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
  const result = cp.spawnSync(executable, ['-version'], {encoding: 'utf8', timeout: 10000});
  return result.status === 0 && /version "25(?:[."])/.test(result.stdout + result.stderr);
}

function findJavaHome(env = process.env) {
  if (env.INTERLIS_DEV_JAVA_HOME) {
    if (!javaVersion(env.INTERLIS_DEV_JAVA_HOME)) throw Error('INTERLIS_DEV_JAVA_HOME must point to a Java 25 JDK');
    return fs.realpathSync(env.INTERLIS_DEV_JAVA_HOME);
  }
  const candidates = env.JAVA_HOME ? [env.JAVA_HOME] : [];
  if (process.platform === 'darwin') {
    const registered = cp.spawnSync('/usr/libexec/java_home', ['-v', '25'], {encoding: 'utf8'});
    if (registered.status === 0) candidates.push(registered.stdout.trim());
  }
  const sdkman = path.join(env.SDKMAN_DIR || path.join(os.homedir(), '.sdkman'), 'candidates/java');
  if (fs.existsSync(sdkman)) {
    const versions = fs.readdirSync(sdkman).filter(name => /^25(?:[.-]|$)/.test(name))
      .sort((a, b) => Number(b.endsWith('-tem')) - Number(a.endsWith('-tem')) || b.localeCompare(a, 'en', {numeric: true}));
    candidates.push(...versions.map(name => path.join(sdkman, name)));
  }
  for (const home of candidates) if (javaVersion(home)) return fs.realpathSync(home);
  const system = cp.spawnSync('java', ['-XshowSettings:properties', '-version'], {encoding: 'utf8', timeout: 10000});
  const systemHome = (system.stdout + system.stderr).match(/\bjava.home = ([^\r\n]+)/)?.[1];
  if (systemHome && javaVersion(systemHome.trim())) return fs.realpathSync(systemHome.trim());
  throw Error('Java 25 JDK not found. Set INTERLIS_DEV_JAVA_HOME or JAVA_HOME to its installation directory.');
}

function prepareDev({root = path.resolve(__dirname, '..'), coreDirectory, env = process.env} = {}) {
  if (Number(process.versions.node.split('.')[0]) < 22) throw Error('Development builds require Node 22 or newer');
  const core = path.resolve(coreDirectory || env.INTERLIS_CORE_DIR || path.join(root, '../interlis-java'));
  if (!fs.existsSync(path.join(core, 'build/InterlisJvmBuild.java'))) {
    throw Error('Core checkout not found at ' + core + '. Set INTERLIS_CORE_DIR or pass --core-dir.');
  }
  const javaHome = findJavaHome(env);
  const buildEnv = {...env, JAVA_HOME: javaHome, INTERLIS_NODE: env.INTERLIS_NODE || process.execPath,
    PATH: [path.dirname(process.execPath), path.join(javaHome, 'bin'), env.PATH || ''].join(path.delimiter)};
  const run = (command, args, cwd) => cp.execFileSync(command, args, {
    cwd, env: buildEnv, stdio: 'inherit', shell: process.platform === 'win32',
  });
  const build = path.join(root, 'build');
  fs.mkdirSync(build, {recursive: true});
  const stamp = path.join(build, 'dev-dependency-lock.sha256');
  const digest = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'package-lock.json'))).digest('hex');
  if (!fs.existsSync(path.join(root, 'node_modules/.package-lock.json')) ||
      !fs.existsSync(stamp) || fs.readFileSync(stamp, 'utf8').trim() !== digest) {
    run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['ci', '--ignore-scripts'], root);
    fs.writeFileSync(stamp, digest + '\n');
  }

  const development = path.join(build, 'dev-extension');
  fs.mkdirSync(development, {recursive: true});
  const provenance = require('./stage-core.cjs').stageCore(core, {output: development, development: true, env: buildEnv});
  // Compile copied sources against this Core's types without replacing release artifacts.
  for (const name of ['src', 'resources', 'licenses']) {
    fs.rmSync(path.join(development, name), {recursive: true, force: true});
    fs.cpSync(path.join(root, name), path.join(development, name), {recursive: true});
  }
  fs.copyFileSync(path.join(core, 'LICENSE'), path.join(development, 'licenses/interlis-java.txt'));
  for (const name of ['package.json', 'tsconfig.json', 'README.md', 'LICENSE']) {
    fs.copyFileSync(path.join(root, name), path.join(development, name));
  }
  const modules = path.join(development, 'node_modules');
  if (!fs.existsSync(modules)) fs.symlinkSync(path.join(root, 'node_modules'), modules, process.platform === 'win32' ? 'junction' : 'dir');
  fs.rmSync(path.join(development, 'out'), {recursive: true, force: true});
  run(process.execPath, [path.join(root, 'scripts/build.cjs')], development);

  const java = path.join(javaHome, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
  fs.writeFileSync(path.join(build, 'dev.env'), 'INTERLIS_DEV_JAVA=' + JSON.stringify(java.replaceAll('\\', '/')) + '\n');
  const record = {...provenance, javaHome, developmentPath: development, preparedAt: new Date().toISOString()};
  fs.writeFileSync(path.join(build, 'dev-preparation.json'), JSON.stringify(record, null, 2) + '\n');
  console.log('F5 ready: ' + development + '\nJava: ' + java + '\nRelease locks unchanged; editor installation reused.');
  return record;
}

module.exports = {prepareDev, findJavaHome};

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    if (args.length && (args.length !== 2 || args[0] !== '--core-dir')) throw Error('Usage: dev:prepare [-- --core-dir /path/to/interlis-java]');
    prepareDev({coreDirectory: args[1]});
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
