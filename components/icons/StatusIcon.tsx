import clsx from "clsx";
import type { LabTestMeanStatus } from "@/lib/types";

type Props = {
  status: LabTestMeanStatus;
  size?: number;
  className?: string;
};

const COLOR_CLASS: Record<LabTestMeanStatus, string> = {
  operational: "text-success",
  mothballed: "text-warning",
  "out-of-service": "text-danger",
  "in-project": "text-accent",
};

export default function StatusIcon({ status, size = 14, className }: Readonly<Props>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={clsx(COLOR_CLASS[status], className)}
    >
      {GLYPH[status]}
    </svg>
  );
}

const GLYPH: Record<LabTestMeanStatus, React.ReactNode> = {
  operational: <circle cx="12" cy="12" r="9" fill="currentColor" stroke="none" />,
  mothballed: (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="10" y1="9" x2="10" y2="15" />
      <line x1="14" y1="9" x2="14" y2="15" />
    </>
  ),
  "out-of-service": (
    <>
      <circle cx="12" cy="12" r="10" />
      <line x1="9" y1="9" x2="15" y2="15" />
      <line x1="15" y1="9" x2="9" y2="15" />
    </>
  ),
  "in-project": (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 7 12 12 15 14" />
    </>
  ),
};
