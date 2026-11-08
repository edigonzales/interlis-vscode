'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),os=require('node:os');
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const git=(root,...args)=>cp.execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
function walk(root){return fs.readdirSync(root,{withFileTypes:true}).flatMap(entry=>{const file=path.join(root,entry.name);if(entry.isSymbolicLink())throw Error('Symlink in editor bundle');return entry.isDirectory()?walk(file):[file];});}
function safeRelative(root,relative){if(!relative||path.isAbsolute(relative)||relative.includes('\\')||relative.includes(':')||relative.split('/').includes('..'))throw Error('Unsafe bundle path');const file=path.join(root,relative);if(!fs.realpathSync(file).startsWith(fs.realpathSync(root)+path.sep))throw Error('Bundle path escape');return file;}
const contractFiles = [
 'types/editor-protocol.ts',
 'types/diagram-document.ts',
 'schemas/diagram-document-1.0.schema.json',
 'schemas/diagram-options-1.0.schema.json',
 'licenses/interlis-java.txt'
];
function readAndVerifyBundle(directory,expected,{development=false}={}){
 if(!path.isAbsolute(directory)||fs.lstatSync(directory).isSymbolicLink()||!expected||!/^[a-f0-9]{40}$/.test(expected.coreCommit)||!/^[a-f0-9]{64}$/.test(expected.manifestSha256))throw Error('Explicit producer commit and manifest reference required');
 const manifestFile=path.join(directory,'manifest.json');if(hash(manifestFile)!==expected.manifestSha256)throw Error('Foreign/changed editor bundle manifest');
 const manifest=JSON.parse(fs.readFileSync(manifestFile));
 if(manifest.schemaVersion!==4||manifest.coreCommit!==expected.coreCommit||manifest.editorProtocolVersion!==1||manifest.diagramDocumentVersion!=='1.0'||typeof manifest.dirty!=='boolean'||(!development&&manifest.dirty)||typeof manifest.serverVersion!=='string'||!manifest.serverVersion||!Array.isArray(manifest.files)||!manifest.files.length)throw Error('Foreign/incompatible editor bundle');
 if(!/^[a-f0-9]{64}$/.test(manifest.editorSourceDigest||'')||!/^[a-f0-9]{40}$/.test(manifest.coreTree||''))throw Error('Missing editor producer input identity');
 if(!manifest.launch||Object.keys(manifest.launch).sort().join(',')!=='kind,mainClass,moduleName'||manifest.launch.kind!=='module'||manifest.launch.moduleName!=='guru.interlis.lsp'||manifest.launch.mainClass!=='guru.interlis.lsp.Main'||!manifest.moduleInventory||Array.isArray(manifest.moduleInventory))throw Error('Missing/incompatible modular launch');
 const modules=new Set(),serverFiles=manifest.files.filter(f=>f.path.startsWith('server/'));
 if(Object.keys(manifest.moduleInventory).length!==serverFiles.length)throw Error('Incomplete runtime module inventory');
 for(const file of serverFiles){const module=manifest.moduleInventory[file.path.slice(7)];if(!module||typeof module.explicit!=='boolean'||!/^[a-zA-Z][\w]*(?:\.[a-zA-Z][\w]*)*$/.test(module.name||'')||module.sha256!==file.sha256||modules.has(module.name)||(file.path.startsWith('server/lib/interlis-')&&!module.explicit))throw Error('Invalid/duplicate editor runtime module');modules.add(module.name);}
 if(!modules.has(manifest.launch.moduleName))throw Error('Server root module absent');
 const expectedFiles=new Set();
 for(const item of manifest.files){if(expectedFiles.has(item.path)||!/^[a-f0-9]{64}$/.test(item.sha256)||!Number.isSafeInteger(item.bytes)||item.bytes<0)throw Error('Invalid bundle inventory');expectedFiles.add(item.path);const file=safeRelative(directory,item.path);if(hash(file)!==item.sha256||fs.statSync(file).size!==item.bytes)throw Error('Changed editor bundle file: '+item.path);if(item.path.startsWith('server/')&&(!/^server\/lib\/[A-Za-z0-9_.-]+\.jar$/.test(item.path)||/(?:junit|interlis-verification|archive-tool|-tests\.jar|antlr4-\d)/.test(item.path)))throw Error('Nonproduct server artifact');}
 const actual=walk(directory).filter(p=>p!==manifestFile).map(p=>path.relative(directory,p).split(path.sep).join('/'));
 if(actual.length!==expectedFiles.size||actual.some(p=>!expectedFiles.has(p)))throw Error('Missing/extra editor bundle file');
 for(const name of contractFiles)if(!expectedFiles.has(name))throw Error('Missing Core contract file: '+name);
 if(expectedFiles.size!==serverFiles.length+contractFiles.length)throw Error('Unexpected Core contract file');
 if(!manifest.files.some(f=>/^server\/lib\/interlis-lsp-[\w.-]+\.jar$/.test(f.path)))throw Error('Missing LSP producer');
 return {directory,manifest,reference:{...expected},development};
}
function buildCoreBundle(coreDirectory,{development=false,env=process.env}={}){
 const core=fs.realpathSync(coreDirectory),coreCommit=git(core,'rev-parse','HEAD');
 if(!development&&git(core,'status','--porcelain','--untracked-files=no'))throw Error('Core tracked tree must be clean');
 const home=require('./prepare-dev.cjs').findJavaHome(env),java=path.join(home,'bin',process.platform==='win32'?'java.exe':'java'),requestId=crypto.randomUUID();
 const buildEnv={...env,JAVA_HOME:home,PATH:[path.join(home,'bin'),env.PATH||''].join(path.delimiter)};
 cp.execFileSync(java,['build/interlis/EditorBundleRun.java','--request-id',requestId],{cwd:core,env:buildEnv,stdio:'inherit',shell:false});
 const result=JSON.parse(fs.readFileSync(path.join(core,'target/jenesis-jvm/reports/editor-bundle.json')));
 if(result.schemaVersion!==1||result.requestId!==requestId||result.coreCommit!==coreCommit||!path.isAbsolute(result.directory)||!result.directory.startsWith(path.join(core,'target/jenesis-jvm/editor-bundles')+path.sep))throw Error('Stale/foreign Core bundle result');
 if(git(core,'rev-parse','HEAD')!==coreCommit)throw Error('Core commit changed while building');
 return readAndVerifyBundle(result.directory,{coreCommit,manifestSha256:result.manifestSha256},{development});
}
function importCoreBundle(bundle,{output=process.cwd(),development=false}={}){
 bundle=readAndVerifyBundle(bundle.directory,bundle.reference,{development});
 if(!path.isAbsolute(output))output=path.resolve(output);fs.mkdirSync(output,{recursive:true});
 if(fs.lstatSync(output).isSymbolicLink())throw Error('Unsafe staging output root');output=fs.realpathSync(output);
 const source=fs.realpathSync(bundle.directory),destination=path.join(output,'artifacts');
 if(output===path.parse(output).root||output===os.homedir()||output===source||output.startsWith(source+path.sep)||source===destination||source.startsWith(destination+path.sep))throw Error('Unsafe/overlapping staging output');
 if(fs.existsSync(path.join(output,'pom.xml')))throw Error('Core source root is not an extension staging output');
 const packageFile=path.join(output,'package.json');
 if(fs.existsSync(packageFile)){if(JSON.parse(fs.readFileSync(packageFile)).name!=='interlis-editor')throw Error('Foreign staging project');}
 else if(fs.readdirSync(output).some(name=>!['artifacts','release','licenses'].includes(name)))throw Error('Nonempty unowned staging output');
 for(const name of ['artifacts','release','licenses','release/editor-artifacts.lock.json','licenses/interlis-java.txt'])if(fs.lstatSync(path.join(output,name),{throwIfNoEntry:false})?.isSymbolicLink())throw Error('Symlink staging output');
 const staged=path.join(output,'.artifacts-'+crypto.randomUUID());fs.cpSync(source,staged,{recursive:true});
 readAndVerifyBundle(staged,bundle.reference,{development});readAndVerifyBundle(source,bundle.reference,{development});
 const files=bundle.manifest.files.filter(f=>f.path.startsWith('server/')).map(f=>({path:f.path.slice(7),sha256:f.sha256}));
 const lock={schemaVersion:3,launch:bundle.manifest.launch,moduleInventory:bundle.manifest.moduleInventory,coreCommit:bundle.manifest.coreCommit,protocolVersion:'lsp-3.17-baseline',editorProtocolVersion:1,diagramDocumentVersion:'1.0',mainClass:'guru.interlis.lsp.Main',serverVersion:bundle.manifest.serverVersion,files,contractFiles:bundle.manifest.files.filter(f=>!f.path.startsWith('server/')),bundleManifestSha256:bundle.reference.manifestSha256};
 fs.rmSync(destination,{recursive:true,force:true});fs.renameSync(staged,destination);
 const release=path.join(output,'release');if(fs.existsSync(release)&&fs.lstatSync(release).isSymbolicLink())throw Error('Unsafe release output');fs.mkdirSync(release,{recursive:true});
 const temporary=path.join(release,'editor-artifacts-'+crypto.randomUUID()+'.json');fs.writeFileSync(temporary,JSON.stringify(lock,null,2)+'\n');fs.renameSync(temporary,path.join(release,'editor-artifacts.lock.json'));
 const licenses=path.join(output,'licenses');if(fs.existsSync(licenses)&&fs.lstatSync(licenses).isSymbolicLink())throw Error('Unsafe license output');fs.mkdirSync(licenses,{recursive:true});fs.copyFileSync(path.join(destination,'licenses/interlis-java.txt'),path.join(licenses,'interlis-java.txt'));
 readAndVerifyBundle(destination,bundle.reference,{development});
 return {coreCommit:bundle.manifest.coreCommit,bundleManifestSha256:bundle.reference.manifestSha256,development,output};
}
function stageCore(coreDirectory,options={}){const bundle=buildCoreBundle(coreDirectory,options),result=importCoreBundle(bundle,options);return {...result,coreDirectory:fs.realpathSync(coreDirectory),trackedDirty:git(coreDirectory,'status','--porcelain','--untracked-files=no')};}
if(require.main===module){const argv=process.argv.slice(2),options={};for(let i=0;i<argv.length;i+=2){if(!['--core-dir','--bundle-dir','--core-commit','--manifest-sha256'].includes(argv[i])||!argv[i+1]||options[argv[i]])throw Error('Expected --core-dir ABSOLUTE or --bundle-dir ABSOLUTE --core-commit SHA --manifest-sha256 SHA');options[argv[i]]=argv[i+1];}if(options['--core-dir']&&Object.keys(options).length===1)stageCore(options['--core-dir']);else if(options['--bundle-dir']&&Object.keys(options).length===3){const bundle=readAndVerifyBundle(options['--bundle-dir'],{coreCommit:options['--core-commit'],manifestSha256:options['--manifest-sha256']});importCoreBundle(bundle);}else throw Error('Unknown staging arguments');}
module.exports={buildCoreBundle,readAndVerifyBundle,importCoreBundle,stageCore};
