import { cryptoSource, randomInt, type RandomSource } from "./random.ts";

/**
 * The dice the tray offers as buttons: the polyhedral set, the thirty-sided
 * die, and the percentile die. Any other die is reached by notation.
 */
export const DIE_SIDES = [4, 6, 8, 10, 12, 20, 30, 100] as const;
export type DieSides = (typeof DIE_SIDES)[number];

/** A die of any size from a coin to a d1000, or a Fate die, whose faces are −1, 0 and +1. */
export type Sides = number | "F";
export const MIN_SIDES = 2;
export const MAX_SIDES = 1000;

/** One to five dice at once: as many as a hand holds, and as many as read at a glance. */
export const MIN_DICE = 1;
export const MAX_DICE = 5;
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
 * Which dice count towards the total. `all` adds every die; `highest` and
 * `lowest` keep one, which is how advantage and disadvantage are rolled, or
 * as many as `keepCount` says.
 */
export type Keep = "all" | "highest" | "lowest";

export type RollSpec = {
  count: number;
  sides: Sides;
  /** Added to the total, as in 1d20+5. */
  modifier: number;
  keep: Keep;
  /** How many dice `highest` or `lowest` keep. Left out when it is one. */
  keepCount?: number;
  /** A die showing its highest face throws another, which may do the same. Left out when the dice do not explode. */
  explode?: true;
  /** A die showing this face or lower is thrown again, once, and the new face stands. Left out when nothing is rerolled. */
  reroll?: number;
};

/**
 * One die as it was thrown. `kept` counts towards the total, `dropped` was
 * left out by keep or drop, and `rerolled` was thrown again: the die after it
 * is its replacement.
 */
export type DieStatus = "kept" | "dropped" | "rerolled";

export type DieRoll = {
  face: number;
  status: DieStatus;
  /** It showed its highest face and threw the die after it. */
  exploded: boolean;
  /** Which of the dice asked for this one belongs to, from 0: a reroll or an explosion belongs to the die that caused it. */
  die: number;
};

export type Roll = {
  /** Unique within one history. */
  id: string;
  spec: RollSpec;
  /** Every die's face, in the order thrown: rerolled dice and the dice an explosion added are among them. */
  faces: number[];
  /** Which faces count: all of them unless some are dropped or rerolled. */
  kept: boolean[];
  total: number;
  /** Epoch milliseconds. */
  at: number;
  /** The seed this roll came from, when it is reproducible. */
  seed: string | null;
  /** What happened to each die, one entry per face. Every roll this package makes has it; `diceOf` reads it or works it out. */
  dice?: DieRoll[];
};

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

