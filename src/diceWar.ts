import { MAX_SIDES, MIN_SIDES, normalizeSpec, type RollSpec, roll } from "./dice.ts";
import type { DiceWarGame, DiceWarGoal, DiceWarMove, DiceWarOptions, DiceWarRoll } from "./diceWarTypes.ts";
import { DICE_WAR_LIMITS } from "./diceWarTypes.ts";
import { distributionOf } from "./odds.ts";
import { newSeed, seededSource } from "./random.ts";

export { decodeDiceWar, encodeDiceWar } from "./diceWarSave.ts";
export type {
  DiceWarGame,
  DiceWarGoal,
  DiceWarMove,
  DiceWarOptions,
  DiceWarRoll,
  DiceWarThrow,
} from "./diceWarTypes.ts";
export { DICE_WAR_LIMITS } from "./diceWarTypes.ts";

/** The dice a game rolls, as a spec the rest of the package reads.
 *
 * @param game - The current Dice War state.
 * @returns The dice a game rolls, as a spec the rest of the package reads.

 *
 * @example
 * ```ts
 * import { diceWarSpec } from "@johnmorrisdotca/korokoro";
 * import { formatNotation, startDiceWar } from "@johnmorrisdotca/korokoro";
 * const game = startDiceWar({ players: ["One", "Two"], computers: [true, true], goal: "rounds", to: 1, seed: "table" })!;
 * console.log(formatNotation(diceWarSpec(game)));
 * ```
 */
export function diceWarSpec(game: Pick<DiceWarGame, "dice" | "sides">): RollSpec {
  return normalizeSpec({ count: game.dice, sides: game.sides });
}

function whole(value: unknown, least: number, most: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= least && value <= most;
}

/** A new game, or null for a table it is not played at: fewer than two or more than eight players, dice or sides out of range, a goal out of range.
 *
 * @param options - Options for this call; omitted fields keep their documented defaults.
 * @returns A new game, or null for a table it is not played at: fewer than two or more than eight players, dice or sides out of range, a goal out of range.

 *
 * @example
 * ```ts
 * import { startDiceWar } from "@johnmorrisdotca/korokoro";
 * console.log(startDiceWar({ players: ["One", "Two"], seed: "table" })?.phase);
 * ```
 */
export function startDiceWar(options: DiceWarOptions): DiceWarGame | null {
  const { players, computers, dice = 1, sides = 6, goal = "points", to = 5, seed = newSeed() } = options;
  if (
    !Array.isArray(players) ||
    players.length < DICE_WAR_LIMITS.fewestPlayers ||
    players.length > DICE_WAR_LIMITS.mostPlayers
  )
    return null;
  if (!players.every((name) => typeof name === "string")) return null;
  if (!whole(dice, 1, DICE_WAR_LIMITS.mostDice) || !whole(sides, MIN_SIDES, MAX_SIDES)) return null;
  if (goal !== "points" && goal !== "rounds") return null;
  if (!whole(to, 1, goal === "points" ? DICE_WAR_LIMITS.mostPoints : DICE_WAR_LIMITS.mostRounds)) return null;
  if (typeof seed !== "string" || seed === "") return null;
  return {
    players: [...players],
    computers: players.map((_, seat) => computers?.[seat] === true),
    dice,
    sides,
    goal,
    to,
    seed,
    moves: [],
    phase: "playing",
    scores: players.map(() => 0),
    round: 1,
    wars: 0,
    stake: 1,
    rollers: players.map((_, seat) => seat),
    throws: [],
    ended: null,
  };
}

/** The seats whose dice a move must hand in now: the people among those who roll. A table of computers needs none.
 *
 * @param game - The current Dice War state.
 * @returns The seats whose dice a move must hand in now: the people among those who roll. A table of computers needs none.

 *
 * @example
 * ```ts
 * import { diceWarPeopleToRoll } from "@johnmorrisdotca/korokoro";
 * import { startDiceWar } from "@johnmorrisdotca/korokoro";
 * console.log(diceWarPeopleToRoll(startDiceWar({ players: ["One", "Two"], seed: "table" })!));
 * ```
 */
export function diceWarPeopleToRoll(game: DiceWarGame): number[] {
  return game.phase === "over" ? [] : game.rollers.filter((seat) => !game.computers[seat]);
}

