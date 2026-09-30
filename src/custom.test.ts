import { describe, expect, it } from "vitest";

import { MAX_FACES, MAX_LABEL, MAX_LOADED_SIDES, MAX_WEIGHT, chancesOf, customFaces, dieName, groupsOf, hasTotal, isFair, isLoaded, loadedWeights, normalizeSpec, rangeOf, readDice, roll, rollHeld, type RollSpec } from "./dice.ts";
import { parseHistory, serializeHistory } from "./history.ts";
import { LOADED_PRESETS, faceChances, loadingOf } from "./loaded.ts";
import { checkNotation, formatNotation, parseNotation } from "./notation.ts";
import { chanceAtLeast, chanceExactly, distributionHolding, distributionOf, exactCounts, expectedTotal, spreadOf } from "./odds.ts";
import { seededSource } from "./random.ts";
import { MAX_SETS, MAX_SET_NAME, loadSets, makeSet, parseSets, readSet, serializeSets, setQuery, storeSets, withSet, withoutSet } from "./sets.ts";
import { readShared, shareQuery } from "./share.ts";
import { chiSquareTail, faceStats, fairnessTest, readResults, statsOf } from "./stats.ts";

const dice = (text: string): RollSpec => {
  const spec = parseNotation(text);
  if (spec === null) throw new Error(`${text} should be dice`);
  return spec;
};
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/** Every total some independent dice make, each die a list of [worth, chance]. */
function paired(...kinds: [number, number][][]): Map<number, number> {
  let totals = new Map<number, number>([[0, 1]]);
  for (const kind of kinds) {
    const next = new Map<number, number>();
    for (const [t, p] of totals) for (const [worth, chance] of kind) next.set(t + worth, (next.get(t + worth) ?? 0) + p * chance);
    totals = next;
  }
  return totals;
}

function expectSame(spec: RollSpec, want: Map<number, number>) {
  const d = distributionOf(spec);
  expect(sum(d.probabilities)).toBeCloseTo(1, 12);
  expect(d.probabilities).toHaveLength(d.max - d.min + 1);
  for (const [total, chance] of want) if (chance > 0) expect(chanceExactly(spec, total), `${formatNotation(spec)} = ${total}`).toBeCloseTo(chance, 12);
  d.probabilities.forEach((p, i) => {
    if (!want.has(d.min + i)) expect(p).toBeCloseTo(0, 15);
  });
  // The ends of a distribution are totals that can happen.
  expect(d.probabilities[0]).toBeGreaterThan(0);
  expect(d.probabilities.at(-1)).toBeGreaterThan(0);
}

