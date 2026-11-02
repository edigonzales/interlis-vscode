import * as vscode from 'vscode';
import {LanguageClient, InitializeParams} from 'vscode-languageclient/node';
import type {EditorAssistResult} from '../../artifacts/types/editor-protocol';

/** Negotiate one Java-owned Enter planning path; standard on-type formatting is disabled for this client. */
export class InterlisLanguageClient extends LanguageClient {
  protected fillInitializeParams(params:InitializeParams):void {
    super.fillInitializeParams(params);
    params.capabilities.experimental={...params.capabilities.experimental,interlis:{...params.capabilities.experimental?.interlis,editorAssist:true}};
  }
}

/** Carries a real Enter gesture and applies the exact versioned Java edit/caret plan natively. */
export class EditorAssistance implements vscode.Disposable {
  private pending:vscode.CancellationTokenSource|undefined;
  private pendingDocument:vscode.TextDocument|undefined;
  private readonly subscriptions:vscode.Disposable[]=[];
  constructor(private readonly getClient:()=>LanguageClient|undefined,private readonly output:vscode.OutputChannel){
    this.subscriptions.push(vscode.commands.registerTextEditorCommand('interlisGuru.editor.afterNewline',editor=>{void this.afterNewline(editor).catch(error=>{if(!/cancel|modified|version changed/i.test(String(error)))output.appendLine('Editor assistance: '+String(error));});}),vscode.workspace.onDidChangeTextDocument(event=>{if(event.document===this.pendingDocument)this.pending?.cancel();}),vscode.window.onDidChangeActiveTextEditor(()=>this.pending?.cancel()));
  }
  dispose(){this.pending?.cancel();this.pending?.dispose();for(const disposable of this.subscriptions)disposable.dispose();}
  private async afterNewline(editor:vscode.TextEditor):Promise<void>{
    this.pending?.cancel();const document=editor.document;
    const server=this.getClient();if(!server?.isRunning()||server.initializeResult?.capabilities.experimental?.interlis?.editorAssist!==true||editor!==vscode.window.activeTextEditor)return;
    const version=document.version,position=editor.selection.active,instance=server.initializeResult.capabilities.experimental.interlis.serverInstanceId;
    this.pending?.dispose();const cancellation=new vscode.CancellationTokenSource();this.pending=cancellation;this.pendingDocument=document;
    try {
      const result=await server.sendRequest<EditorAssistResult|null>('interlis/editorAssist',{protocolVersion:1,textDocument:{uri:document.uri.toString(),version},position:{line:position.line,character:position.character},options:{tabSize:typeof editor.options.tabSize==='number'?editor.options.tabSize:2,insertSpaces:editor.options.insertSpaces!==false}},cancellation.token);
      if(!result||cancellation.token.isCancellationRequested)return;
      if(server!==this.getClient()||editor!==vscode.window.activeTextEditor||document.isClosed||document.version!==version||!editor.selection.isEmpty||!editor.selection.active.isEqual(position)||result.protocolVersion!==1||result.serverInstanceId!==instance||result.uri!==document.uri.toString()||result.documentVersion!==version)return;
      if(!Array.isArray(result.edits)||result.edits.length>8||!result.caret||![result.caret.line,result.caret.character].every(Number.isSafeInteger)||result.caret.line<0||result.caret.line>document.lineCount+64||result.caret.character<0||result.caret.character>65536)throw new Error('Invalid editor assistance result.');
      const edits=result.edits.map(edit=>{if(typeof edit.newText!=='string'||edit.newText.length>65536)throw new Error('Oversized editor edit.');const range=new vscode.Range(edit.range.start.line,edit.range.start.character,edit.range.end.line,edit.range.end.character);if(!document.validateRange(range).isEqual(range))throw new Error('Editor edit range is outside the current buffer.');return {range,text:edit.newText};});
      const applied=await editor.edit(builder=>{for(const edit of edits)builder.replace(edit.range,edit.text);},{undoStopBefore:false,undoStopAfter:false});
      if(applied&&document.version===version+1&&server===this.getClient()&&editor===vscode.window.activeTextEditor){const caret=document.validatePosition(new vscode.Position(result.caret.line,result.caret.character));editor.selection=new vscode.Selection(caret,caret);editor.revealRange(new vscode.Range(caret,caret));}
    }finally{if(this.pending===cancellation){this.pending=undefined;this.pendingDocument=undefined;}cancellation.dispose();}
  }
}
