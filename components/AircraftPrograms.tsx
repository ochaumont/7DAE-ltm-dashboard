import AircraftProgramTile from "./AircraftProgramTile";

/**
 * Grid of aircraft program tiles, max 3 per row, displayed next to the
 * mini-map in the LTM detail header. Returns `null` when no programs.
 */
export default function AircraftPrograms({
  programs,
}: {
  programs: string[];
}) {
  if (programs.length === 0) return null;
  return (
    <div className="grid grid-cols-3 gap-2">
      {programs.map((p) => (
        <AircraftProgramTile key={p} code={p} />
      ))}
    </div>
  );
}
