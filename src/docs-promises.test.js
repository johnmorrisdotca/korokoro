import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { FAMILY, familyRepo } from "../scripts/family-template.mjs";
import { runCli } from "./cli.ts";
import { readme } from "./docs.fixture.js";

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
    for (const entry of Object.values(pkg.exports))
      for (const file of Object.values(entry)) expect(file).toMatch(/^\.\/dist\//);
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
    expect(page.indexOf('href="korokoro.css"')).toBeGreaterThan(page.indexOf('href="family.css"'));
    expect(page).not.toContain("<style>");
  });
});

describe("the page on other languages", () => {
  const page = readFileSync("docs/other-languages.md", "utf8");

  it("shows each example exactly as the file CI runs", () => {
    for (const [fence, file] of [
      ["python", "roll.py"],
      ["go", "roll.go"],
      ["rust", "rust/src/main.rs"],
      ["csharp", "csharp/Program.cs"],
    ]) {
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

describe("the family's address for the API reference", () => {
  it("/api.html leads on to the reference in the documentation site, and /api/ stays the page that rolls dice from an address", () => {
    const page = readFileSync("demo/api.html", "utf8");
    expect(page).toContain('<meta http-equiv="refresh" content="0; url=docs/reference/" />');
    expect(page).toContain('<a href="docs/reference/">');
    expect(readFileSync("scripts/docs-site.mjs", "utf8")).toContain("apiIndexPage(model)");
    expect(readFileSync("scripts/docs-compat.mjs", "utf8")).toContain("reference/index.html");
    expect(readFileSync("demo/api/index.html", "utf8")).toContain("params.get");
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
    const rows = page
      .slice(from)
      .split("\n")
      .filter((line) => line.startsWith("| `"));
    const named = rows.map((row) => /^\| `([a-z-]+)/.exec(row)[1]).sort();
    const read = [
      ...new Set(
        [...api.matchAll(/params\.(?:get|getAll|has)\("([a-z-]+)"\)|\["([a-z-]+)", "--/g)].map((m) => m[1] ?? m[2]),
      ),
    ]
      .filter((name) => name !== "games")
      .sort();
    expect(named).toEqual(read);
  });

  it("shows the CDN example as the page the browser suite opens", () => {
    const tried = readFileSync("tray/pages/cdn.html", "utf8");
    expect(page).toContain(
      '<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/korokoro@1/dist/element-define.js"></script>',
    );
    expect(tried).toContain(
      '<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/korokoro@1/dist/element-define.js"></script>',
    );
    expect(tried).toContain(
      'import { chanceAtLeast, parseNotation, roll } from "https://cdn.jsdelivr.net/npm/@johnmorrisdotca/korokoro@1/dist/index.js";',
    );
    expect(page).toContain(
      'import { chanceAtLeast, parseNotation, roll } from "https://cdn.jsdelivr.net/npm/@johnmorrisdotca/korokoro@1/dist/index.js";',
    );
    expect(readme).toContain(
      '<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/korokoro@1/dist/element-define.js"></script>',
    );
  });
});

describe("the README on Dice War", () => {
  it("shows what the example prints, and the limits the code holds", async () => {
    const dw = await import("./diceWar.ts");
    let game = dw.startDiceWar({
      players: ["You", "Aiko", "Ben"],
      computers: [false, true, true],
      seed: "table",
      to: 5,
    });
    game = dw.playDiceWar(game, { faces: { 0: [4] } });
    expect(readme).toContain("game.scores;                                          // [0, 1, 0]: Aiko took the round");
    expect(game.scores).toEqual([0, 1, 0]);
    expect(readme).toContain(
      "diceWarPeopleToRoll(game);                            // [0]: only you have dice to hand in",
    );
    expect(dw.diceWarPeopleToRoll(game)).toEqual([0]);
    expect(dw.decodeDiceWar(dw.encodeDiceWar(game))).toEqual(game);
    expect(readme).toContain(
      "diceWarOdds({ players: 3 }).war;                      // 0.2361…: one throw in 4.2 ties for highest",
    );
    expect(dw.diceWarOdds({ players: 3 }).war).toBeCloseTo(0.2361, 4);
    expect(1 / dw.diceWarOdds({ players: 3 }).war).toBeCloseTo(4.2, 1);
    expect(readme).toContain(
      "diceWarOdds({ players: 3 }, 4).beats;                 // 0.25: a 4 beats both of the others a quarter of the time",
    );
    expect(dw.diceWarOdds({ players: 3 }, 4).beats).toBeCloseTo(0.25, 12);
    expect(dw.DICE_WAR_LIMITS).toMatchObject({
      fewestPlayers: 2,
      mostPlayers: 8,
      mostDice: 10,
      mostPoints: 100,
      mostRounds: 200,
      mostWars: 100,
    });
    for (const text of [
      "| Players | 2 to 8 |",
      "| Dice each | 1 to 10, of 2 to 1000 sides |",
      "| A game to a score | 1 to 100 points |",
      "| A game for rounds | 1 to 200 |",
      "| Wars in one round | 100, then it is called off with nobody scoring |",
    ])
      expect(readme, text).toContain(text);
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
    const family = FAMILY;
    expect(family.length).toBeGreaterThanOrEqual(16);
    const block = readme.slice(
      readme.indexOf("### The family"),
      readme.indexOf("\n## ", readme.indexOf("### The family")),
    );
    for (const { id, name, kana } of family) expect(block, id).toContain(`- [${name}](${familyRepo(id)}) (${kana}`);
    const words = [
      "zero",
      "one",
      "two",
      "three",
      "four",
      "five",
      "six",
      "seven",
      "eight",
      "nine",
      "ten",
      "eleven",
      "twelve",
      "thirteen",
      "fourteen",
      "fifteen",
      "sixteen",
      "seventeen",
      "eighteen",
      "nineteen",
      "twenty",
      "twenty-one",
      "twenty-two",
      "twenty-three",
      "twenty-four",
      "twenty-five",
      "twenty-six",
      "twenty-seven",
      "twenty-eight",
      "twenty-nine",
      "thirty",
      "thirty-one",
      "thirty-two",
    ];
    expect(block).toContain(`one of ${words[family.length]} packages`);
    expect([...block.matchAll(/^- \[/gm)]).toHaveLength(family.length);
  });

  it("says Node 22 or later wherever it names a Node, and `engines` agrees", () => {
    expect(JSON.parse(readFileSync("package.json", "utf8")).engines.node).toBe(">=22");
    for (const file of ["README.md", "docs/other-languages.md", "CONTRIBUTING.md"])
      expect(readFileSync(file, "utf8"), file).not.toMatch(/Node 20/);
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
