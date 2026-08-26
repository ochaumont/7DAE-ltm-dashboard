"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  BaseEdge,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge,
  type EdgeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { ElkNode } from "elkjs/lib/elk.bundled.js";
import type {
  DependencyRelation,
  DependencyRelationKind,
  LabTestMean,
} from "@/lib/types";
import DependencyLegend from "./DependencyLegend";
import InteractionEmptyState from "./InteractionEmptyState";
import BenchPreviewModal, { type PreviewTarget } from "./BenchPreviewModal";
import {
  useElkLayout,
  type ElkAlgorithm,
  type ElkEdgeSections,
  type ElkPositions,
} from "./useElkLayout";

type Props = { bench: LabTestMean; allBenches: LabTestMean[] };

type NodeData = {
  label: string;
  kind: DependencyRelationKind | "hub";
  resolved: LabTestMean | null;
};

type EdgeData = {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  bend: number;
  kind: DependencyRelationKind;
};

type ElkPathEdgeData = {
  kind: DependencyRelationKind;
  points: { x: number; y: number }[];
};

const HUB_W = 250;
const NODE_W = 200;
// Same height for every card (hub included) — only the width differs, so the
// hub reads as visually larger without the grid looking inconsistent.
const CARD_H = 60;

type RelationGroup = { kind: DependencyRelationKind; list: DependencyRelation[] };

function relationGroups(bench: LabTestMean): RelationGroup[] {
  return [
    { kind: "depends-on", list: bench.dependsOn },
    { kind: "supports", list: bench.supports },
    { kind: "shared-resource", list: bench.sharedResources },
  ];
}

/** Point where the segment from a rectangle's center toward `(towardX, towardY)`
 * exits the rectangle — used so edges stop at the card's border instead of its
 * center (which sits hidden underneath the opaque card either way). */
function borderPoint(
  cx: number,
  cy: number,
  w: number,
  h: number,
  towardX: number,
  towardY: number,
) {
  const dx = towardX - cx;
  const dy = towardY - cy;
  if (dx === 0 && dy === 0) return { x: cx, y: cy };
  const halfW = w / 2;
  const halfH = h / 2;
  const scaleX = dx !== 0 ? halfW / Math.abs(dx) : Infinity;
  const scaleY = dy !== 0 ? halfH / Math.abs(dy) : Infinity;
  const scale = Math.min(scaleX, scaleY);
  return { x: cx + dx * scale, y: cy + dy * scale };
}

const LABEL_MAX_CHARS = 20;
const LABEL_TRUNCATED_CHARS = 17;

/** Fixed-length label so every card renders at the exact size ELK was told
 * to reserve for it — an auto-sized card (long text = wide box) would drift
 * from the box ELK/`borderPoint()` assumed, which is what made edges land
 * short of or past the real card border. */
function truncateLabel(label: string): string {
  return label.length > LABEL_MAX_CHARS
    ? `${label.slice(0, LABEL_TRUNCATED_CHARS)}...`
    : label;
}

function NodeCard({ data }: { data: NodeData }) {
  const isHub = data.kind === "hub";
  const width = isHub ? HUB_W : NODE_W;
  const colorVar = isHub ? "var(--color-accent)" : `var(--color-graph-${data.kind})`;
  return (
    <div
      className="flex flex-col justify-center overflow-hidden rounded-card border bg-surface px-3 py-2 shadow-sm transition-opacity"
      style={{
        width,
        height: CARD_H,
        borderColor: colorVar,
        borderWidth: isHub ? 2 : 1.5,
        background: data.kind === "shared-resource" ? "var(--surface-2)" : undefined,
      }}
    >
      <Handle type="source" position={Position.Left} style={{ visibility: "hidden" }} />
      <Handle type="source" position={Position.Right} style={{ visibility: "hidden" }} />
      <Handle type="target" position={Position.Left} style={{ visibility: "hidden" }} />
      <Handle type="target" position={Position.Right} style={{ visibility: "hidden" }} />
      <div
        className="truncate font-mono text-sm font-semibold"
        title={data.label}
        style={{ color: isHub ? colorVar : undefined }}
      >
        {truncateLabel(data.label)}
      </div>
      {data.resolved ? (
        <div className="mt-0.5 truncate text-xs text-muted">
          {data.resolved.type} · {data.resolved.location.city}
        </div>
      ) : data.kind !== "hub" ? (
        <div className="mt-0.5 text-xs text-muted">Not in catalogue</div>
      ) : null}
    </div>
  );
}

