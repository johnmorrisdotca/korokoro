import { describe, expect, it } from "vitest";
import { counted, dice, expectSame, scripted, sum } from "./advanced.fixture.ts";
import {
  diceOf,
  faceRange,
  MAX_DICE,
  MAX_EXPLODING_SIDES,
  MAX_MODIFIER,
  MAX_SIDES,
  normalizeSpec,
  type Roll,
  type RollSpec,
  readDice,
  roll,
} from "./dice.ts";
import { parseHistory, serializeHistory } from "./history.ts";
import { checkNotation, formatNotation, parseNotation } from "./notation.ts";
import { chanceExactly, distributionOf, exactCounts, expectedTotal, luckOf, mostLikely } from "./odds.ts";
import { seededSource } from "./random.ts";
import { readShared, shareQuery } from "./share.ts";
import { statsOf } from "./stats.ts";
import { STRINGS } from "./ui/strings.ts";

describe("the dice and the odds agree", () => {
  // The odds are worked out and the dice are thrown by different code: over many seeded throws they must tell one story.
  it.each(["3d6!ro<2", "4d6ro<3kh3", "5d10kl2", "4dFkh2", "2d8!+3", "3d14dl1-2", "5d4!", "2d20ro<=10kl1"])(
    "%s",
    (text) => {
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
    },
  );
});

describe("a seed replays every die", () => {
  it.each(["3d6!", "4d6ro<3kh3", "5d4!ro<2+1", "4dF", "2d1000", "5d2!"])(
    "%s throws the same dice from the same seed",
    (text) => {
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
        expect(readShared(shareQuery(first))).toMatchObject({
          faces: first.faces,
          kept: first.kept,
          total: first.total,
          seed: "replay",
          dice: first.dice,
        });
        expect(parseHistory(serializeHistory([first]))).toEqual([first]);
      }
    },
  );

  it("is pinned: these seeds throw these dice for good", () => {
    const thrown = (text: string) => {
      const r = roll(dice(text), seededSource("boom"), 1);
      return [r.faces, r.total];
    };
    expect(thrown("5d4!")).toEqual([[4, 4, 2, 4, 4, 1, 1, 2, 4, 4, 3], 33]);
    expect(thrown("4d6ro<3kh3")).toEqual([[2, 6, 6, 4, 6], 18]);
    expect(thrown("4dF")).toEqual([[0, 1, 1, -1], 1]);
    expect(thrown("3d14")).toEqual([[6, 10, 10], 26]);
  });

  it("refuses faces the dice could not have thrown", () => {
    const spec = dice("2d6!ro<2");
    expect(readDice(spec, [3, 4])).not.toBeNull();
    expect(readDice(spec, [3])).toBeNull();
    expect(readDice(spec, [3, 4, 5])).toBeNull();
    expect(readDice(spec, [6, 4])).toBeNull();
    expect(readDice(spec, [1, 4])).toBeNull();
    expect(readDice(spec, [3, 7])).toBeNull();
    expect(readDice(spec, [3, "4"])).toBeNull();
    expect(readShared("roll=2d6!ro<2&faces=6,4")).toBeNull();
    expect(readShared("roll=2d6!ro<2&faces=6,4,")).toBeNull();
    expect(readShared(`roll=${encodeURIComponent("2d6!ro<2")}&faces=6,4,2`)).toMatchObject({ total: 12 });
    expect(parseHistory(JSON.stringify([{ spec, faces: [6, 4], at: 1 }]))).toEqual([]);
  });
});

describe("notation", () => {
  it.each([
    ["d7", "1d7"],
    ["4d6dl1", "4d6kh3"],
    ["4d6 kh3 ro<2", "4d6ro<2kh3"],
    ["4D6RO<=1KH3", "4d6ro<2kh3"],
    ["3d6!ro<2+1", "3d6!ro<2+1"],
    ["3d6 ro < 2 ! - 1", "3d6!ro<2-1"],
    ["5d10dh2", "5d10kl3"],
    ["4df", "4dF"],
    ["3dFro<=0", "3dFro<1"],
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
    ["3d6!r<2!", "twice", "!"],
    ["3d6ro<2ro<3", "twice", "ro<3"],
    ["4d6!kh3", "explode", "!"],
    ["4d6kh3!", "explode", "!"],
    ["4dF!", "explode", "!"],
    ["2d101!", "explode", "!"],
    ["2d6ro<1", "reroll", "ro<1"],
    ["2d6ro<7", "reroll", "ro<7"],
    ["2d6ro<=6", "reroll", "ro<=6"],
    ["4dFro<=1", "reroll", "ro<=1"],
    ["2d6rx", "shape", "rx"],
    ["2d6x", "shape", "x"],
    ["3d6+", "shape", "+"],
    ["2d6+", "shape", "+"],
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
        const shapes: Partial<RollSpec>[] = [
          {},
          { reroll: low },
          { keep: "highest", keepCount: count - 1 },
          { keep: "lowest", keepCount: 1, reroll: low },
          { explode: true },
          { explode: true, reroll: low, modifier: -MAX_MODIFIER },
        ];
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
    expect(normalizeSpec({ count: 4, sides: 6, keep: "highest", keepCount: 9 })).toEqual({
      count: 4,
      sides: 6,
      modifier: 0,
      keep: "highest",
      keepCount: 3,
    });
    expect(normalizeSpec({ count: 4, sides: 6, keep: "highest", explode: true })).toEqual({
      count: 4,
      sides: 6,
      modifier: 0,
      keep: "highest",
    });
    expect(normalizeSpec({ count: 2, sides: "F", explode: true })).toEqual({
      count: 2,
      sides: "F",
      modifier: 0,
      keep: "all",
    });
    expect(normalizeSpec({ count: 2, sides: MAX_EXPLODING_SIDES + 1, explode: true })).not.toHaveProperty("explode");
    expect(normalizeSpec({ count: 2, sides: 6, reroll: 6 })).not.toHaveProperty("reroll");
    expect(normalizeSpec({ count: 2, sides: 6, reroll: 0 })).not.toHaveProperty("reroll");
    expect(normalizeSpec({ count: 1, sides: 6, keepCount: 3 })).toEqual({
      count: 1,
      sides: 6,
      modifier: 0,
      keep: "all",
    });
    expect(normalizeSpec({ sides: "G" as never })).toMatchObject({ sides: 6 });
  });
});

