import { playDiceWar, startDiceWar } from "./diceWar.ts";
import type { DiceWarGame, DiceWarGoal, DiceWarMove } from "./diceWarTypes.ts";

const KEPT_VERSION = 1;

/** A game of Dice War as text: its table, its seed and its moves, which is all there is to keep.
 *
 * @param game - The current Dice War state.
 * @returns A game of Dice War as text: its table, its seed and its moves, which is all there is to keep.

 *
 * @example
 * ```ts
 * import { encodeDiceWar } from "@johnmorrisdotca/korokoro";
 * import { startDiceWar } from "@johnmorrisdotca/korokoro";
 * const game = startDiceWar({ players: ["One", "Two"], computers: [true, true], goal: "rounds", to: 1, seed: "table" })!;
 * console.log(encodeDiceWar(game));
 * ```
 */
export function encodeDiceWar(game: DiceWarGame): string {
  return JSON.stringify({
    v: KEPT_VERSION,
    g: "diceWar",
    players: game.players,
    computers: game.computers,
    dice: game.dice,
    sides: game.sides,
    goal: game.goal,
    to: game.to,
    seed: game.seed,
    moves: game.moves,
  });
}

/**
 * Text read back into the game it records, every move played again through the rules, so that what comes back is exactly
 * the game those moves make. Null for anything that is not a game of Dice War, or whose moves the rules refuse.
 *
 * @param text - Text to parse, validate or format.
 * @returns Text read back into the game it records, every move played again through the rules, so that what comes back is exactly the game those moves make. null for anything that is not a game of Dice War, or whose moves the rules refuse.

 *
 * @example
 * ```ts
 * import { decodeDiceWar } from "@johnmorrisdotca/korokoro";
 * import { encodeDiceWar, startDiceWar } from "@johnmorrisdotca/korokoro";
 * const game = startDiceWar({ players: ["One", "Two"], computers: [true, true], goal: "rounds", to: 1, seed: "table" })!;
 * console.log(decodeDiceWar(encodeDiceWar(game))?.players.length);
 * ```
 */
export function decodeDiceWar(text: string | null): DiceWarGame | null {
  if (text === null) return null;
  let kept: unknown;
  try {
    kept = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof kept !== "object" || kept === null || Array.isArray(kept)) return null;
  const { v, g, players, computers, dice, sides, goal, to, seed, moves } = kept as Record<string, unknown>;
  if (
    v !== KEPT_VERSION ||
    g !== "diceWar" ||
    !Array.isArray(players) ||
    !Array.isArray(computers) ||
    !Array.isArray(moves)
  )
    return null;
  if (computers.length !== players.length || !computers.every((seat) => typeof seat === "boolean")) return null;
  let game = startDiceWar({
    players: players as string[],
    computers: computers as boolean[],
    dice: dice as number,
    sides: sides as number,
    goal: goal as DiceWarGoal,
    to: to as number,
    seed: seed as string,
  });
  for (const move of moves) {
    if (game === null) return null;
    game = playDiceWar(game, move as DiceWarMove);
  }
  return game;
}
