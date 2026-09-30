import { describe, expect, it } from "vitest";

import { canHold, diceCount, groupsOf, isFair, isLoaded, roll } from "../dice.ts";
import { formatNotation, parseNotation } from "../notation.ts";
import { seededSource, type RandomSource } from "../random.ts";
import { asChance, chinchirorinHandWithin, crapsPass, yahtzeeWithin } from "./odds.ts";
import { PRESETS, findPresets, getPreset, presetOdds, presetSpec, readPreset, rollPreset, type Preset } from "./presets.ts";
import { READERS, patternsOf, waysToShut } from "./readings.ts";
import { READING_WORDS } from "./words.ts";

/** A source that throws the faces it is handed, in order, on numbered dice. */
function scripted(faces: number[]): RandomSource {
  const left = [...faces];
  return { seed: null, next: () => (left.shift() as number) - 1 };
}
const game = (id: string): Preset => {
  const preset = getPreset(id);
  if (preset === undefined) throw new Error(`no preset ${id}`);
  return preset;
};
/** Throw a game's dice as given and read them, with the rolls before in the same game. */
function read(id: string, faces: number[], before: number[][] = []) {
  const preset = game(id);
  const earlier = before.map((f, i) => roll(presetSpec(preset), scripted(f), i));
  const thrown = roll(presetSpec(preset), scripted(faces), 99);
  return readPreset(preset, thrown, earlier);
}
const odds = (id: string, notation?: string) => {
  const table = presetOdds(game(id), notation === undefined ? undefined : parseNotation(notation)!);
  if (table === null) throw new Error(`${id} has no odds`);
  return new Map(table.map((line) => [line.outcome, [Number(line.ways), Number(line.outOf)]]));
};

describe("holding dice in a game", () => {
  it("is for the games that hold dice between rolls, and for no other", () => {
    expect(PRESETS.filter((p) => p.hold !== false).map((p) => p.id)).toEqual(["yahtzee", "farkle", "poker-dice", "ship-captain-crew"]);
    // A game with a turn of several rolls holds dice between them.
    for (const preset of PRESETS) if (preset.rolls !== undefined) expect(preset.hold, preset.id).toBeUndefined();
  });
});

