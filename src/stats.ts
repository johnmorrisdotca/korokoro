import { diceCount, diceOf, dieName, faceRange, groupOf, hasTotal, sidesOf, type DiceGroup, type Roll, type RollSpec, type Sides } from "./dice.ts";
import { formatNotation } from "./notation.ts";
import { distributionOf, expectedTotal, luckOf } from "./odds.ts";

/** Everything worth saying about a history of rolls. Pure: a history in, numbers out. */
export type Stats = {
  /** How many rolls the history holds. */
  rolls: number;
  /** How many of those rolls held some dice from the roll before. They count their new dice, and are left out of luck, streaks, matches and totals. */
  heldRolls: number;
  /** How many dice those rolls threw, rerolled and exploded dice included, held dice not. */
  diceThrown: number;
  /** Mean of each roll's luck (0 to 1); 0.5 is exactly as lucky as the dice promise. Null with no rolls. */
  luck: number | null;
  /** The longest run of rolls above their average, and below it. */
  longestHot: number;
  longestCold: number;
  /** The run the history ends on: positive above average, negative below, 0 on the average. */
  currentStreak: number;
  /** Rolls of two or more dice all showing the same face. A roll that rerolled or exploded a die is not counted. */
  matches: number;
  /** A d20's natural 20 and natural 1, counted on the dice that were kept. */
  naturalTwenties: number;
  naturalOnes: number;
  /** Each face of the focus die. Null when no focus was given. */
  faces: FaceStats | null;
  /** The totals of the focus spec. Null when no focus was given. */
  totals: TotalStats | null;
};

/** How often each face of one kind of die came up, and whether that looks fair. */
export type FaceStats = {
  /** The kind of die counted. */
  sides: Sides;
  /** counts[i] is how often the die's i-th face came up, from its lowest: every die thrown, a rerolled one and an explosion's included. */
  counts: number[];
  /** How many dice of this kind were thrown. */
  dice: number;
  /** Chance a fair die strays this far or further. Null until there are enough throws to ask. */
  fairness: number | null;
  /** What each face says, on a custom die. Left out otherwise. */
  labels?: string[];
  /** True when the die counted is a loaded one. Left out otherwise. */
  loaded?: true;
};

/** The totals of one spec: seen against what the odds promise. */
export type TotalStats = {
  /** The spec, as notation. */
  notation: string;
  /** How many rolls of this spec the history holds. */
  rolls: number;
  /** The mean of their totals; 0 with no rolls. */
  average: number;
  /** The mean the odds promise. */
  expected: number;
  /** The highest total rolled; 0 with no rolls. */
  highest: number;
  /** The lowest total rolled; 0 with no rolls. */
  lowest: number;
  /** The lowest total the dice can make. */
  min: number;
  /** seen[i] and expected[i] are for a total of min + i. */
  seen: number[];
  expectedShare: number[];
};

/** The natural log of the gamma function, by Lanczos's approximation: good to about fifteen digits for the arguments a chi-square needs. */
function logGamma(x: number): number {
  const g = [76.18009172947146, -86.50532032941678, 24.01409824083091, -1.231739572450155, 1.20865097386618e-3, -5.395239384953e-6];
  let denominator = x;
  let series = 1.00000000019;
  for (const c of g) series += c / ++denominator;
  const shifted = x + 5.5;
  return Math.log((Math.sqrt(2 * Math.PI) * series) / x) - (shifted - (x + 0.5) * Math.log(shifted));
}

/**
 * The upper regularised incomplete gamma function Q(a, x): a series where x
 * is small beside a, a continued fraction where it is not. It is what a
 * chi-square's tail is, exactly.
 */
function gammaQ(a: number, x: number): number {
  if (x <= 0) return 1;
  const front = Math.exp(-x + a * Math.log(x) - logGamma(a));
  if (x < a + 1) {
    let term = 1 / a;
    let sum = term;
    for (let n = 1; n < 500; n++) {
      term *= x / (a + n);
      sum += term;
      if (Math.abs(term) < Math.abs(sum) * 1e-16) break;
    }
    return Math.min(1, Math.max(0, 1 - front * sum));
  }
  // Lentz's method for the continued fraction.
  const tiny = 1e-300;
  let b = x + 1 - a;
  let c = 1 / tiny;
  let d = 1 / b;
  let fraction = d;
  for (let n = 1; n < 500; n++) {
    const an = -n * (n - a);
    b += 2;
    d = an * d + b;
    if (Math.abs(d) < tiny) d = tiny;
    c = b + an / c;
    if (Math.abs(c) < tiny) c = tiny;
    d = 1 / d;
    const step = d * c;
    fraction *= step;
    if (Math.abs(step - 1) < 1e-16) break;
  }
  return Math.min(1, Math.max(0, front * fraction));
}

