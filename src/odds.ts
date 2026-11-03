import type { Odds } from "./oddsDistribution.ts";
import { odds, summedOf } from "./oddsDistribution.ts";

export { distributionHolding, distributionOf, exactCounts } from "./oddsDistribution.ts";
export type { Distribution, ExactCounts } from "./oddsWays.ts";

/** The chance of exactly this total.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @param total - The total to measure or compare.
 * @returns The chance of exactly this total.

 *
 * @example
 * ```ts
 * import { chanceExactly } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(chanceExactly(spec, 7));
 * ```
 */
export function chanceExactly(spec: Odds, total: number): number {
  const d = odds(spec);
  return d.probabilities[total - d.min] ?? 0;
}

/** The chance of this total or more: "what do I need to beat a DC of 15".
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @param target - The DOM host, or the target total for a probability calculation.
 * @returns The chance of this total or more: "what do I need to beat a DC of 15".

 *
 * @example
 * ```ts
 * import { chanceAtLeast } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(chanceAtLeast(spec, 10));
 * ```
 */
export function chanceAtLeast(spec: Odds, target: number): number {
  const d = odds(spec);
  let sum = 0;
  for (let i = Math.max(0, target - d.min); i < d.probabilities.length; i++) sum += d.probabilities[i] as number;
  return Math.min(1, sum);
}

/** The chance of this total or less.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @param target - The DOM host, or the target total for a probability calculation.
 * @returns The chance of this total or less.

 *
 * @example
 * ```ts
 * import { chanceAtMost } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(chanceAtMost(spec, 4));
 * ```
 */
export function chanceAtMost(spec: Odds, target: number): number {
  return Math.max(0, 1 - chanceAtLeast(spec, target + 1));
}

/** The chance that at least one of several throws of a roll reaches a target: a set of six ability scores holding at least one 16, say.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @param target - The DOM host, or the target total for a probability calculation.
 * @param times - The number of independent repeats.
 * @returns The chance that at least one of several throws of a roll reaches a target: a set of six ability scores holding at least one 16, say.

 *
 * @example
 * ```ts
 * import { chanceAnyAtLeast } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(chanceAnyAtLeast(spec, 10, 3));
 * ```
 */
export function chanceAnyAtLeast(spec: Odds, target: number, times: number): number {
  return 1 - (1 - chanceAtLeast(spec, target)) ** times;
}

/** The average of the highest total among several throws of a roll. Exact: the highest is at most t when every throw is.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @param times - The number of independent repeats.
 * @returns The average of the highest total among several throws of a roll. Exact: the highest is at most t when every throw is.

 *
 * @example
 * ```ts
 * import { expectedHighest } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(expectedHighest(spec, 3));
 * ```
 */
export function expectedHighest(spec: Odds, times: number): number {
  const d = odds(spec);
  const { below } = summedOf(d);
  let mean = 0;
  for (let i = 0; i < d.probabilities.length; i++)
    mean += (d.min + i) * ((below[i + 1] as number) ** times - (below[i] as number) ** times);
  return mean;
}

/** The average total over many rolls.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @returns The average total over many rolls.

 *
 * @example
 * ```ts
 * import { expectedTotal } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(expectedTotal(spec));
 * ```
 */
export function expectedTotal(spec: Odds): number {
  return summedOf(odds(spec)).mean;
}

/** How far a typical roll lands from the average.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @returns How far a typical roll lands from the average.

 *
 * @example
 * ```ts
 * import { spreadOf } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(spreadOf(spec));
 * ```
 */
export function spreadOf(spec: Odds): number {
  const d = odds(spec);
  const mean = expectedTotal(spec);
  return Math.sqrt(d.probabilities.reduce((sum, p, i) => sum + p * (d.min + i - mean) ** 2, 0));
}

/**
 * How lucky a total was, from 0 (the worst the dice can do) to 1 (the best):
 * the share of rolls it beats, counting a tie as half. A 7 on 2d6 is 0.5.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @param total - The total to measure or compare.
 * @returns How lucky a total was, from 0 (the worst the dice can do) to 1 (the best): the share of rolls it beats, counting a tie as half. A 7 on 2d6 is 0.5.

 *
 * @example
 * ```ts
 * import { luckOf } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(luckOf(spec, 7));
 * ```
 */
export function luckOf(spec: Odds, total: number): number {
  const d = odds(spec);
  const at = Math.min(d.probabilities.length, Math.max(0, total - d.min));
  return Math.min(1, Math.max(0, (summedOf(d).below[at] as number) + chanceExactly(spec, total) / 2));
}

/** The most likely totals: several when the peak is flat, as it is for one die.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @returns The most likely totals: several when the peak is flat, as it is for one die.

 *
 * @example
 * ```ts
 * import { mostLikely } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(mostLikely(spec));
 * ```
 */
export function mostLikely(spec: Odds): number[] {
  const d = odds(spec);
  const top = d.probabilities.reduce((a, b) => Math.max(a, b), 0);
  return d.probabilities.flatMap((p, i) => (Math.abs(p - top) < 1e-12 ? [d.min + i] : []));
}
