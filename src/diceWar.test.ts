import { describe, expect, it } from "vitest";

import { DICE_WAR_LIMITS, decodeDiceWar, diceWarComputerFaces, diceWarOdds, diceWarOver, diceWarPeopleToRoll, diceWarSpec, diceWarWinners, encodeDiceWar, playDiceWar, startDiceWar, type DiceWarGame, type DiceWarOptions } from "./diceWar.ts";
import { chanceAtLeast, distributionOf } from "./odds.ts";

const table = (extra: Partial<DiceWarOptions> = {}): DiceWarGame => startDiceWar({ players: ["You", "Aiko", "Ben"], computers: [false, true, true], seed: "war-1", ...extra }) as DiceWarGame;
/** A game of computers alone, played to its end, every move `{}`. */
function playOut(options: Partial<DiceWarOptions> = {}) {
  let game = startDiceWar({ players: ["A", "B", "C"], computers: [true, true, true], seed: "out", ...options }) as DiceWarGame;
  for (let at = 0; !diceWarOver(game); at += 1) {
    if (at > 5000) throw new Error("a game that does not end");
    game = playDiceWar(game, {}) as DiceWarGame;
    expect(game).not.toBeNull();
  }
  return game;
}

describe("a table of Dice War", () => {
  it("starts with everybody to roll, nothing scored and a stake of one", () => {
    const game = table();
    expect(game).toMatchObject({ dice: 1, sides: 6, goal: "points", to: 5, round: 1, wars: 0, stake: 1, phase: "playing", scores: [0, 0, 0], rollers: [0, 1, 2], computers: [false, true, true] });
    expect(diceWarPeopleToRoll(game)).toEqual([0]);
    expect(diceWarSpec(game)).toMatchObject({ count: 1, sides: 6 });
  });

  it("is offered for two to eight players and dice, sides and a goal in range, and for nothing else", () => {
    expect(startDiceWar({ players: ["a"] })).toBeNull();
    expect(startDiceWar({ players: Array.from({ length: 9 }, () => "x") })).toBeNull();
    expect(startDiceWar({ players: ["a", "b"], dice: 0 })).toBeNull();
    expect(startDiceWar({ players: ["a", "b"], dice: 11 })).toBeNull();
    expect(startDiceWar({ players: ["a", "b"], sides: 1 })).toBeNull();
    expect(startDiceWar({ players: ["a", "b"], sides: 1001 })).toBeNull();
    expect(startDiceWar({ players: ["a", "b"], to: 0 })).toBeNull();
    expect(startDiceWar({ players: ["a", "b"], to: 101 })).toBeNull();
    expect(startDiceWar({ players: ["a", "b"], goal: "rounds", to: 201 })).toBeNull();
    expect(startDiceWar({ players: ["a", "b"], goal: "rounds", to: 200 })).not.toBeNull();
    expect(startDiceWar({ players: ["a", "b"], goal: "nonsense" as never })).toBeNull();
    expect(startDiceWar({ players: ["a", "b"], seed: "" })).toBeNull();
    expect(startDiceWar({ players: ["a", "b"], dice: 3, sides: 20 })).not.toBeNull();
    expect(DICE_WAR_LIMITS.fewestPlayers).toBe(2);
    // No seed asked for: one is drawn.
    expect(startDiceWar({ players: ["a", "b"] })?.seed).toMatch(/^[a-z2-9]{8}$/);
  });
});

