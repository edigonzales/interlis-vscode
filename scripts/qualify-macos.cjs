const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const options={};for(let i=2;i<process.argv.length;i+=2)options[process.argv[i]]=process.argv[i+1];
for(const key of ['--core-dir','--evidence','--cache','--java-home'])if(!path.isAbsolute(options[key]||''))throw Error('Supply absolute '+key);
if(process.platform!=='darwin'||process.arch!=='arm64')throw Error('macOS arm64 qualification only');
const root=path.resolve(__dirname,'..'),core=options['--core-dir'],output=options['--evidence'],cache=options['--cache'],javaHome=options['--java-home'];fs.mkdirSync(output,{recursive:true});
const git=(dir,args)=>cp.execFileSync('git',['-C',dir,...args],{encoding:'utf8'}).trim(),hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const pair={coreSha:git(core,['rev-parse','HEAD']),extensionSha:git(root,['rev-parse','HEAD'])};
function clean(){for(const dir of [root,core])assert.equal(git(dir,['status','--porcelain','--untracked-files=no']),'','Qualification requires clean tracked sources');assert.equal(git(core,['rev-parse','HEAD']),pair.coreSha);assert.equal(git(root,['rev-parse','HEAD']),pair.extensionSha);}
clean();assert.equal(JSON.parse(fs.readFileSync(path.join(root,'release/editor-artifacts.lock.json'))).coreCommit,pair.coreSha);
const report={schemaVersion:1,phase:'V5',...pair,startedAt:new Date().toISOString(),status:'running',jobs:[],guiCases:[],platformScope:'Full macOS; short native Linux/Windows Actions smokes recorded separately; no Linux/Windows/Remote GUI claim'};
const save=()=>fs.writeFileSync(path.join(output,'result.json'),JSON.stringify(report,null,2)+'\n');save();
const env={...process.env,JAVA_HOME:javaHome,INTERLIS_JAVA:'',INTERLIS_TEST_CODE:path.join(cache,'Visual Studio Code.app/Contents/MacOS/Code')};
function job(name,cwd,exe,args,{guard=true,negative=false}={}){
 clean();const startedAt=new Date().toISOString(),log=path.join(output,name+'.log'),fd=fs.openSync(log,'w');
 const command=guard?[path.join(core,'tools/verification/without-python.cjs'),'/bin/sh','-c','cd "$1" || exit 1; shift; exec "$@"',name,cwd,exe,...args]:args;
 console.log(JSON.stringify({job:name,status:'running',...pair}));
 const result=cp.spawnSync(guard?process.execPath:exe,command,{cwd,env,stdio:['ignore',fd,fd]});fs.closeSync(fd);
 const item={name,startedAt,finishedAt:new Date().toISOString(),log,exit:result.status,signal:result.signal,negative,command:{cwd,exe,args}};report.jobs.push(item);
 if(guard){const source=path.join(core,'target/jenesis-jvm/reports/python-free/environment.json'),guardReport=JSON.parse(fs.readFileSync(source));assert.ok(Date.parse(guardReport.startedAt)>=Date.parse(startedAt)-1000,'Stale guard report');item.guard=path.join(output,name+'.guard.json');fs.copyFileSync(source,item.guard);assert.equal(guardReport.exitCode,result.status);}
 save();clean();if(result.status!==(negative?1:0))throw Error('Unexpected qualification exit: '+name+' '+result.status+'; '+log);
 if(name.startsWith('gui-')){const text=fs.readFileSync(log,'utf8'),match=[...text.matchAll(/GUI evidence: ([^\r\n]+)/g)].at(-1);assert.ok(match,'Missing GUI evidence');item.guiManifest=path.join(match[1],'manifest.json');const m=JSON.parse(fs.readFileSync(item.guiManifest));assert.equal(m.coreSha,pair.coreSha);assert.equal(m.extensionSha,pair.extensionSha);assert.equal(m.extensionShaAfter,pair.extensionSha);assert.equal(m.vsixSha256,report.vsixSha256);assert.equal(m.serverProcesses.remaining.length,0);
  if(negative){assert.equal(m.status,'failed');assert.equal(m.negativeMutation.restored,true);assert.equal(m.serverProcesses.started.length,0);assert.match(text,/GUI failed: exit 1/);}
  else{assert.equal(m.status,'passed');for(const entry of m.cases){assert.ok(!report.guiCases.some(c=>c.id===entry.id),'Duplicate GUI qualification ID');report.guiCases.push({...entry,manifest:item.guiManifest});}}
  if(!guard&&name==='gui-resilience'){const resourcePath=text.match(/GUI Resource evidence: ([^\r\n]+)/)?.[1];assert.ok(resourcePath);const resource=JSON.parse(fs.readFileSync(resourcePath));assert.equal(resource.status,'passed');item.resourceObserver=resourcePath;item.guard=path.join(output,name+'.guard.json');fs.copyFileSync(resource.guard,item.guard);}
  if(!guard&&name==='gui-distribution'){const boundary=JSON.parse(fs.readFileSync(path.join(match[1],'offline-boundary.json'))),source=path.join(path.dirname(boundary.profile),'environment.json'),actual=JSON.parse(fs.readFileSync(source));assert.equal(actual.status,'passed');assert.equal(actual.exit,0);assert.equal(actual.interpreterDenied,true);item.guard=path.join(output,name+'.guard.json');fs.copyFileSync(source,item.guard);}
  save();
 }
 console.log(JSON.stringify({job:name,status:negative?'expected failure':'passed',exit:result.status}));
}
try{
 if(options['--vsix']){
  const supplied=path.resolve(options['--vsix']),standard=path.join(root,'build/packages/interlis-editor-darwin-arm64.vsix');
  if(supplied!==standard)fs.copyFileSync(supplied,standard);
  const smoke=JSON.parse(fs.readFileSync(path.join(root,'build/ci/smoke-darwin-arm64-selected/result.json')));
  assert.equal(smoke.status,'passed');assert.equal(smoke.vsixSha256,hash(standard));
  env.INTERLIS_TEST_EXTENSION_ROOT=smoke.extensionRoot;
 }else job('package',root,process.execPath,['scripts/package.cjs','--target','darwin-arm64']);
 const vsix=path.join(root,'build/packages/interlis-editor-darwin-arm64.vsix');report.vsixSha256=hash(vsix);report.vsix=path.join(output,'interlis-editor-darwin-arm64-'+report.vsixSha256+'.vsix');fs.copyFileSync(vsix,report.vsix);save();
 job('extension-unit-and-stdio',root,process.execPath,['--test',...fs.readdirSync(path.join(root,'test/unit')).filter(n=>n.endsWith('.test.cjs')).map(n=>'test/unit/'+n),'test/protocol.test.cjs']);
 job('dependencies',root,process.execPath,['scripts/verify-dependencies.cjs']);
 job('protocol-negative-fixture',root,process.execPath,['scripts/prepare-test-fixtures.cjs','--java-home',javaHome]);
 job('extension-host',root,process.execPath,['scripts/extension-host.cjs']);
 const classes=['EditorAssistanceTest','EditorCompletionTest','EditorTemplateContractTest','EditorPartialStateContractTest','QueryOwnershipTest','SnapshotOwnershipTest','P3CompletionScopeContractTest','RenameSafetyTest','FormatterContractTest','P3FormatterPolicyContractTest','LexicalRecoveryContractTest','VersionScopeTest','SyntaxContractTest','AssociationRulesContractTest','TopicDependencyContractTest','UnitTypeContractTest','ViewContractTest','DomainRestrictionContractTest'];
 const modules = ['interlis-compiler','interlis-documentation','interlis-lsp','interlis-wasm-bridge','interlis-projection','interlis-compiler-cli'];
 report.javaModules = {};
 for (const module of modules) {
  const selection = module === 'interlis-compiler' ? 'guru.interlis.compiler.(' + classes.join('|') + ')' : module === 'interlis-compiler-cli' ? 'guru.interlis.cli.CliApplicationTest#diagramExportUsesCheckedSchema' : null;
  job('java-' + module, core, path.join(javaHome,'bin/java'), ['build/InterlisJvmBuild.java','build','--module',module,...(selection?['--tests',selection]:[])]);
  const index=fs.readFileSync(path.join(core,'target/jenesis-jvm/reports/engine-results.properties'),'utf8');
  const evidence=index.match(/^evidence\.normal=(.+)$/m)?.[1];assert.ok(evidence,'Missing explicit normal evidence binding');
  const dir=path.join(core,evidence,module,'native'),destination=path.join(output,'java-results',module);fs.mkdirSync(destination,{recursive:true});let tests=0;
  for(const file of fs.readdirSync(dir).filter(n=>n.endsWith('.xml'))){const text=fs.readFileSync(path.join(dir,file),'utf8');const suite=text.match(/<testsuite\b[^>]*>/)?.[0];assert.ok(suite,'No JUnit suite');tests+=Number(suite.match(/\btests="(\d+)"/)[1]);assert.ok(!/\b(?:failures|errors|skipped)="[1-9]/.test(suite),'Failed or skipped JUnit cases');fs.copyFileSync(path.join(dir,file),path.join(destination,file));}assert.ok(tests>0);report.javaModules[module]=tests;
 }save();
 const diagramUi=path.join(core,'frontend/diagram-ui');
 job('shared-diagram-ui-build',diagramUi,process.execPath,['build.cjs']);
 // Each browser test starts Chromium. Avoid competing render loops on the
 // hosted macOS runner while preserving every Core browser assertion.
 job('shared-diagram-ui',diagramUi,process.execPath,['--test','--test-concurrency=1',...fs.readdirSync(path.join(diagramUi,'test')).filter(n=>n.endsWith('.test.cjs')).sort().map(n=>'test/'+n)]);
 for(const suite of ['comfort','authoring'])job('gui-'+suite,root,process.execPath,['scripts/gui.cjs','--suite',suite,'--vsix',report.vsix,'--cache',cache]);
 job('gui-resilience',root,process.execPath,['scripts/gui-resilience-run.cjs','--core-dir',core,'--cache',cache,'--java-home',javaHome,'--vsix',report.vsix],{guard:false});
 // This runner supplies the single combined inherited offline/interpreter sandbox.
 // Its GUI uses the default package path, which must still be byte-identical.
 assert.equal(hash(vsix),report.vsixSha256);
 job('gui-distribution',root,process.execPath,['scripts/gui-offline-run.cjs',cache,core],{guard:false});
 job('gui-missing-server-negative',root,process.execPath,['scripts/gui.cjs','--suite','smoke','--vsix',report.vsix,'--cache',cache,'--canary','missing-server'],{negative:true});
 assert.deepEqual(report.guiCases.map(c=>c.id).sort(),Array.from({length:42},(_,i)=>'GUI-'+String(i+1).padStart(2,'0')));
 report.status='passed';
}catch(error){report.status='failed';report.error=error.stack;process.exitCode=1;console.error(error);}
finally{report.finishedAt=new Date().toISOString();save();console.log(JSON.stringify({result:path.join(output,'result.json'),status:report.status,guiCases:report.guiCases.length}));}
