const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../..'),out=path.join(root,'build/comfort-test');
const html=`<!doctype html><html><head><link rel="stylesheet" href="/out/diagram/diagram-ui.css"><style>body{margin:0}#controls{height:190px;overflow:auto}#canvas{width:1300px;height:750px}</style></head><body><div id="status"></div><div id="controls"></div><div id="canvas" class="interlis-canvas"></div><script type="module">import {DiagramCanvas,mountDiagramControls,ElkLayoutService} from '/out/diagram/diagram-ui.js';window.layoutCount=0;const worker=new ElkLayoutService('/out/diagram/diagram-layout-worker.js'),layout=worker.layout.bind(worker);worker.layout=(...args)=>{window.layoutCount++;return layout(...args)};window.canvas=new DiagramCanvas(document.getElementById('canvas'),{navigate:()=>{},status:(s,m)=>document.getElementById('status').textContent=s+': '+m},'',worker);window.controls=mountDiagramControls(document.getElementById('controls'),canvas,{error:m=>document.getElementById('status').textContent='ERROR '+m,export:()=>{}});window.input=await(await fetch('/test/renderer/fixtures/interactive.json')).json();await canvas.accept(input,'comfort');</script></body></html>`;
test('native shared controls preserve hidden geometry, own undo, real curves and current SVG/PNG export',{timeout:60000},async()=>{
 fs.mkdirSync(out,{recursive:true});const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname;if(name==='/'){res.setHeader('content-type','text/html');res.end(html);return;}const file=path.resolve(root,name.slice(1));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404).end();return;}res.setHeader('content-type',file.endsWith('.json')?'application/json':file.endsWith('.css')?'text/css':'text/javascript');res.end(fs.readFileSync(file));});await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser,page;const errors=[];
 try{browser=await chromium.launch({headless:true});page=await browser.newPage({viewport:{width:1400,height:1050},deviceScaleFactor:2});page.on('pageerror',e=>errors.push(String(e)));await page.goto('http://127.0.0.1:'+server.address().port);const ready=()=>page.waitForFunction(()=>document.querySelector('#canvas').dataset.status==='FRESH');await ready();
 const node=page.locator('[data-label="A"]'),initial=await node.getAttribute('transform'),box=await node.boundingBox();await page.mouse.move(box.x+25,box.y+12);await page.mouse.down();await page.mouse.move(box.x+85,box.y+45,{steps:10});await page.mouse.up();await page.waitForTimeout(80);const moved=await node.getAttribute('transform');assert.notEqual(moved,initial);
 await page.locator('#more').click();await page.locator('#diagram-undo').click();await ready();assert.equal(await node.getAttribute('transform'),initial);await page.locator('#more').click();await page.locator('#diagram-redo').click();await ready();assert.equal(await node.getAttribute('transform'),moved);
 const layoutBeforeOptions=await page.evaluate(()=>({count:layoutCount,viewport:canvas.getViewport(),geometry:canvas.getViewState()}));
 assert.equal(await page.locator('#diagram-options').isVisible(),false);
 await page.locator('#options').press('Enter');
 assert.equal(await page.locator('#diagram-options').isVisible(),true);
 assert.equal(await page.locator('#diagram-options-close').evaluate(node=>node===document.activeElement),true);
 await page.locator('#diagram-options-close').press('Escape');
 assert.equal(await page.locator('#options').evaluate(node=>node===document.activeElement),true);
 assert.deepEqual(await page.evaluate(()=>({count:layoutCount,viewport:canvas.getViewport(),geometry:canvas.getViewState()})),layoutBeforeOptions);
 await page.locator('#options').click();await page.locator('summary').click();const treeItem=page.getByRole('checkbox',{name:'Show Interactive.Data.A',exact:true});await treeItem.press('Space');await ready();assert.equal(await treeItem.evaluate(node=>node===document.activeElement),true);await treeItem.press('Space');await ready();assert.equal(await treeItem.evaluate(node=>node===document.activeElement),true);await page.locator('#diagram-filter-kinds-CLASS').uncheck();await ready();assert.equal(await node.count(),0);await page.locator('#diagram-filter-kinds-CLASS').check();await ready();assert.equal(await node.getAttribute('transform'),moved);await page.locator('#diagram-filter-none').click();await page.waitForFunction(()=>document.querySelector('#canvas').dataset.status==='EMPTY');assert.match(await page.locator('#status').textContent(),/No visible elements/);await page.locator('#diagram-filter-reset').click();await ready();assert.equal(await node.getAttribute('transform'),moved);
 await page.locator('#diagram-settle').click();await ready();assert.equal(await node.getAttribute('transform'),moved);await page.screenshot({path:path.join(out,'manual-filtered.png'),fullPage:true});
 await page.locator('#diagram-options-close').click();
 const viewportBefore=await page.evaluate(()=>canvas.getViewport());const canvasBox=await page.locator('#canvas').boundingBox();await page.mouse.move(canvasBox.x+canvasBox.width/2,canvasBox.y+canvasBox.height/2);await page.mouse.wheel(0,-120);await page.waitForTimeout(80);assert.ok((await page.evaluate(()=>canvas.getViewport())).zoom>viewportBefore.zoom);await page.locator('svg.sprotty-graph').press('ArrowRight');await page.waitForTimeout(50);assert.ok((await page.evaluate(()=>canvas.getViewport())).x>viewportBefore.x);await page.locator('#fit').click();
 await page.locator('#options').click();
 await page.locator('#diagram-filter-modelFrames').uncheck();await ready();const frameExport=await page.evaluate(()=>canvas.exportSvg('FULL').svg);assert.ok(await page.evaluate(svg=>{const doc=new DOMParser().parseFromString(svg,'image/svg+xml');return [...doc.querySelectorAll('[data-kind="MODEL"]>.interlis-frame')].every(rect=>rect.style.visibility==='hidden');},frameExport),'Frame visibility was lost during serialization');await page.locator('#diagram-filter-modelFrames').check();await ready();
 const before=await page.evaluate(()=>({input:JSON.stringify(input),state:canvas.getViewState()}));await page.locator('#diagram-edgeRouting').selectOption('SPLINES');await ready();assert.ok(await page.locator('path.interlis-edge-line').first().getAttribute('d').then(d=>d.includes(' C ')),'SPLINES must paint actual cubic curves');await page.locator('#diagram-renderingTarget').selectOption('INKSCAPE');await ready();
 const artifacts=await page.evaluate(async()=>{const count=layoutCount,full=canvas.exportSvg('FULL'),visible=canvas.exportSvg('VISIBLE'),png=await canvas.exportPng('VISIBLE');return {full,visible,png:Array.from(png.data),pngWidth:png.width,pngHeight:png.height,count,after:layoutCount,input:JSON.stringify(input),state:canvas.getViewState()};});assert.equal(artifacts.count,artifacts.after,'Export invoked ELK');assert.equal(before.input,artifacts.input,'View modified semantic input');assert.equal(artifacts.visible.width,1300);assert.equal(artifacts.visible.height,750);assert.deepEqual(Buffer.from(artifacts.png).subarray(0,8),Buffer.from([137,80,78,71,13,10,26,10]));assert.equal(Buffer.from(artifacts.png).readUInt32BE(16),1300);assert.equal(Buffer.from(artifacts.png).readUInt32BE(20),750);assert.match(artifacts.full.svg,/data-interlis-static-start/);assert.doesNotMatch(artifacts.full.svg,/inkscape:connector-type/);assert.doesNotMatch(artifacts.full.svg,/interlis-edge-hit|data-handle-kind|<script|foreignObject/);
 fs.writeFileSync(path.join(out,'full.svg'),artifacts.full.svg);fs.writeFileSync(path.join(out,'visible.svg'),artifacts.visible.svg);fs.writeFileSync(path.join(out,'visible.png'),Buffer.from(artifacts.png));
 await page.evaluate(async svg=>{const blob=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));try{const image=new Image();image.src=blob;await image.decode();if(!image.naturalWidth||!image.naturalHeight)throw Error('Export image is empty');}finally{URL.revokeObjectURL(blob);}},artifacts.full.svg);
 const pending=await page.evaluate(()=>{canvas.invalidate('Awaiting current Java source');return layoutCount;});await page.locator('#diagram-filter-kinds-VIEW').uncheck();assert.equal(await page.locator('#canvas').getAttribute('data-status'),'STALE');assert.equal(await page.evaluate(()=>layoutCount),pending,'A stale view was re-laid out as current');assert.equal(await page.evaluate(()=>{try{canvas.exportSvg('FULL');return false;}catch{return true;}}),true,'Stale export was admitted');await page.evaluate(()=>canvas.accept(input,'comfort',canvas.getSettings()));await ready();assert.equal(await page.locator('[data-kind="VIEW"]').count(),0);await page.locator('#diagram-filter-kinds-VIEW').check();await ready();
 const saved=await page.evaluate(()=>canvas.saveState());await page.locator('#diagram-reset-layout').click();await ready();assert.notEqual(await node.getAttribute('transform'),moved);await page.evaluate(value=>canvas.restoreState(value),saved);await ready();assert.equal(await node.getAttribute('transform'),moved);await page.locator('#diagram-edgeRouting').selectOption('ORTHOGONAL');await ready();const orthogonal=await page.evaluate(()=>canvas.exportSvg('FULL'));assert.match(orthogonal.svg,/inkscape:connector-type="orthogonal"/);assert.match(orthogonal.svg,/inkscape:connection-start="#interlis-/);fs.writeFileSync(path.join(out,'orthogonal.svg'),orthogonal.svg);await page.screenshot({path:path.join(out,'restored.png'),fullPage:true});// Presentation-only malicious metadata counterfixture: no fabricated compiler result.
 const danger='<script>alert(1)</script> javascript: command: \u202e';await page.evaluate(async label=>{const dto=structuredClone(input);dto.nodes[0].label=label;await canvas.accept(dto,'comfort',canvas.getSettings());},danger);await ready();assert.equal(await page.locator('#canvas script,#canvas foreignObject').count(),0);const safe=await page.evaluate(()=>canvas.exportSvg('FULL').svg);assert.match(safe,/&lt;script&gt;/);assert.match(safe,/U\+202E/);assert.doesNotMatch(safe,/<script>/);fs.writeFileSync(path.join(out,'safe-label.svg'),safe);assert.deepEqual(errors,[]);
 await page.locator('#diagram-options-close').click();
 const themed=await page.evaluate(async()=>{
  const root=document.documentElement;
  const set=(background,foreground)=>{root.style.setProperty('--vscode-editor-background',background);root.style.setProperty('--vscode-editor-foreground',foreground);};
  set('#181818','#eeeeee');
  const dark=canvas.exportSvg('FULL');
  const original=HTMLImageElement.prototype.decode;
  let release;
  HTMLImageElement.prototype.decode=async function(){await new Promise(resolve=>{release=resolve;});return original.call(this);};
  let png;
  try{
   const pending=canvas.exportPng('FULL');
   if(!release)throw Error('PNG encoding did not enter the real async image decode');
   set('#ffffff','#222222');
   release();png=await pending;
  }finally{HTMLImageElement.prototype.decode=original;}
  const light=canvas.exportSvg('FULL');
  const data=await createImageBitmap(new Blob([png.data],{type:'image/png'}));
  const probe=document.createElement('canvas');probe.width=probe.height=1;
  const ctx=probe.getContext('2d');ctx.drawImage(data,0,0,1,1,0,0,1,1);
  const pixel=[...ctx.getImageData(0,0,1,1).data];data.close();
  const background=artifact=>new DOMParser().parseFromString(artifact.svg,'image/svg+xml').querySelector('.interlis-export-background').getAttribute('fill');
  return {pixel,dark:background(dark),light:background(light),width:png.width,height:png.height,expected:[dark.width,dark.height],styles:[dark.svg,light.svg].every(svg=>!svg.includes('var(--'))};
 });
 assert.deepEqual(themed.pixel,[24,24,24,255]);
 assert.equal(themed.dark,'rgb(24, 24, 24)');
 assert.equal(themed.light,'rgb(255, 255, 255)');
 assert.deepEqual([themed.width,themed.height],themed.expected);
 assert.equal(themed.styles,true);
 const edgeId=await page.locator('.sprotty-edge[data-edge-id]').first().getAttribute('data-edge-id');
 await page.evaluate(id=>canvas.select([id]),edgeId);
 await page.locator('#more').press('Enter');
 assert.equal(await page.locator('#diagram-hide').isEnabled(),false);
 assert.equal(await page.locator('#diagram-pin').isEnabled(),false);
 await page.keyboard.press('Escape');
 await page.setViewportSize({width:360,height:640});
 const toolbar=await page.locator('nav[aria-label="Diagram controls"]').evaluate(node=>({width:node.clientWidth,scroll:node.scrollWidth,height:node.clientHeight}));
 assert.ok(toolbar.scroll<=toolbar.width&&toolbar.height<=44,JSON.stringify(toolbar));
 await page.locator('#options').press('Enter');
 const drawer=await page.locator('#diagram-options').boundingBox();
 assert.ok(drawer.x>=0&&drawer.x+drawer.width<=360);
 await page.locator('#diagram-options-close').press('Escape');
 await page.locator('#export').press('Enter');
 assert.equal(await page.locator('#diagram-export-svg-full').isVisible(),true);
 await page.keyboard.press('Escape');
 assert.equal(await page.locator('#diagram-export-svg-full').isVisible(),false);
 await page.setViewportSize({width:1400,height:1000});
 await page.evaluate(async()=>{
  const dto=structuredClone(input),warning=dto.nodes.find(node=>node.label==='A');
  warning.status='UNRESOLVED';dto.completeness='PARTIAL';
  await canvas.accept(dto,'comfort',canvas.getSettings());
 });
 await page.locator('[data-label="A"] .interlis-warning').waitFor();
 const semanticColors=await page.evaluate(()=>{
  const root=document.documentElement,rows=[];
  const number=paint=>paint.match(/[\d.]+/g).slice(0,3).map(Number);
  const luminance=paint=>number(paint).map(value=>value/255)
   .map(value=>value<=.04045?value/12.92:((value+.055)/1.055)**2.4)
   .reduce((sum,value,index)=>sum+value*[.2126,.7152,.0722][index],0);
  const ratio=(foreground,background)=>{const a=luminance(foreground),b=luminance(background);return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);};
  for(const [kind,background,foreground]of [
   ['vscode-light','#fff','#222'],['vscode-dark','#181818','#eee'],
   ['vscode-high-contrast','#000','#fff'],['vscode-high-contrast-light','#fff','#000']
  ]){
   root.className=kind;
   root.style.setProperty('--vscode-editor-background',background);
   root.style.setProperty('--vscode-editor-foreground',foreground);
   const node=document.querySelector('[data-label="A"]'),text=node.querySelector('.interlis-warning');
   const frame=node.querySelector('.interlis-frame');
   if(!text)throw Error('Missing warning in the partial diagram');
   rows.push({kind,warning:ratio(getComputedStyle(text).fill,getComputedStyle(frame).fill)});
  }
  return rows;
 });
 for(const row of semanticColors)assert.ok(row.warning>=4.5,JSON.stringify(row));
 fs.writeFileSync(path.join(out,'theme-role-ratios.json'),JSON.stringify(semanticColors,null,2)+'\n');

 }catch(error){if(page){await page.screenshot({path:path.join(out,'failure.png'),fullPage:true});fs.writeFileSync(path.join(out,'failure-dom.html'),await page.content());}throw error;}finally{await browser?.close();await new Promise(r=>server.close(r));}
});
