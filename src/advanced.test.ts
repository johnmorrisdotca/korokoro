import { describe, expect, it } from "vitest";

import { MAX_DICE, MAX_EXPLODING_SIDES, MAX_EXPLOSIONS, MAX_MODIFIER, MAX_SIDES, diceOf, faceRange, normalizeSpec, rangeOf, readDice, roll, type Roll, type RollSpec } from "./dice.ts";
import { parseHistory, serializeHistory } from "./history.ts";
import { checkNotation, formatNotation, parseNotation } from "./notation.ts";
import { chanceAtLeast, chanceExactly, distributionOf, exactCounts, expectedTotal, luckOf, mostLikely } from "./odds.ts";
import { seededSource, type RandomSource } from "./random.ts";
import { readShared, shareQuery } from "./share.ts";
import { faceStats, statsOf } from "./stats.ts";
import { STRINGS } from "./ui/strings.ts";

const dice = (text: string): RollSpec => {
  const spec = parseNotation(text);
  if (spec === null) throw new Error(`${text} should be dice`);
  return spec;
};

/** A source that throws the faces it is handed, in order, on a numbered die. */
function scripted(faces: number[]): RandomSource {
  const left = [...faces];
  return {
    seed: null,
    next() {
      const face = left.shift();
      if (face === undefined) throw new Error("the script ran out of dice");
      return face - 1;
    },
  };
}

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/**
 * The odds by brute force, sharing nothing with odds.ts: every way the dice
 * can stand, each weighted by its chance, with the kept dice picked by sorting.
 */
function counted(count: number, faces: number[], chance: (face: number) => number, total: (standing: number[]) => number): Map<number, number> {
  const out = new Map<number, number>();
  const walk = (standing: number[], weight: number) => {
    if (standing.length === count) {
      const t = total(standing);
      out.set(t, (out.get(t) ?? 0) + weight);
      return;
    }
    for (const face of faces) walk([...standing, face], weight * chance(face));
  };
  walk([], 1);
  return out;
}

