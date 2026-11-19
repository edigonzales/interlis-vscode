const {execFileSync} = require('node:child_process');

function run(script, ...args) {
  execFileSync(process.execPath, [script, ...args], {stdio: 'inherit',
    env: {...process.env, JAVA_TOOL_OPTIONS: '', JDK_JAVA_OPTIONS: '', _JAVA_OPTIONS: ''}});
}

if (process.env.INTERLIS_CI_TARGET !== process.platform + '-' + process.arch) {
  throw Error('Wrong native VSIX runner: ' + process.platform + '-' + process.arch);
}
run('scripts/build.cjs');
run('scripts/verify-dependencies.cjs');
run('scripts/package.cjs', ...(process.env.INTERLIS_CI_PRERELEASE === 'true' ? ['--pre-release'] : []));
run('scripts/ci/smoke.cjs');
