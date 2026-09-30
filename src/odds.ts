import { MAX_EXPLOSIONS, MAX_REROLLS, canHold, chancesOf, dieName, faceRange, groupsOf, keptCount, rangeOf, valueOfFace, type DiceGroup, type RollSpec } from "./dice.ts";

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
 * left standing. Rerolled once, a low face is thrown again and whatever comes
 * up stands, so the low faces are still possible, only rarer. Rerolled until
 * clear, the die is thrown again up to `MAX_REROLLS` times, and a low face
 * stands only if the last of those throws shows one.
 */
function standingFace(chances: number[], rerolled: number, until: boolean): number[] {
  if (rerolled === 0) return chances;
  // The chance one throw shows a face that is thrown again.
  let again = 0;
  for (let i = 0; i < rerolled; i++) again += chances[i] as number;
  if (!until) return chances.map((p, i) => (i < rerolled ? 0 : p) + again * p);
  const stuck = again ** MAX_REROLLS;
  // A high face stands on the first throw, or the second, and so on: 1 + again + … + again^MAX_REROLLS throws of it.
  const throws = (1 - again * stuck) / (1 - again);
  return chances.map((p, i) => (i < rerolled ? stuck * p : throws * p));
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

/** Whether every face of a group's die is as likely as the next and worth its own number: a fair numbered die or a Fate die. */
function plain(group: DiceGroup): boolean {
  return group.weights === undefined && group.faces === undefined;
}

/**
 * One die of a group as whole numbers: how many of its equally likely
 * outcomes are worth each amount, from the least any face is worth. A fair
 * die has one outcome a face; a loaded die has as many as the face weighs; a
 * custom die has one for each time a face is written.
 */
function outcomesOfDie(group: DiceGroup): { least: number; ways: bigint[] } {
  const low = group.faces !== undefined ? 1 : faceRange(group.sides).low;
  const count = group.faces !== undefined ? group.faces.length : faceRange(group.sides).high - low + 1;
  const worth = Array.from({ length: count }, (_, i) => valueOfFace(group, low + i));
  const least = Math.min(...worth);
  const ways = new Array<bigint>(Math.max(...worth) - least + 1).fill(0n);
  worth.forEach((value, i) => (ways[value - least] = (ways[value - least] as bigint) + BigInt(group.weights?.[i] ?? 1)));
  return { least, ways };
}

/** The least one die of a group can be worth, over every face it has, whether or not the face can come up. */
function leastOf(group: DiceGroup): number {
  return outcomesOfDie(group).least;
}

/** Past this many pairs of totals, dice are put together as probabilities and not as whole numbers. */
const MOST_EXACT_PAIRS = 400_000;

function multiply(a: bigint[], b: bigint[]): bigint[] {
  const out = new Array<bigint>(a.length + b.length - 1).fill(0n);
  for (let i = 0; i < a.length; i++) {
    if (a[i] === 0n) continue;
    for (let j = 0; j < b.length; j++) out[i + j] = (out[i + j] as bigint) + (a[i] as bigint) * (b[j] as bigint);
  }
  return out;
}

/**
 * The counts for one kind of dice whose outcomes can be counted quickly, with
 * how many outcomes there are, or null for the rest. Index 0 is the kept dice
 * at their least.
 */
function waysOf(group: DiceGroup): { ways: bigint[]; outcomes: bigint } | null {
  if (group.reroll !== undefined || group.rerollUntil !== undefined || group.explode === true) return null;
  const kept = keptCount(group);
  if (group.keep !== "all" && kept !== 1) return null;
  if (plain(group)) {
    const { low, high } = faceRange(group.sides);
    const faces = high - low + 1;
    const outcomes = BigInt(faces) ** BigInt(group.count);
    return { ways: group.keep === "all" ? waysToSum(group.count, faces) : waysToKeepOne(group.count, faces, group.keep === "highest"), outcomes };
  }
  // A loaded or custom die: the same counting, with each face standing for as many outcomes as it weighs.
  const die = outcomesOfDie(group).ways;
  const each = die.reduce((a, b) => a + b, 0n);
  const outcomes = each ** BigInt(group.count);
  if (group.keep === "all") {
    let ways = die;
    for (let d = 1; d < group.count; d++) {
      if (ways.length * die.length > MOST_EXACT_PAIRS) return null;
      ways = multiply(ways, die);
    }
    return { ways, outcomes };
  }
  // One kept: the highest is at most a value when every die is, counted by the outcomes at or below it.
  const n = BigInt(group.count);
  const order = group.keep === "highest" ? die : [...die].reverse();
  let below = 0n;
  const ways = order.map((w) => {
    const upTo = below + w;
    const made = upTo ** n - below ** n;
    below = upTo;
    return made;
  });
  return { ways: group.keep === "highest" ? ways : ways.reverse(), outcomes };
}

/** A distribution with the totals that cannot happen taken off its ends: a loaded die's weightless faces leave some. */
function trimmed<T extends number | bigint>(min: number, values: T[]): { min: number; values: T[] } {
  let from = 0;
  let to = values.length;
  while (from < to - 1 && Number(values[from]) === 0) from += 1;
  while (to > from + 1 && Number(values[to - 1]) === 0) to -= 1;
  return { min: min + from, values: values.slice(from, to) };
}

/** The least total a spec could make if every face of every die could come up: where its odds are counted from. */
function anchorOf(spec: RollSpec): number {
  return groupsOf(spec).reduce((sum, group) => sum + keptCount(group) * leastOf(group), spec.modifier);
}

/**
 * The odds as exact whole numbers, for the dice that have them: plain dice
 * added up, one die kept from a pool (advantage), loaded and custom dice the
 * same way (their weights are whole numbers, so their odds are exact
 * fractions), and several such kinds added together while that stays quick.
 * Null for rerolled or exploding dice, for several dice kept, and for large
 * mixed pools, whose odds are worked out as probabilities; `distributionOf`
 * answers for every roll.
 */
export function exactCounts(spec: RollSpec): ExactCounts | null {
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
  return `${group.count}${dieName(group)}${group.keep}${group.keepCount ?? 1}${group.explode === true ? "!" : ""}r${group.reroll ?? ""}u${group.rerollUntil ?? ""}`;
}

/**
 * Every total a spec can make and its chance. Several kinds of dice are
 * independent, so their totals are put together by convolution: every pair of
 * totals, their chances multiplied. Worked out once for each spec, then
 * remembered.
 */
export function distributionOf(spec: RollSpec): Distribution {
  const groups = groupsOf(spec);
  const key = `${groups.map(keyOf).join("+")}m${spec.modifier}`;
  const known = cache.get(key);
  if (known !== undefined) return known;
  let made: Distribution;
  if (groups.every(plain)) {
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
    const all = exact !== null ? { min: exact.min, values: exact.counts.map((c) => share(c, exact.outcomes)) } : trimmed(anchorOf(spec), groups.map(probabilitiesOf).reduce(convolve));
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
type Odds = RollSpec | Distribution;

function odds(of: Odds): Distribution {
  return "probabilities" in of ? of : distributionOf(of);
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
export function chanceExactly(spec: Odds, total: number): number {
  const d = odds(spec);
  return d.probabilities[total - d.min] ?? 0;
}

/** The chance of this total or more: "what do I need to beat a DC of 15". */
export function chanceAtLeast(spec: Odds, target: number): number {
  const d = odds(spec);
  let sum = 0;
  for (let i = Math.max(0, target - d.min); i < d.probabilities.length; i++) sum += d.probabilities[i] as number;
  return Math.min(1, sum);
}

/** The chance of this total or less. */
export function chanceAtMost(spec: Odds, target: number): number {
  return Math.max(0, 1 - chanceAtLeast(spec, target + 1));
}

/** The average total over many rolls. */
export function expectedTotal(spec: Odds): number {
  return summedOf(odds(spec)).mean;
}

/** How far a typical roll lands from the average. */
export function spreadOf(spec: Odds): number {
  const d = odds(spec);
  const mean = expectedTotal(spec);
  return Math.sqrt(d.probabilities.reduce((sum, p, i) => sum + p * (d.min + i - mean) ** 2, 0));
}

/**
 * How lucky a total was, from 0 (the worst the dice can do) to 1 (the best):
 * the share of rolls it beats, counting a tie as half. A 7 on 2d6 is 0.5.
 */
export function luckOf(spec: Odds, total: number): number {
  const d = odds(spec);
  const at = Math.min(d.probabilities.length, Math.max(0, total - d.min));
  return Math.min(1, Math.max(0, (summedOf(d).below[at] as number) + chanceExactly(spec, total) / 2));
}

/** The most likely totals: several when the peak is flat, as it is for one die. */
export function mostLikely(spec: Odds): number[] {
  const d = odds(spec);
  const top = d.probabilities.reduce((a, b) => Math.max(a, b), 0);
  return d.probabilities.flatMap((p, i) => (Math.abs(p - top) < 1e-12 ? [d.min + i] : []));
}