const nodeTypes = { card: NodeCard };

function RadialEdge({ data, markerEnd, style }: EdgeProps) {
  const d = data as unknown as EdgeData;
  const mx = (d.sx + d.tx) / 2;
  const my = (d.sy + d.ty) / 2;
  const dx = d.tx - d.sx;
  const dy = d.ty - d.sy;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const offset = len * 0.16 * d.bend;
  const cx = mx + nx * offset;
  const cy = my + ny * offset;
  const path = `M ${d.sx} ${d.sy} Q ${cx} ${cy} ${d.tx} ${d.ty}`;
  return <BaseEdge path={path} markerEnd={markerEnd} style={style} />;
}

/** Draws the path ELK already computed (start point, its bend points, end
 * point) instead of a fixed-curvature bow — ELK's routing already accounts
 * for intervening cards, ours doesn't. Used for the "layered" algorithm. */
function ElkRoutedEdge({ data, markerEnd, style }: EdgeProps) {
  const d = data as unknown as ElkPathEdgeData;
  if (!d.points || d.points.length < 2) return null;
  const [first, ...rest] = d.points;
  const path =
    `M ${first.x} ${first.y} ` + rest.map((p) => `L ${p.x} ${p.y}`).join(" ");
  return <BaseEdge path={path} markerEnd={markerEnd} style={style} />;
}

const edgeTypes = { radial: RadialEdge, elkPath: ElkRoutedEdge };

/**
 * Direction of an edge as fed to ELK for layout purposes. This can differ
 * from the true semantic direction used for rendering (cf. `toReactFlowGraph`,
 * which always uses the real direction regardless of algorithm):
 *
 * - `radial`: every edge is normalized to `hub -> neighbor`. Feeding ELK the
 *   mixed real direction (some in, some out) made the hub's role as root
 *   ambiguous — the radial algorithm couldn't reliably tell it apart from
 *   any other node, which is what produced erratic distances/positions.
 * - `layered`: the real direction is kept (`supports` -> hub, others ->
 *   neighbor), because that's exactly what makes the layered algorithm split
 *   the graph into meaningful columns (supporters on one side, dependencies
 *   on the other) instead of dumping every neighbor into a single column.
 */
function elkEdgeDirection(
  kind: DependencyRelationKind,
  nodeId: string,
  algorithm: ElkAlgorithm,
): [string, string] {
  if (algorithm === "radial") return ["hub", nodeId];
  return kind === "supports" ? [nodeId, "hub"] : ["hub", nodeId];
}

/** Structure only (ids + sizes + edges) — no positions. ELK computes those. */
function toElkGraph(groups: RelationGroup[], algorithm: ElkAlgorithm): ElkNode {
  const children: ElkNode[] = [{ id: "hub", width: HUB_W, height: CARD_H }];
  const edges: ElkNode["edges"] = [];

  groups.forEach(({ kind, list }) => {
    list.forEach((rel) => {
      const nodeId = `${kind}:${rel.externalId}`;
      children.push({ id: nodeId, width: NODE_W, height: CARD_H });
      const [source, target] = elkEdgeDirection(kind, nodeId, algorithm);
      edges!.push({
        id: `${source}->${target}`,
        sources: [source],
        targets: [target],
      });
    });
  });

  return { id: "root", children, edges };
}

