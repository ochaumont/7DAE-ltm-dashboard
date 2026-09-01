import AtaIcon from "./icons/AtaIcon";

/**
 * Single ATA chapter: gear pictogram on top, code label below (already includes
 * the "ATA " prefix from the backend), stacked vertically and centered.
 * Mirrors AircraftProgramTile.
 */
export default function AtaTile({ code }: Readonly<{ code: string }>) {
  return (
    <div className="flex flex-col items-center gap-1 p-1 text-fg">
      <AtaIcon size={28} />
      <span className="text-[11px] font-mono leading-none truncate max-w-full">
        {code}
      </span>
    </div>
  );
}
