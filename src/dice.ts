import { checkMath, evaluateMath, mathRange, soundMath, type MathNode } from "./math.ts";
import { cryptoSource, randomInt, type RandomSource } from "./random.ts";

/**
 * The dice the tray offers as buttons: the polyhedral set, the thirty-sided
 * die, and the percentile die. Any other die is reached by notation.
 *
 * @example
 * ```ts
 * import { DIE_SIDES } from "@johnmorrisdotca/korokoro";
 * console.log(Object.keys(DIE_SIDES));
 * ```
 */
export const DIE_SIDES = [4, 6, 8, 10, 12, 20, 30, 100] as const;
/** One of the dice the tray has a button for.
 *
 * @example
 * ```ts
 * import type { DieSides } from "@johnmorrisdotca/korokoro";
 * const value: DieSides = 20;
 * console.log(value);
 * ```
 */
export type DieSides = (typeof DIE_SIDES)[number];

/** A die of any size from a coin to a d1000, or a Fate die, whose faces are −1, 0 and +1.
 *
 * @example
 * ```ts
 * import type { Sides } from "@johnmorrisdotca/korokoro";
 * const value: Sides = "F";
 * console.log(value);
 * ```
 */
export type Sides = number | "F";
/** The fewest sides a numbered die has: a coin.
 *
 * @example
 * ```ts
 * import { MIN_SIDES } from "@johnmorrisdotca/korokoro";
 * console.log(MIN_SIDES);
 * ```
 */
export const MIN_SIDES = 2;
/** The most sides a numbered die has.
 *
 * @example
 * ```ts
 * import { MAX_SIDES } from "@johnmorrisdotca/korokoro";
 * console.log(MAX_SIDES);
 * ```
 */
export const MAX_SIDES = 1000;

/** The fewest dice in one roll.
 *
 * @example
 * ```ts
 * import { MIN_DICE } from "@johnmorrisdotca/korokoro";
 * console.log(MIN_DICE);
 * ```
 */
export const MIN_DICE = 1;
/** The most dice in one roll: a fireball's 8d6, Farkle's six and a pool of ten all fit.
 *
 * @example
 * ```ts
 * import { MAX_DICE } from "@johnmorrisdotca/korokoro";
 * console.log(MAX_DICE);
 * ```
 */
export const MAX_DICE = 10;
/**
 * The most dice in one roll made from code, for a caller that asks:
 * `parseNotation(text, { maxDice })`, `normalizeSpec(spec, { maxDice })` and
 * `roll(spec, source, { maxDice })` each take a roll past `MAX_DICE` up to
 * this. Without the option each stops at ten, as it always has. Only plain
 * dice go past ten: fair numbered or Fate dice, all added or one kept, with
 * no other rule, which is where the odds stay exact and quick however many
 * there are. The tray stays at ten.
 *
 * @example
 * ```ts
 * import { MAX_DICE_BY_CODE } from "@johnmorrisdotca/korokoro";
 * console.log(MAX_DICE_BY_CODE);
 * ```
 */
export const MAX_DICE_BY_CODE = 100;
/** The largest die whose dice may be asked to all differ (`u`).
 *
 * @example
 * ```ts
 * import { MAX_UNIQUE_SIDES } from "@johnmorrisdotca/korokoro";
 * console.log(MAX_UNIQUE_SIDES);
 * ```
 */
export const MAX_UNIQUE_SIDES = 100;
/** The largest bonus, either way: a roll adds or takes away at most this.
 *
 * @example
 * ```ts
 * import { MAX_MODIFIER } from "@johnmorrisdotca/korokoro";
 * console.log(MAX_MODIFIER);
 * ```
 */
export const MAX_MODIFIER = 99;

/**
 * How many more dice one exploding die may throw. The chain stops there and
 * the last die is read as it lies, so a roll always ends and its odds are the
 * exact odds of the dice as thrown. A d6 gets this far once in 60 million dice.
 *
 * @example
 * ```ts
 * import { MAX_EXPLOSIONS } from "@johnmorrisdotca/korokoro";
 * console.log(MAX_EXPLOSIONS);
 * ```
 */
export const MAX_EXPLOSIONS = 10;
/** The largest die that may explode: past this the exact odds stop being quick to count.
 *
 * @example
 * ```ts
 * import { MAX_EXPLODING_SIDES } from "@johnmorrisdotca/korokoro";
 * console.log(MAX_EXPLODING_SIDES);
 * ```
 */
export const MAX_EXPLODING_SIDES = 100;
/**
 * How many times one die is thrown again by a reroll-until (`r<`). After
 * that it stands as it lies, in the roll and in the odds alike. Such a reroll
 * may match at most half a die's faces, so at the very worst one die in a
 * thousand gets this far; a d6 rerolling its 1s does once in 60 million.
 *
 * @example
 * ```ts
 * import { MAX_REROLLS } from "@johnmorrisdotca/korokoro";
 * console.log(MAX_REROLLS);
 * ```
 */
export const MAX_REROLLS = 10;
/** The most kinds of dice in one roll: `1d20+1d4` is two.
 *
 * @example
 * ```ts
 * import { MAX_GROUPS } from "@johnmorrisdotca/korokoro";
 * console.log(MAX_GROUPS);
 * ```
 */
export const MAX_GROUPS = 4;
/** The most times one roll may be repeated as a set: `6#4d6dl1` is six.
 *
 * @example
 * ```ts
 * import { MAX_TIMES } from "@johnmorrisdotca/korokoro";
 * console.log(MAX_TIMES);
 * ```
 */
export const MAX_TIMES = 100;
/** The most faces a custom die has, and the fewest is two.
 *
 * @example
 * ```ts
 * import { MAX_FACES } from "@johnmorrisdotca/korokoro";
 * console.log(MAX_FACES);
 * ```
 */
export const MAX_FACES = 20;
/** The longest a custom face's words may be, in characters.
 *
 * @example
 * ```ts
 * import { MAX_LABEL } from "@johnmorrisdotca/korokoro";
 * console.log(MAX_LABEL);
 * ```
 */
export const MAX_LABEL = 16;
/** The largest number a custom face may be worth, either way.
 *
 * @example
 * ```ts
 * import { MAX_FACE_VALUE } from "@johnmorrisdotca/korokoro";
 * console.log(MAX_FACE_VALUE);
 * ```
 */
export const MAX_FACE_VALUE = 9999;
/** The heaviest a face of a loaded die may be weighted.
 *
 * @example
 * ```ts
 * import { MAX_WEIGHT } from "@johnmorrisdotca/korokoro";
 * console.log(MAX_WEIGHT);
 * ```
 */
export const MAX_WEIGHT = 99;
/** The largest die that may be loaded.
 *
 * @example
 * ```ts
 * import { MAX_LOADED_SIDES } from "@johnmorrisdotca/korokoro";
 * console.log(MAX_LOADED_SIDES);
 * ```
 */
export const MAX_LOADED_SIDES = 100;

/**
 * One face of a custom die: what it says, what it is worth in a total if it
 * is worth anything, and a colour for it. The words are text and only ever
 * shown as text.
 *
 * @example
 * ```ts
 * import type { CustomFace } from "@johnmorrisdotca/korokoro";
 * const value: CustomFace = { label: "Hit", value: 1, colour: "#2f5d4a" };
 * console.log(value.label);
 * ```
 */
export type CustomFace = {
  /** What the face says: 1 to `MAX_LABEL` characters. */
  label: string;
  /** What it adds to a total. Left out of a face that is only words, which adds nothing. */
  value?: number;
  /** A colour for the face, as `#rgb` or `#rrggbb`. Left out for the tray's own. */
  colour?: string;
};

