const fs=require('node:fs');const path=require('node:path');const os=require('node:os');const cp=require('node:child_process');
(async()=>{
 if(!process.env.INTERLIS_TEST_CODE)throw new Error('Set INTERLIS_TEST_CODE (isolated downloaded VSCode executable)');
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'ili-host-'));const user=path.join(temporary,'user');fs.mkdirSync(path.join(user,'User'),{recursive:true});
 fs.writeFileSync(path.join(user,'User/settings.json'),JSON.stringify({'interlisGuru.server.javaPath':process.env.INTERLIS_JAVA||'','security.workspace.trust.enabled':false,'telemetry.telemetryLevel':'off','update.mode':'none','extensions.autoUpdate':false}));
 const fixture=path.join(temporary,'Example.ili');fs.copyFileSync('test/fixtures/editor-basic/Example.ili',fixture);
 await require('@vscode/test-electron').runTests({vscodeExecutablePath:process.env.INTERLIS_TEST_CODE,extensionDevelopmentPath:process.cwd(),extensionTestsPath:path.resolve('test/extension-host/index.cjs'),extensionTestsEnv:{INTERLIS_HOST_FIXTURE:fixture},launchArgs:['--shared-data-dir',path.join(temporary,'shared'),'--user-data-dir',user,'--extensions-dir',path.join(temporary,'extensions'),'--skip-welcome','--skip-release-notes','--disable-updates',temporary]});
})().catch(error=>{console.error(error);process.exitCode=1});
