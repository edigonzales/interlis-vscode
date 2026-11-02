import {createHash} from 'node:crypto';
import {promises as fs} from 'node:fs';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {verifyBundledRuntime} from './runtime';

export interface ArtifactLock {
  schemaVersion: number;
  coreCommit: string;
  protocolVersion: string;
  mainClass: string;
  files: {path: string; sha256: string}[];
}
export interface LaunchPlan {java: string; args: string[]; coreCommit: string; bundleDigest: string; runtimeDigest: string; runtimeSource: 'bundled' | 'developer override'}

/** Verifies the complete immutable server inventory before executing Java. */
export async function resolveLaunchPlan(extensionRoot: string, java = '', override = ''): Promise<LaunchPlan> {
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
  let runtimeDigest = '', runtimeSource: LaunchPlan['runtimeSource'] = 'developer override';
  // A packaged distribution must retain its runtime even when a developer explicitly overrides Java.
  const packaged = await fs.stat(path.join(extensionRoot, 'release/distribution.json')).then(()=>true,error=>{if(error.code==='ENOENT')return false;throw error;});
  if (!java || packaged) {
    const runtime = await verifyBundledRuntime(extensionRoot);
    runtimeDigest = runtime.digest;
    if (!java) {java = runtime.java; runtimeSource = 'bundled';}
  }
  if (!path.isAbsolute(java)) throw new Error('The developer Java 25 override must be an absolute executable path.');
  let version: {stdout: string; stderr: string};
  try {version = await promisify(execFile)(java, ['-version'], {timeout: 10000, maxBuffer: 65536, shell: false});}
  catch (error) {throw new Error('Cannot run Java 25 executable: ' + (error as NodeJS.ErrnoException).code);}
  if (!/version "25(?:[."])/.test(version.stderr + version.stdout)) throw new Error('INTERLIS requires Java 25 without preview.');
  return {java, args: ['-cp', path.join(root, 'lib', '*'), lock.mainClass], coreCommit: lock.coreCommit,
    bundleDigest: createHash('sha256').update(JSON.stringify(lock.files)).digest('hex'), runtimeDigest, runtimeSource};
}
