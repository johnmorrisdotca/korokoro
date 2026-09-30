import { MAX_MATH_NUMBER, checkMath, mathText, type MathFunction, type MathNode } from "./math.ts";
import {
  MAX_DICE,
  MAX_DICE_BY_CODE,
  MAX_UNIQUE_SIDES,
  diceCount,
  groupRange,
  isPlainDice,
  MAX_EXPLODING_SIDES,
  MAX_FACES,
  MAX_FACE_VALUE,
  MAX_GROUPS,
  MAX_LABEL,
  MAX_LOADED_SIDES,
  MAX_MODIFIER,
  MAX_REROLLS,
  MAX_ROLL_LABEL,
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
  meets,
  normalizeSpec,
  rollLabel,
  rulesText,
  type Compare,
  type CustomFace,
  type DiceGroup,
  type RollSpec,
  type Sides,
} from "./dice.ts";

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
  /** The most dice the roll may have, from 10 (the default) to `MAX_DICE_BY_CODE`. Past ten, every kind has to be plain dice, all added or one kept. */
  maxDice?: number;
};

const HEAD = /^\s*(\d*)\s*d\s*(\d+|%|f|\[[^\]]*\])(\s*\{[^}]*\})?/i;
/** A comparison: an operator and a number. */
const COMPARE = "(<=|>=|<>|!=|=|<|>)\\s*(\\d+)";
/** Any one modifier, to tell where a kind's modifiers end. */
const MODIFIER = new RegExp(`^\\s*(?:!|ro?\\s*[<>=!\\d]|ro?(?![\\w[%])|[kd]\\s*[hl]|[kdbw]\\s*\\d|[kdbw](?![\\w[%])|min\\s*\\d|max\\s*\\d|[<>=]|f\\s*[<>=!\\d]|c[sf]|s[ad]|s(?![\\w[%])|u)`, "i");
const UNIQUE = /^\s*u(o?)/i;
const EXPLODE = new RegExp(`^\\s*(!!?)(p?)(?:\\s*(<=|>=|<>|=|<|>)\\s*(\\d+))?`, "i");
const REROLL = new RegExp(`^\\s*(ro?)\\s*(?:${COMPARE}|(\\d+)|(?![\\w[%]))`, "i");
const KEEP = /^\s*(?:([kd])\s*([hl])\s*(\d*)|([kdbw])\s*(\d*))/i;
const CLAMP = /^\s*(min|max)\s*(\d+)/i;
const SUCCESS = /^\s*(<=|>=|<>|=|<|>)\s*(\d+)/;
const FAILURE = new RegExp(`^\\s*f\\s*(?:${COMPARE}|(\\d+))`, "i");
const MARK = new RegExp(`^\\s*c([sf])\\s*(?:${COMPARE}|(\\d+))?`, "i");
const SORT = /^\s*s(?:([ad])|(?![\w[%]))/i;
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
  reroll: `a reroll has to reroll some face and spare another, and r may match at most half the faces (it stops after ${MAX_REROLLS}); ro rerolls once`,
  explode: `dice explode only with ${MAX_EXPLODING_SIDES} sides or fewer, never Fate dice, not together with keep or drop, and on some faces but not all`,
  kinds: `a roll has at most ${MAX_GROUPS} kinds of dice`,
  minus: "dice are added together; only the bonus can be taken away",
  times: `a roll is thrown 1 to ${MAX_TIMES} times`,
  custom: `a custom die has 2 to ${MAX_FACES} faces, each up to ${MAX_LABEL} characters with an optional =value (a whole number up to ${MAX_FACE_VALUE} either way) and #colour, and takes no modifiers`,
  successes: "successes are counted over all the dice of a kind: the comparison must be one some dice meet and some do not, a failure (f) needs a success to take from and must not overlap it, and counting does not go with keep or drop",
  clamp: "min and max take a face of the die: min above its lowest, max below its highest, and min no greater than max",
  marks: "cs and cf take a comparison that some dice meet and some do not",
  unique: `dice that all differ (u) are fair dice of ${MAX_UNIQUE_SIDES} sides or fewer, no more of them than the die has faces, all added, with no reroll or explosion; uo (reroll a duplicate once) is not read`,
  math: `a formula is dice and whole numbers up to ${MAX_MATH_NUMBER} with + - * / and brackets, floor() ceil() round() abs() max() min(), or a group {a,b}kh1 that keeps one of its rolls; its brackets have to match, and its totals must not spread too wide to count`,
  fraction: "a division has to be rounded so that the roll comes to a whole number: floor(…), ceil(…) or round(…)",
  zero: "this formula can divide by nothing",
  label: `a label is up to ${MAX_ROLL_LABEL} characters, without # [ ] { or }`,
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

/** Whether an explosion's comparison is met by the die's highest face and no other: then it is a plain explosion. */
function onlyTheHighest(when: Compare, sides: Sides): boolean {
  if (sides === "F") return false;
  for (let face = 1; face <= sides; face++) if (meets(when, face) !== (face === sides)) return false;
  return true;
}

function refuse(problem: NotationProblem, part: string): NotationCheck {
  const shown = part.trim();
  return { ok: false, problem, part: shown, message: `${shown === "" ? "" : `“${shown}”: `}${REASONS[problem]}` };
}

/** One kind of dice from the front of the text, and what is left after it. */
/** The most dice a reading allows: ten, or what `maxDice` raises it to. */
function mostDice(options: NotationOptions): number {
  return Math.min(MAX_DICE_BY_CODE, Math.max(MAX_DICE, Math.trunc(Number(options.maxDice) || MAX_DICE)));
}

/** A refusal for too many dice, which says the limit that was asked for. */
function tooMany(part: string, options: NotationOptions): NotationCheck {
  const most = mostDice(options);
  if (most === MAX_DICE) return refuse("count", part);
  const shown = part.trim();
  return { ok: false, problem: "count", part: shown, message: `“${shown}”: roll ${MIN_DICE} to ${most} dice at a time, and past ${MAX_DICE} only plain dice, all added or one kept` };
}

function readGroup(text: string, options: NotationOptions): { group: Partial<DiceGroup> & { count: number }; rest: string; countText: string } | NotationCheck {
  const head = HEAD.exec(text);
  if (head === null) return refuse("shape", text);
  const [whole, countText, sidesText] = head as unknown as [string, string, string];
  const count = countText === "" ? 1 : Number(countText);
  if (count < MIN_DICE || count > mostDice(options)) return tooMany(countText, options);
  if (sidesText.startsWith("[")) {
    // A custom die: its faces, and nothing after them but the next kind or the bonus.
    const faces = readFaces(sidesText.slice(1, -1));
    if (faces === null || head[3] !== undefined) return refuse("custom", `d${sidesText}${head[3] ?? ""}`);
    const after = text.slice(whole.length);
    if (MODIFIER.test(after)) return refuse("custom", (EXPLODE.exec(after) ?? REROLL.exec(after) ?? CLAMP.exec(after) ?? MARK.exec(after) ?? UNIQUE.exec(after) ?? SORT.exec(after) ?? KEEP.exec(after) ?? FAILURE.exec(after) ?? SUCCESS.exec(after) ?? MODIFIER.exec(after) ?? [after])[0]);
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
  const group: Partial<DiceGroup> & { count: number } = { count, sides, keep: "all" };
  /** The text of each modifier read, by what it is, so a refusal can name it. */
  const parts: Partial<Record<"explode" | "reroll" | "keep" | "floor" | "ceiling" | "success" | "failure" | "critical" | "fumble" | "sort" | "unique", string>> = {};
  const compare = (op: string, n: string): Compare => {
    const at = Number(n);
    return op === "<" ? { op: "<=", n: at - 1 } : op === ">" ? { op: ">=", n: at + 1 } : op === "!=" || op === "<>" ? { op: "<>", n: at } : { op: op as "=" | "<=" | ">=", n: at };
  };
  while (MODIFIER.test(rest)) {
    let match: RegExpExecArray | null;
    if ((match = EXPLODE.exec(rest)) !== null) {
      if (parts.explode !== undefined) return refuse("twice", match[0]);
      parts.explode = match[0];
      group.explode = true;
      const compound = match[1] === "!!";
      const penetrating = (match[2] as string) !== "";
      if (compound || penetrating) group.explodeKind = compound && penetrating ? "compound-penetrating" : compound ? "compound" : "penetrating";
      if (match[3] !== undefined) group.explodeWhen = compare(match[3], match[4] as string);
    } else if ((match = REROLL.exec(rest)) !== null) {
      if (parts.reroll !== undefined) return refuse("twice", match[0]);
      parts.reroll = match[0];
      const once = (match[1] as string).toLowerCase() === "ro" || options.legacyReroll === true;
      const op = match[2] ?? "=";
      // r alone rerolls the die's lowest face.
      const at = Number(match[3] ?? match[4] ?? low);
      if (op === "<" || op === "<=") {
        // The reroll this package has always had: a run of faces from the lowest.
        const reroll = at - (op === "<" ? 1 : 0);
        if (reroll < low || reroll >= high) return refuse("reroll", match[0]);
        if (!once && (reroll - low + 1) * 2 > high - low + 1) return refuse("reroll", match[0]);
        group[once ? "reroll" : "rerollUntil"] = reroll;
      } else group[once ? "rerollWhen" : "rerollUntilWhen"] = compare(op, String(at));
    } else if ((match = CLAMP.exec(rest)) !== null) {
      const which = (match[1] as string).toLowerCase() === "min" ? "floor" : "ceiling";
      if (parts[which] !== undefined) return refuse("twice", match[0]);
      parts[which] = match[0];
      group[which] = Number(match[2]);
    } else if ((match = MARK.exec(rest)) !== null) {
      const which = (match[1] as string).toLowerCase() === "s" ? "critical" : "fumble";
      if (parts[which] !== undefined) return refuse("twice", match[0]);
      parts[which] = match[0];
      // cs alone marks the highest face, and cf alone the lowest.
      group[which] = compare(match[2] ?? "=", match[3] ?? match[4] ?? String(which === "critical" ? high : low));
    } else if ((match = UNIQUE.exec(rest)) !== null) {
      if (parts.unique !== undefined) return refuse("twice", match[0]);
      if ((match[1] as string) !== "") return refuse("unique", match[0]);
      parts.unique = match[0];
      group.unique = true;
    } else if ((match = SORT.exec(rest)) !== null) {
      if (parts.sort !== undefined) return refuse("twice", match[0]);
      parts.sort = match[0];
      group.sort = match[1]?.toLowerCase() === "d" ? "descending" : "ascending";
    } else if ((match = KEEP.exec(rest)) !== null) {
      if (parts.keep !== undefined) return refuse("twice", match[0]);
      parts.keep = match[0];
      // kh3, dl1; k3 and b3 keep the highest; d1 drops the lowest; w1 keeps the lowest.
      const letter = (match[1] ?? match[4] ?? "").toLowerCase();
      const end = match[2]?.toLowerCase();
      const digits = (match[3] ?? match[5]) as string;
      const n = digits === "" ? 1 : Number(digits);
      if (n < 1 || n >= count) return refuse("keep", match[0]);
      const keeps = letter !== "d";
      const highest = end !== undefined ? end === "h" : letter === "k" || letter === "b";
      // Dropping the lowest two of five is keeping the highest three.
      if (keeps) {
        group.keep = highest ? "highest" : "lowest";
        group.keepCount = n;
      } else {
        const dropsHighest = end === "h";
        group.keep = dropsHighest ? "lowest" : "highest";
        group.keepCount = count - n;
      }
    } else if ((match = FAILURE.exec(rest)) !== null) {
      if (parts.failure !== undefined) return refuse("twice", match[0]);
      parts.failure = match[0];
      group.failure = compare(match[1] ?? "=", (match[2] ?? match[3]) as string);
    } else if ((match = SUCCESS.exec(rest)) !== null) {
      if (parts.success !== undefined) return refuse("twice", match[0]);
      parts.success = match[0];
      group.success = compare(match[1] as string, match[2] as string);
    } else break;
    rest = rest.slice(match[0].length);
  }
  if (parts.explode !== undefined && (sides === "F" || sides > MAX_EXPLODING_SIDES || parts.keep !== undefined)) return refuse("explode", parts.explode);
  if (parts.failure !== undefined && parts.success === undefined) return refuse("successes", parts.failure);
  if (parts.success !== undefined && parts.keep !== undefined) return refuse("successes", parts.success);
  if (weights !== undefined) group.weights = weights;
  // Whatever the rules above did not catch: a rule that would be left out of the roll is refused by name, never dropped quietly.
  const kept = normalizeSpec({ ...group, modifier: 0 });
  const lost = (
    [
      ["explode", "explode", kept.explode !== true || (group.explodeKind !== kept.explodeKind) || (group.explodeWhen !== undefined && kept.explodeWhen === undefined && !onlyTheHighest(group.explodeWhen, sides))],
      ["reroll", "reroll", kept.reroll === undefined && kept.rerollUntil === undefined && kept.rerollWhen === undefined && kept.rerollUntilWhen === undefined],
      ["floor", "clamp", kept.floor === undefined],
      ["ceiling", "clamp", kept.ceiling === undefined],
      ["success", "successes", kept.success === undefined],
      ["failure", "successes", kept.failure === undefined],
      ["critical", "marks", kept.critical === undefined],
      ["fumble", "marks", kept.fumble === undefined],
      ["unique", "unique", kept.unique !== true],
    ] as const
  ).find(([part, , gone]) => parts[part] !== undefined && gone);
  if (lost !== undefined) return refuse(lost[1], parts[lost[0]] as string);
  return { group, rest, countText };
}

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

/** A spec from notation, or which part of the text was refused and why. Never a roll of something else. */
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
  const spec = normalizeSpec({ ...first, modifier, more: more as DiceGroup[], times, label }, { maxDice: mostDice(options) });
  // Past ten dice only plain dice are rolled: a roll that was brought back to ten is refused, not shortened.
  if (diceCount(spec) < dice) return tooMany(text, options);
  return { ok: true, spec };
}

/** Whether text that is not a plain roll is reaching for a formula: it multiplies, divides, brackets, groups, or takes dice away. */
function looksLikeMath(text: string): boolean {
  // Custom faces and loaded weights are set aside: what is inside them is not arithmetic.
  const bare = text.replace(/d\s*\[[^\]]*\]/gi, "d6").replace(/(d\s*\d+)\s*\{[^}]*\}/gi, "$1");
  return /[*/()×{]/.test(bare) || /^\s*\d+\s*[-+]/.test(bare) || /\d\s*x\s*[\d(]/i.test(bare) || /[)\d]\s*x\s*\d*\s*d/i.test(bare) || /-\s*\d*\s*d\s*[\d%f[]/i.test(bare) || /[+-]\s*\d+\s*[+-]/.test(bare);
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
      if (keep === null || rolls.length < 2 || rolls.length > MAX_GROUPS) return refuse("math", rest === "" ? "}" : rest);
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
      return inside.kind === "number" ? { kind: "number", value: -inside.value } : { kind: "op", op: "-", left: { kind: "number", value: 0 }, right: inside };
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
    if (diceCount(spec) < dice || !kinds.every((g) => dice <= MAX_DICE || isPlainDice(g))) return tooMany(text, options);
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

/** A spec from notation, or null when the text is not dice this roller can throw. `checkNotation` says why. */
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
 */
export function formatNotation(spec: RollSpec): string {
  const modifier = spec.modifier === 0 ? "" : spec.modifier > 0 ? `+${spec.modifier}` : `${spec.modifier}`;
  const times = spec.times !== undefined && spec.times > 1 ? `${spec.times}#` : "";
  const groups = groupsOf(spec);
  const dice = spec.math !== undefined ? mathText(spec.math, (i) => formatGroup(groups[i] as DiceGroup)) : `${groups.map(formatGroup).join("+")}${modifier}`;
  return `${times}${dice}${spec.label === undefined ? "" : ` # ${spec.label}`}`;
}
