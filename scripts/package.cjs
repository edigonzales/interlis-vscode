const fs = require('node:fs');
const path = require('node:path');

async function packageVSIX(preRelease = false) {
  const target = process.platform + '-' + process.arch;
  const output = path.resolve('build/packages');
  const stage = fs.mkdtempSync(path.resolve('build/vsix-'));
  try {
    const manifest = require('./distribution-metadata.cjs').distributionManifest(require('../package.json'));
    for (const name of ['README.md', 'LICENSE', '.vscodeignore', 'out', 'resources', 'licenses']) {
      fs.cpSync(name, path.join(stage, name), {recursive: true});
    }
    fs.writeFileSync(path.join(stage, 'package.json'), JSON.stringify(manifest, null, 2) + '\n');
    fs.cpSync('build/lsp/lib', path.join(stage, 'lsp/lib'), {recursive: true});
    fs.cpSync('build/lsp/licenses', path.join(stage, 'licenses/interlis-lsp'), {recursive: true});
    fs.copyFileSync('build/lsp/LICENSE', path.join(stage, 'licenses/interlis-lsp/INTERLIS.txt'));
    const runtime = path.join(stage, 'runtime', target);
    await require('./stage-runtime.cjs').stageRuntime(runtime);
    const source = require('../release/jdk-sources.json')[target];
    fs.writeFileSync(path.join(stage, 'licenses/runtime-NOTICE.txt'),
      'Eclipse Adoptium Temurin Java 25 jlink runtime for ' + target + '.\n' +
      'OpenJDK GPLv2 with the Classpath Exception and component notices are in runtime/' + target + '/legal.\n' +
      'Upstream archive: ' + source.archive.url + '\n');
    fs.mkdirSync(output, {recursive: true});
    const vsix = path.join(output, 'interlis-editor-' + target + '.vsix');
    await require('@vscode/vsce').createVSIX({cwd: stage, packagePath: vsix, target, dependencies: false, preRelease});
  } finally {
    fs.rmSync(stage, {recursive: true, force: true});
  }
}

if (require.main === module) {
  const flags = process.argv.slice(2);
  if (flags.length && (flags.length !== 1 || flags[0] !== '--pre-release')) throw Error('Usage: npm run package [-- --pre-release]');
  packageVSIX(flags.length === 1).catch(error => { console.error(error); process.exitCode = 1; });
}
module.exports = {packageVSIX};
