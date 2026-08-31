"use client";

import Link from "next/link";
import type { LabTestMean } from "@/lib/types";
import { usePhoto } from "@/lib/usePhoto";
import PhotoSpinner from "./PhotoSpinner";
import ChipType from "./ChipType";
import BadgeStatus from "./BadgeStatus";
import BadgeQualitySeal from "./BadgeQualitySeal";
import ChipAccessControl from "./ChipAccessControl";

export default function LabTestMeanCard({
  labTestMean,
}: Readonly<{
  labTestMean: LabTestMean;
}>) {
  const { url: coverSrc, isLoading: coverLoading } = usePhoto(
    labTestMean.coverPhoto?.id ?? "",
    labTestMean.coverPhoto?.uri ?? "",
  );

  return (
    <Link
      href={`/labtestmean?id=${encodeURIComponent(labTestMean.externalId)}`}
      // No prefetch: every detail link resolves to the SAME static page
      // (/labtestmean, the ?id= is read client-side), so Next's viewport
      // prefetch would just refetch the same shell per card and spam the gateway
      // with 301/403 on load. Navigation still works on click.
      prefetch={false}
      className="bench-card group block overflow-hidden rounded-card transition-all duration-200"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-2">
        <img
          src={coverSrc}
          alt={labTestMean.name}
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        {coverLoading && <PhotoSpinner />}
        <div className="absolute right-2 top-2">
          <BadgeQualitySeal lxState={labTestMean.lxState} />
        </div>
      </div>
      <div className="px-4 pt-4 pb-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <ChipType type={labTestMean.type} withIcon />
          <div className="flex items-center gap-2">
            {labTestMean.complexity && (
              <span className="text-[10px] uppercase tracking-wide text-muted font-mono">
                {labTestMean.complexity}
              </span>
            )}
            <ChipAccessControl enabled={labTestMean.security.accesscontrol} />
          </div>
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
