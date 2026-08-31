"use client";

import { useEffect, useRef, useState } from "react";
import {
  useRadarDisplaySettings,
  setRadarDisplaySetting,
  RADAR_DENSITY_LIMIT_MIN,
  RADAR_DENSITY_LIMIT_MAX,
} from "@/lib/radarDisplaySettings";

export default function RadarSettingsControl() {
  const settings = useRadarDisplaySettings();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Radar display settings"
        title="Radar display settings"
        className="flex h-8 w-8 items-center justify-center rounded-card border border-border bg-surface/90 text-fg backdrop-blur-md hover:bg-surface-2"
      >
        <SettingsIcon />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-30 mt-1 min-w-[200px] rounded-card border border-border bg-surface p-2 shadow-2xl"
        >
          <div className="flex items-center justify-between gap-3 px-1 py-1.5 text-sm text-fg">
            <label htmlFor="radar-density-limit-slider">Max lab test means</label>
            <span className="font-mono text-xs text-muted">{settings.densityLimit}</span>
          </div>
          <input
            id="radar-density-limit-slider"
            type="range"
            min={RADAR_DENSITY_LIMIT_MIN}
            max={RADAR_DENSITY_LIMIT_MAX}
            step={10}
            value={settings.densityLimit}
            onChange={(e) => setRadarDisplaySetting("densityLimit", Number(e.target.value))}
            className="w-full px-1"
          />
        </div>
      )}
    </div>
  );
}

function SettingsIcon() {
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
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />
    </svg>
  );
}