describe("limits", () => {
  it("the largest rolls are still counted quickly", () => {
    const started = performance.now();
    for (const text of ["5d1000", "5d1000kh4", "5d1000ro<500kl4", "5d100!", "5d100!ro<50", "5d2!"]) {
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
      for (const key of [
        "notationCount",
        "notationSides",
        "notationBonus",
        "notationTwice",
        "notationKeep",
        "notationReroll",
        "notationExplode",
      ] as const) {
        expect(words[key]).toContain("{part}");
      }
    }
    expect(Object.keys(STRINGS.ja).sort()).toEqual(Object.keys(STRINGS.en).sort());
  });
});

describe("stats", () => {
  it("count every die thrown towards fairness, and no match in a roll that threw extra dice", () => {
    const made: Roll[] = [
      roll(dice("2d6!"), scripted([6, 6, 6, 6, 1, 6, 2]), 1),
      roll(dice("2d6ro<2"), scripted([1, 3, 3]), 2),
      roll(dice("2d6"), scripted([3, 3]), 3),
    ];
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
    for (const [n, s] of [
      [10, 6],
      [7, 20],
      [10, 100],
      [9, 3],
      [6, 30],
    ] as const) {
      const counted = exactCounts(dice(`${n}d${s}`));
      expect(counted?.outcomes).toBe(BigInt(s) ** BigInt(n));
      counted?.counts.forEach((c, i) => {
        expect(c, `${n}d${s} = ${n + i}`).toBe(ways(n, s, n + i));
      });
    }
  });

  it("count one die kept exactly too, and say so when a roll has no counts to give", () => {
    const adv = exactCounts(dice("10d1000kh1"));
    expect(adv?.counts.at(-1)).toBe(1000n ** 10n - 999n ** 10n);
    expect(adv?.counts[0]).toBe(1n);
    expect(adv?.counts.reduce((a, b) => a + b, 0n)).toBe(10n ** 30n);
    expect(exactCounts(dice("2d20kl1+5"))).toEqual({
      min: 6,
      counts: Array.from({ length: 20 }, (_, i) => BigInt(39 - 2 * i)),
      outcomes: 400n,
    });
    expect(exactCounts(dice("4dF"))?.counts).toEqual([1n, 4n, 10n, 16n, 19n, 16n, 10n, 4n, 1n]);
    expect(exactCounts(dice("4d6kh3"))).toBeNull();
    expect(exactCounts(dice("3d6!"))).toBeNull();
    expect(exactCounts(dice("3d6ro<2"))).toBeNull();
  });

  it("keep and drop match a count of every throw", () => {
    for (const [count, sides] of [
      [10, 2],
      [8, 3],
      [6, 4],
    ] as const) {
      const faces = Array.from({ length: sides }, (_, i) => i + 1);
      for (const keep of [1, 2, Math.floor(count / 2), count - 1]) {
        for (const which of ["highest", "lowest"] as const) {
          const spec = normalizeSpec({ count, sides, keep: which, keepCount: keep });
          const want = counted(
            count,
            faces,
            () => 1 / sides,
            (standing) => sum([...standing].sort((a, b) => (which === "highest" ? b - a : a - b)).slice(0, keep)),
          );
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

  it.each(["10d6", "10d6kh3", "8d6!", "10d10ro<3kl4", "10dF", "10d2!ro<2"])(
    "the dice and the odds agree on %s",
    (text) => {
      const spec = dice(text);
      const d = distributionOf(spec);
      const source = seededSource(`ten ${text}`);
      const throws = 30_000;
      let total = 0;
      for (let i = 0; i < throws; i++) total += roll(spec, source, i).total;
      const mean = expectedTotal(spec);
      const spread = Math.sqrt(d.probabilities.reduce((s, p, i) => s + p * (d.min + i - mean) ** 2, 0));
      expect(Math.abs(total / throws - mean)).toBeLessThan((4 * spread) / Math.sqrt(throws));
    },
  );

  it("the largest rolls are still counted quickly", () => {
    const started = performance.now();
    for (const text of [
      "10d1000",
      "10d1000kh1",
      "10d1000kh9",
      "10d1000kh5",
      "10d1000ro<500kl5",
      "10d1000ro<500",
      "10d100!",
      "10d100!ro<50",
      "10d2!",
    ]) {
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
