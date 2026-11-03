import {
  type DiceGroup,
  dieOutcomes,
  faceRange,
  groupRange,
  groupsOf,
  keptCount,
  MAX_EXPLOSIONS,
  MAX_REROLLS,
  playsByNewRules,
  type RollSpec,
  valueOfFace,
} from "./dice.ts";

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
 *
 * @example
 * ```ts
 * import type { Distribution } from "@johnmorrisdotca/korokoro";
 * import { DEFAULT_SPEC, distributionOf } from "@johnmorrisdotca/korokoro";
 * const value: Distribution = distributionOf(DEFAULT_SPEC);
 * console.log([value.min, value.max]);
 * ```
 */
export type Distribution = {
  /** The lowest total the dice can make. */
  min: number;
  /** The highest total the dice can make. */
  max: number;
  /** probabilities[i] is the chance of a total of min + i. Sums to 1. */
  probabilities: number[];
};

/** The odds as whole numbers: how many of the equally likely outcomes make each total.
 *
 * @example
 * ```ts
 * import type { ExactCounts } from "@johnmorrisdotca/korokoro";
 * import { DEFAULT_SPEC, exactCounts } from "@johnmorrisdotca/korokoro";
 * const value: ExactCounts = exactCounts(DEFAULT_SPEC)!;
 * console.log(String(value.outcomes));
 * ```
 */
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
export function share(count: bigint, outcomes: bigint): number {
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
export function standingFace(chances: number[], rerolled: number, until: boolean): number[] {
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
export function explodingDie(face: number[]): number[] {
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

export function convolve(a: number[], b: number[]): number[] {
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
export function sumOfHighest(die: number[], count: number, keep: number): number[] {
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
export function plain(group: DiceGroup): boolean {
  return group.weights === undefined && group.faces === undefined;
}

/**
 * One die of a group as whole numbers: how many of its equally likely
 * outcomes are worth each amount, from the least any face is worth. A fair
 * die has one outcome a face; a loaded die has as many as the face weighs; a
 * custom die has one for each time a face is written.
 */
export function outcomesOfDie(group: DiceGroup): { least: number; ways: bigint[] } {
  const low = group.faces !== undefined ? 1 : faceRange(group.sides).low;
  const count = group.faces !== undefined ? group.faces.length : faceRange(group.sides).high - low + 1;
  const worth = Array.from({ length: count }, (_, i) => valueOfFace(group, low + i));
  const least = Math.min(...worth);
  const ways = new Array<bigint>(Math.max(...worth) - least + 1).fill(0n);
  worth.forEach((value, i) => {
    ways[value - least] = (ways[value - least] as bigint) + BigInt(group.weights?.[i] ?? 1);
  });
  return { least, ways };
}

/** The least one die of a group can be worth, over every face it has, whether or not the face can come up. */
export function leastOf(group: DiceGroup): number {
  return outcomesOfDie(group).least;
}

/** Past this many pairs of totals, dice are put together as probabilities and not as whole numbers. */
export const MOST_EXACT_PAIRS = 400_000;

export function multiply(a: bigint[], b: bigint[]): bigint[] {
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
export function waysOf(group: DiceGroup): { ways: bigint[]; outcomes: bigint } | null {
  if (group.reroll !== undefined || group.rerollUntil !== undefined || group.explode === true || playsByNewRules(group))
    return null;
  if (group.unique === true) return waysToDiffer(group.count, group.sides as number);
  const kept = keptCount(group);
  if (group.keep !== "all" && kept !== 1) return null;
  if (plain(group)) {
    const { low, high } = faceRange(group.sides);
    const faces = high - low + 1;
    const outcomes = BigInt(faces) ** BigInt(group.count);
    return {
      ways:
        group.keep === "all"
          ? waysToSum(group.count, faces)
          : waysToKeepOne(group.count, faces, group.keep === "highest"),
      outcomes,
    };
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

/**
 * Dice that all differ: the sets of `count` different faces of a die, by what
 * they add up to. Every set is as likely as the next, so they are counted:
 * each face in turn either joins the sets made so far or does not. Index 0 is
 * the lowest faces together.
 */
function waysToDiffer(count: number, sides: number): { ways: bigint[]; outcomes: bigint } {
  const most = (count * (2 * sides - count + 1)) / 2;
  // sets[j][sum] is how many sets of j faces add up to sum, among the faces looked at so far.
  const sets = Array.from({ length: count + 1 }, () => new Array<bigint>(most + 1).fill(0n));
  (sets[0] as bigint[])[0] = 1n;
  for (let face = 1; face <= sides; face++) {
    for (let j = Math.min(count, face); j >= 1; j--) {
      const from = sets[j - 1] as bigint[];
      const to = sets[j] as bigint[];
      for (let sum = most; sum >= face; sum--)
        if (from[sum - face] !== 0n) to[sum] = (to[sum] as bigint) + (from[sum - face] as bigint);
    }
  }
  const least = (count * (count + 1)) / 2;
  const ways = (sets[count] as bigint[]).slice(least);
  return { ways, outcomes: ways.reduce((a, b) => a + b, 0n) };
}

/** A distribution with the totals that cannot happen taken off its ends: a loaded die's weightless faces leave some. */
export function trimmed<T extends number | bigint>(min: number, values: T[]): { min: number; values: T[] } {
  let from = 0;
  let to = values.length;
  while (from < to - 1 && Number(values[from]) === 0) from += 1;
  while (to > from + 1 && Number(values[to - 1]) === 0) to -= 1;
  return { min: min + from, values: values.slice(from, to) };
}

/** The least total a spec could make if every face of every die could come up: where its odds are counted from. */
export function anchorOf(spec: RollSpec): number {
  return groupsOf(spec).reduce(
    (sum, group) =>
      sum +
      (group.unique === true
        ? groupRange(group).min
        : keptCount(group) * (playsByNewRules(group) ? dieOutcomes(group).least : leastOf(group))),
    spec.modifier,
  );
}
