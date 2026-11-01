const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const args=process.argv.slice(2);
if(args.length!==2||args[0]!=='--core-dir'||!path.isAbsolute(args[1]))throw Error('Usage: stage:core -- --core-dir <absolute checkout>');
const core=fs.realpathSync(args[1]),git=(...argv)=>cp.execFileSync('git',argv,{cwd:core,encoding:'utf8'}).trim(),sha=git('rev-parse','HEAD');
if(git('status','--porcelain','--untracked-files=no'))throw Error('Core tracked tree must be clean');
cp.execFileSync(path.join(core,'gradlew'),['editorBundle','--no-daemon',...(process.env.INTERLIS_NODE?['-PnodeExecutable='+process.env.INTERLIS_NODE]:[])],{cwd:core,stdio:'inherit'});
const bundle=path.join(core,'build/editor-bundle'),manifest=JSON.parse(fs.readFileSync(path.join(bundle,'manifest.json')));
if(manifest.coreCommit!==sha||manifest.editorProtocolVersion!==1)throw Error('Foreign editor bundle');
for(const file of manifest.files){if(file.path.includes('..')||path.isAbsolute(file.path)||crypto.createHash('sha256').update(fs.readFileSync(path.join(bundle,file.path))).digest('hex')!==file.sha256)throw Error('Invalid editor bundle: '+file.path);}
fs.rmSync('artifacts',{recursive:true,force:true});fs.cpSync(bundle,'artifacts',{recursive:true});
const files=manifest.files.filter(f=>f.path.startsWith('server/')).map(f=>({path:f.path.slice(7),sha256:f.sha256}));
const rendererFiles=manifest.files.filter(f=>!f.path.startsWith('server/'));
fs.mkdirSync('release',{recursive:true});fs.writeFileSync('release/editor-artifacts.lock.json',JSON.stringify({schemaVersion:1,coreCommit:sha,protocolVersion:'lsp-3.17-baseline',editorProtocolVersion:1,diagramDocumentVersion:'1.0',mainClass:'guru.interlis.lsp.Main',serverVersion:'0.2.0-SNAPSHOT',files,rendererFiles},null,2)+'\n');
fs.copyFileSync(path.join(core,'LICENSE'),'licenses/interlis-java.txt');
if(git('rev-parse','HEAD')!==sha||git('status','--porcelain','--untracked-files=no'))throw Error('Core changed while staging');
console.log('Staged server and neutral renderer from '+sha);
