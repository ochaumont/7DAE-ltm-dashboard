import type { LabTestMean } from "@/lib/types";
import ChipType from "./ChipType";
import BadgeStatus from "./BadgeStatus";
import ChipComplexity from "./ChipComplexity";
import ChipAccessControl from "./ChipAccessControl";
import ManagerCard from "./ManagerCard";

export default function LabTestMeanHeader({
  labTestMean,
}: {
  labTestMean: LabTestMean;
}) {
  const m = labTestMean;
  const projectManager = m.roles.projectManagers?.[0];

  return (
    <header className="space-y-4">
      <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">
        {m.name}
      </h1>

      <div className="flex flex-wrap items-center gap-2">
        <ChipType type={m.type} withIcon />
        <BadgeStatus status={m.status} withIcon />
        <ChipComplexity level={m.complexity} />
        <ChipAccessControl enabled={m.security.accesscontrol} />
      </div>

      <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
        <span className="text-xs uppercase tracking-[0.15em] font-mono text-muted">
          Location
        </span>
        <span className="text-sm text-fg">
          {m.location.city}, {m.location.country}
          {m.location.building ? ` · ${m.location.building}` : ""}
          {m.location.room ? ` · ${m.location.room}` : ""}
        </span>
      </div>

      {m.externalId && (
        <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
          <span className="text-xs uppercase tracking-[0.15em] font-mono text-muted">
            Code
          </span>
          <span className="text-sm font-mono text-fg">
            [{m.externalId}]
          </span>
        </div>
      )}

      {(m.manager || projectManager) && (
        <div className="flex flex-col gap-3 pt-2 max-w-detail-info">
          {m.manager && (
            <ManagerCard
              name={m.manager.name}
              email={m.manager.email}
              roleLabel="Bench Manager"
            />
          )}
          {projectManager && (
            <ManagerCard
              name={projectManager.name}
              email={projectManager.email}
              roleLabel="Project Manager"
            />
          )}
        </div>
      )}
    </header>
  );
}
