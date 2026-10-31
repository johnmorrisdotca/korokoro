import {
  canHold,
  type DiceGroup,
  type DieRoll,
  type DieStatus,
  groupsOf,
  isLoaded,
  keptCount,
  MAX_EXPLOSIONS,
  MAX_REROLLS,
  MAX_TIMES,
  meets,
  type Roll,
  type RollSet,
  type RollSpec,
  type Sides,
  valueOfFace,
} from "./dice.ts";
import { facesOf } from "./diceInternal.ts";
import { groupRange, normalizeSpec, rulesOf } from "./diceNormalize.ts";
import { evaluateMath, mathRange } from "./math.ts";
import { cryptoSource, type RandomSource, randomInt } from "./random.ts";

/**
 * The one set of rules for a throw, whether the faces come from a generator
 * or from a roll that was kept or shared. The kinds of dice are thrown in
 * order, and each die asked for is settled before the next is touched: it is
 * thrown; if it is to be rerolled it is thrown again (once, or until it
 * clears); if the face that stands is the highest and the dice explode it
 * throws another die, which follows the same rules. Then keep or drop picks
 * among that kind's dice left standing. Null when `draw` runs out.
 */
function play(
  spec: RollSpec,
  draw: (group: DiceGroup, taken?: ReadonlySet<number>) => number | null,
): DieRoll[] | null {
  const groups = groupsOf(spec);
  const dice: DieRoll[] = [];
  let die = 0;
  for (const [index, group] of groups.entries()) {
    const rules = rulesOf(group);
    const mine: DieRoll[] = [];
    const thrown = (face: number, status: DieStatus, exploded: boolean, extra: boolean): DieRoll => {
      const one: DieRoll = { face, status, exploded, die };
      if (groups.length > 1) one.group = index;
      const custom = group.faces?.[face - 1];
      if (custom !== undefined) {
        one.label = custom.label;
        one.value = custom.value ?? 0;
      } else if (status === "kept") {
        const worth = rules.worth(face, extra);
        if (worth !== face) one.value = worth;
      }
      mine.push(one);
      return one;
    };
    // Dice that all differ are thrown from the faces not yet showing.
    const taken = group.unique === true ? new Set<number>() : undefined;
    for (let n = 0; n < group.count; n++, die++) {
      if (taken !== undefined) {
        const face = draw(group, taken);
        if (face === null) return null;
        taken.add(face);
        thrown(face, "kept", false, false);
        continue;
      }
      let explosions = group.explode === true ? MAX_EXPLOSIONS : 0;
      for (let extra = false; ; extra = true) {
        let face = draw(group);
        if (face === null) return null;
        if (rules.once(face)) {
          thrown(face, "rerolled", false, extra);
          face = draw(group);
          if (face === null) return null;
        }
        for (let again = 0; again < MAX_REROLLS && rules.until(face); again++) {
          thrown(face, "rerolled", false, extra);
          face = draw(group);
          if (face === null) return null;
        }
        const exploded = explosions > 0 && rules.explodes(face);
        thrown(face, "kept", exploded, extra);
        if (!exploded) break;
        explosions -= 1;
      }
    }
    if (group.keep !== "all") {
      // The best of the dice left standing, a tie going to the die thrown first.
      const standing = mine.filter((d) => d.status === "kept");
      const best = [...standing].sort((a, b) => (group.keep === "highest" ? b.face - a.face : a.face - b.face));
      const keeping = new Set(best.slice(0, keptCount(group)));
      for (const d of standing) if (!keeping.has(d)) d.status = "dropped";
    }
    if (group.success !== undefined || group.critical !== undefined || group.fumble !== undefined) {
      // What is compared: each die for what it is worth, or a compounding die's whole chain, read on its last die.
      const whole = group.explodeKind === "compound" || group.explodeKind === "compound-penetrating";
      const standing = mine.filter((d) => d.status === "kept");
      const chain = new Map<number, number>();
      for (const d of standing) chain.set(d.die, (chain.get(d.die) ?? 0) + (d.value ?? d.face));
      for (const d of standing) {
        if (whole && d.exploded) continue;
        const worth = whole ? (chain.get(d.die) as number) : (d.value ?? d.face);
        if (group.success !== undefined && meets(group.success, worth)) d.counts = 1;
        else if (group.failure !== undefined && meets(group.failure, worth)) d.counts = -1;
        if (group.critical !== undefined && meets(group.critical, worth)) d.critical = "success";
        else if (group.fumble !== undefined && meets(group.fumble, worth)) d.critical = "failure";
      }
    }
    dice.push(...mine);
  }
  return dice;
}

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

