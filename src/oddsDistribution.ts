import {
  canHold,
  chancesOf,
  type DiceGroup,
  dieName,
  dieOutcomes,
  faceRange,
  groupsOf,
  keptCount,
  playsByNewRules,
  type RollSpec,
  rangeOf,
  rulesText,
  valueOfFace,
} from "./dice.ts";
import { mathText, spreadMath } from "./math.ts";
import type { Distribution, ExactCounts } from "./oddsWays.ts";
import {
  anchorOf,
  convolve,
  explodingDie,
  leastOf,
  MOST_EXACT_PAIRS,
  multiply,
  outcomesOfDie,
  plain,
  share,
  standingFace,
  sumOfHighest,
  trimmed,
  waysOf,
} from "./oddsWays.ts";

/**
 * The odds as exact whole numbers, for the dice that have them: plain dice
 * added up, one die kept from a pool (advantage), loaded and custom dice the
 * same way (their weights are whole numbers, so their odds are exact
 * fractions), and several such kinds added together while that stays quick.
 * Null for rerolled or exploding dice, for several dice kept, and for large
 * mixed pools, whose odds are worked out as probabilities; `distributionOf`
 * answers for every roll.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @returns The odds as exact whole numbers, for the dice that have them: plain dice added up, one die kept from a pool (advantage), loaded and custom dice the same way (their weights are whole numbers, so their odds are exact fractions), and several such kinds added together while that stays quick. null for rerolled or exploding dice, for several dice kept, and for large mixed pools, whose odds are worked out as probabilities; `distributionOf` answers for every roll.

 *
 * @example
 * ```ts
 * import { exactCounts } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(String(exactCounts(spec)?.outcomes));
 * ```
 */
export function exactCounts(spec: RollSpec): ExactCounts | null {
  // A formula's outcomes are not equally likely totals to count.
  if (spec.math !== undefined) return null;
  let counts: bigint[] = [1n];
  let outcomes = 1n;
  for (const group of groupsOf(spec)) {
    const counted = waysOf(group);
    if (counted === null || counts.length * counted.ways.length > MOST_EXACT_PAIRS) return null;
    counts = multiply(counts, counted.ways);
    outcomes *= counted.outcomes;
  }
  const { min, values } = trimmed(anchorOf(spec), counts);
  return { min, counts: values, outcomes };
}

/** One kind of dice: the chance of each total its kept dice make, from the least they could. */
function probabilitiesOf(group: DiceGroup): number[] {
  const kept = keptCount(group);
  const counted = waysOf(group);
  if (counted !== null) return counted.ways.map((w) => share(w, counted.outcomes));
  if (playsByNewRules(group)) {
    // Each die worked through its own rules, then the dice put together: added, or the best of them kept.
    const die = dieOutcomes(group).chances;
    if (group.keep === "all") {
      let sum = die;
      for (let d = 1; d < group.count; d++) sum = convolve(sum, die);
      return sum;
    }
    if (group.keep === "highest") return sumOfHighest(die, group.count, kept);
    return sumOfHighest([...die].reverse(), group.count, kept).reverse();
  }
  let face: number[];
  if (group.faces !== undefined) {
    // A custom die's chances by what each face is worth.
    const die = outcomesOfDie(group);
    const each = Number(die.ways.reduce((a, b) => a + b, 0n));
    face = die.ways.map((w) => Number(w) / each);
  } else {
    const { low } = faceRange(group.sides);
    const mark = group.rerollUntil ?? group.reroll;
    face = standingFace(chancesOf(group), mark === undefined ? 0 : mark - low + 1, group.rerollUntil !== undefined);
  }
  if (group.keep === "all") {
    const die = group.explode === true ? explodingDie(face) : face;
    let sum = die;
    for (let d = 1; d < group.count; d++) sum = convolve(sum, die);
    return sum;
  }
  // The lowest of the dice are the highest of the same dice read upside down.
  if (group.keep === "highest") return sumOfHighest(face, group.count, kept);
  return sumOfHighest([...face].reverse(), group.count, kept).reverse();
}

const cache = new Map<string, Distribution>();

function keyOf(group: DiceGroup): string {
  return `${group.count}${dieName(group)}${rulesText(group)}`;
}

/**
 * Every total a spec can make and its chance. Several kinds of dice are
 * independent, so their totals are put together by convolution: every pair of
 * totals, their chances multiplied. Worked out once for each spec, then
 * remembered.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @returns Every total a spec can make and its chance. Several kinds of dice are independent, so their totals are put together by convolution: every pair of totals, their chances multiplied. Worked out once for each spec, then remembered.

 *
 * @example
 * ```ts
 * import { distributionOf } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * const odds = distributionOf(spec);
 * console.log(odds.min, odds.max, odds.probabilities[7 - odds.min]);
 * ```
 */
