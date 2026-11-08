import type {DiagramCanvas} from './interactive';
import type {DiagramSettings} from './settings';
import type {ExportScope} from './export';
import {nodeKinds,edgeKinds} from './filters';

export interface ControlHost {
 error(message:string):void;
 export(format:'SVG'|'PNG',scope:ExportScope):void;
 reveal?():void;
 focus?(ids:string[],depth:number,language:string):void;
 resetOptions?():void;
 openSettings?():void;
}

function element<K extends keyof HTMLElementTagNameMap>(tag:K,className?:string):HTMLElementTagNameMap[K] {
 const node=document.createElement(tag);
 if(className)node.className=className;
 return node;
}
function label(text:string,input:HTMLElement):HTMLLabelElement {
 const node=element('label');
 node.append(text,input);
 return node;
}
function button(parent:HTMLElement,id:string,text:string,click:()=>void):HTMLButtonElement {
 const node=element('button');
 node.type='button';node.id=id;node.textContent=text;node.onclick=click;
 parent.append(node);
 return node;
}
function select(id:string,choices:readonly (readonly [string,string])[]):HTMLSelectElement {
 const node=element('select');
 node.id=id;
 for(const [value,text]of choices){const option=element('option');option.value=value;option.textContent=text;node.append(option);}
 return node;
}
function section(parent:HTMLElement,title:string):HTMLFieldSetElement {
 const group=element('fieldset'),heading=element('legend');
 heading.textContent=title;group.append(heading);parent.append(group);
 return group;
}
const names:Record<string,string>={
 CLASS:'Classes',STRUCTURE:'Structures',DOMAIN:'Domains',ASSOCIATION:'Associations',VIEW:'Views',
 EXTERNAL_REFERENCE:'External references',MODEL_IMPORT:'Model imports',ASSOCIATION_ROLE:'Association roles',
 DOMAIN_USE:'Domain uses',STRUCTURE_COMPOSITION:'Structure composition',VIEW_DERIVATION:'View derivation',
 attributes:'Attributes',roles:'Roles',types:'Types',cardinalities:'Cardinalities',constraints:'Constraints',
 enumerations:'Enumerations',modelFrames:'Model frames',topicFrames:'Topic frames',
 directImports:'Direct imports',indirectImports:'Indirect imports'
};
function filterName(name:string):string {
 return names[name]??name.toLowerCase().replaceAll('_',' ').replace(/^./,character=>character.toUpperCase());
}

