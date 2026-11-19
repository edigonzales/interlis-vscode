const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const {pipeline} = require('node:stream/promises');
const {Readable} = require('node:stream');
const hash = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

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
    if (!check.ok || (await check.text()).trim().split(/\s+/)[0] !== source.archive.sha256) throw Error('Vendor checksum sidecar mismatch');
    fs.renameSync(temporary, file);
  } finally {fs.rmSync(temporary, {force: true});}
  return file;
}

function inspectLinks(root, materialize = false) {
  const canonical = fs.realpathSync(root);
  function walk(directory) {
    for (const item of fs.readdirSync(directory, {withFileTypes: true})) {
      const file = path.join(directory, item.name);
      if (item.isDirectory()) walk(file);
      else if (item.isSymbolicLink()) {
        const real = fs.realpathSync(file);
        if (path.isAbsolute(fs.readlinkSync(file)) || !real.startsWith(canonical + path.sep) ||
            !fs.statSync(real).isFile()) throw Error('Unsafe JDK symlink: ' + file);
        if (materialize) {
          fs.unlinkSync(file);
          fs.copyFileSync(real, file, fs.constants.COPYFILE_EXCL);
        }
      } else if (!item.isFile()) throw Error('Unsupported JDK file type: ' + file);
    }
  }
  walk(canonical);
}

function extractJdk(archive, temporary) {
  const windows = process.platform === 'win32';
  const tar = windows ? path.join(process.env.SystemRoot, 'System32/tar.exe') : 'tar';
  const entries = cp.execFileSync(tar, ['-tf', archive], {encoding: 'utf8', maxBuffer: 16 * 1024 * 1024});
  if (entries.split(/\r?\n/).some(name => name.startsWith('/') || name.includes('\\') ||
      name.includes(':') || name.split('/').includes('..'))) throw Error('Unsafe JDK archive entry');
  cp.execFileSync(tar, ['-xf', archive, '-C', temporary]);
  const roots = fs.readdirSync(temporary, {withFileTypes: true});
  if (roots.length !== 1 || !roots[0].isDirectory()) throw Error('Unexpected JDK archive root');
  inspectLinks(temporary);
  const root = path.join(temporary, roots[0].name);
  return process.platform === 'darwin' ? path.join(root, 'Contents/Home') : root;
}

async function stageRuntime(destination) {
  const target = process.platform + '-' + process.arch;
  const source = require('../release/jdk-sources.json')[target];
  if (!source) throw Error('Unsupported native runtime target: ' + target);
  const archive = await download(source, path.resolve('build/runtime-downloads'));
  const temporary = fs.mkdtempSync(path.resolve('build/jdk-'));
  try {
    const home = extractJdk(archive, temporary);
    const executable = path.join(home, 'bin', process.platform === 'win32' ? 'jlink.exe' : 'jlink');
    // Includes SQL and logging for third-party modules and providers for HTTPS, encodings and locales.
    const modules = ['java.compiler', 'java.net.http', 'java.sql', 'java.xml',
      'jdk.charsets', 'jdk.crypto.ec', 'jdk.localedata', 'jdk.unsupported'];
    fs.mkdirSync(path.dirname(destination), {recursive: true});
    cp.execFileSync(executable, ['--add-modules', modules.join(','), '--strip-debug',
      '--no-header-files', '--no-man-pages', '--compress', 'zip-6', '--output', destination], {stdio: 'inherit'});
    inspectLinks(destination, true);
  } finally {
    fs.rmSync(temporary, {recursive: true, force: true});
  }
}

module.exports = {stageRuntime, extractJdk, inspectLinks};
