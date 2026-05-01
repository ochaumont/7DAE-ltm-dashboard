import AtaIcon from "./icons/AtaIcon";

/**
 * Single ATA chapter: gear pictogram on top, `ATA {code}` label below,
 * stacked vertically and centered. Mirrors AircraftProgramTile.
 */
export default function AtaTile({ code }: { code: string }) {
  return (
    <div className="flex flex-col items-center gap-1 p-1 text-fg">
      <AtaIcon size={28} />
      <span className="text-[11px] font-mono leading-none truncate max-w-full">
        ATA {code}
      </span>
    </div>
  );
}
