/**
 * Small inline rendering of a `boolean | null` field. `null` → "Unknown" in
 * muted italic; `true` is highlighted in success color.
 */
export default function YesNo({ value }: { value: boolean | null }) {
  if (value == null)
    return <span className="text-muted italic">Unknown</span>;
  return (
    <span
      className={
        value ? "text-success font-semibold" : "text-muted"
      }
    >
      {value ? "Yes" : "No"}
    </span>
  );
}
