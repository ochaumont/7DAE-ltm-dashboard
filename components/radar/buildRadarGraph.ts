import type { DependencyRelationKind, LabTestMean } from "@/lib/types";

export type RadarNode = {
  id: string;
  label: string;
  angleDeg: number;
  x: number;
  y: number;
};

export type RadarEdge = {
  id: string;
  source: string;
  target: string;
  kind: DependencyRelationKind;
};

export function buildRadarGraph(
  visible: LabTestMean[],
  center: { x: number; y: number },
  radius: number,
): { nodes: RadarNode[]; edges: RadarEdge[] } {
  const n = visible.length;
  const nodes: RadarNode[] = visible.map((m, i) => {
    const angleDeg = (i / n) * 360 - 90;
    const rad = (angleDeg * Math.PI) / 180;
    return {
      id: m.externalId,
      label: m.name,
      angleDeg,
      x: center.x + radius * Math.cos(rad),
      y: center.y + radius * Math.sin(rad),
    };
  });

  const visibleIds = new Set(visible.map((m) => m.externalId));
  const edges: RadarEdge[] = [];

  const groups: { kind: DependencyRelationKind; getRelations: (m: LabTestMean) => LabTestMean["dependsOn"] }[] = [
    { kind: "depends-on", getRelations: (m) => m.dependsOn },
    { kind: "supports", getRelations: (m) => m.supports },
    { kind: "shared-resource", getRelations: (m) => m.sharedResources },
  ];

  visible.forEach((m) => {
    groups.forEach(({ kind, getRelations }) => {
      getRelations(m).forEach((rel, i) => {
        if (rel.externalId === m.externalId) return; // self-reference
        if (!visibleIds.has(rel.externalId)) return; // other end filtered out

        // "depends-on"/"shared-resource": m needs rel. "supports": rel needs m.
        const [source, target] =
          kind === "supports"
            ? [rel.externalId, m.externalId]
            : [m.externalId, rel.externalId];

        edges.push({
          id: `${kind}:${source}->${target}:${i}`,
          source,
          target,
          kind,
        });
      });
    });
  });

  return { nodes, edges };
}
