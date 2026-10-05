// The documents that are made from the source, or that quote it, checked against it.
// Plain JavaScript, so that reading files needs no Node types. `pnpm docs:make` rewrites what is made.
import { createHash } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import process from "node:process";

import { describe, expect, it } from "vitest";

import { MAX_TIMES, chancesOf, groupsOf, hasTotal, isFair, roll, rollHeld, rollMany } from "./dice.ts";
import { runCli } from "./cli.ts";
import { toCSV, toJSON, toText } from "./export.ts";
import { chinchirorinHandWithin, crapsPass, yahtzeeWithin } from "./games/odds.ts";
import { PRESETS, getPreset, presetOdds, presetSpec, rollPreset } from "./games/presets.ts";
import { LOADED_PRESETS, faceChances, loadingOf } from "./loaded.ts";
import { makeSet, readSet, setQuery } from "./sets.ts";
import { fairnessTest, readResults } from "./stats.ts";
import { checkNotation, formatNotation, parseNotation } from "./notation.ts";
import { chanceAnyAtLeast, expectedHighest } from "./odds.ts";
import { normalizeSpec, rangeOf } from "./dice.ts";
import { chanceAtLeast, chanceExactly, distributionHolding, distributionOf, exactCounts, expectedTotal, luckOf, mostLikely, spreadOf } from "./odds.ts";
import { seededSource } from "./random.ts";
import { shareQuery } from "./share.ts";
import { STRINGS } from "./ui/strings.ts";

const readme = readFileSync("README.md", "utf8");
const cell = (text) => text.replace(/\\\|/g, "|").trim();

/** The rows of the table under a heading: each row's cells. */
function table(heading) {
  const from = readme.indexOf(heading);
  if (from < 0) throw new Error(`the README has no “${heading}”`);
  const rows = [];
  for (const line of readme.slice(from).split("\n").slice(1)) {
    if (line.startsWith("|")) rows.push(line.split(/(?<!\\)\|/).slice(1, -1).map(cell));
    else if (rows.length > 0) break;
  }
  return rows.slice(2);
}

const codes = (text) => [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1]);

describe("the README's notation", () => {
  it("every notation in the reference table is one the package rolls", () => {
    const rows = table("## Dice notation");
    expect(rows.length).toBeGreaterThan(15);
    for (const [notation] of rows) {
      for (const text of codes(notation)) expect(parseNotation(text), text).not.toBeNull();
    }
  });

  it("every notation in the table of refusals is refused", () => {
    const rows = table("### What is refused");
    expect(rows.length).toBeGreaterThan(8);
    for (const [notation] of rows) {
      for (const text of codes(notation)) expect(checkNotation(text).ok, text).toBe(false);
    }
  });

  it("rows that say two notations are the same roll are right", () => {
    expect(parseNotation("4d6dl1")).toEqual(parseNotation("4d6kh3"));
    expect(parseNotation("5d10dh2")).toEqual(parseNotation("5d10kl3"));
    expect(parseNotation("2d6+3d6")).toEqual(parseNotation("5d6"));
    expect(formatNotation(parseNotation("4d6dl1"))).toBe("4d6kh3");
    expect(readme).toContain("So `4d6dl1` is written back as `4d6kh3`");
  });

  it("the refusal it quotes is the refusal given", () => {
    const refused = checkNotation("4d6!kh3");
    expect(refused).toMatchObject({ ok: false, problem: "explode", part: "!" });
    expect(readme).toContain(refused.message);
  });
});

describe("the README on counting successes", () => {
  it("the pool from table-7", () => {
    const pool = roll(parseNotation("6d10>=8f=1"), seededSource("table-7"));
    expect(readme).toContain("pool.faces;                          // [10, 6, 6, 3, 4, 3]");
    expect(pool.faces).toEqual([10, 6, 6, 3, 4, 3]);
    expect(pool.total).toBe(1);
    expect(pool.dice[0].counts).toBe(1);
    expect(readme).toContain("chanceAtLeast(pool.spec, 3);         // 0.1859");
    expect(chanceAtLeast(pool.spec, 3)).toBeCloseTo(0.1859, 4);
    expect(readme).toContain("expectedTotal(pool.spec);            // 1.2");
    expect(expectedTotal(pool.spec)).toBeCloseTo(1.2, 10);
    const deep = roll(parseNotation("3d6!p"), seededSource("table-7"));
    expect(readme).toContain("`[6, 4, 2, 1]`, where the 4 is an extra die worth 3, and a total of 12");
    expect([deep.faces, deep.dice[1].value, deep.total]).toEqual([[6, 4, 2, 1], 3, 12]);
  });

  it("what it says is written back, is", () => {
    expect(readme).toContain("`6d10>7` as\n`6d10>=8`, and `6d10!>=10>=8` as `6d10>=8!`");
    expect(formatNotation(parseNotation("6d10>7"))).toBe("6d10>=8");
    expect(formatNotation(parseNotation("6d10!>=10>=8"))).toBe("6d10>=8!");
  });
});

