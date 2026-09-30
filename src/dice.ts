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
/** The most times one roll may be repeated as a set: `6#4d6dl1` is six. */
export const MAX_TIMES = 100;
/** The most faces a custom die has, and the fewest is two. */
export const MAX_FACES = 20;
/** The longest a custom face's words may be, in characters. */
export const MAX_LABEL = 16;
/** The largest number a custom face may be worth, either way. */
export const MAX_FACE_VALUE = 9999;
/** The heaviest a face of a loaded die may be weighted. */
export const MAX_WEIGHT = 99;
/** The largest die that may be loaded. */
export const MAX_LOADED_SIDES = 100;

/**
 * One face of a custom die: what it says, what it is worth in a total if it
 * is worth anything, and a colour for it. The words are text and only ever
 * shown as text.
 */
export type CustomFace = {
  /** What the face says: 1 to `MAX_LABEL` characters. */
  label: string;
  /** What it adds to a total. Left out of a face that is only words, which adds nothing. */
  value?: number;
  /** A colour for the face, as `#rgb` or `#rrggbb`. Left out for the tray's own. */
  colour?: string;
};

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
  /**
   * A custom die: its faces, in order, and `sides` is how many there are. A
   * face written twice comes up twice as often. A roll records a custom face
   * by its place, from 1. Left out of a numbered die and a Fate die.
   */
  faces?: CustomFace[];
  /**
   * A loaded die: how heavily each face is weighted, from the lowest face up,
   * where a fair die has every face at 1. `[1, 1, 1, 1, 1, 3]` is a d6 that
   * shows its 6 three times in eight. Left out of a fair die, and never
   * present by accident: `isFair` is false for any roll that has it.
   */
  weights?: number[];
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
  /** How many times `rollMany` throws the roll, as a set: 6 for `6#4d6dl1`. Left out when it is once. `roll` throws it once whatever this says. */
  times?: number;
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
  /** What the face says, on a custom die. Left out of a numbered die. */
  label?: string;
  /** What the face is worth in the total, on a custom die: 0 for a face that is only words. Left out of a numbered die, which is worth its face. */
  value?: number;
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
  /** True on a roll of loaded dice, and left out of every other: a loaded roll always says so. */
  loaded?: true;
  /** On a roll thrown as one of a set: which set, which roll of it from 0, and how many there are. Left out of a roll thrown on its own. */
  set?: { id: string; index: number; of: number };
};

