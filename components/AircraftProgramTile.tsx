import AircraftIcon from "./icons/AircraftIcon";

/**
 * Single aircraft program: plane pictogram on top, program code below,
 * stacked vertically and centered. No frame — light/airy by design.
 */
export default function AircraftProgramTile({ code }: Readonly<{ code: string }>) {
  return (
    <div className="flex flex-col items-center gap-1 p-1 text-fg">
      <AircraftIcon size={28} />
      <span className="text-[11px] font-mono leading-none truncate max-w-full">
        {code}
      </span>
    </div>
  );
}
