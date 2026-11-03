import { expect } from "vitest";
import type { RollSpec } from "./dice.ts";
import { formatNotation, parseNotation } from "./notation.ts";
import { chanceExactly, distributionOf } from "./odds.ts";
import type { RandomSource } from "./random.ts";

export const dice = (text: string): RollSpec => {
  const spec = parseNotation(text);
  if (spec === null) throw new Error(`${text} should be dice`);
  return spec;
};

/** A source that throws the faces it is handed, in order, on a numbered die. */
export function scripted(faces: number[]): RandomSource {
  const left = [...faces];
  return {
    seed: null,
    next() {
      const face = left.shift();
      if (face === undefined) throw new Error("the script ran out of dice");
      return face - 1;
    },
  };
}

export const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/**
 * The odds by brute force, sharing nothing with odds.ts: every way the dice
 * can stand, each weighted by its chance, with the kept dice picked by sorting.
 */
export function counted(
  count: number,
  faces: number[],
  chance: (face: number) => number,
  total: (standing: number[]) => number,
): Map<number, number> {
  const out = new Map<number, number>();
  const walk = (standing: number[], weight: number) => {
    if (standing.length === count) {
      const t = total(standing);
      out.set(t, (out.get(t) ?? 0) + weight);
      return;
    }
    for (const face of faces) walk([...standing, face], weight * chance(face));
  };
  walk([], 1);
  return out;
}

export function expectSame(spec: RollSpec, want: Map<number, number>) {
  const d = distributionOf(spec);
  expect(sum(d.probabilities)).toBeCloseTo(1, 12);
  for (const [total, chance] of want)
    expect(chanceExactly(spec, total), `${formatNotation(spec)} = ${total}`).toBeCloseTo(chance, 12);
  // And nothing the count never reached.
  d.probabilities.forEach((p, i) => {
    if (!want.has(d.min + i)) expect(p, `${formatNotation(spec)} = ${d.min + i}`).toBeCloseTo(0, 15);
  });
}
