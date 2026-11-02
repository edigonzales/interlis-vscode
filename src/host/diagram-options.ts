import type {DiagramRequest} from '../../artifacts/types/editor-protocol';
/** User projection choices only. Java owns symbol resolution and relationship traversal. */
export function diagramProjectionRequest(choice:{association:'ENTITY'|'COMPACT_BINARY';symbolIds?:string[];depth?:number;translation?:string;snapshotId?:string}):Pick<DiagramRequest,'options'|'symbolIds'> {
 const selected=choice.symbolIds?.length?[...choice.symbolIds]:undefined,depth=selected?(choice.depth??0):0;
 if(!Number.isInteger(depth)||depth<0||depth>3)throw Error('Invalid diagram neighbourhood choice');
 if(choice.translation&&!choice.snapshotId)throw Error('Translation requires a current diagram snapshot');
 return {...(selected?{symbolIds:selected}:{}),options:{schemaVersion:'1.0',scope:selected?(depth?'NEIGHBOURHOOD':'SELECTED'):'WITH_DEPENDENCIES',...(depth?{neighbourhoodDepth:depth}:{}),associationPresentation:choice.association,showConstraints:true,inheritedMembers:'SHOW_WITH_ORIGIN',...(choice.translation?{labelPolicy:'TRANSLATED',translationModel:{snapshot:choice.snapshotId!,symbol:choice.translation}}:{})}};
}
