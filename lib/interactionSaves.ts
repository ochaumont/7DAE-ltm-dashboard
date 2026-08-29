import type { EdgeColorKind } from "@/components/interaction/DependencyGraph";

export type InteractionSaveNode = { id: string; x: number; y: number };
export type InteractionSaveEdge = {
  source: string;
  target: string;
  kind: EdgeColorKind;
  // Absent on an edge saved before this field existed — reads back as
  // `undefined`, which already means "unstyled/no data" (rendered gray), so
  // no version bump or migration is needed for older saves.
  dependencyType?: "mandatory" | "optional";
};
export type InteractionSave = {
  version: 3;
  rootExternalIds: string[];
  nodes: InteractionSaveNode[];
  edges: InteractionSaveEdge[];
  savedAt: string;
};

/** Pre-single-algorithm save formats — `/depgraph` used to let the user
 * choose an ELK algorithm (`algorithm: "layered" | "radial"`), and before
 * that supported only one root bench at all (`rootExternalId` instead of
 * `rootExternalIds`). Both are transparently upgraded on read (see
 * `loadSave`, dropping `algorithm` — every diagram is radial now — and
 * wrapping a lone `rootExternalId` into an array), never rewritten in place —
 * the next explicit `Save` on them persists the current shape. */
type InteractionSaveV2 = {
  version: 2;
  rootExternalIds: string[];
  algorithm: string;
  nodes: InteractionSaveNode[];
  edges: InteractionSaveEdge[];
  savedAt: string;
};
type InteractionSaveV1 = {
  version: 1;
  rootExternalId: string;
  algorithm: string;
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
    const parsed = JSON.parse(raw) as InteractionSave | InteractionSaveV2 | InteractionSaveV1;
    if (parsed.version === 1) {
      const { rootExternalId, algorithm: _algorithm, ...rest } = parsed;
      return { ...rest, version: 3, rootExternalIds: [rootExternalId] };
    }
    if (parsed.version === 2) {
      const { algorithm: _algorithm, ...rest } = parsed;
      return { ...rest, version: 3 };
    }
    if (parsed.version !== 3) return null;
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
