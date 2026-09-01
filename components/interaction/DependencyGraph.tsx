"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from "react";
import {
  ReactFlow,
  Background,
  Controls,
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
  LabTestMeanStatus,
} from "@/lib/types";
import DependencyLegend from "./DependencyLegend";
import InteractionEmptyState from "./InteractionEmptyState";
import BenchPreviewModal, { type PreviewTarget } from "./BenchPreviewModal";
import NodeContextMenu, { type NodeContextMenuTarget } from "./NodeContextMenu";
import { useElkLayout, type ElkPositions } from "./useElkLayout";
import { useInteractionDisplaySettings } from "@/lib/interactionDisplaySettings";
import {
  KickoffIcon,
  InServiceIcon,
  MothballedIcon,
  DismantledIcon,
} from "@/components/icons/LifecycleStepIcon";
import TypeIcon from "@/components/icons/TypeIcon";
import { TYPE_LABELS } from "@/lib/labels";
import type {
  InteractionSave,
  InteractionSaveEdge,
  InteractionSaveNode,
} from "@/lib/interactionSaves";

type Props = {
  benches: LabTestMean[];
  allBenches: LabTestMean[];
  onDirty: () => void;
  pendingLoad: InteractionSave | null;
  onPendingLoadConsumed: () => void;
};

