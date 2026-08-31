import type { EdgeColorKind } from "./DependencyGraph";

// "depends-on" and "supports" are merged: an "A depends-on B" relation always
// exists mirrored as "B supports A" on the other bench (same underlying
// fact), so they share one legend entry/color — only the arrow direction on
// the diagram tells you which end is which.
const LEGEND_ITEMS: { kind: EdgeColorKind; label: string }[] = [
  { kind: "depends-on", label: "Depends on" },
  { kind: "shared-resource", label: "Shared resource" },
];

// Purely explanatory — line style is orthogonal to the relation-kind colors
// above (it comes from `dependencyType`, cf. `DependencyGraph.tsx`), so these
// rows have no toggle/count, just a sample of each style.
const LINE_STYLE_ITEMS: { label: string; dasharray?: string; color: string }[] = [
  { label: "Mandatory", color: "var(--color-fg)" },
  { label: "Optional", dasharray: "4 3", color: "var(--color-fg)" },
  { label: "No data", color: "var(--color-muted)" },
];

type Props = {
  counts: Record<EdgeColorKind, number>;
  hidden: Record<EdgeColorKind, boolean>;
  onToggle: (kind: EdgeColorKind) => void;
};

export default function DependencyLegend({ counts, hidden, onToggle }: Props) {
  return (
    <div className="absolute bottom-4 left-4 z-10 flex flex-col gap-0.5 rounded-card bg-surface/90 border border-border px-2 py-2.5 backdrop-blur-md">
      <span className="px-2 pb-1 text-[0.65rem] uppercase tracking-wider text-muted">
        Relation type
      </span>
      {LEGEND_ITEMS.map((item) => (
        <button
          key={item.kind}
          type="button"
          onClick={() => onToggle(item.kind)}
          aria-pressed={!hidden[item.kind]}
          className={`flex items-center gap-2 rounded px-2 py-1 text-xs hover:bg-surface-2 ${
            hidden[item.kind] ? "opacity-40 line-through" : "text-fg/90"
          }`}
        >
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ background: `var(--color-graph-${item.kind})` }}
            aria-hidden="true"
          />
          <span className="flex-1 text-left">{item.label}</span>
          <span className="font-mono text-muted">{counts[item.kind]}</span>
        </button>
      ))}
      <div className="my-1 border-t border-border" />
      <span className="px-2 pb-1 text-[0.65rem] uppercase tracking-wider text-muted">
        Dependency
      </span>
      {LINE_STYLE_ITEMS.map((item) => (
        <div key={item.label} className="flex items-center gap-2 px-2 py-1 text-xs text-fg/90">
          <svg width="18" height="10" aria-hidden="true" className="shrink-0">
            <line
              x1="0"
              y1="5"
              x2="18"
              y2="5"
              stroke={item.color}
              strokeWidth="2"
              strokeDasharray={item.dasharray}
            />
          </svg>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}
