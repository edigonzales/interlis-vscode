const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
exports.start=async function(evidence){
 const text='INTERLIS 2.4;\nMODEL RemoteTemplate AT "https://example.org" VERSION "1"=\n!! <script>globalThis.mustNotRun=true</script>\nEND RemoteTemplate.\n';
 const requests=[],timers=new Set();const persist=()=>fs.writeFileSync(path.join(evidence,'template-requests.json'),JSON.stringify(requests,null,2));
 const server=http.createServer((req,res)=>{requests.push({path:req.url,at:new Date().toISOString()});persist();res.on('close',()=>{requests.push({closed:req.url,at:new Date().toISOString()});persist();});
  if(req.url==='/model.ili'){res.writeHead(200,{'Content-Type':'text/plain','Content-Length':Buffer.byteLength(text)});res.end(text);}
  else if(req.url==='/large'){res.writeHead(200,{'Content-Length':1000001});res.end('oversized');}
  else if(req.url==='/slow'){const timer=setTimeout(()=>{timers.delete(timer);res.writeHead(200,{'Content-Type':'text/plain'});res.end(text);},15000);timers.add(timer);res.on('close',()=>{clearTimeout(timer);timers.delete(timer);});}
  else {res.writeHead(503);res.end('controlled failure');}
 });await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+server.address().port;fs.writeFileSync(path.join(evidence,'template-fixtures.json'),JSON.stringify({base,text},null,2));
 return {base,close:()=>{for(const t of timers)clearTimeout(t);server.closeAllConnections();return new Promise(resolve=>server.close(resolve));}};
};
