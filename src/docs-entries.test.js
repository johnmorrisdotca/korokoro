import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { describe, expect, it } from "vitest";
import { runCli } from "./cli.ts";
import { hasTotal, MAX_TIMES, normalizeSpec, rangeOf, roll, rollMany } from "./dice.ts";
import { codes, readme, table } from "./docs.fixture.js";
import { toCSV, toJSON, toText } from "./export.ts";
import { chinchirorinHandWithin, crapsPass, yahtzeeWithin } from "./games/odds.ts";
import { getPreset, PRESETS, presetOdds, presetSpec, rollPreset } from "./games/presets.ts";
import { checkNotation, formatNotation, parseNotation } from "./notation.ts";
import {
  chanceAnyAtLeast,
  chanceAtLeast,
  distributionOf,
  exactCounts,
  expectedHighest,
  expectedTotal,
  mostLikely,
} from "./odds.ts";
import { seededSource } from "./random.ts";
import { STRINGS } from "./ui/strings.ts";

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
    ...Object.keys(STRINGS.en).map(
      (key) => `| \`${key}\` | ${STRINGS.en[key].replace(/\|/g, "\\|")} | ${STRINGS.ja[key].replace(/\|/g, "\\|")} |`,
    ),
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
    expect(rollPreset("チンチロリン", { language: "ja", source: seededSource("table") }).reading.text).toBe(
      "1 のペアで、目は 2",
    );
    expect(readme).toContain("crapsPass();                                // [244n, 495n]");
    expect(crapsPass()).toEqual([244n, 495n]);
  });

  it("a set of rolls", () => {
    const scores = rollMany(parseNotation("4d6dl1"), 6, seededSource("table"));
    expect(readme).toContain("scores.rolls.map((r) => r.total);   // [8, 12, 11, 9, 13, 12]");
    expect(scores.rolls.map((r) => r.total)).toEqual([8, 12, 11, 9, 13, 12]);
    expect(readme).toContain("scores.sum;                         // 65");
    expect([scores.sum, scores.highest, scores.lowest]).toEqual([65, 13, 8]);
    expect(rollMany(parseNotation("6#4d6dl1"), undefined, seededSource("table")).rolls.map((r) => r.total)).toEqual([
      8, 12, 11, 9, 13, 12,
    ]);
    expect(readme).toContain('chanceAnyAtLeast(parseNotation("4d6dl1")!, 18, 6);  // 0.0934');
    expect(chanceAnyAtLeast(parseNotation("4d6dl1"), 18, 6)).toBeCloseTo(0.0934, 4);
    expect(readme).toContain('expectedHighest(parseNotation("4d6dl1")!, 6);       // 15.66');
    expect(expectedHighest(parseNotation("4d6dl1"), 6)).toBeCloseTo(15.66, 2);
    expect(readme).toContain(`| 1 to ${MAX_TIMES} (1 to 10 in the tray) | \`MAX_TIMES\` |`);
    expect(checkNotation("0#2d6").message).toBe("“0#”: a roll is thrown 1 to 100 times");
  });

  it("the games it names are there, by any of their names", () => {
    expect(readme).toContain(`${PRESETS.length} games`);
    expect(getPreset("Yacht")).toBe(getPreset("yahtzee"));
    expect(getPreset("Settlers of Catan")?.id).toBe("catan");
    expect(
      presetOdds(getPreset("craps"))
        .map((o) => `${o.ways}/${o.outOf}`)
        .sort(),
    ).toEqual(["24/36", "4/36", "8/36"]);
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
  const further = {
    yahtzee: ["A Yahtzee within the three rolls, holding the most of a kind each time", yahtzeeWithin(3)],
    craps: ["The shooter passes: a natural, or the point before a seven", crapsPass()],
    chinchirorin: ["A hand within three throws", chinchirorinHandWithin(3)],
  };
  const lines = [
    "# Games",
    "",
    "Made from `src/games/presets.ts` by `pnpm docs:make`; a test fails if the two differ, so this page is never out of date.",
    "",
    `Korokoro knows the dice of ${PRESETS.length} games: which dice are thrown, and how the game reads them. Choose one under **Games** in the tray,`,
    'open it by a link (`?game=yahtzee`), or call `rollPreset("yahtzee")`. Any of a game\'s names finds it.',
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
    ...shelves.map(
      ([family, title]) =>
        `- [${title}](#${title.toLowerCase().replace(/ /g, "-")}): ${PRESETS.filter((p) => p.family === family)
          .map((p) => p.name)
          .join(", ")}`,
    ),
    "",
  ];
  for (const [family, title] of shelves) {
    lines.push(`## ${title}`, "");
    for (const preset of PRESETS.filter((p) => p.family === family)) {
      const spec = presetSpec(preset);
      lines.push(`### ${preset.name}`, "");
      lines.push(
        `\`${preset.id}\` · dice \`${preset.notation}\` · ${preset.nameJa}${preset.aliases.length > 0 ? ` · also found as ${preset.aliases.join(", ")}` : ""}`,
        "",
      );
      lines.push(preset.says, "", preset.how, "");
      if (preset.rolls !== undefined)
        lines.push(`A turn is up to ${preset.rolls} rolls, and the tray holds the dice you tap between them.`, "");
      const odds = presetOdds(preset);
      if (odds !== null) {
        lines.push("| A roll comes out | Chance | Ways |", "| --- | ---: | ---: |");
        for (const line of [...odds].sort((a, b) => (b.ways > a.ways ? 1 : b.ways < a.ways ? -1 : 0)))
          lines.push(
            `| ${line.text.replace(/\|/g, "\\|")} | ${percent(line.chance)} | ${line.ways} of ${line.outOf} |`,
          );
        const more = further[preset.id];
        if (more !== undefined)
          lines.push(
            `| ${more[0]} | ${percent(Number(more[1][0]) / Number(more[1][1]))} | ${more[1][0]} of ${more[1][1]} |`,
          );
        lines.push("");
      } else if (hasTotal(spec) && preset.total) {
        const odds = distributionOf(spec);
        const likely = mostLikely(odds);
        const top = Math.max(...odds.probabilities);
        lines.push(
          `Totals run from ${odds.min} to ${odds.max}, ${expectedTotal(odds)
            .toFixed(2)
            .replace(
              /\.?0+$/,
              "",
            )} on average${(spec.times ?? 1) > 1 ? ` for each of the ${spec.times} rolls` : ""}; the likeliest ${likely.length > 3 ? "are all as likely as each other" : `${likely.length > 1 ? "are" : "is"} ${likely.join(" and ")}`}, at ${percent(top)}${likely.length > 1 ? " each" : ""}.`,
          "",
        );
      }
      lines.push(
        preset.source === undefined ? "No rule to cite: the dice say it all." : `Rules: <${preset.source}>`,
        "",
      );
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
  const rows = page
    .split("\n")
    .filter((line) => line.startsWith("| ") && (line.includes("**yes**") || line.includes("**not yet**")));

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
  const run = (args) =>
    runCli(
      args.match(/"[^"]*"|\S+/g).map((a) => a.replace(/^"|"$/g, "")),
      { now: 0 },
    );

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
    const rolls = [
      roll(parseNotation("2d20kh1+5 # attack"), seededSource("table"), Date.UTC(2026, 8, 30, 12)),
      roll(parseNotation("4d6dl1"), seededSource("table"), Date.UTC(2026, 8, 30, 12, 0, 5)),
    ];
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
