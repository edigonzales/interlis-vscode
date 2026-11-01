const fs=require('node:fs');const path=require('node:path');const os=require('node:os');const cp=require('node:child_process');const crypto=require('node:crypto');const {ExTester,ReleaseQuality}=require('vscode-extension-tester');
const args=process.argv.slice(2);const options={};for(let i=0;i<args.length;i+=2){if(!['--suite','--vsix','--cache','--canary'].includes(args[i])||!args[i+1])throw new Error('Usage: test:gui -- --suite smoke [--vsix path] [--cache path] [--canary missing-status]');options[args[i]]=args[i+1];}
if(options['--suite']!=='smoke'||(options['--canary']&&options['--canary']!=='missing-status'))throw new Error('Unsupported GUI suite or canary');
if(!process.env.INTERLIS_JAVA)throw new Error('INTERLIS_JAVA must explicitly designate Java25');
const sha=()=>cp.execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
(async()=>{
 const run=path.resolve('build/reports/gui/smoke',new Date().toISOString().replace(/[:.]/g,'-'));fs.mkdirSync(run,{recursive:true});
 const storage=fs.mkdtempSync(path.join(os.tmpdir(),'ili-gui-'));const extensions=path.join(storage,'extensions');const workspace=path.join(run,'Unicode Modelle');fs.mkdirSync(workspace);fs.copyFileSync('test/fixtures/editor-basic/Example.ili',path.join(workspace,'Example.ili'));
 const vsix=path.resolve(options['--vsix']||'build/packages/interlis-vscode-darwin-arm64.vsix');const lock=JSON.parse(fs.readFileSync('release/editor-artifacts.lock.json'));
 const manifest={coreSha:lock.coreCommit,extensionSha:sha(),dirty:cp.execFileSync('git',['status','--porcelain'],{encoding:'utf8'}),vsix,vsixSha256:hash(vsix),serverFiles:lock.files,fixtureSha256:hash(path.join(workspace,'Example.ili')),os:os.release(),arch:process.arch,vscode:'1.140.0',extester:'8.28.1',startedAt:new Date().toISOString(),cases:[],status:'running',storage,canary:options['--canary']||null};
 const manifestPath=path.join(run,'manifest.json');fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2));
 const settings=path.join(run,'settings.json');fs.writeFileSync(settings,JSON.stringify({'interlisGuru.server.javaPath':process.env.INTERLIS_JAVA,'editor.formatOnPaste':false,'editor.scrollBeyondLastLine':false,'editor.stickyScroll.enabled':false,'git.openRepositoryInParentFolders':'never','editor.autoIndent':'none','editor.autoClosingBrackets':'never','editor.autoClosingQuotes':'never','editor.quickSuggestions':false,'files.simpleDialog.enable':true}));
 process.env.INTERLIS_GUI_EVIDENCE=run;process.env.INTERLIS_GUI_CANARY=options['--canary']||'';
 if(options['--cache']){for(const name of fs.readdirSync(options['--cache']))if(/\.zip$/.test(name))fs.copyFileSync(path.join(options['--cache'],name),path.join(storage,name),fs.constants.COPYFILE_FICLONE);}
 const tester=new ExTester(storage,ReleaseQuality.Stable,extensions);
 try{await tester.downloadCode('1.140.0');await tester.downloadChromeDriver('1.140.0');await tester.installVsix({vsixFile:vsix});
 const installed=fs.readdirSync(extensions).filter(name=>name.startsWith('edigonzales.interlis-vscode-'));if(installed.length!==1)throw new Error('Wrong installed extension identity');
 const installedRoot=path.join(extensions,installed[0]);const installedPackage=JSON.parse(fs.readFileSync(path.join(installedRoot,'package.json')));if(installedPackage.publisher+'.'+installedPackage.name!=='edigonzales.interlis-vscode'||installedPackage.version!=='0.0.1')throw new Error('Wrong installed manifest');
 for(const file of lock.files)if(hash(path.join(installedRoot,'artifacts/server',file.path))!==file.sha256)throw new Error('Installed server hash mismatch');
 manifest.installed={id:installedPackage.publisher+'.'+installedPackage.name,version:installedPackage.version,path:installedRoot,bundleSha256:hash(path.join(installedRoot,'out/extension.cjs'))};if(manifest.installed.bundleSha256!==hash('out/extension.cjs'))throw new Error('VSIX client bundle differs from current build');
 const exit=await tester.runTests(path.resolve('test/gui/smoke.cjs'),{vscodeVersion:'1.140.0',resources:[workspace],settings,cleanup:false});
 function walk(folder){return fs.existsSync(folder)?fs.readdirSync(folder,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?walk(path.join(folder,entry.name)):[path.join(folder,entry.name)]):[];}
 const serverLogs=walk(path.join(storage,'settings/logs')).filter(p=>p.endsWith('INTERLIS Language Server.log')).map(p=>fs.readFileSync(p,'utf8')).join('\n');
 const pids=[...new Set([...serverLogs.matchAll(/Server start pid=(\d+)/g)].map(match=>Number(match[1])))];
 const deadline=Date.now()+10000;let remaining=pids;
 while(remaining.length&&Date.now()<deadline){remaining=remaining.filter(pid=>{try{process.kill(pid,0);return true;}catch(error){if(error.code==='ESRCH')return false;throw error;}});if(remaining.length)await new Promise(resolve=>setTimeout(resolve,100));}
 manifest.serverProcesses={started:pids,remaining};if(remaining.length)throw new Error('Own Java processes remain: '+remaining.join(','));if(!options['--canary']&&pids.length!==2)throw new Error('Expected exactly two real Java starts for smoke/restart');
 manifest.cases=fs.existsSync(path.join(run,'cases.json'))?JSON.parse(fs.readFileSync(path.join(run,'cases.json'))):[];
 if(exit!==0||manifest.cases.length!==3)throw new Error(`GUI failed: exit ${exit}, ${manifest.cases.length}/3 cases`);manifest.status='passed';manifest.exit=0;
 }catch(error){manifest.status='failed';manifest.error=String(error);manifest.exit=1;process.exitCode=1;console.error(error);}finally{for(const [source,target] of [[path.join(storage,'settings/logs'),'workbench-logs'],[path.join(storage,'chromedriver.log'),'chromedriver.log']])if(fs.existsSync(source))fs.cpSync(source,path.join(run,target),{recursive:true});manifest.finishedAt=new Date().toISOString();manifest.extensionShaAfter=sha();fs.writeFileSync(manifestPath,JSON.stringify(manifest,null,2));console.log(`GUI evidence: ${run}`);}
})().catch(error=>{console.error(error);process.exitCode=1});
