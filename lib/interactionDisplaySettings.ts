"use client";

import { useSyncExternalStore } from "react";

/**
 * Which info is shown on each bench box in the `/depgraph` diagram.
 * Global to the app (not per-diagram), persisted in localStorage so it
 * survives a reload — deliberately NOT part of `InteractionSave` (see
 * `lib/interactionSaves.ts`), per spec.
 *
 * Same external-store pattern as `lib/catalogueFilters.ts`
 * (`useSyncExternalStore`), plus the localStorage persistence already used by
 * `lib/useTheme.ts` / `lib/interactionSaves.ts`.
 */
export type InteractionDisplaySettings = {
  showQualitySeal: boolean;
  showType: boolean;
  showCity: boolean;
  showStatus: boolean;
  showBuilding: boolean;
  showRoom: boolean;
  nodeWidth: number;
};

const STORAGE_KEY = "interaction-display-settings";

// 80%–150% of the original fixed box width (200px) — deliberately narrow so a
// resize can't make a dense diagram unreadably overlapped.
export const NODE_WIDTH_MIN = 160;
export const NODE_WIDTH_MAX = 300;

const DEFAULT_SETTINGS: InteractionDisplaySettings = {
  showQualitySeal: true,
  showType: true,
  showCity: true,
  showStatus: true,
  showBuilding: true,
  showRoom: true,
  nodeWidth: 200,
};

let state: InteractionDisplaySettings = DEFAULT_SETTINGS;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate(): void {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      state = {
        showQualitySeal:
          typeof parsed.showQualitySeal === "boolean"
            ? parsed.showQualitySeal
            : DEFAULT_SETTINGS.showQualitySeal,
        showType:
          typeof parsed.showType === "boolean" ? parsed.showType : DEFAULT_SETTINGS.showType,
        showCity:
          typeof parsed.showCity === "boolean" ? parsed.showCity : DEFAULT_SETTINGS.showCity,
        showStatus:
          typeof parsed.showStatus === "boolean" ? parsed.showStatus : DEFAULT_SETTINGS.showStatus,
        showBuilding:
          typeof parsed.showBuilding === "boolean"
            ? parsed.showBuilding
            : DEFAULT_SETTINGS.showBuilding,
        showRoom:
          typeof parsed.showRoom === "boolean" ? parsed.showRoom : DEFAULT_SETTINGS.showRoom,
        nodeWidth:
          typeof parsed.nodeWidth === "number"
            ? Math.min(NODE_WIDTH_MAX, Math.max(NODE_WIDTH_MIN, parsed.nodeWidth))
            : DEFAULT_SETTINGS.nodeWidth,
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

function getSnapshot(): InteractionDisplaySettings {
  hydrate();
  return state;
}

function getServerSnapshot(): InteractionDisplaySettings {
  return DEFAULT_SETTINGS;
}

export function useInteractionDisplaySettings(): InteractionDisplaySettings {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function setInteractionDisplaySetting<K extends keyof InteractionDisplaySettings>(
  key: K,
  value: InteractionDisplaySettings[K],
): void {
  hydrate();
  state = { ...state, [key]: value };
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (private mode, etc.) — session-only toggle still works
  }
  emit();
}
