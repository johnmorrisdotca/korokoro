import { describe, expect, it } from "vitest";
import {
  diceCount,
  groupsOf,
  MAX_DICE,
  MAX_GROUPS,
  MAX_REROLLS,
  normalizeSpec,
  rangeOf,
  readDice,
  roll,
  sidesOf,
  specOf,
} from "./dice.ts";
import { parseHistory, serializeHistory } from "./history.ts";
import { checkNotation, formatNotation, parseNotation } from "./notation.ts";
import {
  chanceAtLeast,
  chanceExactly,
  distributionOf,
  exactCounts,
  expectedTotal,
  luckOf,
  mostLikely,
  spreadOf,
} from "./odds.ts";
import { dice, expectSame, faces, paired, scripted, sum } from "./pools.fixture.ts";
import { type RandomSource, seededSource } from "./random.ts";
import { readShared, SHARE_VERSION, shareQuery } from "./share.ts";
import { statsOf } from "./stats.ts";

describe("several kinds of dice in one roll", () => {
  it("1d20+1d4 is a d20 and a d4, thrown in that order and added", () => {
    const spec = dice("1d20+1d4");
    expect(spec).toEqual({
      count: 1,
      sides: 20,
      modifier: 0,
      keep: "all",
      more: [{ count: 1, sides: 4, keep: "all" }],
    });
    expect(groupsOf(spec)).toEqual([
      { count: 1, sides: 20, keep: "all" },
      { count: 1, sides: 4, keep: "all" },
    ]);
    expect(diceCount(spec)).toBe(2);
    expect(formatNotation(spec)).toBe("1d20+1d4");
    expect(rangeOf(spec)).toEqual({ min: 2, max: 24 });
    const r = roll(spec, scripted([17, 3]), 1);
    expect(r.faces).toEqual([17, 3]);
    expect(r.total).toBe(20);
    expect(r.dice).toEqual([
      { face: 17, status: "kept", exploded: false, die: 0, group: 0 },
      { face: 3, status: "kept", exploded: false, die: 1, group: 1 },
    ]);
    expect(r.dice?.map((d) => sidesOf(spec, d))).toEqual([20, 4]);
  });

  it("a roll of one kind is the same object it always was", () => {
    expect(dice("2d6+3")).toEqual({ count: 2, sides: 6, modifier: 3, keep: "all" });
    expect(specOf([{ count: 2, sides: 6 }], 3)).toEqual({ count: 2, sides: 6, modifier: 3, keep: "all" });
    expect(roll(dice("2d6"), scripted([1, 2]), 1).dice).toEqual([
      { face: 1, status: "kept", exploded: false, die: 0 },
      { face: 2, status: "kept", exploded: false, die: 1 },
    ]);
    expect(groupsOf(dice("4d6dl1"))).toEqual([{ count: 4, sides: 6, keep: "highest", keepCount: 3 }]);
  });

  it.each([
    ["2d6+1d8+3", "2d6+1d8+3"],
    ["d20 + d4", "1d20+1d4"],
    ["2D20KH1 + 1D4 - 2", "2d20kh1+1d4-2"],
    ["1d8+1d6!+4dF", "1d8+1d6!+4dF"],
    ["2d6+3d6", "5d6"],
    ["2d6+1d8+2d6", "4d6+1d8"],
    ["2d20kh1+1d20", "2d20kh1+1d20"],
    ["1d4+1d6+1d8+1d10", "1d4+1d6+1d8+1d10"],
    ["3d6ro<2+2d6r<2", "3d6ro<2+2d6r<2"],
    ["1d%+1d10", "1d100+1d10"],
  ])("reads %s and writes it back as %s", (text, canonical) => {
    const spec = dice(text);
    expect(formatNotation(spec)).toBe(canonical);
    expect(parseNotation(canonical)).toEqual(spec);
    expect(normalizeSpec(spec)).toEqual(spec);
  });

  it.each([
    ["1d4+1d6+1d8+1d10+1d12", "kinds", "1d12"],
    ["6d6+5d8", "count", "5d8"],
    ["5d6+5d8+1d4", "count", "1d4"],
    ["1d20+1d4+", "shape", "+"],
    ["1d20+1d1", "sides", "d1"],
    ["1d20+4d6kh4", "keep", "kh4"],
    ["1d20+", "shape", "+"],
    ["1d20++1d4", "shape", "++1d4"],
  ] as const)("refuses %s, and says it is the %s: %s", (text, problem, part) => {
    expect(checkNotation(text)).toMatchObject({ ok: false, problem, part });
    expect(parseNotation(text)).toBeNull();
  });

  it(`takes ${MAX_GROUPS} kinds and ${MAX_DICE} dice, and normalizeSpec leaves out what is past that`, () => {
    expect(diceCount(dice("4d6+3d8+2d10+1d12"))).toBe(10);
    const more = Array.from({ length: 6 }, (_, i) => ({ count: 3, sides: 4 + i, keep: "all" as const }));
    const fair = normalizeSpec({ count: 2, sides: 20, more });
    expect(groupsOf(fair)).toHaveLength(MAX_GROUPS);
    expect(diceCount(fair)).toBe(10);
    expect(formatNotation(fair)).toBe("2d20+3d4+3d5+2d6");
    expect(normalizeSpec({ count: 10, sides: 6, more: [{ count: 1, sides: 4, keep: "all" }] })).toEqual({
      count: 10,
      sides: 6,
      modifier: 0,
      keep: "all",
    });
    expect(
      normalizeSpec({ count: 1, sides: 6, more: [{ count: 1, sides: 0 as never, keep: "all" }, null as never] }),
    ).toEqual({ count: 1, sides: 6, modifier: 0, keep: "all" });
  });

  it("each kind keeps its own rules", () => {
    const r = roll(dice("2d20kh1+2d4!+1"), scripted([5, 18, 4, 2, 3]), 1);
    expect(r.dice?.map((d) => [d.face, d.status, d.exploded, d.die, d.group])).toEqual([
      [5, "dropped", false, 0, 0],
      [18, "kept", false, 1, 0],
      [4, "kept", true, 2, 1],
      [2, "kept", false, 2, 1],
      [3, "kept", false, 3, 1],
    ]);
    expect(r.total).toBe(18 + 4 + 2 + 3 + 1);
    expect(readDice(r.spec, r.faces)).toEqual(r.dice);
    expect(readDice(r.spec, [5, 18, 4, 2])).toBeNull();
    // A 5 is a face of the d20 and not of the d4.
    expect(readDice(dice("1d20+1d4"), [5, 5])).toBeNull();
    expect(readDice(dice("1d20+1d4"), [5, 4])).not.toBeNull();
  });

  it("has the odds of every pair of totals", () => {
    expectSame(dice("1d20+1d4"), paired(faces(20), faces(4)));
    expectSame(dice("2d6+1d8+3"), paired(faces(6), faces(6), faces(8)), 3);
    expectSame(dice("1d4+1d6+1d8+1d10"), paired(faces(4), faces(6), faces(8), faces(10)));
    expectSame(dice("2dF+1d6-1"), paired([-1, 0, 1], [-1, 0, 1], faces(6)), -1);
    expect(expectedTotal(dice("1d20+1d4"))).toBeCloseTo(13, 12);
    expect(spreadOf(dice("1d20+1d4"))).toBeCloseTo(Math.sqrt(399 / 12 + 15 / 12), 12);
    expect(chanceAtLeast(dice("1d20+1d4"), 24)).toBeCloseTo(1 / 80, 14);
    expect(mostLikely(dice("1d20+1d4"))).toEqual([5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21]);
    expect(luckOf(dice("1d20+1d4"), 13)).toBeCloseTo(0.5, 12);
  });

  it("puts a kept pool and a plain die together: advantage with a d4", () => {
    // The higher of two d20 is k with chance (2k − 1) / 400.
    const high = new Map<number, number>();
    for (let k = 1; k <= 20; k++)
      for (let b = 1; b <= 4; b++) high.set(k + b, (high.get(k + b) ?? 0) + (2 * k - 1) / 400 / 4);
    expectSame(dice("2d20kh1+1d4"), high);
    expect(expectedTotal(dice("2d20kh1+1d4+5"))).toBeCloseTo(13.825 + 2.5 + 5, 12);
  });

  it("counts small mixed pools in whole numbers, and says when it has none to give", () => {
    expect(exactCounts(dice("1d20+1d4"))?.outcomes).toBe(80n);
    expect(exactCounts(dice("1d20+1d4"))?.counts.slice(0, 5)).toEqual([1n, 2n, 3n, 4n, 4n]);
    expect(exactCounts(dice("2d6+1d8"))?.counts.reduce((a, b) => a + b, 0n)).toBe(288n);
    expect(exactCounts(dice("2d20kh1+1d4"))?.outcomes).toBe(1600n);
    expect(exactCounts(dice("1d20+1d6!"))).toBeNull();
    expect(exactCounts(dice("5d1000+5d999"))).toBeNull();
    expect(sum(distributionOf(dice("5d1000+5d999")).probabilities)).toBeCloseTo(1, 9);
  });

  it.each(["1d20+1d4+3", "2d20kh1+1d4", "3d6+2d8!", "4dF+1d6", "2d10ro<3+3d4kl1+1d12r<3-4"])(
    "the dice and the odds agree on %s",
    (text) => {
      const spec = dice(text);
      const d = distributionOf(spec);
      const source = seededSource(`mixed ${text}`);
      const throws = 40_000;
      const seen = new Array<number>(d.probabilities.length).fill(0);
      let total = 0;
      for (let i = 0; i < throws; i++) {
        const r = roll(spec, source, i);
        total += r.total;
        seen[r.total - d.min] = (seen[r.total - d.min] as number) + 1;
      }
      const mean = expectedTotal(spec);
      expect(Math.abs(total / throws - mean)).toBeLessThan((4 * spreadOf(spec)) / Math.sqrt(throws));
      d.probabilities.forEach((p, i) => {
        expect(Math.abs((seen[i] as number) / throws - p), `${text} = ${d.min + i}`).toBeLessThan(
          5 * Math.sqrt((p * (1 - p)) / throws) + 2 / throws,
        );
      });
    },
  );

  it("replays from a seed, is kept, and is shared", () => {
    const spec = dice("2d20kh1+2d4!+1d8ro<2+3");
    const a = seededSource("pool");
    const b = seededSource("pool");
    for (let i = 0; i < 40; i++) {
      const first = roll(spec, a, i);
      expect(roll(spec, b, i).faces).toEqual(first.faces);
      expect(parseHistory(serializeHistory([first]))).toEqual([first]);
      expect(readShared(shareQuery(first))).toMatchObject({
        faces: first.faces,
        total: first.total,
        dice: first.dice,
        spec,
      });
    }
    expect(roll(dice("1d20+2d4"), seededSource("korokoro"), 1).faces).toEqual([15, 2, 3]);
  });

  it("counts naturals on the d20 of a mixed roll, and each die's faces under its own kind", () => {
    const history = [
      roll(dice("1d20+1d4"), scripted([20, 4]), 1),
      roll(dice("1d20+1d4"), scripted([1, 1]), 2),
      roll(dice("2d4"), scripted([4, 4]), 3),
    ];
    const stats = statsOf(history, dice("1d20+1d4"));
    expect(stats.naturalTwenties).toBe(1);
    expect(stats.naturalOnes).toBe(1);
    expect(stats.matches).toBe(2);
    expect(stats.faces?.sides).toBe(20);
    expect(stats.faces?.dice).toBe(2);
    expect(statsOf(history, dice("2d4")).faces?.counts).toEqual([1, 0, 0, 3]);
    expect(stats.totals?.rolls).toBe(2);
  });
});

