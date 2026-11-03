import { copyRules, facesOf } from "./diceInternal.ts";
import type { DieSides, Sides } from "./diceLimits.ts";
import { DIE_SIDES, MAX_EXPLODING_SIDES, MAX_SIDES, MIN_SIDES } from "./diceLimits.ts";
import { normalizeSpec } from "./diceNormalize.ts";
import type { CustomFace, DiceGroup, Keep, RollSpec } from "./diceSpec.ts";

/** One of the dice the tray has a button for.
 *
 * @param value - The candidate face, value or name to check.
 * @returns One of the dice the tray has a button for.

 *
 * @example
 * ```ts
 * import { isDieSides } from "@johnmorrisdotca/korokoro";
 * console.log(isDieSides(20), isDieSides(7));
 * ```
 */
export function isDieSides(value: unknown): value is DieSides {
  return typeof value === "number" && (DIE_SIDES as readonly number[]).includes(value);
}

/** Any die this package can throw: two to a thousand sides, or a Fate die.
 *
 * @param value - The candidate face, value or name to check.
 * @returns Any die this package can throw: two to a thousand sides, or a Fate die.

 *
 * @example
 * ```ts
 * import { isSides } from "@johnmorrisdotca/korokoro";
 * console.log(isSides(7), isSides("F"));
 * ```
 */
export function isSides(value: unknown): value is Sides {
  return (
    value === "F" || (typeof value === "number" && Number.isInteger(value) && value >= MIN_SIDES && value <= MAX_SIDES)
  );
}

/** The lowest and highest face of one die.
 *
 * @param sides - A numbered die size or F for Fate dice.
 * @returns The lowest and highest face of one die.

 *
 * @example
 * ```ts
 * import { faceRange } from "@johnmorrisdotca/korokoro";
 * console.log(faceRange("F"));
 * ```
 */
export function faceRange(sides: Sides): { low: number; high: number } {
  return sides === "F" ? { low: -1, high: 1 } : { low: 1, high: sides };
}

/** What a face of a group's die is worth in a total: its number, or for a custom face its value, which is 0 when it is only words.
 *
 * @param group - One kind of dice and its rules.
 * @param face - The physical face value to display or read.
 * @returns What a face of a group's die is worth in a total: its number, or for a custom face its value, which is 0 when it is only words.

 *
 * @example
 * ```ts
 * import { valueOfFace } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(valueOfFace(spec, 4));
 * ```
 */
export function valueOfFace(group: DiceGroup, face: number): number {
  return group.faces !== undefined ? (group.faces[face - 1]?.value ?? 0) : face;
}

/** The chance of each face of one die of a group, from its lowest face up. They sum to 1; a fair die's are all the same.
 *
 * @param group - One kind of dice and its rules.
 * @returns The chance of each face of one die of a group, from its lowest face up. They sum to 1; a fair die's are all the same.

 *
 * @example
 * ```ts
 * import { chancesOf } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(chancesOf(spec));
 * ```
 */
export function chancesOf(group: DiceGroup): number[] {
  const { low, high } = facesOf(group);
  const n = high - low + 1;
  if (group.weights === undefined) return new Array<number>(n).fill(1 / n);
  const all = group.weights.reduce((a, b) => a + b, 0);
  return group.weights.map((w) => w / all);
}

/**
 * What one kind of die is called: `d6`, `dF`, a loaded `d6{6:3}`, a custom
 * `d[Yes,No,Maybe]`. It is how the kind is written in notation, so two dice
 * with the same name are the same die.
 *
 * @param group - One kind of dice and its rules.
 * @returns What one kind of die is called: `d6`, `dF`, a loaded `d6{6:3}`, a custom `d[Yes,No,Maybe]`. It is how the kind is written in notation, so two dice with the same name are the same die.

 *
 * @example
 * ```ts
 * import { dieName } from "@johnmorrisdotca/korokoro";
 * import { parseNotation } from "@johnmorrisdotca/korokoro";
 * console.log(dieName(parseNotation("4dF")!));
 * ```
 */
