"use client";

import Link from "next/link";
import type { LabTestMean } from "@/lib/types";
import { placeholderOnError } from "@/lib/photo";
import ChipType from "./ChipType";
import BadgeStatus from "./BadgeStatus";

export default function LabTestMeanCard({
  labTestMean,
}: {
  labTestMean: LabTestMean;
}) {
  return (
    <Link
      href={`/labtestmean/${labTestMean.externalId}`}
      className="bench-card group block overflow-hidden rounded-card transition-all duration-200"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        <img
          src={labTestMean.coverPhoto}
          alt={labTestMean.name}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={placeholderOnError}
        />
      </div>
      <div className="px-4 pt-4 pb-3 space-y-2">
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
        <div>
          <BadgeStatus status={labTestMean.status} />
        </div>
      </div>
    </Link>
  );
}
