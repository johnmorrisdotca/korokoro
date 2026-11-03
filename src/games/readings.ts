import { type DiceGroup, diceOf, groupsOf, playsByNewRules, type Roll, type RollSpec, valueOfFace } from "../dice.ts";
import type { Read } from "./readingsReaders.ts";
import { READERS } from "./readingsReaders.ts";

export { READERS, waysToShut } from "./readingsReaders.ts";

/**
 * How a roll is read in a game. A reading is one of a small, fixed set of
 * named functions, so that a new game is a line of data and rarely new code.
 * Each takes the dice, kind by kind, and says what they come to in the game's
 * own terms: an outcome with a stable name, and the figures that go with it.
 * The words for each outcome, in English and Japanese, are in `words.ts`.
 *
 * Readings are small and particular on purpose. They do not run a game (turn
 * order, scores across rounds): they read one roll, with the rolls just before
 * it where a game needs them, as craps does for its point.
 *
 * @example
 * ```ts
 * import type { Outcome } from "@johnmorrisdotca/korokoro";
 * import { getPreset, presetSpec, roll, seededSource, readDiceAs } from "@johnmorrisdotca/korokoro";
 * const value: Outcome = readDiceAs(getPreset("cho-han")!.reading, roll(presetSpec(getPreset("cho-han")!), seededSource("docs"), 0));
 * console.log(value.outcome);
 * ```
 */
export type Outcome = {
  /** The outcome's name within its reading: "natural", "point", "yahtzee". */
  outcome: string;
  /** The figures the outcome's words are filled in with. */
  values: Record<string, string | number>;
  /** Whether it is good news, bad news or neither, for a tray to colour. */
  tone: "good" | "bad" | "plain";
};

/** What a reading is given: this roll's dice as each would be worth, kind by kind, and the same for the rolls before it in the same game. */
export type Dice = {
  /** Each kind's faces, as numbers: a custom face's place on its die. */
  groups: number[][];
  /** The bonus on the roll. */
  modifier: number;
  /** The kept dice added up with the bonus. */
  total: number;
};

/** The dice of a roll, kind by kind, for a reading. Rerolled dice are left out; dropped dice are kept in, since a reading may want them. */
export function diceFor(roll: Roll): Dice {
  const groups: number[][] = groupsOf(roll.spec).map(() => []);
  for (const die of diceOf(roll)) if (die.status !== "rerolled") (groups[die.group ?? 0] as number[]).push(die.face);
  return { groups, modifier: roll.spec.modifier, total: roll.total };
}

/** The name of a reading.
 *
 * @example
 * ```ts
 * import type { ReadingId } from "@johnmorrisdotca/korokoro";
 * import { getPreset } from "@johnmorrisdotca/korokoro";
 * const value: ReadingId = getPreset("cho-han")!.reading;
 * console.log(value);
 * ```
 */
export type ReadingId = keyof typeof READERS;

/** Read a roll the way a reading does, with the rolls before it in the same game where that matters.
 *
 * @param reading - The named game reading to apply.
 * @param roll - The completed roll to read or record.
 * @param before - Earlier rolls needed by a reading with a running result.
 * @param options - Options for this call; omitted fields keep their documented defaults.
 * @returns Read a roll the way a reading does, with the rolls before it in the same game where that matters.

 *
 * @example
 * ```ts
 * import { readDiceAs } from "@johnmorrisdotca/korokoro";
 * import { getPreset, normalizeSpec, rollFrom } from "@johnmorrisdotca/korokoro";
 * const preset = getPreset("cho-han")!;
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * const sample = rollFrom(spec, [2, 5], "saved", 0, null)!;
 * console.log(readDiceAs(preset.reading, sample).outcome);
 * ```
 */
export function readDiceAs(
  reading: ReadingId,
  roll: Roll,
  before: readonly Roll[] = [],
  options: Record<string, number> = {},
): Outcome {
  return (READERS[reading] as Read)(diceFor(roll), before.map(diceFor), options);
}

/**
 * Every way the dice of a spec can fall, kind by kind, each with how many of
 * the equally likely throws fall that way. The dice of a kind are given
 * sorted, highest first, so a reading that does not care about their order
 * (none here does, within a kind) can be counted over thousands of patterns
 * where there are millions of throws. Null when the dice are not plain: a
 * reroll or an explosion has no fixed number of throws to count.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @returns Every way the dice of a spec can fall, kind by kind, each with how many of the equally likely throws fall that way. The dice of a kind are given sorted, highest first, so a reading that does not care about their order (none here does, within a kind) can be counted over thousands of patterns where there are millions of throws. null when the dice are not plain: a reroll or an explosion has no fixed number of throws to count.

 *
 * @example
 * ```ts
 * import { patternsOf } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(patternsOf(spec)?.length);
 * ```
 */
export function patternsOf(spec: RollSpec): { dice: Dice; ways: bigint }[] | null {
  const groups = groupsOf(spec);
  if (
    groups.some(
      (g) =>
        g.explode === true ||
        g.reroll !== undefined ||
        g.rerollUntil !== undefined ||
        g.weights !== undefined ||
        g.keep !== "all" ||
        playsByNewRules(g),
    )
  )
    return null;
  const factorial = (n: number): bigint => (n <= 1 ? 1n : BigInt(n) * factorial(n - 1));
  // One kind: every multiset of its faces, with the number of orders it has.
  const kind = (group: DiceGroup): { faces: number[]; ways: bigint }[] => {
    const low = group.faces !== undefined ? 1 : group.sides === "F" ? -1 : 1;
    const high = group.faces !== undefined ? group.faces.length : group.sides === "F" ? 1 : (group.sides as number);
    const out: { faces: number[]; ways: bigint }[] = [];
    const walk = (face: number, left: number, picked: number[], orders: bigint) => {
      if (left === 0) return void out.push({ faces: picked, ways: orders });
      if (face < low) return;
      for (let n = left; n >= 0; n--)
        walk(face - 1, left - n, [...picked, ...new Array<number>(n).fill(face)], orders / factorial(n));
    };
    walk(high, group.count, [], factorial(group.count));
    return out;
  };
  let patterns: { faces: number[][]; ways: bigint }[] = [{ faces: [], ways: 1n }];
  for (const group of groups) {
    const mine = kind(group);
    if (patterns.length * mine.length > 400_000) return null;
    patterns = patterns.flatMap((p) => mine.map((m) => ({ faces: [...p.faces, m.faces], ways: p.ways * m.ways })));
  }
  return patterns.map((p) => ({
    ways: p.ways,
    dice: {
      groups: p.faces,
      modifier: spec.modifier,
      total: p.faces.reduce(
        (t, faces, i) => t + faces.reduce((s, f) => s + valueOfFace(groups[i] as DiceGroup, f), 0),
        spec.modifier,
      ),
    },
  }));
}