/** The same roll thrown several times in one go, with what the set comes to. */
export type RollSet = {
  /** Every roll, in the order thrown. */
  rolls: Roll[];
  /** The totals added up. */
  sum: number;
  /** The highest total. */
  highest: number;
  /** The lowest total. */
  lowest: number;
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

/** The lowest and highest face one die of a group can be recorded as: a custom die's faces are numbered from 1. */
function facesOf(group: DiceGroup): { low: number; high: number } {
  return group.faces !== undefined ? { low: 1, high: group.faces.length } : faceRange(group.sides);
}

/** What a face of a group's die is worth in a total: its number, or for a custom face its value, which is 0 when it is only words. */
export function valueOfFace(group: DiceGroup, face: number): number {
  return group.faces !== undefined ? (group.faces[face - 1]?.value ?? 0) : face;
}

/** The chance of each face of one die of a group, from its lowest face up. They sum to 1; a fair die's are all the same. */
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
 */
export function dieName(group: DiceGroup): string {
  if (group.faces !== undefined) {
    const face = (f: CustomFace) => `${f.value !== undefined && f.label === String(f.value) ? f.label : f.value !== undefined ? `${f.label}=${f.value}` : f.label}${f.colour ?? ""}`;
    return `d[${group.faces.map(face).join(",")}]`;
  }
  if (group.weights === undefined) return `d${group.sides}`;
  const { low } = faceRange(group.sides);
  const loaded = group.weights.flatMap((w, i) => (w === 1 ? [] : [`${low + i}:${w}`]));
  return `d${group.sides}{${loaded.join(",")}}`;
}

/** Whether a roll has a loaded die in it. */
export function isLoaded(spec: RollSpec): boolean {
  return groupsOf(spec).some((g) => g.weights !== undefined);
}

/**
 * Whether a roll is of plain fair dice and nothing else: no loaded die, and
 * no custom die either, whose faces are whatever somebody made them. A site
 * that wants only honest standard dice refuses anything this is false for.
 */
export function isFair(spec: RollSpec): boolean {
  return groupsOf(spec).every((g) => g.weights === undefined && g.faces === undefined);
}

/**
 * Whether a roll's total says anything. It does unless every die in it is a
 * custom die with no numbers on it at all, such as Yes, No, Maybe: then the
 * roll is its faces' words, and the total is 0 and means nothing.
 */
export function hasTotal(spec: RollSpec): boolean {
  return !groupsOf(spec).every((g) => g.faces !== undefined && g.faces.every((f) => f.value === undefined));
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
  if (spec.faces !== undefined) first.faces = spec.faces;
  if (spec.weights !== undefined) first.weights = spec.weights;
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

/** Whether the dice may explode: numbered dice of a hundred sides or fewer, all of them kept. A custom die never does. */
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

/** Characters a custom face's words may not hold: the ones notation is written with. */
const NOT_IN_A_LABEL = /[,[\]{}=#+]/;
/** A control character: a new line, a tab, a bell. None belongs in a face's words. */
const isControl = (text: string) => [...text].some((c) => (c.codePointAt(0) as number) < 32 || c.codePointAt(0) === 127);

/** A custom die's faces, checked: the faces as given if every one is sound, or undefined. */
export function customFaces(faces: unknown): CustomFace[] | undefined {
  if (!Array.isArray(faces) || faces.length < MIN_SIDES || faces.length > MAX_FACES) return undefined;
  const sound: CustomFace[] = [];
  for (const given of faces as unknown[]) {
    if (typeof given !== "object" || given === null) return undefined;
    const { label, value, colour } = given as Record<string, unknown>;
    if (typeof label !== "string" || label !== label.trim() || label === "" || [...label].length > MAX_LABEL || NOT_IN_A_LABEL.test(label) || isControl(label)) return undefined;
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
 */
export function loadedWeights(sides: Sides, weights: unknown): number[] | undefined {
  if (sides === "F" || sides > MAX_LOADED_SIDES || !Array.isArray(weights) || weights.length !== sides) return undefined;
  if (!weights.every((w) => typeof w === "number" && Number.isInteger(w) && w >= 0 && w <= MAX_WEIGHT)) return undefined;
  const all = weights as number[];
  if (all.filter((w) => w > 0).length < 2) return undefined;
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const common = all.reduce(gcd);
  const least = all.map((w) => w / common);
  return least.every((w) => w === 1) ? undefined : least;
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
  return fair;
}

/** Whether two kinds are the same dice under the same rules, all of them added: then they are one kind with more dice. */
function sameDice(a: DiceGroup, b: DiceGroup): boolean {
  return dieName(a) === dieName(b) && a.keep === "all" && b.keep === "all" && a.explode === b.explode && a.reroll === b.reroll && a.rerollUntil === b.rerollUntil;
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
  if (first.faces !== undefined) fair.faces = first.faces;
  if (first.weights !== undefined) fair.weights = first.weights;
  if (more.length > 0) fair.more = more;
  const times = Math.min(MAX_TIMES, Math.trunc(Number(spec.times) || 1));
  if (times > 1) fair.times = times;
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
function play(spec: RollSpec, draw: (group: DiceGroup) => number | null): DieRoll[] | null {
  const groups = groupsOf(spec);
  const dice: DieRoll[] = [];
  let die = 0;
  for (const [index, group] of groups.entries()) {
    const { high } = facesOf(group);
    const mine: DieRoll[] = [];
    const thrown = (face: number, status: DieStatus, exploded: boolean): DieRoll => {
      const one: DieRoll = { face, status, exploded, die };
      if (groups.length > 1) one.group = index;
      const custom = group.faces?.[face - 1];
      if (custom !== undefined) {
        one.label = custom.label;
        one.value = custom.value ?? 0;
      }
      mine.push(one);
      return one;
    };
    for (let n = 0; n < group.count; n++, die++) {
      let explosions = group.explode === true ? MAX_EXPLOSIONS : 0;
      for (;;) {
        let face = draw(group);
        if (face === null) return null;
        if (group.reroll !== undefined && face <= group.reroll) {
          thrown(face, "rerolled", false);
          face = draw(group);
          if (face === null) return null;
        }
        if (group.rerollUntil !== undefined) {
          for (let again = 0; again < MAX_REROLLS && face <= group.rerollUntil; again++) {
            thrown(face, "rerolled", false);
            face = draw(group);
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
  const dice = play(spec, (group) => {
    const { low, high } = facesOf(group);
    const face = faces[used];
    if (used >= faces.length || typeof face !== "number" || !Number.isInteger(face) || face < low || face > high) return null;
    // A face weighted at nothing never comes up.
    if (group.weights?.[face - low] === 0) return null;
    used += 1;
    return face;
  });
  return dice === null || used !== faces.length ? null : dice;
}

/** The kind of dice one die of a roll belongs to, with its rules, faces and weights. */
export function groupOf(spec: RollSpec, die: DieRoll): DiceGroup {
  return groupsOf(spec)[die.group ?? 0] ?? groupsOf(spec)[0]!;
}

/** The kind of die one die of a roll is. */
export function sidesOf(spec: RollSpec, die: DieRoll): Sides {
  return groupOf(spec, die).sides;
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

/**
 * One die thrown from a source. A fair die is one fair pick among its faces.
 * A loaded die is one fair pick among its weights, all laid end to end, so
 * the source is drawn from in the same way and a seed replays a loaded roll
 * as exactly as a fair one.
 */
function draws(source: RandomSource): (group: DiceGroup) => number {
  return (group) => {
    const { low, high } = facesOf(group);
    if (group.weights === undefined) return randomInt(source, high - low + 1) + low;
    let pick = randomInt(source, group.weights.reduce((a, b) => a + b, 0));
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
function totalOfDice(spec: RollSpec, dice: readonly DieRoll[]): number {
  return dice.reduce((sum, die) => (die.status === "kept" ? sum + valueOfFace(groupOf(spec, die), die.face) : sum), spec.modifier);
}

function made(fair: RollSpec, dice: DieRoll[], source: RandomSource, at: number): Roll {
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

/** What a set of rolls comes to: their sum, the highest and the lowest. */
export function setOf(rolls: Roll[]): RollSet {
  const totals = rolls.map((r) => r.total);
  return { rolls, sum: totals.reduce((a, b) => a + b, 0), highest: Math.max(...totals), lowest: Math.min(...totals) };
}

/**
 * Throw the same dice several times in one go, as ability scores are rolled:
 * `4d6dl1` six times. The rolls are drawn one after another from the one
 * source, so a seed replays the whole set, and each is an ordinary roll that
 * says which set it belongs to. `times` is the spec's own unless given, from
 * 1 to `MAX_TIMES`.
 */
export function rollMany(spec: Partial<RollSpec>, times?: number, source: RandomSource = cryptoSource(), at: number = Date.now()): RollSet {
  const fair = normalizeSpec(spec);
  const many = Math.min(MAX_TIMES, Math.max(1, Math.trunc(Number(times ?? fair.times) || 1)));
  const rolls: Roll[] = [];
  for (let index = 0; index < many; index++) rolls.push(made(fair, play(fair, draws(source)) as DieRoll[], source, at));
  const id = rolls[0]?.id ?? "";
  if (many > 1) rolls.forEach((r, index) => (r.set = { id, index, of: many }));
  return setOf(rolls);
}

/**
 * A roll put back together from its spec and its faces: for a history read
 * from storage and a roll read from a link. The dice, which are kept and the
 * total are all worked out again, never trusted as given. Null when the dice
 * could not have shown those faces.
 */
export function rollFrom(spec: RollSpec, faces: readonly unknown[], id: string, at: number, seed: string | null): Roll | null {
  const dice = readDice(spec, faces);
  if (dice === null) return null;
  const read: Roll = { id, spec, faces: dice.map((d) => d.face), kept: dice.map((d) => d.status === "kept"), total: totalOfDice(spec, dice), at, seed, dice };
  if (isLoaded(spec)) read.loaded = true;
  return read;
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
  const dice = play(previous.spec, (group) => {
    const i = next++;
    return held[i] === true ? (previous.faces[i] as number) : draw(group);
  }) as DieRoll[];
  return { ...made(previous.spec, dice, source, at), held: held.map((h) => h === true) };
}

/** The lowest and highest totals a spec can produce. An exploding die's highest is every explosion it is allowed. */
export function rangeOf(spec: RollSpec): { min: number; max: number } {
  let min = spec.modifier;
  let max = spec.modifier;
  for (const group of groupsOf(spec)) {
    const { low, high } = facesOf(group);
    // What the die can be worth: every face that can come up, a loaded die's weightless faces left out.
    const worth: number[] = [];
    for (let face = low; face <= high; face++) if (group.weights?.[face - low] !== 0) worth.push(valueOfFace(group, face));
    const dice = keptCount(group);
    min += dice * Math.min(...worth);
    max += dice * (group.explode === true ? high * (MAX_EXPLOSIONS + 1) : Math.max(...worth));
  }
  return { min, max };
}
