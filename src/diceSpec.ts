import type { Sides } from "./diceLimits.ts";
import type { MathNode } from "./math.ts";

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

/** The dice a tray shows when nothing else is asked for: 2d6.
 *
 * @example
 * ```ts
 * import { DEFAULT_SPEC, formatNotation } from "@johnmorrisdotca/korokoro";
 * console.log(formatNotation(DEFAULT_SPEC));
 * ```
 */
export const DEFAULT_SPEC: RollSpec = { count: 2, sides: 6, modifier: 0, keep: "all" };
