import type { StorageLike } from "./history.ts";
import { formatNotation, parseNotation } from "./notation.ts";
import { SHARE_VERSION } from "./share.ts";
import type { RollSpec } from "./dice.ts";

/**
 * A set of dice with a name: a roll somebody wants to find again, such as
 * "Longsword" for `1d8+3` or "Skirmish" for `2d[Hit=1,Miss=0,Miss=0]`. It is
 * kept as notation, so it holds custom and loaded dice as readily as plain
 * ones, and is as easy to share as to keep. Sets live on the device, in the
 * browser's storage: there is no account and no server.
 */
export type DiceSet = {
  /** What the set is called: 1 to `MAX_SET_NAME` characters. */
  name: string;
  /** The dice, as notation in its one canonical spelling. */
  notation: string;
};

/** The most sets kept on one device. */
export const MAX_SETS = 50;
/** The longest a set's name may be, in characters. */
export const MAX_SET_NAME = 40;

/** A set from a name and a roll, or null when the name is empty or too long or the dice cannot be rolled. The name is trimmed. */
export function makeSet(name: string, dice: RollSpec | string): DiceSet | null {
  const called = name.trim().replace(/\s+/g, " ");
  if (called === "" || [...called].length > MAX_SET_NAME) return null;
  const spec = typeof dice === "string" ? parseNotation(dice) : dice;
  if (spec === null) return null;
  return { name: called, notation: formatNotation(spec) };
}

/** Sets read back from their text. Anything that is not a sound set is dropped; text that is not a list reads as none. */
export function parseSets(text: string | null): DiceSet[] {
  if (text === null) return [];
  try {
    const data = JSON.parse(text) as unknown;
    const list = Array.isArray(data) ? data : (data as { sets?: unknown })?.sets;
    if (!Array.isArray(list)) return [];
    const sets: DiceSet[] = [];
    for (const item of list as unknown[]) {
      if (typeof item !== "object" || item === null) continue;
      const { name, notation } = item as Record<string, unknown>;
      const set = typeof name === "string" && typeof notation === "string" ? makeSet(name, notation) : null;
      if (set !== null && !sets.some((s) => s.name === set.name) && sets.length < MAX_SETS) sets.push(set);
    }
    return sets;
  } catch {
    return [];
  }
}

/** Sets as text, to keep in storage. `parseSets` reads it back. */
export function serializeSets(sets: readonly DiceSet[]): string {
  return JSON.stringify({ version: 1, sets });
}

/** The sets kept on a device. A storage that throws reads as none. */
export function loadSets(storage: StorageLike | undefined, key: string): DiceSet[] {
  try {
    return parseSets(storage?.getItem(key) ?? null);
  } catch {
    return [];
  }
}

/** Keep the sets. Returns false when the storage refused, so a caller can say so. */
export function storeSets(storage: StorageLike | undefined, key: string, sets: readonly DiceSet[]): boolean {
  if (storage === undefined) return false;
  try {
    if (sets.length === 0) storage.removeItem(key);
    else storage.setItem(key, serializeSets(sets));
    return true;
  } catch {
    return false;
  }
}

/** The sets with one added, newest first. A set of the same name is replaced, and the oldest go past `MAX_SETS`. Returns a new list. */
export function withSet(sets: readonly DiceSet[], set: DiceSet): DiceSet[] {
  return [set, ...sets.filter((s) => s.name !== set.name)].slice(0, MAX_SETS);
}

/** The sets without the one of that name. Returns a new list. */
export function withoutSet(sets: readonly DiceSet[], name: string): DiceSet[] {
  return sets.filter((s) => s.name !== name);
}

/** A set as a link's query: the dice and the name, for anybody to open and keep. */
export function setQuery(set: DiceSet): string {
  return new URLSearchParams({ dice: set.notation, name: set.name, v: String(SHARE_VERSION) }).toString();
}

/** A set from a link's query, or null when it holds none or its dice cannot be rolled. A link with dice and no name is a set called by its notation. */
export function readSet(query: string | URLSearchParams): DiceSet | null {
  const params = typeof query === "string" ? new URLSearchParams(query.replace(/^\?/, "")) : query;
  const dice = params.get("dice");
  if (dice === null) return null;
  const spec = parseNotation(dice);
  if (spec === null) return null;
  return makeSet(params.get("name") ?? "", spec) ?? makeSet(formatNotation(spec).slice(0, MAX_SET_NAME), spec);
}
