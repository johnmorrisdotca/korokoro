import { describe, expect, it } from "vitest";

import { keptFaces, normalizeSpec, rangeOf, roll } from "./dice.ts";
import { formatNotation, parseNotation } from "./notation.ts";
import { seededSource } from "./random.ts";

describe("normalizeSpec", () => {
  it("keeps one to five dice of a real kind", () => {
    expect(normalizeSpec({ count: 9, sides: 7 as never })).toMatchObject({ count: 5, sides: 6 });
    expect(normalizeSpec({ count: 0 })).toMatchObject({ count: 2 });
    expect(normalizeSpec({ count: -3 })).toMatchObject({ count: 1 });
  });

  it("keeps one of one die as simply rolling it", () => {
    expect(normalizeSpec({ count: 1, sides: 20, keep: "highest" }).keep).toBe("all");
  });
});

describe("roll", () => {
  it("adds the kept dice and the bonus", () => {
    const r = roll({ count: 3, sides: 6, modifier: 2 }, seededSource("a"), 1000);
    expect(r.faces).toHaveLength(3);
    expect(r.total).toBe(r.faces.reduce((a, b) => a + b, 0) + 2);
    expect(r.at).toBe(1000);
    expect(r.seed).toBe("a");
  });

  it("keeps the higher d20 with advantage and the lower with disadvantage", () => {
    for (let i = 0; i < 50; i++) {
      const adv = roll({ count: 2, sides: 20, keep: "highest" }, seededSource(`adv${i}`));
      expect(adv.total).toBe(Math.max(...adv.faces));
      const dis = roll({ count: 2, sides: 20, keep: "lowest" }, seededSource(`dis${i}`));
      expect(dis.total).toBe(Math.min(...dis.faces));
    }
  });

  it("marks only the first of two tied dice as kept", () => {
    expect(keptFaces([7, 7], "highest")).toEqual([true, false]);
  });

  it("the same seed rolls the same dice", () => {
    expect(roll({ count: 5, sides: 100 }, seededSource("z")).faces).toEqual(roll({ count: 5, sides: 100 }, seededSource("z")).faces);
  });
});

describe("notation", () => {
  it.each([
    ["3d6+2", { count: 3, sides: 6, modifier: 2, keep: "all" }],
    ["d20", { count: 1, sides: 20, modifier: 0, keep: "all" }],
    ["2d20kh1+5", { count: 2, sides: 20, modifier: 5, keep: "highest" }],
    ["2d20kl", { count: 2, sides: 20, modifier: 0, keep: "lowest" }],
    ["1d%", { count: 1, sides: 100, modifier: 0, keep: "all" }],
    [" 4 D 8 - 1 ", { count: 4, sides: 8, modifier: -1, keep: "all" }],
  ])("reads %s", (text, spec) => {
    expect(parseNotation(text)).toEqual(spec);
  });

  it.each(["9d6", "2d7", "d", "3d6+", "hello", "1d20kh1", "0d6"])("refuses %s rather than rolling something else", (text) => {
    expect(parseNotation(text)).toBeNull();
  });

  it("writes back what it reads", () => {
    for (const text of ["3d6+2", "1d20", "2d20kh1+5", "2d20kl1-1", "5d100"]) {
      expect(formatNotation(parseNotation(text)!)).toBe(text);
    }
  });

  it("knows the range", () => {
    expect(rangeOf(normalizeSpec({ count: 3, sides: 6, modifier: 1 }))).toEqual({ min: 4, max: 19 });
    expect(rangeOf(normalizeSpec({ count: 2, sides: 20, keep: "highest" }))).toEqual({ min: 1, max: 20 });
  });
});
