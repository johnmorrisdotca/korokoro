import { describe, expect, it } from "vitest";
import { counted, dice, expectSame, scripted, sum } from "./advanced.fixture.ts";
import { faceRange, MAX_EXPLOSIONS, normalizeSpec, rangeOf, roll } from "./dice.ts";
import { parseHistory, serializeHistory } from "./history.ts";
import { formatNotation } from "./notation.ts";
import { chanceAtLeast, chanceExactly, distributionOf, expectedTotal, mostLikely } from "./odds.ts";
import { type RandomSource, seededSource } from "./random.ts";
import { readShared, shareQuery } from "./share.ts";
import { faceStats } from "./stats.ts";

describe("rolls from 1.0.0 still come out the same", () => {
  // Thrown with the 1.0.0 source: two rolls in a row from each seed.
  it.each([
    ["2d6", "korokoro", [5, 2], [true, true], 7, [5, 5], 10],
    ["3d6+2", "table-7", [6, 4, 2], [true, true, true], 14, [1, 6, 3], 12],
    ["1d20", "nat", [14], [true], 14, [19], 19],
    ["2d20kh1+5", "adv", [5, 18], [false, true], 23, [5, 2], 10],
    ["2d20kl1-1", "dis", [4, 5], [true, false], 3, [7, 8], 6],
    ["5d100", "percent", [14, 18, 33, 39, 66], [true, true, true, true, true], 170, [64, 73, 6, 47, 22], 212],
    ["4d8", "a", [4, 6, 8, 7], [true, true, true, true], 25, [3, 3, 7, 3], 16],
    ["5d4", "b", [4, 4, 1, 3, 1], [true, true, true, true, true], 13, [3, 2, 3, 4, 4], 16],
    ["3d10", "c", [7, 7, 7], [true, true, true], 21, [8, 10, 2], 20],
    ["2d12+7", "d", [3, 12], [true, true], 22, [8, 3], 18],
    ["5d6kh1", "e", [1, 4, 1, 5, 4], [false, false, false, true, false], 5, [6, 3, 5, 5, 3], 6],
    ["d%", "f", [2], [true], 2, [86], 86],
  ] as const)("%s from the seed %s", (text, seed, faces, kept, total, nextFaces, nextTotal) => {
    const source = seededSource(seed);
    const first = roll(dice(text), source, 1);
    expect(first.faces).toEqual(faces);
    expect(first.kept).toEqual(kept);
    expect(first.total).toBe(total);
    const second = roll(dice(text), source, 2);
    expect(second.faces).toEqual(nextFaces);
    expect(second.total).toBe(nextTotal);
  });

  it("and so do their specs, their notation and their odds", () => {
    expect(dice("3d6+2")).toEqual({ count: 3, sides: 6, modifier: 2, keep: "all" });
    expect(Object.keys(dice("2d20kh1+5")).sort()).toEqual(["count", "keep", "modifier", "sides"]);
    expect(formatNotation(dice("d%"))).toBe("1d100");
    expect(formatNotation(dice("2d20kl"))).toBe("2d20kl1");
    expect(distributionOf(dice("3d6")).probabilities.slice(0, 4)).toEqual([
      0.004629629629629629, 0.013888888888888888, 0.027777777777777776, 0.046296296296296294,
    ]);
    expect(distributionOf(dice("3d4kl1")).probabilities).toEqual([0.578125, 0.296875, 0.109375, 0.015625]);
    expect(expectedTotal(dice("2d20kh1+5"))).toBe(18.825);
    expect(chanceAtLeast(dice("2d20kh1+5"), 15)).toBe(0.7975000000000001);
  });

  it("a history kept by 1.0.0 reads back as it was", () => {
    const kept =
      '{"version":1,"rolls":[{"id":"a-1","spec":{"count":2,"sides":20,"modifier":5,"keep":"highest"},"faces":[5,18],"kept":[false,true],"total":23,"at":1,"seed":"adv"}]}';
    const [read] = parseHistory(kept);
    expect(read).toMatchObject({ id: "a-1", faces: [5, 18], kept: [false, true], total: 23, seed: "adv" });
    expect(read?.dice?.map((d) => d.status)).toEqual(["dropped", "kept"]);
  });
});