describe("custom dice", () => {
  it("are their faces: words, words worth a number, and numbers", () => {
    const yes = dice("d[Yes,No,Maybe]");
    expect(yes).toEqual({ count: 1, sides: 3, modifier: 0, keep: "all", faces: [{ label: "Yes" }, { label: "No" }, { label: "Maybe" }] });
    expect(hasTotal(yes)).toBe(false);
    expect(dieName(yes)).toBe("d[Yes,No,Maybe]");
    const hits = dice("2d[Hit=1,Miss=0,Miss=0]");
    expect(groupsOf(hits)[0]?.faces).toEqual([{ label: "Hit", value: 1 }, { label: "Miss", value: 0 }, { label: "Miss", value: 0 }]);
    expect(hasTotal(hits)).toBe(true);
    expect(rangeOf(hits)).toEqual({ min: 0, max: 2 });
    expect(groupsOf(dice("d[1,1,2,3,5,8]"))[0]?.faces?.map((f) => f.value)).toEqual([1, 1, 2, 3, 5, 8]);
    expect(groupsOf(dice("d[Yes#2A7,No#bb3333]"))[0]?.faces).toEqual([{ label: "Yes", colour: "#2a7" }, { label: "No", colour: "#bb3333" }]);
  });

  it("roll a face by its place, and say what it says and what it is worth", () => {
    const r = roll(dice("3d[Hit=1,Miss=0,Crit=2]+1"), seededSource("custom"), 1);
    expect(r.faces.every((f) => f >= 1 && f <= 3)).toBe(true);
    expect(r.dice?.map((d) => d.label)).toEqual(r.faces.map((f) => ["Hit", "Miss", "Crit"][f - 1]));
    expect(r.total).toBe(sum(r.dice!.map((d) => d.value as number)) + 1);
    expect(roll(dice("2d[Yes,No]"), seededSource("custom"), 1).total).toBe(0);
    const again = roll(dice("3d[Hit=1,Miss=0,Crit=2]+1"), seededSource("custom"), 1);
    expect(again.faces).toEqual(r.faces);
    expect(readDice(r.spec, r.faces)).toEqual(r.dice);
    expect(readDice(r.spec, [1, 2, 4])).toBeNull();
  });

  it.each([
    ["d[Yes,No,Maybe]", "1d[Yes,No,Maybe]"],
    ["2D[ Hit = 1 , Miss=0 ]", "2d[Hit=1,Miss=0]"],
    ["d[1,2,3]", "1d[1,2,3]"],
    ["d[-1,0,1]", "1d[-1,0,1]"],
    ["d[One=1,2]", "1d[One=1,2]"],
    ["d[Yes#2a7,No]+1d6+2", "1d[Yes#2a7,No]+1d6+2"],
    ["d[L,R,C,dot,dot,dot]", "1d[L,R,C,dot,dot,dot]"],
    ["d[はい,いいえ]", "1d[はい,いいえ]"],
    ["d[a b,c d]", "1d[a b,c d]"],
  ])("reads %s and writes it back as %s", (text, canonical) => {
    const spec = dice(text);
    expect(formatNotation(spec)).toBe(canonical);
    expect(parseNotation(canonical)).toEqual(spec);
    expect(normalizeSpec(spec)).toEqual(spec);
    const r = roll(spec, seededSource("round"), 3);
    expect(readShared(shareQuery(r))).toMatchObject({ faces: r.faces, total: r.total, spec });
    expect(parseHistory(serializeHistory([r]))).toEqual([r]);
  });

  it.each([
    ["d[a]", "custom", "d[a]"],
    ["d[]", "custom", "d[]"],
    ["d[a,,b]", "custom", "d[a,,b]"],
    [`d[${"a,".repeat(MAX_FACES)}a]`, "custom", `d[${"a,".repeat(MAX_FACES)}a]`],
    [`d[${"x".repeat(MAX_LABEL + 1)},b]`, "custom", `d[${"x".repeat(MAX_LABEL + 1)},b]`],
    ["d[a=1.5,b]", "custom", "d[a=1.5,b]"],
    ["d[a=99999,b]", "custom", "d[a=99999,b]"],
    ["d[a#12,b]", "custom", "d[a#12,b]"],
    ["d[a=b,c]", "custom", "d[a=b,c]"],
    ["2d[Yes,No]kh1", "custom", "kh1"],
    ["2d[1,2]!", "custom", "!"],
    ["2d[1,2]r<2", "custom", "r<2"],
    ["d[a,b]{1:2}", "custom", "d[a,b]{1:2}"],
    ["d[a,b", "shape", "d[a,b"],
  ] as const)("refuses %s, and says it is the %s", (text, problem, part) => {
    expect(checkNotation(text)).toMatchObject({ ok: false, problem, part });
  });

  it("treats a face's words as text and nothing else", () => {
    // An equals sign is notation, so markup that needs one is refused outright.
    expect(checkNotation("d[<img src=x onerror=1>,</b>]")).toMatchObject({ ok: false, problem: "custom" });
    // The characters notation is written with cannot be in a face; anything else is only ever a label.
    expect(checkNotation("d[<b>bold</b>,</script>]")).toMatchObject({ ok: true });
    expect(groupsOf(dice("d[<b>bold</b>,</script>]"))[0]?.faces?.[0]?.label).toBe("<b>bold</b>");
    expect(customFaces([{ label: "a,b" }, { label: "c" }])).toBeUndefined();
    expect(customFaces([{ label: " a" }, { label: "c" }])).toBeUndefined();
    expect(customFaces([{ label: "a\u0000" }, { label: "c" }])).toBeUndefined();
    expect(customFaces([{ label: "a", colour: "red" }, { label: "c" }])).toBeUndefined();
    expect(customFaces([{ label: "a", colour: "javascript:alert(1)" }, { label: "c" }])).toBeUndefined();
  });

  it("has exact odds over what its faces are worth, a face written twice twice as likely", () => {
    const hits = dice("2d[Hit=1,Miss=0,Miss=0]");
    expectSame(hits, paired([[1, 1 / 3], [0, 2 / 3]], [[1, 1 / 3], [0, 2 / 3]]));
    expect(chanceAtLeast(hits, 1)).toBeCloseTo(5 / 9, 14);
    expect(exactCounts(hits)).toEqual({ min: 0, counts: [4n, 4n, 1n], outcomes: 9n });
    expectSame(dice("d[0,0,10]+1d6"), paired([[0, 2 / 3], [10, 1 / 3]], [1, 2, 3, 4, 5, 6].map((f) => [f, 1 / 6] as [number, number])));
    expect(expectedTotal(dice("d[1,1,2,3,5,8]"))).toBeCloseTo(20 / 6, 12);
    expect(faceChances(groupsOf(dice("d[Yes,No,No]"))[0]!).map((f) => [f.label, f.chance])).toEqual([["Yes", 1 / 3], ["No", 1 / 3], ["No", 1 / 3]]);
  });

  it("can be held like any plain die", () => {
    const first = roll(dice("3d[Hit=1,Miss=0,Crit=2]"), seededSource("h"), 1);
    const second = rollHeld(first, [true, false, false], seededSource("h2"), 2);
    expect(second.faces[0]).toBe(first.faces[0]);
    const odds = distributionHolding(first.spec, first.faces, [true, false, false]);
    expect(odds.min).toBe(first.dice![0]!.value);
    expect(sum(odds.probabilities)).toBeCloseTo(1, 14);
  });

  it("is not a fair die, and says so", () => {
    expect(isFair(dice("d[1,2,3,4,5,6]"))).toBe(false);
    expect(isLoaded(dice("d[1,2,3,4,5,6]"))).toBe(false);
    expect(isFair(dice("2d6+1d20"))).toBe(true);
    expect(isFair(dice("1d6+d[a,b]"))).toBe(false);
  });
});