/**
 * Which dice count towards the total. `all` adds every die; `highest` and
 * `lowest` keep one, which is how advantage and disadvantage are rolled, or
 * as many as `keepCount` says.
 *
 * @example
 * ```ts
 * import type { Keep } from "@johnmorrisdotca/korokoro";
 * const value: Keep = "highest";
 * console.log(value);
 * ```
 */
export type Keep = "all" | "highest" | "lowest";

/**
 * A number a die is compared with: at a face (`=`), at or below it (`<=`), at
 * or above it (`>=`), or anything but it (`<>`). Notation's `<3` is kept as
 * `<=2`, and `>7` as `>=8`.
 *
 * @example
 * ```ts
 * import type { Compare } from "@johnmorrisdotca/korokoro";
 * const value: Compare = { op: ">=", n: 5 };
 * console.log(value.n);
 * ```
 */
export type Compare = { op: "=" | "<=" | ">=" | "<>"; n: number };

/** Whether a number meets a comparison.
 *
 * @param compare - The comparison operator and numeric threshold.
 * @param value - The candidate face, value or name to check.
 * @returns Whether a number meets a comparison.

 *
 * @example
 * ```ts
 * import { meets } from "@johnmorrisdotca/korokoro";
 * console.log(meets({ op: ">=", n: 5 }, 6));
 * ```
 */
export function meets(compare: Compare, value: number): boolean {
  return compare.op === "=" ? value === compare.n : compare.op === "<=" ? value <= compare.n : compare.op === ">=" ? value >= compare.n : value !== compare.n;
}

/** A comparison as notation writes it: `>=8`, `=1`, `<>3`.
 *
 * @param compare - The comparison operator and numeric threshold.
 * @returns A comparison as notation writes it: `>=8`, `=1`, `<>3`.

 *
 * @example
 * ```ts
 * import { compareText } from "@johnmorrisdotca/korokoro";
 * console.log(compareText({ op: ">=", n: 5 }));
 * ```
 */
export function compareText(compare: Compare): string {
  return `${compare.op}${compare.n}`;
}

/** How exploding dice are added up: each as a die of its own, all into the die that threw them (`!!`), or with one taken off each extra die (`!p`), or both (`!!p`).
 *
 * @example
 * ```ts
 * import type { ExplodeKind } from "@johnmorrisdotca/korokoro";
 * const value: ExplodeKind = "compound";
 * console.log(value);
 * ```
 */
export type ExplodeKind = "compound" | "penetrating" | "compound-penetrating";

/**
 * Some dice of one kind, with their own rules: the `2d20kh1` of
 * `2d20kh1+1d4`. The optional fields are left out of a group that does not
 * use them.
 *
 * @example
 * ```ts
 * import type { DiceGroup } from "@johnmorrisdotca/korokoro";
 * const value: DiceGroup = { count: 2, sides: 6, keep: "all" };
 * console.log(value.count);
 * ```
 */
export type DiceGroup = {
  /** How many dice: at least 1, and no more than `MAX_DICE` over the whole roll. */
  count: number;
  /** The kind of die: 2 to 1000 sides, or "F" for a Fate die. */
  sides: Sides;
  /** Which dice count towards the total. */
  keep: Keep;
  /** How many dice `highest` or `lowest` keep. Left out when it is one. */
  keepCount?: number;
  /** A die showing its highest face throws another, which may do the same. Left out when the dice do not explode. */
  explode?: true;
  /** A die showing this face or lower is thrown again, once, and the new face stands: `ro<` in notation. Left out when nothing is rerolled once. */
  reroll?: number;
  /** A die showing this face or lower is thrown again until it shows more, up to `MAX_REROLLS` times: `r<` in notation. Left out when nothing is rerolled until clear. */
  rerollUntil?: number;
  /** A die meeting this is thrown again, once: `ro>=5`, `ro=3`. For the comparisons `reroll` cannot say; left out otherwise. */
  rerollWhen?: Compare;
  /** A die meeting this is thrown again until it does not, up to `MAX_REROLLS` times: `r=3`, `r>=5`. For the comparisons `rerollUntil` cannot say; left out otherwise. */
  rerollUntilWhen?: Compare;
  /** With `explode`: the faces that explode, when they are not just the highest. `!>=5` in notation. Left out when only the highest face explodes. */
  explodeWhen?: Compare;
  /** With `explode`: how the extra dice are added up. Left out for ordinary explosions. */
  explodeKind?: ExplodeKind;
  /** The least a die counts for: a face below it counts as it. `min2` in notation. */
  floor?: number;
  /** The most a die counts for: a face above it counts as it. `max5` in notation. */
  ceiling?: number;
  /** The dice are counted, not added: each die meeting this is one success, and the total is how many. `>=8` in notation. */
  success?: Compare;
  /** With `success`: each die meeting this takes one success away. `f=1` in notation. */
  failure?: Compare;
  /** Dice meeting this are marked as critical successes. Only a mark: the total is the same. `cs>=19` in notation. */
  critical?: Compare;
  /** Dice meeting this are marked as critical failures. Only a mark. `cf<=2` in notation. */
  fumble?: Compare;
  /** The order the dice are shown in: `sa` ascending, `sd` descending. The order thrown is kept in the roll. */
  sort?: "ascending" | "descending";
  /** The dice all show different faces: each is thrown from the faces not yet showing, which comes to the same as rerolling any duplicate until there is none. `u` in notation. */
  unique?: true;
  /**
   * A custom die: its faces, in order, and `sides` is how many there are. A
   * face written twice comes up twice as often. A roll records a custom face
   * by its place, from 1. Left out of a numbered die and a Fate die.
   */
  faces?: CustomFace[];
  /**
   * A loaded die: how heavily each face is weighted, from the lowest face up,
   * where a fair die has every face at 1. `[1, 1, 1, 1, 1, 3]` is a d6 that
   * shows its 6 three times in eight. Left out of a fair die, and never
   * present by accident: `isFair` is false for any roll that has it.
   */
  weights?: number[];
};

/**
 * What to roll: the dice, the bonus, and the rules. A roll of one kind of die
 * is `{ count, sides, modifier, keep }` and whichever optional fields it
 * uses. A roll of several kinds keeps its first kind there and the others in
 * `more`, so a one-kind spec is the same object it always was.
 *
 * @example
 * ```ts
 * import type { RollSpec } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const value: RollSpec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(value.sides);
 * ```
 */
export type RollSpec = DiceGroup & {
  /** Added to the total, as in 1d20+5. */
  modifier: number;
  /** The other kinds of dice in the roll, in order. Left out when there is one kind. */
  more?: DiceGroup[];
  /** How many times `rollMany` throws the roll, as a set: 6 for `6#4d6dl1`. Left out when it is once. `roll` throws it once whatever this says. */
  times?: number;
  /**
   * How the kinds' totals are put together, when that is not simply adding
   * them: `(2d6+3)*2`, `1d20-1d4`, `floor(4d6/2)`. It names each kind of dice
   * once, by its place. With a formula the bonus is part of it, and
   * `modifier` is 0. Left out of a roll whose kinds are added.
   */
  math?: MathNode;
  /** What the roll is for, in a few words: "fire damage". Text, only ever shown as text. `2d6 # fire damage` in notation. Left out when there is none. */
  label?: string;
};

/** The longest a roll's label may be, in characters.
 *
 * @example
 * ```ts
 * import { MAX_ROLL_LABEL } from "@johnmorrisdotca/korokoro";
 * console.log(MAX_ROLL_LABEL);
 * ```
 */
export const MAX_ROLL_LABEL = 40;

/**
 * One die as it was thrown. `kept` counts towards the total, `dropped` was
 * left out by keep or drop, and `rerolled` was thrown again: the die after it
 * is its replacement.
 *
 * @example
 * ```ts
 * import type { DieStatus } from "@johnmorrisdotca/korokoro";
 * const value: DieStatus = "kept";
 * console.log(value);
 * ```
 */
