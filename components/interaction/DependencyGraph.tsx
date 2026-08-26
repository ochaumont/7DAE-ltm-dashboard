"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  Panel,
  BaseEdge,
  Handle,
  Position,
  MarkerType,
  applyNodeChanges,
  type Node,
  type Edge,
  type EdgeProps,
  type NodeChange,
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

/** Rounds a polyline's interior corners: each bend point becomes a quadratic
 * curve's control point, ending at the midpoint to the next point, instead of
 * a hard angle — the standard trick for smoothing a point list without
 * needing a spline library. */
function smoothPolylinePath(points: { x: number; y: number }[]): string {
  let path = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const midX = (curr.x + next.x) / 2;
    const midY = (curr.y + next.y) / 2;
    path += ` Q ${curr.x} ${curr.y} ${midX} ${midY}`;
  }
  const last = points[points.length - 1];
  path += ` L ${last.x} ${last.y}`;
  return path;
}

/** Draws the path ELK already computed (start point, its bend points, end
 * point) instead of a fixed-curvature bow — ELK's routing already accounts
 * for intervening cards, ours doesn't. Used for the "layered" algorithm. */
function ElkRoutedEdge({ data, markerEnd, style }: EdgeProps) {
  const d = data as unknown as ElkPathEdgeData;
  if (!d.points || d.points.length < 2) return null;
  const path = smoothPolylinePath(d.points);
  return <BaseEdge path={path} markerEnd={markerEnd} style={style} />;
}

const edgeTypes = { radial: RadialEdge, elkPath: ElkRoutedEdge };

/**
 * Direction of an edge as fed to ELK for layout purposes. This can differ
 * from the true semantic direction used for rendering (cf. `buildGraphStructure`,
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

/** Everything about an edge that ELK produces ONCE at layout time and doesn't
 * depend on where the nodes currently sit — the live endpoint coordinates are
 * recomputed on every drag instead (see `buildLiveEdges`), so a dragged card
 * never leaves its edges behind. `elkPoints` (when present, "layered" only)
 * keeps ELK's original obstacle-routed interior bend points; only its first
 * and last point get replaced with the live border points. */
type EdgeMeta = {
  id: string;
  source: string;
  target: string;
  kind: DependencyRelationKind;
  bend: number;
  elkPoints?: { x: number; y: number }[];
};

function widthFor(nodeId: string): number {
  return nodeId === "hub" ? HUB_W : NODE_W;
}

function buildGraphStructure(
  bench: LabTestMean,
  groups: RelationGroup[],
  resolve: (rel: DependencyRelation) => LabTestMean | null,
  positions: ElkPositions,
  algorithm: ElkAlgorithm,
  edgeSections: ElkEdgeSections,
): { nodes: Node[]; edgeMeta: EdgeMeta[] } {
  const nodes: Node[] = [
    {
      id: "hub",
      type: "card",
      position: positions.get("hub") ?? { x: 0, y: 0 },
      data: { label: bench.name, kind: "hub", resolved: bench } satisfies NodeData,
      selectable: false,
    },
  ];
  const edgeMeta: EdgeMeta[] = [];

  groups.forEach(({ kind, list }) => {
    list.forEach((rel, i) => {
      const nodeId = `${kind}:${rel.externalId}`;
      nodes.push({
        id: nodeId,
        type: "card",
        position: positions.get(nodeId) ?? { x: 0, y: 0 },
        data: { label: rel.name, kind, resolved: resolve(rel) } satisfies NodeData,
        selectable: false,
      });

      // "depends-on"/"shared-resource": the central bench needs this neighbor.
      // "supports": the neighbor depends on the central bench. The rendered
      // arrow always follows this real direction, regardless of `algorithm`
      // — only how the edge is ROUTED (straight bow vs ELK's path) changes.
      const [source, target] =
        kind === "supports" ? [nodeId, "hub"] : ["hub", nodeId];
      const edgeId = `${source}->${target}`;

      // ELK's own routing is only used for "layered" — its radial algorithm
      // was tried too (see `useElkLayout`) but only ever returns a straight
      // 2-point section, so radial keeps drawing its own bow curve.
      const section = algorithm === "layered" ? edgeSections.get(edgeId) : undefined;

      edgeMeta.push({
        id: edgeId,
        source,
        target,
        kind,
        bend: i % 2 === 0 ? 1 : -1,
        elkPoints: section && section.length >= 2 ? section : undefined,
      });
    });
  });

  return { nodes, edgeMeta };
}

