const {test}=require('node:test');const assert=require('node:assert/strict');const {spawn}=require('node:child_process');const fs=require('node:fs');const {pathToFileURL}=require('node:url');const path=require('node:path');
const {resolveLaunchPlan}=require('../build/launch.cjs');
test('packaged Java distribution initializes, diagnoses real fixture and shuts down over clean stdio', {timeout:30000},async()=>{
 const temporary=fs.mkdtempSync(path.join(require('node:os').tmpdir(),'ili-wire-'));
 const repository=await require('../scripts/gui-repository.cjs').start(temporary);
 const plan=await resolveLaunchPlan(process.cwd(),process.env.INTERLIS_JAVA||'');const child=spawn(plan.java,plan.args,{shell:false,stdio:'pipe'});
 const pending=new Map();const notifications=[];let buffer=Buffer.alloc(0),nextId=0,protocolError;let stderr='';child.stderr.on('data',x=>stderr+=x);
 child.stdout.on('data',data=>{try{buffer=Buffer.concat([buffer,data]);while(true){const split=buffer.indexOf('\r\n\r\n');if(split<0)return;const header=buffer.subarray(0,split).toString('ascii');assert.match(header,/^Content-Length: \d+(?:\r\n[^\r\n]+)*$/);const size=Number(header.match(/Content-Length: (\d+)/)[1]);if(buffer.length<split+4+size)return;const msg=JSON.parse(buffer.subarray(split+4,split+4+size));buffer=buffer.subarray(split+4+size);if(msg.id!==undefined)pending.get(msg.id)?.(msg);else notifications.push(msg);}}catch(e){protocolError=e;child.kill();}});
 function send(method,params,id){const body=JSON.stringify({jsonrpc:'2.0',method,params,...(id===undefined?{}:{id})});child.stdin.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);}
 const request=(method,params)=>new Promise((resolve,reject)=>{const id=++nextId;const timeout=setTimeout(()=>reject(new Error(`Timeout: ${method}; ${stderr}`)),10000);pending.set(id,msg=>{clearTimeout(timeout);pending.delete(id);if(msg.error)reject(new Error(JSON.stringify(msg.error)));else resolve(msg.result)});send(method,params,id);});
 try{
  const result=await request('initialize',{processId:process.pid,rootUri:null,capabilities:{},initializationOptions:{repositories:[repository.base],cacheDirectory:path.join(temporary,'cache')}});assert.equal(result.capabilities.positionEncoding,'utf-16');assert.equal(result.serverInfo.name,'interlis-java');assert.equal(result.capabilities.experimental.interlis.protocolVersion,1);assert.equal(result.capabilities.experimental.interlis.sourceContent,true);assert.equal(result.capabilities.experimental.interlis.compile,true);send('initialized',{});
  const uri=pathToFileURL(path.resolve('test/fixtures/editor-basic/Example.ili')).href;send('textDocument/didOpen',{textDocument:{uri,languageId:'interlis',version:1,text:fs.readFileSync('test/fixtures/editor-basic/Example.ili','utf8')}});
  const compiled=await request('workspace/executeCommand',{command:'interlis.compile',arguments:[]});assert.match(JSON.stringify(compiled),/succeeded/i);
  const definition=await request('textDocument/definition',{textDocument:{uri},position:{line:7,character:17}});assert.ok(JSON.stringify(definition).includes('"line":4'),JSON.stringify(definition));
  const current=await request('interlis/compile',{mode:'current',textDocument:{uri,version:1}});assert.equal(current.outcome,'succeeded');
  const external=pathToFileURL(path.resolve('test/fixtures/workspace-imports/External.ili')).href;
  send('textDocument/didOpen',{textDocument:{uri:external,languageId:'interlis',version:2,text:fs.readFileSync('test/fixtures/workspace-imports/External.ili','utf8')}});
  const targets=await request('textDocument/definition',{textDocument:{uri:external},position:{line:5,character:32}});assert.ok(targets.length);
  const handle=targets[0].uri;assert.match(handle,/^interlis-source:/);
  const revision=new URL(handle).search.slice(1);const source=await request('interlis/source',{handle,expectedRevision:revision});
  const fixture=JSON.parse(fs.readFileSync(path.join(temporary,'repository-fixtures.json')));assert.equal(source.text,fixture.sources['RemoteMiddle.ili']);assert.equal(source.readonly,true);assert.equal(source.sourceRevision,revision);
  await assert.rejects(request('interlis/source',{handle:repository.base+'RemoteMiddle.ili',expectedRevision:revision}),/unknown readonly/);
  await request('shutdown',null);send('exit',null);child.stdin.end();const code=await new Promise(resolve=>child.once('exit',resolve));assert.equal(code,0,stderr);if(protocolError)throw protocolError;assert.equal(buffer.length,0);assert.ok(notifications.some(n=>n.method==='textDocument/publishDiagnostics'));console.log(JSON.stringify({core:plan.coreCommit,bundle:plan.bundleDigest,pid:child.pid,exit:code}));
 }finally{if(child.exitCode===null)child.kill();await repository.close();fs.rmSync(temporary,{recursive:true,force:true});}
});
