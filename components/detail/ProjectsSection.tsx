import Section from "./Section";

export default function ProjectsSection({
  projects,
}: {
  projects: string[];
}) {
  return (
    <Section title="Projects">
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
    </Section>
  );
}