export function dieName(group: DiceGroup): string {
  if (group.faces !== undefined) {
    const face = (f: CustomFace) =>
      `${f.value !== undefined && f.label === String(f.value) ? f.label : f.value !== undefined ? `${f.label}=${f.value}` : f.label}${f.colour ?? ""}`;
    return `d[${group.faces.map(face).join(",")}]`;
  }
  if (group.weights === undefined) return `d${group.sides}`;
  const { low } = faceRange(group.sides);
  const loaded = group.weights.flatMap((w, i) => (w === 1 ? [] : [`${low + i}:${w}`]));
  return `d${group.sides}{${loaded.join(",")}}`;
}

/** Whether a roll has a loaded die in it.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @returns Whether a roll has a loaded die in it.

 *
 * @example
 * ```ts
 * import { isLoaded } from "@johnmorrisdotca/korokoro";
 * import { parseNotation } from "@johnmorrisdotca/korokoro";
 * console.log(isLoaded(parseNotation("1d6{6:3}")!));
 * ```
 */
export function isLoaded(spec: RollSpec): boolean {
  return groupsOf(spec).some((g) => g.weights !== undefined);
}

/**
 * Whether a roll is of plain fair dice and nothing else: no loaded die, and
 * no custom die either, whose faces are whatever somebody made them. A site
 * that wants only honest standard dice refuses anything this is false for.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @returns Whether a roll is of plain fair dice and nothing else: no loaded die, and no custom die either, whose faces are whatever somebody made them. A site that wants only honest standard dice refuses anything this is false for.

 *
 * @example
 * ```ts
 * import { isFair } from "@johnmorrisdotca/korokoro";
 * import { parseNotation } from "@johnmorrisdotca/korokoro";
 * console.log(isFair(parseNotation("1d6{6:3}")!));
 * ```
 */
export function isFair(spec: RollSpec): boolean {
  return groupsOf(spec).every((g) => g.weights === undefined && g.faces === undefined);
}

/**
 * Whether a roll's total says anything. It does unless every die in it is a
 * custom die with no numbers on it at all, such as Yes, No, Maybe: then the
 * roll is its faces' words, and the total is 0 and means nothing.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @returns Whether a roll's total says anything. It does unless every die in it is a custom die with no numbers on it at all, such as Yes, No, Maybe: then the roll is its faces' words, and the total is 0 and means nothing.

 *
 * @example
 * ```ts
 * import { hasTotal } from "@johnmorrisdotca/korokoro";
 * import { parseNotation } from "@johnmorrisdotca/korokoro";
 * console.log(hasTotal(parseNotation("2d[Left,Right]")!));
 * ```
 */
export function hasTotal(spec: RollSpec): boolean {
  return !groupsOf(spec).every((g) => g.faces?.every((f) => f.value === undefined) ?? false);
}

/** How many dice of one group count towards the total. For a roll of several kinds, ask each of `groupsOf`.
 *
 * @param group - One kind of dice and its rules.
 * @returns How many dice of one group count towards the total. For a roll of several kinds, ask each of `groupsOf`.

 *
 * @example
 * ```ts
 * import { keptCount } from "@johnmorrisdotca/korokoro";
 * import { parseNotation } from "@johnmorrisdotca/korokoro";
 * console.log(keptCount(parseNotation("4d6kh3")!));
 * ```
 */
export function keptCount(group: DiceGroup): number {
  return group.keep === "all" ? group.count : (group.keepCount ?? 1);
}

/** The kinds of dice in a roll, in order: the spec's own first, then the rest.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @returns The kinds of dice in a roll, in order: the spec's own first, then the rest.

 *
 * @example
 * ```ts
 * import { groupsOf } from "@johnmorrisdotca/korokoro";
 * import { parseNotation } from "@johnmorrisdotca/korokoro";
 * console.log(groupsOf(parseNotation("1d6+1d8")!).map((group) => group.sides));
 * ```
 */
