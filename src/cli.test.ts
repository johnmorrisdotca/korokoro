import { describe, expect, it } from "vitest";

import { cliLanguage, runCli } from "./cli.ts";
import { EXPORT_FORMAT, fromJSON } from "./export.ts";
import { PRESETS } from "./games/presets.ts";
import { VERSION } from "./version.ts";

const now = Date.UTC(2026, 8, 30, 12, 0, 0);
const run = (args: string, around: Parameters<typeof runCli>[1] = {}) => runCli(args === "" ? [] : args.split(" "), { now, ...around });

describe("the command line rolls dice", () => {
  it("rolls 2d6 when asked for nothing", () => {
    const { code, out, err } = run("");
    expect([code, err]).toEqual([0, ""]);
    expect(out).toMatch(/^2d6: \d+ {2}\[\d \d\]\n$/);
  });

  it("throws the same dice from the same seed, in the order asked for", () => {
    const once = run("4d6dl1 1d20 --seed table");
    expect(once).toEqual(run("4d6dl1 1d20 -s table"));
    expect(once).toEqual(run("--seed=table 4d6dl1 1d20"));
    expect(once.out).toBe("4d6kh3: 8  [1 2 (1) 5]\n1d20: 18  [18]\n");
    expect(run("4d6dl1 1d20 --seed other").out).not.toBe(once.out);
  });

  it("rolls a set, by the notation or by --times, and sums it", () => {
    const set = run("6#4d6dl1 -s table");
    expect(set.out.split("\n")).toHaveLength(8);
    expect(set.out).toMatch(/ {2}sum \d+ · highest \d+ · lowest \d+\n$/);
    expect(run("4d6dl1 -t 6 -s table").out).toBe(set.out);
    expect(run("4d6dl1 --times 0").code).toBe(2);
    expect(run("4d6dl1 --times 101").code).toBe(2);
    expect(run("4d6dl1 --times many").err).toContain("--times takes a whole number from 1 to 100");
  });

  it("reads everything the notation does", () => {
    expect(run("6d10>=8f=1 -s table").out).toMatch(/^6d10>=8f=1: -?\d+ {2}\[/);
    expect(run("d[Yes,No,Maybe] -s table").out).toMatch(/^1d\[Yes,No,Maybe\]: (Yes|No|Maybe)\n$/);
    expect(run("1d6{6:3} -s table").out).toContain("(loaded dice)");
    expect(runCli(["2d6 + 3 # fire damage", "-s", "table"], { now }).out).toMatch(/^2d6\+3 # fire damage: \d+/);
    // A roll written with a minus sign in front is dice, not an option.
    expect(run("-1d6 -s table").out).toMatch(/^-1d6: -\d {2}-\[\d\]\n$/);
    expect(run("(2d6+3)*2 -s table").out).toBe("(2d6+3)*2: 12  ([1 2]+3)*2\n");
  });

  it("says what it cannot roll, on standard error, and rolls the rest", () => {
    const mixed = run("11d6 2d6 -s table");
    expect(mixed.code).toBe(1);
    expect(mixed.err).toBe("korokoro: 11d6: “11”: roll 1 to 10 dice at a time\n");
    expect(mixed.out).toMatch(/^2d6: \d+/);
    expect(run("nonsense").err).toBe("korokoro: “nonsense”: this is not dice notation\n");
  });

  it("refuses a command it does not know, with exit code 2", () => {
    expect(run("--bogus")).toEqual({ code: 2, out: "", err: "korokoro: unknown option --bogus\nTry `koro --help`.\n" });
    expect(run("2d6 --seed")).toMatchObject({ code: 2, err: "korokoro: --seed needs a value\nTry `koro --help`.\n" });
    expect(run("2d6 --json --csv").code).toBe(2);
    expect(run("2d6 --lang fr").code).toBe(2);
  });

  it("helps, and says its version", () => {
    const help = run("--help");
    expect(help.code).toBe(0);
    for (const flag of ["--seed", "--times", "--odds", "--game", "--games", "--test", "--sides", "--json", "--csv", "--stdin", "--lang", "--no-color", "--help", "--version"]) expect(help.out, flag).toContain(flag);
    expect(run("-h").out).toBe(help.out);
    expect(run("--version")).toEqual({ code: 0, out: `${VERSION}\n`, err: "" });
    expect(run("-v").out).toBe(`${VERSION}\n`);
    // Nothing in the help is wider than a terminal.
    for (const line of help.out.split("\n")) expect(line.length, line).toBeLessThanOrEqual(80);
  });
});

describe("standard input", () => {
  it("is read a line to a roll, with Windows line endings or without, and blank lines skipped", () => {
    const unix = run("--stdin -s table", { stdin: "2d6\n\n1d20+5\n" });
    const windows = run("--stdin -s table", { stdin: "2d6\r\n\r\n1d20+5\r\n" });
    expect(windows).toEqual(unix);
    expect(unix.out.split("\n")).toHaveLength(3);
    expect(run("1d4 --stdin -s table", { stdin: "2d6" }).out.split("\n")).toHaveLength(3);
    // Nothing piped in: nothing named, so 2d6.
    expect(run("--stdin -s table", { stdin: "" }).out).toMatch(/^2d6: /);
    // Without --stdin it is not read.
    expect(run("-s table", { stdin: "1d20" }).out).toMatch(/^2d6: /);
  });
});

describe("the odds", () => {
  it("are shown without rolling", () => {
    const { code, out } = run("-o 2d6");
    expect(code).toBe(0);
    expect(out).toContain("range 2 to 12 · expected 7 · spread 2.42 · most likely 7");
    expect(out).toContain("   7    16.7%  ##############################\n");
    expect(out.split("\n")).toHaveLength(14);
    expect(run("--odds 2d6").out).toBe(out);
  });

  it("stop at the forty likeliest totals, and say how many more there are", () => {
    const { out } = run("-o d1000");
    expect(out).toContain("every total as likely as the next");
    expect(out.split("\n")).toHaveLength(44);
    expect(out).toContain("… and 960 more totals, each 0.1% or less");
  });

  it("say when the total is a count", () => {
    expect(run("-o 5d10>=8").out).toContain("5d10>=8 (successes)\n  range 0 to 5 · expected 1.5");
  });

  it("come as JSON and as CSV", () => {
    const data = JSON.parse(run("-o 2d6 --json").out);
    expect(data.format).toBe(EXPORT_FORMAT);
    expect(data.odds[0]).toMatchObject({ notation: "2d6", min: 2, max: 12, expected: 7, mostLikely: [7] });
    expect(data.odds[0].probabilities).toHaveLength(11);
    const csv = run("-o 2d6 --csv").out.split("\r\n");
    expect(csv[0]).toBe("notation,total,chance");
    expect(csv[6]).toBe(`2d6,7,${6 / 36}`);
    expect(csv).toHaveLength(13);
  });
});

describe("games", () => {
  it("are rolled and read by name, any name", () => {
    expect(run("-g yahtzee -s table").out).toBe("Yahtzee (5d6): Chance, for 13  [1 2 1 5 4]\n");
    expect(run("--game Yacht -s table").out).toBe(run("-g yahtzee -s table").out);
    expect(run("-g craps -s table").out).toBe("Craps (2d6): 3 · 3 on the come-out: craps  [1 2]\n");
    expect(run("-g nothing")).toEqual({ code: 1, out: "", err: "korokoro: no game is called “nothing”. `koro --games` lists them\n" });
  });

  it("read each roll in the light of the ones before it", () => {
    const lines = run("-g craps -t 6 -s point").out.split("\n");
    expect(lines.some((line) => /is the point/.test(line))).toBe(true);
    expect(lines.some((line) => /roll again for the point|the point is made|seven out/.test(line))).toBe(true);
  });

  it("are listed", () => {
    const { out } = run("--games");
    expect(out.split("\n")).toHaveLength(PRESETS.length + 1);
    expect(out).toContain("yahtzee");
    expect(JSON.parse(run("--games --json").out).games).toHaveLength(PRESETS.length);
    expect(run("--games --lang ja").out).toContain("丁半");
  });

  it("show the odds of each outcome", () => {
    expect(run("-o -g craps").out).toContain("  A natural (7 or 11): 22.2% (8/36)\n");
    expect(JSON.parse(run("-o -g craps -j").out).odds[0].outcomes).toHaveLength(3);
  });
});

describe("JSON and CSV", () => {
  it("print rolls that read back in", () => {
    const { out } = run("4d6dl1 1d20+5 -s table --json");
    const data = JSON.parse(out);
    expect(Object.keys(data).slice(0, 2)).toEqual(["format", "generator"]);
    expect(data.format).toBe(EXPORT_FORMAT);
    const back = fromJSON(out);
    expect(back?.map((r) => r.total)).toEqual(data.rolls.map((r: { total: number }) => r.total));
    expect(data.rolls[0]).toMatchObject({ notation: "4d6kh3", seed: "table", time: "2026-09-30T12:00:00.000Z" });
  });

  it("carry what could not be rolled, and a game's reading", () => {
    const bad = run("11d6 2d6 -j");
    expect(bad.code).toBe(1);
    expect(JSON.parse(bad.out).errors).toEqual([{ input: "11d6", problem: "count", part: "11", message: "“11”: roll 1 to 10 dice at a time" }]);
    expect(JSON.parse(run("-g yahtzee -s table -j").out).rolls[0]).toMatchObject({ game: "yahtzee", reading: { outcome: "chance", text: "Chance, for 13" } });
  });

  it("print CSV with its header", () => {
    const lines = run("2d6 1d20 -s table --csv").out.split("\r\n");
    expect(lines[0]).toBe("time,notation,label,total,dice,faces,seed,held,loaded,set");
    expect(lines).toHaveLength(4);
  });
});

describe("testing a real die", () => {
  it("gives a verdict in words", () => {
    expect(run("--test", {}).code).toBe(2);
    expect(runCli(["--test", "3 5 6 6 1 2"]).out).toBe("6 results on a d6: too few to say. The test wants 30.\n");
    const fair = Array.from({ length: 60 }, (_, i) => (i % 6) + 1).join(" ");
    expect(runCli(["--test", fair]).out).toMatch(/^60 results on a d6: nothing to see\. A fair die strays this far or further 100% of the time\.\n$/);
    const heavy = Array.from({ length: 120 }, (_, i) => (i % 2 === 0 ? 6 : (i % 6) + 1)).join(" ");
    expect(runCli(["--test", heavy]).out).toMatch(/lopsided/);
    expect(runCli(["--test", "1 2 3", "--sides", "20"]).out).toContain("on a d20");
    expect(runCli(["--test", "1 2 x"])).toEqual({ code: 1, out: "", err: "korokoro: “x” is not a result of this die\n" });
    expect(runCli(["--test", "1 2 3", "--sides", "1"]).code).toBe(2);
    expect(JSON.parse(runCli(["--test", fair, "--json"]).out).test).toMatchObject({ sides: 6, rolls: 60, verdict: "fair" });
  });
});

describe("language", () => {
  it("is the flag's, then the environment's, then the system's", () => {
    expect(cliLanguage(undefined, {})).toBe("en");
    expect(cliLanguage(undefined, { LANG: "ja_JP.UTF-8" })).toBe("ja");
    expect(cliLanguage(undefined, { LC_ALL: "en_US.UTF-8", LANG: "ja_JP.UTF-8" })).toBe("en");
    expect(cliLanguage(undefined, { LC_MESSAGES: "ja_JP.UTF-8", LANG: "en_US.UTF-8" })).toBe("ja");
    expect(cliLanguage("en", { LANG: "ja_JP.UTF-8" })).toBe("en");
    // C and POSIX name no language: the system's is asked, which is how Windows is read.
    expect(cliLanguage(undefined, { LANG: "C" }, "ja-JP")).toBe("ja");
    expect(cliLanguage(undefined, { LC_ALL: "C.UTF-8", LANG: "POSIX" }, "ja-JP")).toBe("ja");
    expect(cliLanguage(undefined, { LANG: "" }, "ja-JP")).toBe("ja");
    expect(cliLanguage(undefined, {}, "fr-FR")).toBe("en");
  });

  it("speaks Japanese when asked", () => {
    expect(run("--help --lang ja").out).toContain("使い方: korokoro");
    expect(run("--help", { env: { LANG: "ja_JP.UTF-8" } }).out).toContain("使い方");
    expect(run("-g cho-han -s table --lang ja").out).toMatch(/^丁半 \(2d6\): (丁|半)/);
    expect(run("11d6 --lang ja").err).toBe("korokoro: 11d6: 「11」: 一度に振れるのは1〜10個です\n");
    expect(run("--bogus --lang ja").err).toContain("不明なオプションです: --bogus");
    expect(run("6#2d6 -s table --lang ja").out).toMatch(/合計 \d+ · 最大 \d+ · 最小 \d+/);
  });
});

describe("colour", () => {
  it("is for a terminal, and never when NO_COLOR or --no-color says not", () => {
    const bold = "\u001b[1m";
    expect(run("2d6 -s table").out).not.toContain(bold);
    expect(run("2d6 -s table", { colour: true }).out).toContain(bold);
    expect(run("2d6 -s table", { colour: true, env: { NO_COLOR: "1" } }).out).not.toContain(bold);
    expect(run("2d6 -s table", { colour: true, env: { NO_COLOR: "" } }).out).toContain(bold);
    expect(run("2d6 -s table --no-color", { colour: true }).out).not.toContain(bold);
    // JSON and CSV are data: never coloured.
    expect(run("2d6 -s table --json", { colour: true }).out).not.toContain(bold);
    expect(run("2d6 -s table --csv", { colour: true }).out).not.toContain(bold);
  });
});
