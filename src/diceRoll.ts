import {
  canHold,
  type DiceGroup,
  type DieRoll,
  groupsOf,
  isLoaded,
  MAX_TIMES,
  type Roll,
  type RollSet,
  type RollSpec,
  type Sides,
} from "./dice.ts";
import { facesOf } from "./diceInternal.ts";
import { groupRange, normalizeSpec } from "./diceNormalize.ts";
import { draws, made, play, totalOfDice } from "./diceRollEngine.ts";
import { mathRange } from "./math.ts";
import { cryptoSource, type RandomSource } from "./random.ts";

export { groupTotals } from "./diceRollEngine.ts";

/**
 * What happened to each die of a roll, from its faces alone: which were
 * rerolled, which exploded, which were dropped. Null when the faces are not
 * ones this spec could have thrown, one too many or too few included.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @param faces - Physical face values, in the order thrown.
 * @returns What happened to each die of a roll, from its faces alone: which were rerolled, which exploded, which were dropped. null when the faces are not ones this spec could have thrown, one too many or too few included.

 *
 * @example
 * ```ts
 * import { readDice } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(readDice(spec, [2, 5])?.map((die) => die.status));
 * ```
 */
export function readDice(spec: RollSpec, faces: readonly unknown[]): DieRoll[] | null {
  let used = 0;
  const dice = play(spec, (group, taken) => {
    const { low, high } = facesOf(group);
    const face = faces[used];
    if (used >= faces.length || typeof face !== "number" || !Number.isInteger(face) || face < low || face > high)
      return null;
    // Dice that all differ cannot show a face twice.
    if (taken?.has(face) === true) return null;
    // A face weighted at nothing never comes up.
    if (group.weights?.[face - low] === 0) return null;
    used += 1;
    return face;
  });
  return dice === null || used !== faces.length ? null : dice;
}

/** The kind of dice one die of a roll belongs to, with its rules, faces and weights.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @param die - The logged die whose group is requested.
 * @returns The kind of dice one die of a roll belongs to, with its rules, faces and weights.

 *
 * @example
 * ```ts
 * import { groupOf } from "@johnmorrisdotca/korokoro";
 * import { diceOf, normalizeSpec, rollFrom } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * const sample = rollFrom(spec, [2, 5], "saved", 0, null)!;
 * console.log(groupOf(spec, diceOf(sample)[0]!).sides);
 * ```
 */
export function groupOf(spec: RollSpec, die: DieRoll): DiceGroup {
  return groupsOf(spec)[die.group ?? 0] ?? groupsOf(spec)[0]!;
}

/** The kind of die one die of a roll is.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @param die - The logged die whose group is requested.
 * @returns The kind of die one die of a roll is.

 *
 * @example
 * ```ts
 * import { sidesOf } from "@johnmorrisdotca/korokoro";
 * import { diceOf, normalizeSpec, rollFrom } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * const sample = rollFrom(spec, [2, 5], "saved", 0, null)!;
 * console.log(sidesOf(spec, diceOf(sample)[0]!));
 * ```
 */
export function sidesOf(spec: RollSpec, die: DieRoll): Sides {
  return groupOf(spec, die).sides;
}

/** The dice of a roll: as recorded, or worked out from its faces for a roll made by hand or by an older version.
 *
 * @param roll - The completed roll to read or record.
 * @returns The dice of a roll: as recorded, or worked out from its faces for a roll made by hand or by an older version.

 *
 * @example
 * ```ts
 * import { diceOf } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec, rollFrom } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * const sample = rollFrom(spec, [2, 5], "saved", 0, null)!;
 * console.log(diceOf(sample).length);
 * ```
 */
export function diceOf(roll: Roll): DieRoll[] {
  return (
    roll.dice ??
    readDice(roll.spec, roll.faces) ??
    roll.faces.map(
      (face, i): DieRoll => ({ face, status: roll.kept[i] === false ? "dropped" : "kept", exploded: false, die: i }),
    )
  );
}

/** What `roll` and `rollMany` may be told beside the dice and the source.
 *
 * @example
 * ```ts
 * import type { RollOptions } from "@johnmorrisdotca/korokoro";
 * const value: RollOptions = { at: 0, maxDice: 20 };
 * console.log(value.maxDice);
 * ```
 */
