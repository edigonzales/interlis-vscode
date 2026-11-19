const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const {execFileSync, spawnSync} = require('node:child_process');

const windows = process.platform === 'win32';
const javaName = windows ? 'java.exe' : 'java';
const javaHome = process.env.JAVA_HOME ||
  (process.platform === 'darwin' && fs.existsSync(path.join(os.homedir(), '.sdkman/candidates/java/current/bin/java'))
    ? path.join(os.homedir(), '.sdkman/candidates/java/current') : '');
if (!javaHome) throw Error('Set JAVA_HOME to a Java 25 JDK for the Development Host.');
const java = path.resolve(javaHome, 'bin', javaName);
const version = spawnSync(java, ['-version'], {encoding: 'utf8', timeout: 10000});
if (version.status !== 0 || !/version "25(?:[."])/.test(version.stderr) ||
    !fs.existsSync(path.join(javaHome, 'bin', windows ? 'javac.exe' : 'javac'))) {
  throw Error('Development requires a Java 25 JDK. Check JAVA_HOME.');
}
const env = {...process.env, JAVA_HOME: javaHome};
const wrapper = windows ? [process.env.ComSpec || 'cmd.exe', ['/d', '/c', 'gradlew.bat', 'stageLsp']] : ['./gradlew', ['stageLsp']];
execFileSync(wrapper[0], wrapper[1], {env, stdio: 'inherit'});
execFileSync(process.execPath, ['scripts/build.cjs'], {stdio: 'inherit'});
fs.writeFileSync('build/dev.env', 'INTERLIS_DEV_JAVA=' + JSON.stringify(path.resolve(java).replaceAll('\\', '/')) + '\n');
