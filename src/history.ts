import { MAX_DICE_BY_CODE, canHold, isSides, normalizeSpec, rollFrom, type Roll } from "./dice.ts";

/** A history keeps the latest rolls and forgets the oldest past this many.
 *
 * @example
 * ```ts
 * import { HISTORY_LIMIT } from "@johnmorrisdotca/korokoro";
 * console.log(HISTORY_LIMIT);
 * ```
 */
export const HISTORY_LIMIT = 500;

/** The storage a browser offers, or anything shaped like it.
 *
 * @example
 * ```ts
 * import type { StorageLike } from "@johnmorrisdotca/korokoro";
 * const value: StorageLike = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
 * console.log(value.getItem("history"));
 * ```
 */
export type StorageLike = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Add a roll to the end, oldest dropped past the limit. Returns a new array.
 *
 * @param history - Completed rolls, newest first where the history API requires it.
 * @param roll - The completed roll to read or record.
 * @param limit - The maximum number of records retained.
 * @returns Add a roll to the end, oldest dropped past the limit. Returns a new array.

 *
 * @example
 * ```ts
 * import { addToHistory } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec, rollFrom } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * const sample = rollFrom(spec, [2, 5], "saved", 0, null)!;
 * console.log(addToHistory([], sample).length);
 * ```
 */
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
  if (spec === undefined || !isSides(spec.sides)) return null;
  const fair = normalizeSpec(spec, { maxDice: MAX_DICE_BY_CODE });
  if (!Array.isArray(r.faces)) return null;
  const at = Number(r.at);
  if (!Number.isFinite(at)) return null;
  // The dice, the total and whether the roll was loaded are worked out again from the spec and the faces, never trusted as stored.
  const read = rollFrom(fair, r.faces as unknown[], typeof r.id === "string" ? r.id : `${at.toString(36)}-s`, at, typeof r.seed === "string" ? r.seed : null);
  if (read === null) return null;
  // Which dice were held is kept only when it fits the roll: one yes or no for each die of dice that can be held.
  if (Array.isArray(r.held) && r.held.length === read.faces.length && canHold(fair)) read.held = r.held.map((h) => h === true);
  // Which set a roll was one of, when it says so soundly.
  const set = r.set as Record<string, unknown> | undefined;
  if (typeof set === "object" && set !== null && typeof set.id === "string" && Number.isInteger(set.index) && Number.isInteger(set.of) && (set.index as number) >= 0 && (set.index as number) < (set.of as number)) {
    read.set = { id: set.id, index: set.index as number, of: set.of as number };
  }
  return read;
}

/** A kept history read back from its text. Rolls that do not add up are dropped; text that is not a history reads as empty.
 *
 * @param text - Text to parse, validate or format.
 * @returns A kept history read back from its text. Rolls that do not add up are dropped; text that is not a history reads as empty.

 *
 * @example
 * ```ts
 * import { parseHistory } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec, rollFrom, serializeHistory } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * const sample = rollFrom(spec, [2, 5], "saved", 0, null)!;
 * console.log(parseHistory(serializeHistory([sample])).length);
 * ```
 */
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

/** A history as text, to keep in a browser's storage or anywhere else. `parseHistory` reads it back.
 *
 * @param history - Completed rolls, newest first where the history API requires it.
 * @returns A history as text, to keep in a browser's storage or anywhere else. `parseHistory` reads it back.

 *
 * @example
 * ```ts
 * import { serializeHistory } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec, rollFrom } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * const sample = rollFrom(spec, [2, 5], "saved", 0, null)!;
 * console.log(serializeHistory([sample]));
 * ```
 */
export function serializeHistory(history: readonly Roll[]): string {
  // Without `dice`: it is worked out from the faces on the way back in.
  return JSON.stringify({ version: 1, rolls: history.map((r) => ({ id: r.id, spec: r.spec, faces: r.faces, kept: r.kept, total: r.total, at: r.at, seed: r.seed, held: r.held, loaded: r.loaded, set: r.set })) });
}

/** Read a kept history. A storage that throws (a private window, blocked cookies) reads as empty.
 *
 * @param storage - Storage with getItem, setItem and removeItem, or undefined when unavailable.
 * @param key - The storage key to read or write.
 * @returns Read a kept history. A storage that throws (a private window, blocked cookies) reads as empty.

 *
 * @example
 * ```ts
 * import { loadHistory } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec, rollFrom, saveHistory } from "@johnmorrisdotca/korokoro";
 * const values = new Map<string, string>();
 * const storage = {
 *   getItem: (key: string) => values.get(key) ?? null,
 *   setItem: (key: string, value: string) => { values.set(key, value); },
 *   removeItem: (key: string) => { values.delete(key); },
 * };
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * const sample = rollFrom(spec, [2, 5], "saved", 0, null)!;
 * saveHistory(storage, "history", [sample]);
 * console.log(loadHistory(storage, "history").length);
 * ```
 */
export function loadHistory(storage: StorageLike | undefined, key: string): Roll[] {
  try {
    return parseHistory(storage?.getItem(key) ?? null);
  } catch {
    return [];
  }
}

/** Keep a history. Returns false when the storage refused, so a caller can say so.
 *
 * @param storage - Storage with getItem, setItem and removeItem, or undefined when unavailable.
 * @param key - The storage key to read or write.
 * @param history - Completed rolls, newest first where the history API requires it.
 * @returns Keep a history. Returns false when the storage refused, so a caller can say so.

 *
 * @example
 * ```ts
 * import { saveHistory } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec, parseHistory, rollFrom } from "@johnmorrisdotca/korokoro";
 * const values = new Map<string, string>();
 * const storage = {
 *   getItem: (key: string) => values.get(key) ?? null,
 *   setItem: (key: string, value: string) => { values.set(key, value); },
 *   removeItem: (key: string) => { values.delete(key); },
 * };
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * const sample = rollFrom(spec, [2, 5], "saved", 0, null)!;
 * console.log(saveHistory(storage, "history", [sample]));
 * console.log(parseHistory(storage.getItem("history")).length);
 * ```
 */
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
