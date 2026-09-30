import { isDieSides, keptFaces, normalizeSpec, totalOf, type Roll } from "./dice.ts";

/** A history keeps the latest rolls and forgets the oldest past this many. */
export const HISTORY_LIMIT = 500;

/** The storage a browser offers, or anything shaped like it. */
export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Add a roll to the end, oldest dropped past the limit. Returns a new array. */
export function addToHistory(history: readonly Roll[], roll: Roll, limit: number = HISTORY_LIMIT): Roll[] {
  const next = [...history, roll];
  return next.length > limit ? next.slice(next.length - limit) : next;
}

/**
 * A stored roll, checked. Anything a person's browser hands back may be from an
 * older version, edited by hand or half written, so a roll that does not add
 * up is dropped rather than shown.
 */
function readRoll(value: unknown): Roll | null {
  if (typeof value !== "object" || value === null) return null;
  const r = value as Record<string, unknown>;
  const spec = r.spec as Record<string, unknown> | undefined;
  if (spec === undefined || !isDieSides(spec.sides)) return null;
  const fair = normalizeSpec(spec);
  if (!Array.isArray(r.faces) || r.faces.length !== fair.count) return null;
  const faces = r.faces as unknown[];
  if (!faces.every((f) => Number.isInteger(f) && (f as number) >= 1 && (f as number) <= fair.sides)) return null;
  const at = Number(r.at);
  if (!Number.isFinite(at)) return null;
  const kept = keptFaces(faces as number[], fair.keep);
  return {
    id: typeof r.id === "string" ? r.id : `${at.toString(36)}-s`,
    spec: fair,
    faces: faces as number[],
    kept,
    total: totalOf(faces as number[], kept, fair.modifier),
    at,
    seed: typeof r.seed === "string" ? r.seed : null,
  };
}

export function parseHistory(text: string | null): Roll[] {
  if (text === null) return [];
  try {
    const data = JSON.parse(text) as unknown;
    const list = Array.isArray(data) ? data : (data as { rolls?: unknown })?.rolls;
    if (!Array.isArray(list)) return [];
    return list.flatMap((item) => {
      const roll = readRoll(item);
      return roll === null ? [] : [roll];
    });
  } catch {
    return [];
  }
}

export function serializeHistory(history: readonly Roll[]): string {
  return JSON.stringify({ version: 1, rolls: history });
}

/** Read a kept history. A storage that throws (a private window, blocked cookies) reads as empty. */
export function loadHistory(storage: StorageLike | undefined, key: string): Roll[] {
  try {
    return parseHistory(storage?.getItem(key) ?? null);
  } catch {
    return [];
  }
}

/** Keep a history. Returns false when the storage refused, so a caller can say so. */
export function saveHistory(storage: StorageLike | undefined, key: string, history: readonly Roll[]): boolean {
  if (storage === undefined) return false;
  try {
    if (history.length === 0) storage.removeItem(key);
    else storage.setItem(key, serializeHistory(history));
    return true;
  } catch {
    return false;
  }
}
