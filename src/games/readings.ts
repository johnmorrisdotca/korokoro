import { diceOf, groupsOf, playsByNewRules, valueOfFace, type DiceGroup, type Roll, type RollSpec } from "../dice.ts";

/**
 * How a roll is read in a game. A reading is one of a small, fixed set of
 * named functions, so that a new game is a line of data and rarely new code.
 * Each takes the dice, kind by kind, and says what they come to in the game's
 * own terms: an outcome with a stable name, and the figures that go with it.
 * The words for each outcome, in English and Japanese, are in `words.ts`.
 *
 * Readings are small and particular on purpose. They do not run a game (turn
 * order, scores across rounds): they read one roll, with the rolls just before
 * it where a game needs them, as craps does for its point.
 */
export type Outcome = {
  /** The outcome's name within its reading: "natural", "point", "yahtzee". */
  outcome: string;
  /** The figures the outcome's words are filled in with. */
  values: Record<string, string | number>;
  /** Whether it is good news, bad news or neither, for a tray to colour. */
  tone: "good" | "bad" | "plain";
};

/** What a reading is given: this roll's dice as each would be worth, kind by kind, and the same for the rolls before it in the same game. */
export type Dice = {
  /** Each kind's faces, as numbers: a custom face's place on its die. */
  groups: number[][];
  /** The bonus on the roll. */
  modifier: number;
  /** The kept dice added up with the bonus. */
  total: number;
};

/** The dice of a roll, kind by kind, for a reading. Rerolled dice are left out; dropped dice are kept in, since a reading may want them. */
export function diceFor(roll: Roll): Dice {
  const groups: number[][] = groupsOf(roll.spec).map(() => []);
  for (const die of diceOf(roll)) if (die.status !== "rerolled") (groups[die.group ?? 0] as number[]).push(die.face);
  return { groups, modifier: roll.spec.modifier, total: roll.total };
}

type Read = (dice: Dice, before: Dice[], options: Record<string, number>) => Outcome;

const plain = (outcome: string, values: Outcome["values"] = {}): Outcome => ({ outcome, values, tone: "plain" });
const good = (outcome: string, values: Outcome["values"] = {}): Outcome => ({ outcome, values, tone: "good" });
const bad = (outcome: string, values: Outcome["values"] = {}): Outcome => ({ outcome, values, tone: "bad" });

const all = (dice: Dice) => dice.groups.flat();
const sum = (faces: number[]) => faces.reduce((a, b) => a + b, 0);
const desc = (faces: number[]) => [...faces].sort((a, b) => b - a);

