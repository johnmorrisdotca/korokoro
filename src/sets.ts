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
 *
 * @example
 * ```ts
 * import type { DiceSet } from "@johnmorrisdotca/korokoro";
 * import { makeSet } from "@johnmorrisdotca/korokoro";
 * const value: DiceSet = makeSet("Longsword", "1d8+3")!;
 * console.log(value.notation);
 * ```
 */
export type DiceSet = {
  /** What the set is called: 1 to `MAX_SET_NAME` characters. */
  name: string;
  /** The dice, as notation in its one canonical spelling. */
  notation: string;
};

/** The most sets kept on one device.
 *
 * @example
 * ```ts
 * import { MAX_SETS } from "@johnmorrisdotca/korokoro";
 * console.log(MAX_SETS);
 * ```
 */
export const MAX_SETS = 50;
/** The longest a set's name may be, in characters.
 *
 * @example
 * ```ts
 * import { MAX_SET_NAME } from "@johnmorrisdotca/korokoro";
 * console.log(MAX_SET_NAME);
 * ```
 */
export const MAX_SET_NAME = 40;

/** A set from a name and a roll, or null when the name is empty or too long or the dice cannot be rolled. The name is trimmed.
 *
 * @param name - The preset or saved-set name to look up or write.
 * @param dice - Dice notation, or a callback giving notation for a formula group.
 * @returns A set from a name and a roll, or null when the name is empty or too long or the dice cannot be rolled. The name is trimmed.

 *
 * @example
 * ```ts
 * import { makeSet } from "@johnmorrisdotca/korokoro";
 * console.log(makeSet("Longsword", "1d8+3"));
 * ```
 */
export function makeSet(name: string, dice: RollSpec | string): DiceSet | null {
  const called = name.trim().replace(/\s+/g, " ");
  if (called === "" || [...called].length > MAX_SET_NAME) return null;
  const spec = typeof dice === "string" ? parseNotation(dice) : dice;
  if (spec === null) return null;
  return { name: called, notation: formatNotation(spec) };
}

/** Sets read back from their text. Anything that is not a sound set is dropped; text that is not a list reads as none.
 *
 * @param text - Text to parse, validate or format.
 * @returns Sets read back from their text. Anything that is not a sound set is dropped; text that is not a list reads as none.

 *
 * @example
 * ```ts
 * import { parseSets } from "@johnmorrisdotca/korokoro";
 * import { makeSet, serializeSets } from "@johnmorrisdotca/korokoro";
 * const set = makeSet("Longsword", "1d8+3")!;
 * console.log(parseSets(serializeSets([set])).length);
 * ```
 */
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

/** Sets as text, to keep in storage. `parseSets` reads it back.
 *
 * @param sets - The saved sets to read or update.
 * @returns Sets as text, to keep in storage. `parseSets` reads it back.

 *
 * @example
 * ```ts
 * import { serializeSets } from "@johnmorrisdotca/korokoro";
 * import { makeSet } from "@johnmorrisdotca/korokoro";
 * const set = makeSet("Longsword", "1d8+3")!;
 * console.log(serializeSets([set]));
 * ```
 */
export function serializeSets(sets: readonly DiceSet[]): string {
  return JSON.stringify({ version: 1, sets });
}

/** The sets kept on a device. A storage that throws reads as none.
 *
 * @param storage - Storage with getItem, setItem and removeItem, or undefined when unavailable.
 * @param key - The storage key to read or write.
 * @returns The sets kept on a device. A storage that throws reads as none.

 *
 * @example
 * ```ts
 * import { loadSets } from "@johnmorrisdotca/korokoro";
 * import { makeSet, storeSets } from "@johnmorrisdotca/korokoro";
 * const values = new Map<string, string>();
 * const storage = {
 *   getItem: (key: string) => values.get(key) ?? null,
 *   setItem: (key: string, value: string) => { values.set(key, value); },
 *   removeItem: (key: string) => { values.delete(key); },
 * };
 * const set = makeSet("Longsword", "1d8+3")!;
 * storeSets(storage, "sets", [set]);
 * console.log(loadSets(storage, "sets").length);
 * ```
 */
export function loadSets(storage: StorageLike | undefined, key: string): DiceSet[] {
  try {
    return parseSets(storage?.getItem(key) ?? null);
  } catch {
    return [];
  }
}