/**
 * The upper tail of a chi-square distribution: the chance that a fair die
 * strays at least this far. Worked out from the incomplete gamma function,
 * not approximated by a normal curve.
 */
export function chiSquareTail(statistic: number, degrees: number): number {
  if (degrees < 1) return 1;
  return gammaQ(degrees / 2, statistic / 2);
}

/** The fewest throws of each face a fairness test wants before it will say anything: the usual rule for a chi-square. */
export const FAIRNESS_MINIMUM_EACH = 5;

/** What a fairness test makes of a die. */
export type Fairness = {
  /** How many faces the die has. */
  sides: number;
  /** How many throws were counted. */
  rolls: number;
  /** How many throws the test wants before it will pronounce: five for each face. */
  minimum: number;
  /** Whether there were that many. */
  enough: boolean;
  /** How often each face should have come up, if the die is what it is tested against. */
  expected: number[];
  /** The chi-square statistic: how far the counts stray from that, in all. Null with too few throws. */
  statistic: number | null;
  /** The chance that a die as supposed strays this far or further. Null with too few throws: never a guess. */
  p: number | null;
  /**
   * The reading. `too-few`: no verdict. `fair`: nothing to see (p of 5% or
   * more). `unusual`: lopsided enough to happen less than one time in twenty
   * by chance, which still happens one time in twenty. `lopsided`: less than
   * one time in a thousand.
   */
  verdict: "too-few" | "fair" | "unusual" | "lopsided";
};

/**
 * Is this die fair? A chi-square goodness-of-fit test of how often each face
 * came up (`counts[i]` for the i-th face) against a fair die, or against
 * `chances` when the die is supposed to be something else. It makes no roll:
 * the counts can come from a history here or from a real die on a real table.
 */
export function fairnessTest(counts: readonly number[], chances?: readonly number[]): Fairness {
  const sides = counts.length;
  const rolls = counts.reduce((a, b) => a + b, 0);
  const share = chances ?? counts.map(() => 1 / sides);
  // Faces that can never come up take no part: they are not expected, and must not be seen.
  const live = share.filter((c) => c > 0).length;
  const expected = share.map((c) => c * rolls);
  const minimum = Math.ceil(FAIRNESS_MINIMUM_EACH / Math.min(...share.filter((c) => c > 0)));
  const impossible = counts.some((c, i) => c > 0 && (share[i] as number) === 0);
  const enough = sides >= 2 && live >= 2 && rolls >= minimum;
  if (!enough && !impossible) return { sides, rolls, minimum, enough: false, expected, statistic: null, p: null, verdict: "too-few" };
  // A face that cannot come up, coming up, settles it whatever the count.
  if (impossible) return { sides, rolls, minimum, enough: true, expected, statistic: Infinity, p: 0, verdict: "lopsided" };
  const statistic = counts.reduce((sum, c, i) => ((expected[i] as number) === 0 ? sum : sum + (c - (expected[i] as number)) ** 2 / (expected[i] as number)), 0);
  const p = chiSquareTail(statistic, live - 1);
  return { sides, rolls, minimum, enough: true, expected, statistic, p, verdict: p >= 0.05 ? "fair" : p >= 0.001 ? "unusual" : "lopsided" };
}

/** What `readResults` found in somebody's typed results. */
export type TypedResults = { ok: true; sides: number; counts: number[]; rolls: number } | { ok: false; part: string };

/**
 * Results typed or pasted from a real die, such as `3 5 6 6 1` or `3,5,6`:
 * whole numbers separated by spaces, commas or new lines. `sides` is the die;
 * left out, it is taken to be the highest face seen, and at least 2. Says
 * which piece it could not read.
 */
export function readResults(text: string, sides?: number): TypedResults {
  const pieces = text.split(/[\s,;]+/).filter((piece) => piece !== "");
  const faces: number[] = [];
  for (const piece of pieces) {
    if (!/^\d{1,4}$/.test(piece) || Number(piece) < 1) return { ok: false, part: piece };
    faces.push(Number(piece));
  }
  const die = sides ?? Math.max(2, ...faces);
  const past = faces.find((face) => face > die);
  if (past !== undefined) return { ok: false, part: String(past) };
  const counts = new Array<number>(die).fill(0);
  for (const face of faces) counts[face - 1] = (counts[face - 1] as number) + 1;
  return { ok: true, sides: die, counts, rolls: faces.length };
}

/**
 * How often each face of one kind of die came up in a history, with a
 * chi-square test of whether that looks fair. `kind` is a number of sides (or
 * "F"), which counts the fair dice of that size and no loaded or custom one;
 * or a group, which counts exactly that die. A numbered die, loaded or not,
 * is tested against the fair die of its size; a custom die against its faces
 * as written.
 */
