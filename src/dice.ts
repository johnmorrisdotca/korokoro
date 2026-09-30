import { cryptoSource, randomInt, type RandomSource } from "./random.ts";

/**
 * The dice the tray offers as buttons: the polyhedral set, the thirty-sided
 * die, and the percentile die. Any other die is reached by notation.
 */
export const DIE_SIDES = [4, 6, 8, 10, 12, 20, 30, 100] as const;
/** One of the dice the tray has a button for. */
export type DieSides = (typeof DIE_SIDES)[number];

/** A die of any size from a coin to a d1000, or a Fate die, whose faces are −1, 0 and +1. */
export type Sides = number | "F";
/** The fewest sides a numbered die has: a coin. */
export const MIN_SIDES = 2;
/** The most sides a numbered die has. */
export const MAX_SIDES = 1000;

/** The fewest dice in one roll. */
export const MIN_DICE = 1;
/** The most dice in one roll: a fireball's 8d6, Farkle's six and a pool of ten all fit. */
export const MAX_DICE = 10;
/** The largest bonus, either way: a roll adds or takes away at most this. */
export const MAX_MODIFIER = 99;

/**
 * How many more dice one exploding die may throw. The chain stops there and
 * the last die is read as it lies, so a roll always ends and its odds are the
 * exact odds of the dice as thrown. A d6 gets this far once in 60 million dice.
 */
export const MAX_EXPLOSIONS = 10;
/** The largest die that may explode: past this the exact odds stop being quick to count. */
export const MAX_EXPLODING_SIDES = 100;
/**
 * How many times one die is thrown again by a reroll-until (`r<`). After
 * that it stands as it lies, in the roll and in the odds alike. Such a reroll
 * may match at most half a die's faces, so at the very worst one die in a
 * thousand gets this far; a d6 rerolling its 1s does once in 60 million.
 */
export const MAX_REROLLS = 10;
/** The most kinds of dice in one roll: `1d20+1d4` is two. */
export const MAX_GROUPS = 4;

/**
 * Which dice count towards the total. `all` adds every die; `highest` and
 * `lowest` keep one, which is how advantage and disadvantage are rolled, or
 * as many as `keepCount` says.
 */
export type Keep = "all" | "highest" | "lowest";

/**
 * Some dice of one kind, with their own rules: the `2d20kh1` of
 * `2d20kh1+1d4`. The optional fields are left out of a group that does not
 * use them.
 */
export type DiceGroup = {
  /** How many dice: at least 1, and no more than `MAX_DICE` over the whole roll. */
  count: number;
  /** The kind of die: 2 to 1000 sides, or "F" for a Fate die. */
  sides: Sides;
  /** Which dice count towards the total. */
  keep: Keep;
  /** How many dice `highest` or `lowest` keep. Left out when it is one. */
  keepCount?: number;
  /** A die showing its highest face throws another, which may do the same. Left out when the dice do not explode. */
  explode?: true;
  /** A die showing this face or lower is thrown again, once, and the new face stands: `ro<` in notation. Left out when nothing is rerolled once. */
  reroll?: number;
  /** A die showing this face or lower is thrown again until it shows more, up to `MAX_REROLLS` times: `r<` in notation. Left out when nothing is rerolled until clear. */
  rerollUntil?: number;
};

/**
 * What to roll: the dice, the bonus, and the rules. A roll of one kind of die
 * is `{ count, sides, modifier, keep }` and whichever optional fields it
 * uses. A roll of several kinds keeps its first kind there and the others in
 * `more`, so a one-kind spec is the same object it always was.
 */
export type RollSpec = DiceGroup & {
  /** Added to the total, as in 1d20+5. */
  modifier: number;
  /** The other kinds of dice in the roll, in order. Left out when there is one kind. */
  more?: DiceGroup[];
};

/**
 * One die as it was thrown. `kept` counts towards the total, `dropped` was
 * left out by keep or drop, and `rerolled` was thrown again: the die after it
 * is its replacement.
 */
export type DieStatus = "kept" | "dropped" | "rerolled";

/** One die of a roll: the face it showed and what became of it. */
export type DieRoll = {
  /** The face it showed. A Fate die shows −1, 0 or 1. */
  face: number;
  /** Whether it counts, was dropped, or was thrown again. */
  status: DieStatus;
  /** It showed its highest face and threw the die after it. */
  exploded: boolean;
  /** Which of the dice asked for this one belongs to, from 0 and counted across the whole roll: a reroll or an explosion belongs to the die that caused it. */
  die: number;
  /** Which kind of dice it is, from 0, in a roll of several kinds. Left out in a roll of one kind. */
  group?: number;
};