export type DependencyGraphHandle = {
  getSnapshot: () => { nodes: InteractionSaveNode[]; edges: InteractionSaveEdge[] } | null;
  addBench: (bench: LabTestMean) => void;
  removeBench: (externalId: string) => void;
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

// Card width is user-configurable (see `useInteractionDisplaySettings` /
// "Box width" in `DisplaySettingsControl`); only height is fixed. Same size
// for every card, root included — a root is distinguished from a plain
// neighbor only by border thickness, not by a larger footprint.
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
  const scaleX = dx === 0 ? Infinity : halfW / Math.abs(dx);
  const scaleY = dy === 0 ? Infinity : halfH / Math.abs(dy);
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

// Same icon/color per status as the lifecycle timeline on the detail page
// (`STEPS` in `components/detail/LifecycleSection.tsx`), so the diagram reads
// consistently with the rest of the app: kickoff=accent, in-service=success,
// mothballed=warning, dismantled=danger.
const STATUS_ICON: Record<
  LabTestMeanStatus,
  { Icon: ComponentType<{ size?: number; className?: string }>; colorVar: string }
> = {
  "in-project": { Icon: KickoffIcon, colorVar: "var(--color-accent)" },
  operational: { Icon: InServiceIcon, colorVar: "var(--color-success)" },
  mothballed: { Icon: MothballedIcon, colorVar: "var(--color-warning)" },
  "out-of-service": { Icon: DismantledIcon, colorVar: "var(--color-danger)" },
};

// The card's border color is driven by the resolved bench's TYPE, not by its
// root/selected status — root vs. non-root is conveyed separately by border
// thickness. A "SHARE" bench gets the same color as "shared-resource" edges,
// so a resource node reads as visually tied to its relation type on sight; a
// node that doesn't resolve in the catalogue falls back to the neutral
// border color, same as any unresolved node always has.
function resolveNodeColorVar(data: NodeData): string {
  if (!data.resolved) return "var(--color-border)";
  if (data.resolved.type === "SHARE") return "var(--color-graph-shared-resource)";
  return "var(--color-accent)";
}

function NodeCard({ data }: Readonly<{ data: NodeData }>) {
  const displaySettings = useInteractionDisplaySettings();
  const width = displaySettings.nodeWidth;
  const colorVar = resolveNodeColorVar(data);
  return (
    <div
      className="relative flex flex-col justify-center rounded-card border bg-surface px-3 py-2 shadow-sm transition-opacity"
      style={{
        width,
        height: CARD_H,
        borderColor: colorVar,
        borderWidth: data.isRoot ? 2 : 1.5,
      }}
    >
      {data.resolved && displaySettings.showQualitySeal && (
        // Straddles the card's top border (translateY(-50%) off a `top-0`
        // anchor) rather than sitting inside the card, so it never overlaps
        // the bench name label underneath.
        <span
          className="absolute right-1 top-0 -translate-y-1/2 rounded px-1 py-px text-[0.55rem] font-semibold uppercase leading-tight tracking-wide"
          style={{
            background:
              data.resolved.lxState === "DRAFT" ? "var(--color-muted)" : "var(--color-success)",
            color: "var(--color-bg)",
          }}
        >
          {data.resolved.lxState}
        </span>
      )}
      {data.resolved &&
        displaySettings.showStatus &&
        (() => {
          const resolved = data.resolved;
          const { Icon, colorVar: statusColorVar } = STATUS_ICON[resolved.status];
          return (
            <span
              className="absolute bottom-1 right-1"
              style={{ color: statusColorVar }}
              title={resolved.status}
            >
              <Icon size={14} />
            </span>
          );
        })()}
      <Handle type="source" position={Position.Left} style={{ visibility: "hidden" }} />
      <Handle type="source" position={Position.Right} style={{ visibility: "hidden" }} />
      <Handle type="target" position={Position.Left} style={{ visibility: "hidden" }} />
      <Handle type="target" position={Position.Right} style={{ visibility: "hidden" }} />
      <div
        className="truncate font-mono text-sm font-semibold"
        title={data.label}
        // Label color stays root-only (unlike the border above) — only the
        // frame is meant to carry the type color, per spec.
        style={{ color: data.isRoot ? colorVar : undefined }}
      >
        {truncateLabel(data.label)}
      </div>
      {data.resolved ? (
        (() => {
          const resolved = data.resolved;
          const textSegments = [
            displaySettings.showCity ? resolved.location.city : null,
            displaySettings.showBuilding ? resolved.location.building : null,
            displaySettings.showRoom ? resolved.location.room : null,
          ].filter((s): s is string => !!s && s.length > 0);
          if (!displaySettings.showType && textSegments.length === 0) return null;
          return (
            <div className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted">
              {displaySettings.showType && (
                <span title={TYPE_LABELS[resolved.type]} className="shrink-0">
                  <TypeIcon type={resolved.type} className="shrink-0" />
                </span>
              )}
              {textSegments.length > 0 && <span className="truncate">{textSegments.join(" · ")}</span>}
            </div>
          );
        })()
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
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const offset = len * 0.16 * d.bend;
  const cx = mx + nx * offset;
  const cy = my + ny * offset;
  const path = `M ${d.sx} ${d.sy} Q ${cx} ${cy} ${d.tx} ${d.ty}`;
  return <BaseEdge path={path} markerEnd={markerEnd} style={style} />;
}

const edgeTypes = { radial: RadialEdge };

/** Structure only (ids + sizes + edges) — no positions. ELK computes those.
 * Only used for the INITIAL graph (every selected root + each one's direct
 * relations); nodes added later via the context menu, or a whole new root
 * added via search, are placed locally (see `placeNewNode`) rather than
 * re-running ELK, so neither ever disturbs existing positions.
 *
 * With multiple roots, all of them are seeded as children FIRST so a node
 * that's simultaneously a root AND another root's direct relation is never
 * overwritten by the second pass below. */
function addElkChildAndEdge(
  rootId: string,
  kind: DependencyRelationKind,
  rel: DependencyRelation,
  childrenById: Map<string, ElkNode>,
  edges: NonNullable<ElkNode["edges"]>,
  seenPairs: Set<string>,
  nodeWidth: number,
): void {
  if (rel.externalId === rootId) return; // self-reference
  if (!childrenById.has(rel.externalId)) {
    childrenById.set(rel.externalId, { id: rel.externalId, width: nodeWidth, height: CARD_H });
  }
  const pairKey = `${canonicalKind(kind)}|${[rootId, rel.externalId].sort((a, b) => a.localeCompare(b)).join("|")}`;
  if (seenPairs.has(pairKey)) return;
  seenPairs.add(pairKey);
  edges.push({
    id: `${canonicalKind(kind)}:${rootId}->${rel.externalId}`,
    sources: [rootId],
    targets: [rel.externalId],
  });
}

function toElkGraph(
  rootIds: string[],
  groupsByRoot: Map<string, RelationGroup[]>,
  nodeWidth: number,
): ElkNode {
  const childrenById = new Map<string, ElkNode>();
  rootIds.forEach((id) => childrenById.set(id, { id, width: nodeWidth, height: CARD_H }));

  const edges: ElkNode["edges"] = [];
  // Every edge is fed to ELK as `root -> neighbor`, regardless of the
  // relation's real semantic direction — that's what keeps the radial
  // algorithm's notion of "root" unambiguous (feeding it the mixed real
  // direction made distances/positions erratic). A mirrored depends-on/
  // supports pair discovered from EACH end's own root (both selected) would
  // otherwise produce two different edge ids for the same fact
  // (`depends-on:A->B` from A's pass, `depends-on:B->A` from B's) — a
  // spurious parallel edge for ELK's topology. Deduping on an undirected
  // pair key (kind + sorted ids) collapses that back to one. This assumes
  // the existing business rule holds: a depends-on always has exactly one
  // mirrored supports, never two independent facts between the same two
  // benches — `buildGraphStructure` (rendering) doesn't need this since its
  // edge-id computation already uses the real direction and is naturally
  // consistent from both ends.
  const seenPairs = new Set<string>();

  rootIds.forEach((rootId) => {
    const groups = groupsByRoot.get(rootId) ?? [];
    groups.forEach(({ kind, list }) => {
      list.forEach((rel) =>
        addElkChildAndEdge(rootId, kind, rel, childrenById, edges, seenPairs, nodeWidth),
      );
    });
  });

  return { id: "root", children: [...childrenById.values()], edges };
}

/** Everything about an edge that doesn't depend on where its nodes currently
 * sit — the live endpoint coordinates are recomputed from current positions
 * instead (see `buildLiveEdges`), so a dragged card never leaves its edges
 * behind. */
type EdgeMeta = {
  id: string;
  source: string;
  target: string;
  kind: EdgeColorKind;
  bend: number;
  // Absent means "not determined" — rendered as a plain gray line
  // regardless of `kind`, distinct from "mandatory" (solid, normal color)
  // and "optional" (dashed, normal color). See `buildLiveEdges`.
  dependencyType?: "mandatory" | "optional";
};


function buildGraphStructure(
  roots: LabTestMean[],
  groupsByRoot: Map<string, RelationGroup[]>,
  resolve: (id: string) => LabTestMean | null,
  positions: ElkPositions,
): { nodes: Node[]; edgeMeta: EdgeMeta[] } {
  const nodesById = new Map<string, Node>();
  roots.forEach((root) => {
    const rootId = root.externalId;
    nodesById.set(rootId, {
      id: rootId,
      type: "card",
      position: positions.get(rootId) ?? { x: 0, y: 0 },
      data: { label: root.name, isRoot: true, resolved: root } satisfies NodeData,
      selectable: false,
    });
  });
  const edgeMetaById = new Map<string, EdgeMeta>();

  roots.forEach((root) => {
    const rootId = root.externalId;
    const groups = groupsByRoot.get(rootId) ?? [];
    groups.forEach(({ kind, list }) => {
      list.forEach((rel, i) => {
        if (rel.externalId === rootId) return; // self-reference
        if (!nodesById.has(rel.externalId)) {
          nodesById.set(rel.externalId, {
            id: rel.externalId,
            type: "card",
            position: positions.get(rel.externalId) ?? { x: 0, y: 0 },
            data: {
              label: rel.name,
              isRoot: false,
              resolved: resolve(rel.externalId),
            } satisfies NodeData,
            selectable: false,
          });
        }

        // "depends-on"/"shared-resource": the spawning bench needs this
        // neighbor. "supports": the neighbor depends on the spawning bench.
        // The rendered arrow always follows this real direction — already
        // consistent from both ends of a mirrored relation between two
        // roots, so no undirected dedup is needed here (cf. `toElkGraph`,
        // which needs it because it always normalizes to root->neighbor).
        const [source, target] =
          kind === "supports" ? [rel.externalId, rootId] : [rootId, rel.externalId];
        const edgeId = `${canonicalKind(kind)}:${source}->${target}`;
        if (edgeMetaById.has(edgeId)) return;

        edgeMetaById.set(edgeId, {
          id: edgeId,
          source,
          target,
          kind: canonicalKind(kind),
          bend: i % 2 === 0 ? 1 : -1,
          dependencyType: rel.dependencyType,
        });
      });
    });
  });

  return { nodes: [...nodesById.values()], edgeMeta: [...edgeMetaById.values()] };
}

/** Recomputes every edge's actual path from the CURRENT node positions (which
 * may have been dragged away from where they were originally placed) — this
 * is what keeps edges attached to their cards while the user repositions
 * them. */
function buildLiveEdges(
  edgeMeta: EdgeMeta[],
  nodePositions: Map<string, { x: number; y: number }>,
  nodeWidth: number,
): Edge[] {
  const centerOf = (id: string) => {
    const pos = nodePositions.get(id);
    if (!pos) return null;
    return { x: pos.x + nodeWidth / 2, y: pos.y + CARD_H / 2 };
  };

  const result: Edge[] = [];
  edgeMeta.forEach((meta) => {
    const sourceCenter = centerOf(meta.source);
    const targetCenter = centerOf(meta.target);
    if (!sourceCenter || !targetCenter) return;

    const sourceBorder = borderPoint(
      sourceCenter.x,
      sourceCenter.y,
      nodeWidth,
      CARD_H,
      targetCenter.x,
      targetCenter.y,
    );
    const targetBorder = borderPoint(
      targetCenter.x,
      targetCenter.y,
      nodeWidth,
      CARD_H,
      sourceCenter.x,
      sourceCenter.y,
    );

    // A "shared-resource" relation is optional by nature — the backend never
    // sends a dependencyType for it, so an absent value there means
    // "optional", not "no data" (unlike depends-on/supports, where absent
    // really does mean undetermined and falls back to gray).
    const effectiveDependencyType =
      meta.dependencyType ?? (meta.kind === "shared-resource" ? "optional" : undefined);
    // "mandatory" (or any other defined value) keeps the normal per-kind
    // color, solid; "optional" keeps it but dashed; no data at all overrides
    // the color to a neutral gray, regardless of `kind` — a deliberately
    // orthogonal axis from the color-by-relation-kind one above.
    const strokeColor =
      effectiveDependencyType === undefined
        ? "var(--color-muted)"
        : `var(--color-graph-${meta.kind})`;
    const style = {
      stroke: strokeColor,
      strokeWidth: 2,
      strokeDasharray: effectiveDependencyType === "optional" ? "6 4" : undefined,
    };
    const markerEnd = {
      type: MarkerType.ArrowClosed,
      color: strokeColor,
    };

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
 * `supports` to the left. A small nudge-down loop avoids landing on top of an
 * already-placed card. */
function placeNewNode(
  spawnerPos: { x: number; y: number },
  index: number,
  count: number,
  kind: DependencyRelationKind,
  existing: Node[],
  nodeWidth: number,
): { x: number; y: number } {
  const direction = kind === "supports" ? -1 : 1;
  const gapX = nodeWidth + 100;
  const gapY = 90;
  let x = spawnerPos.x + direction * gapX;
  let y = spawnerPos.y + (index - (count - 1) / 2) * gapY;

  let guard = 0;
  while (
    existing.some((n) =>
      rectsOverlap(
        { x, y, w: nodeWidth, h: CARD_H },
        { x: n.position.x, y: n.position.y, w: nodeWidth, h: CARD_H },
      ),
    ) &&
    guard < 30
  ) {
    y += CARD_H + 20;
    guard++;
  }
  return { x, y };
}

/** Builds the neighbor cards for a newly-added root bench (`addBench`),
 * covering all three relation kinds. Kept as a standalone function (not a
 * closure inside the component) to keep nesting shallow — see `collectNewEdgesForBench`
 * for the matching edge builder. */
function collectNewNodesForBench(
  bench: LabTestMean,
  current: Node[],
  rootPos: { x: number; y: number },
  rootNode: Node,
  nodeWidth: number,
  resolveBench: (id: string) => LabTestMean | null,
): Node[] {
  const additions: Node[] = [];
  const currentIds = new Set(current.map((n) => n.id));
  const additionIds = new Set<string>();
  relationGroups(bench).forEach(({ kind, list }) => {
    const relevant = list.filter(
      (rel) =>
        rel.externalId !== bench.externalId &&
        !currentIds.has(rel.externalId) &&
        !additionIds.has(rel.externalId),
    );
    relevant.forEach((rel, i) => {
      additionIds.add(rel.externalId);
      additions.push({
        id: rel.externalId,
        type: "card",
        position: placeNewNode(
          rootPos,
          i,
          relevant.length,
          kind,
          [...current, rootNode, ...additions],
          nodeWidth,
        ),
        data: {
          label: rel.name,
          isRoot: false,
          resolved: resolveBench(rel.externalId),
        } satisfies NodeData,
        selectable: false,
        style: { cursor: "pointer" },
      });
    });
  });
  return additions;
}

/** Matching edge builder for `collectNewNodesForBench` — same relation-kind
 * traversal, deduped against `existingIds` (mutated in place). */
function collectNewEdgesForBench(
  bench: LabTestMean,
  newRootId: string,
  existingIds: Set<string>,
): EdgeMeta[] {
  const additions: EdgeMeta[] = [];
  relationGroups(bench).forEach(({ kind, list }) => {
    list.forEach((rel, i) => {
      if (rel.externalId === newRootId) return;
      const [source, target] =
        kind === "supports" ? [rel.externalId, newRootId] : [newRootId, rel.externalId];
      const edgeId = `${canonicalKind(kind)}:${source}->${target}`;
      if (existingIds.has(edgeId)) return;
      existingIds.add(edgeId);
      additions.push({
        id: edgeId,
        source,
        target,
        kind: canonicalKind(kind),
        bend: i % 2 === 0 ? 1 : -1,
        dependencyType: rel.dependencyType,
      });
    });
  });
  return additions;
}

const DependencyGraph = forwardRef<DependencyGraphHandle, Props>(function DependencyGraph(
  { benches, allBenches, onDirty, pendingLoad, onPendingLoadConsumed },
  ref,
) {
  const [hidden, setHidden] = useState<Record<EdgeColorKind, boolean>>({
    "depends-on": false,
    "shared-resource": false,
  });
  const [preview, setPreview] = useState<PreviewTarget | null>(null);
  const [previewNodeId, setPreviewNodeId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<NodeContextMenuTarget | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const displaySettings = useInteractionDisplaySettings();

  const rootIds = useMemo(() => new Set(benches.map((b) => b.externalId)), [benches]);
  const rootsById = useMemo(
    () => new Map(benches.map((b) => [b.externalId, b])),
    [benches],
  );

  const byExternalId = useMemo(() => {
    const map = new Map<string, LabTestMean>();
    allBenches.forEach((m) => map.set(m.externalId, m));
    return map;
  }, [allBenches]);

  const resolveBench = useCallback(
    (id: string) => rootsById.get(id) ?? byExternalId.get(id) ?? null,
    [rootsById, byExternalId],
  );

  const groupsByRoot = useMemo(
    () => new Map(benches.map((b) => [b.externalId, relationGroups(b)])),
    [benches],
  );

  // The ELK graph/layout is deliberately NOT derived reactively from
  // `benches` — computed once, from whichever selection existed at mount,
  // via this lazy initializer, and never again. Adding/removing a bench must
  // never re-run ELK: that would discard every manually-dragged position.
  // Same reasoning for the box width read here: a later change to the
  // "Box width" setting resizes/reanchors everything reactively (see
  // `NodeCard`/`buildLiveEdges`/`placeNewNode` below) but never reruns ELK,
  // so its spacing stays based on whatever width was current at mount.
  const [elkGraph] = useState(() =>
    toElkGraph([...rootIds], groupsByRoot, displaySettings.nodeWidth),
  );
  const layout = useElkLayout(elkGraph);

  const { nodes: rawNodes, edgeMeta: rawEdgeMeta } = useMemo(() => {
    if (layout.status !== "ok") {
      return { nodes: [] as Node[], edgeMeta: [] as EdgeMeta[] };
    }
    return buildGraphStructure(benches, groupsByRoot, resolveBench, layout.positions);
  }, [benches, groupsByRoot, resolveBench, layout]);

  // `nodes`/`edgeMeta` are real state (not derived), so the context-menu
  // expansion/hide actions can mutate them directly, and dragging can patch
  // `nodes` via `applyNodeChanges` — that helper reuses the SAME object
  // reference for every node that didn't change, only creating a new one for
  // the node being touched. Rebuilding the whole array with `.map()` on every
  // change makes every card look "new" to React Flow, forcing a re-measure
  // of all of them each time — that's what caused earlier flicker on drag.
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edgeMeta, setEdgeMeta] = useState<EdgeMeta[]>([]);

  // Save/Load bookkeeping. `pendingLoad` (owned by the parent, which also
  // owns the Save/Load UI and the bench selection) carries a save across the
  // selection change it may have triggered until the load-consuming effect
  // below sees a matching selection and applies it. `isBaselineUpdateRef`
  // distinguishes a programmatic reset (initial ELK layout, or a load) from
  // a user-driven edit (drag, expand, hide, add/remove a bench) for the
  // purposes of the parent's "unsaved changes" indicator.
  const isBaselineUpdateRef = useRef(false);

  const applyLoadedSave = useCallback(
    (save: InteractionSave) => {
      const saveRootIds = new Set(save.rootExternalIds);
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
              isRoot: saveRootIds.has(n.id),
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
          // Absent on a save made before this field existed — reads back as
          // `undefined`, which already renders as the intended gray "no
          // data" style, so older saves need no migration.
          dependencyType: e.dependencyType,
        })),
      );
    },
    [byExternalId],
  );

  // Initial ELK layout resolves (mount only — there's nothing else that can
  // trigger a fresh one anymore) → apply it as the baseline, UNLESS a `Load`
  // is in flight for this exact selection (`skipNextFreshResetRef`, set by
  // the load-consuming effect below), in which case the save's own positions
  // win instead. That flag is only ever set while `nodes`/`edgeMeta` are
  // still empty — i.e. only possible at this very first mount, before this
  // effect's own in-flight (async) ELK computation has resolved — so it can
  // never linger and suppress anything later (nothing else resets the
  // diagram once it exists).
  const skipNextFreshResetRef = useRef(false);
  useEffect(() => {
    if (layout.status !== "ok") return;
    if (skipNextFreshResetRef.current) {
      skipNextFreshResetRef.current = false;
      return;
    }
    isBaselineUpdateRef.current = true;
    setNodes(rawNodes.map((n) => ({ ...n, style: { cursor: "pointer" } })));
    setEdgeMeta(rawEdgeMeta);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  // Applying a `Load` never needs ELK — a save already carries explicit
  // positions — so this is fully independent from the effect above (no
  // shared dependency, no risk of the two racing each other: this one
  // applies synchronously in the same commit as whatever state change set
  // `pendingLoad`/updated the selection, while the effect above only becomes
  // meaningful once ELK's async promise resolves, necessarily a later
  // commit). `Load` always REPLACES the selection with exactly the save's
  // (already catalogue-filtered) root benches — see `InteractionClient` —
  // so this only needs to wait for `rootIds` to match that exact set,
  // order-independent.
  useEffect(() => {
    if (!pendingLoad) return;
    const matchesPendingRoots =
      pendingLoad.rootExternalIds.length === rootIds.size &&
      pendingLoad.rootExternalIds.every((id) => rootIds.has(id));
    if (matchesPendingRoots) {
      // Read directly rather than added as a dependency — this is only a
      // one-time "is this a fresh mount with nothing on screen yet" check at
      // the moment this effect happens to run for `pendingLoad` reasons;
      // adding it as a dependency would cause extra, pointless re-firings on
      // every unrelated expand/hide/add/remove.
      if (nodes.length === 0 && edgeMeta.length === 0) {
        skipNextFreshResetRef.current = true;
      }
      onPendingLoadConsumed();
      applyLoadedSave(pendingLoad);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingLoad, rootIds, onPendingLoadConsumed, applyLoadedSave]);

  // Any change to the displayed graph that wasn't one of the baseline resets
  // above (i.e. a drag, an expansion, or a hide) means there are unsaved
  // changes relative to the active save — the parent owns that flag and the
  // transitions back to "clean" (bench selection change, successful
  // save/load), so this only ever needs to report the "dirty" direction. The
  // `nodes.length === 0` guard skips the very first mount, before any
  // baseline has been applied at all.
  useEffect(() => {
    if (nodes.length === 0 && edgeMeta.length === 0) return;
    if (isBaselineUpdateRef.current) {
      isBaselineUpdateRef.current = false;
      return;
    }
    onDirty();
  }, [nodes, edgeMeta, onDirty]);

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((current) => applyNodeChanges(changes, current));
  }, []);

  const handleExpand = useCallback(
    (nodeId: string, kind: DependencyRelationKind) => {
      const spawner = resolveBench(nodeId);
      if (!spawner) return;
      let list: DependencyRelation[];
      if (kind === "depends-on") list = spawner.dependsOn;
      else if (kind === "supports") list = spawner.supports;
      else list = spawner.sharedResources;
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
            displaySettings.nodeWidth,
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
            dependencyType: rel.dependencyType,
          });
        });
        return additions.length > 0 ? [...current, ...additions] : current;
      });
    },
    [resolveBench, displaySettings.nodeWidth],
  );

  const handleHide = useCallback(
    (nodeId: string) => {
      if (rootIds.has(nodeId)) return; // a selected root only leaves via its chip's "×"
      setNodes((current) => current.filter((n) => n.id !== nodeId));
      setEdgeMeta((current) =>
        current.filter((e) => e.source !== nodeId && e.target !== nodeId),
      );
    },
    [rootIds],
  );

  // The reverse of `sharedResources`: which OTHER benches in the whole
  // catalogue reference `nodeId` as one of their own shared resources. The
  // DTO has no such field server-side (`SharedResourcesDependsOn` is only
  // ever the forward direction), so this is a client-side scan over
  // `allBenches` — cheap enough given the catalogue is already fully loaded.
  // Returns the specific relation alongside each bench (not just the bench)
  // so callers can read that relation's own `dependencyType` directly,
  // instead of having to look it up a second time.
  const usersOf = useCallback(
    (nodeId: string) => {
      const result: { bench: LabTestMean; relation: DependencyRelation }[] = [];
      allBenches.forEach((b) => {
        if (b.externalId === nodeId) return;
        const relation = b.sharedResources.find((rel) => rel.externalId === nodeId);
        if (relation) result.push({ bench: b, relation });
      });
      return result;
    },
    [allBenches],
  );

  // Right-click action exposed only on "shared resource"-type nodes — same
  // non-ELK local placement as `handleExpand`, but sourced from `usersOf`
  // instead of the clicked node's own relation lists.
  const handleUsableBy = useCallback(
    (nodeId: string) => {
      const users = usersOf(nodeId);
      if (users.length === 0) return;

      setNodes((current) => {
        const existingIds = new Set(current.map((n) => n.id));
        const spawnerNode = current.find((n) => n.id === nodeId);
        if (!spawnerNode) return current;
        const toAdd = users.filter(({ bench: u }) => !existingIds.has(u.externalId));
        const additions = toAdd.map(({ bench: u }, i) => ({
          id: u.externalId,
          type: "card",
          position: placeNewNode(
            spawnerNode.position,
            i,
            toAdd.length,
            "depends-on",
            [...current],
            displaySettings.nodeWidth,
          ),
          data: {
            label: u.name,
            isRoot: false,
            resolved: resolveBench(u.externalId),
          } satisfies NodeData,
          selectable: false,
          style: { cursor: "pointer" },
        }));
        return additions.length > 0 ? [...current, ...additions] : current;
      });

      setEdgeMeta((current) => {
        const existingIds = new Set(current.map((e) => e.id));
        const additions: EdgeMeta[] = [];
        users.forEach(({ bench: u, relation }, i) => {
          // The user bench needs the resource — same direction convention as
          // a normal "shared-resource" expansion (spawner -> neighbor).
          const source = u.externalId;
          const target = nodeId;
          const edgeId = `shared-resource:${source}->${target}`;
          if (existingIds.has(edgeId)) return;
          additions.push({
            id: edgeId,
            source,
            target,
            kind: "shared-resource",
            bend: i % 2 === 0 ? 1 : -1,
            dependencyType: relation.dependencyType,
          });
        });
        return additions.length > 0 ? [...current, ...additions] : current;
      });
    },
    [usersOf, resolveBench, displaySettings.nodeWidth],
  );

  // Adds a brand-new selected bench without touching anything already on
  // screen: if it was already present as a plain neighbor of another root
  // (via expansion), promote it in place (same position, restyled to a
  // root); otherwise place its own node under the current bounding box and
  // expand its direct relations locally — same non-ELK placement as
  // `handleExpand`, but covering all three relation kinds (depends-on,
  // supports, AND shared-resource) since this mirrors the INITIAL per-bench
  // graph, not a context-menu expansion (which only ever exposes the first
  // two). Marks the diagram dirty like any other content change — this is
  // NOT a baseline reset.
  const addBench = useCallback(
    (bench: LabTestMean) => {
      const newRootId = bench.externalId;
      setNodes((current) => {
        const existing = current.find((n) => n.id === newRootId);
        if (existing) {
          return current.map((n) =>
            n.id === newRootId
              ? {
                  ...n,
                  data: { ...(n.data as NodeData), isRoot: true, label: bench.name, resolved: bench },
                }
              : n,
          );
        }

        const bbox = current.reduce(
          (acc, n) => ({
            minX: Math.min(acc.minX, n.position.x),
            maxY: Math.max(acc.maxY, n.position.y),
          }),
          { minX: 0, maxY: 0 },
        );
        const rootPos = { x: bbox.minX, y: bbox.maxY + CARD_H + 60 };
        const rootNode: Node = {
          id: newRootId,
          type: "card",
          position: rootPos,
          data: { label: bench.name, isRoot: true, resolved: bench } satisfies NodeData,
          selectable: false,
          style: { cursor: "pointer" },
        };

        const additions = collectNewNodesForBench(
          bench,
          current,
          rootPos,
          rootNode,
          displaySettings.nodeWidth,
          resolveBench,
        );

        return [...current, rootNode, ...additions];
      });

      setEdgeMeta((current) => {
        const existingIds = new Set(current.map((e) => e.id));
        const additions = collectNewEdgesForBench(bench, newRootId, existingIds);
        return [...current, ...additions];
      });
    },
    [resolveBench, displaySettings.nodeWidth],
  );

  // Removes a selected bench AND every node that was only reachable through
  // it — a deliberate divergence from `handleHide` (which never cascades):
  // the spec requires this cascade for root removal (a neighbor still
  // adjacent to another selected root must survive; one that isn't must go),
  // so this is intentional, not an inconsistency to "fix" later. `rootIds`
  // here still reflects the OLD selection at call time (the explicit
  // `externalId` argument is enough to exclude it), since the parent calls
  // this synchronously before its own `benches` prop has had a chance to
  // update.
  const removeBench = useCallback(
    (externalId: string) => {
      const remainingRootIds = new Set([...rootIds].filter((id) => id !== externalId));
      const reachableRef = { current: new Set<string>() };
      setEdgeMeta((currentEdges) => {
        const filtered = currentEdges.filter(
          (e) => e.source !== externalId && e.target !== externalId,
        );
        const adjacency = new Map<string, Set<string>>();
        filtered.forEach((e) => {
          if (!adjacency.has(e.source)) adjacency.set(e.source, new Set());
          if (!adjacency.has(e.target)) adjacency.set(e.target, new Set());
          adjacency.get(e.source)!.add(e.target);
          adjacency.get(e.target)!.add(e.source);
        });
        const reachable = new Set<string>();
        const queue = [...remainingRootIds];
        while (queue.length > 0) {
          const id = queue.shift()!;
          if (reachable.has(id)) continue;
          reachable.add(id);
          (adjacency.get(id) ?? []).forEach((n) => queue.push(n));
        }
        reachableRef.current = reachable;
        return filtered.filter((e) => reachable.has(e.source) && reachable.has(e.target));
      });
      setNodes((current) => current.filter((n) => reachableRef.current.has(n.id)));
    },
    [rootIds],
  );

  // Exposes the currently displayed graph so the parent (which owns the
  // Save/Save-as UI) can snapshot it on demand — pulled only when the user
  // actually clicks Save, rather than pushed up on every drag frame.
  useImperativeHandle(
    ref,
    () => ({
      getSnapshot: () => {
        if (nodes.length === 0) return null;
        return {
          nodes: nodes.map((n) => ({ id: n.id, x: n.position.x, y: n.position.y })),
          edges: edgeMeta.map((e) => ({
            source: e.source,
            target: e.target,
            kind: e.kind,
            dependencyType: e.dependencyType,
          })),
        };
      },
      addBench,
      removeBench,
    }),
    [nodes, edgeMeta, addBench, removeBench],
  );

  const nodePositions = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    nodes.forEach((n) => map.set(n.id, n.position));
    return map;
  }, [nodes]);

  const rawEdges = useMemo(
    () => buildLiveEdges(edgeMeta, nodePositions, displaySettings.nodeWidth),
    [edgeMeta, nodePositions, displaySettings.nodeWidth],
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
        const id = el.dataset.id;
        el.classList.toggle("rf-dim", !!id && !connected.has(id));
      });
      root.querySelectorAll<SVGElement>(".react-flow__edge").forEach((el) => {
        const id = el.dataset.id;
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
  // `canonicalKind`), so their counts merge into one legend entry. Derived
  // from the already-deduped `edgeMeta` (not raw per-bench relation-list
  // lengths) — summing raw lengths across multiple selected roots would
  // double-count a mirrored relation between two of them (e.g. A depends-on
  // B / B supports A is ONE real edge, but appears in both lists).
  const counts: Record<EdgeColorKind, number> = {
    "depends-on": edgeMeta.filter((e) => e.kind === "depends-on").length,
    "shared-resource": edgeMeta.filter((e) => e.kind === "shared-resource").length,
  };

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
        fitViewOptions={{ maxZoom: 1 }}
        onNodesChange={onNodesChange}
        onNodeMouseEnter={handleNodeMouseEnter}
        onNodeMouseLeave={clearHover}
        onNodeDoubleClick={(_, n) => {
          if (previewNodeId === n.id) {
            setPreview(null);
            setPreviewNodeId(null);
            return;
          }
          const data = n.data as unknown as NodeData;
          setPreview({ label: data.label, isRoot: data.isRoot, resolved: data.resolved });
          setPreviewNodeId(n.id);
        }}
        onNodeContextMenu={(event, n) => {
          event.preventDefault();
          const wrapRect = containerRef.current?.getBoundingClientRect();
          const resolved = resolveBench(n.id);
          const existingIds = new Set(nodes.map((nn) => nn.id));
          const notShown = (list: DependencyRelation[]) =>
            list.filter((rel) => rel.externalId !== n.id && !existingIds.has(rel.externalId)).length;
          setContextMenu({
            nodeId: n.id,
            x: event.clientX - (wrapRect?.left ?? 0),
            y: event.clientY - (wrapRect?.top ?? 0),
            // A node that doesn't resolve to a catalogue bench can't have its
            // type checked, so it falls back to the "bench" variant — every
            // action ends up disabled anyway since `resolved` is null.
            variant: resolved?.type === "SHARE" ? "shared-resource" : "bench",
            dependsOnCount: resolved ? notShown(resolved.dependsOn) : 0,
            supportsCount: resolved ? notShown(resolved.supports) : 0,
            sharedResourcesCount: resolved ? notShown(resolved.sharedResources) : 0,
            usableByCount: usersOf(n.id).filter(({ bench: u }) => !existingIds.has(u.externalId))
              .length,
            canHide: !rootIds.has(n.id),
          });
        }}
      >
        <Background />
        <Controls showInteractive={false} />
      </ReactFlow>
      <DependencyLegend
        counts={counts}
        hidden={hidden}
        onToggle={(kind) => setHidden((h) => ({ ...h, [kind]: !h[kind] }))}
      />
      <BenchPreviewModal
        target={preview}
        onClose={() => {
          setPreview(null);
          setPreviewNodeId(null);
        }}
      />
      <NodeContextMenu
        target={contextMenu}
        onExpandDependsOn={(id) => handleExpand(id, "depends-on")}
        onExpandSupports={(id) => handleExpand(id, "supports")}
        onExpandSharedResources={(id) => handleExpand(id, "shared-resource")}
        onUsableBy={handleUsableBy}
        onHide={handleHide}
        onClose={() => setContextMenu(null)}
      />
    </div>
  );
});

export default DependencyGraph;