export function distributionOf(spec: RollSpec): Distribution {
  const groups = groupsOf(spec);
  const key =
    spec.math !== undefined
      ? mathText(spec.math, (i) => keyOf(groups[i] as DiceGroup))
      : `${groups.map(keyOf).join("+")}m${spec.modifier}`;
  const known = cache.get(key);
  if (known !== undefined) return known;
  let made: Distribution;
  if (spec.math !== undefined) {
    // Each kind's own odds, then the formula over them: the kinds share no dice, so their chances multiply.
    const leaves = groups.map((group) => {
      const alone = distributionOf({ ...group, modifier: 0 });
      return new Map(alone.probabilities.flatMap((p, i): [number, number][] => (p > 0 ? [[alone.min + i, p]] : [])));
    });
    const totals = spreadMath(spec.math, leaves);
    const min = Math.min(...totals.keys());
    const max = Math.max(...totals.keys());
    const probabilities = new Array<number>(max - min + 1).fill(0);
    for (const [total, chance] of totals) probabilities[total - min] = chance;
    made = { min, max, probabilities };
  } else if (groups.every(plain)) {
    const { min, max } = rangeOf(spec);
    let probabilities: number[];
    if (groups.length === 1) probabilities = probabilitiesOf(groups[0] as DiceGroup);
    else {
      const exact = exactCounts(spec);
      if (exact !== null) probabilities = exact.counts.map((c) => share(c, exact.outcomes));
      else probabilities = groups.map(probabilitiesOf).reduce(convolve);
    }
    made = { min, max, probabilities };
  } else {
    // Loaded and custom dice: counted from the least their faces are worth, and the totals that cannot come up taken off the ends.
    const exact = exactCounts(spec);
    const all =
      exact !== null
        ? { min: exact.min, values: exact.counts.map((c) => share(c, exact.outcomes)) }
        : trimmed(anchorOf(spec), groups.map(probabilitiesOf).reduce(convolve));
    made = { min: all.min, max: all.min + all.values.length - 1, probabilities: all.values };
  }
  if (cache.size > 200) cache.clear();
  cache.set(key, made);
  return made;
}

/**
 * The odds of a roll with some of its dice held: the held faces are settled,
 * and only the rest are still to be thrown. `held[i]` is whether face i is
 * held. With every die held there is one total, and it is certain. A
 * RangeError for dice that cannot be held (`canHold`).
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @param faces - Physical face values, in the order thrown.
 * @param held - A mask marking dice whose faces stay fixed.
 * @returns The odds of a roll with some of its dice held: the held faces are settled, and only the rest are still to be thrown. `held[i]` is whether face i is held. With every die held there is one total, and it is certain. A RangeError for dice that cannot be held (`canHold`).

 *
 * @example
 * ```ts
 * import { distributionHolding } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * const odds = distributionHolding(spec, [6, 3], [true, false]);
 * console.log(odds.min, odds.max);
 * ```
 */
export function distributionHolding(spec: RollSpec, faces: readonly number[], held: readonly boolean[]): Distribution {
  if (!canHold(spec)) throw new RangeError("korokoro: only plain dice can be held");
  let settled = spec.modifier;
  let probabilities = [1];
  let least = 0;
  let at = 0;
  for (const group of groupsOf(spec)) {
    let free = 0;
    for (let n = 0; n < group.count; n++, at++) {
      if (held[at] === true) settled += valueOfFace(group, faces[at] as number);
      else free += 1;
    }
    if (free === 0) continue;
    const rest: DiceGroup = { ...group, count: free };
    probabilities = convolve(probabilities, probabilitiesOf(rest));
    least += free * leastOf(group);
  }
  const { min, values } = trimmed(least + settled, probabilities);
  return { min, max: min + values.length - 1, probabilities: values };
}

/** Any of the odds functions takes a spec, or a distribution already in hand (one from `distributionHolding`, say). */
export type Odds = RollSpec | Distribution;

export function odds(of: Odds): Distribution {
  return "probabilities" in of ? of : distributionOf(of);
}

/** The running sums and the average of a distribution, worked out once: a history of 500 rolls asks for them 500 times. */
type Summed = { below: number[]; mean: number };
const summed = new WeakMap<Distribution, Summed>();

export function summedOf(d: Distribution): Summed {
  const known = summed.get(d);
  if (known !== undefined) return known;
  // below[i] is the chance of a total under min + i.
  const below = new Array<number>(d.probabilities.length + 1);
  let running = 0;
  // Ten thousand small terms: the average is added up with its rounding carried along (Neumaier's sum), not dropped.
  let mean = 0;
  let carried = 0;
  d.probabilities.forEach((p, i) => {
    below[i] = running;
    running += p;
    const term = p * (d.min + i);
    const next = mean + term;
    carried += Math.abs(mean) >= Math.abs(term) ? mean - next + term : term - next + mean;
    mean = next;
  });
  below[d.probabilities.length] = running;
  const made = { below, mean: mean + carried };
  summed.set(d, made);
  return made;
}
