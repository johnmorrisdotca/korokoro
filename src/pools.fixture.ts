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

/** A source that throws the faces it is handed, in order, on numbered dice. */
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

/** Every total two lists of equally likely totals make together, by pairing them all. */
export function paired(...kinds: number[][]): Map<number, number> {
  let totals = new Map<number, number>([[0, 1]]);
  for (const kind of kinds) {
    const next = new Map<number, number>();
    for (const [t, p] of totals)
      for (const face of kind) next.set(t + face, (next.get(t + face) ?? 0) + p / kind.length);
    totals = next;
  }
  return totals;
}

export const faces = (sides: number) => Array.from({ length: sides }, (_, i) => i + 1);

export function expectSame(spec: RollSpec, want: Map<number, number>, shift = 0) {
  const d = distributionOf(spec);
  expect(sum(d.probabilities)).toBeCloseTo(1, 12);
  expect(d.probabilities).toHaveLength(d.max - d.min + 1);
  for (const [total, chance] of want)
    expect(chanceExactly(spec, total + shift), `${formatNotation(spec)} = ${total + shift}`).toBeCloseTo(chance, 12);
}
