const fs = require('node:fs'), path = require('node:path');
(async () => {
  const cache = path.resolve('build/gui-cache'); fs.mkdirSync(cache, {recursive: true});
  const {ExTester, ReleaseQuality} = require('vscode-extension-tester');
  const tester = new ExTester(cache, ReleaseQuality.Stable, path.join(cache, 'extensions'));
  await tester.downloadCode('1.140.0'); await tester.downloadChromeDriver('1.140.0');
})().catch(error => {console.error(error); process.exitCode = 1;});