function expectSame(spec: RollSpec, want: Map<number, number>) {
  const d = distributionOf(spec);
  expect(sum(d.probabilities)).toBeCloseTo(1, 12);
  for (const [total, chance] of want) expect(chanceExactly(spec, total), `${formatNotation(spec)} = ${total}`).toBeCloseTo(chance, 12);
  // And nothing the count never reached.
  d.probabilities.forEach((p, i) => {
    if (!want.has(d.min + i)) expect(p, `${formatNotation(spec)} = ${d.min + i}`).toBeCloseTo(0, 15);
  });
}

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
    expect(distributionOf(dice("3d6")).probabilities.slice(0, 4)).toEqual([0.004629629629629629, 0.013888888888888888, 0.027777777777777776, 0.046296296296296294]);
    expect(distributionOf(dice("3d4kl1")).probabilities).toEqual([0.578125, 0.296875, 0.109375, 0.015625]);
    expect(expectedTotal(dice("2d20kh1+5"))).toBe(18.825);
    expect(chanceAtLeast(dice("2d20kh1+5"), 15)).toBe(0.7975000000000001);
  });

  it("a history kept by 1.0.0 reads back as it was", () => {
    const kept = '{"version":1,"rolls":[{"id":"a-1","spec":{"count":2,"sides":20,"modifier":5,"keep":"highest"},"faces":[5,18],"kept":[false,true],"total":23,"at":1,"seed":"adv"}]}';
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
    for (let i = 0; i < 200; i++) for (const face of roll(spec, source, i).faces) expect(face >= 1 && face <= sides).toBe(true);
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
            const want = counted(count, faces, () => 1 / sides, (standing) => {
              const sorted = [...standing].sort((a, b) => (which === "highest" ? b - a : a - b));
              return sum(sorted.slice(0, keep)) + 1;
            });
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
    const spec = dice("2d6r<3");
    expect(spec).toEqual({ count: 2, sides: 6, modifier: 0, keep: "all", reroll: 2 });
    expect(dice("2d6r<=2")).toEqual(spec);
    expect(formatNotation(spec)).toBe("2d6r<3");
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
    const one = dice("1d6r<3");
    expect(chanceExactly(one, 1)).toBeCloseTo(1 / 18, 14);
    expect(chanceExactly(one, 2)).toBeCloseTo(1 / 18, 14);
    expect(chanceExactly(one, 6)).toBeCloseTo(2 / 9, 14);
    expect(expectedTotal(one)).toBeCloseTo((1 + 2) / 18 + ((3 + 4 + 5 + 6) * 2) / 9, 12);
    expect(rangeOf(one)).toEqual({ min: 1, max: 6 });
  });

  it("match a count of every throw, with and without keeping", () => {
    const faces = [1, 2, 3, 4, 5, 6];
    const chance = (mark: number) => (face: number) => (face > mark ? 1 / 6 : 0) + mark / 36;
    expectSame(dice("3d6r<3+2"), counted(3, faces, chance(2), (s) => sum(s) + 2));
    expectSame(dice("4d6r<2kh3"), counted(4, faces, chance(1), (s) => sum([...s].sort((a, b) => b - a).slice(0, 3))));
    expectSame(dice("5d6r<=4kl2"), counted(5, faces, chance(4), (s) => sum([...s].sort((a, b) => a - b).slice(0, 2))));
    const fate = (face: number) => (face > -1 ? 1 / 3 : 0) + 1 / 9;
    expectSame(dice("3dFr<0kh2"), counted(3, [-1, 0, 1], fate, (s) => sum([...s].sort((a, b) => b - a).slice(0, 2))));
  });

  it("keep picks among the dice left standing, never a rerolled one", () => {
    const r = roll(dice("3d6r<2kh2"), scripted([1, 4, 6, 1, 1]), 1);
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
    for (const [a, pa] of chains) for (const [b, pb] of chains) pair.set(a + b + 3, (pair.get(a + b + 3) ?? 0) + pa * pb);
    expectSame(dice("2d4!+3"), pair);
  });

  it("rerolls first, then explodes on the face that stands", () => {
    const r = roll(dice("2d6!r<2"), scripted([1, 6, 1, 3, 4]), 1);
    expect(r.dice).toEqual([
      { face: 1, status: "rerolled", exploded: false, die: 0 },
      { face: 6, status: "kept", exploded: true, die: 0 },
      { face: 1, status: "rerolled", exploded: false, die: 0 },
      { face: 3, status: "kept", exploded: false, die: 0 },
      { face: 4, status: "kept", exploded: false, die: 1 },
    ]);
    expect(r.total).toBe(13);
    // A die stands on a six 7 times in 36: at once, or after a one.
    const spec = dice("1d6!r<2");
    expect(chanceExactly(spec, 1)).toBeCloseTo(1 / 36, 14);
    expect(chanceExactly(spec, 7)).toBeCloseTo((7 / 36) * (1 / 36), 14);
    expect(chanceExactly(spec, 8)).toBeCloseTo((7 / 36) * (7 / 36), 14);
    expect(sum(distributionOf(spec).probabilities)).toBeCloseTo(1, 14);
  });
});

describe("the dice and the odds agree", () => {
  // The odds are worked out and the dice are thrown by different code: over many seeded throws they must tell one story.
  it.each(["3d6!r<2", "4d6r<3kh3", "5d10kl2", "4dFkh2", "2d8!+3", "3d14dl1-2", "5d4!", "2d20r<=10kl1"])("%s", (text) => {
    const spec = dice(text);
    const d = distributionOf(spec);
    const source = seededSource(`agree ${text}`);
    const throws = 40_000;
    const seen = new Array<number>(d.probabilities.length).fill(0);
    let total = 0;
    for (let i = 0; i < throws; i++) {
      const r = roll(spec, source, i);
      total += r.total;
      expect(r.total >= d.min && r.total <= d.max).toBe(true);
      seen[r.total - d.min] = (seen[r.total - d.min] as number) + 1;
    }
    const mean = expectedTotal(spec);
    const spread = Math.sqrt(d.probabilities.reduce((s, p, i) => s + p * (d.min + i - mean) ** 2, 0));
    expect(Math.abs(total / throws - mean)).toBeLessThan((4 * spread) / Math.sqrt(throws));
    d.probabilities.forEach((p, i) => {
      const noise = 5 * Math.sqrt((p * (1 - p)) / throws) + 2 / throws;
      expect(Math.abs((seen[i] as number) / throws - p), `${text} = ${d.min + i}`).toBeLessThan(noise);
    });
  });
});