/** Local presentation controls. Source binding and file operations remain host actions. */
export function mountDiagramControls(parent:HTMLElement,canvas:DiagramCanvas,host:ControlHost,providedToolbar?:HTMLElement) {
 const root=element('div','interlis-controls');parent.append(root);
 const toolbar=providedToolbar??element('nav','interlis-toolbar');
 if(!providedToolbar){toolbar.setAttribute('aria-label','Diagram controls');root.append(toolbar);}
 let alive=true;
 const listeners=new AbortController(),bindings:Array<()=>void>=[];
 const run=(action:()=>unknown)=>{void Promise.resolve().then(action).then(refresh).catch(error=>{if(alive)host.error(String(error));});};

 const drawer=element('aside','interlis-options');
 drawer.id='diagram-options';drawer.hidden=true;drawer.setAttribute('aria-label','Diagram options');
 const header=element('header'),heading=element('strong');heading.textContent='Diagram options';header.append(heading);
 const contents=element('div','interlis-options-content');
 drawer.append(header,contents);root.append(drawer);

 const exportMenu=element('div','interlis-menu'),moreMenu=element('div','interlis-menu');
 exportMenu.id='diagram-export-menu';moreMenu.id='diagram-more-menu';exportMenu.hidden=moreMenu.hidden=true;
 root.append(exportMenu,moreMenu);
 let openMenu:HTMLElement|undefined;
 let menuTrigger:HTMLButtonElement|undefined;
 function closeMenu(restore:boolean):void {
  if(!openMenu)return;
  openMenu.hidden=true;openMenu=undefined;
  menuTrigger?.setAttribute('aria-expanded','false');
  if(restore)menuTrigger?.focus();
  menuTrigger=undefined;
 }
 function toggleMenu(menu:HTMLElement,trigger:HTMLButtonElement):void {
  if(openMenu===menu){closeMenu(true);return;}
  closeMenu(false);openMenu=menu;menuTrigger=trigger;menu.hidden=false;
  trigger.setAttribute('aria-expanded','true');
  refreshActions();menu.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
 }
 const options=button(toolbar,'options','Options',()=>setDrawer(drawer.hidden));
 const exportButton=button(toolbar,'export','Export',()=>toggleMenu(exportMenu,exportButton));
 const more=button(toolbar,'more','More',()=>toggleMenu(moreMenu,more));
 options.dataset.compact='⚙';exportButton.dataset.compact='↥';more.dataset.compact='…';
 options.title='Diagram options';exportButton.title='Export diagram';more.title='More diagram actions';
 for(const [trigger,panel]of [[options,drawer],[exportButton,exportMenu],[more,moreMenu]]){
  trigger.setAttribute('aria-controls',panel.id);trigger.setAttribute('aria-expanded','false');
 }
 const close=button(header,'diagram-options-close','Close',()=>setDrawer(false));
 function setDrawer(show:boolean):void {
  closeMenu(false);drawer.hidden=!show;options.setAttribute('aria-expanded',String(show));
  if(show)close.focus();else options.focus();
 }

 const display=section(contents,'Display'),layout=section(contents,'Layout');
 const filters=element('details','interlis-filter-list'),summary=element('summary');
 summary.textContent='Filters';filters.append(summary);contents.append(filters);
 const advanced=section(contents,'Advanced');
 const association=document.getElementById('association');
 if(association?.parentElement)display.append(association.parentElement);
 function setting<K extends keyof DiagramSettings>(parent:HTMLElement,text:string,key:K,choices:readonly (readonly [string,string])[]):void {
  const input=select('diagram-'+key,choices);
  input.setAttribute('aria-label',text);
  input.onchange=()=>run(()=>canvas.configure({...canvas.getSettings(),[key]:input.value}));
  parent.append(label(text,input));
  bindings.push(()=>{input.value=String(canvas.getSettings()[key]??choices[0][0]);});
 }
 setting(display,'Members','attributeMode',[['OWN','Own members'],['OWN_AND_INHERITED','Own and inherited members'],['NONE','No members']]);
 for(const [text,key]of [['Association names','showAssociationNames'],['Role cardinalities','showRoleCardinalities'],
  ['Inline enumeration values','showLocalEnumerationValues'],['De-emphasize abstract types','deemphasizeAbstractTypes']] as const){
  const input=element('input');input.type='checkbox';
  input.onchange=()=>run(()=>canvas.configure({...canvas.getSettings(),[key]:input.checked}));
  display.append(label(text,input));bindings.push(()=>{input.checked=canvas.getSettings()[key];});
 }
 setting(layout,'Direction','direction',[['RIGHT','Left to right'],['LEFT','Right to left'],['DOWN','Top to bottom'],['UP','Bottom to top']]);
 setting(layout,'Routing','edgeRouting',[['ORTHOGONAL','Orthogonal'],['POLYLINE','Polyline'],['SPLINES','Curved']]);
 button(layout,'diagram-settle','Rearrange layout',()=>run(()=>canvas.settle())).title='Keep manually positioned and pinned nodes';
 button(layout,'diagram-reset-layout','Reset layout',()=>run(()=>canvas.resetLayout())).title='Discard manual positions, pins and routes';
 setting(advanced,'Node placement','nodePlacement',[['BRANDES_KOEPF','Brandes–Köpf'],['SIMPLE','Simple'],['INTERACTIVE','Interactive'],['LINEAR_SEGMENTS','Linear segments'],['NETWORK_SIMPLEX','Network simplex']]);
 setting(advanced,'Crossing style','edgeCrossingStyle',[['GAPS','Gaps'],['PLAIN','Plain']]);
 setting(advanced,'Rendering target','renderingTarget',[['STANDARD','Standard'],['INKSCAPE','Inkscape']]);

 const elements=section(filters,'Elements'),relationships=section(filters,'Relationships'),details=section(filters,'Details'),imports=section(filters,'Imports');
 const tree=element('ul','interlis-elements');elements.append(tree);
 let treeSnapshot='';
 function refreshTree():void {
  const dto=canvas.getDocument();if(!dto)return;
  const stamp=dto.snapshotId+':'+[...canvas.filters.hiddenIds].sort().join('|');
  if(stamp===treeSnapshot)return;treeSnapshot=stamp;tree.replaceChildren();
  const values=[...dto.containers,...dto.nodes];
  function append(parent:HTMLElement,parentId:string|null,depth:number):void {
   if(depth>64)return;
   for(const value of values.filter(item=>('parentId'in item?item.parentId:item.containerId)===parentId)){
    const item=element('li'),input=element('input');input.type='checkbox';input.checked=!canvas.filters.hiddenIds.has(value.id);
    input.setAttribute('aria-label','Show '+value.canonicalName);
    input.onchange=()=>run(()=>canvas.hide([value.id],!input.checked));
    const nested=element('ul');append(nested,value.id,depth+1);item.append(label(value.label,input));
    if(nested.childElementCount)item.append(nested);parent.append(item);
   }
  }
  append(tree,null,0);
 }
 const filterGroup=element('div','interlis-filter-actions');filters.append(filterGroup);
 button(filterGroup,'diagram-filter-all','Show all',()=>run(()=>canvas.filterAll(true)));
 button(filterGroup,'diagram-filter-none','Show none',()=>run(()=>canvas.filterAll(false)));
 button(filterGroup,'diagram-filter-reset','Reset filters',()=>run(()=>canvas.resetFilters()));
 const paths=[...nodeKinds.map(kind=>'kinds.'+kind),...edgeKinds.map(kind=>'edges.'+kind),...Object.keys(canvas.filters.filters).filter(key=>key!=='kinds'&&key!=='edges')];
 for(const path of paths){
  const [group,key]=path.split('.'),input=element('input');input.type='checkbox';input.id='diagram-filter-'+path.replace('.','-');
  const target=path==='edges.MODEL_IMPORT'||path.endsWith('Imports')?imports:group==='kinds'?elements:group==='edges'?relationships:details;
  target.append(label(filterName(key??group),input));input.onchange=()=>run(()=>canvas.filter(path,input.checked));
  bindings.push(()=>{const filters=canvas.filters.filters;input.checked=group==='kinds'||group==='edges'?filters[group][key]:(filters as unknown as Record<string,boolean>)[group];});
 }

 const zoom=element('div','interlis-zoom');
 const percentage=element('output');percentage.setAttribute('aria-label','Diagram zoom');
 button(zoom,'diagram-zoom-out','−',()=>run(()=>canvas.zoom(1/1.25))).setAttribute('aria-label','Zoom out');
 zoom.append(percentage);
 button(zoom,'diagram-zoom-in','+',()=>run(()=>canvas.zoom(1.25))).setAttribute('aria-label','Zoom in');
 const canvasElement=document.getElementById(canvas.elementId);
 if(canvasElement)canvasElement.after(zoom);else root.append(zoom);
 if(!providedToolbar)button(toolbar,'fit','Fit',()=>run(()=>canvas.fit()));
 const action=(menu:HTMLElement,id:string,text:string,callback:()=>unknown)=>button(menu,id,text,()=>{closeMenu(true);run(callback);});
 const pin=action(moreMenu,'diagram-pin','Pin position',()=>canvas.pinSelected(true));
 const unpin=action(moreMenu,'diagram-unpin','Unpin position',()=>canvas.pinSelected(false));
 const hide=action(moreMenu,'diagram-hide','Hide selected',()=>canvas.hide(canvas.selectedIds()));
 const undo=action(moreMenu,'diagram-undo','Undo layout',()=>canvas.undo());
 const redo=action(moreMenu,'diagram-redo','Redo layout',()=>canvas.redo());
 const reveal=host.reveal? action(moreMenu,'diagram-reveal','Reveal source selection',host.reveal):undefined;
 let focus:HTMLButtonElement|undefined,full:HTMLButtonElement|undefined;
 if(host.focus){
  const focusHost=host.focus;
  const depth=select('diagram-focus-depth',[['0','Selected elements'],['1','1 relationship'],['2','2 relationships'],['3','3 relationships']]);
  const language=select('diagram-label-language',[['','Canonical']]);
  depth.setAttribute('aria-label','Neighbourhood depth');language.setAttribute('aria-label','Label language');
  advanced.append(label('Neighbourhood depth',depth),label('Label language',language));
  bindings.push(()=>{
   const doc=canvas.getDocument(),selected=language.value;
   const translations=new Set(doc?.edges.filter(edge=>edge.kind==='TRANSLATION').map(edge=>edge.source.elementId));
   const next=select('',[['','Canonical'],...(doc?.containers.flatMap(container=>container.symbol&&translations.has(container.id)?[[container.symbol.symbol,container.label] as const]:[])??[])]);
   language.replaceChildren(...next.options);
   if([...language.options].some(option=>option.value===selected))language.value=selected;
  });
  focus=action(moreMenu,'diagram-focus','Focus selected',()=>focusHost(canvas.selectedSymbolIds(),Number(depth.value),language.value));
  full=action(moreMenu,'diagram-full','Show complete diagram',()=>focusHost([],0,language.value));
 }
 if(host.resetOptions)button(contents,'diagram-reset-options','Reset diagram options to defaults',()=>run(host.resetOptions!));
 if(host.openSettings)action(moreMenu,'diagram-open-settings','Open Diagram Settings',host.openSettings);
 for(const format of ['SVG','PNG']as const)for(const scope of ['FULL','VISIBLE']as const){
  action(exportMenu,'diagram-export-'+format.toLowerCase()+'-'+scope.toLowerCase(),format+(scope==='FULL'?' · Full diagram':' · Visible area'),()=>host.export(format,scope));
 }
 function enable(control:HTMLButtonElement|undefined,enabled:boolean,reason:string):void {
  if(control){control.disabled=!enabled;control.title=enabled?'':reason;}
 }
 function refreshActions():void {
  const current=canvas.isCurrent(),selected=canvas.selectedIds(),positions=canvas.selectedPositions();
  enable(exportButton,current,'Wait for a current diagram');
  enable(reveal,current,'Wait for a current diagram');
  enable(full,current,'Wait for a current diagram');
  enable(focus,current&&canvas.selectedSymbolIds().length>0,'Select a current diagram element with a source symbol');
  enable(pin,current&&positions.unpinned,'Select an unpinned node');
  enable(unpin,current&&positions.pinned,'Select a pinned node');
  enable(hide,current&&selected.length>0,'Select diagram elements');
  const history=canvas.layoutHistory();
  enable(undo,current&&history.undo,'No earlier layout');
  enable(redo,current&&history.redo,'No later layout');
  percentage.value=Math.round(canvas.getViewport().zoom*100)+'%';
 }
 function refresh():void {
  if(!alive)return;
  refreshActions();refreshTree();
  for(const binding of bindings)binding();
 }
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&(openMenu||!drawer.hidden)){event.preventDefault();if(openMenu)closeMenu(true);else setDrawer(false);}
  if(openMenu&&['ArrowDown','ArrowUp'].includes(event.key)&&openMenu.contains(document.activeElement)){
   const actions=[...openMenu.querySelectorAll<HTMLButtonElement>('button:not(:disabled)')];
   const current=actions.indexOf(document.activeElement as HTMLButtonElement);
   if(actions.length){event.preventDefault();actions[(current+(event.key==='ArrowDown'?1:-1)+actions.length)%actions.length].focus();}
  }
 },{signal:listeners.signal});
 document.addEventListener('pointerdown',event=>{
  if(openMenu&&!openMenu.contains(event.target as Node)&&event.target!==menuTrigger)closeMenu(false);
 },{signal:listeners.signal});
 canvasElement?.addEventListener('contextmenu',event=>{
  if(!canvas.isCurrent())return;
  event.preventDefault();
  const target=(event.target as Element).closest('[data-element-id]')?.getAttribute('data-element-id');
  run(async()=>{if(target&&!canvas.selectedIds().includes(target))await canvas.select([target]);toggleMenu(moreMenu,more);});
 },{signal:listeners.signal});
 refresh();
 return {refresh,refreshActions,dispose(){alive=false;listeners.abort();zoom.remove();root.remove();}};
}
