import {createHash} from 'node:crypto';
import {validateSavedViewState,type SavedViewState} from '../diagram/renderer/view-state';
import type {Memento} from 'vscode';
import type {AssociationPresentation} from './diagram-options';
interface Entry {key:string;updated:number;value:unknown;association?:AssociationPresentation;}
type StoredView = SavedViewState & {association?:AssociationPresentation};
/** Host storage uses the same view-state validator as the diagram. */
export class DiagramStateStore {
 constructor(private readonly state:Memento){}
 key(workspaces:string[],root:string,panel:string):string{return createHash('sha256').update(JSON.stringify([1,workspaces.slice().sort(),root,panel])).digest('hex');}
 private entries():Entry[]{const entries=this.state.get<unknown>('interlisGuru.diagram.views',[]);if(!Array.isArray(entries))return [];return entries.slice(-16).filter((e):e is Entry=>!!e&&typeof e==='object'&&/^[a-f0-9]{64}$/.test(e.key)&&Number.isFinite(e.updated)).flatMap(entry=>{try{return [{...entry,value:validateSavedViewState(entry.value),association:entry.association==='ENTITY'||entry.association==='COMPACT_BINARY'?entry.association:undefined}];}catch{return [];}});}
 read(key:string):StoredView|undefined {const entry=this.entries().find(e=>e.key===key);if(!entry)return;try{return {...validateSavedViewState(entry.value),...(entry.association?{association:entry.association}:{})};}catch{return;}}
 async write(keys:string[],value:unknown,association?:AssociationPresentation):Promise<void>{const clean=validateSavedViewState(value),entries=this.entries().filter(e=>!keys.includes(e.key));for(const key of keys){if(!/^[a-f0-9]{64}$/.test(key))throw Error('Invalid diagram storage identity');entries.push({key,updated:Date.now(),value:clean,association});}while(entries.length>16||JSON.stringify(entries).length>8_000_000)entries.shift();await this.state.update('interlisGuru.diagram.views',entries);}
}
