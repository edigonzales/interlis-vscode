import {execFile} from 'node:child_process';
import {constants, promises as fs} from 'node:fs';
import path from 'node:path';
import {promisify} from 'node:util';

async function directory(folder: string, message: string): Promise<void> {
  const stat = await fs.lstat(folder).catch(() => undefined);
  if (!stat?.isDirectory()) throw new Error(message);
}

export async function resolveLaunchPlan(extensionRoot: string, javaOverride = '', development = false) {
  const target = process.platform + '-' + process.arch;
  const application = path.join(extensionRoot, development ? 'build/lsp' : 'lsp');
  const modules = path.join(application, 'lib');
  await directory(application, 'Missing INTERLIS LSP distribution. Stage it or reinstall the extension.');
  await directory(modules, 'Missing INTERLIS LSP libraries. Reinstall the extension.');
  const jars = await fs.readdir(modules, {withFileTypes: true});
  if (!jars.some(jar => jar.isFile() && /^interlis-lsp-[\w.-]+\.jar$/.test(jar.name))) {
    throw new Error('Missing INTERLIS LSP JAR. Reinstall the extension.');
  }
  if (jars.some(jar => !jar.isFile())) throw new Error('Unexpected entry in the INTERLIS module path.');

  const javaName = process.platform === 'win32' ? 'java.exe' : 'java';
  const runtimeSource = javaOverride ? 'developer override' : 'bundled';
  let java = javaOverride;
  if (!development || !javaOverride) {
    const runtimes = path.join(extensionRoot, 'runtime');
    const runtime = path.join(runtimes, target);
    const message = 'Missing bundled Java for ' + target + '. Install the matching VSIX.';
    await directory(runtimes, message);
    await directory(runtime, message);
    await directory(path.join(runtime, 'bin'), message);
    const launcher = path.join(runtime, 'bin', javaName);
    if (!(await fs.lstat(launcher).catch(() => undefined))?.isFile()) throw new Error(message);
    await fs.access(launcher, constants.X_OK);
    if (!java) java = launcher;
  }
  if (javaOverride) {
    if (!path.isAbsolute(java)) throw new Error('The developer Java 25 override must be an absolute executable path.');
    const version = await promisify(execFile)(java, ['-version'], {timeout: 10000, maxBuffer: 65536})
      .catch(error => { throw new Error('Cannot run Java 25 executable: ' + error.message); });
    if (!/version "25(?:[."])/.test(version.stderr + version.stdout)) throw new Error('INTERLIS requires Java 25.');
  }
  return {java, args: ['--module-path', modules, '--module', 'guru.interlis.lsp/guru.interlis.lsp.Main'], runtimeSource};
}
