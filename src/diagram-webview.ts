/** Local webview bootstrap. All semantic data comes from the Java protocol through the host. */
import type {DiagramResponse} from '../artifacts/types/editor-protocol';
declare function acquireVsCodeApi():{postMessage(message:unknown):void;getState():unknown;setState(value:unknown):void};
async function start():Promise<void> {
const api=acquireVsCodeApi(),body=document.body,channel=body.dataset.channel!;
let generation=0,follow=false,alive=true,currentRoot='',restoredRoot='';
const previous=api.getState() as {panelId?:unknown}|undefined;
const panelId=typeof previous?.panelId==='string'&&/^[a-f0-9-]{36}$/.test(previous.panelId)?previous.panelId:crypto.randomUUID();api.setState({panelId});
let saveTimer:ReturnType<typeof setTimeout>|undefined;
const status=document.getElementById('status')!,element=document.getElementById('canvas')!;
const send=(type:string,values:Record<string,unknown>={})=>api.postMessage({protocolVersion:1,channel,generation,type,...values});
// Import the exact staged neutral bundle, without rebuilding or duplicating its implementation.
const {DiagramCanvas,mountDiagramControls}=await import(/* @vite-ignore */ body.dataset.ui!);
const workerResponse=await fetch(body.dataset.worker!);if(!workerResponse.ok)throw Error('The packaged layout worker could not be loaded');
const workerUrl=URL.createObjectURL(new Blob([await workerResponse.arrayBuffer()],{type:'application/javascript'}));
const canvas=new DiagramCanvas(element,{navigate:(id:string)=>send('navigate',{elementId:id}),status:(state:string,message:string)=>{status.textContent=message.slice(0,1000);(document.getElementById('diagram-cancel') as HTMLButtonElement).disabled=!['LOADING','STALE'].includes(state)||/cancelled|stopped/i.test(message);},changed:()=>{if(saveTimer)clearTimeout(saveTimer);const mark=generation;saveTimer=setTimeout(()=>{void canvas.saveState().then((viewState:unknown)=>{if(alive&&mark===generation&&viewState)send('saveState',{viewState});}).catch(()=>{});},250);}},workerUrl);
const controls=mountDiagramControls(document.getElementById('view-controls')!,canvas,{error:(message:string)=>{status.textContent=message.slice(0,1000);},export:(format:string,scope:string)=>send('export',{format,scope}),reveal:()=>send('reveal'),focus:(symbolIds:string[],depth:number,translation:string)=>send('focus',{symbolIds,depth,translation})});
document.getElementById('refresh')!.onclick=()=>send('refresh');
document.getElementById('diagram-cancel')!.onclick=()=>{canvas.invalidate('Diagram update cancelled — Refresh to continue');send('cancel');};
document.getElementById('fit')!.onclick=()=>void canvas.fit();
document.getElementById('follow')!.onclick=()=>send('follow',{follow:!follow});
document.getElementById('association')!.onchange=event=>send('association',{association:(event.target as HTMLSelectElement).value});
function updateFollow(value:boolean):void {follow=value;const button=document.getElementById('follow')!;button.textContent=follow?'Following':'Pinned';button.setAttribute('aria-pressed',String(follow));}
window.addEventListener('message',event=>{
 const value=event.data;if(!alive||!value||value.protocolVersion!==1||value.channel!==channel||!Number.isSafeInteger(value.generation)||value.generation<generation)return;
 generation=value.generation;
 if(value.type==='status'){canvas.invalidate(String(value.message));element.dataset.status=value.status;status.textContent=String(value.message).slice(0,1000);}
 else if(value.type==='settings'){void canvas.configure({...canvas.getSettings(),...value.settings}).then(()=>controls.refresh()).catch((error:unknown)=>{status.textContent=String(error);});}
 else if(value.type==='viewAction'){if(value.action==='settle')void canvas.settle();else if(value.action==='resetLayout')void canvas.resetLayout();}
 else if(value.type==='follow')updateFollow(value.follow===true);
 else if(value.type==='selection'){if(Array.isArray(value.elementIds)&&value.elementIds.length<=2000&&value.elementIds.every((id:unknown)=>typeof id==='string'))void canvas.select(value.elementIds);}
 else if(value.type==='exportDone')status.textContent=String(value.message).slice(0,1000);
 else if(value.type==='prepareExport'){
  if(typeof value.exportId!=='string'||!['SVG','PNG'].includes(value.format)||!['FULL','VISIBLE'].includes(value.scope))return;
  const mark=generation;
  void (async()=>{let data:string;if(value.format==='SVG')data=canvas.exportSvg(value.scope).svg;else {const artifact=await canvas.exportPng(value.scope);let binary='';for(let i=0;i<artifact.data.length;i+=8192)binary+=String.fromCharCode(...artifact.data.subarray(i,i+8192));data=btoa(binary);}if(alive&&mark===generation)send('exportData',{exportId:value.exportId,data});})().catch((error:unknown)=>{status.textContent=String(error).slice(0,1000);});
 }
 else if(value.type==='diagram'){
  const response=value.response as DiagramResponse;const root=document.getElementById('root')!;root.textContent=decodeURIComponent(new URL(value.root).pathname.split('/').pop()||value.root);root.title=value.root;updateFollow(value.follow===true);
  currentRoot=value.root;const mark=generation,rootKey=currentRoot;
  void canvas.accept(response.document,value.sessionKey,canvas.getSettings()).then(async(accepted:boolean)=>{if(!accepted||mark!==generation||rootKey!==currentRoot)return;element.dataset.diagramId=response.diagramId;element.dataset.snapshotId=response.snapshotId;if(restoredRoot!==rootKey){restoredRoot=rootKey;if(value.savedState)await canvas.restoreState(value.savedState);}controls.refresh();}).catch((error:unknown)=>{status.textContent=String(error).slice(0,1000);element.dataset.status='ERROR';});
 }
});
window.addEventListener('pagehide',()=>{alive=false;if(saveTimer)clearTimeout(saveTimer);controls.dispose();canvas.dispose();URL.revokeObjectURL(workerUrl);},{once:true});
send('ready',{panelId});

}
void start().catch((error:unknown)=>{document.getElementById('status')!.textContent=String(error).slice(0,1000);document.getElementById('canvas')!.dataset.status='ERROR';});