export type DieStatus = "kept" | "dropped" | "rerolled";

/** One die of a roll: the face it showed and what became of it.
 *
 * @example
 * ```ts
 * import type { DieRoll } from "@johnmorrisdotca/korokoro";
 * import { DEFAULT_SPEC, readDice } from "@johnmorrisdotca/korokoro";
 * const value: DieRoll = readDice(DEFAULT_SPEC, [2, 5])![0]!;
 * console.log(value.face);
 * ```
 */
export type DieRoll = {
  /** The face it showed. A Fate die shows −1, 0 or 1. */
  face: number;
  /** Whether it counts, was dropped, or was thrown again. */
  status: DieStatus;
  /** It showed its highest face and threw the die after it. */
  exploded: boolean;
  /** Which of the dice asked for this one belongs to, from 0 and counted across the whole roll: a reroll or an explosion belongs to the die that caused it. */
  die: number;
  /** Which kind of dice it is, from 0, in a roll of several kinds. Left out in a roll of one kind. */
  group?: number;
  /** What the face says, on a custom die. Left out of a numbered die. */
  label?: string;
  /** What the die is worth in the total when that is not its face: a custom face's value (0 for a face that is only words), a face raised or lowered by `min` or `max`, an extra die of a penetrating explosion with its one taken off. Left out of a die worth its face. */
  value?: number;
  /** In a roll that counts successes: 1 on a die that is a success, −1 on one that takes a success away. Left out of every other die. A compounding die's count is on the last die of its chain. */
  counts?: 1 | -1;
  /** A die marked by `cs` or `cf`. Left out of every other die. */
  critical?: "success" | "failure";
};

/** One throw of the dice: what was asked for, every die thrown, and the total.
 *
 * @example
 * ```ts
 * import type { Roll } from "@johnmorrisdotca/korokoro";
 * import { DEFAULT_SPEC, rollFrom } from "@johnmorrisdotca/korokoro";
 * const value: Roll = rollFrom(DEFAULT_SPEC, [2, 5], "saved", 0, null)!;
 * console.log(value.total);
 * ```
 */
export type Roll = {
  /** Unique within one history. */
  id: string;
  spec: RollSpec;
  /** Every die's face, in the order thrown: rerolled dice and the dice an explosion added are among them. */
  faces: number[];
  /** Which faces count: all of them unless some are dropped or rerolled. */
  kept: boolean[];
  /** The kept faces added up, plus the bonus. */
  total: number;
  /** Epoch milliseconds. */
  at: number;
  /** The seed this roll came from, when it is reproducible. */
  seed: string | null;
  /** What happened to each die, one entry per face. Every roll this package makes has it; `diceOf` reads it or works it out. */
  dice?: DieRoll[];
  /** On a roll that held some dice from the roll before: which faces were held and not thrown again. Left out of an ordinary roll. */
  held?: boolean[];
  /** True on a roll of loaded dice, and left out of every other: a loaded roll always says so. */
  loaded?: true;
  /** On a roll thrown as one of a set: which set, which roll of it from 0, and how many there are. Left out of a roll thrown on its own. */
  set?: { id: string; index: number; of: number };
};

/** The same roll thrown several times in one go, with what the set comes to.
 *
 * @example
 * ```ts
 * import type { RollSet } from "@johnmorrisdotca/korokoro";
 * import { DEFAULT_SPEC, rollMany, seededSource } from "@johnmorrisdotca/korokoro";
 * const value: RollSet = rollMany(DEFAULT_SPEC, 3, seededSource("docs"), 0);
 * console.log(value.rolls.length);
 * ```
 */
export type RollSet = {
  /** Every roll, in the order thrown. */
  rolls: Roll[];
  /** The totals added up. */
  sum: number;
  /** The highest total. */
  highest: number;
  /** The lowest total. */
  lowest: number;
};

/** The dice a tray shows when nothing else is asked for: 2d6.
 *
 * @example
 * ```ts
 * import { DEFAULT_SPEC, formatNotation } from "@johnmorrisdotca/korokoro";
 * console.log(formatNotation(DEFAULT_SPEC));
 * ```
 */
export const DEFAULT_SPEC: RollSpec = { count: 2, sides: 6, modifier: 0, keep: "all" };

/** One of the dice the tray has a button for.
 *
 * @param value - The candidate face, value or name to check.
 * @returns One of the dice the tray has a button for.

 *
 * @example
 * ```ts
 * import { isDieSides } from "@johnmorrisdotca/korokoro";
 * console.log(isDieSides(20), isDieSides(7));
 * ```
 */
export function isDieSides(value: unknown): value is DieSides {
  return typeof value === "number" && (DIE_SIDES as readonly number[]).includes(value);
}

/** Any die this package can throw: two to a thousand sides, or a Fate die.
 *
 * @param value - The candidate face, value or name to check.
 * @returns Any die this package can throw: two to a thousand sides, or a Fate die.

 *
 * @example
 * ```ts
 * import { isSides } from "@johnmorrisdotca/korokoro";
 * console.log(isSides(7), isSides("F"));
 * ```
 */
export function isSides(value: unknown): value is Sides {
  return value === "F" || (typeof value === "number" && Number.isInteger(value) && value >= MIN_SIDES && value <= MAX_SIDES);
}

/** The lowest and highest face of one die.
 *
 * @param sides - A numbered die size or F for Fate dice.
 * @returns The lowest and highest face of one die.

 *
 * @example
 * ```ts
 * import { faceRange } from "@johnmorrisdotca/korokoro";
 * console.log(faceRange("F"));
 * ```
 */
export function faceRange(sides: Sides): { low: number; high: number } {
  return sides === "F" ? { low: -1, high: 1 } : { low: 1, high: sides };
}

/** The lowest and highest face one die of a group can be recorded as: a custom die's faces are numbered from 1. */
function facesOf(group: DiceGroup): { low: number; high: number } {
  return group.faces !== undefined ? { low: 1, high: group.faces.length } : faceRange(group.sides);
}

/** What a face of a group's die is worth in a total: its number, or for a custom face its value, which is 0 when it is only words.
 *
 * @param group - One kind of dice and its rules.
 * @param face - The physical face value to display or read.
 * @returns What a face of a group's die is worth in a total: its number, or for a custom face its value, which is 0 when it is only words.

 *
 * @example
 * ```ts
 * import { valueOfFace } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(valueOfFace(spec, 4));
 * ```
 */
export function valueOfFace(group: DiceGroup, face: number): number {
  return group.faces !== undefined ? (group.faces[face - 1]?.value ?? 0) : face;
}

/** The chance of each face of one die of a group, from its lowest face up. They sum to 1; a fair die's are all the same.
 *
 * @param group - One kind of dice and its rules.
 * @returns The chance of each face of one die of a group, from its lowest face up. They sum to 1; a fair die's are all the same.

 *
 * @example
 * ```ts
 * import { chancesOf } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(chancesOf(spec));
 * ```
 */
export function chancesOf(group: DiceGroup): number[] {
  const { low, high } = facesOf(group);
  const n = high - low + 1;
  if (group.weights === undefined) return new Array<number>(n).fill(1 / n);
  const all = group.weights.reduce((a, b) => a + b, 0);
  return group.weights.map((w) => w / all);
}

/**
 * What one kind of die is called: `d6`, `dF`, a loaded `d6{6:3}`, a custom
 * `d[Yes,No,Maybe]`. It is how the kind is written in notation, so two dice
 * with the same name are the same die.
 *
 * @param group - One kind of dice and its rules.
 * @returns What one kind of die is called: `d6`, `dF`, a loaded `d6{6:3}`, a custom `d[Yes,No,Maybe]`. It is how the kind is written in notation, so two dice with the same name are the same die.

 *
 * @example
 * ```ts
 * import { dieName } from "@johnmorrisdotca/korokoro";
 * import { parseNotation } from "@johnmorrisdotca/korokoro";
 * console.log(dieName(parseNotation("4dF")!));
 * ```
 */
