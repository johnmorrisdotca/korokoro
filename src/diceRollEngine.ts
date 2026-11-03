import {
  type DiceGroup,
  type DieRoll,
  type DieStatus,
  groupsOf,
  isLoaded,
  keptCount,
  MAX_EXPLOSIONS,
  MAX_REROLLS,
  meets,
  type Roll,
  type RollSpec,
  valueOfFace,
} from "./dice.ts";
import { facesOf } from "./diceInternal.ts";
import { rulesOf } from "./diceNormalize.ts";
import { diceOf } from "./diceRoll.ts";
import { evaluateMath } from "./math.ts";
import { type RandomSource, randomInt } from "./random.ts";

/**
 * The one set of rules for a throw, whether the faces come from a generator
 * or from a roll that was kept or shared. The kinds of dice are thrown in
 * order, and each die asked for is settled before the next is touched: it is
 * thrown; if it is to be rerolled it is thrown again (once, or until it
 * clears); if the face that stands is the highest and the dice explode it
 * throws another die, which follows the same rules. Then keep or drop picks
 * among that kind's dice left standing. Null when `draw` runs out.
 */
export function play(
  spec: RollSpec,
  draw: (group: DiceGroup, taken?: ReadonlySet<number>) => number | null,
): DieRoll[] | null {
  const groups = groupsOf(spec);
  const dice: DieRoll[] = [];
  let die = 0;
  for (const [index, group] of groups.entries()) {
    const rules = rulesOf(group);
    const mine: DieRoll[] = [];
    const thrown = (face: number, status: DieStatus, exploded: boolean, extra: boolean): DieRoll => {
      const one: DieRoll = { face, status, exploded, die };
      if (groups.length > 1) one.group = index;
      const custom = group.faces?.[face - 1];
      if (custom !== undefined) {
        one.label = custom.label;
        one.value = custom.value ?? 0;
      } else if (status === "kept") {
        const worth = rules.worth(face, extra);
        if (worth !== face) one.value = worth;
      }
      mine.push(one);
      return one;
    };
    // Dice that all differ are thrown from the faces not yet showing.
    const taken = group.unique === true ? new Set<number>() : undefined;
    for (let n = 0; n < group.count; n++, die++) {
      if (taken !== undefined) {
        const face = draw(group, taken);
        if (face === null) return null;
        taken.add(face);
        thrown(face, "kept", false, false);
        continue;
      }
      let explosions = group.explode === true ? MAX_EXPLOSIONS : 0;
      for (let extra = false; ; extra = true) {
        let face = draw(group);
        if (face === null) return null;
        if (rules.once(face)) {
          thrown(face, "rerolled", false, extra);
          face = draw(group);
          if (face === null) return null;
        }
        for (let again = 0; again < MAX_REROLLS && rules.until(face); again++) {
          thrown(face, "rerolled", false, extra);
          face = draw(group);
          if (face === null) return null;
        }
        const exploded = explosions > 0 && rules.explodes(face);
        thrown(face, "kept", exploded, extra);
        if (!exploded) break;
        explosions -= 1;
      }
    }
    if (group.keep !== "all") {
      // The best of the dice left standing, a tie going to the die thrown first.
      const standing = mine.filter((d) => d.status === "kept");
      const best = [...standing].sort((a, b) => (group.keep === "highest" ? b.face - a.face : a.face - b.face));
      const keeping = new Set(best.slice(0, keptCount(group)));
      for (const d of standing) if (!keeping.has(d)) d.status = "dropped";
    }
    if (group.success !== undefined || group.critical !== undefined || group.fumble !== undefined) {
      // What is compared: each die for what it is worth, or a compounding die's whole chain, read on its last die.
      const whole = group.explodeKind === "compound" || group.explodeKind === "compound-penetrating";
      const standing = mine.filter((d) => d.status === "kept");
      const chain = new Map<number, number>();
      for (const d of standing) chain.set(d.die, (chain.get(d.die) ?? 0) + (d.value ?? d.face));
      for (const d of standing) {
        if (whole && d.exploded) continue;
        const worth = whole ? (chain.get(d.die) as number) : (d.value ?? d.face);
        if (group.success !== undefined && meets(group.success, worth)) d.counts = 1;
        else if (group.failure !== undefined && meets(group.failure, worth)) d.counts = -1;
        if (group.critical !== undefined && meets(group.critical, worth)) d.critical = "success";
        else if (group.fumble !== undefined && meets(group.fumble, worth)) d.critical = "failure";
      }
    }
    dice.push(...mine);
  }
  return dice;
}