export function groupsOf(spec: RollSpec): DiceGroup[] {
  const first: DiceGroup = { count: spec.count, sides: spec.sides, keep: spec.keep };
  copyRules(spec, first);
  return [first, ...(spec.more ?? [])];
}

/** How many dice a roll asks for, over all its kinds.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @returns How many dice a roll asks for, over all its kinds.

 *
 * @example
 * ```ts
 * import { diceCount } from "@johnmorrisdotca/korokoro";
 * import { parseNotation } from "@johnmorrisdotca/korokoro";
 * console.log(diceCount(parseNotation("2d6+1d8")!));
 * ```
 */
export function diceCount(spec: RollSpec): number {
  return groupsOf(spec).reduce((sum, group) => sum + group.count, 0);
}

/** A spec from its kinds of dice and a bonus, brought into range.
 *
 * @param groups - The dice groups to combine, in order.
 * @param modifier - The bonus added after the dice totals.
 * @returns A spec from its kinds of dice and a bonus, brought into range.

 *
 * @example
 * ```ts
 * import { specOf } from "@johnmorrisdotca/korokoro";
 * import { formatNotation } from "@johnmorrisdotca/korokoro";
 * console.log(formatNotation(specOf([{ count: 2, sides: 6 }, { count: 1, sides: 8 }], 3)));
 * ```
 */
export function specOf(groups: readonly Partial<DiceGroup>[], modifier = 0): RollSpec {
  const [first, ...more] = groups;
  return normalizeSpec({ ...first, modifier, more: more as DiceGroup[] });
}

/** Whether the dice may explode: numbered dice of a hundred sides or fewer, all of them kept. A custom die never does.
 *
 * @param sides - A numbered die size or F for Fate dice.
 * @param keep - Whether all dice, the highest or the lowest count.
 * @returns Whether the dice may explode: numbered dice of a hundred sides or fewer, all of them kept. A custom die never does.

 *
 * @example
 * ```ts
 * import { mayExplode } from "@johnmorrisdotca/korokoro";
 * console.log(mayExplode(6, "all"), mayExplode(1000, "all"));
 * ```
 */
export function mayExplode(sides: Sides, keep: Keep): boolean {
  return sides !== "F" && sides <= MAX_EXPLODING_SIDES && keep === "all";
}

/** Whether a reroll at this face leaves something to do: it must reroll the lowest face and spare the highest.
 *
 * @param sides - A numbered die size or F for Fate dice.
 * @param reroll - The highest face eligible for a reroll.
 * @returns Whether a reroll at this face leaves something to do: it must reroll the lowest face and spare the highest.

 *
 * @example
 * ```ts
 * import { mayReroll } from "@johnmorrisdotca/korokoro";
 * console.log(mayReroll(6, 2), mayReroll(6, 6));
 * ```
 */
export function mayReroll(sides: Sides, reroll: unknown): reroll is number {
  const { low, high } = faceRange(sides);
  return typeof reroll === "number" && Number.isInteger(reroll) && reroll >= low && reroll < high;
}

/** Whether a die may be rerolled until it clears this face: the reroll must match the lowest face and no more than half of them.
 *
 * @param sides - A numbered die size or F for Fate dice.
 * @param reroll - The highest face eligible for a reroll.
 * @returns Whether a die may be rerolled until it clears this face: the reroll must match the lowest face and no more than half of them.

 *
 * @example
 * ```ts
 * import { mayRerollUntil } from "@johnmorrisdotca/korokoro";
 * console.log(mayRerollUntil(6, 2), mayRerollUntil(6, 4));
 * ```
 */
export function mayRerollUntil(sides: Sides, reroll: unknown): reroll is number {
  const { low, high } = faceRange(sides);
  return mayReroll(sides, reroll) && (reroll - low + 1) * 2 <= high - low + 1;
}