export function dieName(group: DiceGroup): string {
  if (group.faces !== undefined) {
    const face = (f: CustomFace) => `${f.value !== undefined && f.label === String(f.value) ? f.label : f.value !== undefined ? `${f.label}=${f.value}` : f.label}${f.colour ?? ""}`;
    return `d[${group.faces.map(face).join(",")}]`;
  }
  if (group.weights === undefined) return `d${group.sides}`;
  const { low } = faceRange(group.sides);
  const loaded = group.weights.flatMap((w, i) => (w === 1 ? [] : [`${low + i}:${w}`]));
  return `d${group.sides}{${loaded.join(",")}}`;
}

/** Whether a roll has a loaded die in it.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @returns Whether a roll has a loaded die in it.

 *
 * @example
 * ```ts
 * import { isLoaded } from "@johnmorrisdotca/korokoro";
 * import { parseNotation } from "@johnmorrisdotca/korokoro";
 * console.log(isLoaded(parseNotation("1d6{6:3}")!));
 * ```
 */
export function isLoaded(spec: RollSpec): boolean {
  return groupsOf(spec).some((g) => g.weights !== undefined);
}

/**
 * Whether a roll is of plain fair dice and nothing else: no loaded die, and
 * no custom die either, whose faces are whatever somebody made them. A site
 * that wants only honest standard dice refuses anything this is false for.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @returns Whether a roll is of plain fair dice and nothing else: no loaded die, and no custom die either, whose faces are whatever somebody made them. A site that wants only honest standard dice refuses anything this is false for.

 *
 * @example
 * ```ts
 * import { isFair } from "@johnmorrisdotca/korokoro";
 * import { parseNotation } from "@johnmorrisdotca/korokoro";
 * console.log(isFair(parseNotation("1d6{6:3}")!));
 * ```
 */
export function isFair(spec: RollSpec): boolean {
  return groupsOf(spec).every((g) => g.weights === undefined && g.faces === undefined);
}

/**
 * Whether a roll's total says anything. It does unless every die in it is a
 * custom die with no numbers on it at all, such as Yes, No, Maybe: then the
 * roll is its faces' words, and the total is 0 and means nothing.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @returns Whether a roll's total says anything. It does unless every die in it is a custom die with no numbers on it at all, such as Yes, No, Maybe: then the roll is its faces' words, and the total is 0 and means nothing.

 *
 * @example
 * ```ts
 * import { hasTotal } from "@johnmorrisdotca/korokoro";
 * import { parseNotation } from "@johnmorrisdotca/korokoro";
 * console.log(hasTotal(parseNotation("2d[Left,Right]")!));
 * ```
 */
export function hasTotal(spec: RollSpec): boolean {
  return !groupsOf(spec).every((g) => g.faces !== undefined && g.faces.every((f) => f.value === undefined));
}

/** How many dice of one group count towards the total. For a roll of several kinds, ask each of `groupsOf`.
 *
 * @param group - One kind of dice and its rules.
 * @returns How many dice of one group count towards the total. For a roll of several kinds, ask each of `groupsOf`.

 *
 * @example
 * ```ts
 * import { keptCount } from "@johnmorrisdotca/korokoro";
 * import { parseNotation } from "@johnmorrisdotca/korokoro";
 * console.log(keptCount(parseNotation("4d6kh3")!));
 * ```
 */
export function keptCount(group: DiceGroup): number {
  return group.keep === "all" ? group.count : (group.keepCount ?? 1);
}

/** The rules a kind of dice may carry beyond its count, sides and keep, in the order they are copied. */
const RULES = ["keepCount", "explode", "reroll", "rerollUntil", "rerollWhen", "rerollUntilWhen", "explodeWhen", "explodeKind", "floor", "ceiling", "success", "failure", "critical", "fumble", "sort", "unique", "faces", "weights"] as const;

function copyRules(from: Partial<DiceGroup>, to: Partial<DiceGroup>): void {
  for (const rule of RULES) if (from[rule] !== undefined) (to as Record<string, unknown>)[rule] = from[rule];
}

/** The kinds of dice in a roll, in order: the spec's own first, then the rest.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @returns The kinds of dice in a roll, in order: the spec's own first, then the rest.

 *
 * @example
 * ```ts
 * import { groupsOf } from "@johnmorrisdotca/korokoro";
 * import { parseNotation } from "@johnmorrisdotca/korokoro";
 * console.log(groupsOf(parseNotation("1d6+1d8")!).map((group) => group.sides));
 * ```
 */
export function groupsOf(spec: RollSpec): DiceGroup[] {
  const first: DiceGroup = { count: spec.count, sides: spec.sides, keep: spec.keep };
  copyRules(spec, first);
  return [first, ...(spec.more ?? [])];
}

/** How many dice a roll asks for, over all its kinds.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @returns How many dice a roll asks for, over all its kinds.

 *
 * @example
 * ```ts
 * import { diceCount } from "@johnmorrisdotca/korokoro";
 * import { parseNotation } from "@johnmorrisdotca/korokoro";
 * console.log(diceCount(parseNotation("2d6+1d8")!));
 * ```
 */
export function diceCount(spec: RollSpec): number {
  return groupsOf(spec).reduce((sum, group) => sum + group.count, 0);
}

/** A spec from its kinds of dice and a bonus, brought into range.
 *
 * @param groups - The dice groups to combine, in order.
 * @param modifier - The bonus added after the dice totals.
 * @returns A spec from its kinds of dice and a bonus, brought into range.

 *
 * @example
 * ```ts
 * import { specOf } from "@johnmorrisdotca/korokoro";
 * import { formatNotation } from "@johnmorrisdotca/korokoro";
 * console.log(formatNotation(specOf([{ count: 2, sides: 6 }, { count: 1, sides: 8 }], 3)));
 * ```
 */
export function specOf(groups: readonly Partial<DiceGroup>[], modifier = 0): RollSpec {
  const [first, ...more] = groups;
  return normalizeSpec({ ...first, modifier, more: more as DiceGroup[] });
}

/** Whether the dice may explode: numbered dice of a hundred sides or fewer, all of them kept. A custom die never does.
 *
 * @param sides - A numbered die size or F for Fate dice.
 * @param keep - Whether all dice, the highest or the lowest count.
 * @returns Whether the dice may explode: numbered dice of a hundred sides or fewer, all of them kept. A custom die never does.

 *
 * @example
 * ```ts
 * import { mayExplode } from "@johnmorrisdotca/korokoro";
 * console.log(mayExplode(6, "all"), mayExplode(1000, "all"));
 * ```
 */
export function mayExplode(sides: Sides, keep: Keep): boolean {
  return sides !== "F" && sides <= MAX_EXPLODING_SIDES && keep === "all";
}

/** Whether a reroll at this face leaves something to do: it must reroll the lowest face and spare the highest.
 *
 * @param sides - A numbered die size or F for Fate dice.
 * @param reroll - The highest face eligible for a reroll.
 * @returns Whether a reroll at this face leaves something to do: it must reroll the lowest face and spare the highest.

 *
 * @example
 * ```ts
 * import { mayReroll } from "@johnmorrisdotca/korokoro";
 * console.log(mayReroll(6, 2), mayReroll(6, 6));
 * ```
 */
export function mayReroll(sides: Sides, reroll: unknown): reroll is number {
  const { low, high } = faceRange(sides);
  return typeof reroll === "number" && Number.isInteger(reroll) && reroll >= low && reroll < high;
}

