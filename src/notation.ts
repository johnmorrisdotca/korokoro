import {
  MAX_DICE,
  MAX_EXPLODING_SIDES,
  MAX_FACES,
  MAX_FACE_VALUE,
  MAX_GROUPS,
  MAX_LABEL,
  MAX_LOADED_SIDES,
  MAX_MODIFIER,
  MAX_REROLLS,
  MAX_SIDES,
  MAX_TIMES,
  MAX_WEIGHT,
  MIN_DICE,
  MIN_SIDES,
  customFaces,
  dieName,
  faceRange,
  groupsOf,
  loadedWeights,
  normalizeSpec,
  type CustomFace,
  type DiceGroup,
  type Keep,
  type RollSpec,
  type Sides,
} from "./dice.ts";

/**
 * Dice notation, the way a character sheet writes it.
 *
 *   set      = [times "#"] roll               the roll thrown several times: 6#4d6dl1
 *   times    = 1 to 100
 *   roll     = dice { "+" dice } [bonus]
 *   dice     = [count] "d" sides { modifier }
 *   count    = 1 to 10 over the whole roll, and 1 when left out
 *   sides    = 2 to 1000, "%" for 100, or "F" for a Fate die
 *            | number "{" face ":" weight { "," face ":" weight } "}"    a loaded die
 *            | "[" face { "," face } "]"                                a custom die
 *   face     = words [ "=" value ] [ "#" colour ]    in a custom die; a number alone is worth itself
 *   modifier = "!"                          the dice explode
 *            | "r<" face | "r<=" face       reroll until clear of a face
 *            | "ro<" face | "ro<=" face     reroll once below (or at) a face
 *            | "kh" [n] | "kl" [n]          keep the highest or lowest n (1 when left out)
 *            | "dh" [n] | "dl" [n]          drop the highest or lowest n
 *   bonus    = "+" or "-", then 0 to 99
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
  /** A loaded die whose weights cannot be read: a face the die does not have, a weight past 99, fewer than two faces that can come up, a die too large to load, or weights that are all the same. */
  | "weights";

/** What `checkNotation` found: the spec, or the part it refused and why. */
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

/** How to read a notation. */
export type NotationOptions = {
  /** Read `r<` as 1.2.0 and 1.3.0 wrote it: reroll once. For text kept from those versions, such as an old shared link. */
  legacyReroll?: boolean;
};