describe("a die of any size", () => {
  it.each([2, 3, 7, 14, 30, 1000])("throws a d%i from 1 to its highest face and counts its odds", (sides) => {
    const spec = dice(`2d${sides}`);
    expect(spec.sides).toBe(sides);
    expect(formatNotation(spec)).toBe(`2d${sides}`);
    expect(rangeOf(spec)).toEqual({ min: 2, max: 2 * sides });
    const source = seededSource(`any${sides}`);
    for (let i = 0; i < 200; i++)
      for (const face of roll(spec, source, i).faces) expect(face >= 1 && face <= sides).toBe(true);
    expect(sum(distributionOf(spec).probabilities)).toBeCloseTo(1, 12);
    expect(chanceExactly(spec, sides + 1)).toBeCloseTo(1 / sides, 12);
    expect(expectedTotal(spec)).toBeCloseTo(sides + 1, 9);
  });

  it("shows every face of a d3", () => {
    const source = seededSource("d3");
    const seen = new Set<number>();
    for (let i = 0; i < 100; i++) seen.add(roll(dice("d3"), source, i).total);
    expect([...seen].sort()).toEqual([1, 2, 3]);
  });

  it("counts five d1000 as 1.2.0 did", () => {
    const d = distributionOf(dice("5d1000"));
    expect(d.probabilities).toHaveLength(4996);
    expect(d.probabilities[0]).toBe(1e-15);
    expect(sum(d.probabilities)).toBeCloseTo(1, 12);
  });
});

describe("Fate dice", () => {
  it("each roll −1, 0 or +1, and four of them make −4 to +4", () => {
    const spec = dice("4dF");
    expect(dice("4df")).toEqual(spec);
    expect(spec).toEqual({ count: 4, sides: "F", modifier: 0, keep: "all" });
    expect(formatNotation(spec)).toBe("4dF");
    expect(faceRange("F")).toEqual({ low: -1, high: 1 });
    expect(rangeOf(spec)).toEqual({ min: -4, max: 4 });
    const source = seededSource("fate");
    const faces = new Set<number>();
    for (let i = 0; i < 100; i++) {
      const r = roll(spec, source, i);
      expect(r.total).toBe(sum(r.faces));
      for (const face of r.faces) faces.add(face);
    }
    expect([...faces].sort((a, b) => a - b)).toEqual([-1, 0, 1]);
  });

  it("has the odds every Fate player knows: nought 19 times in 81", () => {
    const spec = dice("4dF+2");
    expect(chanceExactly(spec, 2)).toBeCloseTo(19 / 81, 12);
    expect(chanceExactly(spec, 6)).toBeCloseTo(1 / 81, 12);
    expect(chanceExactly(spec, -2)).toBeCloseTo(1 / 81, 12);
    expect(chanceAtLeast(spec, 4)).toBeCloseTo(15 / 81, 12);
    expect(expectedTotal(spec)).toBeCloseTo(2, 12);
    expect(mostLikely(dice("4dF"))).toEqual([0]);
  });

  it("is kept, shared and counted with its minus faces", () => {
    const r = roll(dice("4dF"), scripted([1, 2, 3, 1]), 9);
    expect(r.faces).toEqual([-1, 0, 1, -1]);
    expect(r.total).toBe(-1);
    expect(parseHistory(serializeHistory([r]))).toEqual([r]);
    expect(readShared(shareQuery(r))).toMatchObject({ faces: [-1, 0, 1, -1], total: -1 });
    expect(readShared("roll=4dF&faces=-1,0,2,1")).toBeNull();
    expect(faceStats([r], "F").counts).toEqual([2, 1, 1]);
  });
});

describe("keeping and dropping", () => {
  it("4d6, drop the lowest: the ability score everybody rolls", () => {
    const spec = dice("4d6dl1");
    expect(spec).toEqual({ count: 4, sides: 6, modifier: 0, keep: "highest", keepCount: 3 });
    expect(dice("4d6kh3")).toEqual(spec);
    expect(formatNotation(spec)).toBe("4d6kh3");
    expect(rangeOf(spec)).toEqual({ min: 3, max: 18 });
    expect(expectedTotal(spec)).toBeCloseTo(15869 / 1296, 12);
    expect(chanceExactly(spec, 18)).toBeCloseTo(21 / 1296, 12);
    expect(chanceExactly(spec, 3)).toBeCloseTo(1 / 1296, 14);
    const r = roll(spec, scripted([3, 6, 1, 6]), 1);
    expect(r.kept).toEqual([true, true, false, true]);
    expect(r.dice?.map((d) => d.status)).toEqual(["kept", "kept", "dropped", "kept"]);
    expect(r.total).toBe(15);
  });

  it("a tie keeps the dice thrown first", () => {
    expect(roll(dice("4d6kh2"), scripted([5, 5, 5, 2]), 1).kept).toEqual([true, true, false, false]);
    expect(roll(dice("3d6dh1"), scripted([4, 4, 1]), 1).kept).toEqual([true, false, true]);
    expect(roll(dice("3d6kl2"), scripted([2, 6, 2]), 1).total).toBe(4);
  });

  it("matches a count of every throw, for every pool up to five dice", () => {
    for (const sides of [4, 6]) {
      const faces = Array.from({ length: sides }, (_, i) => i + 1);
      for (let count = 2; count <= 5; count++) {
        for (let keep = 1; keep < count; keep++) {
          for (const which of ["highest", "lowest"] as const) {
            if (count > 5) continue;
            const spec = normalizeSpec({ count, sides, keep: which, keepCount: keep, modifier: 1 });
            const want = counted(
              count,
              faces,
              () => 1 / sides,
              (standing) => {
                const sorted = [...standing].sort((a, b) => (which === "highest" ? b - a : a - b));
                return sum(sorted.slice(0, keep)) + 1;
              },
            );
            expectSame(spec, want);
          }
        }
      }
    }
  });

  it("dropping the highest is keeping the lowest", () => {
    expect(dice("5d8dh2")).toEqual(dice("5d8kl3"));
    expect(dice("2d20dl1")).toEqual(dice("2d20kh1"));
    expect(dice("2d20dl")).toEqual({ count: 2, sides: 20, modifier: 0, keep: "highest" });
  });
});

