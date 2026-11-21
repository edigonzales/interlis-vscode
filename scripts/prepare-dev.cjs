const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {pathToFileURL} = require('node:url');
const {execFileSync, spawnSync} = require('node:child_process');

const root = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const local = args.length === 1 && args[0] === '--local';
if (args.length && !local) throw Error('Usage: npm run dev:prepare [-- --local]');
const development = local ? path.join(root, 'build/dev-extension') : root;
if (local) fs.rmSync(development, {recursive: true, force: true});

const windows = process.platform === 'win32';
const javaName = windows ? 'java.exe' : 'java';
const javaHome = process.env.JAVA_HOME ||
  (process.platform === 'darwin' && fs.existsSync(path.join(os.homedir(), '.sdkman/candidates/java/current/bin/java'))
    ? path.join(os.homedir(), '.sdkman/candidates/java/current') : '');
if (!javaHome) throw Error('Set JAVA_HOME to a Java 25 JDK for the Development Host.');
const java = path.resolve(javaHome, 'bin', javaName);
const version = spawnSync(java, ['-version'], {encoding: 'utf8', timeout: 10000});
if (version.status !== 0 || !/version "25(?:[."])/.test(version.stdout + version.stderr) ||
    !fs.existsSync(path.join(javaHome, 'bin', windows ? 'javac.exe' : 'javac'))) {
  throw Error('Development requires a Java 25 JDK. Check JAVA_HOME.');
}
const env = {...process.env, JAVA_HOME: javaHome};

function gradle(cwd, args, env) {
  const [command, commandArgs] = windows
    ? [process.env.ComSpec || 'cmd.exe', ['/d', '/c', 'gradlew.bat', ...args]]
    : ['./gradlew', args];
  execFileSync(command, commandArgs, {cwd, env, stdio: 'inherit'});
}

if (local) {
  const core = path.resolve(root, process.env.INTERLIS_CORE_DIR || '../interlis-java');
  if (!fs.existsSync(path.join(core, windows ? 'gradlew.bat' : 'gradlew')) ||
      !fs.existsSync(path.join(core, 'interlis-lsp/build.gradle'))) {
    throw Error('INTERLIS Java checkout not found at ' + core + '. Set INTERLIS_CORE_DIR.');
  }
  const repository = fs.mkdtempSync(path.join(os.tmpdir(), 'interlis-dev-lsp-'));
  try {
    gradle(core, ['publishLspSnapshotPublicationToLspTestRepository'], {
      ...env, ORG_GRADLE_PROJECT_lspTestRepository: repository,
    });
    gradle(root, ['stageLsp', '-PlocalDevelopmentLsp'], {
      ...env, ORG_GRADLE_PROJECT_lspRepository: pathToFileURL(repository + path.sep).href,
    });
  } finally {
    fs.rmSync(repository, {recursive: true, force: true});
  }
  for (const name of ['src', 'resources', 'tsconfig.json']) {
    fs.cpSync(path.join(root, name), path.join(development, name), {recursive: true});
  }
  fs.symlinkSync(path.join(root, 'node_modules'), path.join(development, 'node_modules'),
    windows ? 'junction' : 'dir');
} else {
  gradle(root, ['stageLsp'], env);
}

execFileSync(process.execPath, [path.join(__dirname, 'build.cjs')], {cwd: development, stdio: 'inherit'});
fs.writeFileSync(path.join(development, 'build/dev.env'),
  'INTERLIS_DEV_JAVA=' + JSON.stringify(java.replaceAll('\\', '/')) + '\n');
if (local) fs.copyFileSync(path.join(root, 'package.json'), path.join(development, 'package.json'));
