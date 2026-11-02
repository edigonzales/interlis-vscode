import * as vscode from 'vscode';

type Interaction={uri:string;baseVersion:number;headerStops:number;suggestAtBody:boolean;suppressHeader:boolean};

/** Native snippet/cursor interaction only; all template and slot decisions arrive from Java. */
export class SnippetInteraction implements vscode.Disposable {
  private current:{document:vscode.TextDocument;remaining:number;suggestAtBody:boolean;suppressHeader:boolean}|undefined;
  private readonly subscriptions:vscode.Disposable[]=[];
  constructor(){
    this.subscriptions.push(vscode.commands.registerCommand('interlisGuru.snippet.accept',(data:Interaction)=>{
      const document=vscode.window.activeTextEditor?.document;
      if(!document||document.uri.toString()!==data?.uri||document.version<data.baseVersion||!Number.isSafeInteger(data.headerStops)||data.headerStops<0||data.headerStops>8)return;
      this.current={document,remaining:data.headerStops,suggestAtBody:data.suggestAtBody===true,suppressHeader:data.suppressHeader===true};
    }),vscode.commands.registerCommand('interlisGuru.snippet.advanced',async()=>{
      const state=this.current;
      if(state&&--state.remaining<=0){this.current=undefined;if(state.suggestAtBody)await vscode.commands.executeCommand('editor.action.triggerSuggest');}
    }),vscode.commands.registerCommand('interlisGuru.snippet.clear',()=>{this.current=undefined;}),vscode.window.onDidChangeActiveTextEditor(()=>{this.current=undefined;}),vscode.window.onDidChangeTextEditorSelection(event=>{if(event.kind===vscode.TextEditorSelectionChangeKind.Mouse)this.current=undefined;}),vscode.workspace.onDidChangeTextDocument(event=>{if(event.reason)this.current=undefined;}));

  }
  suppress(document:vscode.TextDocument):boolean{return this.current?.document===document&&this.current.remaining>0&&this.current.suppressHeader;}
  dispose(){this.current=undefined;for(const disposable of this.subscriptions)disposable.dispose();}
}
