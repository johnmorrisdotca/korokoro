import { MAX_EXPLOSIONS, faceRange, keptCount, rangeOf, type RollSpec } from "./dice.ts";

/**
 * Exact odds for a spec, worked out rather than simulated: every total the
 * dice can make and how likely it is.
 *
 * Plain dice are counted. Ten d1000 is a million million million million
 * million outcomes, far past what a number holds exactly, so the counts are
 * kept as BigInt, whole and exact however large, and only turned into a
 * probability at the end. `exactCounts` hands those counts out. Rerolled and
 * exploding dice, and several dice kept from a pool, are not equally likely
 * outcomes to count, so they are worked out as probabilities instead and are
 * right to the last few digits a number holds. Nothing here is sampled or
 * rounded off, and nothing is left out: exploding dice stop at
 * `MAX_EXPLOSIONS`, in the roll and in the odds alike, so the odds are those
 * of the dice as they are really thrown.
 */
export type Distribution = {
  /** The lowest total the dice can make. */
  min: number;
  /** The highest total the dice can make. */
  max: number;
  /** probabilities[i] is the chance of a total of min + i. Sums to 1. */
  probabilities: number[];
};

/** The odds as whole numbers: how many of the equally likely outcomes make each total. */
export type ExactCounts = {
  /** The lowest total the dice can make. */
  min: number;
  /** counts[i] is the number of outcomes that total min + i. */
  counts: bigint[];
  /** How many outcomes there are: the sides to the power of the dice. */
  outcomes: bigint;
};

/**
 * Plain dice, all added: the number of ways to make each total. Adding one
 * die of s sides to a pile is a moving sum of s neighbours, so each die costs
 * one pass whatever its size.
 */
function waysToSum(count: number, sides: number): bigint[] {
  let ways: bigint[] = [1n];
  for (let d = 0; d < count; d++) {
    const next = new Array<bigint>(ways.length + sides - 1);
    let window = 0n;
    for (let i = 0; i < next.length; i++) {
      if (i < ways.length) window += ways[i] as bigint;
      if (i >= sides) window -= ways[i - sides] as bigint;
      next[i] = window;
    }
    ways = next;
  }
  return ways;
}

/** Plain dice, one kept: the highest of them is at most k when every die is. */
function waysToKeepOne(count: number, sides: number, highest: boolean): bigint[] {
  const n = BigInt(count);
  return Array.from({ length: sides }, (_, i) => {
    const k = BigInt(highest ? i + 1 : sides - i);
    return k ** n - (k - 1n) ** n;
  });
}

const EXACT_IN_A_NUMBER = 2n ** 53n;

/** A count over the outcomes as the nearest number: exact division while both fit a number, scaled whole-number division past that. */
function share(count: bigint, outcomes: bigint): number {
  if (outcomes < EXACT_IN_A_NUMBER) return Number(count) / Number(outcomes);
  if (count === 0n) return 0;
  // Enough extra bits that the quotient carries more than a number keeps.
  const bits = outcomes.toString(2).length - count.toString(2).length + 64;
  return Number((count << BigInt(bits)) / outcomes) / 2 ** bits;
}

/**
 * One die's faces from lowest to highest, with the chance each is the face
 * left standing. A reroll happens once: a face at the reroll mark or lower is
 * thrown again and whatever comes up stands, so the low faces are still
 * possible, only rarer.
 */
function standingFace(faces: number, rerolled: number): number[] {
  const again = rerolled / faces;
  return Array.from({ length: faces }, (_, i) => (i < rerolled ? 0 : 1 / faces) + again / faces);
}

/**
 * One exploding die: index i is a value of i + 1. With no explosions left the
 * die is read as it lies. With some left, its highest face is never the end:
 * it adds that face to whatever the next die makes.
 */
function explodingDie(face: number[]): number[] {
  const sides = face.length;
  const top = face[sides - 1] as number;
  let chain = face;
  for (let depth = 1; depth <= MAX_EXPLOSIONS; depth++) {
    const next = new Array<number>(sides * (depth + 1)).fill(0);
    for (let i = 0; i < sides - 1; i++) next[i] = face[i] as number;
    for (let i = 0; i < chain.length; i++) next[i + sides] = top * (chain[i] as number);
    chain = next;
  }
  return chain;
}

function convolve(a: number[], b: number[]): number[] {
  const out = new Array<number>(a.length + b.length - 1).fill(0);
  for (let i = 0; i < a.length; i++) {
    const here = a[i] as number;
    if (here === 0) continue;
    for (let j = 0; j < b.length; j++) out[i + j] = (out[i + j] as number) + here * (b[j] as number);
  }
  return out;
}

function choose(n: number, k: number): number {
  let ways = 1;
  for (let i = 1; i <= k; i++) ways = (ways * (n - k + i)) / i;
  return ways;
}

/**
 * The sum of the highest `keep` of `count` dice, each with the same chances
 * `die` (index 0 is its lowest value). Values are dealt out from the highest
 * down: at each value, some number of the dice not yet placed show exactly it,
 * given that they show no more than it. Once `keep` dice are placed the sum is
 * settled. out[i] is the chance the kept dice add up to i above their lowest.
 */
