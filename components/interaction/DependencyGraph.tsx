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
import NodeContextMenu, { type NodeContextMenuTarget } from "./NodeContextMenu";
import SaveLoadControls from "./SaveLoadControls";
import {
  useElkLayout,
  type ElkAlgorithm,
  type ElkEdgeSections,
  type ElkPositions,
} from "./useElkLayout";
import {
  deleteSave,
  listSaves,
  loadSave,
  writeSave,
  type InteractionSave,
} from "@/lib/interactionSaves";

type Props = {
  bench: LabTestMean;
  allBenches: LabTestMean[];
  onRequestBench: (bench: LabTestMean) => void;
};

/**
 * A node's id is the bench's own `externalId` (the root included) — NOT
 * prefixed by relation kind. That's what makes "one bench = one node" hold
 * once the graph can grow transitively via the context menu: the same bench
 * can be reached as a `depends-on` target from one node and a `supports`
 * source from another, so kind can no longer be a property of the NODE —
 * only of the EDGE that reaches it. Non-root cards are therefore visually
 * neutral; only the root keeps its distinct accent styling.
 */
type NodeData = {
  label: string;
  isRoot: boolean;
  resolved: LabTestMean | null;
};

/**
 * Business rule: an "A depends-on B" relation always exists as a mirrored
 * "B supports A" on the other bench — the backend maintains both ends of the
 * very same fact. Drawing them as two differently-colored edges would make it
 * look like two facts, so both collapse into one visual/edge-identity bucket
 * here. Only the arrow direction (dependent -> dependency) carries meaning;
 * `shared-resource` is a genuinely distinct relation and stays separate.
 */
export type EdgeColorKind = "depends-on" | "shared-resource";

function canonicalKind(kind: DependencyRelationKind): EdgeColorKind {
  return kind === "shared-resource" ? "shared-resource" : "depends-on";
}

type EdgeData = {
  sx: number;
  sy: number;
  tx: number;
  ty: number;
  bend: number;
  kind: EdgeColorKind;
};

type ElkPathEdgeData = {
  kind: EdgeColorKind;
  points: { x: number; y: number }[];
};

