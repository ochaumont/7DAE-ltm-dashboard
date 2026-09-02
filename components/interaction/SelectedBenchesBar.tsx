import type { LabTestMean } from "@/lib/types";

type Props = {
  benches: LabTestMean[];
  onRemove: (externalId: string) => void;
};

export default function SelectedBenchesBar({ benches, onRemove }: Readonly<Props>) {
  if (benches.length === 0) return null;

  return (
    // Flexible footprint (shrinks/grows with the search field so both stay on
    // the same toolbar row down to small screens; height stays constant
    // regardless of how many benches are selected) — overflow scrolls
    // vertically instead of pushing the rest of the toolbar down.
    <div className="flex h-10 min-w-[140px] max-w-xl flex-1 basis-52 flex-wrap content-start gap-1.5 overflow-y-auto rounded-card border border-border bg-surface p-1.5">
      {benches.map((b) => (
        <span
          key={b.externalId}
          className="flex items-center gap-1.5 rounded-card border border-border bg-surface-2 px-2.5 py-1 text-xs text-fg"
        >
          {b.name}
          <button
            type="button"
            onClick={() => onRemove(b.externalId)}
            aria-label={`Remove ${b.name}`}
            className="text-muted hover:text-danger"
          >
            ✕
          </button>
        </span>
      ))}
    </div>
  );
}
