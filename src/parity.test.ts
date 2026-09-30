import { describe, expect, it } from "vitest";

import { canHold, diceOf, groupsOf, isSuccessRoll, normalizeSpec, rangeOf, readDice, roll, rollFrom, rulesText, type RollSpec } from "./dice.ts";
import { checkNotation, formatNotation, parseNotation } from "./notation.ts";
import { chanceAtLeast, distributionOf, exactCounts, expectedTotal } from "./odds.ts";
import { seededSource, type RandomSource } from "./random.ts";
import { readShared, shareQuery } from "./share.ts";

/** A source that throws the faces it is handed, in order, on numbered dice. */
function scripted(faces: number[]): RandomSource {
  const left = [...faces];
  return { seed: null, next: () => (left.shift() as number) - 1 };
}
const spec = (text: string): RollSpec => {
  const read = parseNotation(text);
  if (read === null) throw new Error(`${text} is refused`);
  return read;
};
const thrown = (text: string, faces: number[]) => roll(spec(text), scripted(faces), 1);

/**
 * Every way a roll of one kind of fair dice can fall, by playing it: each
 * face of each throw in turn, down every branch, with the chance of getting
 * there. Branches rarer than one in a hundred thousand are left, and
 * their chance is handed back so the comparison can allow for it.
 */
function everyWay(of: RollSpec): { totals: Map<number, number>; left: number } {
  const sides = of.sides as number;
  const totals = new Map<number, number>();
  let left = 0;
  const walk = (faces: number[], chance: number) => {
    const dice = readDice(of, faces);
    if (dice !== null) {
      const total = (rollFrom(of, faces, "x", 0, null) as { total: number }).total;
      totals.set(total, (totals.get(total) ?? 0) + chance);
      return;
    }
    if (chance < 1e-5) {
      left += chance;
      return;
    }
    for (let face = 1; face <= sides; face++) walk([...faces, face], chance / sides);
  };
  walk([], 1);
  return { totals, left };
}

describe("the odds of the rules added in 1.7.0, against every way the dice can fall", () => {
  it.each([
    // The rules as they were, as a check on the walk itself.
    "2d4",
    "2d4!",
    "2d6r<3",
    "2d6ro<3",
    "3d6kh2",
    // Counting.
    "3d4>=3",
    "3d4>2",
    "3d6>=5f=1",
    "4d4<=1",
    "3d6=6",
    "3d6<>1",
    "2d6>=5+1",
    // Explosions at a comparison, compounding and penetrating.
    "2d4!>=3",
    "2d4!=1",
    "2d4!!",
    "2d4!p",
    "2d4!!p",
    "2d6!!>=5",
    "2d6!p>=5",
    // Counting dice that explode: each die of a chain is a die; a compounding die is one die.
    "3d4>=4!",
    "2d6>=5!>=5",
    "2d4>=6!!",
    "2d4>=4f=1!p",
    "2d4>=5!!p",
    // Rerolls at a comparison.
    "2d6r=3",
    "2d6r>=5",
    "2d6ro>=5",
    "2d6ro=6",
    "2d6ro<>3",
    "2d4r=2!",
    // The least and the most a die counts for.
    "3d6min2",
    "3d6max4",
    "3d6min2max5",
    "4d6min3kh2",
    "3d6max4kl2",
    "3d4r=2kh2",
    "2d4min2!",
    "2d6ro>=5min2>=3",
  ])("%s", (text) => {
    const of = spec(text);
    const { totals, left } = everyWay(of);
    const odds = distributionOf(of);
    const allow = left + 1e-9;
    for (let i = 0; i < odds.probabilities.length; i++) {
      const total = odds.min + i;
      expect(Math.abs((odds.probabilities[i] as number) - (totals.get(total) ?? 0)), `${text} at ${total}`).toBeLessThanOrEqual(allow);
    }
    for (const total of totals.keys()) expect(total, text).toBeGreaterThanOrEqual(odds.min);
    for (const total of totals.keys()) expect(total, text).toBeLessThanOrEqual(odds.max);
    expect(odds.probabilities.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 9);
    // The range is the ends of the odds.
    expect(rangeOf(of)).toEqual({ min: odds.min, max: odds.max });
    expect(odds.probabilities[0]).toBeGreaterThan(0);
    expect(odds.probabilities.at(-1)).toBeGreaterThan(0);
  });

  it("known figures", () => {
    // Five d10 at 8 or more: successes are binomial, 0.3 each, so 1.5 on average and no success 0.7 to the fifth.
    expect(expectedTotal(spec("5d10>=8"))).toBeCloseTo(1.5, 12);
    expect(distributionOf(spec("5d10>=8")).probabilities[0]).toBeCloseTo(0.7 ** 5, 12);
    expect(chanceAtLeast(spec("5d10>=8"), 3)).toBeCloseTo(0.16308, 5);
    // With tens thrown again (10-again), each die is worth 0.3 / 0.9 successes, but for the stop after ten explosions.
    expect(expectedTotal(spec("1d10>=8!"))).toBeCloseTo(0.3 * ((1 - 0.1 ** 11) / 0.9), 12);
    // A d6 that counts for at least 2 averages (2+2+3+4+5+6)/6.
    expect(expectedTotal(spec("1d6min2"))).toBeCloseTo(22 / 6, 12);
    // A penetrating d6: 3.5 + (1/6)(2.5 + (1/6)(2.5 + …)), ten explosions deep.
    let rest = 0;
    for (let depth = 0; depth < 10; depth++) rest = 2.5 + rest / 6;
    expect(expectedTotal(spec("1d6!p"))).toBeCloseTo(3.5 + rest / 6, 12);
    // Compounding changes what is shown, not what it adds up to.
    expect(distributionOf(spec("3d6!!")).probabilities).toEqual(distributionOf(spec("3d6!")).probabilities);
  });

  it("the rules as they were are counted as they were", () => {
    expect(exactCounts(spec("2d6"))?.outcomes).toBe(36n);
    expect(exactCounts(spec("2d6cs=6"))?.outcomes).toBe(36n);
    expect(exactCounts(spec("2d6sd"))?.outcomes).toBe(36n);
    expect(exactCounts(spec("2d6>=5"))).toBeNull();
  });
});

