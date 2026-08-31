"use client";

import { useState } from "react";
import type { ReactNode } from "react";

type Props = {
  title: string;
  defaultOpen?: boolean;
  /** Extra controls shown on the header row, next to the title (e.g. Select
   * all / Deselect all) — always visible, even when collapsed. */
  headerExtra?: ReactNode;
  children: ReactNode;
};

export default function CollapsibleSection({
  title,
  defaultOpen = true,
  headerExtra,
  children,
}: Readonly<Props>) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <div className="flex items-center justify-between gap-2 rounded bg-surface-2 px-2 py-1.5">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fg"
        >
          <ChevronIcon open={open} />
          {title}
        </button>
        {headerExtra}
      </div>
      {open && <div className="mt-1.5">{children}</div>}
    </div>
  );
}

function ChevronIcon({ open }: Readonly<{ open: boolean }>) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`shrink-0 transition-transform ${open ? "rotate-90" : ""}`}
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}
