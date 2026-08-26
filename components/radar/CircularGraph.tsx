"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LabTestMean } from "@/lib/types";
import { buildRadarGraph, type RadarNode } from "./buildRadarGraph";

type Props = { benches: LabTestMean[]; radius: number };

const LABEL_MAX_CHARS = 22;
const LABEL_MARGIN = 90; // room reserved outside the circle for radial labels

// True pixel values now (the SVG viewBox tracks the container 1:1), so these
// are literal on-screen radii, clamped at render time to whatever room the
// container actually has (see `maxRadius` below).
export const RADAR_MIN_RADIUS = 100;
export const RADAR_MAX_RADIUS = 320;
export const RADAR_DEFAULT_RADIUS = 200;

function truncate(label: string): string {
  return label.length > LABEL_MAX_CHARS
    ? `${label.slice(0, LABEL_MAX_CHARS - 1)}…`
    : label;
}

/** Quadratic bezier whose control point is pulled toward the circle's center,
 * so every edge visually "passes through" the middle of the radar. */
function radarEdgePath(
  s: { x: number; y: number },
  t: { x: number; y: number },
  center: { x: number; y: number },
  pull = 0.85,
): string {
  const mx = (s.x + t.x) / 2;
  const my = (s.y + t.y) / 2;
  const cx = mx + (center.x - mx) * pull;
  const cy = my + (center.y - my) * pull;
  return `M ${s.x} ${s.y} Q ${cx} ${cy} ${t.x} ${t.y}`;
}

export default function CircularGraph({ benches, radius }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  // The SVG's viewBox is kept 1:1 with the container's actual pixel size
  // (measured, not a fixed 800x800 scaled to fit) — this is what keeps font
  // size and dot size constant regardless of viewport size or the radius
  // slider: only the circle's radius changes, never the unit-to-pixel ratio.
  const [size, setSize] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setSize({ w: width, h: height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const center = { x: size.w / 2, y: size.h / 2 };
  const maxRadius = Math.max(40, Math.min(size.w, size.h) / 2 - LABEL_MARGIN);
  const effectiveRadius = Math.min(radius, maxRadius);

  const { nodes, edges } = useMemo(
    () => buildRadarGraph(benches, center, effectiveRadius),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [benches, effectiveRadius, size.w, size.h],
  );

  const nodeById = useMemo(() => {
    const map = new Map<string, RadarNode>();
    nodes.forEach((n) => map.set(n.id, n));
    return map;
  }, [nodes]);

  const clearHover = useCallback(() => {
    containerRef.current
      ?.querySelectorAll(".rd-dim, .rd-emph-out, .rd-emph-in")
      .forEach((el) => el.classList.remove("rd-dim", "rd-emph-out", "rd-emph-in"));
    if (tooltipRef.current) tooltipRef.current.style.display = "none";
  }, []);

  const handleNodeMouseEnter = useCallback(
    (hoveredId: string, label: string) => (e: React.MouseEvent) => {
      const root = containerRef.current;
      if (!root) return;

      const connected = new Set<string>([hoveredId]);
      edges.forEach((edge) => {
        if (edge.source === hoveredId) connected.add(edge.target);
        if (edge.target === hoveredId) connected.add(edge.source);
      });

      root.querySelectorAll<SVGElement>(".radar-node, .radar-label").forEach((el) => {
        const id = el.getAttribute("data-id");
        el.classList.toggle("rd-dim", !!id && !connected.has(id));
      });

      root.querySelectorAll<SVGElement>(".radar-edge").forEach((el) => {
        const source = el.getAttribute("data-source");
        const target = el.getAttribute("data-target");
        const touches = source === hoveredId || target === hoveredId;
        el.classList.toggle("rd-dim", !touches);
        el.classList.remove("rd-emph-out", "rd-emph-in");
        // Direction is relative to whichever node is currently hovered: the
        // hovered node being the edge's source means IT needs the other end
        // (outgoing); being the target means the other end needs IT (incoming).
        if (touches) {
          el.classList.add(source === hoveredId ? "rd-emph-out" : "rd-emph-in");
        }
      });

      if (tooltipRef.current) {
        const wrapRect = root.getBoundingClientRect();
        tooltipRef.current.textContent = label;
        tooltipRef.current.style.left = `${e.clientX - wrapRect.left + 12}px`;
        tooltipRef.current.style.top = `${e.clientY - wrapRect.top + 12}px`;
        tooltipRef.current.style.display = "block";
      }
    },
    [edges],
  );

  return (
    <div ref={containerRef} className="relative h-full w-full">
      <svg
        viewBox={`0 0 ${size.w} ${size.h}`}
        className="h-full w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        <g>
          {edges.map((edge) => {
            const s = nodeById.get(edge.source);
            const t = nodeById.get(edge.target);
            if (!s || !t) return null;
            return (
              <path
                key={edge.id}
                d={radarEdgePath(s, t, center)}
                className="radar-edge"
                data-id={edge.id}
                data-source={edge.source}
                data-target={edge.target}
              />
            );
          })}
        </g>
        <g>
          {nodes.map((n) => {
            // Radial label: aligned with the line from the center through the
            // node (not tangent to the circle), flipped on the left half so
            // it reads upright instead of upside down.
            const normDeg = ((n.angleDeg % 360) + 360) % 360;
            const flip = normDeg > 90 && normDeg < 270;
            const rotate = flip ? normDeg + 180 : normDeg;
            const anchor = flip ? "end" : "start";
            const dx = flip ? -10 : 10;
            return (
              <g
                key={n.id}
                onMouseEnter={handleNodeMouseEnter(n.id, n.label)}
                onMouseLeave={clearHover}
                style={{ cursor: "default" }}
              >
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={5}
                  className="radar-node"
                  data-id={n.id}
                />
                <text
                  x={n.x}
                  y={n.y}
                  dx={dx}
                  dy={4}
                  textAnchor={anchor}
                  transform={`rotate(${rotate} ${n.x} ${n.y})`}
                  className="radar-label"
                  data-id={n.id}
                >
                  {truncate(n.label)}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute rounded border border-border bg-surface px-2 py-1 text-xs font-mono text-fg shadow-lg"
        style={{ display: "none" }}
      />
    </div>
  );
}