/** Whether a die may be rerolled until it clears this face: the reroll must match the lowest face and no more than half of them.
 *
 * @param sides - A numbered die size or F for Fate dice.
 * @param reroll - The highest face eligible for a reroll.
 * @returns Whether a die may be rerolled until it clears this face: the reroll must match the lowest face and no more than half of them.

 *
 * @example
 * ```ts
 * import { mayRerollUntil } from "@johnmorrisdotca/korokoro";
 * console.log(mayRerollUntil(6, 2), mayRerollUntil(6, 4));
 * ```
 */
export function mayRerollUntil(sides: Sides, reroll: unknown): reroll is number {
  const { low, high } = faceRange(sides);
  return mayReroll(sides, reroll) && (reroll - low + 1) * 2 <= high - low + 1;
}

/** Whether some dice of a roll can be held while the rest are thrown again: plain dice only, none rerolled, exploding, kept or dropped, counted, raised, lowered or sorted.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @returns Whether some dice of a roll can be held while the rest are thrown again: plain dice only, none rerolled, exploding, kept or dropped, counted, raised, lowered or sorted.

 *
 * @example
 * ```ts
 * import { canHold } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(canHold(spec));
 * ```
 */
export function canHold(spec: RollSpec): boolean {
  return spec.math === undefined && groupsOf(spec).every((g) => g.keep === "all" && g.explode !== true && g.reroll === undefined && g.rerollUntil === undefined && !playsByNewRules(g) && g.sort === undefined && g.unique !== true);
}

/**
 * Whether a kind of dice is played by a rule added in 1.7.0, one that changes
 * what it can total: a reroll or an explosion at a comparison, compounding or
 * penetrating dice, `min` or `max`, or counted successes. Marks (`cs`, `cf`)
 * and a sort change nothing about the total and are not among them.
 *
 * @param g - One kind of dice and its rules.
 * @returns Whether a kind of dice is played by a rule added in 1.7.0, one that changes what it can total: a reroll or an explosion at a comparison, compounding or penetrating dice, `min` or `max`, or counted successes. Marks (`cs`, `cf`) and a sort change nothing about the total and are not among them.

 *
 * @example
 * ```ts
 * import { playsByNewRules } from "@johnmorrisdotca/korokoro";
 * import { parseNotation } from "@johnmorrisdotca/korokoro";
 * console.log(playsByNewRules(parseNotation("3d6>=5")!));
 * ```
 */
export function playsByNewRules(g: DiceGroup): boolean {
  return g.rerollWhen !== undefined || g.rerollUntilWhen !== undefined || g.explodeWhen !== undefined || g.explodeKind !== undefined || g.floor !== undefined || g.ceiling !== undefined || g.success !== undefined;
}

/** Whether a kind of dice is counted for successes, not added up.
 *
 * @param group - One kind of dice and its rules.
 * @returns Whether a kind of dice is counted for successes, not added up.

 *
 * @example
 * ```ts
 * import { countsSuccesses } from "@johnmorrisdotca/korokoro";
 * import { parseNotation } from "@johnmorrisdotca/korokoro";
 * console.log(countsSuccesses(parseNotation("3d6>=5")!));
 * ```
 */
export function countsSuccesses(group: DiceGroup): boolean {
  return group.success !== undefined;
}

/** Whether the first thing a roll says is a number of successes: every kind of dice in it is counted.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @returns Whether the first thing a roll says is a number of successes: every kind of dice in it is counted.

 *
 * @example
 * ```ts
 * import { isSuccessRoll } from "@johnmorrisdotca/korokoro";
 * import { parseNotation } from "@johnmorrisdotca/korokoro";
 * console.log(isSuccessRoll(parseNotation("3d6>=5")!));
 * ```
 */
export function isSuccessRoll(spec: RollSpec): boolean {
  return spec.math === undefined && groupsOf(spec).every(countsSuccesses);
}

/** Whether a kind of dice is plain enough to be rolled in any number: a fair numbered or Fate die, all added or one kept, under no other rule.
 *
 * @param g - One kind of dice and its rules.
 * @returns Whether a kind of dice is plain enough to be rolled in any number: a fair numbered or Fate die, all added or one kept, under no other rule.

 *
 * @example
 * ```ts
 * import { isPlainDice } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(isPlainDice(spec));
 * ```
 */
export function isPlainDice(g: DiceGroup): boolean {
  return g.faces === undefined && g.weights === undefined && g.explode !== true && g.reroll === undefined && g.rerollUntil === undefined && !playsByNewRules(g) && g.unique !== true && (g.keep === "all" || (g.keepCount ?? 1) === 1);
}

/** The faces of a numbered die that meet a comparison. */
function facesMeeting(sides: Sides, compare: Compare): number[] {
  const { low, high } = faceRange(sides);
  const found: number[] = [];
  for (let face = low; face <= high; face++) if (meets(compare, face)) found.push(face);
  return found;
}

/** A comparison given by hand, checked: a whole number and one of the four ways of comparing. */
function soundCompare(given: unknown): Compare | undefined {
  if (typeof given !== "object" || given === null) return undefined;
  const { op, n } = given as Record<string, unknown>;
  if ((op !== "=" && op !== "<=" && op !== ">=" && op !== "<>") || typeof n !== "number" || !Number.isInteger(n) || Math.abs(n) > 99_999) return undefined;
  return { op, n };
}

/**
 * The rules added in 1.7.0, checked for one kind of numbered dice and written
 * onto it. Each is kept only if it leaves something to roll: a reroll must
 * spare a face, an explosion must not take every face, a success must be
 * possible. A rule that cannot be kept is left out, never guessed at.
 * `problemWith` says which, for the strict reader.
 */
function newRules(group: Partial<DiceGroup>, fair: DiceGroup): void {
  const { sides } = fair;
  if (sides === "F") return;
  const all = sides;
  // Rerolls: a run of faces from the lowest is the older, plainer rule, and is kept as that.
  const asRun = (compare: Compare): number | undefined => {
    const found = facesMeeting(sides, compare);
    return found.length > 0 && found.every((face, i) => face === i + 1) ? found.length : undefined;
  };
  const until = soundCompare(group.rerollUntilWhen);
  const once = soundCompare(group.rerollWhen);
  if (fair.rerollUntil === undefined && fair.reroll === undefined) {
    if (until !== undefined) {
      const found = facesMeeting(sides, until).length;
      const run = asRun(until);
      if (found > 0 && found * 2 <= all) {
        if (run !== undefined) fair.rerollUntil = run;
        else fair.rerollUntilWhen = until;
      }
    } else if (once !== undefined) {
      const found = facesMeeting(sides, once).length;
      const run = asRun(once);
      if (found > 0 && found < all) {
        if (run !== undefined) fair.reroll = run;
        else fair.rerollWhen = once;
      }
    }
  }
  if (fair.explode === true) {
    const when = soundCompare(group.explodeWhen);
    if (when !== undefined) {
      const found = facesMeeting(sides, when);
      if (found.length > 0 && found.length < all && !(found.length === 1 && found[0] === all)) fair.explodeWhen = when;
    }
    if (group.explodeKind === "compound" || group.explodeKind === "penetrating" || group.explodeKind === "compound-penetrating") fair.explodeKind = group.explodeKind;
  }
  const whole = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n);
  if (whole(group.floor) && group.floor > 1 && group.floor <= all) fair.floor = group.floor;
  if (whole(group.ceiling) && group.ceiling >= 1 && group.ceiling < all && (fair.floor === undefined || fair.floor <= group.ceiling)) fair.ceiling = group.ceiling;
  // Counting: over every die of the kind, so not together with keep or drop.
  const success = soundCompare(group.success);
  if (success !== undefined && fair.keep === "all" && mayCount(fair, success)) {
    fair.success = success;
    const failure = soundCompare(group.failure);
    if (failure !== undefined && mayCount(fair, failure) && !worthsOf(fair).some((v) => meets(success, v) && meets(failure, v))) fair.failure = failure;
  }
  const critical = soundCompare(group.critical);
  if (critical !== undefined && mayCount(fair, critical)) fair.critical = critical;
  const fumble = soundCompare(group.fumble);
  if (fumble !== undefined && mayCount(fair, fumble)) fair.fumble = fumble;
  if (group.sort === "ascending" || group.sort === "descending") fair.sort = group.sort;
  // Dice that all differ: fair dice of a hundred sides or fewer, no more of them than faces, all added, under no rule that throws a die again.
  if (group.unique === true && all <= MAX_UNIQUE_SIDES && fair.count > 1 && fair.count <= all && fair.keep === "all" && fair.weights === undefined && fair.explode !== true && fair.reroll === undefined && fair.rerollUntil === undefined && !playsByNewRules(fair)) fair.unique = true;
}

