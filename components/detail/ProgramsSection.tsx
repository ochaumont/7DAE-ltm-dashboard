import Section from "./Section";

export default function ProgramsSection({
  programs,
  projects,
}: {
  programs: string[];
  projects: string[];
}) {
  return (
    <Section title="Programs · Projects">
      <div className="space-y-3">
        <div className="flex items-baseline gap-3">
          <span className="text-xs text-muted w-20">Programs</span>
          <div className="flex flex-wrap gap-1.5">
            {programs.length === 0 && (
              <span className="text-sm text-muted">None</span>
            )}
            {programs.map((p) => (
              <span
                key={p}
                className="px-2 py-0.5 rounded text-xs font-mono bg-accent/15 text-accent"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-baseline gap-3">
          <span className="text-xs text-muted w-20">Projects</span>
          <div className="flex flex-wrap gap-1.5">
            {projects.length === 0 && (
              <span className="text-sm text-muted">None</span>
            )}
            {projects.map((p) => (
              <span
                key={p}
                className="px-2 py-0.5 rounded text-xs bg-surface-2 text-fg"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}
