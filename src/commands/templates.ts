import * as vscode from 'vscode';

/** User-selected sources only. Templates become unsaved text and are never executed. */
export async function newFromTemplate(context:vscode.ExtensionContext):Promise<void>{
  const config=vscode.workspace.getConfiguration('interlisGuru.templates');const remote=config.get<string>('url',''),local=config.get<string>('file','');
  const choices=[{label:'Built-in INTERLIS model',source:'builtin'},...(local?[{label:'Configured local template',source:'local'}]:[]),...(remote?[{label:'Configured remote template',source:'remote'}]:[])];
  const choice=choices.length===1?choices[0]:await vscode.window.showQuickPick(choices,{title:'New INTERLIS model from template'});if(!choice)return;
  let content:string|undefined;
  if(choice.source==='builtin')content=Buffer.from(await vscode.workspace.fs.readFile(vscode.Uri.joinPath(context.extensionUri,'resources/templates/model.ili'))).toString('utf8');
  else {
    if(!vscode.workspace.isTrusted)throw new Error('Trust this workspace before loading a configured template.');
    if(choice.source==='local'){const uri=vscode.Uri.file(local);const stat=await vscode.workspace.fs.stat(uri);if(stat.size>1_000_000)throw new Error('Template exceeds 1 MB.');content=new TextDecoder('utf-8',{fatal:true}).decode(await vscode.workspace.fs.readFile(uri));}
    else content=await vscode.window.withProgress({location:vscode.ProgressLocation.Notification,title:'INTERLIS: loading selected template',cancellable:true},async(_,token)=>{
      const abort=new AbortController(),subscription=token.onCancellationRequested(()=>abort.abort()),timeout=setTimeout(()=>abort.abort(),10_000);
      try {let url=new URL(remote);for(let redirects=0;redirects<5;redirects++){
          if(url.username||url.password||!(url.protocol==='https:'||url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)))throw new Error('Template URL must use HTTPS (HTTP is limited to a local test server), without credentials.');
          const response=await fetch(url,{signal:abort.signal,redirect:'manual'});if([301,302,303,307,308].includes(response.status)){const next=response.headers.get('location');await response.body?.cancel();if(!next)throw new Error('Template redirect has no destination.');url=new URL(next,url);continue;}
          if(!response.ok){await response.body?.cancel();throw new Error('Template request failed (HTTP '+response.status+').');}
          if(Number(response.headers.get('content-length')||0)>1_000_000){await response.body?.cancel();throw new Error('Template exceeds 1 MB.');}
          const reader=response.body?.getReader();if(!reader)throw new Error('Template response has no content.');const chunks:Uint8Array[]=[];let size=0;
          for(;;){const part=await reader.read();if(part.done)break;size+=part.value.length;if(size>1_000_000){await reader.cancel();throw new Error('Template exceeds 1 MB.');}chunks.push(part.value);}if(!size)throw new Error('Template is empty.');const bytes=Buffer.concat(chunks);return new TextDecoder('utf-8',{fatal:true}).decode(bytes);
        }throw new Error('Too many template redirects.');
      }catch(error){if(token.isCancellationRequested)return undefined;if(abort.signal.aborted)throw new Error('Template request timed out.');throw error;}finally{clearTimeout(timeout);subscription.dispose();}
    });
  }
  if(content===undefined)return;if(content.includes('\0')||Buffer.byteLength(content)>1_000_000)throw new Error('Invalid or oversized template text.');
  await vscode.window.showTextDocument(await vscode.workspace.openTextDocument({language:'interlis',content}));
}
