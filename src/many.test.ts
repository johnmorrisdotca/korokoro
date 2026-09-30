import { describe, expect, it } from "vitest";

import { MAX_TIMES, normalizeSpec, rollMany, setOf, type RollSpec } from "./dice.ts";
import { parseHistory, serializeHistory } from "./history.ts";
import { checkNotation, formatNotation, parseNotation } from "./notation.ts";
import { chanceAnyAtLeast, chanceAtLeast, distributionOf, expectedHighest, expectedTotal } from "./odds.ts";
import { seededSource } from "./random.ts";
import { readShared, readSharedMany, shareQueryMany } from "./share.ts";
import { roll } from "./dice.ts";

const dice = (text: string): RollSpec => parseNotation(text) as RollSpec;

describe("a roll thrown several times as a set", () => {
  it("is written with its times in front, which can never be read as arithmetic", () => {
    const spec = dice("6#4d6dl1");
    expect(spec).toEqual({ count: 4, sides: 6, modifier: 0, keep: "highest", keepCount: 3, times: 6 });
    expect(formatNotation(spec)).toBe("6#4d6kh3");
    expect(dice("6 # 4d6dl1")).toEqual(spec);
    expect(dice("1#2d6")).toEqual({ count: 2, sides: 6, modifier: 0, keep: "all" });
    expect(formatNotation(dice("3#1d20+1d4+2"))).toBe("3#1d20+1d4+2");
    expect(checkNotation("0#2d6")).toMatchObject({ ok: false, problem: "times", part: "0#" });
    expect(checkNotation(`${MAX_TIMES + 1}#2d6`)).toMatchObject({ ok: false, problem: "times" });
    expect(checkNotation("6#")).toMatchObject({ ok: false, problem: "shape" });
    expect(checkNotation("2d6#3")).toMatchObject({ ok: false, problem: "label" });
    expect(normalizeSpec({ count: 2, sides: 6, times: 999 }).times).toBe(MAX_TIMES);
    expect(normalizeSpec({ count: 2, sides: 6, times: 0 })).not.toHaveProperty("times");
  });

  it("is ordinary rolls, drawn in order from one source, so a seed replays the set", () => {
    const a = rollMany(dice("6#4d6dl1"), undefined, seededSource("scores"), 5);
    const b = rollMany(dice("6#4d6dl1"), undefined, seededSource("scores"), 5);
    expect(a.rolls).toHaveLength(6);
    expect(b.rolls.map((r) => r.faces)).toEqual(a.rolls.map((r) => r.faces));
    // The same dice as six rolls made one after another.
    const source = seededSource("scores");
    expect(a.rolls.map((r) => r.faces)).toEqual(Array.from({ length: 6 }, (_, i) => roll(dice("4d6dl1"), source, i).faces));
    expect(a.sum).toBe(a.rolls.reduce((s, r) => s + r.total, 0));
    expect(a.highest).toBe(Math.max(...a.rolls.map((r) => r.total)));
    expect(a.lowest).toBe(Math.min(...a.rolls.map((r) => r.total)));
    expect(a.rolls.map((r) => r.set)).toEqual(a.rolls.map((_, index) => ({ id: a.rolls[0]!.id, index, of: 6 })));
    expect(setOf(a.rolls)).toEqual(a);
  });

  it("takes its times from the call, the spec, or once; never more than the cap", () => {
    expect(rollMany(dice("2d6"), 3, seededSource("x")).rolls).toHaveLength(3);
    expect(rollMany(dice("4#2d6"), undefined, seededSource("x")).rolls).toHaveLength(4);
    const once = rollMany(dice("2d6"), undefined, seededSource("x"));
    expect(once.rolls).toHaveLength(1);
    expect(once.rolls[0]).not.toHaveProperty("set");
    expect(rollMany(dice("1d6"), 5000, seededSource("x")).rolls).toHaveLength(MAX_TIMES);
    expect(rollMany(dice("1d6"), 0, seededSource("x")).rolls).toHaveLength(1);
    // `roll` throws once whatever the spec's times say.
    expect(roll(dice("6#2d6"), seededSource("x")).faces).toHaveLength(2);
  });

  it("is kept and shared as a set", () => {
    const set = rollMany(dice("3#2d6+1"), undefined, seededSource("keep"), 9).rolls;
    expect(parseHistory(serializeHistory(set))).toEqual(set);
    const query = shareQueryMany(set);
    expect(query).toContain("roll=3%232d6%2B1");
    const back = readSharedMany(query);
    expect(back?.map((r) => r.faces)).toEqual(set.map((r) => r.faces));
    expect(back?.map((r) => r.total)).toEqual(set.map((r) => r.total));
    expect(back?.map((r) => r.set?.index)).toEqual([0, 1, 2]);
    expect(readSharedMany("roll=3%232d6&faces=1,2;3,4&v=2")).toBeNull();
    expect(readSharedMany("roll=2%232d6&faces=1,2;3,7&v=2")).toBeNull();
    expect(readSharedMany("roll=2d6&faces=1,2&v=2")).toBeNull();
    // A single roll's link is still a single roll.
    expect(readShared("roll=2d6&faces=1,2&v=2")).toMatchObject({ total: 3 });
    expect(parseHistory(JSON.stringify([{ ...set[0], set: { id: "x", index: 5, of: 3 } }]))[0]).not.toHaveProperty("set");
  });

  it("has exact odds for the set: at least one roll reaching a target, and the expected highest", () => {
    const d6 = dice("1d6");
    expect(chanceAnyAtLeast(d6, 6, 2)).toBeCloseTo(11 / 36, 14);
    expect(chanceAnyAtLeast(d6, 6, 1)).toBeCloseTo(1 / 6, 14);
    // The higher of two d6 is advantage on a d6.
    expect(expectedHighest(d6, 2)).toBeCloseTo(expectedTotal(dice("2d6kh1")), 12);
    expect(expectedHighest(dice("1d20"), 2)).toBeCloseTo(13.825, 12);
    expect(expectedHighest(d6, 1)).toBeCloseTo(3.5, 12);
    const scores = dice("4d6dl1");
    expect(chanceAnyAtLeast(scores, 18, 6)).toBeCloseTo(1 - (1 - 21 / 1296) ** 6, 14);
    expect(chanceAnyAtLeast(scores, 16, 6)).toBeCloseTo(1 - (1 - chanceAtLeast(scores, 16)) ** 6, 14);
    // By counting: the highest of three rolls of 2d4.
    const d = distributionOf(dice("2d4"));
    let mean = 0;
    for (let a = 0; a < 7; a++) for (let b = 0; b < 7; b++) for (let c = 0; c < 7; c++) mean += Math.max(a, b, c) * d.probabilities[a]! * d.probabilities[b]! * d.probabilities[c]!;
    expect(expectedHighest(dice("2d4"), 3)).toBeCloseTo(mean + 2, 12);
    // And by throwing them.
    const source = seededSource("highest");
    let total = 0;
    for (let i = 0; i < 20_000; i++) total += rollMany(scores, 6, source).highest;
    expect(Math.abs(total / 20_000 - expectedHighest(scores, 6))).toBeLessThan(0.05);
  });
});
