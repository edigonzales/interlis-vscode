const {test}=require('node:test');const assert=require('node:assert/strict');const {spawn}=require('node:child_process');const fs=require('node:fs');const {pathToFileURL}=require('node:url');const path=require('node:path');
const {resolveLaunchPlan}=require('../build/launch.cjs');
test('packaged Java distribution initializes, diagnoses real fixture and shuts down over clean stdio', {timeout:30000},async()=>{
 const plan=await resolveLaunchPlan(process.cwd(),process.env.INTERLIS_JAVA||'');const child=spawn(plan.java,plan.args,{shell:false,stdio:'pipe'});
 const pending=new Map();const notifications=[];let buffer=Buffer.alloc(0),nextId=0,protocolError;let stderr='';child.stderr.on('data',x=>stderr+=x);
 child.stdout.on('data',data=>{try{buffer=Buffer.concat([buffer,data]);while(true){const split=buffer.indexOf('\r\n\r\n');if(split<0)return;const header=buffer.subarray(0,split).toString('ascii');assert.match(header,/^Content-Length: \d+(?:\r\n[^\r\n]+)*$/);const size=Number(header.match(/Content-Length: (\d+)/)[1]);if(buffer.length<split+4+size)return;const msg=JSON.parse(buffer.subarray(split+4,split+4+size));buffer=buffer.subarray(split+4+size);if(msg.id!==undefined)pending.get(msg.id)?.(msg);else notifications.push(msg);}}catch(e){protocolError=e;child.kill();}});
 function send(method,params,id){const body=JSON.stringify({jsonrpc:'2.0',method,params,...(id===undefined?{}:{id})});child.stdin.write(`Content-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`);}
 const request=(method,params)=>new Promise((resolve,reject)=>{const id=++nextId;const timeout=setTimeout(()=>reject(new Error(`Timeout: ${method}; ${stderr}`)),10000);pending.set(id,msg=>{clearTimeout(timeout);pending.delete(id);if(msg.error)reject(new Error(JSON.stringify(msg.error)));else resolve(msg.result)});send(method,params,id);});
 try{
  const result=await request('initialize',{processId:process.pid,rootUri:null,capabilities:{}});assert.equal(result.capabilities.positionEncoding,'utf-16');assert.equal(result.serverInfo.name,'interlis-java');send('initialized',{});
  const uri=pathToFileURL(path.resolve('test/fixtures/editor-basic/Example.ili')).href;send('textDocument/didOpen',{textDocument:{uri,languageId:'interlis',version:1,text:fs.readFileSync('test/fixtures/editor-basic/Example.ili','utf8')}});
  const compiled=await request('workspace/executeCommand',{command:'interlis.compile',arguments:[]});assert.match(JSON.stringify(compiled),/succeeded/i);
  const definition=await request('textDocument/definition',{textDocument:{uri},position:{line:7,character:17}});assert.ok(JSON.stringify(definition).includes('"line":4'),JSON.stringify(definition));
  await request('shutdown',null);send('exit',null);child.stdin.end();const code=await new Promise(resolve=>child.once('exit',resolve));assert.equal(code,0,stderr);if(protocolError)throw protocolError;assert.equal(buffer.length,0);assert.ok(notifications.some(n=>n.method==='textDocument/publishDiagnostics'));console.log(JSON.stringify({core:plan.coreCommit,bundle:plan.bundleDigest,pid:child.pid,exit:code}));
 }finally{if(child.exitCode===null)child.kill();}
});
