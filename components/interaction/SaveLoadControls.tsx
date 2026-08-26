"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  activeSaveName: string | null;
  dirty: boolean;
  saves: string[];
  errorMessage: string | null;
  disableSave?: boolean;
  onSaveAs: (name: string) => void;
  onSave: () => void;
  onLoad: (name: string) => void;
  onDelete: (name: string) => void;
};

export default function SaveLoadControls({
  activeSaveName,
  dirty,
  saves,
  errorMessage,
  disableSave = false,
  onSaveAs,
  onSave,
  onLoad,
  onDelete,
}: Props) {
  const [open, setOpen] = useState<"saveAs" | "load" | null>(null);
  const [name, setName] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(null);
    }
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(null);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  function submitSaveAs() {
    const trimmed = name.trim();
    if (!trimmed) return; // empty/whitespace names are refused
    onSaveAs(trimmed);
    setName("");
    setOpen(null);
  }

  // "Save" with no active save behaves like "Save as" — same naming popover.
  function handleSaveClick() {
    if (!activeSaveName) {
      setName("");
      setOpen("saveAs");
    } else {
      onSave();
    }
  }

  const buttonClass =
    "rounded-card border border-border bg-surface/90 px-2.5 py-1.5 text-xs text-fg backdrop-blur-md hover:bg-surface-2";

  return (
    <div ref={rootRef} className="relative flex items-center gap-1.5">
      <span className="flex items-center gap-1.5 rounded-card border border-border bg-surface/90 px-2.5 py-1.5 text-xs text-muted backdrop-blur-md">
        {activeSaveName ?? "Unsaved"}
        {dirty && (
          <span className="text-warning" title="Unsaved changes" aria-hidden="true">
            ●
          </span>
        )}
      </span>
      <button
        type="button"
        onClick={handleSaveClick}
        disabled={disableSave}
        className={`${buttonClass} disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        Save
      </button>
      <button
        type="button"
        onClick={() => {
          setName("");
          setOpen((o) => (o === "saveAs" ? null : "saveAs"));
        }}
        disabled={disableSave}
        className={`${buttonClass} disabled:opacity-40 disabled:cursor-not-allowed`}
      >
        Save as
      </button>
      <button
        type="button"
        onClick={() => setOpen((o) => (o === "load" ? null : "load"))}
        className={buttonClass}
      >
        Load
      </button>

      {open === "saveAs" && (
        <div className="absolute right-0 top-full z-30 mt-1 w-56 rounded-card border border-border bg-surface p-2 shadow-2xl">
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitSaveAs();
            }}
            placeholder="Save name…"
            className="w-full rounded border border-border bg-surface px-2 py-1 text-sm text-fg focus:outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={submitSaveAs}
            disabled={!name.trim()}
            className="mt-2 w-full rounded bg-accent px-2 py-1 text-xs font-semibold text-accent-fg disabled:opacity-40"
          >
            Save
          </button>
        </div>
      )}

      {open === "load" && (
        <div className="absolute right-0 top-full z-30 mt-1 max-h-64 w-64 overflow-y-auto rounded-card border border-border bg-surface p-1.5 shadow-2xl">
          {saves.length === 0 ? (
            <p className="px-2 py-1.5 text-xs text-muted">No saved diagrams yet.</p>
          ) : (
            saves.map((n) => (
              <div
                key={n}
                className="flex items-center gap-1 rounded px-2 py-1.5 text-sm hover:bg-surface-2"
              >
                <button
                  type="button"
                  onClick={() => {
                    onLoad(n);
                    setOpen(null);
                  }}
                  className="flex-1 truncate text-left text-fg"
                >
                  {n}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(n)}
                  aria-label={`Delete ${n}`}
                  className="text-muted hover:text-danger"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {errorMessage && !open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-64 rounded-card border border-danger/40 bg-surface px-2.5 py-1.5 text-xs text-danger shadow-2xl">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
