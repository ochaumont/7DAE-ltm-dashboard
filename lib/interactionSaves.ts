import type { EdgeColorKind } from "@/components/interaction/DependencyGraph";
import type { ElkAlgorithm } from "@/components/interaction/useElkLayout";

export type InteractionSaveNode = { id: string; x: number; y: number };
export type InteractionSaveEdge = {
  source: string;
  target: string;
  kind: EdgeColorKind;
};
export type InteractionSave = {
  version: 1;
  rootExternalId: string;
  algorithm: ElkAlgorithm;
  nodes: InteractionSaveNode[];
  edges: InteractionSaveEdge[];
  savedAt: string;
};

const INDEX_KEY = "interaction-saves";
const entryKey = (name: string) => `interaction-save:${name}`;

function safeGetItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: string): boolean {
  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function safeRemoveItem(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore — nothing to clean up if storage is unavailable
  }
}

function readIndex(): string[] {
  const raw = safeGetItem(INDEX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === "string") : [];
  } catch {
    return [];
  }
}

function writeIndex(names: string[]): boolean {
  return safeSetItem(INDEX_KEY, JSON.stringify(names));
}

export function listSaves(): string[] {
  return readIndex();
}

export function loadSave(name: string): InteractionSave | null {
  const raw = safeGetItem(entryKey(name));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as InteractionSave;
    if (parsed.version !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Overwrites silently if `name` already exists — no confirmation, per spec. */
export function writeSave(name: string, data: InteractionSave): boolean {
  const wroteEntry = safeSetItem(entryKey(name), JSON.stringify(data));
  if (!wroteEntry) return false;
  const names = readIndex();
  if (!names.includes(name)) {
    return writeIndex([...names, name]);
  }
  return true;
}

export function deleteSave(name: string): void {
  safeRemoveItem(entryKey(name));
  writeIndex(readIndex().filter((n) => n !== name));
}
