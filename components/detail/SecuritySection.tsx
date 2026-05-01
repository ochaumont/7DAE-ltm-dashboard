import type { Security } from "@/lib/types";
import Section from "./Section";
import YesNo from "./YesNo";

export default function SecuritySection({ security }: { security: Security }) {
  return (
    <Section title="Security & access">
      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
        {security.ecLevel != null && (
          <>
            <dt className="text-muted">EC level</dt>
            <dd className="font-mono">{security.ecLevel}</dd>
          </>
        )}
        {security.networkSegregated != null && (
          <>
            <dt className="text-muted">Network segregated</dt>
            <dd>
              <YesNo value={security.networkSegregated} />
            </dd>
          </>
        )}
        {security.accesscontrol != null && (
          <>
            <dt className="text-muted">Access control</dt>
            <dd>
              <YesNo value={security.accesscontrol} />
            </dd>
          </>
        )}
        {security.accesbadge != null && (
          <>
            <dt className="text-muted">Access badge</dt>
            <dd className="font-mono">{security.accesbadge}</dd>
          </>
        )}
      </dl>
      {security.accreditation.length > 0 && (
        <div className="mt-3">
          <div className="text-xs text-muted mb-1.5">Accreditations</div>
          <div className="flex flex-wrap gap-1.5">
            {security.accreditation.map((a) => (
              <span
                key={a}
                className="px-2 py-0.5 rounded text-xs font-mono bg-surface-2 text-fg"
              >
                {a}
              </span>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}
