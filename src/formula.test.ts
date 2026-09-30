import { describe, expect, it } from "vitest";

import { MAX_DICE, MAX_DICE_BY_CODE, canHold, diceCount, diceOf, groupsOf, groupTotals, isSuccessRoll, normalizeSpec, rangeOf, readDice, roll, rollFrom, type RollSpec } from "./dice.ts";
import { fromJSON, toJSON } from "./export.ts";
import { checkMath, evaluateMath, mathText, type MathNode } from "./math.ts";
import { checkNotation, formatNotation, parseNotation } from "./notation.ts";
import { chanceAtLeast, chanceExactly, distributionOf, exactCounts, expectedTotal } from "./odds.ts";
import { seededSource, type RandomSource } from "./random.ts";
import { readShared, shareQuery } from "./share.ts";

function scripted(faces: number[]): RandomSource {
  const left = [...faces];
  return { seed: null, next: () => (left.shift() as number) - 1 };
}
const spec = (text: string, options?: Parameters<typeof parseNotation>[1]): RollSpec => {
  const read = parseNotation(text, options);
  if (read === null) throw new Error(`${text} is refused`);
  return read;
};
const thrown = (text: string, faces: number[]) => roll(spec(text), scripted(faces), 1);

/** Every way a roll of fair dice of one size can fall, by playing it, with the chance of each total. */
function everyWay(of: RollSpec): Map<number, number> {
  const sides = of.sides as number;
  const totals = new Map<number, number>();
  const walk = (faces: number[], chance: number) => {
    const made = rollFrom(of, faces, "x", 0, null);
    if (made !== null) {
      totals.set(made.total, (totals.get(made.total) ?? 0) + chance);
      return;
    }
    // Dice that all differ are thrown from the faces left, each as likely as the next: a walk that repeats a face is a way they cannot fall.
    if (groupsOf(of).some((g) => g.unique === true)) {
      if (faces.length >= diceCount(of)) return;
    } else if (faces.length > 8) throw new Error("the walk did not end");
    for (let face = 1; face <= sides; face++) walk([...faces, face], chance / sides);
  };
  walk([], 1);
  const all = [...totals.values()].reduce((a, b) => a + b, 0);
  for (const [total, chance] of totals) totals.set(total, chance / all);
  if (!groupsOf(of).some((g) => g.unique === true) && Math.abs(all - 1) > 1e-12) throw new Error("the walk lost some ways");
  return totals;
}

