// The documents that are made from the source, or that quote it, checked against it.
// Plain JavaScript, so that reading files needs no Node types. `pnpm docs:make` rewrites what is made.
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";

import { describe, expect, it } from "vitest";

import { roll, rollHeld } from "./dice.ts";
import { checkNotation, formatNotation, parseNotation } from "./notation.ts";
import { chanceAtLeast, chanceExactly, distributionHolding, exactCounts, expectedTotal, luckOf, mostLikely, spreadOf } from "./odds.ts";
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
    expect(readme).toContain("`4d6dl1` is\nwritten back as `4d6kh3`");
  });

  it("the refusal it quotes is the refusal given", () => {
    const refused = checkNotation("4d6!kh3");
    expect(refused).toMatchObject({ ok: false, problem: "explode", part: "!" });
    expect(readme).toContain(refused.message);
  });
});

describe("the README's examples", () => {
  const spec = (text) => parseNotation(text);

  it("the quick start's numbers", () => {
    expect(chanceAtLeast(spec("2d20kh1+5"), 15)).toBeCloseTo(0.7975, 12);
    expect(readme).toContain("chanceAtLeast(attack, 15);                  // 0.7975");
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
  const from = readme.indexOf("### Who it is for");
  const list = readme.slice(from, readme.indexOf("### What is in the package"));

  it("names notation that rolls, every piece of it", () => {
    const found = codes(list);
    expect(found).toEqual(["2d20kh1+5", "4d6dl1", "8d6", "1d20+1d4", "2d6", "5d6", "6d6", "2d6"]);
    for (const text of found) expect(roll(parseNotation(text), seededSource(text)).total, text).toBeGreaterThan(0);
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
      const places = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
      expect(places(STRINGS.ja[key]), key).toEqual(places(STRINGS.en[key]));
      expect(STRINGS.ja[key].trim(), key).not.toBe("");
    }
  });
});