/** One throw of the dice: what was asked for, every die thrown, and the total. */
export type Roll = {
  /** Unique within one history. */
  id: string;
  spec: RollSpec;
  /** Every die's face, in the order thrown: rerolled dice and the dice an explosion added are among them. */
  faces: number[];
  /** Which faces count: all of them unless some are dropped or rerolled. */
  kept: boolean[];
  /** The kept faces added up, plus the bonus. */
  total: number;
  /** Epoch milliseconds. */
  at: number;
  /** The seed this roll came from, when it is reproducible. */
  seed: string | null;
  /** What happened to each die, one entry per face. Every roll this package makes has it; `diceOf` reads it or works it out. */
  dice?: DieRoll[];
  /** On a roll that held some dice from the roll before: which faces were held and not thrown again. Left out of an ordinary roll. */
  held?: boolean[];
};

/** The dice a tray shows when nothing else is asked for: 2d6. */
export const DEFAULT_SPEC: RollSpec = { count: 2, sides: 6, modifier: 0, keep: "all" };

/** One of the dice the tray has a button for. */
export function isDieSides(value: unknown): value is DieSides {
  return typeof value === "number" && (DIE_SIDES as readonly number[]).includes(value);
}

/** Any die this package can throw: two to a thousand sides, or a Fate die. */
export function isSides(value: unknown): value is Sides {
  return value === "F" || (typeof value === "number" && Number.isInteger(value) && value >= MIN_SIDES && value <= MAX_SIDES);
}

/** The lowest and highest face of one die. */
export function faceRange(sides: Sides): { low: number; high: number } {
  return sides === "F" ? { low: -1, high: 1 } : { low: 1, high: sides };
}

/** How many dice of one group count towards the total. For a roll of several kinds, ask each of `groupsOf`. */
export function keptCount(group: DiceGroup): number {
  return group.keep === "all" ? group.count : (group.keepCount ?? 1);
}

/** The kinds of dice in a roll, in order: the spec's own first, then the rest. */
export function groupsOf(spec: RollSpec): DiceGroup[] {
  const first: DiceGroup = { count: spec.count, sides: spec.sides, keep: spec.keep };
  if (spec.keepCount !== undefined) first.keepCount = spec.keepCount;
  if (spec.explode !== undefined) first.explode = spec.explode;
  if (spec.reroll !== undefined) first.reroll = spec.reroll;
  if (spec.rerollUntil !== undefined) first.rerollUntil = spec.rerollUntil;
  return [first, ...(spec.more ?? [])];
}

/** How many dice a roll asks for, over all its kinds. */
export function diceCount(spec: RollSpec): number {
  return groupsOf(spec).reduce((sum, group) => sum + group.count, 0);
}

/** A spec from its kinds of dice and a bonus, brought into range. */
export function specOf(groups: readonly Partial<DiceGroup>[], modifier = 0): RollSpec {
  const [first, ...more] = groups;
  return normalizeSpec({ ...first, modifier, more: more as DiceGroup[] });
}

/** Whether the dice may explode: numbered dice of a hundred sides or fewer, all of them kept. */
export function mayExplode(sides: Sides, keep: Keep): boolean {
  return sides !== "F" && sides <= MAX_EXPLODING_SIDES && keep === "all";
}

/** Whether a reroll at this face leaves something to do: it must reroll the lowest face and spare the highest. */
export function mayReroll(sides: Sides, reroll: unknown): reroll is number {
  const { low, high } = faceRange(sides);
  return typeof reroll === "number" && Number.isInteger(reroll) && reroll >= low && reroll < high;
}

/** Whether a die may be rerolled until it clears this face: the reroll must match the lowest face and no more than half of them. */
export function mayRerollUntil(sides: Sides, reroll: unknown): reroll is number {
  const { low, high } = faceRange(sides);
  return mayReroll(sides, reroll) && (reroll - low + 1) * 2 <= high - low + 1;
}

/** Whether some dice of a roll can be held while the rest are thrown again: plain dice only, none rerolled, exploding, kept or dropped. */
export function canHold(spec: RollSpec): boolean {
  return groupsOf(spec).every((g) => g.keep === "all" && g.explode !== true && g.reroll === undefined && g.rerollUntil === undefined);
}

