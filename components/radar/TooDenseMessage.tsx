type Props = { count: number; limit: number };

export default function TooDenseMessage({ count, limit }: Readonly<Props>) {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="max-w-sm text-center text-sm text-muted">
        {count} lab test means match these filters — narrow them down to{" "}
        {limit} or fewer to display the radar view.
      </p>
    </div>
  );
}
