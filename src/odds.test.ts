import { describe, expect, it } from "vitest";

import { normalizeSpec } from "./dice.ts";
import { chanceAtLeast, chanceAtMost, chanceExactly, distributionOf, expectedTotal, luckOf, mostLikely, spreadOf } from "./odds.ts";

const spec = (text: Parameters<typeof normalizeSpec>[0]) => normalizeSpec(text);

describe("odds", () => {
  it("2d6 is the triangle every board-game player knows", () => {
    const two = spec({ count: 2, sides: 6 });
    expect(chanceExactly(two, 7)).toBeCloseTo(6 / 36, 12);
    expect(chanceExactly(two, 2)).toBeCloseTo(1 / 36, 12);
    expect(chanceExactly(two, 13)).toBe(0);
    expect(expectedTotal(two)).toBeCloseTo(7, 12);
    expect(mostLikely(two)).toEqual([7]);
  });

  it("every distribution sums to one, up to five d100", () => {
    for (const sides of [4, 6, 8, 10, 12, 20, 100] as const) {
      for (let count = 1; count <= 5; count++) {
        const total = distributionOf(spec({ count, sides })).probabilities.reduce((a, b) => a + b, 0);
        expect(total).toBeCloseTo(1, 9);
      }
    }
  });

  it("advantage is the chance either of two d20 meets the target", () => {
    const adv = spec({ count: 2, sides: 20, keep: "highest" });
    expect(chanceAtLeast(adv, 11)).toBeCloseTo(1 - 0.5 * 0.5, 12);
    expect(chanceAtLeast(adv, 20)).toBeCloseTo(1 - (19 / 20) ** 2, 12);
    const dis = spec({ count: 2, sides: 20, keep: "lowest" });
    expect(chanceAtLeast(dis, 11)).toBeCloseTo(0.25, 12);
    expect(expectedTotal(adv)).toBeCloseTo(13.825, 9);
  });

  it("a bonus moves the whole distribution", () => {
    const d20 = spec({ count: 1, sides: 20, modifier: 5 });
    expect(chanceAtLeast(d20, 15)).toBeCloseTo(11 / 20, 12);
    expect(chanceAtLeast(d20, 6)).toBe(1);
    expect(chanceAtLeast(d20, 26)).toBe(0);
    expect(chanceAtMost(d20, 10)).toBeCloseTo(5 / 20, 12);
  });

  it("luck is one half at the middle and near the ends at the ends", () => {
    const two = spec({ count: 2, sides: 6 });
    expect(luckOf(two, 7)).toBeCloseTo(0.5, 12);
    expect(luckOf(two, 2)).toBeCloseTo(1 / 72, 12);
    expect(luckOf(two, 12)).toBeCloseTo(1 - 1 / 72, 12);
  });

  it("one die is flat, so every face is most likely", () => {
    expect(mostLikely(spec({ count: 1, sides: 6 }))).toEqual([1, 2, 3, 4, 5, 6]);
    expect(spreadOf(spec({ count: 1, sides: 6 }))).toBeCloseTo(Math.sqrt(35 / 12), 9);
  });
});
