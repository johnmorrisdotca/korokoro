import {
  chancesOf,
  type DiceGroup,
  type Keep,
  keptCount,
  MAX_EXPLOSIONS,
  MAX_REROLLS,
  meets,
  playsByNewRules,
  valueOfFace,
} from "./dice.ts";
import { facesOf } from "./diceInternal.ts";

/** The least and the most one kind of dice can total, its own rules applied.
 *
 * @param group - One kind of dice and its rules.
 * @returns The least and the most one kind of dice can total, its own rules applied.

 *
 * @example
 * ```ts
 * import { groupRange } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(groupRange(spec));
 * ```
 */
export function groupRange(group: DiceGroup): { min: number; max: number } {
  const dice = keptCount(group);
  if (group.unique === true) {
    // Dice that all differ: the lowest faces, or the highest.
    const sides = group.sides as number;
    return { min: (dice * (dice + 1)) / 2, max: (dice * (2 * sides - dice + 1)) / 2 };
  }
  if (playsByNewRules(group)) {
    // What one die can add, from its rules played out; each kept die can reach either end.
    const { least, chances } = dieOutcomes(group);
    return { min: dice * least, max: dice * (least + chances.length - 1) };
  }
  const { low, high } = facesOf(group);
  // What the die can be worth: every face that can come up, a loaded die's weightless faces left out.
  const worth: number[] = [];
  for (let face = low; face <= high; face++)
    if (group.weights?.[face - low] !== 0) worth.push(valueOfFace(group, face));
  return {
    min: dice * Math.min(...worth),
    max: dice * (group.explode === true ? high * (MAX_EXPLOSIONS + 1) : Math.max(...worth)),
  };
}

/** Which faces count towards the total when one is kept. Ties keep the first die that shows the kept value.
 *
 * @param faces - Physical face values, in the order thrown.
 * @param keep - Whether all dice, the highest or the lowest count.
 * @returns Which faces count towards the total when one is kept. Ties keep the first die that shows the kept value.

 *
 * @example
 * ```ts
 * import { keptFaces } from "@johnmorrisdotca/korokoro";
 * console.log(keptFaces([1, 4, 6], "highest"));
 * ```
 */
export function keptFaces(faces: readonly number[], keep: Keep): boolean[] {
  if (keep === "all") return faces.map(() => true);
  const target = keep === "highest" ? Math.max(...faces) : Math.min(...faces);
  const index = faces.indexOf(target);
  return faces.map((_, i) => i === index);
}

/** The kept faces added up, plus the bonus.
 *
 * @param faces - Physical face values, in the order thrown.
 * @param kept - A mask saying which dice count towards the total.
 * @param modifier - The bonus added after the dice totals.
 * @returns The kept faces added up, plus the bonus.

 *
 * @example
 * ```ts
 * import { totalOf } from "@johnmorrisdotca/korokoro";
 * console.log(totalOf([2, 5], [true, true], 3));
 * ```
 */
export function totalOf(faces: readonly number[], kept: readonly boolean[], modifier: number): number {
  return faces.reduce((sum, face, i) => (kept[i] ? sum + face : sum), 0) + modifier;
}

/** One kind's rules as questions asked of a face: is it thrown again, does it explode, what is it worth. */
export function rulesOf(group: DiceGroup): {
  once: (face: number) => boolean;
  until: (face: number) => boolean;
  explodes: (face: number) => boolean;
  worth: (face: number, extra: boolean) => number;
} {
  const { high } = facesOf(group);
  const penetrating = group.explodeKind === "penetrating" || group.explodeKind === "compound-penetrating";
  return {
    once: (face) =>
      (group.reroll !== undefined && face <= group.reroll) ||
      (group.rerollWhen !== undefined && meets(group.rerollWhen, face)),
    until: (face) =>
      (group.rerollUntil !== undefined && face <= group.rerollUntil) ||
      (group.rerollUntilWhen !== undefined && meets(group.rerollUntilWhen, face)),
    explodes: (face) =>
      group.explode === true && (group.explodeWhen === undefined ? face === high : meets(group.explodeWhen, face)),
    worth: (face, extra) =>
      Math.min(group.ceiling ?? Infinity, Math.max(group.floor ?? -Infinity, valueOfFace(group, face))) -
      (extra && penetrating ? 1 : 0),
  };
}