describe("a seed replays every die", () => {
  it.each(["3d6!", "4d6r<3kh3", "5d4!r<2+1", "4dF", "2d1000", "5d2!"])("%s throws the same dice from the same seed", (text) => {
    const spec = dice(text);
    const a = seededSource("replay");
    const b = seededSource("replay");
    for (let i = 0; i < 50; i++) {
      const first = roll(spec, a, i);
      const again = roll(spec, b, i);
      expect(again.faces).toEqual(first.faces);
      expect(again.dice).toEqual(first.dice);
      expect(again.total).toBe(first.total);
      // The faces alone say what happened to each die: a kept or shared roll needs nothing else.
      expect(readDice(spec, first.faces)).toEqual(first.dice);
      expect(diceOf({ ...first, dice: undefined })).toEqual(first.dice);
      expect(readShared(shareQuery(first))).toMatchObject({ faces: first.faces, kept: first.kept, total: first.total, seed: "replay", dice: first.dice });
      expect(parseHistory(serializeHistory([first]))).toEqual([first]);
    }
  });

  it("is pinned: these seeds throw these dice for good", () => {
    const thrown = (text: string) => {
      const r = roll(dice(text), seededSource("boom"), 1);
      return [r.faces, r.total];
    };
    expect(thrown("5d4!")).toEqual([[4, 4, 2, 4, 4, 1, 1, 2, 4, 4, 3], 33]);
    expect(thrown("4d6r<3kh3")).toEqual([[2, 6, 6, 4, 6], 18]);
    expect(thrown("4dF")).toEqual([[0, 1, 1, -1], 1]);
    expect(thrown("3d14")).toEqual([[6, 10, 10], 26]);
  });

  it("refuses faces the dice could not have thrown", () => {
    const spec = dice("2d6!r<2");
    expect(readDice(spec, [3, 4])).not.toBeNull();
    expect(readDice(spec, [3])).toBeNull();
    expect(readDice(spec, [3, 4, 5])).toBeNull();
    expect(readDice(spec, [6, 4])).toBeNull();
    expect(readDice(spec, [1, 4])).toBeNull();
    expect(readDice(spec, [3, 7])).toBeNull();
    expect(readDice(spec, [3, "4"])).toBeNull();
    expect(readShared("roll=2d6!r<2&faces=6,4")).toBeNull();
    expect(readShared("roll=2d6!r<2&faces=6,4,")).toBeNull();
    expect(readShared(`roll=${encodeURIComponent("2d6!r<2")}&faces=6,4,2`)).toMatchObject({ total: 12 });
    expect(parseHistory(JSON.stringify([{ spec, faces: [6, 4], at: 1 }]))).toEqual([]);
  });
});