const HUB_W = 250;
const NODE_W = 200;
// Same height for every card (root included) — only the width differs, so
// the root reads as visually larger without the grid looking inconsistent.
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
  const width = data.isRoot ? HUB_W : NODE_W;
  const colorVar = data.isRoot ? "var(--color-accent)" : "var(--color-border)";
  return (
    <div
      className="flex flex-col justify-center overflow-hidden rounded-card border bg-surface px-3 py-2 shadow-sm transition-opacity"
      style={{
        width,
        height: CARD_H,
        borderColor: colorVar,
        borderWidth: data.isRoot ? 2 : 1.5,
      }}
    >
      <Handle type="source" position={Position.Left} style={{ visibility: "hidden" }} />
      <Handle type="source" position={Position.Right} style={{ visibility: "hidden" }} />
      <Handle type="target" position={Position.Left} style={{ visibility: "hidden" }} />
      <Handle type="target" position={Position.Right} style={{ visibility: "hidden" }} />
      <div
        className="truncate font-mono text-sm font-semibold"
        title={data.label}
        style={{ color: data.isRoot ? colorVar : undefined }}
      >
        {truncateLabel(data.label)}
      </div>
      {data.resolved ? (
        <div className="mt-0.5 truncate text-xs text-muted">
          {data.resolved.type} · {data.resolved.location.city}
        </div>
      ) : (
        <div className="mt-0.5 text-xs text-muted">Not in catalogue</div>
      )}
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
 * - `radial`: every edge is normalized to `root -> neighbor`. Feeding ELK the
 *   mixed real direction (some in, some out) made the root's role as root
 *   ambiguous — the radial algorithm couldn't reliably tell it apart from
 *   any other node, which is what produced erratic distances/positions.
 * - `layered`: the real direction is kept (`supports` -> root, others ->
 *   neighbor), because that's exactly what makes the layered algorithm split
 *   the graph into meaningful columns (supporters on one side, dependencies
 *   on the other) instead of dumping every neighbor into a single column.
 */
function elkEdgeDirection(
  kind: DependencyRelationKind,
  rootId: string,
  nodeId: string,
  algorithm: ElkAlgorithm,
): [string, string] {
  if (algorithm === "radial") return [rootId, nodeId];
  return kind === "supports" ? [nodeId, rootId] : [rootId, nodeId];
}

/** Structure only (ids + sizes + edges) — no positions. ELK computes those.
 * Only used for the INITIAL graph (root + its direct relations); nodes added
 * later via the context menu are placed locally (see `placeNewNode`) rather
 * than re-running ELK, so an expansion never disturbs existing positions. */
function toElkGraph(
  rootId: string,
  groups: RelationGroup[],
  algorithm: ElkAlgorithm,
): ElkNode {
  const children: ElkNode[] = [{ id: rootId, width: HUB_W, height: CARD_H }];
  const edges: ElkNode["edges"] = [];

  groups.forEach(({ kind, list }) => {
    list.forEach((rel) => {
      if (rel.externalId === rootId) return; // self-reference
      children.push({ id: rel.externalId, width: NODE_W, height: CARD_H });
      const [source, target] = elkEdgeDirection(kind, rootId, rel.externalId, algorithm);
      edges!.push({
        id: `${canonicalKind(kind)}:${source}->${target}`,
        sources: [source],
        targets: [target],
      });
    });
  });

  return { id: "root", children, edges };
}

/** Everything about an edge that doesn't depend on where its nodes currently
 * sit — the live endpoint coordinates are recomputed from current positions
 * instead (see `buildLiveEdges`), so a dragged card never leaves its edges
 * behind. `elkPoints` (when present, "layered" only) keeps ELK's original
 * obstacle-routed interior bend points; only its first and last point get
 * replaced with the live border points. */
type EdgeMeta = {
  id: string;
  source: string;
  target: string;
  kind: EdgeColorKind;
  bend: number;
  elkPoints?: { x: number; y: number }[];
};

function widthFor(nodeId: string, rootId: string): number {
  return nodeId === rootId ? HUB_W : NODE_W;
}

function buildGraphStructure(
  bench: LabTestMean,
  groups: RelationGroup[],
  resolve: (rel: DependencyRelation) => LabTestMean | null,
  positions: ElkPositions,
  algorithm: ElkAlgorithm,
  edgeSections: ElkEdgeSections,
): { nodes: Node[]; edgeMeta: EdgeMeta[] } {
  const rootId = bench.externalId;
  const nodes: Node[] = [
    {
      id: rootId,
      type: "card",
      position: positions.get(rootId) ?? { x: 0, y: 0 },
      data: { label: bench.name, isRoot: true, resolved: bench } satisfies NodeData,
      selectable: false,
    },
  ];
  const edgeMeta: EdgeMeta[] = [];

  groups.forEach(({ kind, list }) => {
    list.forEach((rel, i) => {
      if (rel.externalId === rootId) return; // self-reference
      nodes.push({
        id: rel.externalId,
        type: "card",
        position: positions.get(rel.externalId) ?? { x: 0, y: 0 },
        data: { label: rel.name, isRoot: false, resolved: resolve(rel) } satisfies NodeData,
        selectable: false,
      });

      // "depends-on"/"shared-resource": the spawning bench needs this
      // neighbor. "supports": the neighbor depends on the spawning bench.
      // The rendered arrow always follows this real direction, regardless of
      // `algorithm` — only how the edge is ROUTED (bow vs ELK's path) changes.
      const [source, target] =
        kind === "supports" ? [rel.externalId, rootId] : [rootId, rel.externalId];
      const edgeId = `${canonicalKind(kind)}:${source}->${target}`;

      // ELK's own routing is only used for "layered" — its radial algorithm
      // was tried too (see `useElkLayout`) but only ever returns a straight
      // 2-point section, so radial keeps drawing its own bow curve.
      const section = algorithm === "layered" ? edgeSections.get(edgeId) : undefined;

      edgeMeta.push({
        id: edgeId,
        source,
        target,
        kind: canonicalKind(kind),
        bend: i % 2 === 0 ? 1 : -1,
        elkPoints: section && section.length >= 2 ? section : undefined,
      });
    });
  });

  return { nodes, edgeMeta };
}

/** Recomputes every edge's actual path from the CURRENT node positions (which
 * may have been dragged away from where they were originally placed) — this
 * is what keeps edges attached to their cards while the user repositions
 * them. */
function buildLiveEdges(
  edgeMeta: EdgeMeta[],
  nodePositions: Map<string, { x: number; y: number }>,
  rootId: string,
): Edge[] {
  const centerOf = (id: string) => {
    const pos = nodePositions.get(id);
    if (!pos) return null;
    return { x: pos.x + widthFor(id, rootId) / 2, y: pos.y + CARD_H / 2 };
  };

  const result: Edge[] = [];
  edgeMeta.forEach((meta) => {
    const sourceCenter = centerOf(meta.source);
    const targetCenter = centerOf(meta.target);
    if (!sourceCenter || !targetCenter) return;

    const sourceBorder = borderPoint(
      sourceCenter.x,
      sourceCenter.y,
      widthFor(meta.source, rootId),
      CARD_H,
      targetCenter.x,
      targetCenter.y,
    );
    const targetBorder = borderPoint(
      targetCenter.x,
      targetCenter.y,
      widthFor(meta.target, rootId),
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

function rectsOverlap(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): boolean {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

/** Places a node added by a context-menu expansion near the node that spawned
 * it, WITHOUT running ELK again — that's what guarantees an expansion never
 * moves anything already on screen (including a card the user dragged).
 * `depends-on`/`shared-resource` fan out to the right of the spawner,
 * `supports` to the left — the same column convention the "layered" ELK
 * layout already uses. A small nudge-down loop avoids landing on top of an
 * already-placed card. */
function placeNewNode(
  spawnerPos: { x: number; y: number },
  index: number,
  count: number,
  kind: DependencyRelationKind,
  existing: Node[],
  rootId: string,
): { x: number; y: number } {
  const direction = kind === "supports" ? -1 : 1;
  const gapX = 280;
  const gapY = 90;
  let x = spawnerPos.x + direction * gapX;
  let y = spawnerPos.y + (index - (count - 1) / 2) * gapY;

  let guard = 0;
  while (
    existing.some((n) =>
      rectsOverlap(
        { x, y, w: NODE_W, h: CARD_H },
        { x: n.position.x, y: n.position.y, w: widthFor(n.id, rootId), h: CARD_H },
      ),
    ) &&
    guard < 30
  ) {
    y += CARD_H + 20;
    guard++;
  }
  return { x, y };
}

const ALGORITHM_LABELS: Record<ElkAlgorithm, string> = {
  layered: "Layered",
  radial: "Radial",
};

export default function DependencyGraph({ bench, allBenches, onRequestBench }: Props) {
  const [hidden, setHidden] = useState<Record<EdgeColorKind, boolean>>({
    "depends-on": false,
    "shared-resource": false,
  });
  const [preview, setPreview] = useState<PreviewTarget | null>(null);
  const [algorithm, setAlgorithm] = useState<ElkAlgorithm>("layered");
  const [contextMenu, setContextMenu] = useState<NodeContextMenuTarget | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const rootId = bench.externalId;

  const byExternalId = useMemo(() => {
    const map = new Map<string, LabTestMean>();
    allBenches.forEach((m) => map.set(m.externalId, m));
    return map;
  }, [allBenches]);

  const resolveBench = useCallback(
    (id: string) => (id === rootId ? bench : byExternalId.get(id) ?? null),
    [bench, rootId, byExternalId],
  );
  const resolve = (rel: DependencyRelation) => byExternalId.get(rel.externalId) ?? null;

  const groups = useMemo(() => relationGroups(bench), [bench]);
  const elkGraph = useMemo(
    () => toElkGraph(rootId, groups, algorithm),
    [rootId, groups, algorithm],
  );
  const layout = useElkLayout(elkGraph, algorithm);

  const { nodes: rawNodes, edgeMeta: rawEdgeMeta } = useMemo(() => {
    // `layout.algorithm` must also match: right after `setAlgorithm(...)`,
    // React re-renders this component before `useElkLayout`'s own effect has
    // had a chance to flip its state to "loading" for the new algorithm — for
    // that one render, `layout` is still the PREVIOUS algorithm's `"ok"`
    // result. Without this check, this memo would recompute using stale
    // positions/edgeSections paired with the already-updated `algorithm`
    // value, producing a mismatched-but-"ok"-flagged result that the effect
    // below would treat as ready, consuming `pendingLoadRef` a render too
    // early.
    if (layout.status !== "ok" || layout.algorithm !== algorithm) {
      return { nodes: [] as Node[], edgeMeta: [] as EdgeMeta[] };
    }
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

  // `nodes`/`edgeMeta` are real state (not derived), so the context-menu
  // expansion/hide actions can mutate them directly, and dragging can patch
  // `nodes` via `applyNodeChanges` — that helper reuses the SAME object
  // reference for every node that didn't change, only creating a new one for
  // the node being touched. Rebuilding the whole array with `.map()` on every
  // change makes every card look "new" to React Flow, forcing a re-measure
  // of all of them each time — that's what caused earlier flicker on drag.
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edgeMeta, setEdgeMeta] = useState<EdgeMeta[]>([]);

  // Save/Load bookkeeping. `pendingLoadRef` carries a save across the
  // bench/algorithm change it may have triggered (see `handleLoadSave`) until
  // the ELK-reset effect below sees the matching bench and applies it instead
  // of the freshly-computed ELK layout. `isBaselineUpdateRef` distinguishes a
  // programmatic reset (new ELK layout, or a load) from a user-driven edit
  // (drag, expand, hide) for the purposes of the "unsaved changes" indicator.
  const pendingLoadRef = useRef<InteractionSave | null>(null);
  const isBaselineUpdateRef = useRef(false);
  const [activeSaveName, setActiveSaveName] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [saveVersion, setSaveVersion] = useState(0);
  const [saveError, setSaveError] = useState<string | null>(null);
  // `saveVersion` is a pure refresh trigger — bumped after writeSave/deleteSave
  // so this recomputes, even though `listSaves()` itself doesn't read it.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saves = useMemo(() => listSaves(), [saveVersion]);

  const applyLoadedSave = useCallback(
    (save: InteractionSave) => {
      isBaselineUpdateRef.current = true;
      setNodes(
        save.nodes.map((n) => {
          const resolved = byExternalId.get(n.id) ?? null;
          return {
            id: n.id,
            type: "card",
            position: { x: n.x, y: n.y },
            data: {
              label: resolved?.name ?? n.id,
              isRoot: n.id === save.rootExternalId,
              resolved,
            } satisfies NodeData,
            selectable: false,
            style: { cursor: "pointer" },
          };
        }),
      );
      setEdgeMeta(
        save.edges.map((e, i) => ({
          id: `${e.kind}:${e.source}->${e.target}`,
          source: e.source,
          target: e.target,
          kind: e.kind,
          bend: i % 2 === 0 ? 1 : -1,
        })),
      );
    },
    [byExternalId],
  );

  // New ELK layout (new bench or algorithm) → replace the whole graph, UNLESS
  // a `Load` is in flight for this exact bench, in which case its saved
  // nodes/edges are applied instead of the freshly-computed ELK layout — this
  // is what lets `Load` switch to a different root bench without the newly
  // selected bench's default layout flashing in first.
  //
  // Guarded on `layout.status === "ok" && layout.algorithm === algorithm`:
  // while ELK is (re)computing, or during the one-render window where
  // `layout` still reflects the PREVIOUS algorithm (see the comment on the
  // `rawNodes`/`rawEdgeMeta` memo above), this effect would otherwise fire on
  // a stale/empty intermediate result — consuming and clearing
  // `pendingLoadRef` right there, then firing AGAIN once the real computation
  // resolves with the plain 1-hop layout, silently overwriting the
  // just-restored save with it. That race is what made a loaded save that
  // also changes bench/algorithm appear to drop every expanded node.
  useEffect(() => {
    if (layout.status !== "ok" || layout.algorithm !== algorithm) return;
    const pending = pendingLoadRef.current;
    if (pending && pending.rootExternalId === bench.externalId) {
      pendingLoadRef.current = null;
      applyLoadedSave(pending);
      return;
    }
    // A plain bench/algorithm change unrelated to any save starts a fresh,
    // unsaved diagram.
    isBaselineUpdateRef.current = true;
    setNodes(rawNodes.map((n) => ({ ...n, style: { cursor: "pointer" } })));
    setEdgeMeta(rawEdgeMeta);
    setActiveSaveName(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawNodes, rawEdgeMeta, layout.status, layout.status === "ok" ? layout.algorithm : null]);

  // Any change to the displayed graph that wasn't one of the baseline resets
  // above (i.e. a drag, an expansion, or a hide) means there are unsaved
  // changes relative to the active save.
  useEffect(() => {
    if (isBaselineUpdateRef.current) {
      isBaselineUpdateRef.current = false;
      setDirty(false);
      return;
    }
    setDirty(true);
  }, [nodes, edgeMeta]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((current) => applyNodeChanges(changes, current));
  }, []);

  const handleExpand = useCallback(
    (nodeId: string, kind: "depends-on" | "supports") => {
      const spawner = resolveBench(nodeId);
      if (!spawner) return;
      const list = kind === "depends-on" ? spawner.dependsOn : spawner.supports;
      const relevant = list.filter((rel) => rel.externalId !== nodeId);
      if (relevant.length === 0) return;

      setNodes((current) => {
        const existingIds = new Set(current.map((n) => n.id));
        const spawnerNode = current.find((n) => n.id === nodeId);
        if (!spawnerNode) return current;
        const toAdd = relevant.filter((rel) => !existingIds.has(rel.externalId));
        const additions = toAdd.map((rel, i) => ({
          id: rel.externalId,
          type: "card",
          position: placeNewNode(
            spawnerNode.position,
            i,
            toAdd.length,
            kind,
            [...current],
            rootId,
          ),
          data: {
            label: rel.name,
            isRoot: false,
            resolved: resolveBench(rel.externalId),
          } satisfies NodeData,
          selectable: false,
          style: { cursor: "pointer" },
        }));
        return additions.length > 0 ? [...current, ...additions] : current;
      });

      setEdgeMeta((current) => {
        const existingIds = new Set(current.map((e) => e.id));
        const additions: EdgeMeta[] = [];
        relevant.forEach((rel, i) => {
          const [source, target] =
            kind === "supports" ? [rel.externalId, nodeId] : [nodeId, rel.externalId];
          const edgeId = `${canonicalKind(kind)}:${source}->${target}`;
          if (existingIds.has(edgeId)) return;
          additions.push({
            id: edgeId,
            source,
            target,
            kind: canonicalKind(kind),
            bend: i % 2 === 0 ? 1 : -1,
          });
        });
        return additions.length > 0 ? [...current, ...additions] : current;
      });
    },
    [resolveBench, rootId],
  );

  const handleHide = useCallback(
    (nodeId: string) => {
      if (nodeId === rootId) return; // the root anchors the whole diagram
      setNodes((current) => current.filter((n) => n.id !== nodeId));
      setEdgeMeta((current) =>
        current.filter((e) => e.source !== nodeId && e.target !== nodeId),
      );
    },
    [rootId],
  );

  const buildSnapshot = useCallback(
    (): InteractionSave => ({
      version: 1,
      rootExternalId: rootId,
      algorithm,
      nodes: nodes.map((n) => ({ id: n.id, x: n.position.x, y: n.position.y })),
      edges: edgeMeta.map((e) => ({ source: e.source, target: e.target, kind: e.kind })),
      savedAt: new Date().toISOString(),
    }),
    [rootId, algorithm, nodes, edgeMeta],
  );

  const handleSaveAs = useCallback(
    (name: string) => {
      const ok = writeSave(name, buildSnapshot());
      if (!ok) {
        setSaveError("Could not save (storage unavailable or full).");
        return;
      }
      setSaveError(null);
      setActiveSaveName(name);
      setDirty(false);
      setSaveVersion((v) => v + 1);
    },
    [buildSnapshot],
  );

  const handleSave = useCallback(() => {
    if (!activeSaveName) return; // SaveLoadControls routes this to Save-as instead
    handleSaveAs(activeSaveName);
  }, [activeSaveName, handleSaveAs]);

  const handleLoadSave = useCallback(
    (name: string) => {
      const save = loadSave(name);
      if (!save) {
        setSaveError("This save could not be read.");
        return;
      }
      const rootBench = byExternalId.get(save.rootExternalId);
      if (!rootBench) {
        setSaveError("This save's root bench no longer exists in the catalogue.");
        return;
      }
      setSaveError(null);

      const benchChanging = rootBench.externalId !== bench.externalId;
      const algoChanging = save.algorithm !== algorithm;

      if (benchChanging || algoChanging) {
        // Applied once the resulting ELK-reset effect sees the matching bench.
        pendingLoadRef.current = save;
        if (algoChanging) setAlgorithm(save.algorithm);
        if (benchChanging) onRequestBench(rootBench);
      } else {
        applyLoadedSave(save);
      }
      setActiveSaveName(name);
      setDirty(false);
    },
    [byExternalId, bench, algorithm, onRequestBench, applyLoadedSave],
  );

  const handleDeleteSave = useCallback(
    (name: string) => {
      deleteSave(name);
      if (activeSaveName === name) {
        setActiveSaveName(null);
        setDirty(false);
      }
      setSaveVersion((v) => v + 1);
    },
    [activeSaveName],
  );

  const nodePositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    nodes.forEach((n) => map.set(n.id, n.position));
    return map;
  }, [nodes]);

  const rawEdges = useMemo(
    () => buildLiveEdges(edgeMeta, nodePositions, rootId),
    [edgeMeta, nodePositions, rootId],
  );

  const edges = useMemo(
    () =>
      rawEdges.map((e) => {
        const data = e.data as unknown as { kind: EdgeColorKind };
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

  // "depends-on" and "supports" are the same fact viewed from either end (cf.
  // `canonicalKind`), so their counts merge into one legend entry.
  const counts: Record<EdgeColorKind, number> = {
    "depends-on": bench.dependsOn.length + bench.supports.length,
    "shared-resource": bench.sharedResources.length,
  };

  const hasRelations = counts["depends-on"] + counts["shared-resource"] > 0;

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
          setPreview({ label: data.label, isRoot: data.isRoot, resolved: data.resolved });
        }}
        onNodeContextMenu={(event, n) => {
          event.preventDefault();
          const wrapRect = containerRef.current?.getBoundingClientRect();
          const resolved = resolveBench(n.id);
          setContextMenu({
            nodeId: n.id,
            x: event.clientX - (wrapRect?.left ?? 0),
            y: event.clientY - (wrapRect?.top ?? 0),
            canExpandDependsOn: !!resolved && resolved.dependsOn.length > 0,
            canExpandSupports: !!resolved && resolved.supports.length > 0,
            canHide: n.id !== rootId,
          });
        }}
      >
        <Background />
        <Controls showInteractive={false} />
        <Panel position="top-right">
          <div className="flex items-center gap-1.5">
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
            <SaveLoadControls
              activeSaveName={activeSaveName}
              dirty={dirty}
              saves={saves}
              errorMessage={saveError}
              onSaveAs={handleSaveAs}
              onSave={handleSave}
              onLoad={handleLoadSave}
              onDelete={handleDeleteSave}
            />
          </div>
        </Panel>
      </ReactFlow>
      <DependencyLegend
        counts={counts}
        hidden={hidden}
        onToggle={(kind) => setHidden((h) => ({ ...h, [kind]: !h[kind] }))}
      />
      <BenchPreviewModal target={preview} onClose={() => setPreview(null)} />
      <NodeContextMenu
        target={contextMenu}
        onExpandDependsOn={(id) => handleExpand(id, "depends-on")}
        onExpandSupports={(id) => handleExpand(id, "supports")}
        onHide={handleHide}
        onClose={() => setContextMenu(null)}
      />
    </div>
  );
}