/** One kind of dice brought into range, its count already settled. */
function normalizeGroup(group: Partial<DiceGroup>, count: number): DiceGroup {
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
  return fair;
}

/** Whether two kinds are the same dice under the same rules, all of them added: then they are one kind with more dice. */
function sameDice(a: DiceGroup, b: DiceGroup): boolean {
  return a.sides === b.sides && a.keep === "all" && b.keep === "all" && a.explode === b.explode && a.reroll === b.reroll && a.rerollUntil === b.rerollUntil;
}

/**
 * A spec brought into range, so a hand-typed or stored one can never roll
 * eleven dice, five kinds or a die with no faces. A part that cannot be kept
 * is left out, never guessed at; `checkNotation` is the strict reader, and
 * says which part. Two kinds that are the same dice under the same rules
 * become one: `2d6+3d6` is `5d6`.
 */
export function normalizeSpec(spec: Partial<RollSpec>): RollSpec {
  const count = Math.min(MAX_DICE, Math.max(MIN_DICE, Math.trunc(Number(spec.count) || DEFAULT_SPEC.count)));
  const modifier = Math.min(MAX_MODIFIER, Math.max(-MAX_MODIFIER, Math.trunc(Number(spec.modifier) || 0)));
  const groups: DiceGroup[] = [normalizeGroup(spec, count)];
  let room = MAX_DICE - count;
  for (const given of Array.isArray(spec.more) ? spec.more : []) {
    if (room < 1) break;
    if (typeof given !== "object" || given === null || !isSides(given.sides)) continue;
    const asked = Math.min(room, Math.max(MIN_DICE, Math.trunc(Number(given.count) || 1)));
    const group = normalizeGroup(given, asked);
    const twin = groups.find((g) => sameDice(g, group));
    if (twin !== undefined) twin.count += group.count;
    else if (groups.length < MAX_GROUPS) groups.push(group);
    else continue;
    room -= group.count;
  }
  const [first, ...more] = groups as [DiceGroup, ...DiceGroup[]];
  const fair: RollSpec = { count: first.count, sides: first.sides, modifier, keep: first.keep };
  if (first.keepCount !== undefined) fair.keepCount = first.keepCount;
  if (first.explode !== undefined) fair.explode = first.explode;
  if (first.reroll !== undefined) fair.reroll = first.reroll;
  if (first.rerollUntil !== undefined) fair.rerollUntil = first.rerollUntil;
  if (more.length > 0) fair.more = more;
  return fair;
}

/** Which faces count towards the total when one is kept. Ties keep the first die that shows the kept value. */
export function keptFaces(faces: readonly number[], keep: Keep): boolean[] {
  if (keep === "all") return faces.map(() => true);
  const target = keep === "highest" ? Math.max(...faces) : Math.min(...faces);
  const index = faces.indexOf(target);
  return faces.map((_, i) => i === index);
}

/** The kept faces added up, plus the bonus. */
export function totalOf(faces: readonly number[], kept: readonly boolean[], modifier: number): number {
  return faces.reduce((sum, face, i) => (kept[i] ? sum + face : sum), 0) + modifier;
}

/**
 * The one set of rules for a throw, whether the faces come from a generator
 * or from a roll that was kept or shared. The kinds of dice are thrown in
 * order, and each die asked for is settled before the next is touched: it is
 * thrown; if it is to be rerolled it is thrown again (once, or until it
 * clears); if the face that stands is the highest and the dice explode it
 * throws another die, which follows the same rules. Then keep or drop picks
 * among that kind's dice left standing. Null when `draw` runs out.
 */