describe("every preset", () => {
  it("there are plenty, on every shelf, each with a name of its own", () => {
    expect(PRESETS.length).toBeGreaterThanOrEqual(40);
    expect(new Set(PRESETS.map((p) => p.id)).size).toBe(PRESETS.length);
    for (const family of ["board", "dice", "traditional", "cards", "roleplaying", "handy"]) expect(PRESETS.some((p) => p.family === family), family).toBe(true);
    for (const named of ["risk", "craps", "yahtzee", "pachisi", "parcheesi", "ludo", "monopoly", "catan", "backgammon", "farkle", "bunco", "pig", "cho-han", "chinchirorin"]) expect(getPreset(named), named).toBeDefined();
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
      expect(`${preset.reading}.${reading.outcome}` in READING_WORDS[language], `${preset.reading}.${reading.outcome}`).toBe(true);
      if (preset.reading !== "faces") expect(reading.text.length).toBeGreaterThan(0);
    }
    // Read a thousand rolls: no outcome is without words.
    const source = seededSource(`many ${preset.id}`);
    const before = [];
    for (let i = 0; i < 300; i++) {
      const r = roll(spec!, source, i);
      const reading = readPreset(preset, r, before);
      expect(`${preset.reading}.${reading.outcome}` in READING_WORDS.en, `${preset.reading}.${reading.outcome}`).toBe(true);
      expect(`${preset.reading}.${reading.outcome}` in READING_WORDS.ja, `${preset.reading}.${reading.outcome}`).toBe(true);
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
    expect(`${preset.says} ${preset.how}`).not.toMatch(/\b(bets?|betting|wagers?|stakes?|payouts?|pays?|money|odds-on|casino chips|gambl\w*)\b/i);
    if (preset.source !== undefined) expect(preset.source).toMatch(/^https:\/\//);
    if (preset.family !== "handy" && preset.family !== "cards" && preset.id !== "d66") expect(preset.source, `${preset.id} needs a source for its rule`).toBeDefined();
    if (preset.rolls !== undefined) expect(canHold(spec!)).toBe(true);
    const table = presetOdds(preset);
    if (table !== null) {
      const total = table.reduce((sum, line) => sum + line.ways, 0n);
      expect(total).toBe(table[0]!.outOf);
      expect(table.reduce((sum, line) => sum + line.chance, 0)).toBeCloseTo(1, 12);
      for (const line of table) expect(line.text, `${preset.id} ${line.outcome}`).not.toContain("{");
      expect(presetOdds(preset, undefined, "ja")!.every((line) => line.text !== "" && !line.text.includes("{"))).toBe(true);
    }
  });

  it("the words in both languages cover the same outcomes and keep the same places to fill", () => {
    expect(Object.keys(READING_WORDS.ja).sort()).toEqual(Object.keys(READING_WORDS.en).sort());
    const places = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1] as string).sort();
    for (const key of Object.keys(READING_WORDS.en) as (keyof typeof READING_WORDS.en)[]) {
      // Japanese may leave a figure out where the sentence does not need it, never add one.
      for (const place of places(READING_WORDS.ja[key] as string)) expect(places(READING_WORDS.en[key] as string).concat(["dice", "total"]), key).toContain(place);
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
    expect(findPresets("two dice doubles").map((p) => p.id)).toEqual(expect.arrayContaining(["monopoly", "backgammon"]));
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
    expect(read("monopoly", [2, 2], [[5, 5], [1, 1]])).toMatchObject({ outcome: "third", tone: "bad" });
    expect(read("monopoly", [2, 2], [[5, 5], [1, 2]]).outcome).toBe("doubles");
    expect(odds("monopoly").get("doubles")).toEqual([6, 36]);
    // Parcheesi has doubles too, and no fixed rule for the third.
    expect(read("parcheesi", [2, 2], [[5, 5], [1, 1]]).outcome).toBe("doubles");
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
    const cowries = (up: number) => read("pachisi", Array.from({ length: 6 }, (_, i) => (i < up ? 2 : 1)));
    expect([0, 1, 2, 3, 4, 5, 6].map((up) => cowries(up).values.move)).toEqual([25, 10, 2, 3, 4, 5, 6]);
    expect([0, 1, 2, 3, 4, 5, 6].map((up) => cowries(up).outcome)).toEqual(["grace", "grace", "move", "move", "move", "move", "grace"]);
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
    for (const [attack, defence] of [[3, 2], [2, 2], [1, 2], [3, 1], [2, 1], [1, 1]] as const) {
      const counted = new Map<string, number>();
      const walk = (dice: number[]) => {
        if (dice.length < attack + defence) return void [1, 2, 3, 4, 5, 6].forEach((f) => walk([...dice, f]));
        const a = dice.slice(0, attack).sort((x, y) => y - x);
        const d = dice.slice(attack).sort((x, y) => y - x);
        let lostA = 0;
        let lostD = 0;
        for (let i = 0; i < Math.min(attack, defence); i++) if (a[i]! > d[i]!) lostD += 1; else lostA += 1;
        counted.set(`${lostA}-${lostD}`, (counted.get(`${lostA}-${lostD}`) ?? 0) + 1);
      };
      walk([]);
      const table = odds("risk", `${attack}d6+${defence}d[1,2,3,4,5,6]`);
      for (const [outcome, ways] of counted) expect(table.get(outcome), `${attack} against ${defence}: ${outcome}`).toEqual([ways, 6 ** (attack + defence)]);
    }
    expect(odds("risk", "1d6+1d[1,2,3,4,5,6]").get("0-1")).toEqual([15, 36]);
  });
});

