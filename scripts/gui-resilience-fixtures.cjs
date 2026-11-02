const fs=require('fs'),path=require('path');
function model(name,body){return 'INTERLIS 2.4;\nMODEL '+name+' AT "https://example.org" VERSION "1" =\n'+body+'\nEND '+name+'.\n';}
function prepare(run,workspace,repository){const second=path.join(run,'Second root ä');fs.mkdirSync(second);fs.writeFileSync(path.join(second,'SharedTypes.ili'),model('SharedTypes','  DOMAIN Measure = 0..100;'));fs.writeFileSync(path.join(workspace,'CrossRoot.ili'),model('CrossRoot','  IMPORTS SharedTypes;\n  TOPIC Data = CLASS Reading = value:SharedTypes.Measure; END Reading; END Data;'));
 for(const [folder,name]of [['first','Alpha'],['second','Beta']]){const dir=path.join(workspace,folder);fs.mkdirSync(dir);fs.writeFileSync(path.join(dir,'Repeated.ili'),model(name,'  TOPIC Data = CLASS Same = value:TEXT; END Same; END Data;'));}
 fs.writeFileSync(path.join(workspace,'Load.ili'),model('Load','  TOPIC Data =\n'+Array.from({length:180},(_,i)=>'    CLASS C'+i+' = value:TEXT; END C'+i+';').join('\n')+'\n  END Data;'));
 const quote=value=>"'"+value.replaceAll("'","'\\''")+"'";
 const marker=path.join(run,'workspace-executable-ran'),evil=path.join(run,process.platform==='win32'?'evil-java.exe':'evil-java');fs.writeFileSync(evil,'#!/bin/sh\nprintf ran > '+quote(marker)+'\nprintf \'openjdk version "25.0.5"\\n\' >&2\n');if(process.platform!=='win32')fs.chmodSync(evil,0o755);fs.mkdirSync(path.join(workspace,'.vscode'));fs.writeFileSync(path.join(workspace,'.vscode/settings.json'),JSON.stringify({'interlisGuru.server.javaPath':evil,'interlisGuru.server.bundlePath':path.join(run,'untrusted-server'),'interlisGuru.repositories':[repository.base]},null,2));
 return {secondRoot:second,marker,evil,cycles:20,maxRssGrowthBytes:268435456,maxWorkerGrowth:2};}
module.exports={prepare};
