'use strict';

const fs = require('node:fs');
const path = require('node:path');
const {createHash} = require('node:crypto');
const esbuild = require('esbuild');
const Ajv = require('ajv/dist/2020');
const standalone = require('ajv/dist/standalone').default;

const source = 'src/diagram/renderer';
const output = 'out/diagram';

function generateValidator() {
  const ajv = new Ajv({strict: true, allErrors: true, code: {source: true}});
  const validate = ajv.compile(require(path.resolve('artifacts/schemas/diagram-document-1.0.schema.json')));
  const generated = 'src/diagram/generated';
  fs.mkdirSync(generated, {recursive: true});
  fs.writeFileSync(path.join(generated, 'schema-validator.cjs'), standalone(ajv, validate));
  fs.writeFileSync(path.join(generated, 'schema-validator.d.cts'),
    'declare const validate: { (value: unknown): value is import("../renderer/types").DiagramDocumentDto; errors?: unknown }; export = validate;\n');
}

function buildDiagram() {
  fs.rmSync(output, {recursive: true, force: true});
  const common = {bundle: true, target: 'es2022', legalComments: 'linked', metafile: true};
  const packages = new Set(['elkjs', 'libavoid-js']);
  for (const [entry, name, platform, format] of [
    ['interactive.ts', 'diagram-ui.js', 'browser', 'esm'],
    ['adapter.ts', 'adapter.cjs', 'node', 'cjs'],
    ['libavoid-router.ts', 'libavoid-router.js', 'browser', 'esm']
  ]) {
    const built = esbuild.buildSync({...common, entryPoints: [path.join(source, entry)],
      outfile: path.join(platform === 'node' ? 'build/diagram' : output, name), platform, format,
      external: platform === 'node' ? ['libavoid-js', './libavoid-router.js'] : ['./libavoid-router.js']});
    for (const input of Object.keys(built.metafile.inputs)) {
      const match = input.match(/node_modules\/((?:@[^/]+\/)?[^/]+)/);
      if (match) packages.add(match[1]);
    }
  }
  fs.copyFileSync('node_modules/elkjs/lib/elk-worker.min.js', path.join(output, 'diagram-layout-worker.js'));
  fs.copyFileSync(path.join(source, 'diagram.css'), path.join(output, 'diagram-ui.css'));
  fs.copyFileSync('node_modules/libavoid-js/dist/libavoid.wasm', path.join(output, 'libavoid.wasm'));
  const notices = [];
  for (const name of [...packages].sort()) {
    const root = path.join('node_modules', name);
    const legal = fs.readdirSync(root).filter(file => /^(?:licen[sc]e|notice|copying)(?:[.-].*)?$/i.test(file));
    if (!legal.length && name === 'autocompleter') {
      const readme = fs.readFileSync(path.join(root, 'readme.md'), 'utf8');
      const start = readme.indexOf('Copyright (c) 2016 - Denis Taran');
      if (start >= 0) {
        notices.push(name + '\n' + readme.slice(start));
        continue;
      }
    }
    if (!legal.length) throw Error('Missing renderer dependency license: ' + name);
    for (const file of legal) notices.push(name + '\n' + fs.readFileSync(path.join(root, file), 'utf8'));
  }
  fs.writeFileSync('licenses/bundled-diagram-notices.txt', notices.join('\n\n--------------------\n\n') + '\n');
  const assets = fs.readdirSync(output).sort()
    .map(file => ({path: file, sha256: createHash('sha256').update(fs.readFileSync(path.join(output, file))).digest('hex')}));
  fs.writeFileSync(path.join(output, 'manifest.json'), JSON.stringify({schemaVersion: 1, assets}, null, 2) + '\n');
}

module.exports = {generateValidator, buildDiagram};
