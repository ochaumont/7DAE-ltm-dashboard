import type { LabTestMean } from "@/lib/types";
import ChipType from "./ChipType";
import BadgeStatus from "./BadgeStatus";
import ChipComplexity from "./ChipComplexity";
import ChipAccessControl from "./ChipAccessControl";
import ChipCapabilities from "./ChipCapabilities";
import ManagerCard from "./ManagerCard";
import CountryMapIcon from "./icons/CountryMapIcon";
import AircraftPrograms from "./AircraftPrograms";
import AtaList from "./AtaList";
import LifecycleSection from "./detail/LifecycleSection";

export default function LabTestMeanHeader({
  labTestMean,
}: {
  labTestMean: LabTestMean;
}) {
  const m = labTestMean;
  const projectManager = m.roles.projectManagers?.[0];

  const city = m.location.city?.trim() || null;
  const subParts = [m.location.building, m.location.room].filter(
    (s): s is string => !!s && s.length > 0,
  );

  return (
    <header className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-3xl md:text-4xl font-bold leading-tight tracking-tight">
          {m.name}
        </h1>
        <div className="flex items-center flex-wrap gap-3">
          {m.externalId && (
            <span className="text-xs font-mono text-fg">
              [{m.externalId}]
            </span>
          )}
          <BadgeStatus status={m.status} withIcon />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ChipType type={m.type} withIcon />
        <ChipComplexity level={m.complexity} />
        <ChipAccessControl enabled={m.security.accesscontrol} />
        <ChipCapabilities capabilities={m.technicalCapabilities} />
      </div>

      <div className="flex flex-col lg:flex-row items-start gap-6">
        <div className="flex flex-col items-start gap-3 shrink-0">
          <div className="flex flex-col items-center gap-1" style={{ width: 200 }}>
            <CountryMapIcon
              country={m.location.country}
              site={m.location.site}
            />
            {(city || subParts.length > 0) && (
              <div className="flex flex-col items-center gap-0.5">
                {city && (
                  <span className="text-sm text-fg text-center">{city}</span>
                )}
                {subParts.length > 0 && (
                  <span className="text-xs text-muted text-center">
                    {subParts.join(" · ")}
                  </span>
                )}
              </div>
            )}
          </div>
          <AircraftPrograms programs={m.programs} />
          <AtaList atas={m.atas} />
        </div>
        <div className="flex-1 min-w-0 w-full">
          <LifecycleSection lifecycle={m.lifecycle} />
        </div>
      </div>

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
