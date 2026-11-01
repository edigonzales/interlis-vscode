const fs=require('node:fs');const cp=require('node:child_process');const path=require('node:path');
const args=process.argv.slice(2);
if(args.length!==2 || args[0]!=='--target' || args[1]!=='darwin-arm64') throw new Error('Initial verified development target: --target darwin-arm64');
(async()=>{cp.execFileSync(process.execPath,[path.resolve('scripts/build.cjs')],{stdio:'inherit'});const {resolveLaunchPlan}=require('../build/launch.cjs');await resolveLaunchPlan(process.cwd(),process.env.INTERLIS_JAVA||'');fs.mkdirSync('build/packages',{recursive:true});await require('@vscode/vsce').createVSIX({packagePath:'build/packages/interlis-vscode-darwin-arm64.vsix',target:args[1],dependencies:false});})().catch(error=>{console.error(error);process.exitCode=1});