describe("dice games", () => {
  it("Yahtzee names the combination", () => {
    expect(read("yahtzee", [4, 4, 4, 4, 4]).text).toBe("Yahtzee: five 4s");
    expect(read("yahtzee", [2, 3, 4, 5, 6]).outcome).toBe("large");
    expect(read("yahtzee", [1, 2, 3, 4, 6]).outcome).toBe("small");
    expect(read("yahtzee", [3, 3, 3, 3, 1]).text).toBe("Four of a kind, for 13");
    expect(read("yahtzee", [3, 3, 3, 1, 1]).outcome).toBe("fullHouse");
    expect(read("yahtzee", [3, 3, 3, 1, 2]).outcome).toBe("three");
    expect(read("yahtzee", [1, 1, 3, 4, 6]).text).toBe("Chance, for 15");
    expect(game("yahtzee").rolls).toBe(3);
  });

  it("Yahtzee's odds on one roll, and within three", () => {
    const table = odds("yahtzee");
    expect(table.get("yahtzee")).toEqual([6, 7776]);
    expect(table.get("large")).toEqual([240, 7776]);
    expect(table.get("four")).toEqual([150, 7776]);
    expect(table.get("fullHouse")).toEqual([300, 7776]);
    expect(yahtzeeWithin(1)).toEqual([1n, 1296n]);
    expect(yahtzeeWithin(3)).toEqual([347897n, 7558272n]);
    expect(asChance(yahtzeeWithin(3))).toBeCloseTo(0.046029, 6);
    expect(asChance(yahtzeeWithin(2))).toBeCloseTo(0.012631, 5);
  });

  it("Yahtzee within three rolls, by playing it out", () => {
    const source = seededSource("yahtzee");
    let made = 0;
    const games = 60_000;
    for (let g = 0; g < games; g++) {
      let dice = Array.from({ length: 5 }, () => (source.next() % 6) + 1);
      for (let r = 1; r < 3; r++) {
        const counts = [0, 0, 0, 0, 0, 0, 0];
        for (const d of dice) counts[d]! += 1;
        const keep = counts.indexOf(Math.max(...counts));
        dice = dice.map((d) => (d === keep ? d : (source.next() % 6) + 1));
      }
      if (dice.every((d) => d === dice[0])) made += 1;
    }
    expect(Math.abs(made / games - asChance(yahtzeeWithin(3)))).toBeLessThan(0.004);
  });

  it("Farkle: the standard scores, and a farkle when nothing scores", () => {
    expect(read("farkle", [1, 5, 2, 3, 4, 6]).text).toBe("Scores 150");
    expect(read("farkle", [1, 1, 1, 5, 5, 2]).text).toBe("Scores 1100");
    expect(read("farkle", [4, 4, 4, 2, 3, 6]).text).toBe("Scores 400");
    expect(read("farkle", [2, 2, 3, 3, 4, 6])).toMatchObject({ outcome: "farkle", tone: "bad" });
    // Dice from 2, 3, 4 and 6 with no three alike: counted by hand as 4^6 less those with a triple.
    let none = 0;
    const walk = (dice: number[]) => {
      if (dice.length < 6) return void [2, 3, 4, 6].forEach((f) => walk([...dice, f]));
      if ([2, 3, 4, 6].every((f) => dice.filter((d) => d === f).length < 3)) none += 1;
    };
    walk([]);
    expect(odds("farkle").get("farkle")).toEqual([none, 46656]);
  });

  it("Bunco, Pig, Mexico and Ship, captain and crew", () => {
    expect(read("bunco", [4, 4, 4]).text).toBe("Three 4s: a Bunco in round 4, a mini Bunco in any other");
    expect(odds("bunco").get("three")).toEqual([6, 216]);
    expect(read("pig", [1])).toMatchObject({ outcome: "out", tone: "bad" });
    expect(read("pig", [4], [[6], [1], [3], [5]]).text).toBe("4: the turn stands at 12");
    expect(read("mexico", [1, 2]).text).toBe("Mexico");
    expect(read("mexico", [3, 3]).text).toBe("Double 3s");
    expect(read("mexico", [4, 6]).text).toBe("64");
    expect(odds("mexico").get("mexico")).toEqual([2, 36]);
    expect(read("ship-captain-crew", [6, 5, 4, 3, 2]).text).toBe("Ship, captain and crew, with a cargo of 5");
    expect(read("ship-captain-crew", [6, 5, 1, 3, 2]).outcome).toBe("captain");
    expect(read("ship-captain-crew", [5, 4, 1, 3, 2]).outcome).toBe("none");
    expect(read("ship-captain-crew", [6, 4, 1, 3, 2]).outcome).toBe("ship");
  });

  it("Poker dice: the hands, and how many ways each has", () => {
    // Faces are places on the die: 9, 10, J, Q, K, A.
    expect(read("poker-dice", [6, 6, 6, 6, 6]).text).toBe("Five of a kind");
    expect(read("poker-dice", [2, 3, 4, 5, 6]).text).toBe("A straight");
    expect(read("poker-dice", [1, 2, 3, 4, 6]).text).toBe("A bust");
    const table = odds("poker-dice");
    expect([...table].map(([hand, [ways]]) => [hand, ways]).sort()).toEqual([["bust", 480], ["five", 6], ["four", 150], ["fullHouse", 300], ["pair", 3600], ["straight", 240], ["three", 1200], ["twoPair", 1800]]);
    expect(rollPreset("poker-dice", { source: scripted([6, 6, 5, 5, 1]) }).roll.dice?.map((d) => d.label)).toEqual(["A", "A", "K", "K", "9"]);
  });

  it("Shut the box lists every set of tiles a total may shut", () => {
    expect(waysToShut(8).map((w) => w.join("+"))).toEqual(["8", "7+1", "6+2", "5+3", "5+2+1", "4+3+1"]);
    expect(read("shut-the-box", [3, 5]).text).toBe("8: shut 8, 7+1, 6+2, 5+3, 5+2+1, 4+3+1");
    expect(waysToShut(2)).toEqual([[2]]);
    expect(waysToShut(12)).toContainEqual([9, 2, 1]);
  });

  it("Left Center Right and Liar's dice show their dice", () => {
    const lcr = rollPreset("LCR", { source: scripted([1, 2, 4]) });
    expect(lcr.roll.dice?.map((d) => d.label)).toEqual(["L", "C", "Dot"]);
    expect(groupsOf(presetSpec(game("left-center-right")))[0]?.faces?.filter((f) => f.label === "Dot")).toHaveLength(3);
    expect(read("liars-dice", [3, 3, 5, 1, 3]).text).toBe("3×3, 1×5, 1×1");
  });
});

