import { cryptoSource, randomInt, type RandomSource } from "./random.ts";

/** The dice a tabletop player owns: the polyhedral set, the thirty-sided die, and the percentile die. */
export const DIE_SIDES = [4, 6, 8, 10, 12, 20, 30, 100] as const;
export type DieSides = (typeof DIE_SIDES)[number];

/** One to five dice at once: as many as a hand holds, and as many as read at a glance. */
export const MIN_DICE = 1;
export const MAX_DICE = 5;
export const MAX_MODIFIER = 99;

/**
 * Which dice count towards the total. `all` adds every die; `highest` and
 * `lowest` keep one, which is how advantage and disadvantage are rolled.
 */
export type Keep = "all" | "highest" | "lowest";

export type RollSpec = {
  count: number;
  sides: DieSides;
  /** Added to the total, as in 1d20+5. */
  modifier: number;
  keep: Keep;
};

export type Roll = {
  /** Unique within one history. */
  id: string;
  spec: RollSpec;
  /** Each die's face, in the order thrown. */
  faces: number[];
  /** Which faces count: all of them unless one is kept. */
  kept: boolean[];
  total: number;
  /** Epoch milliseconds. */
  at: number;
  /** The seed this roll came from, when it is reproducible. */
  seed: string | null;
};

export const DEFAULT_SPEC: RollSpec = { count: 2, sides: 6, modifier: 0, keep: "all" };

export function isDieSides(value: unknown): value is DieSides {
  return typeof value === "number" && (DIE_SIDES as readonly number[]).includes(value);
}

/** A spec brought into range, so a hand-typed or stored one can never roll six dice or a d7. */
export function normalizeSpec(spec: Partial<RollSpec>): RollSpec {
  const count = Math.min(MAX_DICE, Math.max(MIN_DICE, Math.trunc(Number(spec.count) || DEFAULT_SPEC.count)));
  const sides = isDieSides(spec.sides) ? spec.sides : DEFAULT_SPEC.sides;
  const modifier = Math.min(MAX_MODIFIER, Math.max(-MAX_MODIFIER, Math.trunc(Number(spec.modifier) || 0)));
  // Keeping one of one die is simply rolling it.
  const keep: Keep = count > 1 && (spec.keep === "highest" || spec.keep === "lowest") ? spec.keep : "all";
  return { count, sides, modifier, keep };
}

/** Which faces count towards the total. Ties keep the first die that shows the kept value. */
export function keptFaces(faces: readonly number[], keep: Keep): boolean[] {
  if (keep === "all") return faces.map(() => true);
  const target = keep === "highest" ? Math.max(...faces) : Math.min(...faces);
  const index = faces.indexOf(target);
  return faces.map((_, i) => i === index);
}

export function totalOf(faces: readonly number[], kept: readonly boolean[], modifier: number): number {
  return faces.reduce((sum, face, i) => (kept[i] ? sum + face : sum), 0) + modifier;
}

let counter = 0;

/** Throw the dice. The source is crypto unless a seeded one is given. */
export function roll(spec: Partial<RollSpec>, source: RandomSource = cryptoSource(), at: number = Date.now()): Roll {
  const fair = normalizeSpec(spec);
  const faces = Array.from({ length: fair.count }, () => randomInt(source, fair.sides) + 1);
  const kept = keptFaces(faces, fair.keep);
  counter = (counter + 1) % 1_000_000;
  return {
    id: `${at.toString(36)}-${counter.toString(36)}`,
    spec: fair,
    faces,
    kept,
    total: totalOf(faces, kept, fair.modifier),
    at,
    seed: source.seed,
  };
}

/** The lowest and highest totals a spec can produce. */
export function rangeOf(spec: RollSpec): { min: number; max: number } {
  const dice = spec.keep === "all" ? spec.count : 1;
  return { min: dice + spec.modifier, max: dice * spec.sides + spec.modifier };
}
