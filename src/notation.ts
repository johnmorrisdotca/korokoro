import { MAX_DICE, MAX_EXPLODING_SIDES, MAX_MODIFIER, MAX_SIDES, MIN_DICE, MIN_SIDES, faceRange, normalizeSpec, type Keep, type RollSpec, type Sides } from "./dice.ts";

/**
 * Dice notation, the way a character sheet writes it.
 *
 *   roll     = [count] "d" sides { modifier } [bonus]
 *   count    = 1 to 10, and 1 when left out
 *   sides    = 2 to 1000, "%" for 100, or "F" for a Fate die
 *   modifier = "!"                          the dice explode
 *            | "r<" face | "r<=" face       reroll once below (or at) a face
 *            | "kh" [n] | "kl" [n]          keep the highest or lowest n (1 when left out)
 *            | "dh" [n] | "dl" [n]          drop the highest or lowest n
 *   bonus    = "+" or "-", then 0 to 99
 *
 * Letters in either case, spaces anywhere between the parts. Modifiers may
 * come in any order and each at most once; whatever order they are written
 * in, a die is rerolled first, then explodes, and keeping or dropping is
 * decided last. Exploding dice are not kept or dropped.
 */
export type NotationProblem =
  /** Not dice notation at all. */
  | "shape"
  /** More or fewer dice than one to ten. */
  | "count"
  /** A die with fewer than two sides or more than a thousand. */
  | "sides"
  /** A bonus past 99 either way. */
  | "bonus"
  /** The same kind of modifier twice, or keep and drop together. */
  | "twice"
  /** Keeping or dropping that leaves every die, or none. */
  | "keep"
  /** A reroll that would reroll no face, or every face. */
  | "reroll"
  /** Exploding dice that cannot: Fate dice, dice past a hundred sides, or dice also kept or dropped. */
  | "explode";

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

const HEAD = /^\s*(\d*)\s*d\s*(\d+|%|f)/i;
const MODIFIER = /^\s*(?:(!)|(r)\s*(<=|<)\s*(\d+)|([kd])\s*([hl])\s*(\d*))/i;
const BONUS = /^\s*([+-])\s*(\d+)\s*$/;
/** Nothing a person types by hand is longer, and nothing longer is read. */
const LONGEST = 64;

const REASONS: Record<NotationProblem, string> = {
  shape: "this is not dice notation",
  count: `roll ${MIN_DICE} to ${MAX_DICE} dice at a time`,
  sides: `a die has ${MIN_SIDES} to ${MAX_SIDES} sides, or is dF`,
  bonus: `a bonus is at most ${MAX_MODIFIER} either way`,
  twice: "each modifier is used once, and dice are kept or dropped, not both",
  keep: "keep or drop at least one die and fewer than all of them",
  reroll: "a reroll has to reroll the lowest face and spare the highest",
  explode: `dice explode only with ${MAX_EXPLODING_SIDES} sides or fewer, never Fate dice, and not together with keep or drop`,
};

function refuse(problem: NotationProblem, part: string): NotationCheck {
  const shown = part.trim();
  return { ok: false, problem, part: shown, message: `${shown === "" ? "" : `“${shown}”: `}${REASONS[problem]}` };
}

/** A spec from notation, or which part of the text was refused and why. Never a roll of something else. */
export function checkNotation(text: string): NotationCheck {
  if (text.length > LONGEST) return refuse("shape", `${text.slice(0, 16)}…`);
  const head = HEAD.exec(text);
  if (head === null) return refuse("shape", text);
  const [whole, countText, sidesText] = head as unknown as [string, string, string];
  const count = countText === "" ? 1 : Number(countText);
  if (count < MIN_DICE || count > MAX_DICE) return refuse("count", countText);
  const sides: Sides = sidesText === "%" ? 100 : sidesText.toLowerCase() === "f" ? "F" : Number(sidesText);
  if (sides !== "F" && (sides < MIN_SIDES || sides > MAX_SIDES)) return refuse("sides", `d${sidesText}`);
  const { low, high } = faceRange(sides);

  let rest = text.slice(whole.length);
  let explode: string | null = null;
  let rerollPart: string | null = null;
  let reroll: number | undefined;
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
      if (reroll < low || reroll >= high) return refuse("reroll", part);
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

  let modifier = 0;
  if (rest.trim() !== "") {
    const bonus = BONUS.exec(rest);
    if (bonus === null) return refuse("shape", rest);
    modifier = Number(bonus[2]) * (bonus[1] === "-" ? -1 : 1);
    if (Math.abs(modifier) > MAX_MODIFIER) return refuse("bonus", rest);
  }
  const asked: Partial<RollSpec> = { count, sides, modifier, keep, keepCount };
  if (explode !== null) asked.explode = true;
  if (reroll !== undefined) asked.reroll = reroll;
  return { ok: true, spec: normalizeSpec(asked) };
}

/** A spec from notation, or null when the text is not dice this roller can throw. `checkNotation` says why. */
export function parseNotation(text: string): RollSpec | null {
  const read = checkNotation(text);
  return read.ok ? read.spec : null;
}

/**
 * Notation for a spec: the inverse of `parseNotation`. One spelling for each
 * roll: the dice, `!`, the reroll as `r<`, what is kept as `kh` or `kl`, then
 * the bonus. So `4d6dl1` is written back as `4d6kh3`.
 */
export function formatNotation(spec: RollSpec): string {
  const explode = spec.explode === true ? "!" : "";
  const reroll = spec.reroll === undefined ? "" : `r<${spec.reroll + 1}`;
  const keep = spec.keep === "all" ? "" : `${spec.keep === "highest" ? "kh" : "kl"}${spec.keepCount ?? 1}`;
  const modifier = spec.modifier === 0 ? "" : spec.modifier > 0 ? `+${spec.modifier}` : `${spec.modifier}`;
  return `${spec.count}d${spec.sides}${explode}${reroll}${keep}${modifier}`;
}
