"use client";

import { useEffect, useState } from "react";
import ELK, { type ElkNode } from "elkjs/lib/elk.bundled.js";

// One shared instance — elkjs supports concurrent `.layout()` calls on the
// same instance, no need to recreate it per graph.
const elk = new ELK();

// The only layout algorithm `/depgraph` uses — the "layered" option (and
// the algorithm picker that let a user choose between the two) was removed;
// every diagram is radial now.
const LAYOUT_OPTIONS: Record<string, string> = {
  "elk.algorithm": "radial",
  "elk.spacing.nodeNode": "40",
};

export type ElkPositions = Map<string, { x: number; y: number }>;

export type ElkLayoutState =
  | { status: "loading" }
  | { status: "ok"; positions: ElkPositions }
  | { status: "error"; error: unknown };

/**
 * Runs an ELK radial layout for `graph` and returns its resolved node
 * positions.
 *
 * elkjs has no cancellation API, so a stale result (e.g. the graph changed
 * before this one resolved) is detected via the `cancelled` flag below and
 * silently ignored rather than applied.
 */
export function useElkLayout(graph: ElkNode): ElkLayoutState {
  const [state, setState] = useState<ElkLayoutState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ status: "loading" });

    elk
      .layout(graph, { layoutOptions: LAYOUT_OPTIONS })
      .then((result) => {
        if (cancelled) return;
        const positions: ElkPositions = new Map();
        (result.children ?? []).forEach((child) => {
          if (typeof child.x === "number" && typeof child.y === "number") {
            positions.set(child.id, { x: child.x, y: child.y });
          }
        });

        setState({ status: "ok", positions });
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        console.error("[useElkLayout] layout failed", error);
        setState({ status: "error", error });
      });

    return () => {
      cancelled = true;
    };
  }, [graph]);

  return state;
}