function play(spec: RollSpec, draw: (sides: Sides) => number | null): DieRoll[] | null {
  const groups = groupsOf(spec);
  const dice: DieRoll[] = [];
  let die = 0;
  for (const [index, group] of groups.entries()) {
    const { high } = faceRange(group.sides);
    const mine: DieRoll[] = [];
    const thrown = (face: number, status: DieStatus, exploded: boolean): DieRoll => {
      const one: DieRoll = { face, status, exploded, die };
      if (groups.length > 1) one.group = index;
      mine.push(one);
      return one;
    };
    for (let n = 0; n < group.count; n++, die++) {
      let explosions = group.explode === true ? MAX_EXPLOSIONS : 0;
      for (;;) {
        let face = draw(group.sides);
        if (face === null) return null;
        if (group.reroll !== undefined && face <= group.reroll) {
          thrown(face, "rerolled", false);
          face = draw(group.sides);
          if (face === null) return null;
        }
        if (group.rerollUntil !== undefined) {
          for (let again = 0; again < MAX_REROLLS && face <= group.rerollUntil; again++) {
            thrown(face, "rerolled", false);
            face = draw(group.sides);
            if (face === null) return null;
          }
        }
        const exploded = explosions > 0 && face === high;
        thrown(face, "kept", exploded);
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
    dice.push(...mine);
  }
  return dice;
}

/**
 * What happened to each die of a roll, from its faces alone: which were
 * rerolled, which exploded, which were dropped. Null when the faces are not
 * ones this spec could have thrown, one too many or too few included.
 */
export function readDice(spec: RollSpec, faces: readonly unknown[]): DieRoll[] | null {
  let used = 0;
  const dice = play(spec, (sides) => {
    const { low, high } = faceRange(sides);
    const face = faces[used];
    if (used >= faces.length || typeof face !== "number" || !Number.isInteger(face) || face < low || face > high) return null;
    used += 1;
    return face;
  });
  return dice === null || used !== faces.length ? null : dice;
}

/** The kind of die one die of a roll is. */
export function sidesOf(spec: RollSpec, die: DieRoll): Sides {
  return (groupsOf(spec)[die.group ?? 0] ?? spec).sides;
}

/** The dice of a roll: as recorded, or worked out from its faces for a roll made by hand or by an older version. */
export function diceOf(roll: Roll): DieRoll[] {
  return (
    roll.dice ??
    readDice(roll.spec, roll.faces) ??
    roll.faces.map((face, i): DieRoll => ({ face, status: roll.kept[i] === false ? "dropped" : "kept", exploded: false, die: i }))
  );
}

let counter = 0;

function draws(source: RandomSource): (sides: Sides) => number {
  return (sides) => {
    const { low, high } = faceRange(sides);
    return randomInt(source, high - low + 1) + low;
  };
}

function made(fair: RollSpec, dice: DieRoll[], source: RandomSource, at: number): Roll {
  const faces = dice.map((d) => d.face);
  const kept = dice.map((d) => d.status === "kept");
  counter = (counter + 1) % 1_000_000;
  return {
    id: `${at.toString(36)}-${counter.toString(36)}`,
    spec: fair,
    faces,
    kept,
    total: totalOf(faces, kept, fair.modifier),
    at,
    seed: source.seed,
    dice,
  };
}

/** Throw the dice. The source is crypto unless a seeded one is given. */
export function roll(spec: Partial<RollSpec>, source: RandomSource = cryptoSource(), at: number = Date.now()): Roll {
  const fair = normalizeSpec(spec);
  return made(fair, play(fair, draws(source)) as DieRoll[], source, at);
}

/**
 * Hold some dice of a roll and throw the rest again, as Yacht and Farkle do.
 * `held[i]` is whether face i stays. The dice not held are thrown in order
 * from the source, so from a seed the second roll replays like the first.
 * The roll that comes back says which faces were held. Only plain dice can be
 * held (`canHold`); anything else is a RangeError, as is a `held` that does
 * not fit the roll.
 */
export function rollHeld(previous: Roll, held: readonly boolean[], source: RandomSource = cryptoSource(), at: number = Date.now()): Roll {
  if (!canHold(previous.spec)) throw new RangeError("korokoro: only plain dice can be held");
  if (held.length !== previous.faces.length) throw new RangeError("korokoro: held must say yes or no for every die of the roll");
  const draw = draws(source);
  let next = 0;
  const dice = play(previous.spec, (sides) => {
    const i = next++;
    return held[i] === true ? (previous.faces[i] as number) : draw(sides);
  }) as DieRoll[];
  return { ...made(previous.spec, dice, source, at), held: held.map((h) => h === true) };
}

/** The lowest and highest totals a spec can produce. An exploding die's highest is every explosion it is allowed. */
export function rangeOf(spec: RollSpec): { min: number; max: number } {
  let min = spec.modifier;
  let max = spec.modifier;
  for (const group of groupsOf(spec)) {
    const { low, high } = faceRange(group.sides);
    const dice = keptCount(group);
    min += dice * low;
    max += dice * (group.explode === true ? high * (MAX_EXPLOSIONS + 1) : high);
  }
  return { min, max };
}
