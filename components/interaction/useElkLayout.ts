"use client";

import { useEffect, useState } from "react";
import ELK, { type ElkNode } from "elkjs/lib/elk.bundled.js";

// One shared instance — elkjs supports concurrent `.layout()` calls on the
// same instance, no need to recreate it per graph.
const elk = new ELK();

export type ElkAlgorithm = "layered" | "radial";

const ALGORITHM_OPTIONS: Record<ElkAlgorithm, Record<string, string>> = {
  layered: {
    "elk.algorithm": "layered",
    "elk.direction": "RIGHT",
    "elk.spacing.nodeNode": "40",
    "elk.layered.spacing.nodeNodeBetweenLayers": "80",
    // Let ELK route edges around intervening nodes instead of us drawing a
    // naive obstacle-blind curve — that's what was cutting through cards
    // whenever a layer ended up with more than one node in it.
    "elk.edgeRouting": "SPLINES",
  },
  radial: {
    "elk.algorithm": "radial",
    "elk.spacing.nodeNode": "40",
  },
};

export type ElkPositions = Map<string, { x: number; y: number }>;
export type ElkPoint = { x: number; y: number };
export type ElkEdgeSections = Map<string, ElkPoint[]>;

export type ElkLayoutState =
  | { status: "loading" }
  | { status: "ok"; positions: ElkPositions; edgeSections: ElkEdgeSections }
  | { status: "error"; error: unknown };

/**
 * Runs an ELK layout for `graph` and returns its resolved node positions
 * (plus, when ELK computed one, the routed point list per edge id — used by
 * the "layered" algorithm to draw obstacle-aware paths instead of our own
 * fixed-curvature bow).
 *
 * elkjs has no cancellation API, so a stale result (e.g. the bench or the
 * algorithm changed before this one resolved) is detected via the `cancelled`
 * flag below and silently ignored rather than applied.
 */
export function useElkLayout(
  graph: ElkNode,
  algorithm: ElkAlgorithm,
): ElkLayoutState {
  const [state, setState] = useState<ElkLayoutState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    elk
      .layout(graph, { layoutOptions: ALGORITHM_OPTIONS[algorithm] })
      .then((result) => {
        if (cancelled) return;
        const positions: ElkPositions = new Map();
        (result.children ?? []).forEach((child) => {
          if (typeof child.x === "number" && typeof child.y === "number") {
            positions.set(child.id, { x: child.x, y: child.y });
          }
        });

        const edgeSections: ElkEdgeSections = new Map();
        (result.edges ?? []).forEach((edge) => {
          const section = edge.sections?.[0];
          if (!section || !edge.id) return;
          edgeSections.set(edge.id, [
            section.startPoint,
            ...(section.bendPoints ?? []),
            section.endPoint,
          ]);
        });

        setState({ status: "ok", positions, edgeSections });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("[useElkLayout] layout failed", error);
        setState({ status: "error", error });
      });

    return () => {
      cancelled = true;
    };
  }, [graph, algorithm]);

  return state;
}