/** Whether some dice of a roll can be held while the rest are thrown again: plain dice only, none rerolled, exploding, kept or dropped, counted, raised, lowered or sorted.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @returns Whether some dice of a roll can be held while the rest are thrown again: plain dice only, none rerolled, exploding, kept or dropped, counted, raised, lowered or sorted.

 *
 * @example
 * ```ts
 * import { canHold } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(canHold(spec));
 * ```
 */
export function canHold(spec: RollSpec): boolean {
  return (
    spec.math === undefined &&
    groupsOf(spec).every(
      (g) =>
        g.keep === "all" &&
        g.explode !== true &&
        g.reroll === undefined &&
        g.rerollUntil === undefined &&
        !playsByNewRules(g) &&
        g.sort === undefined &&
        g.unique !== true,
    )
  );
}

/**
 * Whether a kind of dice is played by a rule added in 1.7.0, one that changes
 * what it can total: a reroll or an explosion at a comparison, compounding or
 * penetrating dice, `min` or `max`, or counted successes. Marks (`cs`, `cf`)
 * and a sort change nothing about the total and are not among them.
 *
 * @param g - One kind of dice and its rules.
 * @returns Whether a kind of dice is played by a rule added in 1.7.0, one that changes what it can total: a reroll or an explosion at a comparison, compounding or penetrating dice, `min` or `max`, or counted successes. Marks (`cs`, `cf`) and a sort change nothing about the total and are not among them.

 *
 * @example
 * ```ts
 * import { playsByNewRules } from "@johnmorrisdotca/korokoro";
 * import { parseNotation } from "@johnmorrisdotca/korokoro";
 * console.log(playsByNewRules(parseNotation("3d6>=5")!));
 * ```
 */
export function playsByNewRules(g: DiceGroup): boolean {
  return (
    g.rerollWhen !== undefined ||
    g.rerollUntilWhen !== undefined ||
    g.explodeWhen !== undefined ||
    g.explodeKind !== undefined ||
    g.floor !== undefined ||
    g.ceiling !== undefined ||
    g.success !== undefined
  );
}

/** Whether a kind of dice is counted for successes, not added up.
 *
 * @param group - One kind of dice and its rules.
 * @returns Whether a kind of dice is counted for successes, not added up.

 *
 * @example
 * ```ts
 * import { countsSuccesses } from "@johnmorrisdotca/korokoro";
 * import { parseNotation } from "@johnmorrisdotca/korokoro";
 * console.log(countsSuccesses(parseNotation("3d6>=5")!));
 * ```
 */
export function countsSuccesses(group: DiceGroup): boolean {
  return group.success !== undefined;
}

/** Whether the first thing a roll says is a number of successes: every kind of dice in it is counted.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @returns Whether the first thing a roll says is a number of successes: every kind of dice in it is counted.

 *
 * @example
 * ```ts
 * import { isSuccessRoll } from "@johnmorrisdotca/korokoro";
 * import { parseNotation } from "@johnmorrisdotca/korokoro";
 * console.log(isSuccessRoll(parseNotation("3d6>=5")!));
 * ```
 */
export function isSuccessRoll(spec: RollSpec): boolean {
  return spec.math === undefined && groupsOf(spec).every(countsSuccesses);
}

/** Whether a kind of dice is plain enough to be rolled in any number: a fair numbered or Fate die, all added or one kept, under no other rule.
 *
 * @param g - One kind of dice and its rules.
 * @returns Whether a kind of dice is plain enough to be rolled in any number: a fair numbered or Fate die, all added or one kept, under no other rule.

 *
 * @example
 * ```ts
 * import { isPlainDice } from "@johnmorrisdotca/korokoro";
 * import { normalizeSpec } from "@johnmorrisdotca/korokoro";
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * console.log(isPlainDice(spec));
 * ```
 */
export function isPlainDice(g: DiceGroup): boolean {
  return (
    g.faces === undefined &&
    g.weights === undefined &&
    g.explode !== true &&
    g.reroll === undefined &&
    g.rerollUntil === undefined &&
    !playsByNewRules(g) &&
    g.unique !== true &&
    (g.keep === "all" || (g.keepCount ?? 1) === 1)
  );
}