describe("traditional games", () => {
  it("Craps: the come-out, the point, and the seven", () => {
    expect(read("craps", [3, 4]).text).toBe("7 on the come-out: a natural");
    expect(read("craps", [5, 6]).outcome).toBe("natural");
    expect(read("craps", [1, 1]).text).toBe("2 on the come-out: craps");
    expect(read("craps", [6, 6]).outcome).toBe("craps");
    expect(read("craps", [2, 2]).text).toBe("4 is the point");
    expect(read("craps", [5, 3], [[2, 2]]).text).toBe("8: roll again for the point of 4");
    expect(read("craps", [1, 3], [[2, 2], [5, 3]]).text).toBe("4: the point is made");
    expect(read("craps", [3, 4], [[2, 2], [5, 3]]).text).toBe("Seven before the point of 4: seven out");
    // After the point is settled the next roll is a come-out again.
    expect(read("craps", [3, 4], [[2, 2], [1, 3]]).outcome).toBe("natural");
    const table = odds("craps");
    expect(table.get("natural")).toEqual([8, 36]);
    expect(table.get("craps")).toEqual([4, 36]);
    expect(table.get("point")).toEqual([24, 36]);
    expect(crapsPass()).toEqual([244n, 495n]);
  });

  it("Craps: the chance of passing, by playing it out", () => {
    const source = seededSource("pass");
    const two = () => (source.next() % 6) + (source.next() % 6) + 2;
    let passed = 0;
    const hands = 60_000;
    for (let h = 0; h < hands; h++) {
      const first = two();
      if (first === 7 || first === 11) passed += 1;
      else if (first !== 2 && first !== 3 && first !== 12) {
        for (;;) {
          const next = two();
          if (next === first) passed += 1;
          if (next === first || next === 7) break;
        }
      }
    }
    expect(Math.abs(passed / hands - asChance(crapsPass()))).toBeLessThan(0.01);
  });

  it("Hazard with a main of seven", () => {
    expect(read("hazard", [3, 4]).outcome).toBe("nick");
    expect(read("hazard", [5, 6]).outcome).toBe("nick");
    expect(read("hazard", [6, 6]).outcome).toBe("out");
    expect(read("hazard", [1, 2]).outcome).toBe("out");
    expect(read("hazard", [4, 5]).text).toBe("9 is the chance; the main is 7");
    expect(read("hazard", [4, 5], [[4, 5]]).outcome).toBe("made");
    expect(read("hazard", [3, 4], [[4, 5]]).outcome).toBe("lost");
    expect(read("hazard", [2, 2], [[4, 5]]).outcome).toBe("again");
  });

  it("Sic bo: big, small, and the triples that are neither", () => {
    expect(read("sic-bo", [6, 5, 2]).text).toBe("Big, with 13");
    expect(read("sic-bo", [1, 2, 4]).text).toBe("Small, with 7");
    expect(read("sic-bo", [4, 4, 4]).outcome).toBe("triple");
    const table = odds("sic-bo");
    expect(table.get("triple")).toEqual([6, 216]);
    expect(table.get("big")).toEqual([105, 216]);
    expect(table.get("small")).toEqual([105, 216]);
  });

  it("Chō-han: even is chō, odd is han, and the two are as likely", () => {
    expect(read("cho-han", [2, 4])).toMatchObject({ outcome: "cho", text: "Chō: 6 is even" });
    expect(read("cho-han", [2, 5])).toMatchObject({ outcome: "han", text: "Han: 7 is odd" });
    expect(readPreset(game("cho-han"), roll(presetSpec(game("cho-han")), scripted([2, 5]), 1), [], "ja").text).toBe("半（2・5、合計 7）");
    const table = odds("cho-han");
    expect(table.get("cho")).toEqual([18, 36]);
    expect(table.get("han")).toEqual([18, 36]);
  });

  it("Chinchirorin: every hand, and how many of the 216 throws make it", () => {
    expect(read("chinchirorin", [1, 1, 1]).outcome).toBe("pinzoro");
    expect(read("chinchirorin", [5, 5, 5]).text).toBe("Arashi: three 5s");
    expect(read("chinchirorin", [6, 4, 5]).outcome).toBe("shigoro");
    expect(read("chinchirorin", [2, 1, 3]).outcome).toBe("hifumi");
    expect(read("chinchirorin", [3, 5, 3]).text).toBe("A pair of 3s and a point of 5");
    expect(read("chinchirorin", [6, 2, 2]).values).toEqual({ point: 6, pair: 2 });
    expect(read("chinchirorin", [1, 3, 6]).outcome).toBe("menashi");
    const table = odds("chinchirorin");
    expect([...table].map(([hand, [ways]]) => [hand, ways]).sort()).toEqual([["arashi", 5], ["hifumi", 6], ["menashi", 108], ["pinzoro", 1], ["point", 90], ["shigoro", 6]]);
    expect(chinchirorinHandWithin(1)).toEqual([1n, 2n]);
    expect(chinchirorinHandWithin(3)).toEqual([7n, 8n]);
  });
});