export type RollOptions = {
  /** When the roll is made, in epoch milliseconds. Now, unless given. */
  at?: number;
  /** The most dice the roll may have, from 10 (the default) to `MAX_DICE_BY_CODE`. Past ten, every kind has to be plain dice. */
  maxDice?: number;
};

function rollOptions(when: number | RollOptions): { at: number; limits: { maxDice?: number } } {
  if (typeof when === "number") return { at: when, limits: {} };
  return { at: when.at ?? Date.now(), limits: when.maxDice === undefined ? {} : { maxDice: when.maxDice } };
}

/** What a set of rolls comes to: their sum, the highest and the lowest.
 *
 * @param rolls - Completed rolls, or the number of attempts where this parameter is numeric.
 * @returns What a set of rolls comes to: their sum, the highest and the lowest.

 *
 * @example
 * ```ts
 * import { setOf } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec, rollFrom } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * const sample = rollFrom(spec, [2, 5], "saved", 0, null)!;
 * console.log(setOf([sample, sample]).sum);
 * ```
 */
export function setOf(rolls: Roll[]): RollSet {
  const totals = rolls.map((r) => r.total);
  return { rolls, sum: totals.reduce((a, b) => a + b, 0), highest: Math.max(...totals), lowest: Math.min(...totals) };
}

/**
 * Throw the same dice several times in one go, as ability scores are rolled:
 * `4d6dl1` six times. The rolls are drawn one after another from the one
 * source, so a seed replays the whole set, and each is an ordinary roll that
 * says which set it belongs to. `times` is the spec's own unless given, from
 * 1 to `MAX_TIMES`.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @param times - The number of independent repeats.
 * @param source - A source of unsigned 32-bit integers; crypto by default where optional.
 * @param when - Epoch milliseconds, or roll options including the time and maximum dice.
 * @returns Throw the same dice several times in one go, as ability scores are rolled: `4d6dl1` six times. The rolls are drawn one after another from the one source, so a seed replays the whole set, and each is an ordinary roll that says which set it belongs to. `times` is the spec's own unless given, from 1 to `MAX_TIMES`.

 *
 * @example
 * ```ts
 * import { rollMany } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec, seededSource } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(rollMany(spec, 3, seededSource("table"), 0).rolls.length);
 * ```
 */
export function rollMany(
  spec: Partial<RollSpec>,
  times?: number,
  source: RandomSource = cryptoSource(),
  when: number | RollOptions = Date.now(),
): RollSet {
  const { at, limits } = rollOptions(when);
  const fair = normalizeSpec(spec, limits);
  const many = Math.min(MAX_TIMES, Math.max(1, Math.trunc(Number(times ?? fair.times) || 1)));
  const rolls: Roll[] = [];
  for (let index = 0; index < many; index++) rolls.push(made(fair, play(fair, draws(source)) as DieRoll[], source, at));
  const id = rolls[0]?.id ?? "";
  if (many > 1)
    rolls.forEach((r, index) => {
      r.set = { id, index, of: many };
    });
  return setOf(rolls);
}

/**
 * A roll put back together from its spec and its faces: for a history read
 * from storage and a roll read from a link. The dice, which are kept and the
 * total are all worked out again, never trusted as given. Null when the dice
 * could not have shown those faces.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @param faces - Physical face values, in the order thrown.
 * @param id - The id recorded with the reconstructed roll.
 * @param at - The recorded time in epoch milliseconds.
 * @param seed - Text that reproduces the same random sequence, or null for an unseeded stored roll.
 * @returns A roll put back together from its spec and its faces: for a history read from storage and a roll read from a link. The dice, which are kept and the total are all worked out again, never trusted as given. null when the dice could not have shown those faces.

 *
 * @example
 * ```ts
 * import { rollFrom } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(rollFrom(spec, [2, 5], "saved", 0, null)?.total);
 * ```
 */
