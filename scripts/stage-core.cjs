const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
function stageCore(coreDirectory,{output=process.cwd(),development=false,env=process.env}={}){
const core=fs.realpathSync(coreDirectory),git=(...argv)=>cp.execFileSync('git',argv,{cwd:core,encoding:'utf8'}).trim(),sha=git('rev-parse','HEAD');
const dirty=git('status','--porcelain','--untracked-files=no');if(!development&&dirty)throw Error('Core tracked tree must be clean');
cp.execFileSync(path.join(core,process.platform==='win32'?'gradlew.bat':'gradlew'),['editorBundle','--no-daemon',...(env.INTERLIS_NODE?['-PnodeExecutable='+env.INTERLIS_NODE]:[])],{cwd:core,env,stdio:'inherit',shell:process.platform==='win32'});
const bundle=path.join(core,'build/editor-bundle'),manifest=JSON.parse(fs.readFileSync(path.join(bundle,'manifest.json')));
if(manifest.coreCommit!==sha||manifest.editorProtocolVersion!==1)throw Error('Foreign editor bundle');
for(const file of manifest.files){if(file.path.includes('..')||path.isAbsolute(file.path)||crypto.createHash('sha256').update(fs.readFileSync(path.join(bundle,file.path))).digest('hex')!==file.sha256)throw Error('Invalid editor bundle: '+file.path);}
fs.rmSync(path.join(output,'artifacts'),{recursive:true,force:true});fs.cpSync(bundle,path.join(output,'artifacts'),{recursive:true});
const files=manifest.files.filter(f=>f.path.startsWith('server/')).map(f=>({path:f.path.slice(7),sha256:f.sha256}));
const rendererFiles=manifest.files.filter(f=>!f.path.startsWith('server/'));
fs.mkdirSync(path.join(output,'release'),{recursive:true});fs.writeFileSync(path.join(output,'release/editor-artifacts.lock.json'),JSON.stringify({schemaVersion:1,coreCommit:sha,protocolVersion:'lsp-3.17-baseline',editorProtocolVersion:1,diagramDocumentVersion:'1.0',mainClass:'guru.interlis.lsp.Main',serverVersion:'0.2.0-SNAPSHOT',files,rendererFiles},null,2)+'\n');
fs.mkdirSync(path.join(output,'licenses'),{recursive:true});fs.copyFileSync(path.join(core,'LICENSE'),path.join(output,'licenses/interlis-java.txt'));
if(git('rev-parse','HEAD')!==sha||(!development&&git('status','--porcelain','--untracked-files=no')))throw Error('Core changed while staging');
console.log('Staged server and neutral renderer from '+sha);
return {coreDirectory:core,coreCommit:sha,trackedDirty:dirty,development};
}
if(require.main===module){const args=process.argv.slice(2);if(args.length!==2||args[0]!=='--core-dir'||!path.isAbsolute(args[1]))throw Error('Usage: stage:core -- --core-dir <absolute checkout>');stageCore(args[1]);}
module.exports={stageCore};