describe("a throw", () => {
  it("scores the highest total a point, with a person's dice handed in and the computers' from the seed", () => {
    const game = table();
    const theirs = [1, 2].map((seat) => diceWarComputerFaces(game, 1, 0, seat));
    const after = playDiceWar(game, { faces: { "0": [6] } }) as DiceWarGame;
    const totals = [6, theirs[0]![0]!, theirs[1]![0]!];
    expect(after.throws[0]!.rolls.map((one) => one.total)).toEqual(totals);
    const best = Math.max(...totals);
    const winners = totals.flatMap((total, seat) => (total === best ? [seat] : []));
    if (winners.length === 1) expect(after.scores[winners[0]!]).toBe(1);
    else expect(after.wars).toBe(1);
    // The game it was given is left alone.
    expect(game.moves).toEqual([]);
    expect(game.scores).toEqual([0, 0, 0]);
  });

  it("refuses dice that are not the person's, are not dice of this game, or are for a seat that does not roll them", () => {
    const game = table();
    expect(playDiceWar(game, {})).toBeNull();
    expect(playDiceWar(game, { faces: { "0": [7] } })).toBeNull();
    expect(playDiceWar(game, { faces: { "0": [0] } })).toBeNull();
    expect(playDiceWar(game, { faces: { "0": [2.5] } })).toBeNull();
    expect(playDiceWar(game, { faces: { "0": [1, 2] } })).toBeNull();
    expect(playDiceWar(game, { faces: { "0": [3], "1": [4] } })).toBeNull();
    expect(playDiceWar(game, { faces: { "7": [3] } })).toBeNull();
    expect(playDiceWar(game, { faces: { "00": [3] } })).toBeNull();
    expect(playDiceWar(game, { faces: [[3]] as never })).toBeNull();
    expect(playDiceWar(game, null as never)).toBeNull();
    expect(playDiceWar({ ...game, phase: "over" }, { faces: { "0": [3] } })).toBeNull();
  });

  it("adds a player's dice together and rolls as many as the game says", () => {
    const game = startDiceWar({ players: ["You", "Ai"], computers: [false, true], dice: 3, sides: 6, seed: "three" }) as DiceWarGame;
    expect(playDiceWar(game, { faces: { "0": [1, 2] } })).toBeNull();
    const after = playDiceWar(game, { faces: { "0": [6, 6, 6] } }) as DiceWarGame;
    expect(after.throws[0]!.rolls[0]).toEqual({ seat: 0, faces: [6, 6, 6], total: 18 });
    expect(after.throws[0]!.rolls[1]!.faces).toHaveLength(3);
  });

  it("is a war when the highest tie: only the tied roll again, the stake grows, and the winner takes it all", () => {
    // Find a seed where the two computers tie for highest against a person who rolls low.
    let tie: DiceWarGame | null = null;
    for (let at = 0; at < 400 && tie === null; at += 1) {
      const game = startDiceWar({ players: ["You", "Aiko", "Ben"], computers: [false, true, true], seed: `tie-${at}` }) as DiceWarGame;
      const a = diceWarComputerFaces(game, 1, 0, 1)[0] as number;
      const b = diceWarComputerFaces(game, 1, 0, 2)[0] as number;
      if (a === b && a > 1) tie = game;
    }
    const game = tie as DiceWarGame;
    const first = playDiceWar(game, { faces: { "0": [1] } }) as DiceWarGame;
    expect(first.wars).toBe(1);
    expect(first.stake).toBe(2);
    expect(first.rollers).toEqual([1, 2]);
    expect(first.scores).toEqual([0, 0, 0]);
    expect(first.throws[0]).toMatchObject({ war: 0, tied: [1, 2], winner: null });
    // The person is not in the war, so nobody's dice are handed in, and the next throw is the computers' alone.
    expect(diceWarPeopleToRoll(first)).toEqual([]);
    expect(playDiceWar(first, { faces: { "0": [6] } })).toBeNull();
    const second = playDiceWar(first, {}) as DiceWarGame;
    expect(second.throws[1]!.rolls.map((one) => one.seat)).toEqual([1, 2]);
    if (second.throws[1]!.winner !== null) {
      expect(second.scores[second.throws[1]!.winner]).toBe(2);
      expect(second.round).toBe(2);
      expect(second.stake).toBe(1);
      expect(second.rollers).toEqual([0, 1, 2]);
    } else expect(second.stake).toBe(3);
  });

  it("goes round again for as many wars as the dice tie, the stake one more each time, and gives the lot to whoever wins", () => {
    // Two dice of two sides tie often: play many games and find a round that went through at least two wars.
    let deepest = 0;
    for (let at = 0; at < 60; at += 1) {
      const game = playOut({ players: ["A", "B"], computers: [true, true], sides: 2, dice: 1, seed: `deep-${at}`, to: 3 });
      for (const one of game.throws) {
        if (one.winner !== null && one.war >= 1) {
          deepest = Math.max(deepest, one.war);
          expect(one.stake, "the stake is a point for the round and one for each war").toBe(one.war + 1);
        }
      }
    }
    expect(deepest).toBeGreaterThanOrEqual(2);
  });
});

