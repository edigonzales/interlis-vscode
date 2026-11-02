import {createHash} from 'node:crypto';
import path from 'node:path';
import type {Memento} from 'vscode';
interface Entry {key:string;updated:number;value:unknown;}
/** Host boundary uses the exact verified Core validator; it contains no second DTO schema. */
export class DiagramStateStore {
 private readonly validate:(value:unknown)=>unknown;
 constructor(private readonly state:Memento,extensionPath:string){this.validate=require(path.join(extensionPath,'artifacts','diagram-ui','adapter.cjs')).validateSavedViewState;}
 key(workspaces:string[],root:string,panel:string):string{return createHash('sha256').update(JSON.stringify([1,workspaces.slice().sort(),root,panel])).digest('hex');}
 private entries():Entry[]{const entries=this.state.get<unknown>('interlisGuru.diagram.views',[]);if(!Array.isArray(entries))return [];return entries.slice(-16).filter((e):e is Entry=>!!e&&typeof e==='object'&&/^[a-f0-9]{64}$/.test(e.key)&&Number.isFinite(e.updated)).flatMap(entry=>{try{return [{...entry,value:this.validate(entry.value)}];}catch{return [];}});}
 read(key:string):unknown {const entry=this.entries().find(e=>e.key===key);if(!entry)return;try{return this.validate(entry.value);}catch{return;}}
 async write(keys:string[],value:unknown):Promise<void>{const clean=this.validate(value),entries=this.entries().filter(e=>!keys.includes(e.key));for(const key of keys){if(!/^[a-f0-9]{64}$/.test(key))throw Error('Invalid diagram storage identity');entries.push({key,updated:Date.now(),value:clean});}while(entries.length>16||JSON.stringify(entries).length>8_000_000)entries.shift();await this.state.update('interlisGuru.diagram.views',entries);}
}