/** How many dice show each face, from the face most shown: [[6, 3], [2, 1]] is three sixes and a two. */
function tally(faces: number[]): [number, number][] {
  const counts = new Map<number, number>();
  for (const face of faces) counts.set(face, (counts.get(face) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
}

/** The longest run of consecutive faces among the dice. */
function longestRun(faces: number[]): number {
  const seen = [...new Set(faces)].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  seen.forEach((face, i) => {
    run = i > 0 && face === (seen[i - 1] as number) + 1 ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}

/** Every way to make a total from different numbers 1 to 9, largest first: the tiles a Shut the Box roll may shut. */
export function waysToShut(total: number): number[][] {
  const ways: number[][] = [];
  const walk = (left: number, top: number, picked: number[]) => {
    if (left === 0) ways.push(picked);
    for (let tile = Math.min(top, left); tile >= 1; tile--) walk(left - tile, tile - 1, [...picked, tile]);
  };
  walk(total, 9, []);
  return ways.filter((w) => w.length > 0);
}

export const READERS = {
  /** The total, and nothing more. */
  sum: (dice) => plain("total", { total: dice.total }),

  /** One die's face as its words: a coin, a direction, a colour. The words come from the die. */
  faces: () => plain("faces"),

  /** Two dice added, with doubles marked, and the third doubles in a row. */
  doubles: (dice, before, options) => {
    const [a, b] = all(dice);
    if (a !== b) return plain("total", { total: dice.total });
    let inARow = 1;
    for (let i = before.length - 1; i >= 0 && all(before[i] as Dice)[0] === all(before[i] as Dice)[1]; i--) inARow += 1;
    // Where a game ends the turn on a third doubles, as Monopoly does.
    return inARow >= 3 && options.third === 1 ? bad("third", { total: dice.total, face: a as number }) : good("doubles", { total: dice.total, face: a as number });
  },

  /** Two dice for the table: a seven moves the robber. */
  robber: (dice) => (dice.total === 7 ? bad("seven") : plain("total", { total: dice.total })),

  /** Two dice, and doubles are played four times over. */
  backgammon: (dice) => {
    const [a, b] = all(dice);
    return a === b ? good("doubles", { face: a as number, total: 4 * (a as number) }) : plain("moves", { a: Math.max(a as number, b as number), b: Math.min(a as number, b as number) });
  },

  /** One die, and a six rolls again; the third six in a row does not move. */
  sixAgain: (dice, before, options) => {
    const face = all(dice)[0] as number;
    if (face !== 6) return plain("move", { face });
    let sixes = 1;
    for (let i = before.length - 1; i >= 0 && all(before[i] as Dice)[0] === 6; i--) sixes += 1;
    // Where a game takes the move away on a third six, as Ludo does.
    return sixes >= 3 && options.third === 1 ? bad("third") : good("again");
  },

  /** Six cowries: how many land mouth up is the move, and none, one or six earn a grace. */
  cowries: (dice) => {
    // Each cowrie is worth 1 mouth up and 0 mouth down, so the total is how many are up.
    const up = dice.total;
    const move = up === 0 ? 25 : up === 1 ? 10 : up;
    return up === 0 || up === 1 || up === 6 ? good("grace", { up, move }) : plain("move", { up, move });
  },

  /** Craps: the come-out, then the point or a seven. */
  craps: (dice, before) => {
    // The point, if the rolls so far have set one and not yet settled it.
    let point: number | null = null;
    for (const earlier of before) {
      const t = earlier.total;
      if (point === null) point = t === 7 || t === 11 || t === 2 || t === 3 || t === 12 ? null : t;
      else if (t === point || t === 7) point = null;
    }
    const total = dice.total;
    if (point === null) {
      if (total === 7 || total === 11) return good("natural", { total });
      if (total === 2 || total === 3 || total === 12) return bad("craps", { total });
      return plain("point", { total });
    }
    if (total === point) return good("made", { total });
    if (total === 7) return bad("sevenOut", { point });
    return plain("again", { total, point });
  },

  /** Hazard with a main of seven: nick, out, or a chance; then the chance or the main. */
  hazard: (dice, before, options) => {
    const main = options.main ?? 7;
    let chance: number | null = null;
    for (const earlier of before) {
      const t = earlier.total;
      if (chance === null) chance = hazardFirst(main, t) === "chance" ? t : null;
      else if (t === chance || t === main) chance = null;
    }
    const total = dice.total;
    if (chance === null) {
      const first = hazardFirst(main, total);
      return first === "nick" ? good("nick", { total, main }) : first === "out" ? bad("out", { total, main }) : plain("chance", { total, main });
    }
    if (total === chance) return good("made", { total });
    if (total === main) return bad("lost", { total, chance });
    return plain("again", { total, chance, main });
  },

  /** Five dice: the best Yahtzee category they make. */
  yahtzee: (dice) => {
    const faces = all(dice);
    const [[, most], second] = tally(faces) as [[number, number], [number, number] | undefined];
    const total = sum(faces);
    if (most === 5) return good("yahtzee", { face: faces[0] as number });
    if (longestRun(faces) === 5) return good("large");
    if (most === 4) return good("four", { total });
    if (most === 3 && second?.[1] === 2) return good("fullHouse");
    if (longestRun(faces) === 4) return good("small");
    if (most === 3) return plain("three", { total });
    return plain("chance", { total });
  },

  /** Five poker dice: the hand. The faces run 9, 10, J, Q, K, A, in that order on the die. */
  pokerDice: (dice) => {
    const faces = all(dice);
    const counts = tally(faces).map(([, n]) => n);
    if (counts[0] === 5) return good("five");
    if (counts[0] === 4) return good("four");
    if (counts[0] === 3 && counts[1] === 2) return good("fullHouse");
    if (longestRun(faces) === 5) return good("straight");
    if (counts[0] === 3) return plain("three");
    if (counts[0] === 2 && counts[1] === 2) return plain("twoPair");
    if (counts[0] === 2) return plain("pair");
    return bad("bust");
  },

  /** Six dice: what the standard scoring gives for the throw, or a farkle. */
  farkle: (dice) => {
    let score = 0;
    for (const [face, n] of tally(all(dice))) {
      if (n >= 3) score += face === 1 ? 1000 : face * 100;
      const loose = n >= 3 ? n - 3 : n;
      if (face === 1) score += loose * 100;
      if (face === 5) score += loose * 50;
    }
    return score === 0 ? bad("farkle") : plain("scores", { score });
  },

  /** Three dice: three alike is a Bunco in the round of that number, and a mini Bunco in any other. */
  bunco: (dice) => {
    const [[face, most]] = tally(all(dice)) as [[number, number]];
    return most === 3 ? good("three", { face }) : plain("count", { dice: desc(all(dice)).join(", ") });
  },

  /** One die: a one ends the turn with nothing; anything else adds to the turn. */
  pig: (dice, before) => {
    const face = all(dice)[0] as number;
    if (face === 1) return bad("out");
    let turn = face;
    for (let i = before.length - 1; i >= 0 && all(before[i] as Dice)[0] !== 1; i--) turn += all(before[i] as Dice)[0] as number;
    return plain("turn", { face, turn });
  },

  /** The dice in hand, counted: "two 3s, a 5". */
  counts: (dice) => plain("counts", { dice: tally(all(dice)).map(([face, n]) => `${n}×${face}`).join(", ") }),

  /** Five dice: a 6, a 5 and a 4 make the ship, her captain and her crew, and the other two are the cargo. */
  shipCaptainCrew: (dice) => {
    const faces = all(dice);
    if (!faces.includes(6)) return plain("none");
    if (!faces.includes(5)) return plain("ship");
    if (!faces.includes(4)) return plain("captain");
    return good("crew", { cargo: sum(faces) - 15 });
  },

  /** Two dice (or one): the total, and every set of tiles from 1 to 9 it may shut. */
  shutTheBox: (dice) => plain("shut", { total: dice.total, ways: waysToShut(dice.total).map((w) => w.join("+")).join(", ") }),

  /** Two dice read as one number, the higher die first: 21 is Mexico, then doubles, then the rest. */
  mexico: (dice) => {
    const [high, low] = desc(all(dice)) as [number, number];
    if (high === 2 && low === 1) return good("mexico");
    if (high === low) return good("doubles", { face: high });
    return plain("number", { number: high * 10 + low });
  },

  /** Three dice: big, small, or a triple, which is neither. */
  sicBo: (dice) => {
    const faces = all(dice);
    if (faces[0] === faces[1] && faces[1] === faces[2]) return plain("triple", { face: faces[0] as number });
    return plain(dice.total >= 11 ? "big" : "small", { total: dice.total });
  },

  /** Two dice: even is chō, odd is han. */
  choHan: (dice) => plain(dice.total % 2 === 0 ? "cho" : "han", { total: dice.total, dice: all(dice).join("・") }),

  /** Three dice in a bowl: pinzoro, arashi, shigoro, a pair and its point, hifumi, or no hand. */
  chinchirorin: (dice) => {
    const faces = [...all(dice)].sort((a, b) => a - b);
    const key = faces.join("");
    if (key === "111") return good("pinzoro");
    if (faces[0] === faces[2]) return good("arashi", { face: faces[0] as number });
    if (key === "456") return good("shigoro");
    if (key === "123") return bad("hifumi");
    if (faces[0] === faces[1]) return plain("point", { point: faces[2] as number, pair: faces[0] as number });
    if (faces[1] === faces[2]) return plain("point", { point: faces[0] as number, pair: faces[1] as number });
    return plain("menashi");
  },

  /** Attack dice against defence dice: highest against highest, next against next, and a tie goes to the defence. */
  risk: (dice) => {
    const attack = desc(dice.groups[0] ?? []);
    const defence = desc(dice.groups[1] ?? []);
    let attacker = 0;
    let defender = 0;
    for (let i = 0; i < Math.min(attack.length, defence.length); i++) {
      if ((attack[i] as number) > (defence[i] as number)) defender += 1;
      else attacker += 1;
    }
    return { outcome: `${attacker}-${defender}`, values: { attacker, defender }, tone: attacker === 0 ? "good" : defender === 0 ? "bad" : "plain" };
  },

  /** One die each: the highest goes first, and a tie at the top is rolled again by those who tied. */
  highest: (dice) => {
    const faces = all(dice);
    const top = Math.max(...faces);
    const leaders = faces.flatMap((face, i) => (face === top ? [i + 1] : []));
    return leaders.length === 1 ? good("first", { player: leaders[0] as number, face: top }) : plain("tie", { players: leaders.join(", "), face: top });
  },

  /** A d20, alone or the one kept of two: a natural 20, a natural 1, or the total. */
  d20: (dice) => {
    const group = dice.groups[0] ?? [];
    // The kept die is what the total rests on: take it from the total, less the bonus.
    const face = dice.total - dice.modifier;
    if (group.length > 0 && face === 20) return good("natural20", { total: dice.total });
    if (group.length > 0 && face === 1) return bad("natural1", { total: dice.total });
    return plain("total", { total: dice.total });
  },

  /** Four Fate dice and a bonus, read off the ladder. */
  fate: (dice) => {
    const total = dice.total;
    return { outcome: total > 8 ? "above" : total < -2 ? "below" : `rung${total}`, values: { total: total > 0 ? `+${total}` : String(total) }, tone: "plain" };
  },

  /** A pool of d6 read by its highest die: 1 to 3, 4 or 5, a 6, or a critical on two sixes. */
  bladesPool: (dice) => {
    const faces = desc(all(dice));
    if (faces.filter((f) => f === 6).length >= 2) return good("critical");
    const top = faces[0] as number;
    return top === 6 ? good("six") : top >= 4 ? plain("partial", { top }) : bad("bad", { top });
  },

  /** Two d6 and a stat: 10 or more, 7 to 9, or 6 or less. */
  pbta: (dice) => (dice.total >= 10 ? good("strong", { total: dice.total }) : dice.total >= 7 ? plain("weak", { total: dice.total }) : bad("miss", { total: dice.total })),

  /** A pool counted for dice at or above a number: successes. */
  successes: (dice, _before, options) => {
    const hits = all(dice).filter((face) => face >= (options.target ?? 8)).length;
    return hits === 0 ? bad("none") : hits === 1 ? good("one", { hits }) : good("hits", { hits });
  },

  /** A pool of d6 counted for fives and sixes, with a glitch when more than half the dice show a one. */
  hitsAndGlitch: (dice) => {
    const faces = all(dice);
    const hits = faces.filter((face) => face >= 5).length;
    const glitch = faces.filter((face) => face === 1).length * 2 > faces.length;
    return glitch ? bad("glitch", { hits }) : hits === 0 ? plain("none") : hits === 1 ? good("one", { hits }) : good("hits", { hits });
  },

  /** A percentile roll: what skill it succeeds against, and against which it is a hard or an extreme success. */
  percentile: (dice) => plain("under", { total: dice.total, hard: dice.total * 2, extreme: dice.total * 5 }),

  /** Three d6 to roll at or under a skill: 3 and 4 always a critical success, 18 always a critical failure, 17 a failure. */
  rollUnder: (dice) => {
    const total = dice.total;
    if (total <= 4) return good("critical", { total });
    if (total === 18) return bad("fumble", { total });
    if (total === 17) return bad("fail", { total });
    return plain("under", { total });
  },

  /** Two d6 read as tens and units: a number from 11 to 66. */
  d66: (dice) => {
    const [tens, units] = all(dice) as [number, number];
    return plain("number", { number: tens * 10 + units });
  },

  /** A set of rolls thrown together: each total, highest first. */
  scores: (dice) => plain("total", { total: dice.total }),
} satisfies Record<string, Read>;

/** What the first throw at a main is in Hazard. */
function hazardFirst(main: number, total: number): "nick" | "out" | "chance" {
  if (total === main) return "nick";
  if (total === 2 || total === 3) return "out";
  if (total === 11) return main === 7 ? "nick" : "out";
  if (total === 12) return main === 6 || main === 8 ? "nick" : "out";
  return "chance";
}

/** The name of a reading. */
export type ReadingId = keyof typeof READERS;

/** Read a roll the way a reading does, with the rolls before it in the same game where that matters. */
export function readDiceAs(reading: ReadingId, roll: Roll, before: readonly Roll[] = [], options: Record<string, number> = {}): Outcome {
  return (READERS[reading] as Read)(diceFor(roll), before.map(diceFor), options);
}

/**
 * Every way the dice of a spec can fall, kind by kind, each with how many of
 * the equally likely throws fall that way. The dice of a kind are given
 * sorted, highest first, so a reading that does not care about their order
 * (none here does, within a kind) can be counted over thousands of patterns
 * where there are millions of throws. Null when the dice are not plain: a
 * reroll or an explosion has no fixed number of throws to count.
 */
export function patternsOf(spec: RollSpec): { dice: Dice; ways: bigint }[] | null {
  const groups = groupsOf(spec);
  if (groups.some((g) => g.explode === true || g.reroll !== undefined || g.rerollUntil !== undefined || g.weights !== undefined || g.keep !== "all" || playsByNewRules(g))) return null;
  const factorial = (n: number): bigint => (n <= 1 ? 1n : BigInt(n) * factorial(n - 1));
  // One kind: every multiset of its faces, with the number of orders it has.
  const kind = (group: DiceGroup): { faces: number[]; ways: bigint }[] => {
    const low = group.faces !== undefined ? 1 : group.sides === "F" ? -1 : 1;
    const high = group.faces !== undefined ? group.faces.length : group.sides === "F" ? 1 : (group.sides as number);
    const out: { faces: number[]; ways: bigint }[] = [];
    const walk = (face: number, left: number, picked: number[], orders: bigint) => {
      if (left === 0) return void out.push({ faces: picked, ways: orders });
      if (face < low) return;
      for (let n = left; n >= 0; n--) walk(face - 1, left - n, [...picked, ...new Array<number>(n).fill(face)], orders / factorial(n));
    };
    walk(high, group.count, [], factorial(group.count));
    return out;
  };
  let patterns: { faces: number[][]; ways: bigint }[] = [{ faces: [], ways: 1n }];
  for (const group of groups) {
    const mine = kind(group);
    if (patterns.length * mine.length > 400_000) return null;
    patterns = patterns.flatMap((p) => mine.map((m) => ({ faces: [...p.faces, m.faces], ways: p.ways * m.ways })));
  }
  return patterns.map((p) => ({
    ways: p.ways,
    dice: { groups: p.faces, modifier: spec.modifier, total: p.faces.reduce((t, faces, i) => t + faces.reduce((s, f) => s + valueOfFace(groups[i] as DiceGroup, f), 0), spec.modifier) },
  }));
}