describe("a game", () => {
  it("played to a score ends when somebody reaches it, and that player wins", () => {
    for (let at = 0; at < 20; at += 1) {
      const game = playOut({ seed: `points-${at}`, to: 4 });
      expect(game.ended).toBe("points");
      expect(game.phase).toBe("over");
      const winners = diceWarWinners(game);
      expect(winners).toHaveLength(1);
      expect(game.scores[winners[0]!]).toBeGreaterThanOrEqual(4);
      expect(game.scores.filter((score) => score >= 4)).toHaveLength(1);
      expect(diceWarPeopleToRoll(game)).toEqual([]);
      expect(playDiceWar(game, {})).toBeNull();
    }
  });

  it("played for rounds ends after them, the most points winning and level piles sharing", () => {
    const shared = new Set<number>();
    for (let at = 0; at < 60; at += 1) {
      const game = playOut({ seed: `rounds-${at}`, goal: "rounds", to: 3, players: ["A", "B"], computers: [true, true] });
      expect(game.ended).toBe("rounds");
      expect(game.round).toBe(3);
      // A war that was called off, or a tie in points, leaves nobody ahead.
      expect(game.scores.reduce((sum, score) => sum + score, 0)).toBeGreaterThanOrEqual(3);
      shared.add(diceWarWinners(game).length);
    }
    expect([...shared].sort()).toEqual([1, 2]);
  });

  it("scores every round's stake to somebody: the points are all the stakes won", () => {
    const game = playOut({ seed: "stakes", goal: "rounds", to: 20, sides: 3 });
    const won = game.throws.filter((one) => one.winner !== null).reduce((sum, one) => sum + one.stake, 0);
    expect(game.scores.reduce((sum, score) => sum + score, 0)).toBe(won);
  });

  it("is seeded: the same seed and the same dice make the same game, and another seed another", () => {
    const one = playOut({ seed: "same" });
    expect(playOut({ seed: "same" })).toEqual(one);
    expect(playOut({ seed: "other" })).not.toEqual(one);
  });

  it("plays a person's dice with the computers' from the seed, and a game with nobody to hand dice in is all computers", () => {
    let game = table({ seed: "mixed", to: 3 });
    let rolled = 0;
    while (!diceWarOver(game)) {
      const people = diceWarPeopleToRoll(game);
      const faces = Object.fromEntries(people.map((seat) => [String(seat), [((rolled + seat) % 6) + 1]]));
      rolled += 1;
      game = playDiceWar(game, people.length === 0 ? {} : { faces }) as DiceWarGame;
      expect(game).not.toBeNull();
    }
    expect(game.scores.some((score) => score >= 3)).toBe(true);
    expect(game.moves.every((move) => move.faces === undefined || Object.keys(move.faces).length === 1)).toBe(true);
  });
});

describe("a game kept as text", () => {
  it("reads back as exactly the game its moves make, half way and at the end", () => {
    let game = table({ seed: "kept" });
    for (let step = 0; step < 4; step += 1) {
      const people = diceWarPeopleToRoll(game);
      game = playDiceWar(game, people.length === 0 ? {} : { faces: { "0": [(step % 6) + 1] } }) as DiceWarGame;
    }
    expect(decodeDiceWar(encodeDiceWar(game))).toEqual(game);
    const ended = playOut({ seed: "kept-end", goal: "rounds", to: 5 });
    expect(decodeDiceWar(encodeDiceWar(ended))).toEqual(ended);
  });

  it("refuses text that is not a game of Dice War, one that has been changed, and one that plays on past its end", () => {
    const game = playDiceWar(table({ seed: "refuse" }), { faces: { "0": [4] } }) as DiceWarGame;
    const kept = JSON.parse(encodeDiceWar(game)) as Record<string, unknown>;
    expect(decodeDiceWar(null)).toBeNull();
    expect(decodeDiceWar("nonsense")).toBeNull();
    expect(decodeDiceWar("{}")).toBeNull();
    expect(decodeDiceWar(JSON.stringify([]))).toBeNull();
    expect(decodeDiceWar(JSON.stringify({ ...kept, g: "hearts" }))).toBeNull();
    expect(decodeDiceWar(JSON.stringify({ ...kept, v: 2 }))).toBeNull();
    expect(decodeDiceWar(JSON.stringify({ ...kept, moves: [{ faces: { "0": [9] } }] }))).toBeNull();
    expect(decodeDiceWar(JSON.stringify({ ...kept, computers: [false] }))).toBeNull();
    expect(decodeDiceWar(JSON.stringify({ ...kept, sides: 1 }))).toBeNull();
    const ended = playOut({ seed: "past", to: 2 });
    expect(decodeDiceWar(JSON.stringify({ ...(JSON.parse(encodeDiceWar(ended)) as object), moves: [...ended.moves, {}] }))).toBeNull();
  });
});