const HEAD = /^\s*(\d*)\s*d\s*(\d+|%|f|\[[^\]]*\])(\s*\{[^}]*\})?/i;
const MODIFIER = /^\s*(?:(!)|(ro?)\s*(<=|<)\s*(\d+)|([kd])\s*([hl])\s*(\d*))/i;
const BONUS = /^\s*([+-])\s*(\d+)\s*$/;
/** Another kind of dice coming: a sign, then dice and not a bare number. */
const MORE = /^\s*([+-])\s*(?=\d*\s*d\s*(?:\d|%|f|\[))/i;
/** Nothing a person types by hand is longer, and nothing longer is read. Custom dice are what need the room. */
const LONGEST = 400;

const REASONS: Record<NotationProblem, string> = {
  shape: "this is not dice notation",
  count: `roll ${MIN_DICE} to ${MAX_DICE} dice at a time`,
  sides: `a die has ${MIN_SIDES} to ${MAX_SIDES} sides, or is dF`,
  bonus: `a bonus is at most ${MAX_MODIFIER} either way`,
  twice: "each modifier is used once, and dice are kept or dropped, not both",
  keep: "keep or drop at least one die and fewer than all of them",
  reroll: `a reroll has to reroll the lowest face and spare the highest, and r may match at most half the faces (it stops after ${MAX_REROLLS}); ro rerolls once`,
  explode: `dice explode only with ${MAX_EXPLODING_SIDES} sides or fewer, never Fate dice, and not together with keep or drop`,
  kinds: `a roll has at most ${MAX_GROUPS} kinds of dice`,
  minus: "dice are added together; only the bonus can be taken away",
  times: `a roll is thrown 1 to ${MAX_TIMES} times`,
  custom: `a custom die has 2 to ${MAX_FACES} faces, each up to ${MAX_LABEL} characters with an optional =value (a whole number up to ${MAX_FACE_VALUE} either way) and #colour, and takes no modifiers`,
  weights: `a loaded die has up to ${MAX_LOADED_SIDES} sides, and names faces it has with weights from 0 to ${MAX_WEIGHT} that are not all the same, leaving at least two faces that can come up`,
};

/** A custom die's faces from the text between its brackets, or null when a face cannot be read. */
function readFaces(text: string): CustomFace[] | null {
  const faces = text.split(",").map((part): CustomFace | null => {
    const face = /^([^=#]*?)(?:=\s*(-?\d+))?\s*(#[0-9a-fA-F]{3,6})?$/.exec(part.trim());
    if (face === null) return null;
    const label = (face[1] as string).trim();
    const made: CustomFace = { label };
    // A number on its own is worth itself: d[1,1,2,3,5,8].
    if (face[2] !== undefined) made.value = Number(face[2]);
    else if (/^-?\d+$/.test(label)) made.value = Number(label);
    if (face[3] !== undefined) made.colour = face[3];
    return made;
  });
  return faces.includes(null) ? null : (customFaces(faces) ?? null);
}

/** A loaded die's weights from the text between its braces: one for every face, 1 where a face is not named. Null when they cannot be read. */
function readWeights(sides: Sides, text: string): number[] | null {
  if (sides === "F" || sides > MAX_LOADED_SIDES) return null;
  const weights = new Array<number>(sides).fill(1);
  const named = new Set<number>();
  for (const part of text.split(",")) {
    const pair = /^\s*(\d+)\s*:\s*(\d+)\s*$/.exec(part);
    if (pair === null) return null;
    const face = Number(pair[1]);
    if (face < 1 || face > sides || named.has(face)) return null;
    named.add(face);
    weights[face - 1] = Number(pair[2]);
  }
  return loadedWeights(sides, weights) ?? null;
}

function refuse(problem: NotationProblem, part: string): NotationCheck {
  const shown = part.trim();
  return { ok: false, problem, part: shown, message: `${shown === "" ? "" : `“${shown}”: `}${REASONS[problem]}` };
}

/** One kind of dice from the front of the text, and what is left after it. */
function readGroup(text: string, options: NotationOptions): { group: Partial<DiceGroup> & { count: number }; rest: string; countText: string } | NotationCheck {
  const head = HEAD.exec(text);
  if (head === null) return refuse("shape", text);
  const [whole, countText, sidesText] = head as unknown as [string, string, string];
  const count = countText === "" ? 1 : Number(countText);
  if (count < MIN_DICE || count > MAX_DICE) return refuse("count", countText);
  if (sidesText.startsWith("[")) {
    // A custom die: its faces, and nothing after them but the next kind or the bonus.
    const faces = readFaces(sidesText.slice(1, -1));
    if (faces === null || head[3] !== undefined) return refuse("custom", `d${sidesText}${head[3] ?? ""}`);
    const after = text.slice(whole.length);
    const modifier = MODIFIER.exec(after);
    if (modifier !== null) return refuse("custom", modifier[0]);
    return { group: { count, sides: faces.length, keep: "all", faces }, rest: after, countText };
  }
  const sides: Sides = sidesText === "%" ? 100 : sidesText.toLowerCase() === "f" ? "F" : Number(sidesText);
  if (sides !== "F" && (sides < MIN_SIDES || sides > MAX_SIDES)) return refuse("sides", `d${sidesText}`);
  const { low, high } = faceRange(sides);
  let weights: number[] | undefined;
  if (head[3] !== undefined) {
    const read = readWeights(sides, head[3].trim().slice(1, -1));
    if (read === null) return refuse("weights", `d${sidesText}${head[3]}`);
    weights = read;
  }

  let rest = text.slice(whole.length);
  let explode: string | null = null;
  let rerollPart: string | null = null;
  let reroll: number | undefined;
  let until = false;
  let keepPart: string | null = null;
  let keep: Keep = "all";
  let keepCount = 1;
  for (let match = MODIFIER.exec(rest); match !== null; match = MODIFIER.exec(rest)) {
    const part = match[0];
    rest = rest.slice(part.length);
    if (match[1] !== undefined) {
      if (explode !== null) return refuse("twice", part);
      explode = part;
    } else if (match[2] !== undefined) {
      if (rerollPart !== null) return refuse("twice", part);
      rerollPart = part;
      reroll = Number(match[4]) - (match[3] === "<" ? 1 : 0);
      until = match[2].toLowerCase() === "r" && options.legacyReroll !== true;
      if (reroll < low || reroll >= high) return refuse("reroll", part);
      if (until && (reroll - low + 1) * 2 > high - low + 1) return refuse("reroll", part);
    } else {
      if (keepPart !== null) return refuse("twice", part);
      keepPart = part;
      const n = match[7] === "" ? 1 : Number(match[7]);
      if (n < 1 || n >= count) return refuse("keep", part);
      const highest = (match[6] as string).toLowerCase() === "h";
      // Dropping the lowest two of five is keeping the highest three.
      if ((match[5] as string).toLowerCase() === "k") {
        keep = highest ? "highest" : "lowest";
        keepCount = n;
      } else {
        keep = highest ? "lowest" : "highest";
        keepCount = count - n;
      }
    }
  }
  if (explode !== null && (sides === "F" || sides > MAX_EXPLODING_SIDES || keepPart !== null)) return refuse("explode", explode);
  const group: Partial<DiceGroup> & { count: number } = { count, sides, keep, keepCount };
  if (explode !== null) group.explode = true;
  if (reroll !== undefined) group[until ? "rerollUntil" : "reroll"] = reroll;
  if (weights !== undefined) group.weights = weights;
  return { group, rest, countText };
}

/** A spec from notation, or which part of the text was refused and why. Never a roll of something else. */
export function checkNotation(text: string, options: NotationOptions = {}): NotationCheck {
  if (text.length > LONGEST) return refuse("shape", `${text.slice(0, 16)}…`);
  const groups: (Partial<DiceGroup> & { count: number })[] = [];
  let rest = text;
  // `6#`: the roll after it is thrown six times, as a set.
  let times = 1;
  const repeat = /^\s*(\d+)\s*#/.exec(text);
  if (repeat !== null) {
    times = Number(repeat[1]);
    if (times < 1 || times > MAX_TIMES) return refuse("times", repeat[0]);
    rest = text.slice(repeat[0].length);
  }
  let dice = 0;
  for (;;) {
    const from = rest;
    const read = readGroup(rest, options);
    if ("ok" in read) return read;
    dice += read.group.count;
    // The kind that takes the roll past ten dice is the part refused.
    if (dice > MAX_DICE) return refuse("count", from.slice(0, from.length - read.rest.length));
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
  return { ok: true, spec: normalizeSpec({ ...first, modifier, more: more as DiceGroup[], times }) };
}

/** A spec from notation, or null when the text is not dice this roller can throw. `checkNotation` says why. */
export function parseNotation(text: string, options: NotationOptions = {}): RollSpec | null {
  const read = checkNotation(text, options);
  return read.ok ? read.spec : null;
}

function formatGroup(group: DiceGroup): string {
  const explode = group.explode === true ? "!" : "";
  const reroll = group.rerollUntil !== undefined ? `r<${group.rerollUntil + 1}` : group.reroll !== undefined ? `ro<${group.reroll + 1}` : "";
  const keep = group.keep === "all" ? "" : `${group.keep === "highest" ? "kh" : "kl"}${group.keepCount ?? 1}`;
  return `${group.count}${dieName(group)}${explode}${reroll}${keep}`;
}

/**
 * Notation for a spec: the inverse of `parseNotation`. One spelling for each
 * roll: each kind of dice as its count and sides, `!`, the reroll as `r<` or
 * `ro<`, what is kept as `kh` or `kl`; the kinds joined by `+`; then the
 * bonus. So `4d6dl1` is written back as `4d6kh3`.
 */
export function formatNotation(spec: RollSpec): string {
  const modifier = spec.modifier === 0 ? "" : spec.modifier > 0 ? `+${spec.modifier}` : `${spec.modifier}`;
  const times = spec.times !== undefined && spec.times > 1 ? `${spec.times}#` : "";
  return `${times}${groupsOf(spec).map(formatGroup).join("+")}${modifier}`;
}