describe("the README's examples", () => {
  const spec = (text) => parseNotation(text);

  it("the quick start's numbers", () => {
    expect(chanceAtLeast(spec("2d20kh1+5"), 15)).toBeCloseTo(0.7975, 12);
    expect(readme).toContain("chanceAtLeast(attack, 15);                   // 0.7975");
    // The API example: every line's comment is what the line gives.
    const read = checkNotation("4d6dl1");
    const thrown = roll(read.spec, seededSource("table-7"));
    expect([thrown.faces, thrown.kept, thrown.total]).toEqual([[6, 4, 2, 1], [true, true, true, false], 12]);
    expect(readme).toContain("thrown.faces;                                  // [6, 4, 2, 1]");
  });

  it("what a roll returns", () => {
    const r = roll(spec("4d6dl1"), seededSource("table-7"), 1759190400000);
    expect(r).toMatchObject({ faces: [6, 4, 2, 1], kept: [true, true, true, false], total: 12, seed: "table-7" });
    expect(readme).toContain('"faces": [6, 4, 2, 1]');
    expect(readme).toContain('"total": 12');
    expect(readme).toContain(`?${shareQuery(r)}`);
    const dice = seededSource("table-7");
    roll(spec("4d6dl1"), dice, 1);
    const second = roll(spec("3d6!"), dice, 2);
    expect(second.faces).toEqual([6, 3, 6, 4, 5]);
    expect(second.total).toBe(24);
    expect(readme).toContain("faces  // [6, 3, 6, 4, 5]");
    const mixed = roll(spec("1d20+2d4+3"), seededSource("table-7"), 1);
    expect(mixed.faces).toEqual([10, 2, 4]);
    expect(mixed.total).toBe(19);
    expect(readme).toContain("faces  // [10, 2, 4]");
  });

  it("holding dice", () => {
    const dice = seededSource("yacht");
    const first = roll(spec("5d6"), dice, 1);
    expect(first.faces).toEqual([3, 3, 6, 3, 6]);
    const second = rollHeld(first, first.faces.map((f) => f === 6), dice, 2);
    expect(second.faces).toEqual([3, 4, 6, 1, 6]);
    expect(second.held).toEqual([false, false, true, false, true]);
    const odds = distributionHolding(first.spec, first.faces, [false, false, true, false, true]);
    expect(odds.min).toBe(15);
    expect(expectedTotal(odds)).toBeCloseTo(22.5, 12);
    expect(chanceAtLeast(odds, 24)).toBeCloseTo(0.375, 12);
    for (const line of ["// [3, 3, 6, 3, 6]", "second.faces;  // [3, 4, 6, 1, 6]", "odds.min;                // 15", "expectedTotal(odds);     // 22.5", "chanceAtLeast(odds, 24); // 0.375"]) expect(readme).toContain(line);
  });

  it("the odds", () => {
    const s = spec("4d6dl1");
    expect(expectedTotal(s)).toBe(12.2445987654321);
    expect(spreadOf(s)).toBeCloseTo(2.85, 2);
    expect(mostLikely(s)).toEqual([13]);
    expect(chanceExactly(s, 18)).toBeCloseTo(21 / 1296, 14);
    expect(luckOf(s, 12)).toBeCloseTo(0.448, 3);
    expect(readme).toContain("expectedTotal(spec);        // 12.2445987654321");
    const eight = exactCounts(spec("8d6"));
    expect(eight.outcomes).toBe(1679616n);
    expect(eight.counts.slice(0, 3)).toEqual([1n, 8n, 36n]);
    expect(eight.counts[28 - 8]).toBe(135954n);
    expect(exactCounts(spec("1d20+1d4"))).toMatchObject({ min: 2, outcomes: 80n });
    expect(exactCounts(spec("4d6dl1"))).toBeNull();
    expect(exactCounts(spec("10d1000")).outcomes).toBe(10n ** 30n);
  });
});

describe("the README's list of who it is for", () => {
  const from = readme.indexOf("## Who it is for");
  const list = readme.slice(from, readme.indexOf("Game names are trademarks"));

  it("names notation that rolls, every piece of it", () => {
    const found = codes(list);
    expect(found).toEqual(["2d20kh1+5", "4d6dl1", "8d6", "1d20+1d4", "2d6", "5d6", "6d6", "d[Hit,Miss,Miss]", "2d6", "d6{6:3}"]);
    for (const text of found) expect(roll(parseNotation(text), seededSource(text)).faces.length, text).toBeGreaterThan(0);
  });

  it("and the dice do what it says of them", () => {
    expect(chanceExactly(parseNotation("2d6"), 7)).toBeCloseTo(1 / 6, 14);
    expect(list).toContain("makes 7 one time in 6");
    const first = roll(parseNotation("5d6"), seededSource("class"), 1);
    expect(rollHeld(first, [true, true, false, false, false], seededSource("again"), 2).faces.slice(0, 2)).toEqual(first.faces.slice(0, 2));
    // A seed makes a classroom's rolls repeatable.
    expect(roll(parseNotation("6d6"), seededSource("class"), 1).faces).toEqual(roll(parseNotation("6d6"), seededSource("class"), 1).faces);
  });
});

