import {
  type Compare,
  type CustomFace,
  customFaces,
  type DiceGroup,
  faceRange,
  loadedWeights,
  MAX_DICE,
  MAX_DICE_BY_CODE,
  MAX_EXPLODING_SIDES,
  MAX_FACE_VALUE,
  MAX_FACES,
  MAX_GROUPS,
  MAX_LABEL,
  MAX_LOADED_SIDES,
  MAX_MODIFIER,
  MAX_REROLLS,
  MAX_ROLL_LABEL,
  MAX_SIDES,
  MAX_TIMES,
  MAX_UNIQUE_SIDES,
  MAX_WEIGHT,
  MIN_DICE,
  MIN_SIDES,
  meets,
  normalizeSpec,
  type Sides,
} from "./dice.ts";
import { MAX_MATH_NUMBER } from "./math.ts";
import type { NotationCheck, NotationOptions, NotationProblem } from "./notation.ts";

const HEAD = /^\s*(\d*)\s*d\s*(\d+|%|f|\[[^\]]*\])(\s*\{[^}]*\})?/i;
/** A comparison: an operator and a number. */
const COMPARE = "(<=|>=|<>|!=|=|<|>)\\s*(\\d+)";
/** Any one modifier, to tell where a kind's modifiers end. */
const MODIFIER =
  /^\s*(?:!|ro?\s*[<>=!\d]|ro?(?![\w[%])|[kd]\s*[hl]|[kdbw]\s*\d|[kdbw](?![\w[%])|min\s*\d|max\s*\d|[<>=]|f\s*[<>=!\d]|c[sf]|s[ad]|s(?![\w[%])|u)/i;
const UNIQUE = /^\s*u(o?)/i;
const EXPLODE = /^\s*(!!?)(p?)(?:\s*(<=|>=|<>|=|<|>)\s*(\d+))?/i;
const REROLL = new RegExp(`^\\s*(ro?)\\s*(?:${COMPARE}|(\\d+)|(?![\\w[%]))`, "i");
const KEEP = /^\s*(?:([kd])\s*([hl])\s*(\d*)|([kdbw])\s*(\d*))/i;
const CLAMP = /^\s*(min|max)\s*(\d+)/i;
const SUCCESS = /^\s*(<=|>=|<>|=|<|>)\s*(\d+)/;
const FAILURE = new RegExp(`^\\s*f\\s*(?:${COMPARE}|(\\d+))`, "i");
const MARK = new RegExp(`^\\s*c([sf])\\s*(?:${COMPARE}|(\\d+))?`, "i");
const SORT = /^\s*s(?:([ad])|(?![\w[%]))/i;
export const BONUS = /^\s*([+-])\s*(\d+)\s*$/;
/** Another kind of dice coming: a sign, then dice and not a bare number. */
export const MORE = /^\s*([+-])\s*(?=\d*\s*d\s*(?:\d|%|f|\[))/i;
/** Nothing a person types by hand is longer, and nothing longer is read. Custom dice are what need the room. */
export const LONGEST = 400;

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
  successes:
    "successes are counted over all the dice of a kind: the comparison must be one some dice meet and some do not, a failure (f) needs a success to take from and must not overlap it, and counting does not go with keep or drop",
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

export function refuse(problem: NotationProblem, part: string): NotationCheck {
  const shown = part.trim();
  return { ok: false, problem, part: shown, message: `${shown === "" ? "" : `“${shown}”: `}${REASONS[problem]}` };
}

/** One kind of dice from the front of the text, and what is left after it. */
/** The most dice a reading allows: ten, or what `maxDice` raises it to. */
export function mostDice(options: NotationOptions): number {
  return Math.min(MAX_DICE_BY_CODE, Math.max(MAX_DICE, Math.trunc(Number(options.maxDice) || MAX_DICE)));
}

/** A refusal for too many dice, which says the limit that was asked for. */
export function tooMany(part: string, options: NotationOptions): NotationCheck {
  const most = mostDice(options);
  if (most === MAX_DICE) return refuse("count", part);
  const shown = part.trim();
  return {
    ok: false,
    problem: "count",
    part: shown,
    message: `“${shown}”: roll ${MIN_DICE} to ${most} dice at a time, and past ${MAX_DICE} only plain dice, all added or one kept`,
  };
}

export function readGroup(
  text: string,
  options: NotationOptions,
): { group: Partial<DiceGroup> & { count: number }; rest: string; countText: string } | NotationCheck {
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
    if (MODIFIER.test(after))
      return refuse(
        "custom",
        (EXPLODE.exec(after) ??
          REROLL.exec(after) ??
          CLAMP.exec(after) ??
          MARK.exec(after) ??
          UNIQUE.exec(after) ??
          SORT.exec(after) ??
          KEEP.exec(after) ??
          FAILURE.exec(after) ??
          SUCCESS.exec(after) ??
          MODIFIER.exec(after) ?? [after])[0],
      );
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
  const parts: Partial<
    Record<
      | "explode"
      | "reroll"
      | "keep"
      | "floor"
      | "ceiling"
      | "success"
      | "failure"
      | "critical"
      | "fumble"
      | "sort"
      | "unique",
      string
    >
  > = {};
  const compare = (op: string, n: string): Compare => {
    const at = Number(n);
    return op === "<"
      ? { op: "<=", n: at - 1 }
      : op === ">"
        ? { op: ">=", n: at + 1 }
        : op === "!=" || op === "<>"
          ? { op: "<>", n: at }
          : { op: op as "=" | "<=" | ">=", n: at };
  };
  while (MODIFIER.test(rest)) {
    let match: RegExpExecArray | null = EXPLODE.exec(rest);
    if (match !== null) {
      if (parts.explode !== undefined) return refuse("twice", match[0]);
      parts.explode = match[0];
      group.explode = true;
      const compound = match[1] === "!!";
      const penetrating = (match[2] as string) !== "";
      if (compound || penetrating)
        group.explodeKind = compound && penetrating ? "compound-penetrating" : compound ? "compound" : "penetrating";
      if (match[3] !== undefined) group.explodeWhen = compare(match[3], match[4] as string);
    } else {
      match = REROLL.exec(rest);
      if (match !== null) {
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
      } else {
        match = CLAMP.exec(rest);
        if (match !== null) {
          const which = (match[1] as string).toLowerCase() === "min" ? "floor" : "ceiling";
          if (parts[which] !== undefined) return refuse("twice", match[0]);
          parts[which] = match[0];
          group[which] = Number(match[2]);
        } else {
          match = MARK.exec(rest);
          if (match !== null) {
            const which = (match[1] as string).toLowerCase() === "s" ? "critical" : "fumble";
            if (parts[which] !== undefined) return refuse("twice", match[0]);
            parts[which] = match[0];
            // cs alone marks the highest face, and cf alone the lowest.
            group[which] = compare(match[2] ?? "=", match[3] ?? match[4] ?? String(which === "critical" ? high : low));
          } else {
            match = UNIQUE.exec(rest);
            if (match !== null) {
              if (parts.unique !== undefined) return refuse("twice", match[0]);
              if ((match[1] as string) !== "") return refuse("unique", match[0]);
              parts.unique = match[0];
              group.unique = true;
            } else {
              match = SORT.exec(rest);
              if (match !== null) {
                if (parts.sort !== undefined) return refuse("twice", match[0]);
                parts.sort = match[0];
                group.sort = match[1]?.toLowerCase() === "d" ? "descending" : "ascending";
              } else {
                match = KEEP.exec(rest);
                if (match !== null) {
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
                } else {
                  match = FAILURE.exec(rest);
                  if (match !== null) {
                    if (parts.failure !== undefined) return refuse("twice", match[0]);
                    parts.failure = match[0];
                    group.failure = compare(match[1] ?? "=", (match[2] ?? match[3]) as string);
                  } else {
                    match = SUCCESS.exec(rest);
                    if (match !== null) {
                      if (parts.success !== undefined) return refuse("twice", match[0]);
                      parts.success = match[0];
                      group.success = compare(match[1] as string, match[2] as string);
                    } else break;
                  }
                }
              }
            }
          }
        }
      }
    }
    rest = rest.slice(match[0].length);
  }
  if (parts.explode !== undefined && (sides === "F" || sides > MAX_EXPLODING_SIDES || parts.keep !== undefined))
    return refuse("explode", parts.explode);
  if (parts.failure !== undefined && parts.success === undefined) return refuse("successes", parts.failure);
  if (parts.success !== undefined && parts.keep !== undefined) return refuse("successes", parts.success);
  if (weights !== undefined) group.weights = weights;
  // Whatever the rules above did not catch: a rule that would be left out of the roll is refused by name, never dropped quietly.
  const kept = normalizeSpec({ ...group, modifier: 0 });
  const lost = (
    [
      [
        "explode",
        "explode",
        kept.explode !== true ||
          group.explodeKind !== kept.explodeKind ||
          (group.explodeWhen !== undefined &&
            kept.explodeWhen === undefined &&
            !onlyTheHighest(group.explodeWhen, sides)),
      ],
      [
        "reroll",
        "reroll",
        kept.reroll === undefined &&
          kept.rerollUntil === undefined &&
          kept.rerollWhen === undefined &&
          kept.rerollUntilWhen === undefined,
      ],
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