/**
 * One die of a kind worked through its own rules, before any keeping or
 * dropping: the chance of each amount it adds to the total, from `least` up.
 * For dice that are added, that is what the die is worth, explosions and all;
 * for dice that are counted, it is the successes it makes less the ones it
 * takes away. Exact as the rules are played: rerolls stop after
 * `MAX_REROLLS` and explosions after `MAX_EXPLOSIONS`, here as in a roll.
 *
 * @param group - One kind of dice and its rules.
 * @returns One die of a kind worked through its own rules, before any keeping or dropping: the chance of each amount it adds to the total, from `least` up. For dice that are added, that is what the die is worth, explosions and all; for dice that are counted, it is the successes it makes less the ones it takes away. Exact as the rules are played: rerolls stop after `MAX_REROLLS` and explosions after `MAX_EXPLOSIONS`, here as in a roll.

 *
 * @example
 * ```ts
 * import { dieOutcomes } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(dieOutcomes(spec));
 * ```
 */
export function dieOutcomes(group: DiceGroup): { least: number; chances: number[] } {
  const { low } = facesOf(group);
  const rules = rulesOf(group);
  const thrownOnce = chancesOf(group);
  // The chance each face is the one left standing after the rerolls.
  let standing = thrownOnce;
  const masked = (mask: (face: number) => boolean) =>
    thrownOnce.reduce((sum, p, i) => (mask(low + i) ? sum + p : sum), 0);
  const againOnce = masked(rules.once);
  if (againOnce > 0) standing = thrownOnce.map((p, i) => (rules.once(low + i) ? 0 : p) + againOnce * p);
  const again = masked(rules.until);
  if (again > 0) {
    // After a reroll-once, the face standing is rerolled until clear in turn; the two are never both asked for, so this is one or the other.
    const stuck = again ** MAX_REROLLS;
    const throws = (1 - again * stuck) / (1 - again);
    standing = thrownOnce.map((p, i) => (rules.until(low + i) ? stuck * p : throws * p));
  }
  const counted = group.success !== undefined;
  const whole = group.explodeKind === "compound" || group.explodeKind === "compound-penetrating";
  const score = (worth: number): number =>
    group.success !== undefined && meets(group.success, worth)
      ? 1
      : group.failure !== undefined && meets(group.failure, worth)
        ? -1
        : 0;
  // What one die adds by itself: its worth, or, counted die by die, its score.
  const adds = (face: number, extra: boolean): number =>
    counted && !whole ? score(rules.worth(face, extra)) : rules.worth(face, extra);
  type Spread = Map<number, number>;
  const put = (into: Spread, amount: number, chance: number) => into.set(amount, (into.get(amount) ?? 0) + chance);
  // chain(left, extra): what a die adds with `left` explosions still allowed.
  let after: Spread = new Map();
  const steps = group.explode === true ? MAX_EXPLOSIONS : 0;
  for (let left = 0; left <= steps; left++) {
    const extra = left < steps;
    const now: Spread = new Map();
    for (let i = 0; i < standing.length; i++) {
      const chance = standing[i] as number;
      if (chance === 0) continue;
      const face = low + i;
      const here = adds(face, extra);
      if (left > 0 && rules.explodes(face))
        for (const [amount, further] of after) put(now, here + amount, chance * further);
      else put(now, here, chance);
    }
    after = now;
  }
  let spread = after;
  if (counted && whole) {
    // A compounding die is one die: its whole chain is compared once.
    spread = new Map();
    for (const [amount, chance] of after) put(spread, score(amount), chance);
  }
  const amounts = [...spread.keys()];
  const least = Math.min(...amounts);
  const chances = new Array<number>(Math.max(...amounts) - least + 1).fill(0);
  for (const [amount, chance] of spread) chances[amount - least] = chance;
  return { least, chances };
}
