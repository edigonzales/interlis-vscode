import {promises as fs} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
/** Renderer assets and protocol schemas are verified separately from the Java classpath. */
export async function verifyDiagramAssets(root:string):Promise<void> {
 const lock=JSON.parse(await fs.readFile(path.join(root,'release/editor-artifacts.lock.json'),'utf8'));
 if(lock.editorProtocolVersion!==1||lock.diagramDocumentVersion!=='1.0'||!Array.isArray(lock.rendererFiles)||!lock.rendererFiles.length)throw Error('Missing matching diagram artifacts. Reinstall INTERLIS.');
 const seen=new Set<string>();
 for(const file of lock.rendererFiles){if(typeof file.path!=='string'||! /^(?:diagram-ui\/|types\/|schemas\/|diagram-ui\.tgz$|renderer-provenance\.json$|licenses\/interlis-java\.txt$)/.test(file.path)||file.path.split('/').some((p:string)=>p==='..'||!p)||seen.has(file.path)||! /^[a-f0-9]{64}$/.test(file.sha256))throw Error('Invalid renderer artifact inventory');seen.add(file.path);if(createHash('sha256').update(await fs.readFile(path.join(root,'artifacts',file.path))).digest('hex')!==file.sha256)throw Error('Diagram artifact digest mismatch: '+file.path);}
 for(const required of ['diagram-ui/diagram-ui.js','diagram-ui/diagram-ui.css','diagram-ui/diagram-layout-worker.js','types/editor-protocol.ts','schemas/diagram-document-1.0.schema.json'])if(!seen.has(required))throw Error('Incomplete diagram artifact inventory');
}
