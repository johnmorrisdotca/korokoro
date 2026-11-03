import { MAX_DICE } from "./dice.ts";

/**
 * DICE WAR: the simplest game there is for dice, and the first game here that is played rather than only read.
 *
 * Two or more players, any of them a computer. Each round everybody rolls the same dice (one die unless said) and the
 * highest total scores a point. If two or more tie for highest it is war: only the tied players roll again, and the
 * stake grows by a point for each war, so the winner takes everything at stake. The game is played to a score (the first
 * to reach it) or for a number of rounds (the most points when they are up; level, the win is shared).
 *
 * Pure and seeded: a computer's dice come from the game's seed, the round and the war they are rolled in, so the same
 * seed and the same people's dice make the same game on every device. A person's dice are what the tray threw, handed
 * in as the move. A game is its table, its seed and its moves, and is kept as text. Every function returns a new game and
 * leaves the one it was given alone. Nothing is staked: the points are only points.
 */

/** What a table may be set up with.
 *
 * @example
 * ```ts
 * import { DICE_WAR_LIMITS } from "@johnmorrisdotca/korokoro";
 * console.log(Object.keys(DICE_WAR_LIMITS));
 * ```
 */
export const DICE_WAR_LIMITS = {
  /** The fewest players. */
  fewestPlayers: 2,
  /** The most players. */
  mostPlayers: 8,
  /** The most dice each player rolls. */
  mostDice: MAX_DICE,
  /** The most points a game may be played to. */
  mostPoints: 100,
  /** The most rounds a game may last. */
  mostRounds: 200,
  /** The most wars one round may go through before it is called off with nobody scoring: with two or more sides to a die it is never reached in practice. */
  mostWars: 100,
} as const;

/** How a game is played to its end.
 *
 * @example
 * ```ts
 * import type { DiceWarGoal } from "@johnmorrisdotca/korokoro";
 * const value: DiceWarGoal = "rounds";
 * console.log(value);
 * ```
 */
export type DiceWarGoal = "points" | "rounds";

/** What a game of Dice War is set up with. Everything but the players is optional.
 *
 * @example
 * ```ts
 * import type { DiceWarOptions } from "@johnmorrisdotca/korokoro";
 * const value: DiceWarOptions = { players: ["One", "Two"], computers: [true, true], seed: "docs" };
 * console.log(value.players.length);
 * ```
 */
export type DiceWarOptions = {
  /** One name a seat. Two to eight. */
  players: readonly string[];
  /** One a seat: true where a computer rolls. A seat not given is a person's, whose dice are handed in. */
  computers?: readonly boolean[];
  /** How many dice each player rolls, added up: 1 unless said, up to `DICE_WAR_LIMITS.mostDice`. */
  dice?: number;
  /** How many sides each die has, 2 to 1000: 6 unless said. */
  sides?: number;
  /** `"points"`, played to a score (unless said), or `"rounds"`, played for a number of rounds. */
  goal?: DiceWarGoal;
  /** The score to play to, or the number of rounds: 5 unless said. */
  to?: number;
  /** The seed the computers' dice come from, any text: a fresh one unless said. */
  seed?: string;
};

/** One player's roll in a throw: their faces, and what they add up to.
 *
 * @example
 * ```ts
 * import type { DiceWarRoll } from "@johnmorrisdotca/korokoro";
 * const value: DiceWarRoll = { seat: 0, faces: [3, 4], total: 7 };
 * console.log(value.total);
 * ```
 */
export type DiceWarRoll = { seat: number; faces: number[]; total: number };

/**
 * One throw of the table: everybody who had to roll, in seat order, the war it was in (0 for the round's first throw), the
 * seats that tied for highest, and who took the stake: null where the throw was a tie and the war goes on, or the round
 * was called off.
 *
 * @example
 * ```ts
 * import type { DiceWarThrow } from "@johnmorrisdotca/korokoro";
 * import { startDiceWar, playDiceWar } from "@johnmorrisdotca/korokoro";
 * const value: DiceWarThrow = playDiceWar(startDiceWar({ players: ["One", "Two"], computers: [true, true], seed: "docs" })!, {})!.throws[0]!;
 * console.log(value.round);
 * ```
 */
export type DiceWarThrow = {
  round: number;
  war: number;
  rolls: DiceWarRoll[];
  tied: number[];
  winner: number | null;
  stake: number;
};

/** A move: the dice the people at the table rolled, by seat, such as `{ faces: { "0": [4] } }`. The computers' dice are the seed's, so a table of computers is `{}`.
 *
 * @example
 * ```ts
 * import type { DiceWarMove } from "@johnmorrisdotca/korokoro";
 * const value: DiceWarMove = { faces: { "0": [3, 4] } };
 * console.log(value.faces);
 * ```
 */
export type DiceWarMove = { faces?: Record<string, readonly number[]> };

/** A game of Dice War: its table, seed and moves (what is kept), and what they make.
 *
 * @example
 * ```ts
 * import type { DiceWarGame } from "@johnmorrisdotca/korokoro";
 * import { startDiceWar } from "@johnmorrisdotca/korokoro";
 * const value: DiceWarGame = startDiceWar({ players: ["One", "Two"], computers: [true, true], seed: "docs" })!;
 * console.log(value.phase);
 * ```
 */
export type DiceWarGame = {
  players: string[];
  computers: boolean[];
  dice: number;
  sides: number;
  goal: DiceWarGoal;
  to: number;
  seed: string;
  /** Every move so far, in order. */
  moves: DiceWarMove[];
  phase: "playing" | "over";
  /** Each seat's points. */
  scores: number[];
  /** The round being played, from 1; once over, the round it ended in. */
  round: number;
  /** How many wars the round has been through. */
  wars: number;
  /** The points at stake in this round now: 1, and one more for each war. */
  stake: number;
  /** The seats that roll next: everybody, or in a war those who tied. */
  rollers: number[];
  /** Every throw so far, oldest first. */
  throws: DiceWarThrow[];
  /** Why the game ended: a player reached the score (`"points"`), or the rounds ran out (`"rounds"`). Null while it goes on. */
  ended: DiceWarGoal | null;
};