function toReactFlowGraph(
  bench: LabTestMean,
  groups: RelationGroup[],
  resolve: (rel: DependencyRelation) => LabTestMean | null,
  positions: ElkPositions,
  algorithm: ElkAlgorithm,
  edgeSections: ElkEdgeSections,
): { nodes: Node[]; edges: Edge[] } {
  const hubPos = positions.get("hub") ?? { x: 0, y: 0 };
  const hubCenter = { x: hubPos.x + HUB_W / 2, y: hubPos.y + CARD_H / 2 };

  const nodes: Node[] = [
    {
      id: "hub",
      type: "card",
      position: hubPos,
      data: { label: bench.name, kind: "hub", resolved: bench } satisfies NodeData,
      draggable: false,
      selectable: false,
    },
  ];
  const edges: Edge[] = [];

  groups.forEach(({ kind, list }) => {
    list.forEach((rel, i) => {
      const nodeId = `${kind}:${rel.externalId}`;
      const pos = positions.get(nodeId) ?? { x: 0, y: 0 };
      nodes.push({
        id: nodeId,
        type: "card",
        position: pos,
        data: { label: rel.name, kind, resolved: resolve(rel) } satisfies NodeData,
        draggable: false,
        selectable: false,
      });

      const nodeCenter = { x: pos.x + NODE_W / 2, y: pos.y + CARD_H / 2 };
      const hubBorder = borderPoint(
        hubCenter.x,
        hubCenter.y,
        HUB_W,
        CARD_H,
        nodeCenter.x,
        nodeCenter.y,
      );
      const nodeBorder = borderPoint(
        nodeCenter.x,
        nodeCenter.y,
        NODE_W,
        CARD_H,
        hubCenter.x,
        hubCenter.y,
      );

      // "depends-on"/"shared-resource": the central bench needs this neighbor.
      // "supports": the neighbor depends on the central bench. The rendered
      // arrow always follows this real direction, regardless of `algorithm`
      // — only how the edge is ROUTED (straight bow vs ELK's path) changes.
      const [source, target, sPt, tPt] =
        kind === "supports"
          ? [nodeId, "hub", nodeBorder, hubBorder]
          : ["hub", nodeId, hubBorder, nodeBorder];
      const edgeId = `${source}->${target}`;
      const section = algorithm === "layered" ? edgeSections.get(edgeId) : undefined;

      edges.push(
        section && section.length >= 2
          ? {
              id: edgeId,
              source,
              target,
              type: "elkPath",
              data: { kind, points: section } satisfies ElkPathEdgeData,
              style: { stroke: `var(--color-graph-${kind})`, strokeWidth: 2 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: `var(--color-graph-${kind})`,
              },
            }
          : {
              id: edgeId,
              source,
              target,
              type: "radial",
              data: {
                sx: sPt.x,
                sy: sPt.y,
                tx: tPt.x,
                ty: tPt.y,
                bend: i % 2 === 0 ? 1 : -1,
                kind,
              } satisfies EdgeData,
              style: { stroke: `var(--color-graph-${kind})`, strokeWidth: 2 },
              markerEnd: {
                type: MarkerType.ArrowClosed,
                color: `var(--color-graph-${kind})`,
              },
            },
      );
    });
  });

  return { nodes, edges };
}

const EMPTY_HIDDEN: Record<DependencyRelationKind, boolean> = {
  "depends-on": false,
  supports: false,
  "shared-resource": false,
};

const ALGORITHM_LABELS: Record<ElkAlgorithm, string> = {
  layered: "Layered",
  radial: "Radial",
};

