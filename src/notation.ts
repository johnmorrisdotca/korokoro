import {
  type DiceGroup,
  diceCount,
  dieName,
  groupRange,
  groupsOf,
  isPlainDice,
  MAX_DICE,
  MAX_GROUPS,
  MAX_MODIFIER,
  MAX_TIMES,
  normalizeSpec,
  type RollSpec,
  rollLabel,
  rulesText,
} from "./dice.ts";
import { checkMath, MAX_MATH_NUMBER, type MathFunction, type MathNode, mathText } from "./math.ts";
import { BONUS, LONGEST, MORE, mostDice, readGroup, refuse, tooMany } from "./notationGroup.ts";

/**
 * Dice notation, the way a character sheet writes it.
 *
 *   set      = [times "#"] roll [ "#" label ]   the roll thrown several times: 6#4d6dl1
 *   times    = 1 to 100
 *   roll     = dice { "+" dice } [bonus]
 *   dice     = [count] "d" sides { modifier }
 *   count    = 1 to 10 over the whole roll, and 1 when left out
 *   sides    = 2 to 1000, "%" for 100, or "F" for a Fate die
 *            | number "{" face ":" weight { "," face ":" weight } "}"    a loaded die
 *            | "[" face { "," face } "]"                                a custom die
 *   face     = words [ "=" value ] [ "#" colour ]    in a custom die; a number alone is worth itself
 *   modifier = "!" | "!!" | "!p" | "!!p"    the dice explode: each a die of its own, compounding, penetrating, or both
 *              [ compare ]                  … on these faces and not only the highest: !>=5
 *            | "r" [point]                  reroll until clear: r<3, r=1, r1, r>=5; "r" alone is the lowest face
 *            | "ro" [point]                 reroll once: ro<3, ro=1
 *            | "kh" [n] | "kl" [n]          keep the highest or lowest n (1 when left out); "k" and "b" are kh, "w" is kl
 *            | "dh" [n] | "dl" [n]          drop the highest or lowest n; "d" alone is dl
 *            | "min" n | "max" n            a die counts for at least, or at most, n
 *            | compare                      count successes: the total is how many dice meet it
 *            | "f" point                    with a count: each die meeting it takes a success away
 *            | "cs" [point] | "cf" [point]  mark dice as critical successes or failures; alone, the highest and the lowest face
 *            | "sa" | "sd" | "s"            show the dice sorted, ascending (or "s") or descending
 *   compare  = ( "=" | "<" | ">" | "<=" | ">=" | "<>" ) number
 *   point    = compare | "!=" number | number      a bare number is "="
 *   bonus    = "+" or "-", then 0 to 99
 *   label    = up to 40 characters, saying what the roll is for; "[label]" in front of the roll is read too
 *
 * Letters in either case, spaces anywhere between the parts. Up to four
 * kinds of dice are added together, each with its own modifiers, and the
 * bonus comes last. `6#` in front throws the whole roll six times
 * as a set (`rollMany`); it is a prefix so that it can never be read as
 * arithmetic. A kind's modifiers may come in any order and each at
 * most once; whatever order they are written in, a die is rerolled first,
 * then explodes, and keeping or dropping is decided last. Exploding dice are
 * not kept or dropped.
 *
 * A loaded die is a numbered die with some faces weighted: `d6{6:3}` shows
 * its 6 three times in eight, and every face not named weighs 1. A custom die
 * is its faces: `d[Yes,No,Maybe]`, `d[Hit=1,Miss=0,Miss=0]`, and a face
 * written twice comes up twice as often. Neither can be written, read or
 * shared as a fair die: the braces and the brackets are part of its name.
 * A custom die takes no modifiers.
 *
 * `r` follows Roll20 and the dice libraries that follow it: it rerolls until
 * the die is clear, and `ro` rerolls once. Until 1.4.0 this package's `r`
 * rerolled once; `parseNotation(text, { legacyReroll: true })` reads text
 * written then.
 *
 * @example
 * ```ts
 * import type { NotationProblem } from "@johnmorrisdotca/korokoro";
 * const value: NotationProblem = "count";
 * console.log(value);
 * ```
 */
