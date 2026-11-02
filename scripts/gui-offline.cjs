const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const quote=value=>"'"+value.replaceAll("'","'\\''")+"'";
/** Seal only the downloaded test Electron and its descendants, after tool acquisition. */
function seal(binary,run,storage){
 if(process.platform!=='darwin')throw Error('The offline GUI profile is macOS-specific');
 const empty=path.join(storage,'empty-path');fs.mkdirSync(empty);
 if(!process.env.INTERLIS_OFFLINE_BOUNDARY)throw Error('Use scripts/gui-offline-run.cjs: macOS cannot nest sandbox profiles');
 const result={...JSON.parse(fs.readFileSync(process.env.INTERLIS_OFFLINE_BOUNDARY)),PATH:empty};
 fs.writeFileSync(path.join(run,'offline-boundary.json'),JSON.stringify(result,null,2));
 if(result.allowed.exit!==0||result.sourceDenied.exit===0||result.externalNetworkDenied.exit===0||!result.interpreterDenied)throw Error('Offline/source isolation preflight did not enforce the boundary');
 const wrapper=path.join(storage,'sealed-code');
 fs.writeFileSync(wrapper,'#!/bin/sh\ncd '+quote(storage)+' || exit 1\nexport PATH='+quote(empty)+'\nexport VSCODE_CLI=1\nexec '+quote(binary)+' "$@"\n',{mode:0o755});
 process.env.INTERLIS_GUI_CODE_WRAPPER=wrapper;
 return result;
}
module.exports={seal};
