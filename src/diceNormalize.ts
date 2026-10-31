import {
  type Compare,
  type CustomFace,
  chancesOf,
  compareText,
  DEFAULT_SPEC,
  type DiceGroup,
  diceCount,
  dieName,
  faceRange,
  groupsOf,
  isPlainDice,
  isSides,
  type Keep,
  keptCount,
  MAX_DICE,
  MAX_DICE_BY_CODE,
  MAX_EXPLOSIONS,
  MAX_FACE_VALUE,
  MAX_FACES,
  MAX_GROUPS,
  MAX_LABEL,
  MAX_LOADED_SIDES,
  MAX_MODIFIER,
  MAX_REROLLS,
  MAX_ROLL_LABEL,
  MAX_TIMES,
  MAX_UNIQUE_SIDES,
  MAX_WEIGHT,
  MIN_DICE,
  MIN_SIDES,
  mayExplode,
  mayReroll,
  mayRerollUntil,
  meets,
  playsByNewRules,
  type RollSpec,
  type Sides,
  valueOfFace,
} from "./dice.ts";
import { copyRules, facesOf } from "./diceInternal.ts";
import { checkMath, soundMath } from "./math.ts";

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

/** Characters a custom face's words may not hold: the ones notation is written with. */
const NOT_IN_A_LABEL = /[,[\]{}=#+]/;
/** A control character: a new line, a tab, a bell. None belongs in a face's words. */
const isControl = (text: string) =>
  [...text].some((c) => (c.codePointAt(0) as number) < 32 || c.codePointAt(0) === 127);

/** A custom die's faces, checked: the faces as given if every one is sound, or undefined.
 *
 * @param faces - Physical face values, in the order thrown.
 * @returns A custom die's faces, checked: the faces as given if every one is sound, or undefined.

 *
 * @example
 * ```ts
 * import { customFaces } from "@johnmorrisdotca/korokoro";
 * console.log(customFaces([{ label: "Hit", value: 1 }, { label: "Miss", value: 0 }])?.map((face) => face.label));
 * ```
 */
export function customFaces(faces: unknown): CustomFace[] | undefined {
  if (!Array.isArray(faces) || faces.length < MIN_SIDES || faces.length > MAX_FACES) return undefined;
  const sound: CustomFace[] = [];
  for (const given of faces as unknown[]) {
    if (typeof given !== "object" || given === null) return undefined;
    const { label, value, colour } = given as Record<string, unknown>;
    if (
      typeof label !== "string" ||
      label !== label.trim() ||
      label === "" ||
      [...label].length > MAX_LABEL ||
      NOT_IN_A_LABEL.test(label) ||
      isControl(label)
    )
      return undefined;
    const face: CustomFace = { label };
    if (value !== undefined) {
      if (typeof value !== "number" || !Number.isInteger(value) || Math.abs(value) > MAX_FACE_VALUE) return undefined;
      face.value = value;
    }
    if (colour !== undefined) {
      if (typeof colour !== "string" || !/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(colour)) return undefined;
      face.colour = colour.toLowerCase();
    }
    sound.push(face);
  }
  return sound;
}

/**
 * A loaded die's weights, checked and in lowest terms: one whole number from
 * 0 to `MAX_WEIGHT` for each face, at least two faces that can come up.
 * Undefined when they are not sound, and also when every face weighs the
 * same, which is a fair die and must not be called loaded.
 *
 * @param sides - A numbered die size or F for Fate dice.
 * @param weights - One integer weight per physical face.
 * @returns A loaded die's weights, checked and in lowest terms: one whole number from 0 to `MAX_WEIGHT` for each face, at least two faces that can come up. undefined when they are not sound, and also when every face weighs the same, which is a fair die and must not be called loaded.

 *
 * @example
 * ```ts
 * import { loadedWeights } from "@johnmorrisdotca/korokoro";
 * console.log(loadedWeights(6, [1, 1, 1, 1, 1, 3]));
 * ```
 */
export function loadedWeights(sides: Sides, weights: unknown): number[] | undefined {
  if (sides === "F" || sides > MAX_LOADED_SIDES || !Array.isArray(weights) || weights.length !== sides)
    return undefined;
  if (!weights.every((w) => typeof w === "number" && Number.isInteger(w) && w >= 0 && w <= MAX_WEIGHT))
    return undefined;
  const all = weights as number[];
  if (all.filter((w) => w > 0).length < 2) return undefined;
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const common = all.reduce(gcd);
  const least = all.map((w) => w / common);
  return least.every((w) => w === 1) ? undefined : least;
}

/** A roll's label, checked: a few words with no control characters and nothing notation is written with, or undefined.
 *
 * @param label - The optional short text that describes a roll.
 * @returns A roll's label, checked: a few words with no control characters and nothing notation is written with, or undefined.

 *
 * @example
 * ```ts
 * import { rollLabel } from "@johnmorrisdotca/korokoro";
 * console.log(rollLabel(" fire damage "));
 * ```
 */
export function rollLabel(label: unknown): string | undefined {
  if (typeof label !== "string") return undefined;
  const words = label.trim().replace(/\s+/g, " ");
  // Only digits is no label: `2d6 # 3` is somebody reaching for a repeat, which is written `3#2d6`.
  if (
    words === "" ||
    [...words].length > MAX_ROLL_LABEL ||
    isControl(words) ||
    /[#[\]{}]/.test(words) ||
    /^\d+$/.test(words)
  )
    return undefined;
  return words;
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

/** The modifiers of one kind of dice as notation writes them, in the one order they are written: `>=8f=1!`, `r<3kh3`. Two kinds with the same die and the same text here are the same dice under the same rules.
 *
 * @param group - One kind of dice and its rules.
 * @returns The modifiers of one kind of dice as notation writes them, in the one order they are written: `>=8f=1!`, `r<3kh3`. Two kinds with the same die and the same text here are the same dice under the same rules.

 *
 * @example
 * ```ts
 * import { rulesText } from "@johnmorrisdotca/korokoro";
 * import { parseNotation } from "@johnmorrisdotca/korokoro";
 * console.log(rulesText(parseNotation("4d6kh3")!));
 * ```
 */
export function rulesText(group: DiceGroup): string {
  const count =
    group.success === undefined
      ? ""
      : `${compareText(group.success)}${group.failure === undefined ? "" : `f${compareText(group.failure)}`}`;
  const kind =
    group.explodeKind === undefined
      ? "!"
      : group.explodeKind === "compound"
        ? "!!"
        : group.explodeKind === "penetrating"
          ? "!p"
          : "!!p";
  const explode =
    group.explode === true ? `${kind}${group.explodeWhen === undefined ? "" : compareText(group.explodeWhen)}` : "";
  const reroll =
    group.rerollUntil !== undefined
      ? `r<${group.rerollUntil + 1}`
      : group.reroll !== undefined
        ? `ro<${group.reroll + 1}`
        : group.rerollUntilWhen !== undefined
          ? `r${compareText(group.rerollUntilWhen)}`
          : group.rerollWhen !== undefined
            ? `ro${compareText(group.rerollWhen)}`
            : "";
  const keep = group.keep === "all" ? "" : `${group.keep === "highest" ? "kh" : "kl"}${group.keepCount ?? 1}`;
  const clamp = `${group.floor === undefined ? "" : `min${group.floor}`}${group.ceiling === undefined ? "" : `max${group.ceiling}`}`;
  const marks = `${group.critical === undefined ? "" : `cs${compareText(group.critical)}`}${group.fumble === undefined ? "" : `cf${compareText(group.fumble)}`}`;
  const sort = group.sort === undefined ? "" : group.sort === "ascending" ? "sa" : "sd";
  return `${count}${explode}${reroll}${keep}${clamp}${group.unique === true ? "u" : ""}${marks}${sort}`;
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
