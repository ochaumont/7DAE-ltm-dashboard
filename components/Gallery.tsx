"use client";

import { useState } from "react";
import type { Photo } from "@/lib/types";
import { PHOTO_PLACEHOLDER, placeholderOnError } from "@/lib/photo";
import PanoramaClient from "./PanoramaClient";

export default function Gallery({ photos }: { photos: Photo[] }) {
  const [active, setActive] = useState(0);
  const current = photos[active];
  if (!current) {
    return (
      <div className="relative aspect-video bg-surface-2 rounded-card overflow-hidden">
        <img
          src={PHOTO_PLACEHOLDER}
          alt="No photo available for this lab test mean"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <div className="relative aspect-video bg-surface-2 rounded-card overflow-hidden">
        {current.is360 ? (
          <PanoramaClient src={current.url} />
        ) : (
          <img
            src={current.url}
            alt={current.alt ?? ""}
            className="w-full h-full object-cover"
            onError={placeholderOnError}
          />
        )}
      </div>
      {photos.length > 1 && (
        <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
          {photos.map((p, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              title={p.is360 ? "Image 360°" : undefined}
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
                onError={placeholderOnError}
              />
              {p.is360 && (
                <span
                  aria-hidden="true"
                  className="absolute top-1 right-1 px-1 py-0.5 rounded text-[10px] font-mono bg-accent text-accent-fg leading-none"
                >
                  360°
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
