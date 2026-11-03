import { describe, expect, it } from "vitest";
import { canHold, groupsOf, isLoaded, roll } from "../dice.ts";
import { formatNotation, parseNotation } from "../notation.ts";
import { seededSource } from "../random.ts";
import { game, odds, read } from "./games.fixture.ts";
import { findPresets, getPreset, PRESETS, presetOdds, presetSpec, readPreset, rollPreset } from "./presets.ts";
import { READERS } from "./readings.ts";
import { READING_WORDS } from "./words.ts";

describe("holding dice in a game", () => {
  it("is for the games that hold dice between rolls, and for no other", () => {
    expect(PRESETS.filter((p) => p.hold !== false).map((p) => p.id)).toEqual([
      "yahtzee",
      "farkle",
      "poker-dice",
      "ship-captain-crew",
    ]);
    // A game with a turn of several rolls holds dice between them.
    for (const preset of PRESETS) if (preset.rolls !== undefined) expect(preset.hold, preset.id).toBeUndefined();
  });
});

describe("every preset", () => {
  it("there are plenty, on every shelf, each with a name of its own", () => {
    expect(PRESETS.length).toBeGreaterThanOrEqual(40);
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length);
    for (const family of ["board", "dice", "traditional", "cards", "roleplaying", "handy"])
      expect(
        PRESETS.some((p) => p.family === family),
        family,
      ).toBe(true);
    for (const named of [
      "risk",
      "craps",
      "yahtzee",
      "pachisi",
      "parcheesi",
      "ludo",
      "monopoly",
      "catan",
      "backgammon",
      "farkle",
      "bunco",
      "pig",
      "cho-han",
      "chinchirorin",
    ])
      expect(getPreset(named), named).toBeDefined();
  });

  it.each(PRESETS.map((p) => [p.id, p] as const))("%s parses, rolls, is read, and is described", (_id, preset) => {
    const spec = parseNotation(preset.notation);
    expect(spec, preset.notation).not.toBeNull();
    expect(formatNotation(spec!)).toBe(preset.notation);
    // A game's dice are fair: a loaded die is never part of a preset.
    expect(isLoaded(spec!)).toBe(false);
    expect(preset.reading in READERS).toBe(true);
    const thrown = rollPreset(preset.id, { source: seededSource(`preset ${preset.id}`), at: 1 });
    expect(thrown.rolls.length).toBe(spec!.times ?? 1);
    for (const language of ["en", "ja"] as const) {
      const reading = readPreset(preset, thrown.roll, [], language);
      expect(reading.text, `${preset.id} ${reading.outcome}`).not.toContain("{");
      // Every outcome has its words, in both languages; only a die that says it all itself is silent.
      expect(
        `${preset.reading}.${reading.outcome}` in READING_WORDS[language],
        `${preset.reading}.${reading.outcome}`,
      ).toBe(true);
      if (preset.reading !== "faces") expect(reading.text.length).toBeGreaterThan(0);
    }
    // Read a thousand rolls: no outcome is without words.
    const source = seededSource(`many ${preset.id}`);
    const before = [];
    for (let i = 0; i < 300; i++) {
      const r = roll(spec!, source, i);
      const reading = readPreset(preset, r, before);
      expect(`${preset.reading}.${reading.outcome}` in READING_WORDS.en, `${preset.reading}.${reading.outcome}`).toBe(
        true,
      );
      expect(`${preset.reading}.${reading.outcome}` in READING_WORDS.ja, `${preset.reading}.${reading.outcome}`).toBe(
        true,
      );
      expect(reading.text).not.toContain("{");
      before.push(r);
      if (before.length > 6) before.shift();
    }
    expect(preset.name.length).toBeGreaterThan(2);
    expect(preset.nameJa.length).toBeGreaterThan(1);
    expect(preset.says.length).toBeGreaterThan(10);
    expect(preset.saysJa.length).toBeGreaterThan(3);
    expect(preset.how.length).toBeGreaterThan(20);
    // No stakes, no betting advice, no money words: children use the site this is made for.
    expect(`${preset.says} ${preset.how}`).not.toMatch(
      /\b(bets?|betting|wagers?|stakes?|payouts?|pays?|money|odds-on|casino chips|gambl\w*)\b/i,
    );
    if (preset.source !== undefined) expect(preset.source).toMatch(/^https:\/\//);
    if (preset.family !== "handy" && preset.family !== "cards" && preset.id !== "d66")
      expect(preset.source, `${preset.id} needs a source for its rule`).toBeDefined();
    if (preset.rolls !== undefined) expect(canHold(spec!)).toBe(true);
    const table = presetOdds(preset);
    if (table !== null) {
      const total = table.reduce((sum, line) => sum + line.ways, 0n);
      expect(total).toBe(table[0]!.outOf);
      expect(table.reduce((sum, line) => sum + line.chance, 0)).toBeCloseTo(1, 12);
      for (const line of table) expect(line.text, `${preset.id} ${line.outcome}`).not.toContain("{");
      expect(presetOdds(preset, undefined, "ja")!.every((line) => line.text !== "" && !line.text.includes("{"))).toBe(
        true,
      );
    }
  });

  it("the words in both languages cover the same outcomes and keep the same places to fill", () => {
    expect(Object.keys(READING_WORDS.ja).sort()).toEqual(Object.keys(READING_WORDS.en).sort());
    const places = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1] as string).sort();
    for (const key of Object.keys(READING_WORDS.en) as (keyof typeof READING_WORDS.en)[]) {
      // Japanese may leave a figure out where the sentence does not need it, never add one.
      for (const place of places(READING_WORDS.ja[key] as string))
        expect(places(READING_WORDS.en[key] as string).concat(["dice", "total"]), key).toContain(place);
    }
  });

  it("is found by its name, its other names and a search", () => {
    expect(getPreset("yahtzee")?.id).toBe("yahtzee");
    expect(getPreset("Yacht")?.id).toBe("yahtzee");
    expect(getPreset("Ten Thousand")?.id).toBe("farkle");
    expect(getPreset("10000")?.id).toBe("farkle");
    expect(getPreset("丁半")?.id).toBe("cho-han");
    expect(getPreset("チンチロリン")?.id).toBe("chinchirorin");
    expect(getPreset("Chō-han")?.id).toBe("cho-han");
    expect(getPreset("D&D")?.id).toBe("d20");
    expect(getPreset("Shadowrun")?.id).toBe("d6-pool");
    expect(getPreset("nothing of the kind")).toBeUndefined();
    expect(getPreset("")).toBeUndefined();
    expect(findPresets("")).toHaveLength(PRESETS.length);
    expect(findPresets("yacht").map((p) => p.id)).toEqual(["yahtzee"]);
    expect(findPresets("craps").map((p) => p.id)).toContain("craps");
    expect(findPresets("two dice doubles").map((p) => p.id)).toEqual(
      expect.arrayContaining(["monopoly", "backgammon"]),
    );
    expect(findPresets("zzzz")).toEqual([]);
    expect(() => rollPreset("zzzz")).toThrow(RangeError);
  });

  it("replays from a seed", () => {
    for (const id of ["yahtzee", "risk", "ability-scores", "craps", "coin"]) {
      const a = rollPreset(id, { source: seededSource("replay"), at: 1 });
      const b = rollPreset(id, { source: seededSource("replay"), at: 1 });
      expect(b.rolls.map((r) => r.faces)).toEqual(a.rolls.map((r) => r.faces));
      expect(b.reading).toEqual(a.reading);
    }
    expect(rollPreset("ability-scores", { source: seededSource("scores") }).rolls).toHaveLength(6);
  });
});

