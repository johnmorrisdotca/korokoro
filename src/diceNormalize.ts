import {
  type Compare,
  DEFAULT_SPEC,
  type DiceGroup,
  diceCount,
  dieName,
  faceRange,
  groupsOf,
  isPlainDice,
  isSides,
  type Keep,
  MAX_DICE,
  MAX_DICE_BY_CODE,
  MAX_GROUPS,
  MAX_MODIFIER,
  MAX_TIMES,
  MAX_UNIQUE_SIDES,
  MIN_DICE,
  mayExplode,
  mayReroll,
  mayRerollUntil,
  meets,
  playsByNewRules,
  type RollSpec,
  type Sides,
} from "./dice.ts";
import { copyRules } from "./diceInternal.ts";
import { customFaces, loadedWeights, rollLabel, rulesText } from "./diceLabels.ts";
import { dieOutcomes, groupRange } from "./diceOutcomes.ts";
import { checkMath, soundMath } from "./math.ts";

export { customFaces, loadedWeights, rollLabel, rulesText } from "./diceLabels.ts";
export { dieOutcomes, groupRange, keptFaces, rulesOf, totalOf } from "./diceOutcomes.ts";

/** The faces of a numbered die that meet a comparison. */
function facesMeeting(sides: Sides, compare: Compare): number[] {
  const { low, high } = faceRange(sides);
  const found: number[] = [];
  for (let face = low; face <= high; face++) if (meets(compare, face)) found.push(face);
  return found;
}

/** A comparison given by hand, checked: a whole number and one of the four ways of comparing. */
function soundCompare(given: unknown): Compare | undefined {
  if (typeof given !== "object" || given === null) return undefined;
  const { op, n } = given as Record<string, unknown>;
  if (
    (op !== "=" && op !== "<=" && op !== ">=" && op !== "<>") ||
    typeof n !== "number" ||
    !Number.isInteger(n) ||
    Math.abs(n) > 99_999
  )
    return undefined;
  return { op, n };
}

/**
 * The rules added in 1.7.0, checked for one kind of numbered dice and written
 * onto it. Each is kept only if it leaves something to roll: a reroll must
 * spare a face, an explosion must not take every face, a success must be
 * possible. A rule that cannot be kept is left out, never guessed at.
 * `problemWith` says which, for the strict reader.
 */
function newRules(group: Partial<DiceGroup>, fair: DiceGroup): void {
  const { sides } = fair;
  if (sides === "F") return;
  const all = sides;
  // Rerolls: a run of faces from the lowest is the older, plainer rule, and is kept as that.
  const asRun = (compare: Compare): number | undefined => {
    const found = facesMeeting(sides, compare);
    return found.length > 0 && found.every((face, i) => face === i + 1) ? found.length : undefined;
  };
  const until = soundCompare(group.rerollUntilWhen);
  const once = soundCompare(group.rerollWhen);
  if (fair.rerollUntil === undefined && fair.reroll === undefined) {
    if (until !== undefined) {
      const found = facesMeeting(sides, until).length;
      const run = asRun(until);
      if (found > 0 && found * 2 <= all) {
        if (run !== undefined) fair.rerollUntil = run;
        else fair.rerollUntilWhen = until;
      }
    } else if (once !== undefined) {
      const found = facesMeeting(sides, once).length;
      const run = asRun(once);
      if (found > 0 && found < all) {
        if (run !== undefined) fair.reroll = run;
        else fair.rerollWhen = once;
      }
    }
  }
  if (fair.explode === true) {
    const when = soundCompare(group.explodeWhen);
    if (when !== undefined) {
      const found = facesMeeting(sides, when);
      if (found.length > 0 && found.length < all && !(found.length === 1 && found[0] === all)) fair.explodeWhen = when;
    }
    if (
      group.explodeKind === "compound" ||
      group.explodeKind === "penetrating" ||
      group.explodeKind === "compound-penetrating"
    )
      fair.explodeKind = group.explodeKind;
  }
  const whole = (n: unknown): n is number => typeof n === "number" && Number.isInteger(n);
  if (whole(group.floor) && group.floor > 1 && group.floor <= all) fair.floor = group.floor;
  if (
    whole(group.ceiling) &&
    group.ceiling >= 1 &&
    group.ceiling < all &&
    (fair.floor === undefined || fair.floor <= group.ceiling)
  )
    fair.ceiling = group.ceiling;
  // Counting: over every die of the kind, so not together with keep or drop.
  const success = soundCompare(group.success);
  if (success !== undefined && fair.keep === "all" && mayCount(fair, success)) {
    fair.success = success;
    const failure = soundCompare(group.failure);
    if (
      failure !== undefined &&
      mayCount(fair, failure) &&
      !worthsOf(fair).some((v) => meets(success, v) && meets(failure, v))
    )
      fair.failure = failure;
  }
  const critical = soundCompare(group.critical);
  if (critical !== undefined && mayCount(fair, critical)) fair.critical = critical;
  const fumble = soundCompare(group.fumble);
  if (fumble !== undefined && mayCount(fair, fumble)) fair.fumble = fumble;
  if (group.sort === "ascending" || group.sort === "descending") fair.sort = group.sort;
  // Dice that all differ: fair dice of a hundred sides or fewer, no more of them than faces, all added, under no rule that throws a die again.
  if (
    group.unique === true &&
    all <= MAX_UNIQUE_SIDES &&
    fair.count > 1 &&
    fair.count <= all &&
    fair.keep === "all" &&
    fair.weights === undefined &&
    fair.explode !== true &&
    fair.reroll === undefined &&
    fair.rerollUntil === undefined &&
    !playsByNewRules(fair)
  )
    fair.unique = true;
}

