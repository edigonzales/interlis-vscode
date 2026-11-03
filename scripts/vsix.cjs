const fs=require('node:fs'),path=require('node:path'),{pipeline}=require('node:stream/promises'),yauzl=require('yauzl');
/** Inspect the real archive, never just the directory supplied to vsce. */
function extractVSIX(file,destination){return new Promise((resolve,reject)=>yauzl.open(file,{lazyEntries:true},(error,zip)=>{if(error)return reject(error);let size=0,count=0;const root=path.resolve(destination);function fail(error){zip.close();reject(error);}zip.on('error',fail);zip.on('entry',entry=>{(async()=>{const name=entry.fileName;size+=entry.uncompressedSize;if(++count>5000||size>600*1024*1024||name.includes('\\')||name.startsWith('/')||name.split('/').includes('..'))throw Error('Unsafe or excessive VSIX entry');if(!name.startsWith('extension/')&&!['[Content_Types].xml','extension.vsixmanifest'].includes(name))throw Error('Unexpected VSIX root');if(((entry.externalFileAttributes>>>16)&0o170000)===0o120000)throw Error('VSIX symlinks must be materialized before packing');const target=path.resolve(root,name);if(!target.startsWith(root+path.sep))throw Error('VSIX path escapes destination');if(name.endsWith('/')){await fs.promises.mkdir(target,{recursive:true});zip.readEntry();return;}await fs.promises.mkdir(path.dirname(target),{recursive:true});const input=await new Promise((yes,no)=>zip.openReadStream(entry,(error,stream)=>error?no(error):yes(stream)));await pipeline(input,fs.createWriteStream(target,{flags:'wx',mode:(entry.externalFileAttributes>>>16)&0o777||0o644}));zip.readEntry();})().catch(fail);});zip.on('end',()=>resolve({entries:count,uncompressedBytes:size}));zip.readEntry();}));}
/** Read the identity from the actual VSIX without copying its bundled runtime. */
function readVSIXManifest(file) {
 return new Promise((resolve,reject)=>yauzl.open(file,{lazyEntries:true},(error,zip)=>{
  if(error)return reject(error);
  let manifest,count=0;
  const fail=error=>{zip.close();reject(error);};
  zip.on('error',fail);
  zip.on('entry',entry=>{
   if(++count>5000)return fail(Error('Excessive VSIX entries'));
   if(entry.fileName!=='extension/package.json'){zip.readEntry();return;}
   if(manifest||entry.uncompressedSize>1024*1024)return fail(Error('Invalid VSIX manifest'));
   zip.openReadStream(entry,(error,stream)=>{
    if(error)return fail(error);
    const chunks=[];
    stream.on('error',fail);
    stream.on('data',chunk=>chunks.push(chunk));
    stream.on('end',()=>{
     try{manifest=JSON.parse(Buffer.concat(chunks).toString('utf8'));zip.readEntry();}
     catch(error){fail(error);}
    });
   });
  });
  zip.on('end',()=>manifest?resolve(manifest):reject(Error('Missing VSIX manifest')));
  zip.readEntry();
 }));
}
module.exports={extractVSIX,readVSIXManifest};
