import * as vscode from 'vscode';
import {spawn} from 'node:child_process';
import {LanguageClient, State, ErrorAction, CloseAction} from 'vscode-languageclient/node';
import {resolveLaunchPlan} from './host/launch';

let stopExtension: (() => Promise<void>) | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const output = vscode.window.createOutputChannel('INTERLIS Language Server');
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);
  status.name = 'INTERLIS Language Server';
  status.command = 'interlisGuru.showOutput';
  status.show();
  context.subscriptions.push(output, status);
  let client: LanguageClient | undefined;
  let queue = Promise.resolve();
  let stateListener: vscode.Disposable | undefined;
  const setStatus = (text: string) => {status.text = `INTERLIS: ${text}`;};
  async function stop() {
    const old = client;
    client = undefined;
    stateListener?.dispose(); stateListener = undefined;
    if (old) {try {await old.stop(10000);} finally {await old.dispose();}}
    setStatus(vscode.workspace.isTrusted ? 'Stopped' : 'Trust required');
  }
  async function start() {
    if (!vscode.workspace.isTrusted) {setStatus('Trust required'); return;}
    if (client) return;
    setStatus('Starting');
    const settings = vscode.workspace.getConfiguration('interlisGuru');
    const plan = await resolveLaunchPlan(context.extensionPath, settings.get<string>('server.javaPath', ''), settings.get<string>('server.bundlePath', ''));
    const next = new LanguageClient('interlisGuru', 'INTERLIS', () => {
      const child = spawn(plan.java, plan.args, {shell: false, stdio: 'pipe'});
      output.appendLine(`Server start pid=${child.pid} core=${plan.coreCommit} bundle=${plan.bundleDigest}${settings.get('server.bundlePath') ? ' developer override' : ' packaged distribution'}`);
      child.once('exit', (code, signal) => output.appendLine(`Server exit pid=${child.pid} code=${code} signal=${signal}`));
      return Promise.resolve(child);
    }, {
      documentSelector: [{language: 'interlis', scheme: 'file'}, {language: 'interlis', scheme: 'untitled'}],
      outputChannel: output,
      revealOutputChannelOn: 4,
      errorHandler: {error: () => ({action: ErrorAction.Continue}), closed: () => ({action: CloseAction.DoNotRestart})}
    });
    client = next;
    stateListener = next.onDidChangeState(event => {
      if (next === client) setStatus(event.newState === State.Running ? 'Ready' : event.newState === State.Starting ? 'Starting' : 'Stopped');
    });
    try {await next.start(); setStatus('Ready');}
    catch (error) {client = undefined; await next.dispose(); throw error;}
  }
  function perform(operation: () => Promise<void>): Promise<void> {
    queue = queue.then(operation).catch(error => {
      const message = error instanceof Error ? error.message : String(error);
      output.appendLine(`Host error: ${message}`);
      setStatus('Error');
      void vscode.window.showErrorMessage(`INTERLIS: ${message}`);
    });
    return queue;
  }
  context.subscriptions.push(
    vscode.commands.registerCommand('interlisGuru.restartServer', () => perform(async () => {await stop(); await start();})),
    vscode.commands.registerCommand('interlisGuru.stopServer', () => perform(stop)),
    vscode.commands.registerCommand('interlisGuru.showOutput', () => output.show(true)),
    vscode.commands.registerCommand('interlisGuru.newFromTemplate', async () => {
      const bytes = await vscode.workspace.fs.readFile(vscode.Uri.joinPath(context.extensionUri, 'resources/templates/model.ili'));
      const doc = await vscode.workspace.openTextDocument({language: 'interlis', content: Buffer.from(bytes).toString('utf8')});
      await vscode.window.showTextDocument(doc);
    }),
    vscode.workspace.onDidGrantWorkspaceTrust(() => void perform(start)),
    vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('interlisGuru.server')) void perform(async () => {await stop(); await start();});
    })
  );
  const conflicts = vscode.extensions.all.filter(ext => ext.id !== context.extension.id && ext.packageJSON.contributes?.languages?.some((language: {id: string}) => language.id === 'interlis'));
  if (conflicts.length) void vscode.window.showWarningMessage('Other INTERLIS extensions are enabled. Multiple language servers can produce duplicate results. Manage them explicitly in Extensions.');
  stopExtension = () => perform(stop);
  await perform(start);
}
export async function deactivate(): Promise<void> {await stopExtension?.(); stopExtension = undefined;}