export type NotationProblem =
  /** Not dice notation at all. */
  | "shape"
  /** More dice than ten, or none. */
  | "count"
  /** A die with fewer than two sides or more than a thousand. */
  | "sides"
  /** A bonus past 99 either way. */
  | "bonus"
  /** The same kind of modifier twice, or keep and drop together. */
  | "twice"
  /** Keeping or dropping that leaves every die, or none. */
  | "keep"
  /** A reroll that would reroll no face or every face, or a reroll until clear of more than half the faces. */
  | "reroll"
  /** Exploding dice that cannot: Fate dice, dice past a hundred sides, or dice also kept or dropped. */
  | "explode"
  /** More than four kinds of dice in one roll. */
  | "kinds"
  /** Dice taken away: only the bonus can be subtracted. */
  | "minus"
  /** A roll repeated no times, or more than a hundred. */
  | "times"
  /** A custom die whose faces cannot be read, or one given modifiers. */
  | "custom"
  /** Successes that cannot be counted: a comparison no die can meet or every die meets, a failure without a success or overlapping it, or counting together with keep or drop. */
  | "successes"
  /** A `min` or `max` that changes nothing or leaves nothing: outside the die's faces, or the least above the most. */
  | "clamp"
  /** A `cs` or `cf` that no die can meet, or every die meets. */
  | "marks"
  /** Dice that cannot all differ: more dice than faces, a die past a hundred sides, a loaded or Fate die, another rule beside it, or `uo`, which is not read. */
  | "unique"
  /** A formula that cannot be read or used: brackets that do not match, a function it does not know, a number past 9999, a group that keeps other than one of its rolls, or totals too wide to count. */
  | "math"
  /** A formula that can come to something other than a whole number: a division that is not rounded. */
  | "fraction"
  /** A formula that can divide by nothing. */
  | "zero"
  /** A label that is too long, or holds characters notation is written with. */
  | "label"
  /** A loaded die whose weights cannot be read: a face the die does not have, a weight past 99, fewer than two faces that can come up, a die too large to load, or weights that are all the same. */
  | "weights";

/** What `checkNotation` found: the spec, or the part it refused and why.
 *
 * @example
 * ```ts
 * import type { NotationCheck } from "@johnmorrisdotca/korokoro";
 * import { checkNotation } from "@johnmorrisdotca/korokoro";
 * const value: NotationCheck = checkNotation("2d6");
 * console.log(value.ok);
 * ```
 */
export type NotationCheck =
  | { ok: true; spec: RollSpec }
  | {
      ok: false;
      problem: NotationProblem;
      /** The piece of the text that was refused, as typed. */
      part: string;
      /** The refusal in a plain English sentence. */
      message: string;
    };

/** How to read a notation.
 *
 * @example
 * ```ts
 * import type { NotationOptions } from "@johnmorrisdotca/korokoro";
 * const value: NotationOptions = { legacyReroll: true, maxDice: 20 };
 * console.log(value.legacyReroll);
 * ```
 */
export type NotationOptions = {
  /** Read `r<` as 1.2.0 and 1.3.0 wrote it: reroll once. For text kept from those versions, such as an old shared link. */
  legacyReroll?: boolean;
  /** The most dice the roll may have, from 10 (the default) to `MAX_DICE_BY_CODE`. Past ten, every kind has to be plain dice, all added or one kept. */
  maxDice?: number;
};

/** Where a label's `#` is: the first one outside a custom die's brackets and a loaded die's braces. −1 when there is none. */
function labelStart(text: string): number {
  let depth = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === "[" || c === "{") depth += 1;
    else if (c === "]" || c === "}") depth = Math.max(0, depth - 1);
    else if (c === "#" && depth === 0) return i;
  }
  return -1;
}

/** A spec from notation, or which part of the text was refused and why. Never a roll of something else.
 *
 * @param text - Text to parse, validate or format.
 * @param options - Options for this call; omitted fields keep their documented defaults.
 * @returns A spec from notation, or which part of the text was refused and why. Never a roll of something else.

 *
 * @example
 * ```ts
 * import { checkNotation } from "@johnmorrisdotca/korokoro";
 * console.log(checkNotation("not dice"));
 * ```
 */
