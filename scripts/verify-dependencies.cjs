const fs=require('node:fs');const cp=require('node:child_process');const assert=require('node:assert/strict');
const lock=JSON.parse(fs.readFileSync('package-lock.json'));
for(const [name,p] of Object.entries(lock.packages)) {
 assert.ok(!name.includes('@ilic/') && !name.includes('interlis-language-tools'),`Forbidden package ${name}`);
 assert.ok(!p.link,`Linked package ${name}`);
 if(p.resolved) assert.match(p.resolved,/^https:\/\/registry\.npmjs\.org\//,`Unexpected dependency source ${name}`);
}
const tree=cp.execFileSync('npm',['ls','--all','--json'],{encoding:'utf8',maxBuffer:20e6});
assert.doesNotMatch(tree,/@ilic\/|interlis-language-tools/);
for(const file of ['out/extension.cjs']) assert.doesNotMatch(fs.readFileSync(file,'utf8'),/@ilic\/|interlis-language-tools|ilic\.wasm/);
console.log('Dependency lock, installed full graph and product bundle checked');