describe("rerolls", () => {
  it("throw a low die again, once, and the new face stands whatever it is", () => {
    const spec = dice("2d6ro<3");
    expect(spec).toEqual({ count: 2, sides: 6, modifier: 0, keep: "all", reroll: 2 });
    expect(dice("2d6ro<=2")).toEqual(spec);
    expect(formatNotation(spec)).toBe("2d6ro<3");
    const r = roll(spec, scripted([2, 1, 5]), 1);
    expect(r.faces).toEqual([2, 1, 5]);
    expect(r.dice).toEqual([
      { face: 2, status: "rerolled", exploded: false, die: 0 },
      { face: 1, status: "kept", exploded: false, die: 0 },
      { face: 5, status: "kept", exploded: false, die: 1 },
    ]);
    expect(r.kept).toEqual([false, true, true]);
    expect(r.total).toBe(6);
  });

  it("make the low faces rarer, not impossible", () => {
    const one = dice("1d6ro<3");
    expect(chanceExactly(one, 1)).toBeCloseTo(1 / 18, 14);
    expect(chanceExactly(one, 2)).toBeCloseTo(1 / 18, 14);
    expect(chanceExactly(one, 6)).toBeCloseTo(2 / 9, 14);
    expect(expectedTotal(one)).toBeCloseTo((1 + 2) / 18 + ((3 + 4 + 5 + 6) * 2) / 9, 12);
    expect(rangeOf(one)).toEqual({ min: 1, max: 6 });
  });

  it("match a count of every throw, with and without keeping", () => {
    const faces = [1, 2, 3, 4, 5, 6];
    const chance = (mark: number) => (face: number) => (face > mark ? 1 / 6 : 0) + mark / 36;
    expectSame(
      dice("3d6ro<3+2"),
      counted(3, faces, chance(2), (s) => sum(s) + 2),
    );
    expectSame(
      dice("4d6ro<2kh3"),
      counted(4, faces, chance(1), (s) => sum([...s].sort((a, b) => b - a).slice(0, 3))),
    );
    expectSame(
      dice("5d6ro<=4kl2"),
      counted(5, faces, chance(4), (s) => sum([...s].sort((a, b) => a - b).slice(0, 2))),
    );
    const fate = (face: number) => (face > -1 ? 1 / 3 : 0) + 1 / 9;
    expectSame(
      dice("3dFro<0kh2"),
      counted(3, [-1, 0, 1], fate, (s) => sum([...s].sort((a, b) => b - a).slice(0, 2))),
    );
  });

  it("keep picks among the dice left standing, never a rerolled one", () => {
    const r = roll(dice("3d6ro<2kh2"), scripted([1, 4, 6, 1, 1]), 1);
    expect(r.dice?.map((d) => d.status)).toEqual(["rerolled", "kept", "kept", "rerolled", "dropped"]);
    expect(r.total).toBe(10);
  });
});