export function checkNotation(text: string, options: NotationOptions = {}): NotationCheck {
  if (text.length > LONGEST) return refuse("shape", `${text.slice(0, 16)}…`);
  let rest = text;
  // `6#`: the roll after it is thrown six times, as a set.
  let times = 1;
  const repeat = /^\s*(\d+)\s*#/.exec(text);
  if (repeat !== null) {
    times = Number(repeat[1]);
    if (times < 1 || times > MAX_TIMES) return refuse("times", repeat[0]);
    rest = text.slice(repeat[0].length);
  }
  // A label: `[fire] 2d6` in front, or `2d6 # fire` behind. A custom die's brackets follow a d, and its colours sit inside them.
  let label: string | undefined;
  const front = /^\s*\[([^\]]*)\]/.exec(rest);
  if (front !== null) {
    label = rollLabel(front[1]);
    if (label === undefined) return refuse("label", front[0]);
    rest = rest.slice(front[0].length);
  }
  const hash = labelStart(rest);
  if (hash >= 0) {
    const behind = rollLabel(rest.slice(hash + 1));
    if (behind === undefined || label !== undefined) return refuse("label", rest.slice(hash));
    label = behind;
    rest = rest.slice(0, hash);
  }
  const flat = readFlat(rest, options, times, label);
  if (flat.ok || !looksLikeMath(rest)) return flat;
  return readMath(rest, options, times, label);
}

/** The roll this package has always read: kinds of dice added together, then a bonus. */
function readFlat(text: string, options: NotationOptions, times: number, label: string | undefined): NotationCheck {
  const groups: (Partial<DiceGroup> & { count: number })[] = [];
  let rest = text;
  let dice = 0;
  for (;;) {
    const from = rest;
    const read = readGroup(rest, options);
    if ("ok" in read) return read;
    dice += read.group.count;
    // The kind that takes the roll past its most dice is the part refused.
    if (dice > mostDice(options)) return tooMany(from.slice(0, from.length - read.rest.length), options);
    if (groups.length === MAX_GROUPS) return refuse("kinds", from.slice(0, from.length - read.rest.length));
    groups.push(read.group);
    rest = read.rest;
    const more = MORE.exec(rest);
    if (more === null) break;
    if (more[1] === "-") return refuse("minus", rest);
    rest = rest.slice(more[0].length);
  }

  let modifier = 0;
  if (rest.trim() !== "") {
    const bonus = BONUS.exec(rest);
    if (bonus === null) return refuse("shape", rest);
    modifier = Number(bonus[2]) * (bonus[1] === "-" ? -1 : 1);
    if (Math.abs(modifier) > MAX_MODIFIER) return refuse("bonus", rest);
  }
  const [first, ...more] = groups;
  const spec = normalizeSpec(
    { ...first, modifier, more: more as DiceGroup[], times, label },
    { maxDice: mostDice(options) },
  );
  // Past ten dice only plain dice are rolled: a roll that was brought back to ten is refused, not shortened.
  if (diceCount(spec) < dice) return tooMany(text, options);
  return { ok: true, spec };
}