/** Every amount one die of a kind can be worth once its rules are applied: what a success or a mark is compared with. */
function worthsOf(group: DiceGroup): number[] {
  const { least, chances } = dieOutcomes({ ...group, success: undefined, failure: undefined });
  return chances.flatMap((p, i) => (p > 0 ? [least + i] : []));
}

/** Whether a comparison can be met by some die of the kind, and is not met by every one. */
function mayCount(group: DiceGroup, compare: Compare): boolean {
  const worths = worthsOf(group);
  const met = worths.filter((v) => meets(compare, v)).length;
  return met > 0 && met < worths.length;
}

/** One kind of dice brought into range, its count already settled. */
function normalizeGroup(group: Partial<DiceGroup>, count: number): DiceGroup {
  // A custom die is its faces and nothing else: it takes no modifiers.
  const faces = customFaces(group.faces);
  if (faces !== undefined) return { count, sides: faces.length, keep: "all", faces };
  const sides = isSides(group.sides) ? group.sides : DEFAULT_SPEC.sides;
  // Keeping one of one die is simply rolling it.
  const keep: Keep = count > 1 && (group.keep === "highest" || group.keep === "lowest") ? group.keep : "all";
  const fair: DiceGroup = { count, sides, keep };
  if (keep !== "all") {
    const kept = Math.min(count - 1, Math.max(1, Math.trunc(Number(group.keepCount) || 1)));
    if (kept > 1) fair.keepCount = kept;
  }
  if (group.explode === true && mayExplode(sides, keep)) fair.explode = true;
  // A die is rerolled one way or the other; until clear wins when both are asked.
  if (mayRerollUntil(sides, group.rerollUntil)) fair.rerollUntil = group.rerollUntil;
  else if (mayReroll(sides, group.reroll)) fair.reroll = group.reroll;
  const weights = loadedWeights(sides, group.weights);
  if (weights !== undefined) fair.weights = weights;
  newRules(group, fair);
  return fair;
}

/** Whether two kinds are the same dice under the same rules, all of them added: then they are one kind with more dice. */
function sameDice(a: DiceGroup, b: DiceGroup): boolean {
  return dieName(a) === dieName(b) && a.keep === "all" && b.keep === "all" && rulesText(a) === rulesText(b);
}

/**
 * A spec brought into range, so a hand-typed or stored one can never roll
 * eleven dice, five kinds or a die with no faces. A part that cannot be kept
 * is left out, never guessed at; `checkNotation` is the strict reader, and
 * says which part. Two kinds that are the same dice under the same rules
 * become one: `2d6+3d6` is `5d6`.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @param limits - Optional limits for callers that allow larger plain pools.
 * @returns A spec brought into range, so a hand-typed or stored one can never roll eleven dice, five kinds or a die with no faces. A part that cannot be kept is left out, never guessed at; `checkNotation` is the strict reader, and says which part. Two kinds that are the same dice under the same rules become one: `2d6+3d6` is `5d6`.

 *
 * @example
 * ```ts
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * console.log(normalizeSpec({ count: 2, sides: 6 }));
 * ```
 */
export function normalizeSpec(spec: Partial<RollSpec>, limits: { maxDice?: number } = {}): RollSpec {
  const most = Math.min(MAX_DICE_BY_CODE, Math.max(MAX_DICE, Math.trunc(Number(limits.maxDice) || MAX_DICE)));
  const made = normalized(spec, most);
  // Past ten dice every kind has to be plain; a roll that is not is brought back to ten.
  if (most > MAX_DICE && diceCount(made) > MAX_DICE && !groupsOf(made).every(isPlainDice))
    return normalized(spec, MAX_DICE);
  return made;
}

function normalized(spec: Partial<RollSpec>, most: number): RollSpec {
  const count = Math.min(most, Math.max(MIN_DICE, Math.trunc(Number(spec.count) || DEFAULT_SPEC.count)));
  const modifier = Math.min(MAX_MODIFIER, Math.max(-MAX_MODIFIER, Math.trunc(Number(spec.modifier) || 0)));
  const groups: DiceGroup[] = [normalizeGroup(spec, count)];
  const given = Array.isArray(spec.more) ? spec.more : [];
  // A formula names each kind by its place, so its kinds are kept apart and in place; without one, two kinds that are the same dice are one.
  let math = soundMath(spec.math);
  let room = most - count;
  for (const next of given) {
    if (room < 1) break;
    if (typeof next !== "object" || next === null || !isSides(next.sides)) continue;
    const asked = Math.min(room, Math.max(MIN_DICE, Math.trunc(Number(next.count) || 1)));
    const group = normalizeGroup(next, asked);
    const twin = math === undefined ? groups.find((g) => sameDice(g, group)) : undefined;
    if (twin !== undefined) twin.count += group.count;
    else if (groups.length < MAX_GROUPS) groups.push(group);
    else continue;
    room -= group.count;
  }
  // A formula that no longer fits its dice, or cannot be used, is left out: the kinds are then simply added.
  if (math !== undefined && (groups.length !== given.length + 1 || checkMath(math, groups.map(groupRange)) !== null))
    math = undefined;
  const [first, ...more] = groups as [DiceGroup, ...DiceGroup[]];
  const fair: RollSpec = {
    count: first.count,
    sides: first.sides,
    modifier: math === undefined ? modifier : 0,
    keep: first.keep,
  };
  copyRules(first, fair);
  if (more.length > 0) fair.more = more;
  const times = Math.min(MAX_TIMES, Math.trunc(Number(spec.times) || 1));
  if (times > 1) fair.times = times;
  if (math !== undefined) fair.math = math;
  const label = rollLabel(spec.label);
  if (label !== undefined) fair.label = label;
  return fair;
}
