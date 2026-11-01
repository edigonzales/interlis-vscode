import * as vscode from 'vscode';
import {randomUUID} from 'node:crypto';
import type {LanguageClient} from 'vscode-languageclient/node';
import type {AnalysisReady,DiagramRequest,DiagramResponse,DiagramNavigation,DiagramNavigationParams,DiagramOptionsDto} from '../artifacts/types/editor-protocol';
import {verifyDiagramAssets} from './host/diagram-assets';

interface PanelState {boundUri:string;panel:vscode.WebviewPanel;root:vscode.TextDocument;follow:boolean;generation:number;ready:boolean;disposed:boolean;timer?:NodeJS.Timeout;cancel?:vscode.CancellationTokenSource;response?:DiagramResponse;association:'ENTITY'|'COMPACT_BINARY';channel:string;}
function editable(doc:vscode.TextDocument|undefined):doc is vscode.TextDocument {return !!doc&&doc.languageId==='interlis'&&['file','untitled'].includes(doc.uri.scheme);}
function escape(value:string):string {return value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
/** Thin versioned host transport. It never parses names, rewrites sources or computes ranges. */
export class DiagramEditors implements vscode.CustomTextEditorProvider,vscode.Disposable {
 static readonly viewType='interlisGuru.diagram';
 private readonly panels=new Set<PanelState>();
 private readonly subscriptions:vscode.Disposable[]=[];
 private notification?:vscode.Disposable;
 private closed=false;
 constructor(private readonly context:vscode.ExtensionContext,private readonly client:()=>LanguageClient|undefined,private readonly output:vscode.OutputChannel) {
  this.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event=>{for(const state of this.panels)if(state.root===event.document)this.invalidate(state,'Source changed — updating diagram');}),
   vscode.window.onDidChangeActiveTextEditor(editor=>{if(!editable(editor?.document))return;for(const state of this.panels)if(state.follow&&state.root!==editor!.document){state.root=editor!.document;state.panel.title=state.root.uri.path.split('/').pop()+' — UML';state.response=undefined;this.invalidate(state,'Following active INTERLIS source');}}));
 }
 connected():void {
  this.notification?.dispose();this.notification=undefined;const client=this.client();
  if(client)this.notification=client.onNotification('interlis/analysisReady',(event:AnalysisReady)=>{
   if(event.protocolVersion!==1)return;for(const state of this.panels){const capability=client.initializeResult?.capabilities.experimental?.interlis;if(event.serverInstanceId!==capability?.serverInstanceId)continue;this.invalidate(state,'Analysis updated — updating diagram');}
  });
  for(const state of this.panels)this.invalidate(state,'Server connected — updating diagram');
 }
 disconnected():void {this.notification?.dispose();this.notification=undefined;for(const state of this.panels){this.cancel(state);state.response=undefined;void this.post(state,{type:'status',status:'STALE',message:'Server stopped — restart the INTERLIS server to refresh'});}}
 async open():Promise<void> {
  const document=vscode.window.activeTextEditor?.document;
  if(!editable(document)){void vscode.window.showInformationMessage('Open a local INTERLIS file to show its diagram.');return;}
  if(document.isUntitled){void vscode.window.showInformationMessage('Save the INTERLIS file before opening its diagram.');return;}
  for(const state of this.panels)if(state.boundUri===document.uri.toString()){state.root=document;state.follow=false;state.response=undefined;this.invalidate(state,'Opening selected source');}
  await vscode.commands.executeCommand('vscode.openWith',document.uri,DiagramEditors.viewType,{viewColumn:vscode.ViewColumn.Beside,preserveFocus:false});
 }
 async resolveCustomTextEditor(document:vscode.TextDocument,panel:vscode.WebviewPanel):Promise<void> {
  await verifyDiagramAssets(this.context.extensionPath);
  const channel=randomUUID(),nonce=randomUUID().replaceAll('-','');
  const state:PanelState={boundUri:document.uri.toString(),panel,root:document,follow:false,generation:0,ready:false,disposed:false,association:'ENTITY',channel};this.panels.add(state);
  panel.webview.options={enableScripts:true,localResourceRoots:[vscode.Uri.joinPath(this.context.extensionUri,'artifacts/diagram-ui'),vscode.Uri.joinPath(this.context.extensionUri,'out')]};
  const resource=(...parts:string[])=>panel.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri,...parts)).toString();
  const ui=resource('artifacts','diagram-ui','diagram-ui.js'),worker=resource('artifacts','diagram-ui','diagram-layout-worker.js'),css=resource('artifacts','diagram-ui','diagram-ui.css'),bootstrap=resource('out','diagram-webview.js');
  panel.webview.html=`<!doctype html><html><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}' ${panel.webview.cspSource}; style-src ${panel.webview.cspSource} 'nonce-${nonce}'; worker-src ${panel.webview.cspSource} blob:; img-src ${panel.webview.cspSource} data:; font-src ${panel.webview.cspSource};"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="${escape(css)}"><style nonce="${nonce}">html,body{height:100%;margin:0;overflow:hidden;background:var(--vscode-editor-background);color:var(--vscode-editor-foreground);font:13px var(--vscode-font-family)}body{display:flex;flex-direction:column}nav{display:flex;align-items:center;gap:8px;padding:8px;flex-wrap:wrap}button,select{color:var(--vscode-button-foreground);background:var(--vscode-button-background);border:1px solid var(--vscode-focusBorder);padding:4px 10px}#status{padding:4px 10px;min-height:18px;max-height:4em;overflow:auto}#canvas{flex:1;min-height:0;--diagram-background:var(--vscode-editor-background);--diagram-foreground:var(--vscode-editor-foreground);--diagram-container:var(--vscode-sideBar-background);--diagram-border:var(--vscode-editor-foreground);--diagram-selection:var(--vscode-focusBorder)}#root{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:35vw}</style></head><body data-channel="${channel}" data-ui="${escape(ui)}" data-worker="${escape(worker)}"><nav aria-label="Diagram controls"><button id="refresh">Refresh</button><button id="fit">Fit</button><button id="follow" aria-pressed="false">Pinned</button><label>Associations <select id="association"><option value="ENTITY">Entities</option><option value="COMPACT_BINARY">Compact binary</option></select></label><span id="root"></span></nav><div id="status" role="status">Starting diagram…</div><div id="canvas" class="interlis-canvas"></div><script nonce="${nonce}" type="module" src="${escape(bootstrap)}"></script></body></html>`;
  const listener=panel.webview.onDidReceiveMessage(message=>void this.receive(state,message));
  panel.onDidDispose(()=>{state.disposed=true;this.cancel(state);this.panels.delete(state);listener.dispose();});
 }
 private post(state:PanelState,message:Record<string,unknown>):Thenable<boolean> {return state.panel.webview.postMessage({protocolVersion:1,channel:state.channel,generation:state.generation,...message});}
 private cancel(state:PanelState):void {state.generation++;if(state.timer)clearTimeout(state.timer);state.timer=undefined;state.cancel?.cancel();state.cancel?.dispose();state.cancel=undefined;}
 private invalidate(state:PanelState,message:string):void {
  if(state.disposed||this.closed)return;this.cancel(state);void this.post(state,{type:'status',status:'STALE',message});
  if(state.ready)state.timer=setTimeout(()=>void this.refresh(state),120);
 }
 private async refresh(state:PanelState):Promise<void> {
  if(state.disposed||!state.ready)return;this.cancel(state);const generation=state.generation,server=this.client(),root=state.root,version=root.version;
  const capability=server?.initializeResult?.capabilities.experimental?.interlis;
  if(!server?.isRunning()||capability?.diagramProtocolVersion!==1||capability?.diagramDocumentVersion!=='1.0'||typeof capability?.serverInstanceId!=='string'){await this.post(state,{type:'status',status:'ERROR',message:'A matching running diagram protocol 1 server is required.'});return;}
  const cancellation=new vscode.CancellationTokenSource();state.cancel=cancellation;const requestId=randomUUID();
  const options:DiagramOptionsDto={schemaVersion:'1.0',scope:'WITH_DEPENDENCIES',associationPresentation:state.association,showConstraints:true};
  const request:DiagramRequest={protocolVersion:1,requestId,textDocument:{uri:root.uri.toString(),version},options};
  await this.post(state,{type:'status',status:'LOADING',message:'Projecting current source…'});
  try {
   const response=await server.sendRequest<DiagramResponse>('interlis/diagram',request,cancellation.token);
   if(state.disposed||generation!==state.generation||server!==this.client()||root!==state.root||version!==root.version)return;
   if(response.protocolVersion!==1||response.requestId!==requestId||response.serverInstanceId!==capability.serverInstanceId||response.rootUri!==root.uri.toString()||response.documentVersion!==version||response.document?.snapshotId!==response.snapshotId)throw Error('Diagram identity mismatch. Refresh or restart the matching server.');
   state.response=response;await this.post(state,{type:'diagram',response,sessionKey:response.serverInstanceId+':'+response.rootUri,follow:state.follow,root:root.uri.toString()});
  }catch(error){if(generation!==state.generation||state.disposed||cancellation.token.isCancellationRequested)return;state.response=undefined;this.output.appendLine('Diagram failed: '+String(error));await this.post(state,{type:'status',status:'ERROR',message:String(error)});}
  finally{if(state.cancel===cancellation){state.cancel=undefined;cancellation.dispose();}}
 }
 private async receive(state:PanelState,message:unknown):Promise<void> {
  if(!message||typeof message!=='object'||Array.isArray(message)||state.disposed)return;
  const value=message as Record<string,unknown>;
  if(value.protocolVersion!==1||value.channel!==state.channel||typeof value.type!=='string'||Object.keys(value).some(key=>!['protocolVersion','channel','type','generation','elementId','follow','association'].includes(key)))return;
  switch(value.type){
   case 'ready':state.ready=true;this.invalidate(state,'Loading current source');break;
   case 'refresh':this.invalidate(state,'Refreshing current source');break;
   case 'follow':if(typeof value.follow==='boolean'){state.follow=value.follow;await this.post(state,{type:'follow',follow:state.follow});const active=vscode.window.activeTextEditor?.document;if(state.follow&&editable(active))state.root=active;this.invalidate(state,state.follow?'Following active source':'Diagram pinned');}break;
   case 'association':if(value.association==='ENTITY'||value.association==='COMPACT_BINARY'){state.association=value.association;this.invalidate(state,'Updating association presentation');}break;
   case 'navigate':if(value.generation===state.generation&&typeof value.elementId==='string'&&value.elementId.length>0&&value.elementId.length<=2048)await this.navigate(state,value.elementId);break;
  }
 }
 private async navigate(state:PanelState,elementId:string):Promise<void> {
  const response=state.response,server=this.client(),generation=state.generation,root=state.root;
  if(!response||!server?.isRunning()||root.version!==response.documentVersion)return;
  const request:DiagramNavigationParams={protocolVersion:1,serverInstanceId:response.serverInstanceId,diagramId:response.diagramId,snapshotId:response.snapshotId,textDocument:{uri:root.uri.toString(),version:root.version},elementId};
  try {
   const result=await server.sendRequest<DiagramNavigation>('interlis/diagramNavigate',request);
   if(state.disposed||generation!==state.generation||server!==this.client()||state.response!==response||result.serverInstanceId!==response.serverInstanceId||result.snapshotId!==response.snapshotId)return;
   const uri=vscode.Uri.parse(result.uri,true);if(!['file','untitled','interlis-source'].includes(uri.scheme)||(result.readonly&&uri.scheme!=='interlis-source'))throw Error('Invalid diagram navigation target');
   const {start,end}=result.range;for(const p of [start,end])if(!Number.isSafeInteger(p.line)||p.line<0||!Number.isSafeInteger(p.character)||p.character<0)throw Error('Invalid navigation range');
   const document=await vscode.workspace.openTextDocument(uri);if(state.disposed||generation!==state.generation||root.version!==response.documentVersion)return;const editor=await vscode.window.showTextDocument(document,{viewColumn:vscode.ViewColumn.One,preserveFocus:false});const range=new vscode.Range(start.line,start.character,end.line,end.character);editor.selection=new vscode.Selection(range.start,range.end);editor.revealRange(range,vscode.TextEditorRevealType.InCenterIfOutsideViewport);
  }catch(error){if(generation===state.generation){this.invalidate(state,'Source selection expired — updating diagram');this.output.appendLine('Diagram navigation rejected: '+String(error));}}
 }
 dispose():void {this.closed=true;this.notification?.dispose();for(const state of [...this.panels]){this.cancel(state);state.panel.dispose();}this.panels.clear();this.subscriptions.forEach(item=>item.dispose());}
}
