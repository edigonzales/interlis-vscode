const assert=require('node:assert/strict');const path=require('node:path');const vscode=require('vscode');
exports.run=async()=>{
 const extension=vscode.extensions.getExtension('edigonzales.interlis-vscode');assert.ok(extension);await extension.activate();assert.equal(extension.isActive,true);assert.equal(extension.packageJSON.version,'0.0.1');
 const commands=await vscode.commands.getCommands();for(const name of ['restartServer','stopServer','newFromTemplate'])assert.ok(commands.includes('interlisGuru.'+name));
 const uri=vscode.Uri.file(path.resolve(process.env.INTERLIS_HOST_FIXTURE));const doc=await vscode.workspace.openTextDocument(uri);await vscode.window.showTextDocument(doc);
 const wait=async(fn,message)=>{const until=Date.now()+15000;while(Date.now()<until){const value=await fn();if(value)return value;await new Promise(resolve=>setTimeout(resolve,100));}throw new Error(message);};
 const defs=await wait(async()=>{const result=await vscode.commands.executeCommand('vscode.executeDefinitionProvider',uri,new vscode.Position(7,17));return result?.length?result:null;},'No real definition result');assert.equal((defs[0].range||defs[0].targetRange).start.line,4);
 await vscode.commands.executeCommand('interlisGuru.newFromTemplate');const template=vscode.window.activeTextEditor.document;assert.equal(template.isUntitled,true);assert.equal(template.languageId,'interlis');assert.match(template.getText(),/MODEL Example/);
 await vscode.commands.executeCommand('interlisGuru.stopServer');console.log('3 extension-host checks: activation/commands, real definition, unsaved template; stopped server');
};
