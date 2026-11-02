import {createHash} from 'node:crypto';
import {promises as fs} from 'node:fs';
import path from 'node:path';

export const runtimeTargets = ['darwin-arm64', 'linux-x64', 'win32-x64'] as const;
export interface RuntimeFile {path: string; sha256?: string; link?: string; executable?: boolean}
export interface RuntimeRecord {version: string; archiveSha256: string; java: string; files: RuntimeFile[]}
export interface RuntimeLock {schemaVersion: 1; targets: Record<string, RuntimeRecord>}

const digest = (bytes: Buffer | string) => createHash('sha256').update(bytes).digest('hex');
function relative(value: unknown): value is string {
  return typeof value === 'string' && !!value && !value.includes('\\') && !path.posix.isAbsolute(value) && path.posix.normalize(value) === value && !value.split('/').includes('..');
}

/** Includes vendor legal symlinks, but never follows a link outside the runtime. */
export async function runtimeInventory(root: string): Promise<RuntimeFile[]> {
  const result: RuntimeFile[] = [];
  const canonical = await fs.realpath(root);
  async function walk(folder: string, prefix: string) {
    for (const name of (await fs.readdir(folder)).sort()) {
      const file = path.join(folder, name), entry = prefix + name, stat = await fs.lstat(file);
      if (!relative(entry)) throw new Error('Unsafe runtime path.');
      if (stat.isDirectory()) await walk(file, entry + '/');
      else if (stat.isSymbolicLink()) {
        const link = await fs.readlink(file), resolved = await fs.realpath(file);
        if (path.isAbsolute(link) || !(resolved === canonical || resolved.startsWith(canonical + path.sep))) throw new Error('Runtime symlink escapes its distribution.');
        result.push({path: entry, link});
      } else if (stat.isFile()) result.push({path: entry, sha256: digest(await fs.readFile(file)), executable: !!(stat.mode & 0o111)});
      else throw new Error('Unsupported runtime file type.');
    }
  }
  await walk(root, '');
  return result.sort((a,b)=>a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
}

export async function verifyBundledRuntime(extensionRoot: string): Promise<{java: string; digest: string; version: string}> {
  const target = process.platform + '-' + process.arch;
  if (!(runtimeTargets as readonly string[]).includes(target)) throw new Error('No qualified bundled Java runtime for ' + target + '.');
  const distributionPath = path.join(extensionRoot, 'release/distribution.json');
  let lockedDigest: string | undefined;
  try {
    const distribution = JSON.parse(await fs.readFile(distributionPath, 'utf8'));
    if (distribution.schemaVersion !== 1 || distribution.target !== target) throw new Error('This INTERLIS distribution targets a different workspace host. Install the matching VSIX.');
    if (!/^[a-f0-9]{64}$/.test(distribution.runtimeLockSha256 || '')) throw new Error('Invalid distribution runtime identity.');
    lockedDigest = distribution.runtimeLockSha256;
  } catch (error) {if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;}
  let lock: RuntimeLock;
  try {
    const bytes = await fs.readFile(path.join(extensionRoot, 'release/runtime-artifacts.lock.json'));
    if (lockedDigest && digest(bytes) !== lockedDigest) throw new Error('Distribution runtime lock digest mismatch.');
    lock = JSON.parse(bytes.toString('utf8')) as RuntimeLock;
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') throw new Error('Missing bundled Java 25 runtime inventory. Stage the runtime or reinstall the matching VSIX.');
    throw error;
  }
  const record = lock.targets?.[target];
  if (lock.schemaVersion !== 1 || !record || !/^25[.+]/.test(record.version) || !/^[a-f0-9]{64}$/.test(record.archiveSha256) || !relative(record.java) || !Array.isArray(record.files) || !record.files.length) throw new Error('Incompatible bundled Java runtime inventory.');
  const expected = new Map<string, RuntimeFile>();
  for (const file of record.files) {
    if (!relative(file.path) || expected.has(file.path) || (typeof file.link === 'string' ? file.sha256 !== undefined : !/^[a-f0-9]{64}$/.test(file.sha256 || ''))) throw new Error('Invalid bundled runtime file inventory.');
    expected.set(file.path, file);
  }
  const root = path.join(extensionRoot, 'artifacts/runtime', target);
  let actual: RuntimeFile[];
  try {actual = await runtimeInventory(root);} catch (error) {throw new Error('Missing or unsafe bundled Java runtime: ' + (error as Error).message);}
  if (actual.length !== expected.size || actual.some(file => {
    const wanted = expected.get(file.path);
    return !wanted || file.sha256 !== wanted.sha256 || file.link !== wanted.link || (process.platform !== 'win32' && file.executable !== wanted.executable);
  })) throw new Error('Bundled Java runtime digest or file inventory mismatch. Reinstall the matching VSIX.');
  if (!expected.has(record.java)) throw new Error('Java launcher is absent from the runtime inventory.');
  return {java: path.join(root, record.java), digest: digest(JSON.stringify(record)), version: record.version};
}
