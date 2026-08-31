import clsx from "clsx";

const labels: Record<"DRAFT" | "RELEASE", string> = {
  DRAFT: "DRAFT",
  RELEASE: "RELEASE",
};

// Solid (not translucent) fill — this badge overlays a cover photo, so it
// needs to stay legible against arbitrary image content, unlike BadgeStatus's
// tinted pills which sit on a plain surface background.
const colors: Record<"DRAFT" | "RELEASE", string> = {
  DRAFT: "bg-muted text-bg",
  RELEASE: "bg-success text-bg",
};

export default function BadgeQualitySeal({
  lxState,
}: Readonly<{
  lxState: "DRAFT" | "RELEASE";
}>) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide shadow-sm",
        colors[lxState],
      )}
    >
      {labels[lxState]}
    </span>
  );
}