describe("the README on custom dice, loaded dice and sets", () => {
  const spec = (text) => parseNotation(text);

  it("custom dice", () => {
    const thrown = roll(spec("3d[Hit=1,Miss=0,Miss=0]"), seededSource("table-7"), 1);
    expect(thrown.dice.map((d) => d.label)).toEqual(["Miss", "Hit", "Miss"]);
    expect(thrown.faces).toEqual([3, 1, 2]);
    expect(thrown.total).toBe(1);
    expect(expectedTotal(spec("3d[Hit=1,Miss=0,Miss=0]"))).toBeCloseTo(1, 12);
    expect(hasTotal(spec("d[Yes,No,Maybe]"))).toBe(false);
    expect(isFair(spec("d[Yes,No,Maybe]"))).toBe(false);
    for (const line of ['thrown.dice.map((d) => d.label);   // ["Miss", "Hit", "Miss"]', "thrown.faces;                      // [3, 1, 2]"]) expect(readme).toContain(line);
  });

  it("loaded dice and the fairness test", () => {
    expect(isFair(spec("d6{6:3}"))).toBe(false);
    expect(roll(spec("d6{6:3}")).loaded).toBe(true);
    expect(fairnessTest([30, 30, 30, 30, 30, 90]).verdict).toBe("lopsided");
    expect(fairnessTest([82, 95, 103, 98, 104, 118]).verdict).toBe("fair");
  });

  it("sets", () => {
    const set = makeSet("Skirmish", "3d[Hit=1,Miss=0,Miss=0]");
    expect(readme).toContain(`?${setQuery(set)}`);
    expect(readSet(setQuery(set))).toEqual({ name: "Skirmish", notation: "3d[Hit=1,Miss=0,Miss=0]" });
  });

  it("names the family as each sibling names itself", () => {
    for (const name of ["Kyuubu", "Toranpu", "Tane", "Hitotsu", "Narabe", "Tenka", "Kumimoji"]) expect(readme).toContain(`https://github.com/johnmorrisdotca/${name.toLowerCase()}`);
    expect(readme).toContain("Game names are trademarks of their respective owners.");
  });
});

describe("the page on loaded dice", () => {
  const page = readFileSync("docs/loaded-dice.md", "utf8");
  const spec = (text) => parseNotation(text);

  it("every notation in its table is a loaded die", () => {
    const from = page.indexOf("| Notation | The die |");
    const rows = page.slice(from).split("\n").slice(2).filter((line, i, all) => line.startsWith("|") && all.slice(0, i).every((l) => l.startsWith("|")));
    expect(rows).toHaveLength(4);
    for (const row of rows) for (const text of codes(row.split("|")[1])) expect(isFair(spec(text)), text).toBe(false);
    expect(checkNotation("d6{6:1}")).toMatchObject({ ok: false, problem: "weights" });
  });

  it("the Optimist is as it says", () => {
    const optimist = spec("d6{6:3}");
    expect(optimist.weights).toEqual([1, 1, 1, 1, 1, 3]);
    const thrown = roll(optimist, seededSource("table-7"), 1);
    expect(thrown.faces).toEqual([2]);
    expect(thrown.loaded).toBe(true);
    expect(expectedTotal(optimist)).toBe(4.125);
    expect(loadingOf(optimist)).toEqual({ face: 6, loaded: [3, 8], fair: [1, 6] });
    expect(faceChances(optimist)[5]).toMatchObject({ face: 6, label: "6", chance: 0.375 });
    expect(chancesOf(groupsOf(optimist)[0])[5]).toBe(3 / 8);
    const pair = exactCounts(spec("2d6{6:3}"));
    expect(pair.outcomes).toBe(64n);
    expect(pair.counts.at(-1)).toBe(9n);
    expect(page).toContain("roll=1d6%7B6%3A3%7D");
  });

  it("the house dice are the presets, word for word", () => {
    for (const preset of LOADED_PRESETS) {
      expect(page).toContain(`**${preset.name}**, \`${preset.notation}\`.`);
      expect(page.replace(/\n {2}/g, " ")).toContain(preset.says);
    }
    const couple = spec("2d6{2:0,4:0,6:0}");
    expect(chanceExactly(couple, 7)).toBe(0);
    expect([distributionOf(couple).min, distributionOf(couple).max]).toEqual([2, 10]);
  });

  it("the fairness test gives the figures printed", () => {
    const a = fairnessTest([82, 95, 103, 98, 104, 118]);
    expect([a.rolls, a.statistic.toFixed(2), a.p.toFixed(3), a.verdict]).toEqual([600, "7.02", "0.219", "fair"]);
    const b = fairnessTest([58, 28, 41, 36, 47, 30]);
    expect([b.rolls, b.statistic.toFixed(2), b.p.toFixed(4), b.verdict]).toEqual([240, "15.85", "0.0073", "unusual"]);
    const c = fairnessTest([30, 30, 30, 30, 30, 90]);
    expect([c.rolls, c.statistic, c.p.toFixed(16), c.verdict]).toEqual([240, 75, "0.0000000000000093", "lopsided"]);
    for (const line of ["statistic 7.02 · p 0.219", "statistic 15.85 · p 0.0073", "statistic 75 · p 0.0000000000000093"]) expect(page).toContain(line);
    const typed = readResults("3 5 6 6 1");
    expect(typed.counts).toEqual([1, 0, 1, 0, 1, 2]);
    expect(fairnessTest(typed.counts)).toMatchObject({ verdict: "too-few", rolls: 5, minimum: 30, p: null });
    expect(fairnessTest(new Array(20).fill(1)).minimum).toBe(100);
  });

  it("catches the Optimist, and clears the fair die, from the seeds it names", () => {
    const count = (notation, seed) => {
      const source = seededSource(seed);
      const counts = [0, 0, 0, 0, 0, 0];
      for (let i = 0; i < 240; i++) counts[roll(spec(notation), source).total - 1] += 1;
      return counts;
    };
    const suspect = count("d6{6:3}", "suspect");
    expect(suspect).toEqual([31, 21, 34, 21, 34, 99]);
    expect(fairnessTest(suspect).verdict).toBe("lopsided");
    const honest = count("1d6", "honest");
    expect(honest).toEqual([33, 44, 44, 39, 42, 38]);
    expect(fairnessTest(honest).verdict).toBe("fair");
    expect(page).toContain("[31, 21, 34, 21, 34, 99]");
    expect(page).toContain("[33, 44, 44, 39, 42, 38]");
    expect(12 * 26306).toBe(315672);
  });
});