describe("exploding dice", () => {
  it("a d4 that explodes three times is four dice and their sum", () => {
    const r = roll(dice("1d4!"), scripted([4, 4, 4, 2]), 1);
    expect(r.faces).toEqual([4, 4, 4, 2]);
    expect(r.dice?.map((d) => d.exploded)).toEqual([true, true, true, false]);
    expect(r.kept).toEqual([true, true, true, true]);
    expect(r.total).toBe(14);
  });

  it("each die's explosions follow it, before the next die is thrown", () => {
    const r = roll(dice("3d6!+1"), scripted([6, 2, 3, 6, 6, 1]), 1);
    expect(r.dice?.map((d) => d.die)).toEqual([0, 0, 1, 2, 2, 2]);
    expect(r.total).toBe(25);
  });

  it(`stops after ${MAX_EXPLOSIONS} explosions, and reads the last die as it lies`, () => {
    const always: RandomSource = { seed: null, next: () => 3 };
    const r = roll(dice("1d4!"), always, 1);
    expect(r.faces).toHaveLength(MAX_EXPLOSIONS + 1);
    expect(r.dice?.filter((d) => d.exploded)).toHaveLength(MAX_EXPLOSIONS);
    expect(r.dice?.at(-1)).toMatchObject({ face: 4, exploded: false, status: "kept" });
    expect(r.total).toBe(4 * (MAX_EXPLOSIONS + 1));
    expect(rangeOf(dice("1d4!"))).toEqual({ min: 1, max: 4 * (MAX_EXPLOSIONS + 1) });
    expect(roll(dice("5d2!"), always, 1).faces).toHaveLength(5 * (MAX_EXPLOSIONS + 1));
  });

  it("has exact odds, the cap included", () => {
    const one = dice("1d6!");
    expect(sum(distributionOf(one).probabilities)).toBeCloseTo(1, 14);
    expect(chanceExactly(one, 5)).toBeCloseTo(1 / 6, 14);
    expect(chanceExactly(one, 6)).toBe(0);
    expect(chanceExactly(one, 7)).toBeCloseTo(1 / 36, 14);
    expect(chanceExactly(one, 12)).toBe(0);
    expect(chanceExactly(one, 13)).toBeCloseTo(1 / 216, 14);
    // Only at the cap can the chain end on a six.
    expect(chanceExactly(one, 6 * (MAX_EXPLOSIONS + 1))).toBeCloseTo(6 ** -(MAX_EXPLOSIONS + 1), 20);
    expect(chanceExactly(one, 6 * (MAX_EXPLOSIONS + 1))).toBeGreaterThan(0);
    // 3.5 for each die thrown, and a die is thrown 1 + 1/6 + … + 1/6^cap times.
    const thrown = (1 - 6 ** -(MAX_EXPLOSIONS + 1)) / (1 - 1 / 6);
    expect(expectedTotal(one)).toBeCloseTo(3.5 * thrown, 12);
    expect(expectedTotal(dice("3d6!+2"))).toBeCloseTo(3 * 3.5 * thrown + 2, 11);
  });

  it("matches a walk of every chain two d4 can make", () => {
    // One die by walking its tree: a 4 goes on, anything else ends, and the last die allowed ends whatever it shows.
    const chains = new Map<number, number>();
    const walk = (soFar: number, weight: number, left: number) => {
      for (let face = 1; face <= 4; face++) {
        if (face === 4 && left > 0) walk(soFar + 4, weight / 4, left - 1);
        else chains.set(soFar + face, (chains.get(soFar + face) ?? 0) + weight / 4);
      }
    };
    walk(0, 1, MAX_EXPLOSIONS);
    const pair = new Map<number, number>();
    for (const [a, pa] of chains)
      for (const [b, pb] of chains) pair.set(a + b + 3, (pair.get(a + b + 3) ?? 0) + pa * pb);
    expectSame(dice("2d4!+3"), pair);
  });

  it("rerolls first, then explodes on the face that stands", () => {
    const r = roll(dice("2d6!ro<2"), scripted([1, 6, 1, 3, 4]), 1);
    expect(r.dice).toEqual([
      { face: 1, status: "rerolled", exploded: false, die: 0 },
      { face: 6, status: "kept", exploded: true, die: 0 },
      { face: 1, status: "rerolled", exploded: false, die: 0 },
      { face: 3, status: "kept", exploded: false, die: 0 },
      { face: 4, status: "kept", exploded: false, die: 1 },
    ]);
    expect(r.total).toBe(13);
    // A die stands on a six 7 times in 36: at once, or after a one.
    const spec = dice("1d6!ro<2");
    expect(chanceExactly(spec, 1)).toBeCloseTo(1 / 36, 14);
    expect(chanceExactly(spec, 7)).toBeCloseTo((7 / 36) * (1 / 36), 14);
    expect(chanceExactly(spec, 8)).toBeCloseTo((7 / 36) * (7 / 36), 14);
    expect(sum(distributionOf(spec).probabilities)).toBeCloseTo(1, 14);
  });
});