let counter = 0;

/**
 * One die thrown from a source. A fair die is one fair pick among its faces.
 * A loaded die is one fair pick among its weights, all laid end to end, so
 * the source is drawn from in the same way and a seed replays a loaded roll
 * as exactly as a fair one.
 */
export function draws(source: RandomSource): (group: DiceGroup, taken?: ReadonlySet<number>) => number {
  return (group, taken) => {
    const { low, high } = facesOf(group);
    if (taken !== undefined) {
      // One fair pick among the faces not yet showing, counted up from the lowest.
      let pick = randomInt(source, high - low + 1 - taken.size);
      let face = low;
      for (; face <= high; face++) {
        if (taken.has(face)) continue;
        if (pick === 0) break;
        pick -= 1;
      }
      return face;
    }
    if (group.weights === undefined) return randomInt(source, high - low + 1) + low;
    let pick = randomInt(
      source,
      group.weights.reduce((a, b) => a + b, 0),
    );
    let face = low;
    for (const weight of group.weights) {
      if (pick < weight) break;
      pick -= weight;
      face += 1;
    }
    return face;
  };
}

/** The kept dice added up by what each is worth, plus the bonus. */
export function totalOfDice(spec: RollSpec, dice: readonly DieRoll[]): number {
  const groups = groupsOf(spec);
  const totals = groups.map(() => 0);
  for (const die of dice) {
    if (die.status !== "kept") continue;
    const at = die.group ?? 0;
    const group = groups[at] ?? (groups[0] as DiceGroup);
    totals[at] =
      (totals[at] as number) +
      (group.success !== undefined ? (die.counts ?? 0) : (die.value ?? valueOfFace(group, die.face)));
  }
  if (spec.math !== undefined) return evaluateMath(spec.math, totals);
  return totals.reduce((sum, total) => sum + total, spec.modifier);
}

/** What each kind of dice of a roll came to, in order: what a formula puts together.
 *
 * @param roll - The completed roll to read or record.
 * @returns What each kind of dice of a roll came to, in order: what a formula puts together.

 *
 * @example
 * ```ts
 * import { groupTotals } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec, rollFrom } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * const sample = rollFrom(spec, [2, 5], "saved", 0, null)!;
 * console.log(groupTotals(sample));
 * ```
 */
export function groupTotals(roll: Roll): number[] {
  const groups = groupsOf(roll.spec);
  const totals = groups.map(() => 0);
  for (const die of diceOf(roll)) {
    if (die.status !== "kept") continue;
    const at = die.group ?? 0;
    const group = groups[at] ?? (groups[0] as DiceGroup);
    totals[at] =
      (totals[at] as number) +
      (group.success !== undefined ? (die.counts ?? 0) : (die.value ?? valueOfFace(group, die.face)));
  }
  return totals;
}

export function made(fair: RollSpec, dice: DieRoll[], source: RandomSource, at: number): Roll {
  const faces = dice.map((d) => d.face);
  const kept = dice.map((d) => d.status === "kept");
  counter = (counter + 1) % 1_000_000;
  const thrown: Roll = {
    id: `${at.toString(36)}-${counter.toString(36)}`,
    spec: fair,
    faces,
    kept,
    total: totalOfDice(fair, dice),
    at,
    seed: source.seed,
    dice,
  };
  if (isLoaded(fair)) thrown.loaded = true;
  return thrown;
}
