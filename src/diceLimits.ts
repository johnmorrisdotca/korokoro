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

/** The longest a roll's label may be, in characters.
 *
 * @example
 * ```ts
 * import { MAX_ROLL_LABEL } from "@johnmorrisdotca/korokoro";
 * console.log(MAX_ROLL_LABEL);
 * ```
 */
export const MAX_ROLL_LABEL = 40;