/** Whether text that is not a plain roll is reaching for a formula: it multiplies, divides, brackets, groups, or takes dice away. */
function looksLikeMath(text: string): boolean {
  // Custom faces and loaded weights are set aside: what is inside them is not arithmetic.
  const bare = text.replace(/d\s*\[[^\]]*\]/gi, "d6").replace(/(d\s*\d+)\s*\{[^}]*\}/gi, "$1");
  return (
    /[*/()×{]/.test(bare) ||
    /^\s*\d+\s*[-+]/.test(bare) ||
    /\d\s*x\s*[\d(]/i.test(bare) ||
    /[)\d]\s*x\s*\d*\s*d/i.test(bare) ||
    /-\s*\d*\s*d\s*[\d%f[]/i.test(bare) ||
    /[+-]\s*\d+\s*[+-]/.test(bare)
  );
}

const FUNCTION = /^\s*(floor|ceil|round|abs|max|min)\s*\(/i;
const DICE_AHEAD = /^\s*\d*\s*d\s*(?:\d|%|f|\[)/i;
const GROUP_KEEP = /^\s*(k|d)\s*([hl]?)\s*(\d*)/i;

/**
 * A formula: dice and whole numbers put together with + - * / and brackets,
 * the functions floor, ceil, round, abs, max and min, and a group
 * `{a,b}kh1` that keeps the highest or lowest of its rolls. `x` and `×`
 * multiply too. Each kind of dice is read as it always is, with its own
 * modifiers. A formula that only adds comes back as the plain roll it is.
 */
function readMath(text: string, options: NotationOptions, times: number, label: string | undefined): NotationCheck {
  const groups: (Partial<DiceGroup> & { count: number })[] = [];
  let rest = text;
  let dice = 0;
  let nodes = 0;
  type Read = MathNode | NotationCheck;
  const failed = (read: Read): read is NotationCheck => "ok" in read;
  const eat = (pattern: RegExp): RegExpExecArray | null => {
    const match = pattern.exec(rest);
    if (match !== null) rest = rest.slice(match[0].length);
    return match;
  };

  function primary(): Read {
    if (++nodes > 60) return refuse("math", text);
    const named = eat(FUNCTION);
    if (named !== null) {
      const name = (named[1] as string).toLowerCase() as MathFunction;
      const args: MathNode[] = [];
      for (;;) {
        const arg = sum();
        if (failed(arg)) return arg;
        args.push(arg);
        if (eat(/^\s*,/) === null) break;
      }
      if (eat(/^\s*\)/) === null) return refuse("math", rest === "" ? named[0] : rest);
      const several = name === "max" || name === "min";
      if (several ? args.length < 2 || args.length > MAX_GROUPS : args.length !== 1) return refuse("math", named[0]);
      return { kind: "call", name, args };
    }
    if (eat(/^\s*\(/) !== null) {
      const inside = sum();
      if (failed(inside)) return inside;
      if (eat(/^\s*\)/) === null) return refuse("math", rest === "" ? "(" : rest);
      return inside;
    }
    if (eat(/^\s*\{/) !== null) {
      // A group: several rolls, of which the highest or the lowest is kept.
      const rolls: MathNode[] = [];
      for (;;) {
        const one = sum();
        if (failed(one)) return one;
        rolls.push(one);
        if (eat(/^\s*,/) === null) break;
      }
      if (eat(/^\s*\}/) === null) return refuse("math", rest === "" ? "{" : rest);
      const keep = GROUP_KEEP.exec(rest);
      if (keep === null || rolls.length < 2 || rolls.length > MAX_GROUPS)
        return refuse("math", rest === "" ? "}" : rest);
      rest = rest.slice(keep[0].length);
      const n = keep[3] === "" ? 1 : Number(keep[3]);
      const keeps = (keep[1] as string).toLowerCase() === "k";
      const high = keep[2] === "" ? keeps : (keep[2] as string).toLowerCase() === "h";
      // kh1 and kl1 keep one; dropping all but one keeps the other end.
      if (keeps ? n !== 1 : rolls.length - n !== 1) return refuse("math", keep[0]);
      return { kind: "call", name: (keeps ? high : !high) ? "max" : "min", args: rolls };
    }
    if (DICE_AHEAD.test(rest)) {
      const from = rest;
      const read = readGroup(rest, options);
      if ("ok" in read) return read;
      const part = from.slice(0, from.length - read.rest.length);
      dice += read.group.count;
      if (dice > mostDice(options)) return tooMany(part, options);
      if (groups.length === MAX_GROUPS) return refuse("kinds", part);
      groups.push(read.group);
      rest = read.rest;
      return { kind: "dice", group: groups.length - 1 };
    }
    const number = eat(/^\s*(\d+)(?![\d.])/);
    if (number === null) return refuse(rest.trim() === "" ? "math" : "shape", rest.trim() === "" ? text : rest);
    if (Number(number[1]) > MAX_MATH_NUMBER) return refuse("math", number[0]);
    return { kind: "number", value: Number(number[1]) };
  }

  function unary(): Read {
    if (eat(/^\s*-/) !== null) {
      const inside = unary();
      if (failed(inside)) return inside;
      return inside.kind === "number"
        ? { kind: "number", value: -inside.value }
        : { kind: "op", op: "-", left: { kind: "number", value: 0 }, right: inside };
    }
    return primary();
  }

  function product(): Read {
    let left = unary();
    for (;;) {
      if (failed(left)) return left;
      const op = eat(/^\s*([*/x×])/i);
      if (op === null) return left;
      const right = unary();
      if (failed(right)) return right;
      left = { kind: "op", op: op[1] === "/" ? "/" : "*", left, right };
    }
  }

  function sum(): Read {
    let left = product();
    for (;;) {
      if (failed(left)) return left;
      const op = eat(/^\s*([+-])/);
      if (op === null) return left;
      const right = product();
      if (failed(right)) return right;
      left = { kind: "op", op: op[1] as "+" | "-", left, right };
    }
  }

  const math = sum();
  if (failed(math)) return math;
  if (rest.trim() !== "") return refuse(/^\s*[)}\],]/.test(rest) ? "math" : "shape", rest);
  if (groups.length === 0) return refuse("shape", text);
  const limits = { maxDice: mostDice(options) };
  const [first, ...more] = groups;

  // A formula that only adds is the plain roll it always was, written one way.
  const plain = added(math);
  if (plain !== null && Math.abs(plain) <= MAX_MODIFIER) {
    const spec = normalizeSpec({ ...first, modifier: plain, more: more as DiceGroup[], times, label }, limits);
    if (diceCount(spec) < dice) return tooMany(text, options);
    return { ok: true, spec };
  }
  const spec = normalizeSpec({ ...first, modifier: 0, more: more as DiceGroup[], times, label, math }, limits);
  if (spec.math === undefined) {
    // Why the formula could not be kept, by name.
    // Each kind on its own, so that two kinds that are the same dice stay two.
    const kinds = groups.map((group) => groupsOf(normalizeSpec({ ...group, modifier: 0 }, limits))[0] as DiceGroup);
    const problem = checkMath(math, kinds.map(groupRange));
    if (diceCount(spec) < dice || !kinds.every((g) => dice <= MAX_DICE || isPlainDice(g)))
      return tooMany(text, options);
    return refuse(problem === "fraction" ? "fraction" : problem === "zero" ? "zero" : "math", text);
  }
  if (diceCount(spec) < dice) return tooMany(text, options);
  return { ok: true, spec };
}

