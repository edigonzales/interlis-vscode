import {promises as fs} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';

const rendererFiles = ['diagram-ui.js', 'diagram-ui.css', 'diagram-layout-worker.js'];
const coreFiles = ['types/editor-protocol.ts', 'types/diagram-document.ts',
  'schemas/diagram-document-1.0.schema.json', 'schemas/diagram-options-1.0.schema.json',
  'licenses/interlis-java.txt'];

async function readJson(file: string) {
  return JSON.parse(await fs.readFile(file, 'utf8'));
}

async function verifyFiles(root: string, inventory: unknown, required: string[], allowed: (name: string) => boolean) {
  if (!Array.isArray(inventory)) throw Error('Missing diagram artifact inventory');
  const seen = new Set<string>();
  for (const entry of inventory) {
    if (!entry || typeof entry.path !== 'string' || !allowed(entry.path) || seen.has(entry.path)
        || !/^[a-f0-9]{64}$/.test(entry.sha256)) {
      throw Error('Invalid diagram artifact inventory');
    }
    seen.add(entry.path);
    const file = path.join(root, entry.path);
    const [actual, boundary, info] = await Promise.all([fs.realpath(file), fs.realpath(root), fs.lstat(file)]);
    if (!info.isFile() || !actual.startsWith(boundary + path.sep)
        || createHash('sha256').update(await fs.readFile(file)).digest('hex') !== entry.sha256) {
      throw Error('Diagram artifact digest mismatch: ' + entry.path);
    }
  }
  for (const name of required) {
    if (!seen.has(name)) throw Error('Missing diagram artifact: ' + name);
  }
}

/** Verifies extension build outputs and staged Core contracts against their own inventories. */
export async function verifyDiagramAssets(root: string): Promise<void> {
  const renderer = path.join(root, 'out/diagram');
  const [lock, manifest] = await Promise.all([
    readJson(path.join(root, 'release/editor-artifacts.lock.json')),
    readJson(path.join(renderer, 'manifest.json'))
  ]);
  if (lock.schemaVersion !== 3 || lock.editorProtocolVersion !== 1
      || lock.diagramDocumentVersion !== '1.0' || manifest.schemaVersion !== 1) {
    throw Error('Incompatible diagram artifacts. Reinstall INTERLIS.');
  }
  await verifyFiles(path.join(root, 'artifacts'), lock.contractFiles, coreFiles, name => coreFiles.includes(name));
  await verifyFiles(renderer, manifest.assets, rendererFiles,
    name => rendererFiles.includes(name) || name === 'diagram-ui.js.LEGAL.txt');
}
