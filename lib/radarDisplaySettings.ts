"use client";

import { useSyncExternalStore } from "react";

/**
 * How many lab test means the `/depview` radar will render before falling
 * back to `TooDenseMessage` instead of `CircularGraph`. Global to the app
 * (not per-visit), persisted in localStorage — same external-store pattern
 * as `lib/interactionDisplaySettings.ts`.
 */
export type RadarDisplaySettings = {
  densityLimit: number;
};

const STORAGE_KEY = "radar-display-settings";

export const RADAR_DENSITY_LIMIT_MIN = 50;
export const RADAR_DENSITY_LIMIT_MAX = 500;

const DEFAULT_SETTINGS: RadarDisplaySettings = {
  densityLimit: 100,
};

let state: RadarDisplaySettings = DEFAULT_SETTINGS;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate(): void {
  if (hydrated || typeof globalThis.window === "undefined") return;
  hydrated = true;
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      state = {
        densityLimit:
          typeof parsed.densityLimit === "number"
            ? Math.min(
                RADAR_DENSITY_LIMIT_MAX,
                Math.max(RADAR_DENSITY_LIMIT_MIN, parsed.densityLimit),
              )
            : DEFAULT_SETTINGS.densityLimit,
      };
    }
  } catch {
    // localStorage unavailable or corrupt value — keep defaults
  }
}

function emit(): void {
  for (const l of listeners) l();
}

function subscribe(callback: () => void): () => void {
  hydrate();
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function getSnapshot(): RadarDisplaySettings {
  hydrate();
  return state;
}

function getServerSnapshot(): RadarDisplaySettings {
  return DEFAULT_SETTINGS;
}

export function useRadarDisplaySettings(): RadarDisplaySettings {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setRadarDisplaySetting<K extends keyof RadarDisplaySettings>(
  key: K,
  value: RadarDisplaySettings[K],
): void {
  hydrate();
  state = { ...state, [key]: value };
  try {
    globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (private mode, etc.) — session-only toggle still works
  }
  emit();
}
