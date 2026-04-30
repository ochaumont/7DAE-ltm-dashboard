"use client";

import { useState } from "react";
import type { Photo } from "@/lib/types";

export default function Gallery({ photos }: { photos: Photo[] }) {
  const [active, setActive] = useState(0);
  const current = photos[active];
  if (!current) {
    return (
      <div className="aspect-video flex items-center justify-center bg-surface-2 text-muted rounded-card">
        No photos
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="relative aspect-video bg-surface-2 rounded-card overflow-hidden">
        <img
          src={current.url}
          alt={current.alt ?? ""}
          className="w-full h-full object-cover"
        />
      </div>
      {photos.length > 1 && (
        <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
          {photos.map((p, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative aspect-square rounded overflow-hidden border-2 transition-all ${
                i === active
                  ? "border-accent opacity-100"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
              type="button"
            >
              <img
                src={p.url}
                alt={p.alt ?? ""}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
