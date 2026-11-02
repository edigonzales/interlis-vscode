const {execFileSync}=require('node:child_process');
const path=require('node:path');const fs=require('node:fs');
execFileSync(process.execPath,[require.resolve('typescript/bin/tsc'),'--noEmit'],{stdio:'inherit'});
const bundle=require('esbuild').buildSync({entryPoints:['src/extension.ts'],outfile:'out/extension.cjs',bundle:true,platform:'node',target:'node20',format:'cjs',external:['vscode'],metafile:true});
require('esbuild').buildSync({entryPoints:['src/host/launch.ts'],outfile:'build/launch.cjs',bundle:true,platform:'node',format:'cjs'});
const packages=new Map();for(const input of Object.keys(bundle.metafile.inputs)){if(!input.startsWith('node_modules/'))continue;let dir=path.dirname(input);while(dir!=='.'&&(!fs.existsSync(path.join(dir,'package.json'))||!JSON.parse(fs.readFileSync(path.join(dir,'package.json'))).name))dir=path.dirname(dir);const p=JSON.parse(fs.readFileSync(path.join(dir,'package.json')));if(!packages.has(p.name)){const license=fs.readdirSync(dir).find(name=>/^(licen[cs]e|copying)(\.(md|txt))?$/i.test(name));if(!license)throw new Error('Missing redistribution license for '+p.name);packages.set(p.name,`${p.name}@${p.version} (${p.license})\n${fs.readFileSync(path.join(dir,license),'utf8')}`);}}
fs.mkdirSync('licenses',{recursive:true});fs.writeFileSync('licenses/bundled-node-notices.txt',[...packages.entries()].sort(([a],[b])=>a.localeCompare(b,'en')).map(([,text])=>text).join('\n\n--------------------\n\n')+'\n');

require('esbuild').buildSync({entryPoints:['src/diagram-webview.ts'],outfile:'out/diagram-webview.js',bundle:true,platform:'browser',target:'es2022',format:'esm'});
require('esbuild').buildSync({entryPoints:['src/host/diagram-assets.ts'],outfile:'build/diagram-assets.cjs',bundle:true,platform:'node',format:'cjs'});
require('esbuild').buildSync({entryPoints:['src/host/diagram-export.ts'],outfile:'build/diagram-export.cjs',bundle:true,platform:'node',format:'cjs'});
require('esbuild').buildSync({entryPoints:['src/host/diagram-state.ts'],outfile:'build/diagram-state.cjs',bundle:true,platform:'node',format:'cjs'});
