import * as vscode from 'vscode';
import {randomUUID} from 'node:crypto';
import type {LanguageClient} from 'vscode-languageclient/node';
import type {AnalysisReady,DiagramRequest,DiagramResponse,DiagramNavigation,DiagramNavigationParams,DiagramSelectionParams,DiagramSelectionResult} from '../artifacts/types/editor-protocol';
import {verifyDiagramAssets} from './host/diagram-assets';
import {DiagramStateStore} from './host/diagram-state';
import {decodeDiagramExport} from './host/diagram-export';
import {diagramProjectionRequest} from './host/diagram-options';

interface PanelState {cancelledVersion?:number;boundUri:string;panel:vscode.WebviewPanel;root:vscode.TextDocument;follow:boolean;generation:number;ready:boolean;fresh:boolean;disposed:boolean;timer?:NodeJS.Timeout;cancel?:vscode.CancellationTokenSource;response?:DiagramResponse;association:'ENTITY'|'COMPACT_BINARY';channel:string;panelId?:string;symbolIds?:string[];depth?:number;translation?:string;exportRequest?:{id:string;uri:vscode.Uri;format:'SVG'|'PNG';generation:number};}
function editable(doc:vscode.TextDocument|undefined):doc is vscode.TextDocument {return !!doc&&doc.languageId==='interlis'&&['file','untitled'].includes(doc.uri.scheme);}
function escape(value:string):string {return value.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));}
/** Thin versioned host transport. It never parses names, rewrites sources or computes ranges. */
export class DiagramEditors implements vscode.CustomTextEditorProvider,vscode.Disposable {
 static readonly viewType='interlisGuru.diagram';
 private readonly panels=new Set<PanelState>();
 private readonly subscriptions:vscode.Disposable[]=[];
 private notification?:vscode.Disposable;
 private closed=false;
 private lastSourceEditor?:vscode.TextEditor;
 private store?:DiagramStateStore;
 private storageQueue:Promise<void>=Promise.resolve();
 constructor(private readonly context:vscode.ExtensionContext,private readonly client:()=>LanguageClient|undefined,private readonly output:vscode.OutputChannel) {
  this.lastSourceEditor=vscode.window.activeTextEditor;
  this.subscriptions.push(vscode.window.onDidChangeTextEditorSelection(event=>{if(event.textEditor.document.languageId==='interlis')this.lastSourceEditor=event.textEditor;}),vscode.workspace.onDidChangeTextDocument(event=>{for(const state of this.panels)if(state.root===event.document){state.symbolIds=undefined;state.depth=undefined;state.translation=undefined;this.invalidate(state,'Source changed — updating diagram');}}),
   vscode.window.onDidChangeActiveTextEditor(editor=>{if(!editable(editor?.document))return;this.lastSourceEditor=editor;void this.autoOpen(editor!.document);for(const state of this.panels)if(state.follow&&state.root!==editor!.document){state.root=editor!.document;state.symbolIds=undefined;state.depth=undefined;state.translation=undefined;state.panel.title=state.root.uri.path.split('/').pop()+' — UML';state.response=undefined;this.invalidate(state,'Following active INTERLIS source');}}));
 }
 connected():void {
  this.notification?.dispose();this.notification=undefined;const client=this.client();
  if(client)this.notification=client.onNotification('interlis/analysisReady',(event:AnalysisReady)=>{
   if(event.protocolVersion!==1)return;for(const state of this.panels){const capability=client.initializeResult?.capabilities.experimental?.interlis;if(event.serverInstanceId!==capability?.serverInstanceId||state.cancelledVersion===state.root.version)continue;if(state.response&&event.snapshotId!==state.response.snapshotId){state.symbolIds=undefined;state.depth=undefined;state.translation=undefined;}this.invalidate(state,'Analysis updated — updating diagram');}
  });
  for(const state of this.panels)this.invalidate(state,'Server connected — updating diagram');if(editable(vscode.window.activeTextEditor?.document))void this.autoOpen(vscode.window.activeTextEditor!.document);
 }
 disconnected():void {this.notification?.dispose();this.notification=undefined;for(const state of this.panels){this.cancel(state);state.response=undefined;void this.post(state,{type:'status',status:'STALE',message:'Server stopped — restart the INTERLIS server to refresh'});}}
 async open():Promise<void> {
  const document=vscode.window.activeTextEditor?.document;
  if(!editable(document)){void vscode.window.showInformationMessage('Open a local INTERLIS file to show its diagram.');return;}
  if(document.isUntitled){void vscode.window.showInformationMessage('Save the INTERLIS file before opening its diagram.');return;}
  for(const state of this.panels)if(state.boundUri===document.uri.toString()){state.root=document;state.symbolIds=undefined;state.depth=undefined;state.translation=undefined;state.panel.title=document.uri.path.split('/').pop()+' — UML';state.follow=false;state.response=undefined;this.invalidate(state,'Opening selected source');}
  await vscode.commands.executeCommand('vscode.openWith',document.uri,DiagramEditors.viewType,{viewColumn:vscode.ViewColumn.Beside,preserveFocus:false});
 }
 async resolveCustomTextEditor(document:vscode.TextDocument,panel:vscode.WebviewPanel,token:vscode.CancellationToken):Promise<void> {
  let closed=false;const pending=panel.onDidDispose(()=>{closed=true;});
  try{await verifyDiagramAssets(this.context.extensionPath);}catch(error){pending.dispose();if(closed||token.isCancellationRequested)return;throw error;}
  if(closed||token.isCancellationRequested){pending.dispose();return;}
  this.store??=new DiagramStateStore(this.context.workspaceState);
  const channel=randomUUID(),nonce=randomUUID().replaceAll('-','');
  const state:PanelState={boundUri:document.uri.toString(),panel,root:document,follow:vscode.workspace.getConfiguration('interlisGuru').get<boolean>('diagram.followEditor',false),generation:0,ready:false,fresh:false,disposed:false,association:'ENTITY',channel};this.panels.add(state);panel.title=document.uri.path.split('/').pop()+' — UML';
  let visible=panel.visible;const visibility=panel.onDidChangeViewState(event=>{if(visible===event.webviewPanel.visible)return;visible=event.webviewPanel.visible;this.invalidate(state,visible?'Diagram shown — updating current source':'Diagram hidden — updates paused');});
  panel.webview.options={enableScripts:true,localResourceRoots:[vscode.Uri.joinPath(this.context.extensionUri,'out')]};
  const resource=(...parts:string[])=>panel.webview.asWebviewUri(vscode.Uri.joinPath(this.context.extensionUri,...parts)).toString();
  const ui=resource('out','diagram','diagram-ui.js'),worker=resource('out','diagram','diagram-layout-worker.js'),css=resource('out','diagram','diagram-ui.css'),bootstrap=resource('out','diagram-webview.js');
  panel.webview.html=`<!doctype html><html><head><meta charset="UTF-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'nonce-${nonce}' ${panel.webview.cspSource}; style-src ${panel.webview.cspSource} 'nonce-${nonce}'; worker-src blob:; connect-src ${panel.webview.cspSource}; img-src ${panel.webview.cspSource} data: blob:; font-src ${panel.webview.cspSource};"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="${escape(css)}"><style nonce="${nonce}">html,body{height:100%;margin:0;overflow:hidden;background:var(--vscode-editor-background);color:var(--vscode-editor-foreground);font:13px var(--vscode-font-family)}body{display:flex;flex-direction:column}nav{display:flex;align-items:center;gap:8px;padding:8px;flex-wrap:wrap}button,select{color:var(--vscode-button-foreground);background:var(--vscode-button-background);border:1px solid var(--vscode-focusBorder);padding:4px 10px}#status{padding:4px 10px;min-height:18px;max-height:4em;overflow:auto}#canvas{flex:1;min-height:0;--diagram-background:var(--vscode-editor-background);--diagram-foreground:var(--vscode-editor-foreground);--diagram-container:var(--vscode-sideBar-background);--diagram-border:var(--vscode-editor-foreground);--diagram-selection:var(--vscode-focusBorder)}#root{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:35vw}</style></head><body data-channel="${channel}" data-ui="${escape(ui)}" data-worker="${escape(worker)}"><nav aria-label="Diagram controls"><button id="refresh">Refresh</button><button id="diagram-cancel" disabled title="Cancel pending diagram analysis or layout">Cancel</button><button id="fit">Fit</button><button id="follow" aria-pressed="false">Pinned</button><label>Associations <select id="association"><option value="ENTITY">Entities</option><option value="COMPACT_BINARY">Compact binary</option></select></label><span id="root"></span></nav><div id="view-controls"></div><div id="status" role="status">Starting diagram…</div><div id="canvas" class="interlis-canvas"></div><script nonce="${nonce}" type="module" src="${escape(bootstrap)}"></script></body></html>`;
  const listener=panel.webview.onDidReceiveMessage(message=>void this.receive(state,message));
  panel.onDidDispose(()=>{state.disposed=true;this.cancel(state);this.panels.delete(state);listener.dispose();visibility.dispose();});pending.dispose();
 }
 private post(state:PanelState,message:Record<string,unknown>):Thenable<boolean> {return state.panel.webview.postMessage({protocolVersion:1,channel:state.channel,generation:state.generation,...message});}
 private cancel(state:PanelState):void {state.fresh=false;state.generation++;if(state.timer)clearTimeout(state.timer);state.timer=undefined;state.cancel?.cancel();state.cancel?.dispose();state.cancel=undefined;state.exportRequest=undefined;}
 private invalidate(state:PanelState,message:string):void {
  if(state.disposed||this.closed)return;state.cancelledVersion=undefined;this.cancel(state);void this.post(state,{type:'status',status:'STALE',message});
  if(state.ready&&state.panel.visible)state.timer=setTimeout(()=>void this.refresh(state),120);
 }
 private async refresh(state:PanelState):Promise<void> {
  if(state.disposed||!state.ready||!state.panel.visible)return;this.cancel(state);const generation=state.generation,server=this.client(),root=state.root,version=root.version;
  const capability=server?.initializeResult?.capabilities.experimental?.interlis;
  if(!server?.isRunning()||capability?.diagramProtocolVersion!==1||capability?.diagramDocumentVersion!=='1.0'||typeof capability?.serverInstanceId!=='string'){await this.post(state,{type:'status',status:'ERROR',message:'A matching running diagram protocol 1 server is required.'});return;}
  const cancellation=new vscode.CancellationTokenSource();state.cancel=cancellation;const requestId=randomUUID();
  const request:DiagramRequest={protocolVersion:1,requestId,textDocument:{uri:root.uri.toString(),version},...diagramProjectionRequest({association:state.association,symbolIds:state.symbolIds,depth:state.depth,translation:state.translation,snapshotId:state.response?.snapshotId})};
  await this.post(state,{type:'status',status:'LOADING',message:'Projecting current source…'});
  try {
   const response=await server.sendRequest<DiagramResponse>('interlis/diagram',request,cancellation.token);
   if(state.disposed||generation!==state.generation||server!==this.client()||root!==state.root||version!==root.version)return;
   if(response.protocolVersion!==1||response.requestId!==requestId||response.serverInstanceId!==capability.serverInstanceId||response.rootUri!==root.uri.toString()||response.documentVersion!==version||response.document?.snapshotId!==response.snapshotId)throw Error('Diagram identity mismatch. Refresh or restart the matching server.');
   state.response=response;state.fresh=true;await this.post(state,{type:'diagram',response,sessionKey:response.rootUri,follow:state.follow,root:root.uri.toString(),savedState:this.store?.read(this.storageKey(state))??this.store?.read(this.storageKey(state,'latest'))});
  }catch(error){if(generation!==state.generation||state.disposed||cancellation.token.isCancellationRequested)return;state.response=undefined;this.output.appendLine('Diagram failed: '+String(error));await this.post(state,{type:'status',status:'ERROR',message:String(error)});}
  finally{if(state.cancel===cancellation){state.cancel=undefined;cancellation.dispose();}}
 }
 private async receive(state:PanelState,message:unknown):Promise<void> {
  if(!message||typeof message!=='object'||Array.isArray(message)||state.disposed)return;
  const value=message as Record<string,unknown>;
  if(value.protocolVersion!==1||value.channel!==state.channel||typeof value.type!=='string'||Object.keys(value).some(key=>!['protocolVersion','channel','type','generation','elementId','follow','association','panelId','viewState','format','scope','exportId','data','symbolIds','depth','translation'].includes(key)))return;
  switch(value.type){
   case 'ready':if(typeof value.panelId!=='string'||! /^[a-f0-9-]{36}$/.test(value.panelId))return;state.panelId=value.panelId;state.ready=true;await this.post(state,{type:'settings',settings:this.initialSettings()});this.invalidate(state,'Loading current source');break;
   case 'refresh':this.invalidate(state,'Refreshing current source');break;
   case 'cancel':if(value.generation===state.generation)await this.cancelUpdate(state);break;
   case 'follow':if(typeof value.follow==='boolean'){state.follow=value.follow;await this.post(state,{type:'follow',follow:state.follow});const active=vscode.window.activeTextEditor?.document;if(state.follow&&editable(active)&&state.root!==active){state.root=active;state.symbolIds=undefined;state.depth=undefined;state.translation=undefined;state.response=undefined;state.panel.title=active.uri.path.split('/').pop()+' — UML';}this.invalidate(state,state.follow?'Following active source':'Diagram pinned');}break;
   case 'association':if(value.association==='ENTITY'||value.association==='COMPACT_BINARY'){state.association=value.association;this.invalidate(state,'Updating association presentation');}break;
   case 'saveState':if(value.generation===state.generation&&state.fresh&&state.response){const keys=[this.storageKey(state),this.storageKey(state,'latest')];this.storageQueue=this.storageQueue.then(async()=>{await this.store?.write(keys,value.viewState);}).catch(error=>this.output.appendLine('Diagram state rejected: '+String(error)));}break;
   case 'reveal':if(value.generation===state.generation)await this.revealPanel(state);break;
   case 'focus':if(state.fresh&&value.generation===state.generation&&Array.isArray(value.symbolIds)&&value.symbolIds.length<=500&&value.symbolIds.every(id=>typeof id==='string'&&id.length<=2048)&&Number.isInteger(value.depth)&&Number(value.depth)>=0&&Number(value.depth)<=3&&typeof value.translation==='string'){
    const doc=state.response?.document,allowed=new Set([...doc?.nodes??[],...doc?.containers??[]].flatMap(n=>n.symbol?[n.symbol.symbol]:[]).concat(doc?.edges.flatMap(e=>e.origin?[e.origin.symbol]:[])??[]));if(!value.symbolIds.every(id=>allowed.has(id)))return;
    if(value.translation&&!doc?.edges.some(e=>e.kind==='TRANSLATION'&&doc.containers.some(c=>c.id===e.source.elementId&&c.symbol?.symbol===value.translation)))return;
    state.symbolIds=value.symbolIds as string[];state.depth=Number(value.depth);state.translation=value.translation;this.invalidate(state,'Updating focus projection');}break;
   case 'export':if(value.generation===state.generation&&(value.format==='SVG'||value.format==='PNG')&&(value.scope==='FULL'||value.scope==='VISIBLE'))await this.beginExport(state,value.format,value.scope);break;
   case 'exportData':if(typeof value.exportId==='string'&&state.exportRequest?.id===value.exportId&&value.generation===state.exportRequest.generation)await this.finishExport(state,value.data);break;
   case 'navigate':if(value.generation===state.generation&&typeof value.elementId==='string'&&value.elementId.length>0&&value.elementId.length<=2048)await this.navigate(state,value.elementId);break;
  }
 }
 private async navigate(state:PanelState,elementId:string):Promise<void> {
  const response=state.response,server=this.client(),generation=state.generation,root=state.root;
  if(!state.fresh||!response||!server?.isRunning()||root.version!==response.documentVersion)return;
  const request:DiagramNavigationParams={protocolVersion:1,serverInstanceId:response.serverInstanceId,diagramId:response.diagramId,snapshotId:response.snapshotId,textDocument:{uri:root.uri.toString(),version:root.version},elementId};
  try {
   const result=await server.sendRequest<DiagramNavigation>('interlis/diagramNavigate',request);
   if(state.disposed||generation!==state.generation||server!==this.client()||state.response!==response||result.serverInstanceId!==response.serverInstanceId||result.snapshotId!==response.snapshotId)return;
   const uri=vscode.Uri.parse(result.uri,true);if(!['file','untitled','interlis-source'].includes(uri.scheme)||(result.readonly&&uri.scheme!=='interlis-source'))throw Error('Invalid diagram navigation target');
   const {start,end}=result.range;for(const p of [start,end])if(!Number.isSafeInteger(p.line)||p.line<0||!Number.isSafeInteger(p.character)||p.character<0)throw Error('Invalid navigation range');
   const document=await vscode.workspace.openTextDocument(uri);if(state.disposed||generation!==state.generation||root.version!==response.documentVersion)return;const editor=await vscode.window.showTextDocument(document,{viewColumn:vscode.ViewColumn.One,preserveFocus:false});const range=new vscode.Range(start.line,start.character,end.line,end.character);editor.selection=new vscode.Selection(range.start,range.end);editor.revealRange(range,vscode.TextEditorRevealType.InCenterIfOutsideViewport);await vscode.commands.executeCommand('workbench.action.focusFirstEditorGroup');
  }catch(error){if(generation===state.generation){this.invalidate(state,'Source selection expired — updating diagram');this.output.appendLine('Diagram navigation rejected: '+String(error));}}
 }
 private storageKey(state:PanelState,panel=state.panelId??'latest'):string {return this.store!.key(vscode.workspace.workspaceFolders?.map(f=>f.uri.toString())??[],state.root.uri.toString(),panel);}
 private readonly autoOpening=new Set<string>();
 private async autoOpen(document:vscode.TextDocument):Promise<void> {if(document.isUntitled||!vscode.workspace.isTrusted||!vscode.workspace.getConfiguration('interlisGuru',document.uri).get<boolean>('diagram.autoOpenBeside',false))return;const key=document.uri.toString();if(this.autoOpening.has(key)||[...this.panels].some(s=>s.boundUri===key))return;this.autoOpening.add(key);try{await vscode.commands.executeCommand('vscode.openWith',document.uri,DiagramEditors.viewType,{viewColumn:vscode.ViewColumn.Beside,preserveFocus:true});}catch(error){this.output.appendLine('Automatic diagram open failed: '+String(error));}finally{this.autoOpening.delete(key);}}
 private initialSettings():Record<string,unknown> {const c=vscode.workspace.getConfiguration('interlisGuru');return {attributeMode:c.get('diagram.attributeMode','OWN'),edgeRouting:c.get('diagram.edgeRouting','ORTHOGONAL'),nodePlacement:c.get('diagram.nodePlacement','BRANDES_KOEPF'),renderingTarget:c.get('diagram.rendering.target','STANDARD'),edgeCrossingStyle:c.get('diagram.edgeCrossings','GAPS'),showAssociationNames:c.get('diagram.showAssociationNames',true),showRoleCardinalities:c.get('diagram.showRoleCardinalities',true),showLocalEnumerationValues:c.get('diagram.showLocalEnumerationValues',true)};}
 private async cancelUpdate(state:PanelState):Promise<void> {this.cancel(state);state.cancelledVersion=state.root.version;state.response=undefined;await this.post(state,{type:'status',status:'STALE',message:'Diagram update cancelled — Refresh to continue'});}
 async viewAction(action:'refresh'|'settle'|'resetLayout'|'export'|'cancel'):Promise<void> {const state=[...this.panels].find(s=>s.panel.active)??[...this.panels].find(s=>s.panel.visible);if(!state){void vscode.window.showInformationMessage('Open an INTERLIS diagram first.');return;}if(action==='refresh'){this.invalidate(state,'Refreshing current source');return;}if(action==='cancel'){await this.cancelUpdate(state);return;}if(action==='export'){const format=await vscode.window.showQuickPick(['SVG','PNG'],{title:'Diagram export format'});if(format!=='SVG'&&format!=='PNG')return;const scope=await vscode.window.showQuickPick(['FULL','VISIBLE'],{title:'Diagram export scope'});if(scope!=='FULL'&&scope!=='VISIBLE')return;await this.beginExport(state,format,scope);return;}await this.post(state,{type:'viewAction',action});}
 async reveal():Promise<void> {await this.revealPanel();}
 private async revealPanel(state?:PanelState):Promise<void> {
  const editor=vscode.window.activeTextEditor??this.lastSourceEditor;if(!editor)return;const targets=state?[state]:[...this.panels].filter(s=>s.panel.visible);for(const current of targets){const response=current.response,server=this.client(),generation=current.generation,source=editor.document,version=source.version,position=editor.selection.active;if(!current.fresh||!response||!server?.isRunning()||current.root.version!==response.documentVersion)continue;
   const request:DiagramSelectionParams={protocolVersion:1,serverInstanceId:response.serverInstanceId,diagramId:response.diagramId,snapshotId:response.snapshotId,textDocument:{uri:current.root.uri.toString(),version:current.root.version},sourceDocument:{uri:source.uri.toString(),version},position:{line:position.line,character:position.character}};
   try{const result=await server.sendRequest<DiagramSelectionResult>('interlis/diagramSelect',request);if(current.disposed||generation!==current.generation||response!==current.response||server!==this.client()||source.version!==version||result.protocolVersion!==1||result.serverInstanceId!==response.serverInstanceId||result.diagramId!==response.diagramId||result.snapshotId!==response.snapshotId||result.rootUri!==response.rootUri||result.documentVersion!==response.documentVersion||result.sourceUri!==source.uri.toString()||result.sourceVersion!==version)continue;await this.post(current,{type:'selection',elementIds:result.elementIds});}catch(error){this.output.appendLine('Diagram selection unavailable: '+String(error));}
  }
 }
 private async beginExport(state:PanelState,format:'SVG'|'PNG',scope:'FULL'|'VISIBLE'):Promise<void> {if(!state.fresh||!state.response||state.root.version!==state.response.documentVersion)return;const generation=state.generation;const uri=await vscode.window.showSaveDialog({title:'Export current diagram — '+scope.toLowerCase(),defaultUri:vscode.Uri.joinPath(state.root.uri,'..','diagram.'+format.toLowerCase()),filters:{[format]:[format.toLowerCase()]}});if(!uri||state.disposed||generation!==state.generation)return;const id=randomUUID();state.exportRequest={id,uri,format,generation};await this.post(state,{type:'prepareExport',exportId:id,format,scope});}
 private async finishExport(state:PanelState,data:unknown):Promise<void> {const request=state.exportRequest;if(!request)return;state.exportRequest=undefined;const temporary=vscode.Uri.joinPath(request.uri,'..','.'+request.uri.path.split('/').pop()+'.'+request.id+'.tmp');try{const bytes=decodeDiagramExport(request.format,data);if(state.disposed||request.generation!==state.generation)return;await vscode.workspace.fs.writeFile(temporary,bytes);if(state.disposed||request.generation!==state.generation)throw Error('Diagram changed during export');await vscode.workspace.fs.rename(temporary,request.uri,{overwrite:true});await this.post(state,{type:'exportDone',message:'Export saved: '+request.uri.path.split('/').pop()});}catch(error){try{await vscode.workspace.fs.delete(temporary);}catch{}this.output.appendLine('Diagram export failed: '+String(error));void vscode.window.showErrorMessage('Diagram export failed: '+String(error));}}
 dispose():void {this.closed=true;this.notification?.dispose();for(const state of [...this.panels]){this.cancel(state);state.panel.dispose();}this.panels.clear();this.subscriptions.forEach(item=>item.dispose());}
}