/** Every amount one die of a kind can be worth once its rules are applied: what a success or a mark is compared with. */
function worthsOf(group: DiceGroup): number[] {
  const { least, chances } = dieOutcomes({ ...group, success: undefined, failure: undefined });
  return chances.flatMap((p, i) => (p > 0 ? [least + i] : []));
}

/** Whether a comparison can be met by some die of the kind, and is not met by every one. */
function mayCount(group: DiceGroup, compare: Compare): boolean {
  const worths = worthsOf(group);
  const met = worths.filter((v) => meets(compare, v)).length;
  return met > 0 && met < worths.length;
}

/** Characters a custom face's words may not hold: the ones notation is written with. */
const NOT_IN_A_LABEL = /[,[\]{}=#+]/;
/** A control character: a new line, a tab, a bell. None belongs in a face's words. */
const isControl = (text: string) => [...text].some((c) => (c.codePointAt(0) as number) < 32 || c.codePointAt(0) === 127);

/** A custom die's faces, checked: the faces as given if every one is sound, or undefined.
 *
 * @param faces - Physical face values, in the order thrown.
 * @returns A custom die's faces, checked: the faces as given if every one is sound, or undefined.

 *
 * @example
 * ```ts
 * import { customFaces } from "@johnmorrisdotca/korokoro";
 * console.log(customFaces([{ label: "Hit", value: 1 }, { label: "Miss", value: 0 }])?.map((face) => face.label));
 * ```
 */
export function customFaces(faces: unknown): CustomFace[] | undefined {
  if (!Array.isArray(faces) || faces.length < MIN_SIDES || faces.length > MAX_FACES) return undefined;
  const sound: CustomFace[] = [];
  for (const given of faces as unknown[]) {
    if (typeof given !== "object" || given === null) return undefined;
    const { label, value, colour } = given as Record<string, unknown>;
    if (typeof label !== "string" || label !== label.trim() || label === "" || [...label].length > MAX_LABEL || NOT_IN_A_LABEL.test(label) || isControl(label)) return undefined;
    const face: CustomFace = { label };
    if (value !== undefined) {
      if (typeof value !== "number" || !Number.isInteger(value) || Math.abs(value) > MAX_FACE_VALUE) return undefined;
      face.value = value;
    }
    if (colour !== undefined) {
      if (typeof colour !== "string" || !/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(colour)) return undefined;
      face.colour = colour.toLowerCase();
    }
    sound.push(face);
  }
  return sound;
}

/**
 * A loaded die's weights, checked and in lowest terms: one whole number from
 * 0 to `MAX_WEIGHT` for each face, at least two faces that can come up.
 * Undefined when they are not sound, and also when every face weighs the
 * same, which is a fair die and must not be called loaded.
 *
 * @param sides - A numbered die size or F for Fate dice.
 * @param weights - One integer weight per physical face.
 * @returns A loaded die's weights, checked and in lowest terms: one whole number from 0 to `MAX_WEIGHT` for each face, at least two faces that can come up. undefined when they are not sound, and also when every face weighs the same, which is a fair die and must not be called loaded.

 *
 * @example
 * ```ts
 * import { loadedWeights } from "@johnmorrisdotca/korokoro";
 * console.log(loadedWeights(6, [1, 1, 1, 1, 1, 3]));
 * ```
 */
export function loadedWeights(sides: Sides, weights: unknown): number[] | undefined {
  if (sides === "F" || sides > MAX_LOADED_SIDES || !Array.isArray(weights) || weights.length !== sides) return undefined;
  if (!weights.every((w) => typeof w === "number" && Number.isInteger(w) && w >= 0 && w <= MAX_WEIGHT)) return undefined;
  const all = weights as number[];
  if (all.filter((w) => w > 0).length < 2) return undefined;
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const common = all.reduce(gcd);
  const least = all.map((w) => w / common);
  return least.every((w) => w === 1) ? undefined : least;
}

/** A roll's label, checked: a few words with no control characters and nothing notation is written with, or undefined.
 *
 * @param label - The optional short text that describes a roll.
 * @returns A roll's label, checked: a few words with no control characters and nothing notation is written with, or undefined.

 *
 * @example
 * ```ts
 * import { rollLabel } from "@johnmorrisdotca/korokoro";
 * console.log(rollLabel(" fire damage "));
 * ```
 */
export function rollLabel(label: unknown): string | undefined {
  if (typeof label !== "string") return undefined;
  const words = label.trim().replace(/\s+/g, " ");
  // Only digits is no label: `2d6 # 3` is somebody reaching for a repeat, which is written `3#2d6`.
  if (words === "" || [...words].length > MAX_ROLL_LABEL || isControl(words) || /[#[\]{}]/.test(words) || /^\d+$/.test(words)) return undefined;
  return words;
}

/** One kind of dice brought into range, its count already settled. */
function normalizeGroup(group: Partial<DiceGroup>, count: number): DiceGroup {
  // A custom die is its faces and nothing else: it takes no modifiers.
  const faces = customFaces(group.faces);
  if (faces !== undefined) return { count, sides: faces.length, keep: "all", faces };
  const sides = isSides(group.sides) ? group.sides : DEFAULT_SPEC.sides;
  // Keeping one of one die is simply rolling it.
  const keep: Keep = count > 1 && (group.keep === "highest" || group.keep === "lowest") ? group.keep : "all";
  const fair: DiceGroup = { count, sides, keep };
  if (keep !== "all") {
    const kept = Math.min(count - 1, Math.max(1, Math.trunc(Number(group.keepCount) || 1)));
    if (kept > 1) fair.keepCount = kept;
  }
  if (group.explode === true && mayExplode(sides, keep)) fair.explode = true;
  // A die is rerolled one way or the other; until clear wins when both are asked.
  if (mayRerollUntil(sides, group.rerollUntil)) fair.rerollUntil = group.rerollUntil;
  else if (mayReroll(sides, group.reroll)) fair.reroll = group.reroll;
  const weights = loadedWeights(sides, group.weights);
  if (weights !== undefined) fair.weights = weights;
  newRules(group, fair);
  return fair;
}

/** The modifiers of one kind of dice as notation writes them, in the one order they are written: `>=8f=1!`, `r<3kh3`. Two kinds with the same die and the same text here are the same dice under the same rules.
 *
 * @param group - One kind of dice and its rules.
 * @returns The modifiers of one kind of dice as notation writes them, in the one order they are written: `>=8f=1!`, `r<3kh3`. Two kinds with the same die and the same text here are the same dice under the same rules.

 *
 * @example
 * ```ts
 * import { rulesText } from "@johnmorrisdotca/korokoro";
 * import { parseNotation } from "@johnmorrisdotca/korokoro";
 * console.log(rulesText(parseNotation("4d6kh3")!));
 * ```
 */
export function rulesText(group: DiceGroup): string {
  const count = group.success === undefined ? "" : `${compareText(group.success)}${group.failure === undefined ? "" : `f${compareText(group.failure)}`}`;
  const kind = group.explodeKind === undefined ? "!" : group.explodeKind === "compound" ? "!!" : group.explodeKind === "penetrating" ? "!p" : "!!p";
  const explode = group.explode === true ? `${kind}${group.explodeWhen === undefined ? "" : compareText(group.explodeWhen)}` : "";
  const reroll =
    group.rerollUntil !== undefined
      ? `r<${group.rerollUntil + 1}`
      : group.reroll !== undefined
        ? `ro<${group.reroll + 1}`
        : group.rerollUntilWhen !== undefined
          ? `r${compareText(group.rerollUntilWhen)}`
          : group.rerollWhen !== undefined
            ? `ro${compareText(group.rerollWhen)}`
            : "";
  const keep = group.keep === "all" ? "" : `${group.keep === "highest" ? "kh" : "kl"}${group.keepCount ?? 1}`;
  const clamp = `${group.floor === undefined ? "" : `min${group.floor}`}${group.ceiling === undefined ? "" : `max${group.ceiling}`}`;
  const marks = `${group.critical === undefined ? "" : `cs${compareText(group.critical)}`}${group.fumble === undefined ? "" : `cf${compareText(group.fumble)}`}`;
  const sort = group.sort === undefined ? "" : group.sort === "ascending" ? "sa" : "sd";
  return `${count}${explode}${reroll}${keep}${clamp}${group.unique === true ? "u" : ""}${marks}${sort}`;
}

/** Whether two kinds are the same dice under the same rules, all of them added: then they are one kind with more dice. */
function sameDice(a: DiceGroup, b: DiceGroup): boolean {
  return dieName(a) === dieName(b) && a.keep === "all" && b.keep === "all" && rulesText(a) === rulesText(b);
}

/**
 * A spec brought into range, so a hand-typed or stored one can never roll
 * eleven dice, five kinds or a die with no faces. A part that cannot be kept
 * is left out, never guessed at; `checkNotation` is the strict reader, and
 * says which part. Two kinds that are the same dice under the same rules
 * become one: `2d6+3d6` is `5d6`.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @param limits - Optional limits for callers that allow larger plain pools.
 * @returns A spec brought into range, so a hand-typed or stored one can never roll eleven dice, five kinds or a die with no faces. A part that cannot be kept is left out, never guessed at; `checkNotation` is the strict reader, and says which part. Two kinds that are the same dice under the same rules become one: `2d6+3d6` is `5d6`.

 *
 * @example
 * ```ts
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * console.log(normalizeSpec({ count: 2, sides: 6 }));
 * ```
 */
export function normalizeSpec(spec: Partial<RollSpec>, limits: { maxDice?: number } = {}): RollSpec {
  const most = Math.min(MAX_DICE_BY_CODE, Math.max(MAX_DICE, Math.trunc(Number(limits.maxDice) || MAX_DICE)));
  const made = normalized(spec, most);
  // Past ten dice every kind has to be plain; a roll that is not is brought back to ten.
  if (most > MAX_DICE && diceCount(made) > MAX_DICE && !groupsOf(made).every(isPlainDice)) return normalized(spec, MAX_DICE);
  return made;
}

function normalized(spec: Partial<RollSpec>, most: number): RollSpec {
  const count = Math.min(most, Math.max(MIN_DICE, Math.trunc(Number(spec.count) || DEFAULT_SPEC.count)));
  const modifier = Math.min(MAX_MODIFIER, Math.max(-MAX_MODIFIER, Math.trunc(Number(spec.modifier) || 0)));
  const groups: DiceGroup[] = [normalizeGroup(spec, count)];
  const given = Array.isArray(spec.more) ? spec.more : [];
  // A formula names each kind by its place, so its kinds are kept apart and in place; without one, two kinds that are the same dice are one.
  let math = soundMath(spec.math);
  let room = most - count;
  for (const next of given) {
    if (room < 1) break;
    if (typeof next !== "object" || next === null || !isSides(next.sides)) continue;
    const asked = Math.min(room, Math.max(MIN_DICE, Math.trunc(Number(next.count) || 1)));
    const group = normalizeGroup(next, asked);
    const twin = math === undefined ? groups.find((g) => sameDice(g, group)) : undefined;
    if (twin !== undefined) twin.count += group.count;
    else if (groups.length < MAX_GROUPS) groups.push(group);
    else continue;
    room -= group.count;
  }
  // A formula that no longer fits its dice, or cannot be used, is left out: the kinds are then simply added.
  if (math !== undefined && (groups.length !== given.length + 1 || checkMath(math, groups.map(groupRange)) !== null)) math = undefined;
  const [first, ...more] = groups as [DiceGroup, ...DiceGroup[]];
  const fair: RollSpec = { count: first.count, sides: first.sides, modifier: math === undefined ? modifier : 0, keep: first.keep };
  copyRules(first, fair);
  if (more.length > 0) fair.more = more;
  const times = Math.min(MAX_TIMES, Math.trunc(Number(spec.times) || 1));
  if (times > 1) fair.times = times;
  if (math !== undefined) fair.math = math;
  const label = rollLabel(spec.label);
  if (label !== undefined) fair.label = label;
  return fair;
}

/** The least and the most one kind of dice can total, its own rules applied.
 *
 * @param group - One kind of dice and its rules.
 * @returns The least and the most one kind of dice can total, its own rules applied.

 *
 * @example
 * ```ts
 * import { groupRange } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(groupRange(spec));
 * ```
 */
export function groupRange(group: DiceGroup): { min: number; max: number } {
  const dice = keptCount(group);
  if (group.unique === true) {
    // Dice that all differ: the lowest faces, or the highest.
    const sides = group.sides as number;
    return { min: (dice * (dice + 1)) / 2, max: (dice * (2 * sides - dice + 1)) / 2 };
  }
  if (playsByNewRules(group)) {
    // What one die can add, from its rules played out; each kept die can reach either end.
    const { least, chances } = dieOutcomes(group);
    return { min: dice * least, max: dice * (least + chances.length - 1) };
  }
  const { low, high } = facesOf(group);
  // What the die can be worth: every face that can come up, a loaded die's weightless faces left out.
  const worth: number[] = [];
  for (let face = low; face <= high; face++) if (group.weights?.[face - low] !== 0) worth.push(valueOfFace(group, face));
  return { min: dice * Math.min(...worth), max: dice * (group.explode === true ? high * (MAX_EXPLOSIONS + 1) : Math.max(...worth)) };
}

/** Which faces count towards the total when one is kept. Ties keep the first die that shows the kept value.
 *
 * @param faces - Physical face values, in the order thrown.
 * @param keep - Whether all dice, the highest or the lowest count.
 * @returns Which faces count towards the total when one is kept. Ties keep the first die that shows the kept value.

 *
 * @example
 * ```ts
 * import { keptFaces } from "@johnmorrisdotca/korokoro";
 * console.log(keptFaces([1, 4, 6], "highest"));
 * ```
 */
export function keptFaces(faces: readonly number[], keep: Keep): boolean[] {
  if (keep === "all") return faces.map(() => true);
  const target = keep === "highest" ? Math.max(...faces) : Math.min(...faces);
  const index = faces.indexOf(target);
  return faces.map((_, i) => i === index);
}

/** The kept faces added up, plus the bonus.
 *
 * @param faces - Physical face values, in the order thrown.
 * @param kept - A mask saying which dice count towards the total.
 * @param modifier - The bonus added after the dice totals.
 * @returns The kept faces added up, plus the bonus.

 *
 * @example
 * ```ts
 * import { totalOf } from "@johnmorrisdotca/korokoro";
 * console.log(totalOf([2, 5], [true, true], 3));
 * ```
 */
export function totalOf(faces: readonly number[], kept: readonly boolean[], modifier: number): number {
  return faces.reduce((sum, face, i) => (kept[i] ? sum + face : sum), 0) + modifier;
}

/** One kind's rules as questions asked of a face: is it thrown again, does it explode, what is it worth. */
function rulesOf(group: DiceGroup): { once: (face: number) => boolean; until: (face: number) => boolean; explodes: (face: number) => boolean; worth: (face: number, extra: boolean) => number } {
  const { high } = facesOf(group);
  const penetrating = group.explodeKind === "penetrating" || group.explodeKind === "compound-penetrating";
  return {
    once: (face) => (group.reroll !== undefined && face <= group.reroll) || (group.rerollWhen !== undefined && meets(group.rerollWhen, face)),
    until: (face) => (group.rerollUntil !== undefined && face <= group.rerollUntil) || (group.rerollUntilWhen !== undefined && meets(group.rerollUntilWhen, face)),
    explodes: (face) => group.explode === true && (group.explodeWhen === undefined ? face === high : meets(group.explodeWhen, face)),
    worth: (face, extra) => Math.min(group.ceiling ?? Infinity, Math.max(group.floor ?? -Infinity, valueOfFace(group, face))) - (extra && penetrating ? 1 : 0),
  };
}

/**
 * One die of a kind worked through its own rules, before any keeping or
 * dropping: the chance of each amount it adds to the total, from `least` up.
 * For dice that are added, that is what the die is worth, explosions and all;
 * for dice that are counted, it is the successes it makes less the ones it
 * takes away. Exact as the rules are played: rerolls stop after
 * `MAX_REROLLS` and explosions after `MAX_EXPLOSIONS`, here as in a roll.
 *
 * @param group - One kind of dice and its rules.
 * @returns One die of a kind worked through its own rules, before any keeping or dropping: the chance of each amount it adds to the total, from `least` up. For dice that are added, that is what the die is worth, explosions and all; for dice that are counted, it is the successes it makes less the ones it takes away. Exact as the rules are played: rerolls stop after `MAX_REROLLS` and explosions after `MAX_EXPLOSIONS`, here as in a roll.

 *
 * @example
 * ```ts
 * import { dieOutcomes } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(dieOutcomes(spec));
 * ```
 */
export function dieOutcomes(group: DiceGroup): { least: number; chances: number[] } {
  const { low } = facesOf(group);
  const rules = rulesOf(group);
  const thrownOnce = chancesOf(group);
  // The chance each face is the one left standing after the rerolls.
  let standing = thrownOnce;
  const masked = (mask: (face: number) => boolean) => thrownOnce.reduce((sum, p, i) => (mask(low + i) ? sum + p : sum), 0);
  const againOnce = masked(rules.once);
  if (againOnce > 0) standing = thrownOnce.map((p, i) => (rules.once(low + i) ? 0 : p) + againOnce * p);
  const again = masked(rules.until);
  if (again > 0) {
    // After a reroll-once, the face standing is rerolled until clear in turn; the two are never both asked for, so this is one or the other.
    const stuck = again ** MAX_REROLLS;
    const throws = (1 - again * stuck) / (1 - again);
    standing = thrownOnce.map((p, i) => (rules.until(low + i) ? stuck * p : throws * p));
  }
  const counted = group.success !== undefined;
  const whole = group.explodeKind === "compound" || group.explodeKind === "compound-penetrating";
  const score = (worth: number): number => (group.success !== undefined && meets(group.success, worth) ? 1 : group.failure !== undefined && meets(group.failure, worth) ? -1 : 0);
  // What one die adds by itself: its worth, or, counted die by die, its score.
  const adds = (face: number, extra: boolean): number => (counted && !whole ? score(rules.worth(face, extra)) : rules.worth(face, extra));
  type Spread = Map<number, number>;
  const put = (into: Spread, amount: number, chance: number) => into.set(amount, (into.get(amount) ?? 0) + chance);
  // chain(left, extra): what a die adds with `left` explosions still allowed.
  let after: Spread = new Map();
  const steps = group.explode === true ? MAX_EXPLOSIONS : 0;
  for (let left = 0; left <= steps; left++) {
    const extra = left < steps;
    const now: Spread = new Map();
    for (let i = 0; i < standing.length; i++) {
      const chance = standing[i] as number;
      if (chance === 0) continue;
      const face = low + i;
      const here = adds(face, extra);
      if (left > 0 && rules.explodes(face)) for (const [amount, further] of after) put(now, here + amount, chance * further);
      else put(now, here, chance);
    }
    after = now;
  }
  let spread = after;
  if (counted && whole) {
    // A compounding die is one die: its whole chain is compared once.
    spread = new Map();
    for (const [amount, chance] of after) put(spread, score(amount), chance);
  }
  const amounts = [...spread.keys()];
  const least = Math.min(...amounts);
  const chances = new Array<number>(Math.max(...amounts) - least + 1).fill(0);
  for (const [amount, chance] of spread) chances[amount - least] = chance;
  return { least, chances };
}

/**
 * The one set of rules for a throw, whether the faces come from a generator
 * or from a roll that was kept or shared. The kinds of dice are thrown in
 * order, and each die asked for is settled before the next is touched: it is
 * thrown; if it is to be rerolled it is thrown again (once, or until it
 * clears); if the face that stands is the highest and the dice explode it
 * throws another die, which follows the same rules. Then keep or drop picks
 * among that kind's dice left standing. Null when `draw` runs out.
 */
function play(spec: RollSpec, draw: (group: DiceGroup, taken?: ReadonlySet<number>) => number | null): DieRoll[] | null {
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
    if (used >= faces.length || typeof face !== "number" || !Number.isInteger(face) || face < low || face > high) return null;
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
    roll.faces.map((face, i): DieRoll => ({ face, status: roll.kept[i] === false ? "dropped" : "kept", exploded: false, die: i }))
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
    let pick = randomInt(source, group.weights.reduce((a, b) => a + b, 0));
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
    totals[at] = (totals[at] as number) + (group.success !== undefined ? (die.counts ?? 0) : (die.value ?? valueOfFace(group, die.face)));
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
    totals[at] = (totals[at] as number) + (group.success !== undefined ? (die.counts ?? 0) : (die.value ?? valueOfFace(group, die.face)));
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
export function rollMany(spec: Partial<RollSpec>, times?: number, source: RandomSource = cryptoSource(), when: number | RollOptions = Date.now()): RollSet {
  const { at, limits } = rollOptions(when);
  const fair = normalizeSpec(spec, limits);
  const many = Math.min(MAX_TIMES, Math.max(1, Math.trunc(Number(times ?? fair.times) || 1)));
  const rolls: Roll[] = [];
  for (let index = 0; index < many; index++) rolls.push(made(fair, play(fair, draws(source)) as DieRoll[], source, at));
  const id = rolls[0]?.id ?? "";
  if (many > 1) rolls.forEach((r, index) => (r.set = { id, index, of: many }));
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
export function rollFrom(spec: RollSpec, faces: readonly unknown[], id: string, at: number, seed: string | null): Roll | null {
  const dice = readDice(spec, faces);
  if (dice === null) return null;
  const read: Roll = { id, spec, faces: dice.map((d) => d.face), kept: dice.map((d) => d.status === "kept"), total: totalOfDice(spec, dice), at, seed, dice };
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
export function roll(spec: Partial<RollSpec>, source: RandomSource = cryptoSource(), when: number | RollOptions = Date.now()): Roll {
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
export function rollHeld(previous: Roll, held: readonly boolean[], source: RandomSource = cryptoSource(), at: number = Date.now()): Roll {
  if (!canHold(previous.spec)) throw new RangeError("korokoro: only plain dice can be held");
  if (held.length !== previous.faces.length) throw new RangeError("korokoro: held must say yes or no for every die of the roll");
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
  return ranges.reduce((all, range) => ({ min: all.min + range.min, max: all.max + range.max }), { min: spec.modifier, max: spec.modifier });
}
