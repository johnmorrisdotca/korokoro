import { describe, expect, it } from "vitest";

import { keptFaces, normalizeSpec, roll, totalOf, type Roll } from "./dice.ts";
import { addToHistory, loadHistory, parseHistory, saveHistory, serializeHistory } from "./history.ts";
import { seededSource } from "./random.ts";
import { readShared, shareQuery } from "./share.ts";
import { chiSquareTail, statsOf } from "./stats.ts";

function made(faces: number[], sides: 6 | 20 | 30 = 6, keep: "all" | "highest" = "all", at = 0): Roll {
  const spec = normalizeSpec({ count: faces.length, sides, keep });
  const kept = keptFaces(faces, spec.keep);
  return { id: String(at), spec, faces, kept, total: totalOf(faces, kept, 0), at, seed: null };
}

describe("statsOf", () => {
  it("counts streaks, matches and natural twenties", () => {
    const history = [made([6, 6]), made([5, 4]), made([1, 1]), made([1, 2]), made([20], 20), made([1, 20], 20, "highest")];
    const stats = statsOf(history, normalizeSpec({ count: 2, sides: 6 }));
    expect(stats.rolls).toBe(6);
    expect(stats.diceThrown).toBe(11);
    expect(stats.matches).toBe(2);
    expect(stats.longestHot).toBe(2);
    expect(stats.naturalTwenties).toBe(2);
    expect(stats.naturalOnes).toBe(0);
    expect(stats.currentStreak).toBe(2);
    expect(stats.totals?.rolls).toBe(4);
    expect(stats.totals?.highest).toBe(12);
    expect(stats.faces?.counts).toEqual([3, 1, 0, 1, 1, 2]);
  });

  it("says nothing about luck or fairness it cannot measure", () => {
    expect(statsOf([]).luck).toBeNull();
    expect(statsOf([made([3, 4])], normalizeSpec({ count: 2, sides: 6 })).faces?.fairness).toBeNull();
  });

  it("finds fair dice fair and loaded dice loaded", () => {
    const source = seededSource("fair");
    let fair: Roll[] = [];
    for (let i = 0; i < 600; i++) fair = addToHistory(fair, roll({ count: 1, sides: 6 }, source, i));
    expect(statsOf(fair, normalizeSpec({ count: 1, sides: 6 })).faces?.fairness).toBeGreaterThan(0.01);
    const loaded = Array.from({ length: 120 }, (_, i) => made([i % 3 === 0 ? 1 : 6], 6, "all", i));
    expect(statsOf(loaded, normalizeSpec({ count: 1, sides: 6 })).faces?.fairness).toBeLessThan(0.001);
  });

  it("counts each face of a d30 and finds a fair one fair", () => {
    const source = seededSource("fair d30");
    let thrown: Roll[] = [];
    for (let i = 0; i < 400; i++) thrown = addToHistory(thrown, roll({ count: 5, sides: 30 }, source, i));
    const stats = statsOf(thrown, normalizeSpec({ count: 5, sides: 30 }));
    expect(stats.faces?.sides).toBe(30);
    expect(stats.faces?.counts).toHaveLength(30);
    expect(stats.faces?.dice).toBe(2000);
    expect(stats.faces?.fairness).toBeGreaterThan(0.01);
    expect(stats.totals?.notation).toBe("5d30");
    expect(stats.totals?.expected).toBeCloseTo(77.5, 9);
    expect(stats.totals?.seen.reduce((a, b) => a + b, 0)).toBe(400);
    const loaded = Array.from({ length: 300 }, (_, i) => made([i % 2 === 0 ? 30 : 29], 30, "all", i));
    expect(statsOf(loaded, normalizeSpec({ count: 1, sides: 30 })).faces?.fairness).toBeLessThan(0.001);
  });

  it("a 20 or a 1 on a d30 is not a natural: those belong to the d20", () => {
    const stats = statsOf([made([20], 30), made([1], 30), made([30], 30), made([30, 30], 30)]);
    expect(stats.naturalTwenties).toBe(0);
    expect(stats.naturalOnes).toBe(0);
    expect(stats.matches).toBe(1);
    expect(stats.longestHot).toBe(2);
  });

  it("chi-square tail is close to the table", () => {
    // 11.07 is the 5% point for five degrees of freedom.
    expect(chiSquareTail(11.07, 5)).toBeCloseTo(0.05, 2);
  });
});

describe("history", () => {
  it("forgets the oldest past the limit", () => {
    let history: Roll[] = [];
    for (let i = 0; i < 12; i++) history = addToHistory(history, made([1, 2], 6, "all", i), 10);
    expect(history.map((r) => r.at)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
  });

  it("reads back what it wrote, and drops what does not add up", () => {
    const good = roll({ count: 3, sides: 8, modifier: 1 }, seededSource("h"), 5);
    const text = serializeHistory([good]);
    expect(parseHistory(text)).toEqual([good]);
    const bad = JSON.stringify({ rolls: [{ ...good, faces: [9, 9, 9] }, { spec: { sides: 1 } }, { spec: { sides: 7 } }, null] });
    expect(parseHistory(bad)).toEqual([]);
    expect(parseHistory("not json")).toEqual([]);
  });

  it("keeps a d30 roll, and drops one showing a 31", () => {
    const good = roll({ count: 2, sides: 30, modifier: 3 }, seededSource("h30"), 7);
    expect(parseHistory(serializeHistory([good]))).toEqual([good]);
    expect(parseHistory(JSON.stringify({ rolls: [{ ...good, faces: [31, 1] }] }))).toEqual([]);
  });

  it("a storage that throws reads as empty and says it refused", () => {
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => undefined,
    };
    expect(loadHistory(broken, "k")).toEqual([]);
    expect(saveHistory(broken, "k", [made([1])])).toBe(false);
    expect(saveHistory(undefined, "k", [])).toBe(false);
  });
});

describe("share", () => {
  it("a shared link shows exactly the roll", () => {
    const r = roll({ count: 2, sides: 20, keep: "highest", modifier: 3 }, seededSource("share"), 1234);
    const back = readShared(shareQuery(r));
    expect(back).toMatchObject({ faces: r.faces, total: r.total, at: 1234, seed: "share", spec: r.spec });
  });

  it("a shared d30 comes back as thrown", () => {
    const r = roll({ count: 2, sides: 30, modifier: 3 }, seededSource("share30"), 99);
    expect(shareQuery(r)).toContain("roll=2d30%2B3");
    expect(readShared(shareQuery(r))).toMatchObject({ faces: r.faces, total: r.total, at: 99, seed: "share30", spec: r.spec });
    expect(readShared("roll=2d30&faces=30,1")).toMatchObject({ total: 31 });
    expect(readShared("roll=2d30&faces=31,1")).toBeNull();
  });

  it("refuses a link whose faces the dice could not show", () => {
    expect(readShared("roll=2d6&faces=7,1")).toBeNull();
    expect(readShared("roll=2d6&faces=1")).toBeNull();
    expect(readShared("roll=banana&faces=1")).toBeNull();
  });
});
