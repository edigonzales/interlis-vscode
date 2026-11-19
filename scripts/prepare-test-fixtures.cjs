const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');

const [flag, javaHome] = process.argv.slice(2);
if (flag !== '--java-home' || !path.isAbsolute(javaHome || '')) throw Error('Use --java-home with an absolute Java 25 JDK');
const lib = path.resolve('build/lsp/lib');
const jars = fs.readdirSync(lib);
const lsp = jars.find(name => /^interlis-lsp-.*\.jar$/.test(name));
const gson = jars.find(name => /^gson-.*\.jar$/.test(name));
if (!lsp || !gson) throw Error('Stage the LSP distribution first.');
const root = path.resolve('build/test-fixtures/protocol-mismatch');
const classes = path.join(root, 'classes');
fs.mkdirSync(classes, {recursive: true});
const tool = name => path.join(javaHome, 'bin', name + (process.platform === 'win32' ? '.exe' : ''));
execFileSync(tool('javac'), ['--release', '25', '-cp', path.join(lib, gson),
  '-d', classes, 'test/fixtures/protocol-mismatch/Main.java'], {stdio: 'inherit'});
const fixture = path.join(root, 'interlis-lsp-incompatible.jar');
fs.copyFileSync(path.join(lib, lsp), fixture);
execFileSync(tool('jar'), ['--update', '--file', fixture, '-C', classes, 'guru/interlis/lsp/Main.class'], {stdio: 'inherit'});
