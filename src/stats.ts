import { faceRange, type Roll, type RollSpec, type Sides } from "./dice.ts";
import { formatNotation } from "./notation.ts";
import { distributionOf, expectedTotal, luckOf } from "./odds.ts";

/** Everything worth saying about a history of rolls. Pure: a history in, numbers out. */
export type Stats = {
  rolls: number;
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
  faces: FaceStats | null;
  totals: TotalStats | null;
};

/** How often each face of one kind of die came up, and whether that looks fair. */
export type FaceStats = {
  sides: Sides;
  /** counts[i] is how often the die's i-th face came up, from its lowest: every die thrown, a rerolled one and an explosion's included. */
  counts: number[];
  dice: number;
  /** Chance a fair die strays this far or further. Null until there are enough throws to ask. */
  fairness: number | null;
};

/** The totals of one spec: seen against what the odds promise. */
export type TotalStats = {
  notation: string;
  rolls: number;
  average: number;
  expected: number;
  highest: number;
  lowest: number;
  min: number;
  /** seen[i] and expected[i] are for a total of min + i. */
  seen: number[];
  expectedShare: number[];
};

function erf(x: number): number {
  // Abramowitz and Stegun 7.1.26: good to about 1e-7, plenty for a verdict.
  const sign = x < 0 ? -1 : 1;
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return sign * y;
}

/** Upper tail of chi-square, by Wilson and Hilferty's cube-root approximation. */
export function chiSquareTail(statistic: number, degrees: number): number {
  if (degrees < 1) return 1;
  const z = ((statistic / degrees) ** (1 / 3) - (1 - 2 / (9 * degrees))) / Math.sqrt(2 / (9 * degrees));
  return Math.min(1, Math.max(0, 0.5 * (1 - erf(z / Math.SQRT2))));
}

export function faceStats(history: readonly Roll[], sides: Sides): FaceStats {
  const { low, high } = faceRange(sides);
  const faces = high - low + 1;
  const counts = new Array<number>(faces).fill(0);
  for (const r of history) {
    if (r.spec.sides !== sides) continue;
    for (const face of r.faces) counts[face - low] = (counts[face - low] as number) + 1;
  }
  const dice = counts.reduce((a, b) => a + b, 0);
  const each = dice / faces;
  // The test says nothing until every face is expected at least five times.
  const fairness =
    each >= 5 ? chiSquareTail(counts.reduce((sum, c) => sum + (c - each) ** 2 / each, 0), faces - 1) : null;
  return { sides, counts, dice, fairness };
}

export function totalStats(history: readonly Roll[], spec: RollSpec): TotalStats {
  const notation = formatNotation(spec);
  const mine = history.filter((r) => formatNotation(r.spec) === notation);
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

/** Stats for a history, oldest roll first; `focus` picks which die and which spec to break down. */
export function statsOf(history: readonly Roll[], focus?: RollSpec): Stats {
  let hot = 0;
  let cold = 0;
  let longestHot = 0;
  let longestCold = 0;
  let luckSum = 0;
  let matches = 0;
  let naturalTwenties = 0;
  let naturalOnes = 0;
  let diceThrown = 0;
  for (const r of history) {
    diceThrown += r.faces.length;
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
    if (r.faces.length > 1 && r.faces.length === r.spec.count && r.faces.every((f) => f === r.faces[0])) matches += 1;
    if (r.spec.sides === 20) {
      r.faces.forEach((f, i) => {
        if (!r.kept[i]) return;
        if (f === 20) naturalTwenties += 1;
        if (f === 1) naturalOnes += 1;
      });
    }
  }
  return {
    rolls: history.length,
    diceThrown,
    luck: history.length === 0 ? null : luckSum / history.length,
    longestHot,
    longestCold,
    currentStreak: hot > 0 ? hot : -cold,
    matches,
    naturalTwenties,
    naturalOnes,
    faces: focus === undefined ? null : faceStats(history, focus.sides),
    totals: focus === undefined ? null : totalStats(history, focus),
  };
}
