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
  const [menuOpen, setMenuOpen] = useState(false);
  const [popup, setPopup] = useState<"saveAs" | "load" | null>(null);
  const [name, setName] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [menuOpen]);

  function submitSaveAs() {
    const trimmed = name.trim();
    if (!trimmed) return; // empty/whitespace names are refused
    onSaveAs(trimmed);
    setName("");
    setPopup(null);
  }

  const saveDisabled = !activeSaveName || disableSave;
  const saveAsDisabled = disableSave;

  const saveIconClass = !activeSaveName
    ? "text-muted opacity-50 cursor-not-allowed"
    : dirty
      ? "text-danger cursor-pointer hover:opacity-80"
      : "text-success cursor-pointer hover:opacity-80";

  const menuItemClass = (enabled: boolean) =>
    `block w-full px-3 py-1.5 text-left text-sm rounded ${
      enabled ? "text-fg hover:bg-surface-2 cursor-pointer" : "text-muted opacity-60 cursor-not-allowed"
    }`;

  return (
    <div ref={rootRef} className="relative flex items-center gap-1.5">
      <button
        type="button"
        onClick={onSave}
        disabled={!activeSaveName}
        title={activeSaveName ?? undefined}
        aria-label={activeSaveName ? `Save state: ${activeSaveName}` : "Not saved yet"}
        className={`flex h-8 w-8 items-center justify-center rounded-card border border-border bg-surface transition-opacity ${saveIconClass}`}
      >
        <SaveIcon />
      </button>

      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className="rounded-card border border-border bg-surface/90 px-2.5 py-1.5 text-xs text-fg backdrop-blur-md hover:bg-surface-2"
      >
        ...
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 min-w-[160px] rounded-card border border-border bg-surface py-1.5 shadow-2xl"
        >
          <button
            type="button"
            role="menuitem"
            disabled={saveDisabled}
            onClick={() => {
              onSave();
              setMenuOpen(false);
            }}
            className={menuItemClass(!saveDisabled)}
          >
            Save
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={saveAsDisabled}
            onClick={() => {
              setName("");
              setPopup("saveAs");
              setMenuOpen(false);
            }}
            className={menuItemClass(!saveAsDisabled)}
          >
            Save as new
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setPopup("load");
              setMenuOpen(false);
            }}
            className={menuItemClass(true)}
          >
            Load
          </button>
        </div>
      )}

      {popup === "saveAs" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setPopup(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="save-as-title"
            className="w-full max-w-sm rounded-lg border border-border bg-surface p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="save-as-title" className="mb-3 text-base font-semibold">
              Save as new
            </h2>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitSaveAs();
                if (e.key === "Escape") setPopup(null);
              }}
              placeholder="Save name…"
              className="w-full rounded border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:border-accent"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPopup(null)}
                className="rounded px-3 py-1.5 text-sm text-muted hover:bg-surface-2"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitSaveAs}
                disabled={!name.trim()}
                className="rounded bg-accent px-3 py-1.5 text-sm font-semibold text-accent-fg disabled:opacity-40"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {popup === "load" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setPopup(null)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="load-title"
            className="w-full max-w-sm max-h-[70vh] overflow-y-auto rounded-lg border border-border bg-surface p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="load-title" className="mb-3 text-base font-semibold">
              Load
            </h2>
            {saves.length === 0 ? (
              <p className="px-1 py-1.5 text-sm text-muted">No saved diagrams yet.</p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {saves.map((n) => (
                  <div
                    key={n}
                    className="flex items-center gap-1 rounded px-2 py-1.5 text-sm hover:bg-surface-2"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onLoad(n);
                        setPopup(null);
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
                      <TrashIcon />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 max-w-xs rounded-card border border-danger/40 bg-surface px-3 py-2 text-xs text-danger shadow-2xl">
          {errorMessage}
        </div>
      )}
    </div>
  );
}

function SaveIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" />
      <path d="M17 21v-8H7v8" />
      <path d="M7 3v5h8" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}