describe("notation", () => {
  it.each([
    ["d7", "1d7"],
    ["4d6dl1", "4d6kh3"],
    ["4d6 kh3 r<2", "4d6r<2kh3"],
    ["4D6R<=1KH3", "4d6r<2kh3"],
    ["3d6!r<2+1", "3d6!r<2+1"],
    ["3d6 r < 2 ! - 1", "3d6!r<2-1"],
    ["5d10dh2", "5d10kl3"],
    ["4df", "4dF"],
    ["3dFr<=0", "3dFr<1"],
    ["d%!", "1d100!"],
    ["2d1000+99", "2d1000+99"],
  ])("reads %s and writes it back as %s", (text, canonical) => {
    const spec = dice(text);
    expect(formatNotation(spec)).toBe(canonical);
    expect(parseNotation(canonical)).toEqual(spec);
    expect(normalizeSpec(spec)).toEqual(spec);
  });

  it.each([
    ["999999d999999!", "count", "999999"],
    ["11d6", "count", "11"],
    ["0d6", "count", "0"],
    ["2d1", "sides", "d1"],
    ["2d0", "sides", "d0"],
    ["2d1001", "sides", "d1001"],
    ["2d6+100", "bonus", "+100"],
    ["4d6kh4", "keep", "kh4"],
    ["4d6kh0", "keep", "kh0"],
    ["4d6dl4", "keep", "dl4"],
    ["2d6dl2", "keep", "dl2"],
    ["1d20kh1", "keep", "kh1"],
    ["4d6kh3dl1", "twice", "dl1"],
    ["3d6!!", "twice", "!"],
    ["3d6r<2r<3", "twice", "r<3"],
    ["4d6!kh3", "explode", "!"],
    ["4d6kh3!", "explode", "!"],
    ["4dF!", "explode", "!"],
    ["2d101!", "explode", "!"],
    ["2d6r<1", "reroll", "r<1"],
    ["2d6r<7", "reroll", "r<7"],
    ["2d6r<=6", "reroll", "r<=6"],
    ["4dFr<=1", "reroll", "r<=1"],
    ["2d6r2", "shape", "r2"],
    ["2d6x", "shape", "x"],
    ["3d6+", "shape", "+"],
    ["2d6+1+1", "shape", "+1+1"],
    ["1 2d6", "shape", "1 2d6"],
    ["hello", "shape", "hello"],
    ["", "shape", ""],
  ] as const)("refuses %s, and says it is the %s: %s", (text, problem, part) => {
    const read = checkNotation(text);
    expect(read).toMatchObject({ ok: false, problem, part });
    if (!read.ok && part !== "") expect(read.message).toContain(part);
    expect(parseNotation(text)).toBeNull();
  });

  it("reads nothing long enough to be a nuisance", () => {
    expect(checkNotation(`${"9".repeat(5000)}d6`)).toMatchObject({ ok: false, problem: "shape" });
    expect(checkNotation(`2d6${"!".repeat(5000)}`)).toMatchObject({ ok: false, problem: "shape" });
  });

  it("a spec of every shape comes back from its own notation", () => {
    for (const sides of [2, 6, 13, 100, 1000, "F"] as const) {
      for (let count = 1; count <= MAX_DICE; count++) {
        const low = faceRange(sides).low;
        const shapes: Partial<RollSpec>[] = [{}, { reroll: low }, { keep: "highest", keepCount: count - 1 }, { keep: "lowest", keepCount: 1, reroll: low }, { explode: true }, { explode: true, reroll: low, modifier: -MAX_MODIFIER }];
        for (const shape of shapes) {
          const spec = normalizeSpec({ count, sides, ...shape });
          expect(parseNotation(formatNotation(spec)), formatNotation(spec)).toEqual(spec);
        }
      }
    }
  });
});

describe("normalizeSpec", () => {
  it("leaves out what cannot be kept, and never guesses", () => {
    expect(normalizeSpec({ count: 4, sides: 6, keep: "highest", keepCount: 9 })).toEqual({ count: 4, sides: 6, modifier: 0, keep: "highest", keepCount: 3 });
    expect(normalizeSpec({ count: 4, sides: 6, keep: "highest", explode: true })).toEqual({ count: 4, sides: 6, modifier: 0, keep: "highest" });
    expect(normalizeSpec({ count: 2, sides: "F", explode: true })).toEqual({ count: 2, sides: "F", modifier: 0, keep: "all" });
    expect(normalizeSpec({ count: 2, sides: MAX_EXPLODING_SIDES + 1, explode: true })).not.toHaveProperty("explode");
    expect(normalizeSpec({ count: 2, sides: 6, reroll: 6 })).not.toHaveProperty("reroll");
    expect(normalizeSpec({ count: 2, sides: 6, reroll: 0 })).not.toHaveProperty("reroll");
    expect(normalizeSpec({ count: 1, sides: 6, keepCount: 3 })).toEqual({ count: 1, sides: 6, modifier: 0, keep: "all" });
    expect(normalizeSpec({ sides: "G" as never })).toMatchObject({ sides: 6 });
  });
});

describe("limits", () => {
  it("the largest rolls are still counted quickly", () => {
    const started = performance.now();
    for (const text of ["5d1000", "5d1000kh4", "5d1000r<500kl4", "5d100!", "5d100!r<50", "5d2!"]) {
      const d = distributionOf(dice(text));
      expect(sum(d.probabilities), text).toBeCloseTo(1, 9);
      expect(d.probabilities).toHaveLength(d.max - d.min + 1);
      expect(d.probabilities.every((p) => p >= 0 && Number.isFinite(p))).toBe(true);
    }
    expect(performance.now() - started).toBeLessThan(5000);
  });

  it("the tray's words name the same limits the code keeps", () => {
    for (const words of [STRINGS.en, STRINGS.ja]) {
      expect(words.notationCount).toContain(String(MAX_DICE));
      expect(words.notationSides).toContain(String(MAX_SIDES));
      expect(words.notationBonus).toContain(String(MAX_MODIFIER));
      expect(words.notationExplode).toContain(String(MAX_EXPLODING_SIDES));
      for (const key of ["notationCount", "notationSides", "notationBonus", "notationTwice", "notationKeep", "notationReroll", "notationExplode"] as const) {
        expect(words[key]).toContain("{part}");
      }
    }
    expect(Object.keys(STRINGS.ja).sort()).toEqual(Object.keys(STRINGS.en).sort());
  });
});