describe("reroll until clear, as Roll20 writes it", () => {
  it("r rerolls until the die is clear, and ro rerolls once", () => {
    const until = dice("2d8r<3");
    expect(until).toEqual({ count: 2, sides: 8, modifier: 0, keep: "all", rerollUntil: 2 });
    expect(dice("2d8r<=2")).toEqual(until);
    expect(formatNotation(until)).toBe("2d8r<3");
    const once = dice("2d8ro<3");
    expect(once).toEqual({ count: 2, sides: 8, modifier: 0, keep: "all", reroll: 2 });
    expect(formatNotation(once)).toBe("2d8ro<3");
    // The same dice from the same throws: until clear keeps going where once stops.
    expect(roll(until, scripted([1, 2, 2, 5, 7]), 1)).toMatchObject({
      faces: [1, 2, 2, 5, 7],
      kept: [false, false, false, true, true],
      total: 12,
    });
    expect(roll(once, scripted([1, 2, 2, 5]), 1)).toMatchObject({
      faces: [1, 2, 2, 5],
      kept: [false, true, false, true],
      total: 7,
    });
  });

  it(`stops after ${MAX_REROLLS} rerolls, and the die stands as it lies`, () => {
    const ones: RandomSource = { seed: null, next: () => 0 };
    const r = roll(dice("1d6r<2"), ones, 1);
    expect(r.faces).toHaveLength(MAX_REROLLS + 1);
    expect(r.dice?.filter((d) => d.status === "rerolled")).toHaveLength(MAX_REROLLS);
    expect(r.dice?.at(-1)).toMatchObject({ face: 1, status: "kept" });
    expect(r.total).toBe(1);
    expect(readDice(r.spec, r.faces)).toEqual(r.dice);
    expect(readDice(r.spec, [...r.faces, 1])).toBeNull();
  });

  it("has exact odds, the limit included: a d6 clear of its 1s is all but a d5 from 2 to 6", () => {
    const spec = dice("1d6r<2");
    const stuck = (1 / 6) ** MAX_REROLLS / 6;
    expect(chanceExactly(spec, 1)).toBeCloseTo(stuck, 20);
    expect(chanceExactly(spec, 1)).toBeGreaterThan(0);
    for (let face = 2; face <= 6; face++) expect(chanceExactly(spec, face)).toBeCloseTo((1 - stuck) / 5, 14);
    expect(sum(distributionOf(spec).probabilities)).toBeCloseTo(1, 14);
    // Half the faces rerolled is the most allowed, and the worst case for the limit.
    const half = dice("1d6r<4");
    expect(chanceAtLeast(half, 4)).toBeCloseTo(1 - 0.5 ** (MAX_REROLLS + 1), 14);
    expect(1 - chanceAtLeast(half, 4)).toBeLessThan(0.001);
  });

  it("matches a walk of every chain of rerolls", () => {
    const walk = (left: number, weight: number, out: Map<number, number>) => {
      for (let face = 1; face <= 4; face++) {
        if (face <= 2 && left > 0) walk(left - 1, weight / 4, out);
        else out.set(face, (out.get(face) ?? 0) + weight / 4);
      }
      return out;
    };
    const one = walk(MAX_REROLLS, 1, new Map());
    const two = new Map<number, number>();
    for (const [a, pa] of one) for (const [b, pb] of one) two.set(a + b + 1, (two.get(a + b + 1) ?? 0) + pa * pb);
    expectSame(dice("2d4r<3+1"), two);
  });

  it.each(["3d6r<2", "4d6r<2kh3", "2d8!r<3", "3dFr<0"])("the dice and the odds agree on %s", (text) => {
    const spec = dice(text);
    const source = seededSource(`until ${text}`);
    const throws = 40_000;
    let total = 0;
    for (let i = 0; i < throws; i++) total += roll(spec, source, i).total;
    expect(Math.abs(total / throws - expectedTotal(spec))).toBeLessThan((4 * spreadOf(spec)) / Math.sqrt(throws));
  });

  it.each([
    ["1d6r<5", "reroll", "r<5"],
    ["1d6r<=4", "reroll", "r<=4"],
    ["1d6r<1", "reroll", "r<1"],
    ["1d6r<7", "reroll", "r<7"],
    ["4dFr<1", "reroll", "r<1"],
    ["1d6r<2ro<2", "twice", "ro<2"],
    ["1d6ro<2r<2", "twice", "r<2"],
  ] as const)("refuses %s, and says it is the %s: %s", (text, problem, part) => {
    expect(checkNotation(text)).toMatchObject({ ok: false, problem, part });
  });

  it("still takes ro of most of a die's faces, since once always ends", () => {
    expect(dice("1d6ro<6")).toMatchObject({ reroll: 5 });
    expect(normalizeSpec({ count: 1, sides: 6, rerollUntil: 5 })).not.toHaveProperty("rerollUntil");
    expect(normalizeSpec({ count: 1, sides: 6, rerollUntil: 1, reroll: 3 })).toEqual({
      count: 1,
      sides: 6,
      modifier: 0,
      keep: "all",
      rerollUntil: 1,
    });
  });

  it("reads what 1.2.0 and 1.3.0 wrote as they meant it", () => {
    // A link made by 1.3.0: `r<3` was reroll once, and the link has no version.
    const old = "roll=2d6r%3C3&faces=2%2C1%2C5&at=5";
    expect(readShared(old)).toMatchObject({
      spec: { count: 2, sides: 6, reroll: 2 },
      faces: [2, 1, 5],
      kept: [false, true, true],
      total: 6,
    });
    expect(readShared(old)?.spec).not.toHaveProperty("rerollUntil");
    // The same faces do not fit a reroll until clear: the 1 would have been thrown again.
    expect(readShared(`${old}&v=${SHARE_VERSION}`)).toBeNull();
    expect(parseNotation("2d6r<3", { legacyReroll: true })).toEqual({
      count: 2,
      sides: 6,
      modifier: 0,
      keep: "all",
      reroll: 2,
    });
    // A history kept by 1.3.0 holds the spec, not notation, so it means what it meant.
    const kept =
      '{"version":1,"rolls":[{"id":"a","spec":{"count":2,"sides":6,"modifier":0,"keep":"all","reroll":2},"faces":[2,1,5],"kept":[false,true,true],"total":6,"at":5,"seed":null}]}';
    expect(parseHistory(kept)[0]).toMatchObject({ faces: [2, 1, 5], total: 6, spec: { reroll: 2 } });
    expect(formatNotation(parseHistory(kept)[0]!.spec)).toBe("2d6ro<3");
  });

  it("every link now says which notation it is written in, and comes back the same", () => {
    const r = roll(dice("2d8r<3+1d4ro<2"), seededSource("v"), 7);
    expect(shareQuery(r)).toContain(`v=${SHARE_VERSION}`);
    expect(readShared(shareQuery(r))).toMatchObject({ spec: r.spec, faces: r.faces, total: r.total });
    const plain = roll(dice("2d6"), seededSource("v"), 7);
    expect(readShared(shareQuery(plain).replace(`&v=${SHARE_VERSION}`, ""))).toMatchObject({ faces: plain.faces });
  });
});
