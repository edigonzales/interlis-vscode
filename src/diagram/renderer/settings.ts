export type EdgeRouting = "ORTHOGONAL" | "POLYLINE" | "SPLINES";
export type RenderingTarget = "STANDARD" | "INKSCAPE";
export type NodePlacement =
  | "SIMPLE"
  | "INTERACTIVE"
  | "LINEAR_SEGMENTS"
  | "BRANDES_KOEPF"
  | "NETWORK_SIMPLEX";
export type EdgeCrossingStyle = "PLAIN" | "GAPS";
export type AttributeMode = "OWN" | "NONE" | "OWN_AND_INHERITED";

export interface DiagramSettings {
  readonly direction?: "RIGHT" | "LEFT" | "DOWN" | "UP";
  readonly nodePlacement: NodePlacement;
  readonly edgeRouting: EdgeRouting;
  readonly renderingTarget: RenderingTarget;
  readonly edgeCrossingStyle: EdgeCrossingStyle;
  readonly attributeMode: AttributeMode;
  readonly deemphasizeAbstractTypes: boolean;
  readonly showAssociationNames: boolean;
  readonly showRoleCardinalities: boolean;
  readonly showLocalEnumerationValues: boolean;
}

export const defaultDiagramSettings: DiagramSettings = {
  nodePlacement: "BRANDES_KOEPF",
  edgeRouting: "ORTHOGONAL",
  renderingTarget: "STANDARD",
  edgeCrossingStyle: "GAPS",
  attributeMode: "OWN",
  deemphasizeAbstractTypes: true,
  showAssociationNames: true,
  showRoleCardinalities: true,
  showLocalEnumerationValues: true,
};
