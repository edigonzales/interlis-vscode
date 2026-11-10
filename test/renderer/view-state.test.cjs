const {test}=require('node:test'),assert=require('node:assert/strict');
const {defaultFilters,DiagramFilterController,visibleDocument,importDepths,saveViewState,restoreViewState,validateSavedViewState,defaultDiagramSettings}=require('../../build/diagram/adapter.cjs');
// Real Java-engine-produced DTO from the existing renderer contract fixture.
const original=require('./fixtures/interactive.json');
test('filter None is explained by an empty graph; show/hide never mutates authoritative data',()=>{
 const before=JSON.stringify(original),controller=new DiagramFilterController();
 controller.set('kinds.CLASS',false);const filtered=controller.visible(original),ids=new Set([...filtered.nodes,...filtered.containers].map(n=>n.id));
 assert.ok(!filtered.nodes.some(n=>n.kind==='CLASS'));for(const edge of filtered.edges){assert.ok(ids.has(edge.source.elementId));assert.ok(ids.has(edge.target.elementId));}
 controller.setAll(false);assert.equal(controller.visible(original).nodes.length,0);assert.equal(controller.visible(original).edges.length,0);assert.equal(controller.visible(original).containers.length,0);
 controller.reset();
 const reset=controller.visible(original);
 assert.deepEqual(reset.nodes,original.nodes);
 assert.deepEqual(reset.edges,original.edges.filter(e=>e.kind!=='DOMAIN_USE'&&e.kind!=='STRUCTURE_COMPOSITION'));
 assert.equal(JSON.stringify(original),before);
});
test('relationship defaults prune unused external types and keep their attribute labels',()=>{
 const controller=new DiagramFilterController();
 const kinds=['DOMAIN_USE','STRUCTURE_COMPOSITION'];
 assert.deepEqual(Object.entries(controller.filters.edges).filter(([,enabled])=>!enabled).map(([kind])=>kind).sort(),kinds);
 const document=structuredClone(original);
 const owner=document.nodes.find(n=>n.label==='A');
 const external={...document.containers[0],id:'external',label:'External',canonicalName:'External',symbol:null,anchor:null};
 document.containers.push(external);
 const stubs=kinds.map(kind=>{
  const edge=document.edges.find(e=>e.kind===kind&&e.source.elementId===owner.id);
  const node=document.nodes.find(n=>n.id===edge.target.elementId);
  Object.assign(node,{kind:'EXTERNAL_REFERENCE',containerId:external.id,compartments:[]});
  return node;
 });
 const before=structuredClone(document);
 const edgeIds=view=>view.edges.map(e=>e.id);
 const defaults=controller.visible(document);
 assert.deepEqual(edgeIds(defaults),document.edges.filter(e=>!kinds.includes(e.kind)).map(e=>e.id));
 assert.deepEqual(defaults.nodes.map(n=>n.id),document.nodes.filter(n=>!stubs.includes(n)).map(n=>n.id));
 assert.ok(!defaults.containers.some(c=>c.id===external.id));
 assert.deepEqual(defaults.nodes.find(n=>n.id===owner.id).compartments,owner.compartments);
 for(const [i,kind] of kinds.entries()){
  controller.set('edges.'+kind,true);
  const visible=controller.visible(document);
  assert.deepEqual(edgeIds(visible),document.edges.filter(e=>!kinds.includes(e.kind)||e.kind===kind).map(e=>e.id));
  assert.deepEqual(visible.nodes.filter(n=>n.kind==='EXTERNAL_REFERENCE').map(n=>n.id),[stubs[i].id]);
  controller.set('edges.'+kind,false);
 }
 controller.setAll(true);
 assert.deepEqual(controller.visible(document),document);
 controller.reset();
 assert.deepEqual(controller.visible(document),defaults);
 assert.deepEqual(document,before);

 const state=document.nodes.find(n=>n.label==='State');
 const inheritance=document.edges.find(e=>e.kind==='INHERITANCE');
 const dependency={...inheritance,id:'state-inheritance',source:{elementId:state.id,memberId:null},target:{elementId:stubs[0].id,memberId:null}};
 const connected=controller.visible({...document,edges:[...document.edges,dependency]});
 assert.ok(connected.edges.some(e=>e.id===dependency.id));
 assert.deepEqual(connected.nodes.filter(n=>n.kind==='EXTERNAL_REFERENCE').map(n=>n.id),[stubs[0].id]);
 assert.ok(connected.containers.some(c=>c.id===external.id));
});
test('import depth follows explicit MODEL_IMPORT endpoints rather than model labels',()=>{
 const root=original.containers.find(c=>c.kind==='MODEL'),classes=original.nodes.filter(n=>n.kind==='CLASS');assert.ok(classes.length>=3);
 const direct={...root,id:'import-direct',canonicalName:'MisleadingIndirect',symbol:{...root.symbol,symbol:'direct-symbol'}},indirect={...root,id:'import-indirect',canonicalName:'MisleadingDirect',symbol:{...root.symbol,symbol:'indirect-symbol'}};
 const edge=(id,a,b)=>({...original.edges[0],id,kind:'MODEL_IMPORT',source:{elementId:a,memberId:null},target:{elementId:b,memberId:null}});
 // A structural DTO counterfixture, not a substitute compiler or semantic query.
 const document={...original,selection:[root.symbol],containers:[root,direct,indirect],nodes:classes.slice(0,3).map((n,i)=>({...n,containerId:[root.id,direct.id,indirect.id][i]})),edges:[edge('direct-edge',root.id,direct.id),edge('indirect-edge',direct.id,indirect.id)]};
 assert.equal(importDepths(document).get(direct.id),1);assert.equal(importDepths(document).get(indirect.id),2);
 const flags=defaultFilters();flags.directImports=false;const graph=visibleDocument(document,flags);assert.ok(!graph.nodes.some(n=>n.containerId===direct.id));assert.ok(graph.nodes.some(n=>n.containerId===indirect.id));
 flags.directImports=true;flags.indirectImports=false;assert.ok(!visibleDocument(document,flags).nodes.some(n=>n.containerId===indirect.id));
});
test('saved geometry uses bounded hashed identities and restores only exact current keys',async()=>{
 const node=original.nodes.find(n=>n.anchor),edge=original.edges.find(e=>e.anchor&&original.nodes.some(n=>n.id===e.source.elementId)&&original.nodes.some(n=>n.id===e.target.elementId));assert.ok(node&&edge);
 const previousFilters=defaultFilters();
 previousFilters.edges.DOMAIN_USE=true;previousFilters.edges.STRUCTURE_COMPOSITION=true;
 const saved=await saveViewState(original,{geometry:{positions:{[node.id]:{x:123,y:456}},routes:{[edge.id]:[{x:20,y:30},{x:60,y:70}]}},pins:new Set([node.id]),manualNodes:new Set([node.id]),manualRoutes:new Set([edge.id]),hiddenNodes:new Set([node.id]),filters:previousFilters,settings:defaultDiagramSettings,viewport:{zoom:1.5,x:23,y:45}});
 const json=JSON.stringify(saved);assert.ok(!json.includes(node.canonicalName));for(const source of Object.keys(original.sourceRevisions))assert.ok(!json.includes(source));assert.ok(Object.keys(saved.positions).every(k=>/^[a-f0-9]{64}$/.test(k)));
 const restored=await restoreViewState(original,JSON.parse(json));assert.deepEqual(restored.geometry.positions[node.id],{x:123,y:456});assert.ok(restored.pins.has(node.id));assert.ok(restored.hiddenNodes.has(node.id));assert.equal(restored.viewport.zoom,1.5);assert.deepEqual(restored.filters,previousFilters);
 const changed={...original,nodes:original.nodes.map(n=>n.id===node.id?{...n,canonicalName:n.canonicalName+'Renamed'}:n)};assert.equal((await restoreViewState(changed,saved)).geometry.positions[node.id],undefined);
 for(const mutate of [s=>s.sourceText='forbidden',s=>s.viewport.zoom=Infinity,s=>s.positions[Object.keys(s.positions)[0]].x=NaN,s=>s.hiddenNodes.push('unknown'),s=>s.settings.edgeRouting='pretendSpline',s=>s.positions=JSON.parse('{"__proto__":{"x":1,"y":2}}')]){const bad=structuredClone(saved);mutate(bad);assert.throws(()=>validateSavedViewState(bad));}
});
