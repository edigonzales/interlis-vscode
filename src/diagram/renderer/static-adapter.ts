// Entry for the Node renderer regression suite. The webview renders and exports its live SVG.
import {adapt, isStale, resolveNavigation, elementsForSymbol, legacyProjection, defaultDiagramSettings, freeze, type DiagramView} from './adapter';
import {layoutAndRenderDiagram, renderSvg, toSprottyModel, type DiagramSettings, type LayoutDiagram} from './layout';

export * from './adapter';

export interface RenderedDiagram {readonly snapshotId:string;readonly layout:LayoutDiagram;readonly svg:string;readonly sprotty:ReturnType<typeof toSprottyModel>;}
const renderedSignatures=new WeakMap<RenderedDiagram,string>();
function geometryKey(projection:ReturnType<typeof legacyProjection>,settings:DiagramSettings):string {
  return JSON.stringify({settings,nodes:projection.nodes.map(n=>({id:n.id,containerId:n.containerId,kind:n.kind,members:n.members,operations:n.operations,enumValues:n.enumValues})),edges:projection.edges});
}
/** Reuses one accepted host layout only when geometry and settings still agree.
 * Labels and source ranges are refreshed from the new immutable projection;
 * no Core value or revision is mutated. Callers publish only current snapshots.
 */
export async function render(view:DiagramView,settings:DiagramSettings=defaultDiagramSettings,previous?:RenderedDiagram):Promise<RenderedDiagram> {
  const effective={...settings,...(view.notices.length?{deemphasizeAbstractTypes:false}:{})};
  const projection=legacyProjection(view),signature=geometryKey(projection,effective);
  let result:Omit<RenderedDiagram,'snapshotId'>;
  if(previous && renderedSignatures.get(previous)===signature){
    const byId=new Map(projection.nodes.map(node=>[node.id,node]));
    const layout:LayoutDiagram={...previous.layout,nodes:previous.layout.nodes.map(node=>({...node,source:byId.get(node.id)!}))};
    result={layout,svg:renderSvg(layout,effective),sprotty:toSprottyModel(layout)};
  }else result=await layoutAndRenderDiagram(projection,effective);
  const rendered=freeze({snapshotId:view.snapshotId,...result});renderedSignatures.set(rendered,signature);return rendered;
}
/** Stateless typed adapter over the pinned renderer; all views remain snapshot-bound. */
export class SprottyDiagramAdapter {
  readonly adapt=adapt;
  readonly isStale=isStale;
  readonly resolveNavigation=resolveNavigation;
  readonly elementsForSymbol=elementsForSymbol;
  readonly legacyProjection=legacyProjection;
  readonly render=render;
  readonly defaultDiagramSettings=defaultDiagramSettings;
}
export const diagramAdapter=Object.freeze(new SprottyDiagramAdapter());