/** What a formula adds to its dice when it is nothing but adding: the bonus, or null when it multiplies, divides, calls a function or takes dice away. */
function added(node: MathNode, sign = 1): number | null {
  if (node.kind === "dice") return sign === 1 ? 0 : null;
  if (node.kind === "number") return sign * node.value;
  if (node.kind !== "op" || (node.op !== "+" && node.op !== "-")) return null;
  const left = added(node.left, sign);
  const right = added(node.right, node.op === "-" ? -sign : sign);
  return left === null || right === null ? null : left + right;
}

/** A spec from notation, or null when the text is not dice this roller can throw. `checkNotation` says why.
 *
 * @param text - Text to parse, validate or format.
 * @param options - Options for this call; omitted fields keep their documented defaults.
 * @returns A spec from notation, or null when the text is not dice this roller can throw. `checkNotation` says why.

 *
 * @example
 * ```ts
 * import { parseNotation } from "@johnmorrisdotca/korokoro";
 * console.log(parseNotation("2d20kh1+5"));
 * ```
 */
export function parseNotation(text: string, options: NotationOptions = {}): RollSpec | null {
  const read = checkNotation(text, options);
  return read.ok ? read.spec : null;
}

function formatGroup(group: DiceGroup): string {
  return `${group.count}${dieName(group)}${rulesText(group)}`;
}

/**
 * Notation for a spec: the inverse of `parseNotation`. One spelling for each
 * roll: each kind of dice as its count and sides, `!`, the reroll as `r<` or
 * `ro<`, what is kept as `kh` or `kl`; the kinds joined by `+`; then the
 * bonus. So `4d6dl1` is written back as `4d6kh3`.
 *
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @returns Notation for a spec: the inverse of `parseNotation`. One spelling for each roll: each kind of dice as its count and sides, `!`, the reroll as `r<` or `ro<`, what is kept as `kh` or `kl`; the kinds joined by `+`; then the bonus. So `4d6dl1` is written back as `4d6kh3`.

 *
 * @example
 * ```ts
 * import { formatNotation } from "@johnmorrisdotca/korokoro";
 * import { parseNotation } from "@johnmorrisdotca/korokoro";
 * console.log(formatNotation(parseNotation("2d20kh1+5")!));
 * ```
 */
export function formatNotation(spec: RollSpec): string {
  const modifier = spec.modifier === 0 ? "" : spec.modifier > 0 ? `+${spec.modifier}` : `${spec.modifier}`;
  const times = spec.times !== undefined && spec.times > 1 ? `${spec.times}#` : "";
  const groups = groupsOf(spec);
  const dice =
    spec.math !== undefined
      ? mathText(spec.math, (i) => formatGroup(groups[i] as DiceGroup))
      : `${groups.map(formatGroup).join("+")}${modifier}`;
  return `${times}${dice}${spec.label === undefined ? "" : ` # ${spec.label}`}`;
}