describe("notation for the rules added in 1.7.0", () => {
  it.each([
    // [typed, written back]
    ["6d10>7", "6d10>=8"],
    ["6d10>=8", "6d10>=8"],
    ["6d10 >= 8 f 1", "6d10>=8f=1"],
    ["6d10>=8f<2", "6d10>=8f<=1"],
    ["4d6<3", "4d6<=2"],
    ["3d6=6", "3d6=6"],
    ["3d6<>1", "3d6<>1"],
    ["6d10>=8!", "6d10>=8!"],
    ["6d10!>=10>=8", "6d10>=8!"],
    ["6d10>=8!>=9", "6d10>=8!>=9"],
    ["3d6!!", "3d6!!"],
    ["3d6!p", "3d6!p"],
    ["3d6!!p", "3d6!!p"],
    ["3d6!P", "3d6!p"],
    ["3d6!>4", "3d6!>=5"],
    ["3d6!>=6", "3d6!"],
    ["3d6!=6", "3d6!"],
    ["3d6!=1", "3d6!=1"],
    ["3d6!<>6", "3d6!<>6"],
    ["2d6r1", "2d6r<2"],
    ["2d6r", "2d6r<2"],
    ["2d6ro", "2d6ro<2"],
    ["2d6ro!", "2d6!ro<2"],
    ["1d20cs", "1d20cs=20"],
    ["1d20cscf", "1d20cs=20cf=1"],
    ["2d6r=1", "2d6r<2"],
    ["2d6r=3", "2d6r=3"],
    ["2d6ro3", "2d6ro=3"],
    ["2d6ro>4", "2d6ro>=5"],
    ["2d6r>=5", "2d6r>=5"],
    ["2d6ro!=3", "2d6ro<>3"],
    ["2d6r<=2", "2d6r<3"],
    ["4d6k3", "4d6kh3"],
    ["4d6b3", "4d6kh3"],
    ["4d6d1", "4d6kh3"],
    ["4d6d", "4d6kh3"],
    ["4d6w1", "4d6kl1"],
    ["2d20k", "2d20kh1"],
    ["4d6min2", "4d6min2"],
    ["4d6max5", "4d6max5"],
    ["4d6max5min2", "4d6min2max5"],
    ["1d20cs>=19", "1d20cs>=19"],
    ["1d20cs20cf1", "1d20cs=20cf=1"],
    ["1d20cf<3", "1d20cf<=2"],
    ["4d6sa", "4d6sa"],
    ["4d6s", "4d6sa"],
    ["4d6sd", "4d6sd"],
    ["4d6sdkh3", "4d6kh3sd"],
    ["4d6 s kh3", "4d6kh3sa"],
    ["2d6 # fire damage", "2d6 # fire damage"],
    ["[fire damage] 2d6+3", "2d6+3 # fire damage"],
    ["6#4d6dl1 # ability scores", "6#4d6kh3 # ability scores"],
    ["2d6#fire", "2d6 # fire"],
    ["d[Yes#2a7,No]#answer", "1d[Yes#2a7,No] # answer"],
    ["1d20cs>=19+1d4+5 # attack", "1d20cs>=19+1d4+5 # attack"],
    ["6d10>=8+2d6", "6d10>=8+2d6"],
  ])("%s is %s", (typed, written) => {
    const read = checkNotation(typed);
    expect(read.ok, JSON.stringify(read)).toBe(true);
    if (!read.ok) return;
    expect(formatNotation(read.spec)).toBe(written);
    // What is written reads back as the same roll.
    expect(parseNotation(written)).toEqual(read.spec);
    // A spec carries only what it uses.
    for (const group of groupsOf(read.spec)) for (const value of Object.values(group)) expect(value).not.toBeUndefined();
  });

  it.each([
    ["6d10>=11", "successes", ">=11"],
    ["6d10>=1", "successes", ">=1"],
    ["6d10f1", "successes", "f1"],
    ["6d10>=8f>=8", "successes", "f>=8"],
    ["6d10>=8f=9", "successes", "f=9"],
    ["4d6kh3>=5", "successes", ">=5"],
    ["6d10>=8>=9", "twice", ">=9"],
    ["4d6min1", "clamp", "min1"],
    ["4d6min7", "clamp", "min7"],
    ["4d6max6", "clamp", "max6"],
    ["4d6min5max4", "clamp", "max4"],
    ["4d6min2min3", "twice", "min3"],
    ["1d20cs>=21", "marks", "cs>=21"],
    ["1d20cs>=1", "marks", "cs>=1"],
    ["3d6!>=1", "explode", "!>=1"],
    ["3d6!=7", "explode", "!=7"],
    ["3d6!!kh1", "explode", "!!"],
    ["4dF!p", "explode", "!p"],
    ["2d6r>=1", "reroll", "r>=1"],
    ["2d6r>=3", "reroll", "r>=3"],
    ["2d6r=7", "reroll", "r=7"],
    ["2d6ro<>7", "reroll", "ro<>7"],
    ["4dF>=1", "successes", ">=1"],
    ["4dFmin0", "clamp", "min0"],
    ["2d[Yes,No]>=1", "custom", ">=1"],
    ["2d[1,2]min2", "custom", "min2"],
    ["4d6sasd", "twice", "sd"],
    ["2d6 # a label that runs on for far longer than forty characters", "label", "# a label that runs on for far longer than forty characters"],
    ["2d6 # one # two", "label", "# one # two"],
    ["[one] 2d6 # two", "label", "# two"],
    ["[] 2d6", "label", "[]"],
    ["2d6 #", "label", "#"],
  ])("refuses %s, and says it is the %s: %s", (text, problem, part) => {
    expect(checkNotation(text)).toMatchObject({ ok: false, problem, part });
    expect(parseNotation(text)).toBeNull();
  });

  it("a spec given by hand keeps only the rules that leave something to roll", () => {
    expect(rulesText(normalizeSpec({ count: 6, sides: 10, success: { op: ">=", n: 8 }, failure: { op: "=", n: 1 } }))).toBe(">=8f=1");
    expect(rulesText(normalizeSpec({ count: 6, sides: 10, success: { op: ">=", n: 11 } }))).toBe("");
    expect(rulesText(normalizeSpec({ count: 6, sides: 10, failure: { op: "=", n: 1 } }))).toBe("");
    expect(rulesText(normalizeSpec({ count: 4, sides: 6, keep: "highest", keepCount: 3, success: { op: ">=", n: 5 } }))).toBe("kh3");
    expect(rulesText(normalizeSpec({ count: 2, sides: 6, floor: 9 }))).toBe("");
    expect(rulesText(normalizeSpec({ count: 2, sides: 6, explode: true, explodeKind: "penetrating", explodeWhen: { op: ">=", n: 5 } }))).toBe("!p>=5");
    expect(rulesText(normalizeSpec({ count: 2, sides: 6, explodeKind: "penetrating" }))).toBe("");
    expect(rulesText(normalizeSpec({ count: 2, sides: 6, rerollWhen: { op: "<=", n: 2 } }))).toBe("ro<3");
    expect(rulesText(normalizeSpec({ count: 2, sides: 6, rerollUntilWhen: { op: "=", n: 1 } }))).toBe("r<2");
    expect(rulesText(normalizeSpec({ count: 2, sides: 6, rerollUntilWhen: { op: ">=", n: 3 } }))).toBe("");
    // Nonsense is left out, never guessed at.
    expect(rulesText(normalizeSpec({ count: 2, sides: 6, success: { op: "≥", n: 5 } as never, sort: "up" as never, critical: 6 as never }))).toBe("");
    expect(normalizeSpec({ count: 2, sides: 6, label: "  fire   damage " }).label).toBe("fire damage");
    expect(normalizeSpec({ count: 2, sides: 6, label: "<b>x</b>" }).label).toBe("<b>x</b>");
    expect(normalizeSpec({ count: 2, sides: 6, label: "a#b" })).not.toHaveProperty("label");
    expect(normalizeSpec({ count: 2, sides: 6, label: 7 as never })).not.toHaveProperty("label");
  });

  it("two kinds that are the same dice under the same rules are still one kind, and others are not", () => {
    expect(formatNotation(spec("3d10>=8+2d10>=8"))).toBe("5d10>=8");
    expect(formatNotation(spec("3d10>=8+2d10>=7"))).toBe("3d10>=8+2d10>=7");
    expect(formatNotation(spec("2d6min2+1d6"))).toBe("2d6min2+1d6");
  });
});

