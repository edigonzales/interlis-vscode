const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
exports.start=async function(evidence){
 const model=(name,version,body)=>`INTERLIS 2.4;\nMODEL ${name} AT "https://example.org" VERSION "${version}" =\n${body}\nEND ${name}.\n`;
 const sources={
  'RemoteLeaf1.ili':model('RemoteLeaf','1','DOMAIN RemoteCount=0..10;'),
  'RemoteLeaf2.ili':model('RemoteLeaf','2','DOMAIN RemoteCount=0..999;'),
  'RemoteMiddle.ili':model('RemoteMiddle','1','IMPORTS RemoteLeaf;\nDOMAIN RemoteHeight=0..10;\nTOPIC Data= CLASS Item= count:RemoteLeaf.RemoteCount; END Item; END Data;')
 };
 const metadata=(name,version,file,previous)=>`<ModelMetadata><Name>${name}</Name><SchemaLanguage>ili2_4</SchemaLanguage><Version>${version}</Version><File>${file}</File>${previous?`<precursorVersion>${previous}</precursorVersion>`:''}</ModelMetadata>`;
 sources['ilimodels.xml']='<TRANSFER>'+metadata('RemoteMiddle','1','RemoteMiddle.ili')+metadata('RemoteLeaf','1','RemoteLeaf1.ili')+metadata('RemoteLeaf','2','RemoteLeaf2.ili','1')+'</TRANSFER>';
 const stats={requests:[],bodies:0};const persist=()=>fs.writeFileSync(path.join(evidence,'repository-stats.json'),JSON.stringify(stats,null,2));persist();
 const server=http.createServer((req,res)=>{
  const file=decodeURIComponent(req.url.slice(1)),text=sources[file];stats.requests.push({path:req.url,condition:req.headers['if-none-match']||null});
  if(text===undefined){res.writeHead(404);res.end();persist();return;}
  const bytes=Buffer.from(text),etag='"'+crypto.createHash('sha256').update(bytes).digest('hex')+'"';
  res.setHeader('ETag',etag);
  if(req.headers['if-none-match']===etag){res.writeHead(304);res.end();persist();return;}
  stats.bodies++;res.writeHead(200,{'Content-Length':bytes.length});res.end(bytes);persist();
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base=`http://127.0.0.1:${server.address().port}/`;
 const pins=[{modelName:'RemoteLeaf',modelVersion:'2',sourceId:base+'RemoteLeaf2.ili',sha256:crypto.createHash('sha256').update(sources['RemoteLeaf2.ili']).digest('hex')}];
 fs.writeFileSync(path.join(evidence,'repository-fixtures.json'),JSON.stringify({base,pins,sources},null,2));
 return {base,pins,close:()=>new Promise(resolve=>server.close(resolve))};
};