/** A computer's dice for a throw: from the game's seed, the round, the war and the seat, so the same game always rolls the same.
 *
 * @param game - The current Dice War state.
 * @param round - The round number used by the deterministic computer roll.
 * @param war - The tied-throw number within that round.
 * @param seat - The player seat whose computer faces are requested.
 * @returns A computer's dice for a throw: from the game's seed, the round, the war and the seat, so the same game always rolls the same.

 *
 * @example
 * ```ts
 * import { diceWarComputerFaces } from "@johnmorrisdotca/korokoro";
 * import { startDiceWar } from "@johnmorrisdotca/korokoro";
 * const game = startDiceWar({ players: ["One", "Two"], computers: [true, true], goal: "rounds", to: 1, seed: "table" })!;
 * console.log(diceWarComputerFaces(game, 1, 0, 0));
 * ```
 */
export function diceWarComputerFaces(
  game: Pick<DiceWarGame, "seed" | "dice" | "sides">,
  round: number,
  war: number,
  seat: number,
): number[] {
  return roll({ count: game.dice, sides: game.sides }, seededSource(`${game.seed}/${round}/${war}/${seat}`), 0).faces;
}

/** The game after this move, or null for one the rules refuse: the game is over, a person's dice are missing or are not dice of this game, or dice are handed in for a seat that does not roll them.
 *
 * @param game - The current Dice War state.
 * @param move - Human faces for the seats that currently roll.
 * @returns The game after this move, or null for one the rules refuse: the game is over, a person's dice are missing or are not dice of this game, or dice are handed in for a seat that does not roll them.

 *
 * @example
 * ```ts
 * import { playDiceWar } from "@johnmorrisdotca/korokoro";
 * import { startDiceWar } from "@johnmorrisdotca/korokoro";
 * const game = startDiceWar({ players: ["One", "Two"], computers: [true, true], goal: "rounds", to: 1, seed: "table" })!;
 * console.log(playDiceWar(game, {})?.round);
 * ```
 */
export function playDiceWar(game: DiceWarGame, move: DiceWarMove): DiceWarGame | null {
  if (game.phase === "over" || typeof move !== "object" || move === null) return null;
  const given = move.faces ?? {};
  if (typeof given !== "object" || given === null || Array.isArray(given)) return null;
  const people = diceWarPeopleToRoll(game);
  // Dice for anybody but the people about to roll are refused, so that a saved game is exactly what was played.
  for (const key of Object.keys(given)) if (!people.includes(Number(key)) || String(Number(key)) !== key) return null;
  const rolls: DiceWarRoll[] = [];
  for (const seat of game.rollers) {
    let faces: number[];
    if (game.computers[seat]) faces = diceWarComputerFaces(game, game.round, game.wars, seat);
    else {
      const handed = given[String(seat)];
      if (!Array.isArray(handed) || handed.length !== game.dice || !handed.every((face) => whole(face, 1, game.sides)))
        return null;
      faces = [...handed];
    }
    rolls.push({ seat, faces, total: faces.reduce((sum, face) => sum + face, 0) });
  }
  const best = Math.max(...rolls.map((one) => one.total));
  const tied = rolls.filter((one) => one.total === best).map((one) => one.seat);
  const scores = [...game.scores];
  let { round, wars, stake } = game;
  let rollers = game.rollers;
  let winner: number | null = null;
  const thrown = { round, war: wars, rolls, tied, stake };
  let roundDone = false;
  if (tied.length === 1) {
    winner = tied[0] as number;
    scores[winner] = (scores[winner] as number) + stake;
    roundDone = true;
  } else if (wars + 1 > DICE_WAR_LIMITS.mostWars) {
    // A war that will not end is called off, with nobody scoring.
    roundDone = true;
  } else {
    wars += 1;
    stake += 1;
    rollers = tied;
  }
  let ended: DiceWarGoal | null = null;
  if (roundDone) {
    if (game.goal === "points" && scores.some((score) => score >= game.to)) ended = "points";
    else if (game.goal === "rounds" && round >= game.to) ended = "rounds";
    if (ended === null) {
      round += 1;
      wars = 0;
      stake = 1;
      rollers = game.players.map((_, seat) => seat);
    }
  }
  const kept: DiceWarMove =
    Object.keys(given).length === 0
      ? {}
      : { faces: Object.fromEntries(Object.entries(given).map(([seat, faces]) => [seat, [...faces]])) };
  return {
    ...game,
    moves: [...game.moves, kept],
    phase: ended === null ? "playing" : "over",
    scores,
    round,
    wars,
    stake,
    rollers,
    throws: [...game.throws, { ...thrown, winner }],
    ended,
  };
}

/** Whether a game is over.
 *
 * @param game - The current Dice War state.
 * @returns Whether a game is over.

 *
 * @example
 * ```ts
 * import { diceWarOver } from "@johnmorrisdotca/korokoro";
 * import { startDiceWar } from "@johnmorrisdotca/korokoro";
 * const game = startDiceWar({ players: ["One", "Two"], computers: [true, true], goal: "rounds", to: 1, seed: "table" })!;
 * console.log(diceWarOver(game));
 * ```
 */
