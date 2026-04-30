import type { LabTestMean } from "@/lib/types";
import ChipType from "./ChipType";
import BadgeStatus from "./BadgeStatus";
import Avatar from "./Avatar";

export default function LabTestMeanHeader({
  labTestMean,
}: {
  labTestMean: LabTestMean;
}) {
  const m = labTestMean;
  return (
    <header className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <ChipType type={m.type} />
        <BadgeStatus status={m.status} />
        {m.complexity && (
          <span className="text-[10px] uppercase tracking-wide text-muted font-mono px-2 py-0.5 rounded bg-surface-2">
            {m.complexity}
          </span>
        )}
        <span className="text-xs font-mono text-muted">{m.externalId}</span>
      </div>
      <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">
        {m.name}
      </h1>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted">
        <span className="flex items-center gap-1.5">
          <span className="opacity-60">Location:</span>
          <span className="text-fg">
            {m.location.city}, {m.location.country}
            {m.location.building ? ` · ${m.location.building}` : ""}
            {m.location.room ? ` · ${m.location.room}` : ""}
          </span>
        </span>
      </div>
      {m.manager && (
        <div className="flex items-center gap-3 pt-2">
          <Avatar name={m.manager.name} seed={m.manager.email} size={40} />
          <div>
            <div className="text-sm font-semibold">{m.manager.name}</div>
            <div className="text-xs text-muted">{m.manager.title}</div>
          </div>
        </div>
      )}
    </header>
  );
}
