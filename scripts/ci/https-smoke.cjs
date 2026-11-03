const fs = require('node:fs'), path = require('node:path'), cp = require('node:child_process'), assert = require('node:assert/strict');
exports.check = async function(java, output, run, extension) {
  if (!path.isAbsolute(process.env.JAVA_HOME || '')) throw Error('HTTPS smoke requires JAVA_HOME for test-only javac/keytool');
  const fixture = path.resolve('test/fixtures/https');
  const suffix = process.platform === 'win32' ? '.exe' : '';
  const tool = name => path.join(process.env.JAVA_HOME, 'bin', name + suffix);
  const classes = path.join(output, 'https-classes'), trust = path.join(output, 'test-truststore.p12');
  fs.mkdirSync(classes, {recursive: true}); fs.rmSync(trust, {force: true});
  run(tool('javac'), ['--release', '25', '-d', classes, path.join(fixture, 'Probe.java')]);
  run(tool('keytool'), ['-importcert', '-noprompt', '-alias', 'localhost-test-only', '-file', path.join(fixture, 'localhost-cert.pem'), '-keystore', trust, '-storetype', 'PKCS12', '-storepass', 'interlis-test']);
  const repository = await require('../gui-repository.cjs').start(output, {key: fs.readFileSync(path.join(fixture, 'localhost-key.pem')), cert: fs.readFileSync(path.join(fixture, 'localhost-cert.pem'))});
  try {
    // The default bundled trust anchors must reject our self-signed fixture.
    const untrusted = await new Promise((resolve, reject) => {
      const child = cp.spawn(java, ['-cp', classes, 'Probe', repository.base + 'ilimodels.xml'], {env: {...process.env, JAVA_TOOL_OPTIONS: '', JDK_JAVA_OPTIONS: '', _JAVA_OPTIONS: ''}, windowsHide: true});
      let stderr = ''; child.stderr.on('data', bytes => stderr += bytes); child.stdout.resume();
      const timer = setTimeout(() => {child.kill(); reject(Error('Untrusted HTTPS probe timed out'));}, 20000);
      child.once('error', error => {clearTimeout(timer); reject(error);});
      child.once('exit', code => {clearTimeout(timer); resolve({code, stderr});});
    });
    fs.writeFileSync(path.join(output, 'https-untrusted.log'), untrusted.stderr);
    assert.notEqual(untrusted.code, 0); assert.match(untrusted.stderr, /PKIX|certificate.*path|trustAnchors/i);
    // spawnSync would deadlock the in-process Node HTTPS fixture.
    await new Promise((resolve, reject) => {
      const child = cp.spawn(java, ['-Djavax.net.ssl.trustStore=' + trust, '-Djavax.net.ssl.trustStorePassword=interlis-test', '-cp', classes, 'Probe', repository.base + 'ilimodels.xml'], {env: {...process.env, JAVA_TOOL_OPTIONS: '', JDK_JAVA_OPTIONS: '', _JAVA_OPTIONS: ''}, windowsHide: true});
      let log = ''; child.stdout.on('data', bytes => log += bytes); child.stderr.on('data', bytes => log += bytes);
      const timer = setTimeout(() => {child.kill(); reject(Error('Trusted HTTPS probe timed out'));}, 20000);
      child.once('error', error => {clearTimeout(timer); reject(error);});
      child.once('exit', code => {clearTimeout(timer); fs.writeFileSync(path.join(output, 'https-trusted.log'), log); code === 0 ? resolve() : reject(Error(log));});
    });
  } finally {await repository.close();}
  // A separate test process lets this process serve the actual LSP repository.
  // protocol.test starts its own fixture, so synchronous execution is safe here.
  run(process.execPath, ['--test', 'test/protocol.test.cjs'], {INTERLIS_JAVA: '', INTERLIS_TEST_EXTENSION_ROOT: extension, INTERLIS_TEST_HTTPS: '1', INTERLIS_TEST_TRUSTSTORE: trust});
  return {certificateValidation: true, untrustedCertificateRejected: true, ecProvider: 'SunEC', protocolOverHttps: true};
};