let counter = 0;

/**
 * One die thrown from a source. A fair die is one fair pick among its faces.
 * A loaded die is one fair pick among its weights, all laid end to end, so
 * the source is drawn from in the same way and a seed replays a loaded roll
 * as exactly as a fair one.
 */
function draws(source: RandomSource): (group: DiceGroup, taken?: ReadonlySet<number>) => number {
  return (group, taken) => {
    const { low, high } = facesOf(group);
    if (taken !== undefined) {
      // One fair pick among the faces not yet showing, counted up from the lowest.
      let pick = randomInt(source, high - low + 1 - taken.size);
      let face = low;
      for (; face <= high; face++) {
        if (taken.has(face)) continue;
        if (pick === 0) break;
        pick -= 1;
      }
      return face;
    }
    if (group.weights === undefined) return randomInt(source, high - low + 1) + low;
    let pick = randomInt(
      source,
      group.weights.reduce((a, b) => a + b, 0),
    );
    let face = low;
    for (const weight of group.weights) {
      if (pick < weight) break;
      pick -= weight;
      face += 1;
    }
    return face;
  };
}

/** The kept dice added up by what each is worth, plus the bonus. */
function totalOfDice(spec: RollSpec, dice: readonly DieRoll[]): number {
  const groups = groupsOf(spec);
  const totals = groups.map(() => 0);
  for (const die of dice) {
    if (die.status !== "kept") continue;
    const at = die.group ?? 0;
    const group = groups[at] ?? (groups[0] as DiceGroup);
    totals[at] =
      (totals[at] as number) +
      (group.success !== undefined ? (die.counts ?? 0) : (die.value ?? valueOfFace(group, die.face)));
  }
  if (spec.math !== undefined) return evaluateMath(spec.math, totals);
  return totals.reduce((sum, total) => sum + total, spec.modifier);
}

/** What each kind of dice of a roll came to, in order: what a formula puts together.
 *
 * @param roll - The completed roll to read or record.
 * @returns What each kind of dice of a roll came to, in order: what a formula puts together.

 *
 * @example
 * ```ts
 * import { groupTotals } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec, rollFrom } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * const sample = rollFrom(spec, [2, 5], "saved", 0, null)!;
 * console.log(groupTotals(sample));
 * ```
 */
export function groupTotals(roll: Roll): number[] {
  const groups = groupsOf(roll.spec);
  const totals = groups.map(() => 0);
  for (const die of diceOf(roll)) {
    if (die.status !== "kept") continue;
    const at = die.group ?? 0;
    const group = groups[at] ?? (groups[0] as DiceGroup);
    totals[at] =
      (totals[at] as number) +
      (group.success !== undefined ? (die.counts ?? 0) : (die.value ?? valueOfFace(group, die.face)));
  }
  return totals;
}

function made(fair: RollSpec, dice: DieRoll[], source: RandomSource, at: number): Roll {
  const faces = dice.map((d) => d.face);
  const kept = dice.map((d) => d.status === "kept");
  counter = (counter + 1) % 1_000_000;
  const thrown: Roll = {
    id: `${at.toString(36)}-${counter.toString(36)}`,
    spec: fair,
    faces,
    kept,
    total: totalOfDice(fair, dice),
    at,
    seed: source.seed,
    dice,
  };
  if (isLoaded(fair)) thrown.loaded = true;
  return thrown;
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
