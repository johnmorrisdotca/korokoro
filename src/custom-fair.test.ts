import { describe, expect, it } from "vitest";
import { dice } from "./custom.fixture.ts";
import { groupsOf, isLoaded, roll } from "./dice.ts";
import { seededSource } from "./random.ts";
import {
  loadSets,
  MAX_SET_NAME,
  MAX_SETS,
  makeSet,
  parseSets,
  readSet,
  serializeSets,
  setQuery,
  storeSets,
  withoutSet,
  withSet,
} from "./sets.ts";
import { chiSquareTail, faceStats, fairnessTest, readResults, statsOf } from "./stats.ts";

describe("is this die fair?", () => {
  it("the chi-square tail is the table's, to the digits the table gives", () => {
    // Critical values from the standard table: (statistic, degrees of freedom) → upper tail.
    expect(chiSquareTail(3.841, 1)).toBeCloseTo(0.05, 4);
    expect(chiSquareTail(6.635, 1)).toBeCloseTo(0.01, 4);
    expect(chiSquareTail(11.07, 5)).toBeCloseTo(0.05, 4);
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
    expect(few).toMatchObject({
      sides: 6,
      rolls: 5,
      minimum: 30,
      enough: false,
      p: null,
      statistic: null,
      verdict: "too-few",
    });
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
    for (let i = 0; i < 100; i++)
      history.push(
        roll(dice("1d6"), source, i),
        roll(dice("1d6{6:3}"), source, i),
        roll(dice("1d[a,b,c,d,e,f]"), source, i),
      );
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
    expect(makeSet("Skirmish", dice("2d[Hit=1,Miss=0,Miss=0]"))).toEqual({
      name: "Skirmish",
      notation: "2d[Hit=1,Miss=0,Miss=0]",
    });
    expect(makeSet("Ability", "4d6dl1")?.notation).toBe("4d6kh3");
    expect(makeSet("", "2d6")).toBeNull();
    expect(makeSet("x".repeat(MAX_SET_NAME + 1), "2d6")).toBeNull();
    expect(makeSet("Bad", "banana")).toBeNull();
  });

  it("are added newest first, replaced by name, removed, and capped", () => {
    let sets = withSet([], makeSet("A", "1d6")!);
    sets = withSet(sets, makeSet("B", "1d8")!);
    sets = withSet(sets, makeSet("A", "2d6")!);
    expect(sets).toEqual([
      { name: "A", notation: "2d6" },
      { name: "B", notation: "1d8" },
    ]);
    expect(withoutSet(sets, "A")).toEqual([{ name: "B", notation: "1d8" }]);
    let many: ReturnType<typeof withSet> = [];
    for (let i = 0; i < MAX_SETS + 5; i++) many = withSet(many, makeSet(`Set ${i}`, "1d6")!);
    expect(many).toHaveLength(MAX_SETS);
    expect(many[0]?.name).toBe(`Set ${MAX_SETS + 4}`);
  });

  it("are kept on the device and read back defensively", () => {
    const kept = new Map<string, string>();
    const storage = {
      getItem: (k: string) => kept.get(k) ?? null,
      setItem: (k: string, v: string) => void kept.set(k, v),
      removeItem: (k: string) => void kept.delete(k),
    };
    const sets = [makeSet("Fireball", "8d6")!, makeSet("The Optimist", "1d6{6:3}")!];
    expect(storeSets(storage, "k", sets)).toBe(true);
    expect(loadSets(storage, "k")).toEqual(sets);
    expect(storeSets(storage, "k", [])).toBe(true);
    expect(kept.has("k")).toBe(false);
    expect(parseSets(serializeSets(sets))).toEqual(sets);
    expect(
      parseSets(
        '{"sets":[{"name":"ok","notation":"2d6"},{"name":"bad","notation":"nope"},{"name":"ok","notation":"3d6"},null,7]}',
      ),
    ).toEqual([{ name: "ok", notation: "2d6" }]);
    expect(parseSets("not json")).toEqual([]);
    expect(parseSets(null)).toEqual([]);
    const broken = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => undefined,
    };
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
    expect(readSet(setQuery(makeSet("Yes or no", "d[Yes,No,Maybe]")!))).toEqual({
      name: "Yes or no",
      notation: "1d[Yes,No,Maybe]",
    });
    expect(readSet("dice=2d6")).toEqual({ name: "2d6", notation: "2d6" });
    expect(readSet("dice=banana&name=x")).toBeNull();
    expect(readSet("name=x")).toBeNull();
    expect(readSet("?roll=2d6&faces=1,2")).toBeNull();
  });
});