/** Keep the sets. Returns false when the storage refused, so a caller can say so.
 *
 * @param storage - Storage with getItem, setItem and removeItem, or undefined when unavailable.
 * @param key - The storage key to read or write.
 * @param sets - The saved sets to read or update.
 * @returns Keep the sets. Returns false when the storage refused, so a caller can say so.

 *
 * @example
 * ```ts
 * import { storeSets } from "@johnmorrisdotca/korokoro";
 * import { makeSet } from "@johnmorrisdotca/korokoro";
 * const values = new Map<string, string>();
 * const storage = {
 *   getItem: (key: string) => values.get(key) ?? null,
 *   setItem: (key: string, value: string) => { values.set(key, value); },
 *   removeItem: (key: string) => { values.delete(key); },
 * };
 * const set = makeSet("Longsword", "1d8+3")!;
 * console.log(storeSets(storage, "sets", [set]));
 * ```
 */
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

/** The sets with one added, newest first. A set of the same name is replaced, and the oldest go past `MAX_SETS`. Returns a new list.
 *
 * @param sets - The saved sets to read or update.
 * @param set - The saved set to add or share.
 * @returns The sets with one added, newest first. A set of the same name is replaced, and the oldest go past `MAX_SETS`. Returns a new list.

 *
 * @example
 * ```ts
 * import { withSet } from "@johnmorrisdotca/korokoro";
 * import { makeSet } from "@johnmorrisdotca/korokoro";
 * const set = makeSet("Longsword", "1d8+3")!;
 * console.log(withSet([], set).map((saved) => saved.name));
 * ```
 */
export function withSet(sets: readonly DiceSet[], set: DiceSet): DiceSet[] {
  return [set, ...sets.filter((s) => s.name !== set.name)].slice(0, MAX_SETS);
}

/** The sets without the one of that name. Returns a new list.
 *
 * @param sets - The saved sets to read or update.
 * @param name - The preset or saved-set name to look up or write.
 * @returns The sets without the one of that name. Returns a new list.

 *
 * @example
 * ```ts
 * import { withoutSet } from "@johnmorrisdotca/korokoro";
 * import { makeSet } from "@johnmorrisdotca/korokoro";
 * const set = makeSet("Longsword", "1d8+3")!;
 * console.log(withoutSet([set], "Longsword").length);
 * ```
 */
export function withoutSet(sets: readonly DiceSet[], name: string): DiceSet[] {
  return sets.filter((s) => s.name !== name);
}

/** A set as a link's query: the dice and the name, for anybody to open and keep.
 *
 * @param set - The saved set to add or share.
 * @returns A set as a link's query: the dice and the name, for anybody to open and keep.

 *
 * @example
 * ```ts
 * import { setQuery } from "@johnmorrisdotca/korokoro";
 * import { makeSet } from "@johnmorrisdotca/korokoro";
 * const set = makeSet("Longsword", "1d8+3")!;
 * console.log(setQuery(set));
 * ```
 */
export function setQuery(set: DiceSet): string {
  return new URLSearchParams({ dice: set.notation, name: set.name, v: String(SHARE_VERSION) }).toString();
}

/** A set from a link's query, or null when it holds none or its dice cannot be rolled. A link with dice and no name is a set called by its notation.
 *
 * @param query - A query string or URLSearchParams containing the shared settings.
 * @returns A set from a link's query, or null when it holds none or its dice cannot be rolled. A link with dice and no name is a set called by its notation.

 *
 * @example
 * ```ts
 * import { readSet } from "@johnmorrisdotca/korokoro";
 * import { makeSet, setQuery } from "@johnmorrisdotca/korokoro";
 * const set = makeSet("Longsword", "1d8+3")!;
 * console.log(readSet(setQuery(set))?.name);
 * ```
 */
export function readSet(query: string | URLSearchParams): DiceSet | null {
  const params = typeof query === "string" ? new URLSearchParams(query.replace(/^\?/, "")) : query;
  const dice = params.get("dice");
  if (dice === null) return null;
  const spec = parseNotation(dice);
  if (spec === null) return null;
  return makeSet(params.get("name") ?? "", spec) ?? makeSet(formatNotation(spec).slice(0, MAX_SET_NAME), spec);
}