describe("the migration note", () => {
  const note = readFileSync("docs/migrating.md", "utf8");

  it("says what r and ro average, and they do", () => {
    expect(expectedTotal(parseNotation("2d8r<3"))).toBeCloseTo(11.0, 5);
    expect(expectedTotal(parseNotation("2d8ro<3"))).toBeCloseTo(10.5, 12);
    expect(note).toContain("its average is 11.0\nwhere `2d8ro<3` averages 10.5");
    expect(parseNotation("2d8r<3", { legacyReroll: true })).toEqual(parseNotation("2d8ro<3"));
    expect(parseNotation("1d6r<4")).not.toBeNull();
    expect(parseNotation("1d6r<5")).toBeNull();
  });
});

describe("the list of Japanese strings", () => {
  const lines = [
    "# The tray's words, in English and Japanese",
    "",
    "Made from `src/ui/strings.ts` by `pnpm docs:make`; a test fails if the two differ, so this list is never out of date.",
    "",
    "**The Japanese has not yet been reviewed by a native reader.** If a line reads wrongly or unnaturally, please",
    "open a *Fix a translation* issue with the string's name. `{n}` and the other braces are filled in when shown.",
    "",
    "| Name | English | Japanese |",
    "| --- | --- | --- |",
    ...Object.keys(STRINGS.en).map((key) => `| \`${key}\` | ${STRINGS.en[key].replace(/\|/g, "\\|")} | ${STRINGS.ja[key].replace(/\|/g, "\\|")} |`),
    "",
  ];
  const made = lines.join("\n");

  it("is what the source makes: run `pnpm docs:make` after changing a string", () => {
    if (process.env.UPDATE_DOCS === "1") writeFileSync("docs/strings-ja.md", made);
    expect(readFileSync("docs/strings-ja.md", "utf8")).toBe(made);
  });

  it("has a Japanese line for every English one, and keeps every place to fill in", () => {
    expect(Object.keys(STRINGS.ja)).toEqual(Object.keys(STRINGS.en));
    for (const key of Object.keys(STRINGS.en)) {
      const places = (text) => [...new Set([...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();
      expect(places(STRINGS.ja[key]), key).toEqual(places(STRINGS.en[key]));
      expect(STRINGS.ja[key].trim(), key).not.toBe("");
    }
  });
});

describe("the README on rolling a set and on games", () => {
  it("the three lines at the top", () => {
    expect(readme).toContain('rollPreset("yahtzee").reading.text;        // "A full house", "Chance, for 13", …');
    const thrown = rollPreset("yahtzee", { source: seededSource("table") });
    expect(thrown.roll.faces).toEqual([1, 2, 1, 5, 4]);
    expect(thrown.reading.text).toBe("Chance, for 13");
    expect(readme).toContain('rollPreset("チンチロリン", { language: "ja" })');
    expect(rollPreset("チンチロリン", { language: "ja", source: seededSource("table") }).reading.text).toBe("1 のペアで、目は 2");
    expect(readme).toContain("crapsPass();                                // [244n, 495n]");
    expect(crapsPass()).toEqual([244n, 495n]);
  });

  it("a set of rolls", () => {
    const scores = rollMany(parseNotation("4d6dl1"), 6, seededSource("table"));
    expect(readme).toContain("scores.rolls.map((r) => r.total);   // [8, 12, 11, 9, 13, 12]");
    expect(scores.rolls.map((r) => r.total)).toEqual([8, 12, 11, 9, 13, 12]);
    expect(readme).toContain("scores.sum;                         // 65");
    expect([scores.sum, scores.highest, scores.lowest]).toEqual([65, 13, 8]);
    expect(rollMany(parseNotation("6#4d6dl1"), undefined, seededSource("table")).rolls.map((r) => r.total)).toEqual([8, 12, 11, 9, 13, 12]);
    expect(readme).toContain("chanceAnyAtLeast(parseNotation(\"4d6dl1\")!, 18, 6);  // 0.0934");
    expect(chanceAnyAtLeast(parseNotation("4d6dl1"), 18, 6)).toBeCloseTo(0.0934, 4);
    expect(readme).toContain("expectedHighest(parseNotation(\"4d6dl1\")!, 6);       // 15.66");
    expect(expectedHighest(parseNotation("4d6dl1"), 6)).toBeCloseTo(15.66, 2);
    expect(readme).toContain(`| 1 to ${MAX_TIMES} (1 to 10 in the tray) | \`MAX_TIMES\` |`);
    expect(checkNotation("0#2d6").message).toBe("“0#”: a roll is thrown 1 to 100 times");
  });

  it("the games it names are there, by any of their names", () => {
    expect(readme).toContain(`${PRESETS.length} games`);
    expect(getPreset("Yacht")).toBe(getPreset("yahtzee"));
    expect(getPreset("Settlers of Catan")?.id).toBe("catan");
    expect(presetOdds(getPreset("craps")).map((o) => `${o.ways}/${o.outOf}`).sort()).toEqual(["24/36", "4/36", "8/36"]);
  });
});

describe("the gallery of games", () => {
  const shelves = [
    ["board", "Board games"],
    ["dice", "Dice games"],
    ["traditional", "Traditional games"],
    ["cards", "Beside a card table"],
    ["roleplaying", "Roleplaying games"],
    ["handy", "Handy dice"],
  ];
  const percent = (n) => `${(n * 100).toFixed(n < 0.01 ? 2 : 1)}%`;
  const further = { yahtzee: ["A Yahtzee within the three rolls, holding the most of a kind each time", yahtzeeWithin(3)], craps: ["The shooter passes: a natural, or the point before a seven", crapsPass()], chinchirorin: ["A hand within three throws", chinchirorinHandWithin(3)] };
  const lines = [
    "# Games",
    "",
    "Made from `src/games/presets.ts` by `pnpm docs:make`; a test fails if the two differ, so this page is never out of date.",
    "",
    `Korokoro knows the dice of ${PRESETS.length} games: which dice are thrown, and how the game reads them. Choose one under **Games** in the tray,`,
    "open it by a link (`?game=yahtzee`), or call `rollPreset(\"yahtzee\")`. Any of a game's names finds it.",
    "",
    "**Korokoro rolls and reads the dice; it does not run the game.** Whose turn it is, the board and the score sheet stay on your table.",
    "The odds are exact: every way the dice can fall is counted, never sampled.",
    "",
    "**Is your game missing? [Tell us](https://github.com/johnmorrisdotca/korokoro/issues/new?template=suggest-a-game.md).** A game is one line of data",
    "and a test; [CONTRIBUTING](../CONTRIBUTING.md#adding-a-game) shows how.",
    "",
    "Game names are trademarks of their owners and are used here only to say which game's dice these are. Korokoro is not affiliated with",
    "or endorsed by any of them. The rules are described in our own words, with a link to where each can be read.",
    "",
    ...shelves.map(([family, title]) => `- [${title}](#${title.toLowerCase().replace(/ /g, "-")}): ${PRESETS.filter((p) => p.family === family).map((p) => p.name).join(", ")}`),
    "",
  ];
  for (const [family, title] of shelves) {
    lines.push(`## ${title}`, "");
    for (const preset of PRESETS.filter((p) => p.family === family)) {
      const spec = presetSpec(preset);
      lines.push(`### ${preset.name}`, "");
      lines.push(`\`${preset.id}\` · dice \`${preset.notation}\` · ${preset.nameJa}${preset.aliases.length > 0 ? ` · also found as ${preset.aliases.join(", ")}` : ""}`, "");
      lines.push(preset.says, "", preset.how, "");
      if (preset.rolls !== undefined) lines.push(`A turn is up to ${preset.rolls} rolls, and the tray holds the dice you tap between them.`, "");
      const odds = presetOdds(preset);
      if (odds !== null) {
        lines.push("| A roll comes out | Chance | Ways |", "| --- | ---: | ---: |");
        for (const line of [...odds].sort((a, b) => (b.ways > a.ways ? 1 : b.ways < a.ways ? -1 : 0))) lines.push(`| ${line.text.replace(/\|/g, "\\|")} | ${percent(line.chance)} | ${line.ways} of ${line.outOf} |`);
        const more = further[preset.id];
        if (more !== undefined) lines.push(`| ${more[0]} | ${percent(Number(more[1][0]) / Number(more[1][1]))} | ${more[1][0]} of ${more[1][1]} |`);
        lines.push("");
      } else if (hasTotal(spec) && preset.total) {
        const odds = distributionOf(spec);
        const likely = mostLikely(odds);
        const top = Math.max(...odds.probabilities);
        lines.push(`Totals run from ${odds.min} to ${odds.max}, ${expectedTotal(odds).toFixed(2).replace(/\.?0+$/, "")} on average${(spec.times ?? 1) > 1 ? ` for each of the ${spec.times} rolls` : ""}; the likeliest ${likely.length > 3 ? "are all as likely as each other" : `${likely.length > 1 ? "are" : "is"} ${likely.join(" and ")}`}, at ${percent(top)}${likely.length > 1 ? " each" : ""}.`, "");
      }
      lines.push(preset.source === undefined ? "No rule to cite: the dice say it all." : `Rules: <${preset.source}>`, "");
    }
  }
  const made = lines.join("\n");

  it("is what the source makes: run `pnpm docs:make` after changing a game", () => {
    if (process.env.UPDATE_DOCS === "1") writeFileSync("docs/games.md", made);
    expect(readFileSync("docs/games.md", "utf8")).toBe(made);
  });
});

describe("the page comparing notations", () => {
  const page = readFileSync("docs/notation-compared.md", "utf8");
  const rows = page.split("\n").filter((line) => line.startsWith("| ") && (line.includes("**yes**") || line.includes("**not yet**")));

  it("rolls everything it says it rolls, and refuses everything it says is still to come", () => {
    expect(rows.length).toBeGreaterThan(25);
    for (const row of rows) {
      const cells = row.split(/(?<!\\)\|/);
      for (const text of codes(cells[2])) expect(checkNotation(text).ok, text).toBe(cells[3].includes("**yes**"));
    }
  });
});

describe("the version", () => {
  it("is the same in the package and in the code", async () => {
    const { VERSION } = await import("./version.ts");
    expect(VERSION).toBe(JSON.parse(readFileSync("package.json", "utf8")).version);
    expect(readFileSync("CHANGELOG.md", "utf8")).toContain(`## [${VERSION}]`);
    // And wherever a document shows the version being written out.
    expect(readFileSync("docs/other-languages.md", "utf8")).toContain(`"generator": "korokoro ${VERSION}"`);
    expect(readme).toContain(`"generator": "korokoro ${VERSION}"`);
  });
});

describe("the README on the command line and export", () => {
  /** Each command shown after a `$`, with what is printed under it up to the next blank line. */
  const shown = [...readme.matchAll(/^\$ koro (.+)\n((?:.+\n)+)/gm)].map((m) => ({ args: m[1], printed: m[2] }));
  const run = (args) => runCli(args.match(/"[^"]*"|\S+/g).map((a) => a.replace(/^"|"$/g, "")), { now: 0 });

  it("prints what it shows being printed", () => {
    expect(shown.length).toBeGreaterThanOrEqual(5);
    for (const { args, printed } of shown) {
      const { code, out } = run(args);
      expect(code, args).toBe(0);
      // A listing cut short with an ellipsis is checked as far as it goes.
      const lines = printed.split("\n").filter((line) => line.trim() !== "…" && !line.startsWith("```"));
      expect(out.startsWith(lines.join("\n")), `${args}\n${out}`).toBe(true);
    }
  });

  it("the one-line roll at the top", () => {
    expect(readme).toContain("npx @johnmorrisdotca/korokoro 2d20kh1+5 --seed table   # 2d20kh1+5: 24  [19 (12)]");
    expect(run("2d20kh1+5 --seed table").out).toBe("2d20kh1+5: 24  [19 (12)]\n");
  });

  it("names every option the help does", () => {
    const help = run("--help").out;
    for (const flag of [...help.matchAll(/--[a-z-]+/g)].map((m) => m[0])) expect(readme, flag).toContain(flag);
  });

  it("the exports it prints", () => {
    const rolls = [roll(parseNotation("2d20kh1+5 # attack"), seededSource("table"), Date.UTC(2026, 8, 30, 12)), roll(parseNotation("4d6dl1"), seededSource("table"), Date.UTC(2026, 8, 30, 12, 0, 5))];
    for (const line of toText(rolls).trim().split("\n")) expect(readme).toContain(line);
    for (const line of toCSV(rolls).trim().split("\r\n")) expect(readme).toContain(line);
    // The version it shows being written is this one.
    expect(readme).toContain(toJSON(rolls).split("\n")[2].trim().replace(/,$/, ""));
    expect(run("--stdin --json --seed table").code).toBe(0);
  });
});

describe("the README on formulas and many dice", () => {
  it("half of 4d6 from table-7", () => {
    const half = roll(parseNotation("floor(4d6/2)"), seededSource("table-7"));
    expect(readme).toContain("half.faces;                       // [6, 4, 2, 1]");
    expect([half.faces, half.total]).toEqual([[6, 4, 2, 1], 6]);
    expect(rangeOf(half.spec)).toEqual({ min: 2, max: 12 });
    expect(readme).toContain("expectedTotal(half.spec);         // 6.75");
    expect(expectedTotal(half.spec)).toBeCloseTo(6.75, 12);
    expect(readme).toContain("chanceAtLeast(half.spec, 8);      // 0.3356");
    expect(chanceAtLeast(half.spec, 8)).toBeCloseTo(0.3356, 4);
    expect(formatNotation(parseNotation("(2d6+3)"))).toBe("2d6+3");
    expect(formatNotation(parseNotation("3+2d6"))).toBe("2d6+3");
    expect(formatNotation(parseNotation("{4d6,3d8}kh1"))).toBe("max(4d6,3d8)");
    expect(checkNotation("4d6/2").message).toContain("floor(…), ceil(…) or round(…)");
    expect(distributionOf(parseNotation("6d6u"))).toEqual({ min: 21, max: 21, probabilities: [1] });
  });

  it("forty dice", () => {
    const volley = parseNotation("40d6", { maxDice: 100 });
    expect(parseNotation("40d6")).toBeNull();
    expect(normalizeSpec({ count: 40, sides: 6 }, { maxDice: 100 }).count).toBe(40);
    expect(normalizeSpec({ count: 40, sides: 6 }).count).toBe(10);
    expect(roll(volley, seededSource("table"), { maxDice: 100 }).faces).toHaveLength(40);
    expect(roll(volley, seededSource("table")).faces).toHaveLength(10);
    expect(readme).toContain("`roll({ count: 50, sides: 6 })`\nthrows ten dice");
    expect(roll({ count: 50, sides: 6 }).faces).toHaveLength(10);
    expect(readme).toContain("expectedTotal(volley);            // 140");
    expect(expectedTotal(volley)).toBeCloseTo(140, 9);
    expect(readme).toContain("chanceAtLeast(volley, 150);       // 0.1902");
    expect(chanceAtLeast(volley, 150)).toBeCloseTo(0.1902, 4);
    expect(String(exactCounts(volley).outcomes)).toHaveLength(32);
    expect(exactCounts(volley).outcomes).toBe(6n ** 40n);
    expect(parseNotation("100d20kh1", { maxDice: 100 })).not.toBeNull();
  });
});

describe("the README on the web component and the Vue component", () => {
  it("names every attribute the element watches, and no other", async () => {
    const { KorokoroRoller } = await import("./element.ts");
    const rows = table("### 5. A web component");
    const named = rows.flatMap(([cell]) => codes(cell).map((text) => text.split("=")[0]));
    expect([...named].sort()).toEqual([...KorokoroRoller.observedAttributes].sort());
  });

  it("names the exports it imports from", () => {
    const { exports } = JSON.parse(readFileSync("package.json", "utf8"));
    for (const entry of ["./element", "./vue", "./react"]) {
      expect(exports, entry).toHaveProperty(entry);
      expect(readme).toContain(`@johnmorrisdotca/korokoro/${entry.slice(2)}`);
    }
  });
});

describe("the package's entries", () => {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));

  it("lists the one module that does something when imported, so that a bundler keeps it", () => {
    expect(pkg.sideEffects).toEqual(["./dist/element-define.js"]);
    expect(pkg.exports["./element/define"].import).toBe("./dist/element-define.js");
    // No other source module registers the element or touches the page as it loads.
    expect(readFileSync("src/element.ts", "utf8")).not.toMatch(/^defineRoller\(\)/m);
    expect(readFileSync("src/element-define.ts", "utf8")).toMatch(/^defineRoller\(\);$/m);
  });

  it("names dist for every entry, never src: what is published is what is pointed at", () => {
    for (const entry of Object.values(pkg.exports)) for (const file of Object.values(entry)) expect(file).toMatch(/^\.\/dist\//);
    expect(pkg.main).toMatch(/^\.\/dist\//);
    expect(pkg).not.toHaveProperty("publishConfig.exports");
  });
});

describe("the family's shared stylesheet", () => {
  it("is the copy its first line says it is, unedited", () => {
    const [first, ...rest] = readFileSync("demo/family.css", "utf8").split("\n");
    const recorded = /sha256 of every line after this one: ([0-9a-f]{64})/.exec(first)?.[1];
    expect(recorded).toBeDefined();
    expect(createHash("sha256").update(rest.join("\n")).digest("hex")).toBe(recorded);
  });

  it("is what the demo loads, before the page's own", () => {
    const page = readFileSync("demo/index.html", "utf8");
    expect(page.indexOf('href="family.css"')).toBeGreaterThan(0);
    expect(page.indexOf('href="site.css"')).toBeGreaterThan(page.indexOf('href="family.css"'));
    expect(page).not.toContain("<style>");
  });
});

describe("the page on other languages", () => {
  const page = readFileSync("docs/other-languages.md", "utf8");

  it("shows each example exactly as the file CI runs", () => {
    for (const [fence, file] of [["python", "roll.py"], ["go", "roll.go"], ["rust", "rust/src/main.rs"], ["csharp", "csharp/Program.cs"]]) {
      expect(page, file).toContain(`\`\`\`${fence}\n${readFileSync(`docs/examples/languages/${file}`, "utf8")}\`\`\``);
    }
  });

  it("shows the JSON the command line prints, and the roll the examples expect", () => {
    const { code, out } = runCli(["2d20kh1+5", "--seed", "table", "--json"], { now: 1790000000000 });
    expect(code).toBe(0);
    const [made] = JSON.parse(out).rolls;
    const shown = JSON.parse(/```json\n([\s\S]*?)```/.exec(page)[1].replace('"…"', JSON.stringify(made.id)));
    expect(shown.rolls[0]).toEqual(made);
    expect(shown.format).toBe(1);
    expect(made.total).toBe(24);
    expect(runCli(["--stdin", "--json", "--seed", "table"], { stdin: "2d6\n1d20+5\n4d6dl1\n" }).code).toBe(0);
  });
});

describe("the page on plain output", () => {
  const page = readFileSync("docs/plain-output.md", "utf8");
  const api = readFileSync("demo/api/index.html", "utf8");

  it("shows what the address it names shows", () => {
    expect(page).toContain("api/?roll=2d20kh1%2B5&seed=table>\n\n```\n2d20kh1+5: 24  [19 (12)]\n```");
    expect(runCli(["2d20kh1+5", "--seed", "table"]).out).toBe("2d20kh1+5: 24  [19 (12)]\n");
  });

  it("names every part of the address the page reads, and no other", () => {
    const from = page.indexOf("## The address");
    const rows = page.slice(from).split("\n").filter((line) => line.startsWith("| `"));
    const named = rows.map((row) => /^\| `([a-z-]+)/.exec(row)[1]).sort();
    const read = [...new Set([...api.matchAll(/params\.(?:get|getAll|has)\("([a-z-]+)"\)|\["([a-z-]+)", "--/g)].map((m) => m[1] ?? m[2]))].filter((name) => name !== "games").sort();
    expect(named).toEqual(read);
  });

  it("shows the CDN example as the page the browser suite opens", () => {
    const tried = readFileSync("tray/pages/cdn.html", "utf8");
    expect(page).toContain('<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/korokoro@1/dist/element-define.js"></script>');
    expect(tried).toContain('<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/korokoro@1/dist/element-define.js"></script>');
    expect(tried).toContain('import { chanceAtLeast, parseNotation, roll } from "https://cdn.jsdelivr.net/npm/@johnmorrisdotca/korokoro@1/dist/index.js";');
    expect(page).toContain('import { chanceAtLeast, parseNotation, roll } from "https://cdn.jsdelivr.net/npm/@johnmorrisdotca/korokoro@1/dist/index.js";');
    expect(readme).toContain('<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/korokoro@1/dist/element-define.js"></script>');
  });
});

describe("the README on Dice War", () => {
  it("shows what the example prints, and the limits the code holds", async () => {
    const dw = await import("./diceWar.ts");
    let game = dw.startDiceWar({ players: ["You", "Aiko", "Ben"], computers: [false, true, true], seed: "table", to: 5 });
    game = dw.playDiceWar(game, { faces: { "0": [4] } });
    expect(readme).toContain("game.scores;                                          // [0, 1, 0]: Aiko took the round");
    expect(game.scores).toEqual([0, 1, 0]);
    expect(readme).toContain("diceWarPeopleToRoll(game);                            // [0]: only you have dice to hand in");
    expect(dw.diceWarPeopleToRoll(game)).toEqual([0]);
    expect(dw.decodeDiceWar(dw.encodeDiceWar(game))).toEqual(game);
    expect(readme).toContain("diceWarOdds({ players: 3 }).war;                      // 0.2361…: one throw in 4.2 ties for highest");
    expect(dw.diceWarOdds({ players: 3 }).war).toBeCloseTo(0.2361, 4);
    expect(1 / dw.diceWarOdds({ players: 3 }).war).toBeCloseTo(4.2, 1);
    expect(readme).toContain("diceWarOdds({ players: 3 }, 4).beats;                 // 0.25: a 4 beats both of the others a quarter of the time");
    expect(dw.diceWarOdds({ players: 3 }, 4).beats).toBeCloseTo(0.25, 12);
    expect(dw.DICE_WAR_LIMITS).toMatchObject({ fewestPlayers: 2, mostPlayers: 8, mostDice: 10, mostPoints: 100, mostRounds: 200, mostWars: 100 });
    for (const text of ["| Players | 2 to 8 |", "| Dice each | 1 to 10, of 2 to 1000 sides |", "| A game to a score | 1 to 100 points |", "| A game for rounds | 1 to 200 |", "| Wars in one round | 100, then it is called off with nobody scoring |"]) expect(readme, text).toContain(text);
  });

  it("names every export of Dice War in the API, and the option and attribute that turn it on", async () => {
    const dw = await import("./diceWar.ts");
    for (const name of Object.keys(dw)) expect(readme, name).toContain(name);
    expect(readme).toContain("| `diceWar` | `false` |");
    expect(readme).toContain("| `dice-war` |");
    const { KorokoroRoller } = await import("./element.ts");
    expect(KorokoroRoller.observedAttributes).toContain("dice-war");
  });
});

describe("the README's promises about the repository", () => {
  const section = (heading) => {
    const from = readme.indexOf(`\n## ${heading}\n`);
    if (from < 0) throw new Error(`no section “${heading}”`);
    const next = readme.indexOf("\n## ", from + 4);
    return readme.slice(from, next < 0 ? undefined : next);
  };

  it("has an Accessibility section with something in it", () => {
    expect(section("Accessibility").length).toBeGreaterThan(200);
  });

  it("lists every package of the family, with its kana, as the demo's footer does", () => {
    const template = readFileSync("scripts/family-template.mjs", "utf8");
    const family = [...template.matchAll(/\{ id: "([\w-]+)", name: "(\w+)", kana: "([^"]+)" \}/g)].map((match) => ({ id: match[1], name: match[2], kana: match[3] }));
    expect(family.length).toBeGreaterThanOrEqual(16);
    const block = readme.slice(readme.indexOf("### The family"), readme.indexOf("\n## ", readme.indexOf("### The family")));
    for (const { id, name, kana } of family) expect(block, id).toContain(`- [${name}](https://github.com/johnmorrisdotca/${id}) (${kana}`);
    const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "twenty-one", "twenty-two"];
    expect(block).toContain(`one of ${words[family.length]} packages`);
    expect([...block.matchAll(/^- \[/gm)]).toHaveLength(family.length);
  });

  it("says Node 22 or later wherever it names a Node, and `engines` agrees", () => {
    expect(JSON.parse(readFileSync("package.json", "utf8")).engines.node).toBe(">=22");
    for (const file of ["README.md", "docs/other-languages.md", "CONTRIBUTING.md"]) expect(readFileSync(file, "utf8"), file).not.toMatch(/Node 20/);
    expect(readFileSync("CONTRIBUTING.md", "utf8")).toContain("Needs Node 22 or later.");
  });

  it("keeps SECURITY.md and CODE_OF_CONDUCT.md equal to the family's master text, a copy of which is kept in scripts/community", () => {
    for (const file of ["SECURITY.md", "CODE_OF_CONDUCT.md"]) {
      expect(existsSync(`scripts/community/${file}`), file).toBe(true);
      expect(readFileSync(file, "utf8"), file).toBe(readFileSync(`scripts/community/${file}`, "utf8"));
    }
  });

  it("tells a contributor the family's house rules", () => {
    expect(readFileSync("CONTRIBUTING.md", "utf8")).toContain("## House rules, shared by every package of the family");
  });
});