export default function DependencyGraph({ bench, allBenches }: Props) {
  const [hidden, setHidden] = useState(EMPTY_HIDDEN);
  const [preview, setPreview] = useState<PreviewTarget | null>(null);
  const [algorithm, setAlgorithm] = useState<ElkAlgorithm>("layered");
  const containerRef = useRef<HTMLDivElement>(null);

  const byExternalId = useMemo(() => {
    const map = new Map<string, LabTestMean>();
    allBenches.forEach((m) => map.set(m.externalId, m));
    return map;
  }, [allBenches]);

  const resolve = (rel: DependencyRelation) => byExternalId.get(rel.externalId) ?? null;

  const groups = useMemo(() => relationGroups(bench), [bench]);
  const elkGraph = useMemo(
    () => toElkGraph(groups, algorithm),
    [groups, algorithm],
  );
  const layout = useElkLayout(elkGraph, algorithm);

  const { nodes: rawNodes, edges: rawEdges } = useMemo(() => {
    if (layout.status !== "ok") return { nodes: [] as Node[], edges: [] as Edge[] };
    return toReactFlowGraph(
      bench,
      groups,
      resolve,
      layout.positions,
      algorithm,
      layout.edgeSections,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bench, groups, byExternalId, layout, algorithm]);

  // Only `hidden` (legend toggles) changes this — the hover fade below is
  // applied directly to the DOM instead, so passing brand-new node/edge
  // objects on every mouse move doesn't force React Flow to re-measure every
  // card (that remeasurement flash was the cause of the flicker on hover).
  const nodes = useMemo(
    () =>
      rawNodes.map((n) => {
        const data = n.data as unknown as NodeData;
        return {
          ...n,
          hidden: data.kind !== "hub" && hidden[data.kind],
          style: { cursor: "pointer" },
        };
      }),
    [rawNodes, hidden],
  );

  const edges = useMemo(
    () =>
      rawEdges.map((e) => {
        const data = e.data as unknown as EdgeData;
        return { ...e, hidden: hidden[data.kind] };
      }),
    [rawEdges, hidden],
  );

  const clearHover = useCallback(() => {
    containerRef.current
      ?.querySelectorAll(".rf-dim, .rf-emph")
      .forEach((el) => el.classList.remove("rf-dim", "rf-emph"));
  }, []);

  const handleNodeMouseEnter = useCallback(
    (_: unknown, node: Node) => {
      const root = containerRef.current;
      if (!root) return;
      const connected = new Set<string>([node.id]);
      rawEdges.forEach((e) => {
        if (e.source === node.id) connected.add(e.target);
        if (e.target === node.id) connected.add(e.source);
      });
      root.querySelectorAll<HTMLElement>(".react-flow__node").forEach((el) => {
        const id = el.getAttribute("data-id");
        el.classList.toggle("rf-dim", !!id && !connected.has(id));
      });
      root.querySelectorAll<SVGElement>(".react-flow__edge").forEach((el) => {
        const id = el.getAttribute("data-id");
        const isTouching = id
          ? rawEdges.some(
              (e) => e.id === id && (e.source === node.id || e.target === node.id),
            )
          : false;
        el.classList.toggle("rf-dim", !isTouching);
        el.classList.toggle("rf-emph", isTouching);
      });
    },
    [rawEdges],
  );

  const counts: Record<DependencyRelationKind, number> = {
    "depends-on": bench.dependsOn.length,
    supports: bench.supports.length,
    "shared-resource": bench.sharedResources.length,
  };

  const hasRelations = counts["depends-on"] + counts.supports + counts["shared-resource"] > 0;

  if (!hasRelations) {
    return <InteractionEmptyState reason="no-relations" />;
  }
  if (layout.status === "loading") {
    return <InteractionEmptyState reason="layout-loading" />;
  }
  if (layout.status === "error") {
    return <InteractionEmptyState reason="layout-error" />;
  }

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        deleteKeyCode={null}
        fitView
        // Cap the zoom so a compact layout (e.g. "layered", which packs
        // everything into 2 tight columns vs "radial" spreading nodes around
        // a wide circle) doesn't get blown up to fill the viewport — card
        // size should look the same regardless of which algorithm produced
        // the smaller bounding box.
        fitViewOptions={{ maxZoom: 1 }}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={clearHover}
        onNodeClick={(_, n) => {
          const data = n.data as unknown as NodeData;
          setPreview({ label: data.label, kind: data.kind, resolved: data.resolved });
        }}
      >
        <Background />
        <Controls showInteractive={false} />
        <Panel position="top-right">
          <label className="flex items-center gap-2 rounded-card border border-border bg-surface/90 px-2.5 py-1.5 text-xs text-muted backdrop-blur-md">
            Layout
            <select
              value={algorithm}
              onChange={(e) => setAlgorithm(e.target.value as ElkAlgorithm)}
              className="rounded border border-border bg-surface px-1.5 py-0.5 text-xs text-fg"
            >
              {(Object.keys(ALGORITHM_LABELS) as ElkAlgorithm[]).map((a) => (
                <option key={a} value={a}>
                  {ALGORITHM_LABELS[a]}
                </option>
              ))}
            </select>
          </label>
        </Panel>
      </ReactFlow>
      <DependencyLegend
        counts={counts}
        hidden={hidden}
        onToggle={(kind) => setHidden((h) => ({ ...h, [kind]: !h[kind] }))}
      />
      <BenchPreviewModal target={preview} onClose={() => setPreview(null)} />
    </div>
  );
}