export function diceWarOver(game: DiceWarGame): boolean {
  return game.phase === "over";
}

/** The seats that won a game that is over: the player who reached the score, or the most points when the rounds ran out, shared where level. Nobody while it goes on.
 *
 * @param game - The current Dice War state.
 * @returns The seats that won a game that is over: the player who reached the score, or the most points when the rounds ran out, shared where level. Nobody while it goes on.

 *
 * @example
 * ```ts
 * import { diceWarWinners } from "@johnmorrisdotca/korokoro";
 * import { diceWarOver, playDiceWar, startDiceWar } from "@johnmorrisdotca/korokoro";
 * const game = startDiceWar({ players: ["One", "Two"], computers: [true, true], goal: "rounds", to: 1, seed: "table" })!;
 * let current = game;
 * while (!diceWarOver(current)) current = playDiceWar(current, {})!;
 * console.log(diceWarWinners(current));
 * ```
 */
export function diceWarWinners(game: DiceWarGame): number[] {
  if (game.phase !== "over") return [];
  const top = Math.max(...game.scores);
  return game.scores.flatMap((score, seat) => (score === top ? [seat] : []));
}

/** What a total is worth against the other players' totals in one throw.
 *
 * @example
 * ```ts
 * import type { DiceWarChances } from "@johnmorrisdotca/korokoro";
 * import { diceWarOdds } from "@johnmorrisdotca/korokoro";
 * const value: DiceWarChances = diceWarOdds({ players: 2, dice: 1, sides: 6 });
 * console.log(value.war);
 * ```
 */
export type DiceWarChances = {
  /** The chance that one player, any one, holds the highest total alone: the throw is settled at once. */
  outright: number;
  /** The chance that two or more tie for highest, and it is war. */
  war: number;
  /** The chance that a particular player takes the throw outright. */
  eachOutright: number;
  /** Given a total, the chance that it is higher than every other player's. Null where no total was given. */
  beats: number | null;
  /** Given a total, the chance that the best of the others ties it, and it is war. Null where no total was given. */
  ties: number | null;
  /** Given a total, the chance that somebody else has more. Null where no total was given. */
  loses: number | null;
};

/**
 * The exact odds of one throw of Dice War among `players` players, from the package's own odds for the dice: the chance the
 * throw is settled at once and the chance of war, and, for a total you name, how it fares against everybody else's.
 * Worked out from the totals' exact odds, never simulated.
 *
 * @param options - Options for this call; omitted fields keep their documented defaults.
 * @param total - The total to measure or compare.
 * @returns The exact odds of one throw of Dice War among `players` players, from the package's own odds for the dice: the chance the throw is settled at once and the chance of war, and, for a total you name, how it fares against everybody else's. Worked out from the totals' exact odds, never simulated.

 *
 * @example
 * ```ts
 * import { diceWarOdds } from "@johnmorrisdotca/korokoro";
 * console.log(diceWarOdds({ players: 2, dice: 1, sides: 6 }).war);
 * ```
 */
export function diceWarOdds(
  options: { players: number; dice?: number; sides?: number },
  total?: number,
): DiceWarChances {
  const { players, dice = 1, sides = 6 } = options;
  if (
    !whole(players, DICE_WAR_LIMITS.fewestPlayers, DICE_WAR_LIMITS.mostPlayers) ||
    !whole(dice, 1, DICE_WAR_LIMITS.mostDice) ||
    !whole(sides, MIN_SIDES, MAX_SIDES)
  ) {
    throw new RangeError(
      "korokoro: a Dice War table is two to eight players, one to ten dice of two to a thousand sides",
    );
  }
  const spec = normalizeSpec({ count: dice, sides });
  const { min, probabilities } = distributionOf(spec);
  // below[i]: the chance a player's total is under min + i.
  const below: number[] = [];
  let sum = 0;
  for (const chance of probabilities) {
    below.push(sum);
    sum += chance;
  }
  const others = players - 1;
  let outright = 0;
  probabilities.forEach((chance, i) => {
    outright += players * chance * (below[i] as number) ** others;
  });
  const index = total === undefined ? -1 : total - min;
  const known = total !== undefined && index >= 0 && index < probabilities.length;
  const atMost = known ? (below[index] as number) + (probabilities[index] as number) : 0;
  const beats = total === undefined ? null : known ? (below[index] as number) ** others : total > min ? 1 : 0;
  const ties = total === undefined ? null : known ? atMost ** others - (below[index] as number) ** others : 0;
  return {
    outright,
    war: 1 - outright,
    eachOutright: outright / players,
    beats,
    ties,
    loses: beats === null || ties === null ? null : Math.max(0, 1 - beats - ties),
  };
}
