import { describe, expect, it } from "vitest";

import { cryptoSource, newSeed, randomInt, seededSource, type RandomSource } from "./random.ts";

describe("randomInt", () => {
  it("is never biased by a modulo: values past the last whole block are thrown away", () => {
    // 2^32 is 4 mod 6, so the top four values would favour faces 0 to 3 under `% 6`.
    const values = [2 ** 32 - 1, 2 ** 32 - 4, 7];
    const source: RandomSource = { seed: null, next: () => values.shift() as number };
    expect(randomInt(source, 6)).toBe(1);
    expect(values).toEqual([]);
  });

  it("covers every face and nothing else", () => {
    const source = seededSource("cover");
    const seen = new Set<number>();
    for (let i = 0; i < 2000; i++) seen.add(randomInt(source, 20));
    expect([...seen].sort((a, b) => a - b)).toEqual(Array.from({ length: 20 }, (_, i) => i));
  });

  it("throws a fair d30 from the seeded generator: each face about one time in thirty", () => {
    // 2^32 is 16 mod 30, so a modulo alone would lean towards the low sixteen faces.
    const source = seededSource("d30");
    const throws = 30_000;
    const counts = new Array<number>(30).fill(0);
    for (let i = 0; i < throws; i++) {
      const face = randomInt(source, 30);
      counts[face] = (counts[face] as number) + 1;
    }
    expect(counts.every((c) => c > 0)).toBe(true);
    const each = throws / 30;
    const chiSquare = counts.reduce((sum, c) => sum + (c - each) ** 2 / each, 0);
    // 49.59 is the 1% point for 29 degrees of freedom: a fair die passes 99 times in 100, and this seed is fixed.
    expect(chiSquare).toBeLessThan(49.59);
    for (const c of counts) expect(Math.abs(c - each)).toBeLessThan(each * 0.12);
  });

  it("refuses a range it cannot pick from", () => {
    expect(() => randomInt(seededSource("x"), 0)).toThrow(RangeError);
    expect(() => randomInt(seededSource("x"), 2.5)).toThrow(RangeError);
  });
});

describe("seededSource", () => {
  it("throws the same numbers for the same seed, and different ones for another", () => {
    const a = seededSource("table-7");
    const b = seededSource("table-7");
    const c = seededSource("table-8");
    const run = (s: RandomSource) => Array.from({ length: 8 }, () => s.next());
    const first = run(a);
    expect(run(b)).toEqual(first);
    expect(run(c)).not.toEqual(first);
    expect(a.seed).toBe("table-7");
  });

  it("is pinned: a seed shared today must throw the same dice next year", () => {
    const source = seededSource("korokoro");
    expect(Array.from({ length: 5 }, () => randomInt(source, 6) + 1)).toEqual([5, 2, 5, 5, 3]);
  });
});

describe("cryptoSource", () => {
  it("reads the platform's generator and says it has no seed", () => {
    const source = cryptoSource();
    expect(source.seed).toBeNull();
    const value = source.next();
    expect(Number.isInteger(value) && value >= 0 && value < 2 ** 32).toBe(true);
  });

  it("says so plainly where there is no generator", () => {
    expect(() => cryptoSource({} as never)).toThrow(/getRandomValues/);
  });
});

it("newSeed is eight characters nobody will misread", () => {
  const seed = newSeed(seededSource("s"));
  expect(seed).toMatch(/^[a-hjkmnp-z2-9]{8}$/);
});