describe("the odds of a formula, against every way the dice can fall", () => {
  it.each([
    "(2d4+3)*2",
    "1d6-1d6",
    "2d6-1d6+2",
    "floor(3d4/2)",
    "ceil(3d4/2)",
    "round(3d4/2)",
    "round(2d6/3)*3",
    "abs(1d6-1d6)",
    "max(1d6,2d6)",
    "min(1d6,1d6,1d6)",
    "{2d6,1d6}kh1",
    "{1d6,1d6,1d6}kl1",
    "1d4*1d4",
    "1d6*(1d6-3)",
    "floor(1d6/1d6)",
    "floor(10/1d4)+1d4",
    "-1d6+10",
    "2d6kh1*2-1d6",
    "3d6>=5*2",
    "floor(2d6kh1/2)+1d6ro<2",
    "max(1d4,2)-min(1d4,3)",
    "(1d4+1d4)*(1d4-1d4)",
    // Dice that all differ.
    "3d4u",
    "2d6u",
    "4d4u",
    "3d6u+1d6",
    "2d6u*2",
  ])("%s", (text) => {
    const of = spec(text);
    const totals = everyWay(of);
    const odds = distributionOf(of);
    expect(odds.min, text).toBe(Math.min(...totals.keys()));
    expect(odds.max, text).toBe(Math.max(...totals.keys()));
    for (let i = 0; i < odds.probabilities.length; i++) expect(odds.probabilities[i], `${text} at ${odds.min + i}`).toBeCloseTo(totals.get(odds.min + i) ?? 0, 12);
    expect(odds.probabilities.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect(rangeOf(of), text).toEqual({ min: odds.min, max: odds.max });
  });

  it("known figures", () => {
    // Twice a 2d6: the odds of 2d6, on the even totals only.
    expect(chanceExactly(spec("2d6*2"), 14)).toBeCloseTo(6 / 36, 12);
    expect(chanceExactly(spec("2d6*2"), 13)).toBe(0);
    // The higher of two d20 is advantage.
    expect(distributionOf(spec("max(1d20,1d20)")).probabilities).toEqual(distributionOf(spec("2d20kh1")).probabilities.map((p) => expect.closeTo(p, 12)));
    // One die less another is as likely to be up as down.
    expect(expectedTotal(spec("1d20-1d20"))).toBeCloseTo(0, 12);
    expect(chanceAtLeast(spec("1d20-1d20"), 1)).toBeCloseTo(190 / 400, 12);
    // Half of 4d6, rounded down: 14 and 15 both come to 7.
    const half = spec("floor(4d6/2)");
    expect(chanceExactly(half, 7)).toBeCloseTo(chanceExactly(spec("4d6"), 14) + chanceExactly(spec("4d6"), 15), 12);
    // Three d6 that all differ: 120 ordered ways of 216, as 20 sets; a total of 6 is only 1, 2, 3.
    expect(exactCounts(spec("3d6u"))).toMatchObject({ min: 6, outcomes: 20n });
    expect(exactCounts(spec("3d6u"))?.counts[0]).toBe(1n);
    expect(expectedTotal(spec("3d6u"))).toBeCloseTo(10.5, 12);
    // Every face once: certain.
    expect(distributionOf(spec("6d6u"))).toEqual({ min: 21, max: 21, probabilities: [1] });
    expect(exactCounts(spec("(2d6+3)*2"))).toBeNull();
  });

  it("is exact where floating point would not be", () => {
    // 7 thirds, times 3, is 7, and rounding it up is still 7.
    const node: MathNode = { kind: "call", name: "ceil", args: [{ kind: "op", op: "*", left: { kind: "op", op: "/", left: { kind: "number", value: 7 }, right: { kind: "number", value: 3 } }, right: { kind: "number", value: 3 } }] };
    expect(evaluateMath(node, [])).toBe(7);
    expect(thrown("ceil(1d20/3*3)", [7]).total).toBe(7);
    expect(thrown("floor(1d20/10*10)", [3]).total).toBe(3);
    // A half rounds up, below nought too: −2.5 is −2.
    expect(thrown("round((1d6-10)/2)", [5]).total).toBe(-2);
    expect(thrown("round(1d6/2)", [5]).total).toBe(3);
    expect(thrown("floor((1d6-10)/2)", [5]).total).toBe(-3);
    expect(thrown("ceil((1d6-10)/2)", [5]).total).toBe(-2);
  });
});

describe("notation for formulas", () => {
  it.each([
    ["(2d6+3)*2", "(2d6+3)*2"],
    ["( 2d6 + 3 ) * 2", "(2d6+3)*2"],
    ["2d6x2", "2d6*2"],
    ["2d6×2", "2d6*2"],
    ["2*2d6", "2*2d6"],
    ["1d20-1d4", "1d20-1d4"],
    ["1d20-1d4+2", "1d20-1d4+2"],
    ["1d20-(1d4+2)", "1d20-(1d4+2)"],
    ["1d20-(1d4-2)", "1d20-(1d4-2)"],
    ["floor(2d6*3/2)", "floor(2d6*3/2)"],
    ["floor(2d6/(1d4+1))", "floor(2d6/(1d4+1))"],
    ["FLOOR(4d6/2)", "floor(4d6/2)"],
    ["ceil(4d6/2)+1", "ceil(4d6/2)+1"],
    ["max(1d6,1d8)", "max(1d6,1d8)"],
    ["min(1d6, 1d8, 4)", "min(1d6,1d8,4)"],
    ["{4d6,3d8}kh1", "max(4d6,3d8)"],
    ["{4d6,3d8}k", "max(4d6,3d8)"],
    ["{4d6,3d8}kl1", "min(4d6,3d8)"],
    ["{4d6,3d8}dl1", "max(4d6,3d8)"],
    ["{4d6,3d8}d1", "max(4d6,3d8)"],
    ["{4d6,3d8}dh1", "min(4d6,3d8)"],
    ["{1d6,1d8,1d10}dl2", "max(1d6,1d8,1d10)"],
    ["{4d6dl1+2,3d8}kh1", "max(4d6kh3+2,3d8)"],
    ["-1d6", "-1d6"],
    ["-(1d6+1d4)", "-(1d6+1d4)"],
    ["10-1d6", "10-1d6"],
    ["2d6-(-3)", "2d6+3"],
    ["(2d6+3)", "2d6+3"],
    ["2d6+3+1d4", "2d6+1d4+3"],
    ["3+2d6", "2d6+3"],
    ["2d6+1+1d4+2", "2d6+1d4+3"],
    ["(2d6+2d6)", "4d6"],
    ["2d6kh1*2", "2d6kh1*2"],
    ["6d10>=8*2", "6d10>=8*2"],
    ["4d6!*2", "4d6!*2"],
    ["d[1,1,2]*3", "1d[1,1,2]*3"],
    ["1d6{6:3}*2", "1d6{6:3}*2"],
    ["3#(1d6+1)*2", "3#(1d6+1)*2"],
    ["floor(2d6/2)+1d4 # half damage", "floor(2d6/2)+1d4 # half damage"],
    ["[half damage] floor(2d6/2)", "floor(2d6/2) # half damage"],
    ["4d6u", "4d6u"],
    ["4d6usd", "4d6usd"],
    ["4d20ucs=20", "4d20ucs=20"],
  ])("%s is %s", (typed, written) => {
    const read = checkNotation(typed);
    expect(read.ok, JSON.stringify(read)).toBe(true);
    if (!read.ok) return;
    expect(formatNotation(read.spec)).toBe(written);
    expect(parseNotation(written)).toEqual(read.spec);
  });

  it.each([
    ["4d6/2", "fraction", "4d6/2"],
    ["2d6*1d4/2", "fraction", "2d6*1d4/2"],
    ["max(1d6/2,3)", "fraction", "max(1d6/2,3)"],
    ["6/(1d4-1)", "zero", "6/(1d4-1)"],
    ["floor(6/(1d6-1d6))", "zero", "floor(6/(1d6-1d6))"],
    ["(2d6", "math", "("],
    ["2d6)", "math", ")"],
    ["floor(2d6", "math", "floor("],
    ["floor(2d6,2)", "math", "floor("],
    ["max(2d6)", "math", "max("],
    ["{4d6,3d8}", "math", "}"],
    ["{4d6,3d8}kh2", "math", "kh2"],
    ["{4d6}kh1", "math", "kh1"],
    ["{1d6,1d8,1d10}dl1", "math", "dl1"],
    ["2d6*10000", "math", "10000"],
    ["1d1000*1d1000*1d1000", "math", "1d1000*1d1000*1d1000"],
    ["floor(1d1000/2d1000)", "math", "floor(1d1000/2d1000)"],
    ["2*3", "shape", "2*3"],
    ["2d6**2", "shape", "*2"],
    ["2d6*1.5", "shape", "1.5"],
    ["sqrt(2d6)", "shape", "sqrt(2d6)"],
    ["2d6*", "math", "2d6*"],
    ["1d4*1d6*1d8*1d10*1d12", "kinds", "1d12"],
    ["6d6*5d8", "count", "5d8"],
    ["(11d6)*2", "count", "11"],
    ["(4d6!kh3)*2", "explode", "!"],
    ["7d6u", "unique", "u"],
    ["4d6uo", "unique", "uo"],
    ["2d1000u", "unique", "u"],
    ["1d6u", "unique", "u"],
    ["4dFu", "unique", "u"],
    ["3d6!u", "unique", "u"],
    ["3d6ukh1", "unique", "u"],
    ["3d6ur<2", "unique", "u"],
    ["3d6{6:3}u", "unique", "u"],
    ["3d[1,2,3]u", "custom", "u"],
    ["3d6uu", "twice", "u"],
  ])("refuses %s, and says it is the %s: %s", (text, problem, part) => {
    expect(checkNotation(text)).toMatchObject({ ok: false, problem, part });
  });

  it("still refuses what it always refused, in the same words", () => {
    expect(checkNotation("11d6")).toMatchObject({ problem: "count", part: "11", message: "“11”: roll 1 to 10 dice at a time" });
    expect(checkNotation("2d6+100")).toMatchObject({ problem: "bonus" });
    expect(checkNotation("nonsense")).toMatchObject({ problem: "shape" });
    // Dice taken away used to be refused, and are now a formula.
    expect(checkNotation("1d20-1d4").ok).toBe(true);
  });

  it("a formula given by hand is kept only when it can be used", () => {
    const dice = { kind: "dice", group: 0 } as const;
    const twice: MathNode = { kind: "op", op: "*", left: dice, right: { kind: "number", value: 2 } };
    expect(normalizeSpec({ count: 2, sides: 6, math: twice }).math).toEqual(twice);
    // With a formula the bonus is part of it.
    expect(normalizeSpec({ count: 2, sides: 6, modifier: 5, math: twice }).modifier).toBe(0);
    // A kind named twice, a kind not named, a division left unrounded, and nonsense are all left out.
    expect(normalizeSpec({ count: 2, sides: 6, math: { kind: "op", op: "*", left: dice, right: dice } })).not.toHaveProperty("math");
    expect(normalizeSpec({ count: 2, sides: 6, more: [{ count: 1, sides: 4, keep: "all" }], math: twice })).not.toHaveProperty("math");
    expect(normalizeSpec({ count: 2, sides: 6, math: { kind: "op", op: "/", left: dice, right: { kind: "number", value: 2 } } })).not.toHaveProperty("math");
    expect(normalizeSpec({ count: 2, sides: 6, math: { kind: "sqrt", of: dice } as never })).not.toHaveProperty("math");
    expect(normalizeSpec({ count: 2, sides: 6, math: "2d6*2" as never })).not.toHaveProperty("math");
    // With a formula, two kinds that are the same dice stay two.
    const both = spec("1d6-1d6");
    expect(both.more).toHaveLength(1);
    expect(checkMath(twice, [{ min: 2, max: 12 }])).toBeNull();
    expect(mathText(twice, () => "2d6")).toBe("2d6*2");
  });
});

describe("a roll by a formula", () => {
  it("throws its dice in the order written, and puts their totals together", () => {
    const made = thrown("(2d6+3)*2-1d4", [6, 1, 3]);
    expect(made.faces).toEqual([6, 1, 3]);
    expect(groupTotals(made)).toEqual([7, 3]);
    expect(made.total).toBe(17);
    expect(thrown("1d20-1d4", [2, 3]).total).toBe(-1);
    expect(thrown("max(4d6,3d8)", [6, 1, 5, 5, 3, 8, 4]).total).toBe(17);
    expect(thrown("floor(4d6dl1/2)", [6, 4, 2, 1]).total).toBe(6);
    expect(isSuccessRoll(spec("6d10>=8*2"))).toBe(false);
    expect(canHold(spec("2d6*2"))).toBe(false);
  });

  it("is read back from its faces, through a link and through JSON", () => {
    for (const text of ["(2d6+3)*2-1d4", "floor(4d6dl1/2)", "max(1d20,1d20)+5", "4d6u", "6d10>=8*2 # doubled"]) {
      const made = roll(spec(text), seededSource(`formula ${text}`), 5);
      expect(rollFrom(made.spec, made.faces, made.id, made.at, made.seed), text).toEqual(made);
      expect(readShared(shareQuery(made))?.total, text).toBe(made.total);
      expect(fromJSON(toJSON([made])), text).toEqual([made]);
    }
  });

  it("never totals outside its range", () => {
    for (const text of ["(2d6+3)*2-1d4", "floor(4d6!/2)", "abs(1d20-1d20)", "round(3d6/4)*1d4", "5d10u"]) {
      const of = spec(text);
      const { min, max } = rangeOf(of);
      const source = seededSource(`range ${text}`);
      for (let i = 0; i < 300; i++) {
        const { total } = roll(of, source, i);
        expect(total, text).toBeGreaterThanOrEqual(min);
        expect(total, text).toBeLessThanOrEqual(max);
      }
    }
  });
});

describe("dice that all differ", () => {
  it("never show a face twice, and replay from a seed", () => {
    const source = seededSource("differ");
    for (let i = 0; i < 200; i++) {
      const made = roll(spec("5d6u"), source, i);
      expect(new Set(made.faces).size).toBe(5);
      expect(made.faces.every((f) => f >= 1 && f <= 6)).toBe(true);
    }
    expect(roll(spec("5d6u"), seededSource("same"), 1).faces).toEqual(roll(spec("5d6u"), seededSource("same"), 1).faces);
    expect(new Set(roll(spec("6d6u"), seededSource("all"), 1).faces)).toEqual(new Set([1, 2, 3, 4, 5, 6]));
  });

  it("throws each die from the faces not yet showing, every face as likely as the next", () => {
    // The first pick is the face; the second is counted among the faces left.
    expect(thrown("3d6u", [3, 3, 3]).faces).toEqual([3, 4, 5]);
    expect(thrown("3d6u", [6, 5, 1]).faces).toEqual([6, 5, 1]);
    const seen = new Map<string, number>();
    const source = seededSource("fair");
    for (let i = 0; i < 6000; i++) {
      const key = roll(spec("2d4u"), source, i).faces.join("");
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    // Twelve ordered pairs, five hundred each on average.
    expect(seen.size).toBe(12);
    for (const count of seen.values()) expect(Math.abs(count - 500)).toBeLessThan(90);
  });

  it("refuses faces that repeat, when read back", () => {
    expect(readDice(spec("3d6u"), [1, 2, 3])).not.toBeNull();
    expect(readDice(spec("3d6u"), [1, 2, 2])).toBeNull();
    expect(diceOf(thrown("3d6u", [1, 1, 1])).map((d) => d.status)).toEqual(["kept", "kept", "kept"]);
  });
});

describe("more than ten dice, from code", () => {
  it("is for the asking, up to a hundred plain dice", () => {
    expect(MAX_DICE).toBe(10);
    expect(MAX_DICE_BY_CODE).toBe(100);
    expect(parseNotation("50d6")).toBeNull();
    const big = spec("50d6+30d8kh1+2", { maxDice: 100 });
    expect(diceCount(big)).toBe(80);
    expect(formatNotation(big)).toBe("50d6+30d8kh1+2");
    const made = roll(big, seededSource("many"), 1);
    expect(made.faces).toHaveLength(80);
    expect(made.total).toBe(made.faces.slice(0, 50).reduce((a, b) => a + b, 0) + Math.max(...made.faces.slice(50)) + 2);
    expect(rollFrom(made.spec, made.faces, made.id, made.at, made.seed)).toEqual(made);
    expect(fromJSON(toJSON([made]))).toEqual([made]);
  });

  it("has exact odds however many", () => {
    const hundred = spec("100d6", { maxDice: 100 });
    const counts = exactCounts(hundred);
    expect(counts?.outcomes).toBe(6n ** 100n);
    expect(counts?.counts[0]).toBe(1n);
    expect(expectedTotal(hundred)).toBeCloseTo(350, 9);
    expect(distributionOf(hundred).probabilities.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
    expect(chanceAtLeast(spec("100d20kh1", { maxDice: 100 }), 20)).toBeCloseTo(1 - 0.95 ** 100, 12);
  });

  it("is refused past a hundred, and for dice that are not plain", () => {
    expect(checkNotation("101d6", { maxDice: 100 })).toMatchObject({ problem: "count", part: "101", message: "“101”: roll 1 to 100 dice at a time, and past 10 only plain dice, all added or one kept" });
    expect(checkNotation("60d6+60d6", { maxDice: 100 })).toMatchObject({ problem: "count", part: "60d6" });
    for (const text of ["50d6!", "50d6r<2", "50d6kh3", "50d6>=5", "20d6+1d[1,2,3]", "12d6{6:3}", "12d6min2", "20d20u"]) expect(checkNotation(text, { maxDice: 100 }), text).toMatchObject({ ok: false, problem: "count" });
    expect(checkNotation("50d6", { maxDice: 1000 })).toMatchObject({ ok: true });
    expect(checkNotation("101d6", { maxDice: 1000 })).toMatchObject({ ok: false });
    // Ten or fewer are what they always were, whatever the limit.
    expect(parseNotation("10d6!", { maxDice: 100 })).toEqual(parseNotation("10d6!"));
  });

  it("is what `roll` throws, and what `normalizeSpec` keeps only when asked", () => {
    expect(normalizeSpec({ count: 50, sides: 6 }).count).toBe(10);
    expect(normalizeSpec({ count: 50, sides: 6 }, { maxDice: 100 }).count).toBe(50);
    expect(normalizeSpec({ count: 500, sides: 6 }, { maxDice: 1000 }).count).toBe(100);
    expect(roll({ count: 50, sides: 6 }, seededSource("x"), 1).faces).toHaveLength(50);
    // Dice that are not plain are brought back to ten, as ever.
    expect(normalizeSpec({ count: 50, sides: 6, explode: true }, { maxDice: 100 }).count).toBe(10);
    expect(roll({ count: 50, sides: 6, keep: "highest", keepCount: 3 }, seededSource("x"), 1).spec.count).toBe(10);
  });

  it("a formula may use them", () => {
    const big = spec("floor(40d6/2)", { maxDice: 100 });
    expect(rangeOf(big)).toEqual({ min: 20, max: 120 });
    expect(distributionOf(big).probabilities.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 12);
  });
});
