/** Local webview bootstrap. All semantic data comes from the Java protocol through the host. */
import type {DiagramResponse} from '../artifacts/types/editor-protocol';
declare function acquireVsCodeApi():{postMessage(message:unknown):void;getState():unknown;setState(value:unknown):void};
const api=acquireVsCodeApi(),body=document.body,channel=body.dataset.channel!;
let generation=0,follow=false,alive=true;
const status=document.getElementById('status')!,element=document.getElementById('canvas')!;
const send=(type:string,values:Record<string,unknown>={})=>api.postMessage({protocolVersion:1,channel,generation,type,...values});
// Import the exact staged neutral bundle, without rebuilding or duplicating its implementation.
const {DiagramCanvas}=await import(/* @vite-ignore */ body.dataset.ui!);
const canvas=new DiagramCanvas(element,{navigate:(id:string)=>send('navigate',{elementId:id}),status:(_state:string,message:string)=>{status.textContent=message.slice(0,1000);}},body.dataset.worker!);
document.getElementById('refresh')!.onclick=()=>send('refresh');
document.getElementById('fit')!.onclick=()=>void canvas.fit();
document.getElementById('follow')!.onclick=()=>send('follow',{follow:!follow});
document.getElementById('association')!.onchange=event=>send('association',{association:(event.target as HTMLSelectElement).value});
function updateFollow(value:boolean):void {follow=value;const button=document.getElementById('follow')!;button.textContent=follow?'Following':'Pinned';button.setAttribute('aria-pressed',String(follow));}
window.addEventListener('message',event=>{
 const value=event.data;if(!alive||!value||value.protocolVersion!==1||value.channel!==channel||!Number.isSafeInteger(value.generation)||value.generation<generation)return;
 generation=value.generation;
 if(value.type==='status'){canvas.invalidate(String(value.message));element.dataset.status=value.status;status.textContent=String(value.message).slice(0,1000);}
 else if(value.type==='follow')updateFollow(value.follow===true);
 else if(value.type==='diagram'){
  const response=value.response as DiagramResponse;document.getElementById('root')!.textContent=value.root;updateFollow(value.follow===true);
  void canvas.accept(response.document,value.sessionKey).catch((error:unknown)=>{status.textContent=String(error).slice(0,1000);element.dataset.status='ERROR';});
 }
});
window.addEventListener('pagehide',()=>{alive=false;canvas.dispose();},{once:true});
send('ready');
