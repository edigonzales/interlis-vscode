const {test}=require('node:test'),assert=require('node:assert/strict');const {DiagramStateStore}=require('../../build/diagram-state.cjs');const adapter=require('../../build/diagram/adapter.cjs');
function fixture(){return {version:1,positions:{},routes:{},pins:[],manualNodes:[],manualRoutes:[],hiddenNodes:[],filters:adapter.defaultFilters(),settings:adapter.defaultDiagramSettings,viewport:{zoom:1,x:0,y:0}};}
test('workspace/root/panel identities stay isolated and storage evicts within bounds',async()=>{const data=new Map(),memento={get:(key,fallback)=>data.get(key)??fallback,update:async(key,value)=>{data.set(key,value);}};const store=new DiagramStateStore(memento);const key=store.key(['file:/a'],'file:/model','panelA'),other=store.key(['file:/a'],'file:/model','panelB');assert.notEqual(key,other);assert.notEqual(key,store.key(['file:/b'],'file:/model','panelA'));assert.notEqual(key,store.key(['file:/a'],'file:/other','panelA'));const saved=fixture();await store.write([key],saved);assert.equal(store.read(key).viewport.zoom,1);assert.equal(store.read(other),undefined);await assert.rejects(store.write([key],{...saved,sourceText:'secret'}));assert.equal(store.read(key).viewport.zoom,1);for(let i=0;i<20;i++)await store.write([store.key([],'model',String(i))],saved);assert.ok(data.get('interlisGuru.diagram.views').length<=16);assert.equal(store.read(key),undefined);assert.ok(!JSON.stringify(data.get('interlisGuru.diagram.views')).includes('file:/'));});

test('persisted association presentation is panel-local and older views remain readable',async()=>{
 const values=new Map();
 const store=new DiagramStateStore({get:(key,fallback)=>values.get(key)??fallback,update:async(key,value)=>values.set(key,value)});
 const a=store.key([],'model','a'),b=store.key([],'model','b');
 await store.write([a],fixture(),'COMPACT_BINARY');
 await store.write([b],fixture());
 assert.equal(store.read(a).association,'COMPACT_BINARY');
 assert.equal(store.read(b).association,undefined);
 assert.equal(store.read(b).settings.attributeMode,adapter.defaultDiagramSettings.attributeMode);
});
