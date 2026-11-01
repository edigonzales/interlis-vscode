import {createHash} from 'node:crypto';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';

export interface ArtifactLock {
  schemaVersion: number;
  coreCommit: string;
  protocolVersion: string;
  mainClass: string;
  files: {path: string; sha256: string}[];
}
export interface LaunchPlan {java: string; args: string[]; coreCommit: string; bundleDigest: string}

/** Verifies the complete immutable server inventory before executing Java. */
export async function resolveLaunchPlan(extensionRoot: string, java: string, override = ''): Promise<LaunchPlan> {
  const lock = JSON.parse(await fs.readFile(path.join(extensionRoot, 'release/editor-artifacts.lock.json'), 'utf8')) as ArtifactLock;
  if (lock.schemaVersion !== 1 || !/^[a-f0-9]{40}$/.test(lock.coreCommit) || lock.protocolVersion !== 'lsp-3.17-baseline' || lock.mainClass !== 'guru.interlis.lsp.Main' || !Array.isArray(lock.files) || !lock.files.length) {
    throw new Error('Incompatible or missing INTERLIS server artifact lock.');
  }
  const root = override ? path.resolve(override) : path.join(extensionRoot, 'artifacts/server');
  const expected = new Set<string>();
  for (const file of lock.files) {
    if (!/^lib\/[A-Za-z0-9_.-]+\.jar$/.test(file.path) || !/^[a-f0-9]{64}$/.test(file.sha256) || expected.has(file.path)) throw new Error('Invalid server artifact inventory.');
    expected.add(file.path);
    const bytes = await fs.readFile(path.join(root, file.path));
    if (createHash('sha256').update(bytes).digest('hex') !== file.sha256) throw new Error(`Server artifact digest mismatch: ${file.path}`);
  }
  const actual = (await fs.readdir(path.join(root, 'lib'))).sort();
  if (actual.length !== expected.size || actual.some(name => !expected.has(`lib/${name}`))) throw new Error('Unexpected or missing server library.');
  if (!java || !path.isAbsolute(java)) throw new Error('Set interlisGuru.server.javaPath to an absolute Java 25 executable path.');
  const version = await promisify(execFile)(java, ['-version'], {timeout: 10000, maxBuffer: 65536, shell: false});
  if (!/version "25(?:[."])/.test(version.stderr + version.stdout)) throw new Error('INTERLIS requires Java 25 without preview.');
  return {java, args: ['-cp', path.join(root, 'lib', '*'), lock.mainClass], coreCommit: lock.coreCommit,
    bundleDigest: createHash('sha256').update(JSON.stringify(lock.files)).digest('hex')};
}