describe("the odds of a throw", () => {
  it("are worked out from the dice's own odds: two players with one d6 tie one throw in six", () => {
    const two = diceWarOdds({ players: 2 });
    expect(two.war).toBeCloseTo(1 / 6, 12);
    expect(two.outright).toBeCloseTo(5 / 6, 12);
    expect(two.eachOutright).toBeCloseTo(5 / 12, 12);
    expect(two.beats).toBeNull();
  });

  it("say how a total fares against the others, and the three chances add up to one", () => {
    // A six against three other d6: beats all three five times in six, cubed; ties when the best of them is a six too.
    const six = diceWarOdds({ players: 4 }, 6);
    expect(six.beats).toBeCloseTo((5 / 6) ** 3, 12);
    expect(six.ties).toBeCloseTo(1 - (5 / 6) ** 3, 12);
    expect(six.loses).toBeCloseTo(0, 12);
    for (const [players, dice, sides, total] of [[3, 1, 6, 3], [2, 2, 6, 7], [5, 3, 8, 14], [8, 1, 100, 50]] as const) {
      const odds = diceWarOdds({ players, dice, sides }, total);
      expect((odds.beats ?? 0) + (odds.ties ?? 0) + (odds.loses ?? 0), `${players}p ${dice}d${sides} at ${total}`).toBeCloseTo(1, 12);
      expect(odds.outright + odds.war).toBeCloseTo(1, 12);
    }
    expect(diceWarOdds({ players: 3 }, 1).beats).toBe(0);
    expect(diceWarOdds({ players: 3 }, 7).beats).toBe(1);
    expect(diceWarOdds({ players: 3 }, 0).beats).toBe(0);
  });

  it("agree with the package's own distribution: against one rival, a total wins or ties as often as the rival's roll is no higher", () => {
    const spec = diceWarSpec({ dice: 2, sides: 6 });
    const { min, probabilities } = distributionOf(spec);
    for (let at = 0; at < probabilities.length; at += 1) {
      const total = min + at;
      const odds = diceWarOdds({ players: 2, dice: 2 }, total);
      expect((odds.beats ?? 0) + (odds.ties ?? 0)).toBeCloseTo(1 - chanceAtLeast(spec, total + 1), 12);
      expect(odds.ties).toBeCloseTo(probabilities[at] as number, 12);
    }
  });

  it("match what many games do: the share of first throws that go to war is the share the odds give", () => {
    let wars = 0;
    const games = 4000;
    for (let at = 0; at < games; at += 1) {
      const game = startDiceWar({ players: ["a", "b", "c"], computers: [true, true, true], seed: `odds-${at}` }) as DiceWarGame;
      if (playDiceWar(game, {})!.throws[0]!.tied.length > 1) wars += 1;
    }
    const expected = diceWarOdds({ players: 3 }).war;
    // Four thousand throws: within four standard deviations of the exact figure.
    expect(Math.abs(wars / games - expected)).toBeLessThan(4 * Math.sqrt((expected * (1 - expected)) / games));
  });

  it("refuse a table the game is not played at", () => {
    expect(() => diceWarOdds({ players: 1 })).toThrow(RangeError);
    expect(() => diceWarOdds({ players: 9 })).toThrow(RangeError);
    expect(() => diceWarOdds({ players: 3, dice: 11 })).toThrow(RangeError);
    expect(() => diceWarOdds({ players: 3, sides: 1 })).toThrow(RangeError);
  });
});