describe("loaded dice", () => {
  it("weigh some faces more, and are written with their weights", () => {
    const spec = dice("d6{6:3}");
    expect(spec).toEqual({ count: 1, sides: 6, modifier: 0, keep: "all", weights: [1, 1, 1, 1, 1, 3] });
    expect(formatNotation(spec)).toBe("1d6{6:3}");
    expect(dieName(spec)).toBe("d6{6:3}");
    expect(chancesOf(spec)).toEqual([1 / 8, 1 / 8, 1 / 8, 1 / 8, 1 / 8, 3 / 8]);
    expect(loadingOf(spec)).toEqual({ face: 6, loaded: [3, 8], fair: [1, 6] });
    expect(loadingOf(dice("1d6"))).toBeNull();
    expect(dice("2d6{1:2, 6:2}")).toMatchObject({ weights: [2, 1, 1, 1, 1, 2] });
    expect(formatNotation(dice("2d6{6:2,1:2}kh1+1"))).toBe("2d6{1:2,6:2}kh1+1");
    // Weights are kept in lowest terms, so one die has one name.
    expect(dice("d6{1:2,2:2,3:2,4:2,5:2,6:6}")).toEqual(spec);
  });

  it.each([
    ["d6{7:2}", "weights"],
    ["d6{0:2}", "weights"],
    ["d6{6:100}", "weights"],
    ["d6{6:3,6:4}", "weights"],
    ["d6{6}", "weights"],
    ["d6{}", "weights"],
    ["d6{1:0,2:0,3:0,4:0,5:0}", "weights"],
    ["d6{1:2,2:2,3:2,4:2,5:2,6:2}", "weights"],
    ["d6{6:1}", "weights"],
    ["dF{1:2}", "weights"],
    [`d${MAX_LOADED_SIDES + 1}{1:2}`, "weights"],
  ])("refuses %s as %s: a die that is not loaded is never written as one", (text, problem) => {
    expect(checkNotation(text)).toMatchObject({ ok: false, problem });
    expect(loadedWeights(6, [2, 2, 2, 2, 2, 2])).toBeUndefined();
    expect(loadedWeights(6, [1, 1, 1, 1, 1, MAX_WEIGHT + 1])).toBeUndefined();
  });

  it("can never pass as fair: not in the spec, the roll, the notation, the history or the link", () => {
    const fair = roll(dice("2d6"), seededSource("honest"), 1);
    const loaded = roll(dice("2d6{6:3}"), seededSource("honest"), 1);
    expect(isFair(fair.spec)).toBe(true);
    expect(isFair(loaded.spec)).toBe(false);
    expect(isLoaded(loaded.spec)).toBe(true);
    expect(loaded.loaded).toBe(true);
    expect(fair).not.toHaveProperty("loaded");
    expect(formatNotation(loaded.spec)).not.toBe(formatNotation(fair.spec));
    // Give both the same faces: they still do not serialise alike.
    const same = { ...loaded, faces: fair.faces };
    expect(shareQuery(same)).not.toBe(shareQuery(fair));
    expect(shareQuery(loaded)).toContain(encodeURIComponent("{6:3}").replace(/%3A/g, "%3A"));
    expect(serializeHistory([same])).not.toBe(serializeHistory([fair]));
    // And they come back marked, even if somebody edits the mark out of what was stored.
    expect(readShared(shareQuery(loaded))).toMatchObject({ loaded: true, spec: { weights: [1, 1, 1, 1, 1, 3] } });
    const stripped = JSON.stringify({ rolls: [{ ...loaded, loaded: undefined, dice: undefined }] });
    expect(parseHistory(stripped)[0]).toMatchObject({ loaded: true });
    expect(parseHistory(serializeHistory([fair]))[0]).not.toHaveProperty("loaded");
    // Every loaded spec there is a preset for, and a few more, against every fair die.
    for (const text of [...LOADED_PRESETS.map((p) => p.notation), "1d20{20:2}", "3d4{1:0}", "2d6{6:3}kh1+2"]) {
      const spec = dice(text);
      expect(isFair(spec), text).toBe(false);
      expect(formatNotation(spec), text).toMatch(/\{/);
      expect(roll(spec, seededSource("x"), 1).loaded, text).toBe(true);
    }
  });

  it("draws from the same fair stream, so a seed replays it", () => {
    const spec = dice("5d6{6:3}");
    const a = seededSource("weighted");
    const b = seededSource("weighted");
    for (let i = 0; i < 30; i++) expect(roll(spec, b, i).faces).toEqual(roll(spec, a, i).faces);
    expect(roll(spec, seededSource("korokoro"), 1).faces).toEqual(roll(spec, seededSource("korokoro"), 1).faces);
    // A fair roll from the same seed is untouched by any of this.
    expect(roll(dice("2d6"), seededSource("korokoro"), 1).faces).toEqual([5, 2]);
  });

  it("comes up as often as it is weighted", () => {
    const spec = dice("1d6{6:3}");
    const source = seededSource("heavy");
    const counts = new Array<number>(6).fill(0);
    for (let i = 0; i < 40_000; i++) counts[roll(spec, source, i).total - 1]! += 1;
    expect(counts[5]! / 40_000).toBeCloseTo(3 / 8, 2);
    expect(counts[0]! / 40_000).toBeCloseTo(1 / 8, 2);
    // Tested as if it were fair, it is found out; tested as what it is, it fits.
    expect(fairnessTest(counts).verdict).toBe("lopsided");
    expect(fairnessTest(counts, chancesOf(spec)).verdict).toBe("fair");
  });

  it("has exact odds, its weights being whole numbers", () => {
    const six = ([1, 2, 3, 4, 5, 6] as const).map((f) => [f, f === 6 ? 3 / 8 : 1 / 8] as [number, number]);
    expectSame(dice("2d6{6:3}"), paired(six, six));
    expect(exactCounts(dice("2d6{6:3}"))).toMatchObject({ min: 2, outcomes: 64n });
    expect(exactCounts(dice("2d6{6:3}"))?.counts.at(-1)).toBe(9n);
    expect(chanceExactly(dice("2d6{6:3}"), 12)).toBe(9 / 64);
    expect(expectedTotal(dice("1d6{6:3}"))).toBeCloseTo((1 + 2 + 3 + 4 + 5 + 18) / 8, 12);
    // Advantage on a loaded d20.
    const d20 = Array.from({ length: 20 }, (_, i) => [i + 1, i === 19 ? 2 / 21 : 1 / 21] as [number, number]);
    const high = new Map<number, number>();
    for (const [a, pa] of d20) for (const [b, pb] of d20) high.set(Math.max(a, b), (high.get(Math.max(a, b)) ?? 0) + pa * pb);
    expectSame(dice("2d20{20:2}kh1"), high);
    expect(exactCounts(dice("2d20{20:2}kh1"))?.outcomes).toBe(441n);
  });

  it("the pair that never makes seven never makes seven", () => {
    const pair = dice("2d6{2:0,4:0,6:0}");
    const d = distributionOf(pair);
    expect(d.min).toBe(2);
    expect(d.max).toBe(10);
    expect(rangeOf(pair)).toEqual({ min: 2, max: 10 });
    expect(chanceExactly(pair, 7)).toBe(0);
    for (const odd of [3, 5, 7, 9]) expect(chanceExactly(pair, odd)).toBe(0);
    expect(chanceExactly(pair, 6)).toBeCloseTo(3 / 9, 14);
    const source = seededSource("odd");
    for (let i = 0; i < 2000; i++) {
      const r = roll(pair, source, i);
      expect(r.total).not.toBe(7);
      expect(r.faces.every((f) => f % 2 === 1)).toBe(true);
    }
    expect(readDice(pair, [2, 3])).toBeNull();
  });

  it("keeps its odds through rerolls, explosions and mixed pools", () => {
    for (const text of ["3d6{6:3}!", "2d6{1:2,6:2}ro<2", "2d6{1:3}r<2", "4d6{6:2}kh3", "1d6{6:3}+1d20", "2d4{1:0}!+d[0,0,5]"]) {
      const spec = dice(text);
      const d = distributionOf(spec);
      expect(sum(d.probabilities), text).toBeCloseTo(1, 12);
      const source = seededSource(`loaded ${text}`);
      const throws = 30_000;
      let total = 0;
      for (let i = 0; i < throws; i++) {
        const r = roll(spec, source, i);
        expect(r.total >= d.min && r.total <= d.max).toBe(true);
        total += r.total;
      }
      expect(Math.abs(total / throws - expectedTotal(spec)), text).toBeLessThan((4 * spreadOf(spec)) / Math.sqrt(throws));
    }
    // A reroll on a loaded die: the 1 is thrown again once, and a heavy 6 is what it most often becomes.
    const once = dice("1d6{6:3}ro<2");
    expect(chanceExactly(once, 1)).toBeCloseTo((1 / 8) * (1 / 8), 14);
    expect(chanceExactly(once, 6)).toBeCloseTo(3 / 8 + (1 / 8) * (3 / 8), 14);
  });

  it("has three presets, each a loaded die that says what it does", () => {
    expect(LOADED_PRESETS.map((p) => p.id)).toEqual(["optimist", "flat", "odd-couple"]);
    for (const preset of LOADED_PRESETS) {
      const spec = dice(preset.notation);
      expect(formatNotation(spec)).toBe(preset.notation);
      expect(isLoaded(spec)).toBe(true);
      expect(preset.name.length).toBeGreaterThan(3);
      expect(preset.says.length).toBeGreaterThan(30);
    }
    expect(chanceExactly(dice("1d6{6:3}"), 6)).toBe(3 / 8);
    expect(chanceExactly(dice("1d6{1:2,6:2}"), 1)).toBe(2 / 8);
    expect(chanceExactly(dice("1d6{1:2,6:2}"), 3)).toBe(1 / 8);
  });
});

describe("is this die fair?", () => {
  it("the chi-square tail is the table's, to the digits the table gives", () => {
    // Critical values from the standard table: (statistic, degrees of freedom) → upper tail.
    expect(chiSquareTail(3.841, 1)).toBeCloseTo(0.05, 4);
    expect(chiSquareTail(6.635, 1)).toBeCloseTo(0.01, 4);
    expect(chiSquareTail(11.070, 5)).toBeCloseTo(0.05, 4);
    expect(chiSquareTail(15.086, 5)).toBeCloseTo(0.01, 4);
    expect(chiSquareTail(20.515, 5)).toBeCloseTo(0.001, 5);
    expect(chiSquareTail(30.144, 19)).toBeCloseTo(0.05, 4);
    expect(chiSquareTail(42.557, 29)).toBeCloseTo(0.05, 4);
    expect(chiSquareTail(124.342, 100)).toBeCloseTo(0.05, 4);
    // Two degrees of freedom has a closed form: exp(−x/2).
    expect(chiSquareTail(5, 2)).toBeCloseTo(Math.exp(-2.5), 12);
    expect(chiSquareTail(0.5, 2)).toBeCloseTo(Math.exp(-0.25), 12);
    // Four degrees: exp(−x/2)(1 + x/2).
    expect(chiSquareTail(7, 4)).toBeCloseTo(Math.exp(-3.5) * 4.5, 12);
    expect(chiSquareTail(0, 5)).toBe(1);
    expect(chiSquareTail(1000, 5)).toBeLessThan(1e-100);
    expect(chiSquareTail(3, 0)).toBe(1);
  });

  it("says nothing on a handful of rolls, and says how many it wants", () => {
    const few = fairnessTest([1, 0, 2, 1, 0, 1]);
    expect(few).toMatchObject({ sides: 6, rolls: 5, minimum: 30, enough: false, p: null, statistic: null, verdict: "too-few" });
    expect(fairnessTest([5, 5, 5, 5, 5, 4]).verdict).toBe("too-few");
    expect(fairnessTest([5, 5, 5, 5, 5, 5]).verdict).toBe("fair");
    expect(fairnessTest(new Array<number>(20).fill(4)).minimum).toBe(100);
    expect(fairnessTest([]).verdict).toBe("too-few");
  });

  it("finds a fair die fair and a lopsided one lopsided, with the chance exact", () => {
    const even = fairnessTest([40, 40, 40, 40, 40, 40]);
    expect(even).toMatchObject({ rolls: 240, statistic: 0, p: 1, verdict: "fair" });
    // 600 throws, the classic example: statistic 11.07 sits on the 5% line for a d6.
    const counts = [100, 100, 100, 100, 100, 100];
    expect(fairnessTest(counts).p).toBe(1);
    const stray = fairnessTest([82, 95, 103, 98, 104, 118]);
    expect(stray.statistic).toBeCloseTo((18 ** 2 + 5 ** 2 + 3 ** 2 + 2 ** 2 + 4 ** 2 + 18 ** 2) / 100, 12);
    expect(stray.p).toBeCloseTo(chiSquareTail(7.02, 5), 12);
    expect(stray.verdict).toBe("fair");
    const loaded = fairnessTest([30, 30, 30, 30, 30, 90]);
    expect(loaded.verdict).toBe("lopsided");
    expect(loaded.p).toBeLessThan(1e-10);
    const odd = fairnessTest([58, 28, 41, 36, 47, 30]);
    expect(odd.verdict).toBe("unusual");
    expect(odd.p! >= 0.001 && odd.p! < 0.05).toBe(true);
  });

  it("reads results typed from a real die", () => {
    expect(readResults("3 5 6 6 1")).toEqual({ ok: true, sides: 6, counts: [1, 0, 1, 0, 1, 2], rolls: 5 });
    expect(readResults("3,5 ,6\n6;1", 6)).toEqual({ ok: true, sides: 6, counts: [1, 0, 1, 0, 1, 2], rolls: 5 });
    expect(readResults("1 2 3", 20)).toMatchObject({ sides: 20, rolls: 3 });
    expect(readResults("")).toEqual({ ok: true, sides: 2, counts: [0, 0], rolls: 0 });
    expect(readResults("3 five 6")).toEqual({ ok: false, part: "five" });
    expect(readResults("3 0 6")).toEqual({ ok: false, part: "0" });
    expect(readResults("3 7 6", 6)).toEqual({ ok: false, part: "7" });
    expect(readResults("3 -2")).toEqual({ ok: false, part: "-2" });
    const typed = readResults("6 6 6 6 6 6 6 6 6 6 1 2 3 4 5 6 6 6 6 6 6 6 6 6 6 6 6 6 6 6 1 2 3 4 5");
    expect(typed.ok && fairnessTest(typed.counts).verdict).toBe("lopsided");
  });

  it("counts a loaded die apart from the fair dice of its size, and finds it out", () => {
    const source = seededSource("stats");
    const history = [];
    for (let i = 0; i < 100; i++) history.push(roll(dice("1d6"), source, i), roll(dice("1d6{6:3}"), source, i), roll(dice("1d[a,b,c,d,e,f]"), source, i));
    const fair = faceStats(history, 6);
    expect(fair.dice).toBe(100);
    expect(fair).not.toHaveProperty("loaded");
    const loaded = faceStats(history, groupsOf(dice("1d6{6:3}"))[0]!);
    expect(loaded).toMatchObject({ dice: 100, loaded: true });
    expect(loaded.fairness).toBeLessThan(0.01);
    const custom = faceStats(history, groupsOf(dice("1d[a,b,c,d,e,f]"))[0]!);
    expect(custom.labels).toEqual(["a", "b", "c", "d", "e", "f"]);
    expect(custom.dice).toBe(100);
    expect(statsOf(history, dice("1d6{6:3}")).faces).toMatchObject({ loaded: true, dice: 100 });
    // A roll of words has no total, so it takes no part in luck.
    const words = [roll(dice("2d[Yes,No]"), source, 1)];
    expect(statsOf(words).luck).toBeNull();
    expect(statsOf(words).diceThrown).toBe(2);
  });
});

describe("sets of dice", () => {
  it("are a name and notation, checked", () => {
    expect(makeSet("  Long   sword ", "1d8+3")).toEqual({ name: "Long sword", notation: "1d8+3" });
    expect(makeSet("Skirmish", dice("2d[Hit=1,Miss=0,Miss=0]"))).toEqual({ name: "Skirmish", notation: "2d[Hit=1,Miss=0,Miss=0]" });
    expect(makeSet("Ability", "4d6dl1")?.notation).toBe("4d6kh3");
    expect(makeSet("", "2d6")).toBeNull();
    expect(makeSet("x".repeat(MAX_SET_NAME + 1), "2d6")).toBeNull();
    expect(makeSet("Bad", "banana")).toBeNull();
  });

  it("are added newest first, replaced by name, removed, and capped", () => {
    let sets = withSet([], makeSet("A", "1d6")!);
    sets = withSet(sets, makeSet("B", "1d8")!);
    sets = withSet(sets, makeSet("A", "2d6")!);
    expect(sets).toEqual([{ name: "A", notation: "2d6" }, { name: "B", notation: "1d8" }]);
    expect(withoutSet(sets, "A")).toEqual([{ name: "B", notation: "1d8" }]);
    let many: ReturnType<typeof withSet> = [];
    for (let i = 0; i < MAX_SETS + 5; i++) many = withSet(many, makeSet(`Set ${i}`, "1d6")!);
    expect(many).toHaveLength(MAX_SETS);
    expect(many[0]?.name).toBe(`Set ${MAX_SETS + 4}`);
  });

  it("are kept on the device and read back defensively", () => {
    const kept = new Map<string, string>();
    const storage = { getItem: (k: string) => kept.get(k) ?? null, setItem: (k: string, v: string) => void kept.set(k, v), removeItem: (k: string) => void kept.delete(k) };
    const sets = [makeSet("Fireball", "8d6")!, makeSet("The Optimist", "1d6{6:3}")!];
    expect(storeSets(storage, "k", sets)).toBe(true);
    expect(loadSets(storage, "k")).toEqual(sets);
    expect(storeSets(storage, "k", [])).toBe(true);
    expect(kept.has("k")).toBe(false);
    expect(parseSets(serializeSets(sets))).toEqual(sets);
    expect(parseSets('{"sets":[{"name":"ok","notation":"2d6"},{"name":"bad","notation":"nope"},{"name":"ok","notation":"3d6"},null,7]}')).toEqual([{ name: "ok", notation: "2d6" }]);
    expect(parseSets("not json")).toEqual([]);
    expect(parseSets(null)).toEqual([]);
    const broken = { getItem: () => { throw new Error("blocked"); }, setItem: () => { throw new Error("blocked"); }, removeItem: () => undefined };
    expect(loadSets(broken, "k")).toEqual([]);
    expect(storeSets(broken, "k", sets)).toBe(false);
    expect(storeSets(undefined, "k", sets)).toBe(false);
  });

  it("are shared by a link, and a loaded set arrives loaded", () => {
    const set = makeSet("The Optimist", "1d6{6:3}")!;
    const query = setQuery(set);
    expect(query).toBe("dice=1d6%7B6%3A3%7D&name=The+Optimist&v=2");
    expect(readSet(query)).toEqual(set);
    expect(isLoaded(dice(readSet(query)!.notation))).toBe(true);
    expect(readSet(setQuery(makeSet("Yes or no", "d[Yes,No,Maybe]")!))).toEqual({ name: "Yes or no", notation: "1d[Yes,No,Maybe]" });
    expect(readSet("dice=2d6")).toEqual({ name: "2d6", notation: "2d6" });
    expect(readSet("dice=banana&name=x")).toBeNull();
    expect(readSet("name=x")).toBeNull();
    expect(readSet("?roll=2d6&faces=1,2")).toBeNull();
  });
});
