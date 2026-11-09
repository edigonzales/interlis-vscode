import type { ElkExtendedEdge, ElkLabel, ElkNode } from "elkjs/lib/elk-api.js";
import type {
  DiagramEdge,
  DiagramNode,
  RenderSnapshot,
} from "./render-types";


import { type DiagramSettings, type EdgeRouting } from "./settings";
export { defaultDiagramSettings } from "./settings";
export type { DiagramSettings, EdgeRouting, RenderingTarget, NodePlacement, EdgeCrossingStyle, AttributeMode } from "./settings";

export interface LayoutNode {
  readonly id: string;
  readonly parentId: string | null;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
  readonly source: DiagramNode;
}

export interface LayoutEdge {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly points: readonly { x: number; y: number }[];
  readonly sections: readonly LayoutEdgeSection[];
  readonly labels: readonly LayoutLabel[];
  readonly routing: EdgeRouting;
  readonly source: DiagramEdge;
}

export interface LayoutEdgeSection {
  readonly startPoint: { readonly x: number; readonly y: number };
  readonly bendPoints: readonly { readonly x: number; readonly y: number }[];
  readonly endPoint: { readonly x: number; readonly y: number };
}

export type LayoutLabelKind =
  "association" | "sourceCardinality" | "targetCardinality";