/** Recomputes every edge's actual path from the CURRENT node positions (which
 * may have been dragged away from where ELK originally put them) — this is
 * what keeps edges attached to their cards while the user repositions them. */
function buildLiveEdges(
  edgeMeta: EdgeMeta[],
  nodePositions: Map<string, { x: number; y: number }>,
): Edge[] {
  const centerOf = (id: string) => {
    const pos = nodePositions.get(id);
    if (!pos) return null;
    return { x: pos.x + widthFor(id) / 2, y: pos.y + CARD_H / 2 };
  };

  const result: Edge[] = [];
  edgeMeta.forEach((meta) => {
    const sourceCenter = centerOf(meta.source);
    const targetCenter = centerOf(meta.target);
    if (!sourceCenter || !targetCenter) return;

    const sourceBorder = borderPoint(
      sourceCenter.x,
      sourceCenter.y,
      widthFor(meta.source),
      CARD_H,
      targetCenter.x,
      targetCenter.y,
    );
    const targetBorder = borderPoint(
      targetCenter.x,
      targetCenter.y,
      widthFor(meta.target),
      CARD_H,
      sourceCenter.x,
      sourceCenter.y,
    );

    const style = { stroke: `var(--color-graph-${meta.kind})`, strokeWidth: 2 };
    const markerEnd = {
      type: MarkerType.ArrowClosed,
      color: `var(--color-graph-${meta.kind})`,
    };

    if (meta.elkPoints) {
      const points = [...meta.elkPoints];
      points[0] = sourceBorder;
      points[points.length - 1] = targetBorder;
      result.push({
        id: meta.id,
        source: meta.source,
        target: meta.target,
        type: "elkPath",
        data: { kind: meta.kind, points } satisfies ElkPathEdgeData,
        style,
        markerEnd,
      });
      return;
    }

    result.push({
      id: meta.id,
      source: meta.source,
      target: meta.target,
      type: "radial",
      data: {
        sx: sourceBorder.x,
        sy: sourceBorder.y,
        tx: targetBorder.x,
        ty: targetBorder.y,
        bend: meta.bend,
        kind: meta.kind,
      } satisfies EdgeData,
      style,
      markerEnd,
    });
  });
  return result;
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

  const { nodes: rawNodes, edgeMeta } = useMemo(() => {
    if (layout.status !== "ok") return { nodes: [] as Node[], edgeMeta: [] as EdgeMeta[] };
    return buildGraphStructure(
      bench,
      groups,
      resolve,
      layout.positions,
      algorithm,
      layout.edgeSections,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bench, groups, byExternalId, layout, algorithm]);

  // `nodes` is the array actually fed to React Flow, kept as real state (not
  // re-derived from `rawNodes` on every render) so dragging can patch it via
  // `applyNodeChanges` — that helper reuses the SAME object reference for
  // every node that didn't change, only creating a new one for the node
  // being dragged. Rebuilding the whole array with `.map()` on every drag
  // frame (as an earlier version did) made every card look "new" to React
  // Flow, forcing a re-measure of all of them each frame — that's what was
  // flickering.
  const [nodes, setNodes] = useState<Node[]>([]);

  const isHiddenFor = useCallback(
    (n: Node) => {
      const data = n.data as unknown as NodeData;
      return data.kind !== "hub" && hidden[data.kind];
    },
    [hidden],
  );

  // New ELK layout (new bench or algorithm) → replace the whole array.
  useEffect(() => {
    setNodes(
      rawNodes.map((n) => ({ ...n, hidden: isHiddenFor(n), style: { cursor: "pointer" } })),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawNodes]);

  // Legend toggle → patch only the nodes whose visibility actually flips,
  // same reference-preserving idea as the drag path below.
  useEffect(() => {
    setNodes((current) =>
      current.map((n) => {
        const shouldHide = isHiddenFor(n);
        return n.hidden === shouldHide ? n : { ...n, hidden: shouldHide };
      }),
    );
  }, [isHiddenFor]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((current) => applyNodeChanges(changes, current));
  }, []);

  const nodePositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    nodes.forEach((n) => map.set(n.id, n.position));
    return map;
  }, [nodes]);

  const rawEdges = useMemo(
    () => buildLiveEdges(edgeMeta, nodePositions),
    [edgeMeta, nodePositions],
  );

  const edges = useMemo(
    () =>
      rawEdges.map((e) => {
        const data = e.data as unknown as { kind: DependencyRelationKind };
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
        nodesDraggable
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
        onNodesChange={onNodesChange}
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
