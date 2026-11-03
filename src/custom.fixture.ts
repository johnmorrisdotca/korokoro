import { expect } from "vitest";
import type { RollSpec } from "./dice.ts";
import { formatNotation, parseNotation } from "./notation.ts";
import { chanceExactly, distributionOf } from "./odds.ts";

export const dice = (text: string): RollSpec => {
  const spec = parseNotation(text);
  if (spec === null) throw new Error(`${text} should be dice`);
  return spec;
};
export const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** Every total some independent dice make, each die a list of [worth, chance]. */
export function paired(...kinds: [number, number][][]): Map<number, number> {
  let totals = new Map<number, number>([[0, 1]]);
  for (const kind of kinds) {
    const next = new Map<number, number>();
    for (const [t, p] of totals)
      for (const [worth, chance] of kind) next.set(t + worth, (next.get(t + worth) ?? 0) + p * chance);
    totals = next;
  }
  return totals;
}

export function expectSame(spec: RollSpec, want: Map<number, number>) {
  const d = distributionOf(spec);
  expect(sum(d.probabilities)).toBeCloseTo(1, 12);
  expect(d.probabilities).toHaveLength(d.max - d.min + 1);
  for (const [total, chance] of want)
    if (chance > 0) expect(chanceExactly(spec, total), `${formatNotation(spec)} = ${total}`).toBeCloseTo(chance, 12);
  d.probabilities.forEach((p, i) => {
    if (!want.has(d.min + i)) expect(p).toBeCloseTo(0, 15);
  });
  // The ends of a distribution are totals that can happen.
  expect(d.probabilities[0]).toBeGreaterThan(0);
  expect(d.probabilities.at(-1)).toBeGreaterThan(0);
}
