import AtaTile from "./AtaTile";

/**
 * Single horizontal row of ATA chapter pictograms. Returns `null`
 * when there are no chapters to show.
 */
export default function AtaList({ atas }: { atas: string[] }) {
  if (atas.length === 0) return null;
  return (
    <div className="flex flex-row flex-nowrap items-start gap-3">
      {atas.map((code) => (
        <AtaTile key={code} code={code} />
      ))}
    </div>
  );
}
