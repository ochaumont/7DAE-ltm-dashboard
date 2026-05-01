import AircraftProgramTile from "./AircraftProgramTile";

/**
 * Single horizontal row of aircraft program pictograms. Returns `null`
 * when there are no programs to show.
 */
export default function AircraftPrograms({
  programs,
}: {
  programs: string[];
}) {
  if (programs.length === 0) return null;
  return (
    <div className="flex flex-row flex-nowrap items-start gap-3">
      {programs.map((p) => (
        <AircraftProgramTile key={p} code={p} />
      ))}
    </div>
  );
}