describe("stats", () => {
  it("count every die thrown towards fairness, and no match in a roll that threw extra dice", () => {
    const made: Roll[] = [roll(dice("2d6!"), scripted([6, 6, 6, 6, 1, 6, 2]), 1), roll(dice("2d6r<2"), scripted([1, 3, 3]), 2), roll(dice("2d6"), scripted([3, 3]), 3)];
    const stats = statsOf(made, dice("2d6!"));
    expect(stats.diceThrown).toBe(12);
    expect(stats.matches).toBe(1);
    expect(stats.faces?.counts).toEqual([2, 1, 4, 0, 0, 5]);
    expect(stats.totals?.rolls).toBe(1);
    expect(stats.totals?.highest).toBe(33);
  });
});

describe("ten dice", () => {
  /** How many ways n dice of s sides total t, by inclusion and exclusion: nothing shared with the moving sum in odds.ts. */
  function ways(n: number, s: number, t: number): bigint {
    const choose = (a: bigint, b: bigint): bigint => {
      if (b < 0n || b > a) return 0n;
      let out = 1n;
      for (let i = 1n; i <= b; i++) out = (out * (a - b + i)) / i;
      return out;
    };
    let total = 0n;
    for (let k = 0; k <= n; k++) {
      const term = choose(BigInt(n), BigInt(k)) * choose(BigInt(t - s * k - 1), BigInt(n - 1));
      total += k % 2 === 0 ? term : -term;
    }
    return total;
  }

  it("are read, thrown and written back", () => {
    const spec = dice("10d6");
    expect(spec).toEqual({ count: 10, sides: 6, modifier: 0, keep: "all" });
    expect(formatNotation(spec)).toBe("10d6");
    const r = roll(spec, seededSource("ten"), 1);
    expect(r.faces).toHaveLength(10);
    expect(r.total).toBe(sum(r.faces));
    expect(dice("8d6").count).toBe(8);
    expect(dice("10d10kh9")).toMatchObject({ count: 10, keep: "highest", keepCount: 9 });
    expect(checkNotation("11d6")).toMatchObject({ ok: false, problem: "count", part: "11" });
    expect(MAX_DICE).toBe(10);
  });

  it("are counted exactly, in whole numbers past what a number can hold", () => {
    const counted = exactCounts(dice("10d1000"));
    expect(counted?.outcomes).toBe(10n ** 30n);
    expect(counted?.min).toBe(10);
    expect(counted?.counts).toHaveLength(9991);
    expect(counted?.counts.reduce((a, b) => a + b, 0n)).toBe(10n ** 30n);
    for (const total of [10, 11, 12, 999, 2500, 5005, 5006, 7777, 9999, 10000]) {
      expect(counted?.counts[total - 10], `10d1000 = ${total}`).toBe(ways(10, 1000, total));
    }
    // 5004 and 5006 mirror each other about the middle, and both are past 2^53 many times over.
    expect(counted?.counts[5004 - 10]).toBe(counted?.counts[5006 - 10]);
    expect((counted?.counts[5005 - 10] as bigint) > 2n ** 80n).toBe(true);
    const d = distributionOf(dice("10d1000"));
    expect(d.probabilities[0]).toBe(1e-30);
    expect(d.probabilities[1]).toBe(1e-29);
    expect(chanceExactly(dice("10d1000"), 5005)).toBeCloseTo(Number(ways(10, 1000, 5005)) / 1e30, 18);
    expect(sum(d.probabilities)).toBeCloseTo(1, 12);
    expect(expectedTotal(dice("10d1000"))).toBeCloseTo(5005, 9);
  });

  it("count every size of die and pool the same way the formula does", () => {
    for (const [n, s] of [[10, 6], [7, 20], [10, 100], [9, 3], [6, 30]] as const) {
      const counted = exactCounts(dice(`${n}d${s}`));
      expect(counted?.outcomes).toBe(BigInt(s) ** BigInt(n));
      counted?.counts.forEach((c, i) => expect(c, `${n}d${s} = ${n + i}`).toBe(ways(n, s, n + i)));
    }
  });

  it("count one die kept exactly too, and say so when a roll has no counts to give", () => {
    const adv = exactCounts(dice("10d1000kh1"));
    expect(adv?.counts.at(-1)).toBe(1000n ** 10n - 999n ** 10n);
    expect(adv?.counts[0]).toBe(1n);
    expect(adv?.counts.reduce((a, b) => a + b, 0n)).toBe(10n ** 30n);
    expect(exactCounts(dice("2d20kl1+5"))).toEqual({ min: 6, counts: Array.from({ length: 20 }, (_, i) => BigInt(39 - 2 * i)), outcomes: 400n });
    expect(exactCounts(dice("4dF"))?.counts).toEqual([1n, 4n, 10n, 16n, 19n, 16n, 10n, 4n, 1n]);
    expect(exactCounts(dice("4d6kh3"))).toBeNull();
    expect(exactCounts(dice("3d6!"))).toBeNull();
    expect(exactCounts(dice("3d6r<2"))).toBeNull();
  });

  it("keep and drop match a count of every throw", () => {
    for (const [count, sides] of [[10, 2], [8, 3], [6, 4]] as const) {
      const faces = Array.from({ length: sides }, (_, i) => i + 1);
      for (const keep of [1, 2, Math.floor(count / 2), count - 1]) {
        for (const which of ["highest", "lowest"] as const) {
          const spec = normalizeSpec({ count, sides, keep: which, keepCount: keep });
          const want = counted(count, faces, () => 1 / sides, (standing) => sum([...standing].sort((a, b) => (which === "highest" ? b - a : a - b)).slice(0, keep)));
          expectSame(spec, want);
        }
      }
    }
  });

  it("dropping the lowest of ten is the total less the lowest", () => {
    // E[sum] − E[min], each by its own exact route.
    const low = dice("10d1000kl1");
    expect(expectedTotal(dice("10d1000dl1"))).toBeCloseTo(5005 - expectedTotal(low), 6);
    expect(expectedTotal(dice("10d20kh7"))).toBeCloseTo(105 - expectedTotal(dice("10d20kl3")), 9);
  });

  it.each(["10d6", "10d6kh3", "8d6!", "10d10r<3kl4", "10dF", "10d2!r<2"])("the dice and the odds agree on %s", (text) => {
    const spec = dice(text);
    const d = distributionOf(spec);
    const source = seededSource(`ten ${text}`);
    const throws = 30_000;
    let total = 0;
    for (let i = 0; i < throws; i++) total += roll(spec, source, i).total;
    const mean = expectedTotal(spec);
    const spread = Math.sqrt(d.probabilities.reduce((s, p, i) => s + p * (d.min + i - mean) ** 2, 0));
    expect(Math.abs(total / throws - mean)).toBeLessThan((4 * spread) / Math.sqrt(throws));
  });

  it("the largest rolls are still counted quickly", () => {
    const started = performance.now();
    for (const text of ["10d1000", "10d1000kh1", "10d1000kh9", "10d1000kh5", "10d1000r<500kl5", "10d1000r<500", "10d100!", "10d100!r<50", "10d2!"]) {
      const d = distributionOf(dice(text));
      expect(sum(d.probabilities), text).toBeCloseTo(1, 9);
      expect(d.probabilities).toHaveLength(d.max - d.min + 1);
      expect(luckOf(dice(text), d.min)).toBeGreaterThanOrEqual(0);
      expect(mostLikely(dice(text)).length).toBeGreaterThan(0);
    }
    expect(performance.now() - started).toBeLessThan(5000);
  });

  it("luck still reads a half at the middle and the ends at the ends", () => {
    expect(luckOf(dice("2d6"), 7)).toBeCloseTo(0.5, 12);
    expect(luckOf(dice("2d6"), 2)).toBeCloseTo(1 / 72, 12);
    expect(luckOf(dice("2d6"), 1)).toBe(0);
    expect(luckOf(dice("2d6"), 13)).toBe(1);
    expect(luckOf(dice("10d6"), 35)).toBeCloseTo(0.5, 12);
  });
});