export function rollFrom(
  spec: RollSpec,
  faces: readonly unknown[],
  id: string,
  at: number,
  seed: string | null,
): Roll | null {
  const dice = readDice(spec, faces);
  if (dice === null) return null;
  const read: Roll = {
    id,
    spec,
    faces: dice.map((d) => d.face),
    kept: dice.map((d) => d.status === "kept"),
    total: totalOfDice(spec, dice),
    at,
    seed,
    dice,
  };
  if (isLoaded(spec)) read.loaded = true;
  return read;
}

/**
 * Throw the dice. The source is crypto unless a seeded one is given. The
 * third argument is when the roll is made, in epoch milliseconds (now, unless
 * given), or options: `{ at, maxDice }`. A spec asking for more than ten dice
 * is brought to ten unless `maxDice` says otherwise, up to `MAX_DICE_BY_CODE`.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @param source - A source of unsigned 32-bit integers; crypto by default where optional.
 * @param when - Epoch milliseconds, or roll options including the time and maximum dice.
 * @returns The completed roll, including its spec, faces, kept mask, total, seed and timestamp.

 *
 * @example
 * ```ts
 * import { roll } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec, seededSource } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(roll(spec, seededSource("table"), 0).faces);
 * ```
 */
export function roll(
  spec: Partial<RollSpec>,
  source: RandomSource = cryptoSource(),
  when: number | RollOptions = Date.now(),
): Roll {
  const { at, limits } = rollOptions(when);
  const fair = normalizeSpec(spec, limits);
  return made(fair, play(fair, draws(source)) as DieRoll[], source, at);
}

/**
 * Hold some dice of a roll and throw the rest again, as Yacht and Farkle do.
 * `held[i]` is whether face i stays. The dice not held are thrown in order
 * from the source, so from a seed the second roll replays like the first.
 * The roll that comes back says which faces were held. Only plain dice can be
 * held (`canHold`); anything else is a RangeError, as is a `held` that does
 * not fit the roll.
 *
 * @param previous - The roll whose held dice must remain unchanged.
 * @param held - A mask marking dice whose faces stay fixed.
 * @param source - A source of unsigned 32-bit integers; crypto by default where optional.
 * @param at - The recorded time in epoch milliseconds.
 * @returns Hold some dice of a roll and throw the rest again, as Yacht and Farkle do. `held[i]` is whether face i stays. The dice not held are thrown in order from the source, so from a seed the second roll replays like the first. The roll that comes back says which faces were held. Only plain dice can be held (`canHold`); anything else is a RangeError, as is a `held` that does not fit the roll.

 *
 * @example
 * ```ts
 * import { rollHeld } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec, rollFrom, seededSource } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * const sample = rollFrom(spec, [2, 5], "saved", 0, null)!;
 * console.log(rollHeld(sample, [true, false], seededSource("next"), 1).faces);
 * ```
 */
export function rollHeld(
  previous: Roll,
  held: readonly boolean[],
  source: RandomSource = cryptoSource(),
  at: number = Date.now(),
): Roll {
  if (!canHold(previous.spec)) throw new RangeError("korokoro: only plain dice can be held");
  if (held.length !== previous.faces.length)
    throw new RangeError("korokoro: held must say yes or no for every die of the roll");
  const draw = draws(source);
  let next = 0;
  const dice = play(previous.spec, (group) => {
    const i = next++;
    return held[i] === true ? (previous.faces[i] as number) : draw(group);
  }) as DieRoll[];
  return { ...made(previous.spec, dice, source, at), held: held.map((h) => h === true) };
}

/** The lowest and highest totals a spec can produce. An exploding die's highest is every explosion it is allowed.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @returns The lowest and highest totals a spec can produce. An exploding die's highest is every explosion it is allowed.

 *
 * @example
 * ```ts
 * import { rangeOf } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(rangeOf(spec));
 * ```
 */
export function rangeOf(spec: RollSpec): { min: number; max: number } {
  const ranges = groupsOf(spec).map(groupRange);
  if (spec.math !== undefined) return mathRange(spec.math, ranges);
  return ranges.reduce((all, range) => ({ min: all.min + range.min, max: all.max + range.max }), {
    min: spec.modifier,
    max: spec.modifier,
  });
}
