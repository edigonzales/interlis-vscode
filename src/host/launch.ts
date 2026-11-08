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
  launch: {kind: string; moduleName: string; mainClass: string};
  moduleInventory: Record<string, {name: string; explicit: boolean; sha256: string}>;
  files: {path: string; sha256: string}[];
}
export interface LaunchPlan {readonly java: string; readonly args: readonly string[]; readonly moduleName: string; readonly coreCommit: string; readonly bundleDigest: string; readonly runtimeDigest: string; readonly runtimeSource: 'bundled' | 'developer override'}

/** Verifies the complete immutable server inventory before executing Java. */
export async function resolveLaunchPlan(extensionRoot: string, java = '', override = ''): Promise<LaunchPlan> {
  const lock = JSON.parse(await fs.readFile(path.join(extensionRoot, 'release/editor-artifacts.lock.json'), 'utf8')) as ArtifactLock;
  if (lock.schemaVersion !== 3 || !/^[a-f0-9]{40}$/.test(lock.coreCommit) || lock.protocolVersion !== 'lsp-3.17-baseline' || lock.mainClass !== 'guru.interlis.lsp.Main' || !lock.launch || Object.keys(lock.launch).sort().join(',') !== 'kind,mainClass,moduleName' || lock.launch.kind !== 'module' || lock.launch.moduleName !== 'guru.interlis.lsp' || lock.launch.mainClass !== lock.mainClass || !lock.moduleInventory || !Array.isArray(lock.files) || !lock.files.length) {
    throw new Error('Incompatible or missing INTERLIS server artifact lock.');
  }
  const root = override ? path.resolve(override) : path.join(extensionRoot, 'artifacts/server');
  const expected = new Set<string>(), modules = new Set<string>();
  for (const directory of [root, path.join(root,'lib')]) if ((await fs.lstat(directory)).isSymbolicLink()) throw new Error('Invalid server artifact path.');
  if (Object.keys(lock.moduleInventory).length !== lock.files.length) throw new Error('Invalid server module inventory.');
  for (const file of lock.files) {
    if (!/^lib\/[A-Za-z0-9_.-]+\.jar$/.test(file.path) || !/^[a-f0-9]{64}$/.test(file.sha256) || expected.has(file.path)) throw new Error('Invalid server artifact inventory.');
    expected.add(file.path);
    const module = lock.moduleInventory[file.path];
    if (!module || typeof module.explicit !== 'boolean' || !/^[a-zA-Z][\w]*(?:\.[a-zA-Z][\w]*)*$/.test(module.name) || module.sha256 !== file.sha256 || modules.has(module.name) || (file.path.startsWith('lib/interlis-') && !module.explicit)) throw new Error('Invalid server module inventory.');
    modules.add(module.name);
    if ((await fs.lstat(path.join(root,file.path))).isSymbolicLink()) throw new Error('Invalid server artifact path.');
    const bytes = await fs.readFile(path.join(root, file.path));
    if (createHash('sha256').update(bytes).digest('hex') !== file.sha256) throw new Error(`Server artifact digest mismatch: ${file.path}`);
  }
  const actual = (await fs.readdir(path.join(root, 'lib'))).sort();
  if (actual.length !== expected.size || actual.some(name => !expected.has(`lib/${name}`))) throw new Error('Unexpected or missing server library.');
  if (!modules.has(lock.launch.moduleName)) throw new Error('Missing server root module.');
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
  return Object.freeze({java, args: Object.freeze(['--module-path', path.join(root, 'lib'), '--module', lock.launch.moduleName + '/' + lock.launch.mainClass]), moduleName: lock.launch.moduleName, coreCommit: lock.coreCommit,
    bundleDigest: createHash('sha256').update(JSON.stringify(lock.files)).digest('hex'), runtimeDigest, runtimeSource});
}