function sumOfHighest(die: number[], count: number, keep: number): number[] {
  const size = keep * (die.length - 1) + 1;
  const out = new Array<number>(size).fill(0);
  // placed[c] is the chance of each sum so far with c dice placed, for c below `keep`.
  const placed = Array.from({ length: keep }, () => new Array<number>(size).fill(0));
  (placed[0] as number[])[0] = 1;
  const reach = new Array<number>(keep).fill(-1);
  reach[0] = 0;
  const atMost = new Array<number>(die.length).fill(0);
  let running = 0;
  for (let v = 0; v < die.length; v++) {
    running += die[v] as number;
    atMost[v] = running;
  }
  for (let v = die.length - 1; v >= 0; v--) {
    const chance = die[v] as number;
    if (chance === 0) continue;
    const exactly = v === 0 ? 1 : Math.min(1, chance / (atMost[v] as number));
    // From the most dice placed to the fewest, so nothing moved at this value is moved again.
    for (let c = keep - 1; c >= 0; c--) {
      const top = reach[c] as number;
      if (top < 0) continue;
      const from = placed[c] as number[];
      const left = count - c;
      // The dice placed so far all show more than v, so no sum of theirs is below this.
      const bottom = c * (v + 1);
      for (let j = 1; j <= left; j++) {
        const weight = choose(left, j) * exactly ** j * (1 - exactly) ** (left - j);
        if (weight === 0) continue;
        const shift = v * Math.min(j, keep - c);
        const to = c + j >= keep ? out : (placed[c + j] as number[]);
        for (let i = bottom; i <= top; i++) to[i + shift] = (to[i + shift] as number) + (from[i] as number) * weight;
        if (c + j < keep) reach[c + j] = Math.max(reach[c + j] as number, top + shift);
      }
      const stay = (1 - exactly) ** left;
      for (let i = bottom; i <= top; i++) from[i] = (from[i] as number) * stay;
    }
  }
  return out;
}

/** The counts for dice whose outcomes are equally likely and quick to count, or null for the rest. */
function waysOf(spec: RollSpec): bigint[] | null {
  if (spec.reroll !== undefined || spec.explode === true) return null;
  const { low, high } = faceRange(spec.sides);
  const faces = high - low + 1;
  if (spec.keep === "all") return waysToSum(spec.count, faces);
  if (keptCount(spec) === 1) return waysToKeepOne(spec.count, faces, spec.keep === "highest");
  return null;
}

/**
 * The odds as exact whole numbers, for the dice that have them: plain dice
 * added up, and one die kept from a pool (advantage). Null for rerolled or
 * exploding dice and for several dice kept, whose odds are worked out as
 * probabilities; `distributionOf` answers for every roll.
 */
export function exactCounts(spec: RollSpec): ExactCounts | null {
  const counts = waysOf(spec);
  if (counts === null) return null;
  const { low, high } = faceRange(spec.sides);
  return { min: rangeOf(spec).min, counts, outcomes: BigInt(high - low + 1) ** BigInt(spec.count) };
}

function probabilitiesOf(spec: RollSpec): number[] {
  const { low, high } = faceRange(spec.sides);
  const faces = high - low + 1;
  const kept = keptCount(spec);
  const ways = waysOf(spec);
  if (ways !== null) {
    const outcomes = BigInt(faces) ** BigInt(spec.count);
    return ways.map((w) => share(w, outcomes));
  }
  const face = standingFace(faces, spec.reroll === undefined ? 0 : spec.reroll - low + 1);
  if (spec.keep === "all") {
    const die = spec.explode === true ? explodingDie(face) : face;
    let sum = die;
    for (let d = 1; d < spec.count; d++) sum = convolve(sum, die);
    return sum;
  }
  // The lowest of the dice are the highest of the same dice read upside down.
  if (spec.keep === "highest") return sumOfHighest(face, spec.count, kept);
  return sumOfHighest([...face].reverse(), spec.count, kept).reverse();
}

const cache = new Map<string, Distribution>();

/** Every total a spec can make and its chance. Worked out once for each spec, then remembered. */
export function distributionOf(spec: RollSpec): Distribution {
  const key = `${spec.count}d${spec.sides}${spec.keep}${spec.keepCount ?? 1}${spec.explode === true ? "!" : ""}r${spec.reroll ?? ""}m${spec.modifier}`;
  const known = cache.get(key);
  if (known !== undefined) return known;
  const { min, max } = rangeOf(spec);
  const made = { min, max, probabilities: probabilitiesOf(spec) };
  if (cache.size > 200) cache.clear();
  cache.set(key, made);
  return made;
}

/** The running sums and the average of a distribution, worked out once: a history of 500 rolls asks for them 500 times. */
type Summed = { below: number[]; mean: number };
const summed = new WeakMap<Distribution, Summed>();

function summedOf(d: Distribution): Summed {
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

/** The chance of this total or less. */
export function chanceAtMost(spec: RollSpec, target: number): number {
  return Math.max(0, 1 - chanceAtLeast(spec, target + 1));
}

/** The average total over many rolls. */
export function expectedTotal(spec: RollSpec): number {
  return summedOf(distributionOf(spec)).mean;
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
  const at = Math.min(d.probabilities.length, Math.max(0, total - d.min));
  return Math.min(1, Math.max(0, (summedOf(d).below[at] as number) + chanceExactly(spec, total) / 2));
}

/** The most likely totals: several when the peak is flat, as it is for one die. */
export function mostLikely(spec: RollSpec): number[] {
  const d = distributionOf(spec);
  const top = d.probabilities.reduce((a, b) => Math.max(a, b), 0);
  return d.probabilities.flatMap((p, i) => (Math.abs(p - top) < 1e-12 ? [d.min + i] : []));
}
