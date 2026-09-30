import { rangeOf, type RollSpec } from "./dice.ts";

/**
 * Exact odds for a spec, worked out rather than simulated: every total the
 * dice can make and how likely it is. Five d100 is ten billion outcomes, which
 * a convolution counts in a few thousand steps and still exactly, since every
 * count stays below 2^53.
 */
export type Distribution = {
  min: number;
  max: number;
  /** probabilities[i] is the chance of a total of min + i. Sums to 1. */
  probabilities: number[];
};

function sumOfDice(count: number, sides: number): number[] {
  let counts = [1];
  for (let d = 0; d < count; d++) {
    const next = new Array<number>(counts.length + sides - 1).fill(0);
    for (let i = 0; i < counts.length; i++) {
      const here = counts[i] as number;
      if (here === 0) continue;
      for (let face = 0; face < sides; face++) next[i + face] = (next[i + face] as number) + here;
    }
    counts = next;
  }
  const outcomes = sides ** count;
  return counts.map((c) => c / outcomes);
}

function keepOne(count: number, sides: number, highest: boolean): number[] {
  const outcomes = sides ** count;
  return Array.from({ length: sides }, (_, i) => {
    const k = i + 1;
    return highest
      ? (k ** count - (k - 1) ** count) / outcomes
      : ((sides - k + 1) ** count - (sides - k) ** count) / outcomes;
  });
}

const cache = new Map<string, Distribution>();

export function distributionOf(spec: RollSpec): Distribution {
  const key = `${spec.count}d${spec.sides}${spec.keep}${spec.modifier}`;
  const known = cache.get(key);
  if (known !== undefined) return known;
  const { min, max } = rangeOf(spec);
  const probabilities =
    spec.keep === "all" ? sumOfDice(spec.count, spec.sides) : keepOne(spec.count, spec.sides, spec.keep === "highest");
  const made = { min, max, probabilities };
  if (cache.size > 200) cache.clear();
  cache.set(key, made);
  return made;
}

/** The chance of exactly this total. */
export function chanceExactly(spec: RollSpec, total: number): number {
  const d = distributionOf(spec);
  return d.probabilities[total - d.min] ?? 0;
}

/** The chance of this total or more: "what do I need to beat a DC of 15". */
export function chanceAtLeast(spec: RollSpec, target: number): number {
  const d = distributionOf(spec);
  let sum = 0;
  for (let i = Math.max(0, target - d.min); i < d.probabilities.length; i++) sum += d.probabilities[i] as number;
  return Math.min(1, sum);
}

export function chanceAtMost(spec: RollSpec, target: number): number {
  return Math.max(0, 1 - chanceAtLeast(spec, target + 1));
}

/** The average total over many rolls. */
export function expectedTotal(spec: RollSpec): number {
  const d = distributionOf(spec);
  return d.probabilities.reduce((sum, p, i) => sum + p * (d.min + i), 0);
}

/** How far a typical roll lands from the average. */
export function spreadOf(spec: RollSpec): number {
  const d = distributionOf(spec);
  const mean = expectedTotal(spec);
  return Math.sqrt(d.probabilities.reduce((sum, p, i) => sum + p * (d.min + i - mean) ** 2, 0));
}

/**
 * How lucky a total was, from 0 (the worst the dice can do) to 1 (the best):
 * the share of rolls it beats, counting a tie as half. A 7 on 2d6 is 0.5.
 */
export function luckOf(spec: RollSpec, total: number): number {
  const d = distributionOf(spec);
  let below = 0;
  for (let i = 0; i < d.probabilities.length && d.min + i < total; i++) below += d.probabilities[i] as number;
  return Math.min(1, Math.max(0, below + chanceExactly(spec, total) / 2));
}

/** The most likely totals: several when the peak is flat, as it is for one die. */
export function mostLikely(spec: RollSpec): number[] {
  const d = distributionOf(spec);
  const top = Math.max(...d.probabilities);
  return d.probabilities.flatMap((p, i) => (Math.abs(p - top) < 1e-12 ? [d.min + i] : []));
}