describe("board games", () => {
  it("Monopoly: doubles roll again, and the third in a row ends the turn", () => {
    expect(read("monopoly", [3, 4])).toMatchObject({ outcome: "total", text: "7" });
    expect(read("monopoly", [4, 4])).toMatchObject({ outcome: "doubles", text: "8: doubles, so roll again" });
    expect(
      read(
        "monopoly",
        [2, 2],
        [
          [5, 5],
          [1, 1],
        ],
      ),
    ).toMatchObject({ outcome: "third", tone: "bad" });
    expect(
      read(
        "monopoly",
        [2, 2],
        [
          [5, 5],
          [1, 2],
        ],
      ).outcome,
    ).toBe("doubles");
    expect(odds("monopoly").get("doubles")).toEqual([6, 36]);
    // Parcheesi has doubles too, and no fixed rule for the third.
    expect(
      read(
        "parcheesi",
        [2, 2],
        [
          [5, 5],
          [1, 1],
        ],
      ).outcome,
    ).toBe("doubles");
  });

  it("Catan: a seven moves the robber, one roll in six", () => {
    expect(read("catan", [3, 4])).toMatchObject({ outcome: "seven", text: "Seven: the robber moves" });
    expect(read("catan", [3, 5]).text).toBe("8");
    expect(odds("catan").get("seven")).toEqual([6, 36]);
  });

  it("Backgammon: doubles are played four times", () => {
    expect(read("backgammon", [5, 5])).toMatchObject({ outcome: "doubles", text: "Double 5s: play 5 four times" });
    expect(read("backgammon", [2, 6]).text).toBe("Play a 6 and a 2");
    expect(groupsOf(presetSpec(game("doubling-cube")))[0]?.faces?.map((f) => f.value)).toEqual([2, 4, 8, 16, 32, 64]);
  });

  it("Ludo and Snakes and Ladders: a six rolls again, and in Ludo the third does not move", () => {
    expect(read("ludo", [6]).outcome).toBe("again");
    expect(read("ludo", [6], [[6], [6]]).outcome).toBe("third");
    expect(read("snakes-and-ladders", [6], [[6], [6]]).outcome).toBe("again");
    expect(read("ludo", [3]).text).toBe("Move 3");
  });

  it("Pachisi: the cowries' table, with its graces", () => {
    // Faces are places on the die: 1 is mouth down, 2 is mouth up.
    const cowries = (up: number) =>
      read(
        "pachisi",
        Array.from({ length: 6 }, (_, i) => (i < up ? 2 : 1)),
      );
    expect([0, 1, 2, 3, 4, 5, 6].map((up) => cowries(up).values.move)).toEqual([25, 10, 2, 3, 4, 5, 6]);
    expect([0, 1, 2, 3, 4, 5, 6].map((up) => cowries(up).outcome)).toEqual([
      "grace",
      "grace",
      "move",
      "move",
      "move",
      "move",
      "grace",
    ]);
    // The published chances: 1.6%, 9.4%, 23.4%, 31.2% for none, one, two and three up.
    const table = presetOdds(game("pachisi"))!;
    expect(table.find((l) => l.outcome === "grace")?.ways).toBe(1n + 6n + 1n);
    expect(table[0]!.outOf).toBe(64n);
  });

  it("Risk: highest against highest, next against next, ties to the defence", () => {
    expect(read("risk", [6, 3, 1, 5, 3])).toMatchObject({ outcome: "1-1", text: "Each side loses 1" });
    expect(read("risk", [6, 6, 1, 5, 3]).text).toBe("The defender loses 2");
    expect(read("risk", [5, 3, 1, 5, 3]).text).toBe("The attacker loses 2");
    // The well-known figures for three dice against two.
    const three = odds("risk");
    expect(three.get("0-2")).toEqual([2890, 7776]);
    expect(three.get("1-1")).toEqual([2611, 7776]);
    expect(three.get("2-0")).toEqual([2275, 7776]);
    // And by a count of every throw, sharing nothing with the pattern counter.
    for (const [attack, defence] of [
      [3, 2],
      [2, 2],
      [1, 2],
      [3, 1],
      [2, 1],
      [1, 1],
    ] as const) {
      const counted = new Map<string, number>();
      const walk = (dice: number[]) => {
        if (dice.length < attack + defence) {
          [1, 2, 3, 4, 5, 6].forEach((f) => {
            walk([...dice, f]);
          });
          return;
        }
        const a = dice.slice(0, attack).sort((x, y) => y - x);
        const d = dice.slice(attack).sort((x, y) => y - x);
        let lostA = 0;
        let lostD = 0;
        for (let i = 0; i < Math.min(attack, defence); i++)
          if (a[i]! > d[i]!) lostD += 1;
          else lostA += 1;
        counted.set(`${lostA}-${lostD}`, (counted.get(`${lostA}-${lostD}`) ?? 0) + 1);
      };
      walk([]);
      const table = odds("risk", `${attack}d6+${defence}d[1,2,3,4,5,6]`);
      for (const [outcome, ways] of counted)
        expect(table.get(outcome), `${attack} against ${defence}: ${outcome}`).toEqual([ways, 6 ** (attack + defence)]);
    }
    expect(odds("risk", "1d6+1d[1,2,3,4,5,6]").get("0-1")).toEqual([15, 36]);
  });
});
