"use client";

import Link from "next/link";
import type { LabTestMean } from "@/lib/types";
import ChipType from "./ChipType";
import BadgeStatus from "./BadgeStatus";

export default function LabTestMeanCard({
  labTestMean,
}: {
  labTestMean: LabTestMean;
}) {
  return (
    <Link
      href={`/labtestmean/${labTestMean.id}`}
      className="bench-card group block overflow-hidden rounded-card transition-all duration-200"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        <img
          src={labTestMean.coverPhoto}
          alt={labTestMean.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={(e) => {
            const t = e.currentTarget;
            if (!t.src.endsWith("/covers/cover-1.svg"))
              t.src = "/covers/cover-1.svg";
          }}
        />
        <span className="absolute top-3 left-3">
          <BadgeStatus status={labTestMean.status} />
        </span>
      </div>
      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <ChipType type={labTestMean.type} />
          {labTestMean.complexity && (
            <span className="text-[10px] uppercase tracking-wide text-muted font-mono">
              {labTestMean.complexity}
            </span>
          )}
        </div>
        <h3 className="font-semibold leading-tight line-clamp-2">
          {labTestMean.name}
        </h3>
        <p className="text-sm text-muted">
          {labTestMean.location.city}, {labTestMean.location.country}
          {labTestMean.location.building
            ? ` · ${labTestMean.location.building}`
            : ""}
        </p>
        <div className="flex flex-wrap gap-1 pt-1">
          {labTestMean.programs.map((p) => (
            <span
              key={p}
              className="text-[10px] px-1.5 py-0.5 rounded bg-surface-2 text-muted font-mono"
            >
              {p}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