export function faceStats(history: readonly Roll[], kind: Sides | DiceGroup): FaceStats {
  const group: DiceGroup = typeof kind === "object" ? kind : { count: 1, sides: kind, keep: "all" };
  const name = dieName(group);
  const low = group.faces !== undefined ? 1 : faceRange(group.sides).low;
  const faces = group.faces !== undefined ? group.faces.length : faceRange(group.sides).high - low + 1;
  const counts = new Array<number>(faces).fill(0);
  for (const r of history) {
    diceOf(r).forEach((die, i) => {
      // A held die was thrown in an earlier roll and counted there.
      if (r.held?.[i] === true || dieName(groupOf(r.spec, die)) !== name) return;
      counts[die.face - low] = (counts[die.face - low] as number) + 1;
    });
  }
  const dice = counts.reduce((a, b) => a + b, 0);
  const test = fairnessTest(counts);
  const stats: FaceStats = { sides: group.sides, counts, dice, fairness: test.p };
  if (group.faces !== undefined) stats.labels = group.faces.map((f) => f.label);
  if (group.weights !== undefined) stats.loaded = true;
  return stats;
}

/** The totals of every roll of one spec in a history, beside what the odds expect. */
export function totalStats(history: readonly Roll[], spec: RollSpec): TotalStats {
  const notation = formatNotation(spec);
  // A roll with dice held is a choice as much as a throw, so it is not set against the odds.
  const mine = history.filter((r) => r.held === undefined && formatNotation(r.spec) === notation);
  const d = distributionOf(spec);
  const seen = new Array<number>(d.probabilities.length).fill(0);
  for (const r of mine) seen[r.total - d.min] = (seen[r.total - d.min] ?? 0) + 1;
  const totals = mine.map((r) => r.total);
  return {
    notation,
    rolls: mine.length,
    average: totals.length === 0 ? 0 : totals.reduce((a, b) => a + b, 0) / totals.length,
    expected: expectedTotal(spec),
    highest: totals.length === 0 ? 0 : Math.max(...totals),
    lowest: totals.length === 0 ? 0 : Math.min(...totals),
    min: d.min,
    seen,
    expectedShare: d.probabilities,
  };
}

/**
 * Stats for a history, oldest roll first. `focus` picks which spec's totals to
 * break down, and which die's faces: its first kind, or `sides` when a roll
 * of several kinds wants another.
 */
export function statsOf(history: readonly Roll[], focus?: RollSpec, sides?: Sides | DiceGroup): Stats {
  let hot = 0;
  let cold = 0;
  let longestHot = 0;
  let longestCold = 0;
  let luckSum = 0;
  let matches = 0;
  let naturalTwenties = 0;
  let naturalOnes = 0;
  let diceThrown = 0;
  let heldRolls = 0;
  let wordy = 0;
  for (const r of history) {
    if (r.held !== undefined) {
      // Only the dice thrown again are new; luck and streaks are for whole rolls.
      heldRolls += 1;
      diceThrown += r.held.filter((h) => !h).length;
      continue;
    }
    diceThrown += r.faces.length;
    // A roll of words has no total to be lucky with.
    if (!hasTotal(r.spec)) {
      wordy += 1;
      continue;
    }
    luckSum += luckOf(r.spec, r.total);
    const mean = expectedTotal(r.spec);
    if (r.total > mean + 1e-9) {
      hot += 1;
      cold = 0;
    } else if (r.total < mean - 1e-9) {
      cold += 1;
      hot = 0;
    } else {
      hot = 0;
      cold = 0;
    }
    longestHot = Math.max(longestHot, hot);
    longestCold = Math.max(longestCold, cold);
    if (r.faces.length > 1 && r.faces.length === diceCount(r.spec) && r.faces.every((f) => f === r.faces[0])) matches += 1;
    for (const die of diceOf(r)) {
      if (die.status !== "kept" || sidesOf(r.spec, die) !== 20) continue;
      if (die.face === 20) naturalTwenties += 1;
      if (die.face === 1) naturalOnes += 1;
    }
  }
  const whole = history.length - heldRolls - wordy;
  return {
    rolls: history.length,
    heldRolls,
    diceThrown,
    luck: whole === 0 ? null : luckSum / whole,
    longestHot,
    longestCold,
    currentStreak: hot > 0 ? hot : -cold,
    matches,
    naturalTwenties,
    naturalOnes,
    faces: focus === undefined ? null : faceStats(history, sides ?? (focus.more === undefined ? focus : focus.sides)),
    totals: focus === undefined ? null : totalStats(history, focus),
  };
}
