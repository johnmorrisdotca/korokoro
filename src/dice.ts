import { copyRules, facesOf } from "./diceInternal.ts";
import { normalizeSpec } from "./diceNormalize.ts";
import type { MathNode } from "./math.ts";

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
  return compare.op === "="
    ? value === compare.n
    : compare.op === "<="
      ? value <= compare.n
      : compare.op === ">="
        ? value >= compare.n
        : value !== compare.n;
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
  return (
    value === "F" || (typeof value === "number" && Number.isInteger(value) && value >= MIN_SIDES && value <= MAX_SIDES)
  );
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
    const face = (f: CustomFace) =>
      `${f.value !== undefined && f.label === String(f.value) ? f.label : f.value !== undefined ? `${f.label}=${f.value}` : f.label}${f.colour ?? ""}`;
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
  return !groupsOf(spec).every((g) => g.faces?.every((f) => f.value === undefined) ?? false);
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
  return (
    spec.math === undefined &&
    groupsOf(spec).every(
      (g) =>
        g.keep === "all" &&
        g.explode !== true &&
        g.reroll === undefined &&
        g.rerollUntil === undefined &&
        !playsByNewRules(g) &&
        g.sort === undefined &&
        g.unique !== true,
    )
  );
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
  return (
    g.rerollWhen !== undefined ||
    g.rerollUntilWhen !== undefined ||
    g.explodeWhen !== undefined ||
    g.explodeKind !== undefined ||
    g.floor !== undefined ||
    g.ceiling !== undefined ||
    g.success !== undefined
  );
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
  return (
    g.faces === undefined &&
    g.weights === undefined &&
    g.explode !== true &&
    g.reroll === undefined &&
    g.rerollUntil === undefined &&
    !playsByNewRules(g) &&
    g.unique !== true &&
    (g.keep === "all" || (g.keepCount ?? 1) === 1)
  );
}

export {
  customFaces,
  dieOutcomes,
  groupRange,
  keptFaces,
  loadedWeights,
  normalizeSpec,
  rollLabel,
  rulesText,
  totalOf,
} from "./diceNormalize.ts";
export {
  diceOf,
  groupOf,
  groupTotals,
  type RollOptions,
  rangeOf,
  readDice,
  roll,
  rollFrom,
  rollHeld,
  rollMany,
  setOf,
  sidesOf,
} from "./diceRoll.ts";