describe("roleplaying, and the rest", () => {
  it("a d20 calls its naturals, alone or with advantage", () => {
    expect(read("d20", [20]).text).toBe("A natural 20, for 20");
    expect(read("d20", [1]).outcome).toBe("natural1");
    expect(read("advantage", [7, 20]).outcome).toBe("natural20");
    expect(read("advantage", [7, 1]).text).toBe("7");
    expect(read("disadvantage", [7, 1]).outcome).toBe("natural1");
    expect(odds("d20").get("natural20")).toEqual([1, 20]);
    expect(presetOdds(game("advantage"))).toBeNull();
  });

  it("ability scores are six rolls of 4d6, the lowest dropped", () => {
    const scores = rollPreset("ability-scores", { source: seededSource("hero"), at: 1 });
    expect(scores.rolls).toHaveLength(6);
    for (const r of scores.rolls) {
      expect(r.faces).toHaveLength(4);
      expect(r.kept.filter(Boolean)).toHaveLength(3);
      expect(r.total >= 3 && r.total <= 18).toBe(true);
    }
    expect(scores.readings.map((x) => x.text)).toEqual(scores.rolls.map((r) => String(r.total)));
  });

  it("Fate reads the ladder", () => {
    const fate = (faces: number[]) => read("fate", faces);
    // Faces by place on the die: 1 is minus, 2 is blank, 3 is plus.
    expect(fate([3, 3, 3, 3]).text).toBe("Great (+4)");
    expect(fate([2, 2, 2, 2]).text).toBe("Mediocre (0)");
    expect(fate([1, 1, 2, 2]).text).toBe("Terrible (-2)");
    expect(fate([1, 1, 1, 1]).outcome).toBe("below");
    expect(odds("fate").get("rung0")).toEqual([19, 81]);
  });

  it("Blades, Powered by the Apocalypse and the pools", () => {
    expect(read("blades", [6, 6]).outcome).toBe("critical");
    expect(read("blades", [6, 2]).text).toBe("A 6: you do it");
    expect(read("blades", [4, 2]).outcome).toBe("partial");
    expect(read("blades", [3, 2]).outcome).toBe("bad");
    // Two dice: a critical 1 in 36, a 6 on 10 more, a 4 or 5 on 16, and 9 at 3 or less.
    expect([...odds("blades")].map(([o, [w]]) => [o, w]).sort()).toEqual([["bad", 9], ["critical", 1], ["partial", 16], ["six", 10]]);
    expect(read("pbta", [6, 4]).outcome).toBe("strong");
    expect(read("pbta", [3, 4]).outcome).toBe("weak");
    expect(read("pbta", [3, 3]).outcome).toBe("miss");
    expect([...odds("pbta")].map(([o, [w]]) => [o, w]).sort()).toEqual([["miss", 15], ["strong", 6], ["weak", 15]]);
    expect(read("d10-pool", [8, 9, 10, 1, 7]).text).toBe("3 successes");
    expect(read("d10-pool", [1, 2, 3, 4, 7]).outcome).toBe("none");
    // No successes on five d10 at 8 or more: 0.7 to the fifth.
    const none = presetOdds(game("d10-pool"))!.find((l) => l.outcome.startsWith("none"))!;
    expect(none.chance).toBeCloseTo(0.7 ** 5, 12);
    expect(read("d6-pool", [5, 6, 1, 2, 3, 4]).text).toBe("2 hits");
    expect(read("d6-pool", [1, 1, 1, 1, 5, 6]).outcome).toBe("glitch");
    expect(read("d6-pool", [1, 1, 1, 2, 5, 6]).outcome).toBe("hits");
  });

  it("percentile, roll-under and d66", () => {
    const d100 = rollPreset("percentile", { source: scripted([42]) });
    expect(d100.reading.text).toBe("42: a success for a skill of 42 or more, hard for 84 or more, extreme for 210 or more");
    expect(read("roll-under", [1, 1, 2]).outcome).toBe("critical");
    expect(read("roll-under", [6, 6, 6]).outcome).toBe("fumble");
    expect(read("roll-under", [6, 6, 5]).outcome).toBe("fail");
    expect(read("roll-under", [3, 4, 3]).text).toBe("10: a success for a skill of 10 or more");
    expect(read("d66", [3, 4]).text).toBe("34");
    expect(read("d66", [4, 3]).text).toBe("43");
  });

  it("who goes first: the highest die, and ties roll again", () => {
    expect(read("first-player", [2, 6, 3, 1]).text).toBe("Player 2 goes first, with a 6");
    expect(read("first-player", [5, 2, 5, 1]).text).toBe("Players 1, 3 tie on 5: they roll again");
  });

  it("the handy dice say what they show", () => {
    expect(rollPreset("coin", { source: scripted([2]) }).roll.dice?.[0]?.label).toBe("Tails");
    expect(rollPreset("janken", { source: scripted([1]) }).roll.dice?.[0]?.label).toBe("Rock");
    expect(groupsOf(presetSpec(game("compass")))[0]?.faces).toHaveLength(8);
    expect(groupsOf(presetSpec(game("colour")))[0]?.faces?.every((f) => f.colour !== undefined)).toBe(true);
    expect(isFair(presetSpec(game("pick-a-number")))).toBe(true);
    expect(diceCount(presetSpec(game("first-player")))).toBe(4);
  });
});

describe("counting every way the dice can fall", () => {
  it("counts patterns, not throws, and the throws still add up", () => {
    const patterns = patternsOf(parseNotation("5d6")!)!;
    expect(patterns).toHaveLength(252);
    expect(patterns.reduce((sum, p) => sum + p.ways, 0n)).toBe(7776n);
    expect(patternsOf(parseNotation("10d6")!)!.reduce((sum, p) => sum + p.ways, 0n)).toBe(6n ** 10n);
    expect(patternsOf(parseNotation("10d10")!)!.reduce((sum, p) => sum + p.ways, 0n)).toBe(10n ** 10n);
    expect(patternsOf(parseNotation("3d6!")!)).toBeNull();
    expect(patternsOf(parseNotation("2d20kh1")!)).toBeNull();
    expect(patternsOf(parseNotation("2d6{6:3}")!)).toBeNull();
  });
});
