"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import type { DependencyRelationKind, LabTestMean } from "@/lib/types";
import { usePhoto } from "@/lib/usePhoto";
import { placeholderOnError } from "@/lib/photo";
import ChipType from "@/components/ChipType";

export type PreviewTarget = {
  label: string;
  kind: DependencyRelationKind | "hub";
  resolved: LabTestMean | null;
};

const KIND_LABELS: Record<PreviewTarget["kind"], string> = {
  hub: "Selected bench",
  "depends-on": "Depends on",
  supports: "Supports",
  "shared-resource": "Shared resource",
};

/**
 * A non-blocking side panel (not a modal): no backdrop, so the graph stays
 * fully clickable underneath — clicking another node just swaps the panel's
 * content instead of requiring a close-then-reopen round trip.
 */
export default function BenchPreviewModal({
  target,
  onClose,
}: {
  target: PreviewTarget | null;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const coverSrc = usePhoto(
    target?.resolved?.coverPhoto?.id ?? "",
    target?.resolved?.coverPhoto?.uri ?? "",
  );

  useEffect(() => {
    if (!target) return;
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [target, onClose]);

  if (!target) return null;

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="bench-preview-title"
      className="absolute top-4 right-4 z-20 w-[340px] max-h-[calc(100%-2rem)] overflow-y-auto rounded-card border border-border bg-surface shadow-2xl"
    >
      <div className="relative aspect-[16/9] bg-surface-2">
        <img
          src={coverSrc}
          alt={target.resolved?.name ?? target.label}
          onError={placeholderOnError}
          className="h-full w-full object-cover"
        />
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close preview"
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          ✕
        </button>
      </div>
      <div className="space-y-2 p-5">
        <span className="text-xs font-mono uppercase tracking-wider text-muted">
          {KIND_LABELS[target.kind]}
        </span>
        <h2
          id="bench-preview-title"
          className="font-mono text-lg font-semibold leading-tight"
        >
          {target.resolved?.name ?? target.label}
        </h2>
        {target.resolved ? (
          <div className="flex items-center gap-3 text-sm text-muted">
            <ChipType type={target.resolved.type} withIcon />
            <span>
              {target.resolved.location.city}, {target.resolved.location.country}
            </span>
          </div>
        ) : (
          <p className="text-sm text-muted">
            Not in the local catalogue — no further details available.
          </p>
        )}
        {target.resolved && (
          <Link
            href={`/labtestmean?id=${encodeURIComponent(target.resolved.externalId)}`}
            prefetch={false}
            className="inline-block pt-1 text-sm text-accent hover:underline"
          >
            Open full record →
          </Link>
        )}
      </div>
    </div>
  );
}