export interface LayoutLabel {
  readonly id: string;
  readonly kind: LayoutLabelKind;
  readonly text: string;
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface LayoutDiagram {
  readonly width: number;
  readonly height: number;
  readonly nodes: readonly LayoutNode[];
  readonly edges: readonly LayoutEdge[];
}

const EDGE_LABEL_HEIGHT = 16;
const edgeLabelSize = (text: string): { width: number; height: number } => ({
  width: Math.max(16, Array.from(text).length * 7 + 10),
  height: EDGE_LABEL_HEIGHT,
});

interface EdgeLabelSpec {
  readonly id: string;
  readonly kind: LayoutLabelKind;
  readonly text: string;
  readonly placement: "CENTER" | "TAIL" | "HEAD";
}

const visibleEdgeLabelSpecs = (
  edge: DiagramEdge,
  settings: DiagramSettings,
): EdgeLabelSpec[] => {
  if (edge.kind.toLowerCase() !== "association") return [];
  const result: EdgeLabelSpec[] = [];
  if (settings.showAssociationNames && edge.label)
    result.push({
      id: `${edge.id}:association`,
      kind: "association",
      text: edge.label,
      placement: "CENTER",
    });
  if (settings.showRoleCardinalities && edge.sourceCardinality)
    result.push({
      id: `${edge.id}:source-cardinality`,
      kind: "sourceCardinality",
      text: edge.sourceCardinality,
      placement: "TAIL",
    });
  if (settings.showRoleCardinalities && edge.targetCardinality)
    result.push({
      id: `${edge.id}:target-cardinality`,
      kind: "targetCardinality",
      text: edge.targetCardinality,
      placement: "HEAD",
    });
  return result;
};

export async function layoutDiagram(
  projection: RenderSnapshot["diagram"],
  settings: DiagramSettings,
  elk: import('./contracts/elk').ELK,
): Promise<LayoutDiagram> {
  const byId = new Map(projection.nodes.map((node) => [node.id, node]));
  const childrenByParent = new Map<string, DiagramNode[]>();
  for (const node of projection.nodes) {
    if (!byId.has(node.containerId)) continue;
    const children = childrenByParent.get(node.containerId) ?? [];
    children.push(node);
    childrenByParent.set(node.containerId, children);
  }
  const nodeSize = (node: DiagramNode) => {
    if(node.layoutSize)return node.layoutSize;
    if (isContainerNode(node)) return { width: 300, height: 100 };
    const content = nodeContentLayout(node, settings);
    const longest = [
      node.label,
      ...content.lines.map((line) => line.text),
    ].reduce((length, value) => Math.max(length, value.length), 0);
    return {
      width: Math.max(220, Math.min(520, 28 + longest * 7)),
      height: content.height,
    };
  };
  const elkById = new Map<string, ElkNode>();
  const makeElkNode = (node: DiagramNode): ElkNode => {
    const size = nodeSize(node);
    const children = (childrenByParent.get(node.id) ?? []).map(makeElkNode);
    const result: ElkNode = {
      id: node.id,
      width: size.width,
      height: size.height,
      ...(children.length > 0 ? { children } : {}),
      ...(children.length > 0
        ? {
            layoutOptions: {
              "elk.padding": `[top=${Math.max(40,node.headerHeight??40)},left=20,bottom=20,right=20]`,
              "elk.nodeSize.constraints": "MINIMUM_SIZE",
            },
          }
        : {}),
    };
    elkById.set(node.id, result);
    return result;
  };
  const input: ElkNode = {
    id: "root",
    layoutOptions: {
      "elk.algorithm": "layered",
      "elk.direction": settings.direction ?? "RIGHT",
      "elk.edgeRouting": settings.edgeRouting,
      "elk.layered.nodePlacement.strategy": settings.nodePlacement,
      "elk.spacing.nodeNode": "60",
      "elk.layered.spacing.nodeNodeBetweenLayers": "100",
      "elk.spacing.edgeNode": "30",
      "elk.layered.spacing.edgeNodeBetweenLayers": "40",
      "elk.layered.spacing.edgeEdgeBetweenLayers": "25",
      "elk.spacing.edgeLabel": "10",
      "elk.spacing.labelLabel": "6",
      "elk.hierarchyHandling": "INCLUDE_CHILDREN",
      "elk.layered.mergeEdges": "true",
    },
    children: projection.nodes
      .filter((node) => !byId.has(node.containerId))
      .map(makeElkNode),
    edges: [],
  };
  const parentOf = (id: string): string | null => {
    const parent = byId.get(id)?.containerId;
    return parent && byId.has(parent) ? parent : null;
  };
  const containerPath = (id: string): string[] => {
    const result: string[] = [];
    for (let current = parentOf(id); current; current = parentOf(current))
      result.unshift(current);
    return result;
  };
  const commonOwner = (sourceId: string, targetId: string): string | null => {
    const sourcePath = containerPath(sourceId);
    const targetPath = containerPath(targetId);
    let owner: string | null = null;
    for (
      let index = 0;
      index < Math.min(sourcePath.length, targetPath.length) &&
      sourcePath[index] === targetPath[index];
      index++
    )
      owner = sourcePath[index]!;
    return owner;
  };
  for (const edge of projection.edges) {
    if (!byId.has(edge.sourceId) || !byId.has(edge.targetId)) continue;
    const labelSpecs = visibleEdgeLabelSpecs(edge, settings);
    const elkEdge: ElkExtendedEdge = {
      id: edge.id,
      sources: [edge.sourceId],
      targets: [edge.targetId],
      labels: labelSpecs.map((label): ElkLabel => {
        const size = edgeLabelSize(label.text);
        return {
          id: label.id,
          text: label.text,
          width: size.width,
          height: size.height,
          layoutOptions: {
            "org.eclipse.elk.edgeLabels.placement": label.placement,
          },
        };
      }),
    };
    const owner = commonOwner(edge.sourceId, edge.targetId);
    const graph = owner ? elkById.get(owner) : input;
    if (!graph) continue;
    graph.edges = [...(graph.edges ?? []), elkEdge];
  }
  const graph = await elk.layout(input);
  const edgeById = new Map(projection.edges.map((edge) => [edge.id, edge]));
  const edgeLabelSpecById = new Map(
    projection.edges.flatMap((edge) =>
      visibleEdgeLabelSpecs(edge, settings).map(
        (label) => [label.id, label] as const,
      ),
    ),
  );
  const nodes: LayoutNode[] = [];
  const edges: LayoutEdge[] = [];
  const flatten = (
    owner: ElkNode,
    parentId: string | null,
    parentX: number,
    parentY: number,
  ): void => {
    for (const edge of owner.edges ?? []) {
      const source = edgeById.get(edge.id);
      if (!source) continue;
      const sections = (edge.sections ?? []).map(
        (section): LayoutEdgeSection => ({
          startPoint: {
            x: parentX + section.startPoint.x,
            y: parentY + section.startPoint.y,
          },
          bendPoints: (section.bendPoints ?? []).map((point) => ({
            x: parentX + point.x,
            y: parentY + point.y,
          })),
          endPoint: {
            x: parentX + section.endPoint.x,
            y: parentY + section.endPoint.y,
          },
        }),
      );
      const points = sections.flatMap((section, sectionIndex) =>
        [section.startPoint, ...section.bendPoints, section.endPoint].filter(
          (_, pointIndex) => sectionIndex === 0 || pointIndex > 0,
        ),
      );
      const labels = (edge.labels ?? []).flatMap((label): LayoutLabel[] => {
        if (!label.id) return [];
        const spec = edgeLabelSpecById.get(label.id);
        if (!spec || label.x === undefined || label.y === undefined) return [];
        const size = edgeLabelSize(spec.text);
        return [
          {
            id: label.id,
            kind: spec.kind,
            text: spec.text,
            x: parentX + label.x,
            y: parentY + label.y,
            width: label.width ?? size.width,
            height: label.height ?? size.height,
          },
        ];
      });
      edges.push({
        id: edge.id,
        sourceId: source.sourceId,
        targetId: source.targetId,
        points,
        sections,
        labels,
        routing: settings.edgeRouting,
        source,
      });
    }
    for (const node of owner.children ?? []) {
      const source = byId.get(node.id);
      if (!source) continue;
      const x = parentX + (node.x ?? 0);
      const y = parentY + (node.y ?? 0);
      nodes.push({
        id: node.id,
        parentId,
        x,
        y,
        width: node.width ?? nodeSize(source).width,
        height: node.height ?? nodeSize(source).height,
        source,
      });
      flatten(node, node.id, x, y);
    }
  };
  flatten(graph, null, 0, 0);
  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const completedEdges = edges.map((edge) => {
    if (edge.points.length > 1) return edge;
    const source = nodeById.get(edge.sourceId);
    const target = nodeById.get(edge.targetId);
    return source && target
      ? {
          ...edge,
          sections: [
            {
              startPoint: {
                x: source.x + source.width / 2,
                y: source.y + source.height / 2,
              },
              bendPoints: [],
              endPoint: {
                x: target.x + target.width / 2,
                y: target.y + target.height / 2,
              },
            },
          ],
          points: [
            {
              x: source.x + source.width / 2,
              y: source.y + source.height / 2,
            },
            {
              x: target.x + target.width / 2,
              y: target.y + target.height / 2,
            },
          ],
        }
      : edge;
  });
  return {
    width: Math.max(1, graph.width ?? 0),
    height: Math.max(1, graph.height ?? 0),
    nodes,
    edges: completedEdges,
  };
}

const containerKinds = new Set(["model", "modelscope", "model-scope", "topic"]);
const isContainerNode = (node: DiagramNode): boolean =>
  containerKinds.has(node.kind.toLowerCase());

interface ContentLine {
  readonly text: string;
  readonly kind: "stereotype" | "member" | "enumeration" | "operation";
  readonly y: number;
  readonly continuation?: boolean;
  readonly inherited?: boolean;
}

const visibleNodeMembers = (
  node: DiagramNode,
  settings: DiagramSettings,
): DiagramNode["members"] =>
  settings.attributeMode === "NONE"
    ? []
    : node.members.filter(
        (member) =>
          settings.attributeMode === "OWN_AND_INHERITED" || !member.inherited,
      );

const memberText = (member: DiagramNode["members"][number]): string => {
  const owner =
    member.inherited && member.declaringType ? `${member.declaringType}.` : "";
  const cardinality = member.cardinality ? `[${member.cardinality}]` : "";
  const values = member.inlineEnumValues ?? [];
  const type =
    values.length === 0
      ? member.type
      : `(${values[0]}${values
          .slice(1)
          .map((value) => `,\n  ${value}`)
          .join("")})`;
  return `${owner}${member.name}${cardinality} : ${type}`;
};

const contentLines = (
  node: DiagramNode,
  settings: DiagramSettings,
): Omit<ContentLine, "y">[] => {
  const result: Omit<ContentLine, "y">[] = (node.stereotypes ?? []).map(
    (stereotype) => ({
      text: `<<${stereotype}>>`,
      kind: "stereotype",
    }),
  );
  for (const member of visibleNodeMembers(node, settings)) {
    memberText(member)
      .split("\n")
      .forEach((text, index) =>
        result.push({
          text: index === 0 ? text : text.trimStart(),
          kind: "member",
          continuation: index > 0,
          inherited: member.inherited,
        }),
      );
  }
  if (node.kind.toLowerCase() === "domain" || (settings.attributeMode !== "NONE" && settings.showLocalEnumerationValues))
    for (const value of node.enumValues)
      result.push({ text: value, kind: "enumeration" });
  if (settings.attributeMode !== "NONE")
    for (const operation of node.operations ?? [])
      result.push({ text: operation, kind: "operation" });
  return result;
};

const nodeContentLayout = (
  node: DiagramNode,
  settings: DiagramSettings,
): { readonly lines: readonly ContentLine[]; readonly height: number } => {
  const source = contentLines(node, settings);
  const hasAttributes = source.some(
    (line) => line.kind === "member" || line.kind === "enumeration",
  );
  let y = 44;
  let operationSectionStarted = false;
  const lines = source.map((line): ContentLine => {
    if (
      line.kind === "operation" &&
      hasAttributes &&
      !operationSectionStarted
    ) {
      y += 12;
      operationSectionStarted = true;
    }
    const positioned = { ...line, y };
    y += 18;
    return positioned;
  });
  return {
    lines,
    height: Math.max(62, (lines.at(-1)?.y ?? 48) + 14),
  };
};
