import { describe, expect, it } from "vitest";

import { DIE_SIDES, MAX_DICE, normalizeSpec } from "./dice.ts";
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

  it("every distribution sums to one, up to ten d100", () => {
    for (const sides of DIE_SIDES) {
      for (let count = 1; count <= MAX_DICE; count++) {
        const total = distributionOf(spec({ count, sides })).probabilities.reduce((a, b) => a + b, 0);
        expect(total).toBeCloseTo(1, 9);
      }
    }
  });

  it("one to five d30 sum to one and sit where thirty faces put them", () => {
    for (let count = 1; count <= 5; count++) {
      const thirty = spec({ count, sides: 30 });
      const d = distributionOf(thirty);
      expect(d.min).toBe(count);
      expect(d.max).toBe(count * 30);
      expect(d.probabilities).toHaveLength(count * 29 + 1);
      expect(d.probabilities.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
      expect(expectedTotal(thirty)).toBeCloseTo(count * 15.5, 9);
      expect(spreadOf(thirty)).toBeCloseTo(Math.sqrt((count * 899) / 12), 9);
      expect(chanceExactly(thirty, count)).toBeCloseTo(1 / 30 ** count, 15);
      expect(chanceExactly(thirty, count * 30)).toBeCloseTo(1 / 30 ** count, 15);
    }
    expect(mostLikely(spec({ count: 1, sides: 30 }))).toHaveLength(30);
  });

  it("2d30 matches a count of all nine hundred throws, kept or added", () => {
    const counted = (total: (a: number, b: number) => number) => {
      const counts = new Map<number, number>();
      for (let a = 1; a <= 30; a++) {
        for (let b = 1; b <= 30; b++) counts.set(total(a, b), (counts.get(total(a, b)) ?? 0) + 1);
      }
      return counts;
    };
    const cases = [
      [spec({ count: 2, sides: 30 }), counted((a, b) => a + b)],
      [spec({ count: 2, sides: 30, modifier: 3 }), counted((a, b) => a + b + 3)],
      [spec({ count: 2, sides: 30, keep: "highest" }), counted(Math.max)],
      [spec({ count: 2, sides: 30, keep: "lowest" }), counted(Math.min)],
    ] as const;
    for (const [dice, counts] of cases) {
      const d = distributionOf(dice);
      expect(d.probabilities).toHaveLength(counts.size);
      for (const [total, ways] of counts) expect(chanceExactly(dice, total)).toBeCloseTo(ways / 900, 14);
    }
    expect(chanceExactly(spec({ count: 2, sides: 30 }), 31)).toBeCloseTo(30 / 900, 14);
    expect(mostLikely(spec({ count: 2, sides: 30 }))).toEqual([31]);
    expect(chanceAtLeast(spec({ count: 2, sides: 30 }), 61)).toBe(0);
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
