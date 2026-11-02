import * as vscode from 'vscode';
import {spawn} from 'node:child_process';
import {LanguageClient, State, ErrorAction, CloseAction} from 'vscode-languageclient/node';
import {resolveLaunchPlan} from './host/launch';
import {DiagramEditors} from './diagram';
import {newFromTemplate} from './commands/templates';
import {DocumentationCommands} from './commands/documentation';
import {InterlisLanguageClient,EditorAssistance} from './editor/assistance';
import {SnippetInteraction} from './editor/snippets';
import {languageSettings} from './host/configuration';

let stopExtension: (() => Promise<void>) | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  const output = vscode.window.createOutputChannel('INTERLIS Language Server');
  const status = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 10);
  status.name = 'INTERLIS Language Server';
  status.command = 'interlisGuru.showOutput';
  status.show();
  const watcher = vscode.workspace.createFileSystemWatcher('**/*.{ili,ILI}');
  context.subscriptions.push(output, status, watcher);
  let client: LanguageClient | undefined;
  const snippets=new SnippetInteraction();context.subscriptions.push(snippets);
  context.subscriptions.push(new DocumentationCommands(()=>client,output),new EditorAssistance(()=>client,output));
  const diagrams=new DiagramEditors(context,()=>client,output);
  context.subscriptions.push(diagrams,vscode.window.registerCustomEditorProvider(DiagramEditors.viewType,diagrams,{webviewOptions:{retainContextWhenHidden:true},supportsMultipleEditorsPerDocument:true}),...(['refresh','settle','resetLayout','export'] as const).map(action=>vscode.commands.registerCommand('interlisGuru.diagram.'+action,()=>diagrams.viewAction(action))),vscode.commands.registerCommand('interlisGuru.diagram.reveal',()=>diagrams.reveal()),vscode.commands.registerCommand('interlisGuru.showDiagram',()=>diagrams.open()));
  let queue = Promise.resolve();
  let stateListener: vscode.Disposable | undefined;
  const setStatus = (text: string) => {status.text = `INTERLIS: ${text}`;};
  async function stop() {
    diagrams.disconnected();
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
    const next = new InterlisLanguageClient('interlisGuru', 'INTERLIS', () => {
      const child = spawn(plan.java, plan.args, {shell: false, stdio: 'pipe'});
      output.appendLine(`Server start pid=${child.pid} core=${plan.coreCommit} bundle=${plan.bundleDigest} runtime=${plan.runtimeDigest || 'explicit'} ${plan.runtimeSource}${settings.get('server.bundlePath') ? ' server override' : ' packaged distribution'}`);
      child.once('exit', (code, signal) => output.appendLine(`Server exit pid=${child.pid} code=${code} signal=${signal}`));
      return Promise.resolve(child);
    }, {
      documentSelector: [{language: 'interlis', scheme: 'file'}, {language: 'interlis', scheme: 'untitled'}, {language: 'interlis', scheme: 'interlis-source'}],
      initializationOptions: languageSettings(context),
      middleware:{provideCompletionItem:async(document,position,context,token,next)=>snippets.suppress(document)?null:next(document,position,context,token)},
      synchronize: {fileEvents: watcher},
      outputChannel: output,
      revealOutputChannelOn: 4,
      errorHandler: {error: () => ({action: ErrorAction.Continue}), closed: () => ({action: CloseAction.DoNotRestart})}
    });
    client = next;
    stateListener = next.onDidChangeState(event => {
      if (next === client) setStatus(event.newState === State.Running ? 'Ready' : event.newState === State.Starting ? 'Starting' : 'Stopped');
    });
    try {
      await next.start();
      const capability = next.initializeResult?.capabilities.experimental?.interlis;
      if (capability?.protocolVersion !== 1 || capability.compile !== true || capability.sourceContent !== true) {
        await stop();
        throw new Error('The Java server does not support editor protocol version 1. Reinstall a matching extension and server bundle.');
      }
      diagrams.connected();
      setStatus('Ready');
    }
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
  type CompileReport = {outcome: string; modelChoices: {modelName: string; modelVersion: string}[]; summary: Record<string, unknown>};
  async function compile(mode: 'current' | 'workspace') {
    const active = vscode.window.activeTextEditor?.document;
    if (mode === 'current' && (!active || active.languageId !== 'interlis' || !['file', 'untitled'].includes(active.uri.scheme))) {
      void vscode.window.showInformationMessage('Open a local INTERLIS model to compile.'); return;
    }
    const server = client;
    if (!server?.isRunning()) throw new Error('The INTERLIS server is not ready.');
    const params: Record<string, unknown> = {mode};
    if (mode === 'current' && active) params.textDocument = {uri: active.uri.toString(), version: active.version};
    await vscode.window.withProgress({location: vscode.ProgressLocation.Notification, title: mode === 'current' ? 'Compile INTERLIS model' : 'Compile INTERLIS workspace', cancellable: true}, async (_progress, token) => {
      let report = await server.sendRequest<CompileReport>('interlis/compile', params, token);
      if (report.outcome === 'selectionRequired') {
        const selected = await vscode.window.showQuickPick(report.modelChoices.map(choice => ({label: choice.modelName, description: choice.modelVersion, choice})), {title: 'Choose model to compile'});
        if (!selected || token.isCancellationRequested) return;
        Object.assign(params, selected.choice);
        report = await server.sendRequest<CompileReport>('interlis/compile', params, token);
      }
      if (client !== server) throw new Error('The server restarted during compilation; compile again.');
      output.appendLine(`Compile ${mode}: ${JSON.stringify(report.summary)}`);
      if (report.outcome === 'succeeded') void vscode.window.showInformationMessage('INTERLIS compilation succeeded.');
      else { output.show(true); void vscode.window.showWarningMessage(`INTERLIS compilation ${report.outcome}. See INTERLIS Language Server output and Problems.`); }
    });
  }
  function compileCommand(mode: 'current' | 'workspace') {
    return compile(mode).catch(error => {
      const message = error instanceof Error ? error.message : String(error);
      output.appendLine(`Compile ${mode} failed: ${message}`);
      void vscode.window.showErrorMessage(`INTERLIS: ${message}`);
    });
  }
  context.subscriptions.push(vscode.workspace.registerTextDocumentContentProvider('interlis-source', {
    async provideTextDocumentContent(uri, token) {
      const server = client;
      if (!server?.isRunning()) throw new Error('The INTERLIS server is not ready; navigate to the source again after restart.');
      const content = await server.sendRequest<{uri: string; text: string; readonly: boolean; sourceRevision: string}>('interlis/source', {handle: uri.toString(), expectedRevision: uri.query}, token);
      if (server !== client || content.uri !== uri.toString() || !content.readonly || content.sourceRevision !== uri.query) throw new Error('The readonly source response no longer matches this editor. Navigate again.');
      return content.text;
    }
  }));
  context.subscriptions.push(
    vscode.commands.registerCommand('interlisGuru.compileCurrent', () => compileCommand('current')),
    vscode.commands.registerCommand('interlisGuru.compileWorkspace', () => compileCommand('workspace')),
    vscode.commands.registerCommand('interlisGuru.restartServer', () => perform(async () => {await stop(); await start();})),
    vscode.commands.registerCommand('interlisGuru.stopServer', () => perform(stop)),
    vscode.commands.registerCommand('interlisGuru.showOutput', () => output.show(true)),
    vscode.commands.registerCommand('interlisGuru.newFromTemplate', () => newFromTemplate(context).catch(error=>{void vscode.window.showErrorMessage(`INTERLIS: ${error instanceof Error?error.message:String(error)}`);})),
    vscode.workspace.onDidGrantWorkspaceTrust(() => void perform(start)),
    vscode.workspace.onDidChangeWorkspaceFolders(() => void perform(async () => {await stop(); await start();})),
    vscode.workspace.onDidChangeConfiguration(event => {
      if (event.affectsConfiguration('interlisGuru.server')) void perform(async () => {await stop(); await start();});
      else if (event.affectsConfiguration('interlisGuru')) void perform(async () => {
        if (client?.isRunning()) await client.sendNotification('workspace/didChangeConfiguration', {settings: languageSettings(context)});
      });
    })
  );
  const conflicts = vscode.extensions.all.filter(ext => ext.id !== context.extension.id && ext.packageJSON.contributes?.languages?.some((language: {id: string}) => language.id === 'interlis'));
  if (conflicts.length) void vscode.window.showWarningMessage('Other INTERLIS extensions are enabled. Multiple language servers can produce duplicate results. Manage them explicitly in Extensions.');
  stopExtension = () => perform(stop);
  await perform(start);
}
export async function deactivate(): Promise<void> {await stopExtension?.(); stopExtension = undefined;}