describe("a roll by the rules added in 1.7.0", () => {
  it("counts successes, and takes failures away", () => {
    const pool = thrown("6d10>=8f=1", [8, 1, 10, 5, 1, 9]);
    expect(pool.total).toBe(1);
    expect(diceOf(pool).map((d) => d.counts ?? 0)).toEqual([1, -1, 1, 0, -1, 1]);
    expect(isSuccessRoll(pool.spec)).toBe(true);
    expect(thrown("6d10>=8+2", [8, 1, 10, 5, 1, 9]).total).toBe(5);
    // Counted dice and added dice in one roll: three successes and a 4.
    const mixed = thrown("4d10>=8+1d6", [8, 9, 10, 1, 4]);
    expect(mixed.total).toBe(7);
    expect(isSuccessRoll(mixed.spec)).toBe(false);
  });

  it("explodes on the faces asked for, each extra die a die of its own", () => {
    const again = thrown("3d10>=8!", [10, 9, 3, 2]);
    // The 10 throws another die, the 9, which is a success too.
    expect(diceOf(again).map((d) => [d.face, d.exploded, d.die, d.counts ?? 0])).toEqual([
      [10, true, 0, 1],
      [9, false, 0, 1],
      [3, false, 1, 0],
      [2, false, 2, 0],
    ]);
    expect(again.total).toBe(2);
    expect(thrown("2d6!>=5", [5, 6, 2, 1]).total).toBe(14);
    expect(thrown("2d6!=1", [1, 1, 3, 4]).total).toBe(9);
  });

  it("compounds a chain into the die that threw it", () => {
    const whole = thrown("2d6>=8!!", [6, 3, 2]);
    // 6 and 3 are one die worth 9: one success, marked on the last die of the chain.
    expect(diceOf(whole).map((d) => [d.face, d.die, d.counts ?? 0])).toEqual([
      [6, 0, 0],
      [3, 0, 1],
      [2, 1, 0],
    ]);
    expect(whole.total).toBe(1);
    expect(thrown("2d6!!", [6, 3, 2]).total).toBe(11);
  });

  it("takes one off each extra die of a penetrating explosion", () => {
    const deep = thrown("2d6!p", [6, 6, 2, 3]);
    expect(diceOf(deep).map((d) => d.value ?? d.face)).toEqual([6, 5, 1, 3]);
    expect(deep.total).toBe(15);
    // The extra die explodes on its face, not on what it is worth.
    expect(diceOf(deep).map((d) => d.exploded)).toEqual([true, true, false, false]);
    expect(thrown("1d6!!p", [6, 6, 1]).total).toBe(11);
  });

  it("rerolls the faces asked for", () => {
    const once = thrown("2d6ro=3", [3, 3, 5]);
    expect(diceOf(once).map((d) => [d.face, d.status])).toEqual([
      [3, "rerolled"],
      [3, "kept"],
      [5, "kept"],
    ]);
    expect(once.total).toBe(8);
    const until = thrown("2d6r>=5", [6, 5, 2, 4]);
    expect(diceOf(until).map((d) => d.status)).toEqual(["rerolled", "rerolled", "kept", "kept"]);
    expect(until.total).toBe(6);
  });

  it("raises and lowers what a die counts for, and shows the face it threw", () => {
    const raised = thrown("4d6min2max5", [1, 6, 3, 2]);
    expect(raised.faces).toEqual([1, 6, 3, 2]);
    expect(diceOf(raised).map((d) => d.value)).toEqual([2, 5, undefined, undefined]);
    expect(raised.total).toBe(12);
    // Kept by the face: a raised die is still the lowest.
    expect(thrown("3d6min3kh2", [1, 2, 6]).total).toBe(9);
  });

  it("marks critical dice and changes nothing else", () => {
    const attack = thrown("1d20cs>=19cf=1+5", [19]);
    expect(diceOf(attack)[0]?.critical).toBe("success");
    expect(attack.total).toBe(24);
    expect(diceOf(thrown("2d20cs=20cf=1", [1, 7])).map((d) => d.critical)).toEqual(["failure", undefined]);
    expect(distributionOf(spec("1d20cs>=19cf=1+5"))).toEqual(distributionOf(spec("1d20+5")));
    expect(canHold(spec("2d6cs=6"))).toBe(true);
    expect(canHold(spec("2d6>=5"))).toBe(false);
    expect(canHold(spec("2d6min2"))).toBe(false);
    expect(canHold(spec("2d6sd"))).toBe(false);
  });

  it("is read back from its faces, and refuses faces it could not have thrown", () => {
    for (const text of ["6d10>=8f=1!", "3d6!!p>=5", "2d6r>=5", "4d6min2max5kh3", "2d6ro=3>=4", "1d20cs>=19cf=1+5 # attack"]) {
      const made = roll(spec(text), seededSource(`read ${text}`), 5);
      const read = rollFrom(made.spec, made.faces, made.id, made.at, made.seed);
      expect(read, text).toEqual(made);
      expect(readDice(made.spec, [...made.faces, 1]), text).toBeNull();
      expect(readDice(made.spec, made.faces.slice(0, -1)), text).toBeNull();
      // And through a link.
      expect(readShared(shareQuery(made))?.total, text).toBe(made.total);
      expect(readShared(shareQuery(made))?.spec, text).toEqual(made.spec);
    }
  });

  it("replays from a seed, die for die", () => {
    for (const text of ["6d10>=8f=1!", "3d6!!p", "2d6r>=5+1d8ro=1", "4d6min2kh3"]) {
      const a = roll(spec(text), seededSource("same"), 1);
      const b = roll(spec(text), seededSource("same"), 1);
      expect(a.faces).toEqual(b.faces);
      expect(a.total).toBe(b.total);
    }
  });

  it("never totals outside its range, over many seeded rolls", () => {
    for (const text of ["6d10>=8f=1!", "3d6!!p", "3d6!p>=5", "2d6r>=5", "4d6min2max5kh3", "5d10>=8!!", "3d4!=1"]) {
      const of = spec(text);
      const { min, max } = rangeOf(of);
      const source = seededSource(`range ${text}`);
      for (let i = 0; i < 400; i++) {
        const { total } = roll(of, source, i);
        expect(total, text).toBeGreaterThanOrEqual(min);
        expect(total, text).toBeLessThanOrEqual(max);
      }
    }
  });
});