/** How many dice count towards the total. */
export function keptCount(spec: RollSpec): number {
  return spec.keep === "all" ? spec.count : (spec.keepCount ?? 1);
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

/**
 * A spec brought into range, so a hand-typed or stored one can never roll six
 * dice or a die with no faces. A part that cannot be kept is left out, never
 * guessed at; `checkNotation` is the strict reader, and says which part.
 */
export function normalizeSpec(spec: Partial<RollSpec>): RollSpec {
  const count = Math.min(MAX_DICE, Math.max(MIN_DICE, Math.trunc(Number(spec.count) || DEFAULT_SPEC.count)));
  const sides = isSides(spec.sides) ? spec.sides : DEFAULT_SPEC.sides;
  const modifier = Math.min(MAX_MODIFIER, Math.max(-MAX_MODIFIER, Math.trunc(Number(spec.modifier) || 0)));
  // Keeping one of one die is simply rolling it.
  const keep: Keep = count > 1 && (spec.keep === "highest" || spec.keep === "lowest") ? spec.keep : "all";
  const fair: RollSpec = { count, sides, modifier, keep };
  if (keep !== "all") {
    const kept = Math.min(count - 1, Math.max(1, Math.trunc(Number(spec.keepCount) || 1)));
    if (kept > 1) fair.keepCount = kept;
  }
  if (spec.explode === true && mayExplode(sides, keep)) fair.explode = true;
  if (mayReroll(sides, spec.reroll)) fair.reroll = spec.reroll;
  return fair;
}

/** Which faces count towards the total when one is kept. Ties keep the first die that shows the kept value. */
export function keptFaces(faces: readonly number[], keep: Keep): boolean[] {
  if (keep === "all") return faces.map(() => true);
  const target = keep === "highest" ? Math.max(...faces) : Math.min(...faces);
  const index = faces.indexOf(target);
  return faces.map((_, i) => i === index);
}

export function totalOf(faces: readonly number[], kept: readonly boolean[], modifier: number): number {
  return faces.reduce((sum, face, i) => (kept[i] ? sum + face : sum), 0) + modifier;
}

/**
 * The one set of rules for a throw, whether the faces come from a generator
 * or from a roll that was kept or shared. Each die asked for is settled before
 * the next is touched: it is thrown; at the reroll face or lower it is thrown
 * again, once; if the face that stands is the highest and the dice explode it
 * throws another die, which follows the same rules. Then keep or drop picks
 * among the dice left standing. Null when `draw` runs out.
 */
function play(spec: RollSpec, draw: () => number | null): DieRoll[] | null {
  const { high } = faceRange(spec.sides);
  const dice: DieRoll[] = [];
  for (let die = 0; die < spec.count; die++) {
    let explosions = spec.explode === true ? MAX_EXPLOSIONS : 0;
    for (;;) {
      let face = draw();
      if (face === null) return null;
      if (spec.reroll !== undefined && face <= spec.reroll) {
        dice.push({ face, status: "rerolled", exploded: false, die });
        face = draw();
        if (face === null) return null;
      }
      const exploded = explosions > 0 && face === high;
      dice.push({ face, status: "kept", exploded, die });
      if (!exploded) break;
      explosions -= 1;
    }
  }
  if (spec.keep !== "all") {
    // The best of the dice left standing, a tie going to the die thrown first.
    const standing = dice.filter((d) => d.status === "kept");
    const best = [...standing].sort((a, b) => (spec.keep === "highest" ? b.face - a.face : a.face - b.face));
    const keeping = new Set(best.slice(0, keptCount(spec)));
    for (const d of standing) if (!keeping.has(d)) d.status = "dropped";
  }
  return dice;
}

/**
 * What happened to each die of a roll, from its faces alone: which were
 * rerolled, which exploded, which were dropped. Null when the faces are not
 * ones this spec could have thrown, one too many or too few included.
 */
export function readDice(spec: RollSpec, faces: readonly unknown[]): DieRoll[] | null {
  const { low, high } = faceRange(spec.sides);
  let used = 0;
  const dice = play(spec, () => {
    const face = faces[used];
    if (used >= faces.length || typeof face !== "number" || !Number.isInteger(face) || face < low || face > high) return null;
    used += 1;
    return face;
  });
  return dice === null || used !== faces.length ? null : dice;
}

/** The dice of a roll: as recorded, or worked out from its faces for a roll made by hand or by an older version. */
export function diceOf(roll: Roll): DieRoll[] {
  return (
    roll.dice ??
    readDice(roll.spec, roll.faces) ??
    roll.faces.map((face, i) => ({ face, status: roll.kept[i] === false ? "dropped" : "kept", exploded: false, die: i }))
  );
}

let counter = 0;

/** Throw the dice. The source is crypto unless a seeded one is given. */
export function roll(spec: Partial<RollSpec>, source: RandomSource = cryptoSource(), at: number = Date.now()): Roll {
  const fair = normalizeSpec(spec);
  const { low, high } = faceRange(fair.sides);
  const dice = play(fair, () => randomInt(source, high - low + 1) + low) as DieRoll[];
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

/** The lowest and highest totals a spec can produce. An exploding die's highest is every explosion it is allowed. */
export function rangeOf(spec: RollSpec): { min: number; max: number } {
  const { low, high } = faceRange(spec.sides);
  const dice = keptCount(spec);
  const top = spec.explode === true ? high * (MAX_EXPLOSIONS + 1) : high;
  return { min: dice * low + spec.modifier, max: dice * top + spec.modifier };
}
