import { describe, expect, it } from "vitest";
import { dice, expectSame, paired, sum } from "./custom.fixture.ts";
import {
  chancesOf,
  customFaces,
  dieName,
  groupsOf,
  hasTotal,
  isFair,
  isLoaded,
  loadedWeights,
  MAX_FACES,
  MAX_LABEL,
  MAX_LOADED_SIDES,
  MAX_WEIGHT,
  normalizeSpec,
  rangeOf,
  readDice,
  roll,
  rollHeld,
} from "./dice.ts";
import { parseHistory, serializeHistory } from "./history.ts";
import { faceChances, LOADED_PRESETS, loadingOf } from "./loaded.ts";
import { checkNotation, formatNotation, parseNotation } from "./notation.ts";
import {
  chanceAtLeast,
  chanceExactly,
  distributionHolding,
  distributionOf,
  exactCounts,
  expectedTotal,
  spreadOf,
} from "./odds.ts";
import { seededSource } from "./random.ts";
import { readShared, shareQuery } from "./share.ts";
import { fairnessTest } from "./stats.ts";

describe("custom dice", () => {
  it("are their faces: words, words worth a number, and numbers", () => {
    const yes = dice("d[Yes,No,Maybe]");
    expect(yes).toEqual({
      count: 1,
      sides: 3,
      modifier: 0,
      keep: "all",
      faces: [{ label: "Yes" }, { label: "No" }, { label: "Maybe" }],
    });
    expect(hasTotal(yes)).toBe(false);
    expect(dieName(yes)).toBe("d[Yes,No,Maybe]");
    const hits = dice("2d[Hit=1,Miss=0,Miss=0]");
    expect(groupsOf(hits)[0]?.faces).toEqual([
      { label: "Hit", value: 1 },
      { label: "Miss", value: 0 },
      { label: "Miss", value: 0 },
    ]);
    expect(hasTotal(hits)).toBe(true);
    expect(rangeOf(hits)).toEqual({ min: 0, max: 2 });
    expect(groupsOf(dice("d[1,1,2,3,5,8]"))[0]?.faces?.map((f) => f.value)).toEqual([1, 1, 2, 3, 5, 8]);
    expect(groupsOf(dice("d[Yes#2A7,No#bb3333]"))[0]?.faces).toEqual([
      { label: "Yes", colour: "#2a7" },
      { label: "No", colour: "#bb3333" },
    ]);
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
    expectSame(
      hits,
      paired(
        [
          [1, 1 / 3],
          [0, 2 / 3],
        ],
        [
          [1, 1 / 3],
          [0, 2 / 3],
        ],
      ),
    );
    expect(chanceAtLeast(hits, 1)).toBeCloseTo(5 / 9, 14);
    expect(exactCounts(hits)).toEqual({ min: 0, counts: [4n, 4n, 1n], outcomes: 9n });
    expectSame(
      dice("d[0,0,10]+1d6"),
      paired(
        [
          [0, 2 / 3],
          [10, 1 / 3],
        ],
        [1, 2, 3, 4, 5, 6].map((f) => [f, 1 / 6] as [number, number]),
      ),
    );
    expect(expectedTotal(dice("d[1,1,2,3,5,8]"))).toBeCloseTo(20 / 6, 12);
    expect(faceChances(groupsOf(dice("d[Yes,No,No]"))[0]!).map((f) => [f.label, f.chance])).toEqual([
      ["Yes", 1 / 3],
      ["No", 1 / 3],
      ["No", 1 / 3],
    ]);
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
    for (const [a, pa] of d20)
      for (const [b, pb] of d20) high.set(Math.max(a, b), (high.get(Math.max(a, b)) ?? 0) + pa * pb);
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
    for (const text of [
      "3d6{6:3}!",
      "2d6{1:2,6:2}ro<2",
      "2d6{1:3}r<2",
      "4d6{6:2}kh3",
      "1d6{6:3}+1d20",
      "2d4{1:0}!+d[0,0,5]",
    ]) {
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
      expect(Math.abs(total / throws - expectedTotal(spec)), text).toBeLessThan(
        (4 * spreadOf(spec)) / Math.sqrt(throws),
      );
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
