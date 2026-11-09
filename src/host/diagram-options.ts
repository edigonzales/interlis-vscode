import type {DiagramRequest} from '../../artifacts/types/editor-protocol';
import {defaultDiagramSettings,type DiagramSettings} from '../diagram/renderer/settings';
/** User projection choices only. Java owns symbol resolution and relationship traversal. */
export function diagramProjectionRequest(choice:{association:'ENTITY'|'COMPACT_BINARY';symbolIds?:string[];depth?:number;translation?:string;snapshotId?:string}):Pick<DiagramRequest,'options'|'symbolIds'> {
 const selected=choice.symbolIds?.length?[...choice.symbolIds]:undefined,depth=selected?(choice.depth??0):0;
 if(!Number.isInteger(depth)||depth<0||depth>3)throw Error('Invalid diagram neighbourhood choice');
 if(choice.translation&&!choice.snapshotId)throw Error('Translation requires a current diagram snapshot');
 return {...(selected?{symbolIds:selected}:{}),options:{schemaVersion:'1.0',scope:selected?(depth?'NEIGHBOURHOOD':'SELECTED'):'WITH_DEPENDENCIES',...(depth?{neighbourhoodDepth:depth}:{}),associationPresentation:choice.association,showConstraints:true,inheritedMembers:'SHOW_WITH_ORIGIN',...(choice.translation?{labelPolicy:'TRANSLATED',translationModel:{snapshot:choice.snapshotId!,symbol:choice.translation}}:{})}};
}


export type AssociationPresentation = NonNullable<NonNullable<DiagramRequest['options']>['associationPresentation']>;
export interface DiagramDefaults {
 readonly settings: DiagramSettings;
 readonly association: AssociationPresentation;
}

export function readDiagramDefaults(configuration:{get<T>(key:string,fallback:T):T}):DiagramDefaults {
 const get=<T>(key:string,fallback:T):T=>configuration.get('diagram.'+key,fallback);
 const defaults=defaultDiagramSettings;
 return {
  association:get<AssociationPresentation>('associationPresentation','ENTITY'),
  settings:{
   direction:get<NonNullable<DiagramSettings['direction']>>('direction','RIGHT'),
   attributeMode:get('attributeMode',defaults.attributeMode),
   edgeRouting:get('edgeRouting',defaults.edgeRouting),
   nodePlacement:get('nodePlacement',defaults.nodePlacement),
   renderingTarget:get('rendering.target',defaults.renderingTarget),
   edgeCrossingStyle:get('edgeCrossings',defaults.edgeCrossingStyle),
   deemphasizeAbstractTypes:get('deemphasizeAbstractTypes',defaults.deemphasizeAbstractTypes),
   showAssociationNames:get('showAssociationNames',defaults.showAssociationNames),
   showRoleCardinalities:get('showRoleCardinalities',defaults.showRoleCardinalities),
   showLocalEnumerationValues:get('showLocalEnumerationValues',defaults.showLocalEnumerationValues)
  }
 };
}
