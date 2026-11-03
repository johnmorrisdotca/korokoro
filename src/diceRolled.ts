import type { RollSpec } from "./diceSpec.ts";

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
