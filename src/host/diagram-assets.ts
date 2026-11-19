import {promises as fs} from 'node:fs';
import path from 'node:path';

export async function verifyDiagramAssets(root: string): Promise<void> {
  const renderer = path.join(root, 'out/diagram');
  const canonical = await fs.realpath(root);
  for (const name of ['diagram-ui.js', 'diagram-ui.css', 'diagram-layout-worker.js']) {
    const file = path.join(renderer, name);
    const info = await fs.lstat(file).catch(() => undefined);
    if (!info?.isFile() || !((await fs.realpath(file)).startsWith(canonical + path.sep))) {
      throw Error('Missing or unsafe diagram asset: ' + name + '. Reinstall INTERLIS.');
    }
  }
}
