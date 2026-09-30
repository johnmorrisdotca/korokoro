import { describe, expect, it } from "vitest";

import { roll, rollHeld, rollMany, type Roll } from "./dice.ts";
import { CSV_COLUMNS, EXPORT_FORMAT, csvCell, diceText, fromJSON, rollText, toCSV, toJSON, toText, type Exported } from "./export.ts";
import { serializeHistory } from "./history.ts";
import { parseNotation } from "./notation.ts";
import { seededSource } from "./random.ts";
import { VERSION } from "./version.ts";

const at = Date.UTC(2026, 8, 30, 12, 0, 0);
const thrown = (text: string, seed = "export"): Roll => roll(parseNotation(text)!, seededSource(seed), at);
const some = (): Roll[] => [thrown("2d20kh1+5"), thrown("4d6dl1"), thrown("3d6!"), thrown("2d6ro<3"), thrown("6d10>=8f=1"), thrown("3d6!p"), thrown("4d6min2"), thrown("1d[Yes,No,Maybe]"), thrown("2d[Hit=1,Miss=0]"), thrown("1d6{6:3}"), thrown("2d6+3 # fire damage")];

/** A small reader of RFC 4180 CSV, to read back what is written. */
function readCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i] as string;
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") {
      row.push(cell);
      cell = "";
    } else if (c === "\r" && text[i + 1] === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      i += 1;
    } else cell += c;
  }
  return rows;
}

describe("JSON", () => {
  it("says its format first, and reads back as the same rolls", () => {
    const rolls = some();
    const text = toJSON(rolls);
    const data = JSON.parse(text) as Exported;
    expect(Object.keys(data)[0]).toBe("format");
    expect(data.format).toBe(EXPORT_FORMAT);
    expect(data.generator).toBe(`korokoro ${VERSION}`);
    expect(data.rolls).toHaveLength(rolls.length);
    expect(text.endsWith("}\n")).toBe(true);
    expect(fromJSON(text)).toEqual(rolls);
  });

  it("writes a roll as a person and a program would both want it", () => {
    const [attack] = JSON.parse(toJSON([thrown("2d20kh1+5")])).rolls;
    expect(attack).toMatchObject({ notation: "2d20kh1+5", time: "2026-09-30T12:00:00.000Z", at, seed: "export" });
    expect(attack.total).toBe(attack.dice.filter((d: { status: string }) => d.status === "kept").reduce((sum: number, d: { face: number }) => sum + d.face, 5));
    expect(JSON.parse(toJSON([thrown("6d10>=8f=1")])).rolls[0].successes).toBe(true);
    expect(JSON.parse(toJSON([thrown("1d[Yes,No,Maybe]")])).rolls[0].words).toHaveLength(1);
    expect(JSON.parse(toJSON([thrown("1d6{6:3}")])).rolls[0].loaded).toBe(true);
    expect(JSON.parse(toJSON([thrown("2d6")])).rolls[0]).not.toHaveProperty("loaded");
  });

  it("keeps held dice and sets", () => {
    const first = thrown("5d6");
    const second = rollHeld(first, [true, false, false, true, false], seededSource("again"), at + 1);
    const set = rollMany(parseNotation("6#4d6dl1")!, undefined, seededSource("scores"), at).rolls;
    const back = fromJSON(toJSON([first, second, ...set]));
    expect(back?.[1]?.held).toEqual([true, false, false, true, false]);
    expect(back?.slice(2).map((r) => r.set?.index)).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("adds the stats when asked", () => {
    expect(JSON.parse(toJSON(some(), { stats: true })).stats.rolls).toBe(some().length);
    expect(JSON.parse(toJSON(some()))).not.toHaveProperty("stats");
  });

  it("reads a kept history too, and trusts nothing in either", () => {
    const rolls = some();
    expect(fromJSON(serializeHistory(rolls))).toEqual(rolls);
    // A total that is not what the dice add up to is worked out again, and a roll whose faces the dice could not show is left out.
    const data = JSON.parse(toJSON([thrown("2d6"), thrown("2d6", "other")])) as Exported;
    (data.rolls[0] as { total: number }).total = 99;
    (data.rolls[1] as { faces: number[] }).faces = [7, 1];
    const back = fromJSON(JSON.stringify(data));
    expect(back).toHaveLength(1);
    expect(back?.[0]?.total).toBe(thrown("2d6").total);
  });

  it("is null for what is not an export, or is from a later format", () => {
    expect(fromJSON("not json")).toBeNull();
    expect(fromJSON("42")).toBeNull();
    expect(fromJSON('{"hello":1}')).toBeNull();
    expect(fromJSON(`{"format":${EXPORT_FORMAT + 1},"rolls":[]}`)).toBeNull();
    expect(fromJSON('{"format":"1","rolls":[]}')).toBeNull();
    expect(fromJSON('{"format":1,"rolls":[]}')).toEqual([]);
  });
});

describe("CSV", () => {
  it("is a header and a row for each roll, ended CRLF, and reads back cell for cell", () => {
    const rolls = some();
    const text = toCSV(rolls);
    expect(text.split("\r\n")).toHaveLength(rolls.length + 2);
    expect(text).not.toMatch(/[^\r]\n/);
    const rows = readCSV(text);
    expect(rows[0]).toEqual([...CSV_COLUMNS]);
    for (const [i, r] of rolls.entries()) {
      const row = rows[i + 1] as string[];
      expect(row).toHaveLength(CSV_COLUMNS.length);
      expect(row[0]).toBe("2026-09-30T12:00:00.000Z");
      expect(row[5]).toBe(r.faces.join(" "));
      expect(row[6]).toBe("export");
    }
    expect(rows.at(-1)?.slice(1, 3)).toEqual(["2d6+3", "fire damage"]);
    // Dice that are only words have no total; loaded dice say so.
    expect(rows[8]?.[3]).toBe("");
    expect(rows[10]?.[8]).toBe("loaded");
    expect(toCSV([])).toBe(`${CSV_COLUMNS.join(",")}\r\n`);
  });

  it("quotes what needs quoting", () => {
    expect(csvCell("plain")).toBe("plain");
    expect(csvCell("a,b")).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell("two\nlines")).toBe('"two\nlines"');
    const custom = readCSV(toCSV([thrown("2d[Hit=1,Miss=0]")]))[1] as string[];
    expect(custom[1]).toBe("2d[Hit=1,Miss=0]");
  });

  it("never hands a spreadsheet a formula", () => {
    for (const bad of ["=1+1", "+1+1", "-1+1", "@SUM(A1)", "\tx", "\rx", '=HYPERLINK("http://x","y")']) expect(csvCell(bad).replace(/^"/, "")[0]).toBe("'");
    // A number stays a number, negative ones too.
    expect(csvCell(-3)).toBe("-3");
    expect(csvCell("-3")).toBe("-3");
    expect(csvCell(12)).toBe("12");
    // A label is the one cell a person writes freely.
    const row = readCSV(toCSV([thrown("2d6 # =cmd|' /C calc'!A0")]))[1] as string[];
    expect(row[2]).toBe("'=cmd|' /C calc'!A0");
    // A negative total is a number and is left as one.
    const low = readCSV(toCSV([thrown("1d4-9")]))[1] as string[];
    expect(Number(low[3])).toBeLessThan(0);
    expect(low[3]?.startsWith("'")).toBe(false);
  });

  it("says which dice were held and which roll of a set", () => {
    const first = thrown("5d6");
    const second = rollHeld(first, [true, false, false, true, false], seededSource("again"), at + 1);
    const set = rollMany(parseNotation("3#2d6")!, undefined, seededSource("set"), at).rolls;
    const rows = readCSV(toCSV([second, ...set]));
    expect(rows[1]?.[7]).toBe("1 4");
    expect(rows.slice(2).map((row) => row[9])).toEqual(["1/3", "2/3", "3/3"]);
  });
});

describe("plain text", () => {
  it("is a line for each roll, with what became of each die", () => {
    const text = toText(some());
    expect(text.split("\n")).toHaveLength(some().length + 1);
    expect(text.startsWith("2026-09-30T12:00:00.000Z  2d20kh1+5: ")).toBe(true);
    expect(toText([])).toBe("");
  });

  it("marks each die the same way every time", () => {
    const script = (faces: number[]) => ({ seed: null, next: () => (faces.shift() as number) - 1 });
    const of = (text: string, faces: number[]) => roll(parseNotation(text)!, script(faces), at);
    expect(diceText(of("4d6dl1", [6, 4, 2, 1]))).toBe("6 4 2 (1)");
    expect(diceText(of("2d6ro<3", [2, 5, 4]))).toBe("[2] 5 4");
    expect(diceText(of("2d6!", [6, 3, 2]))).toBe("6! 3 2");
    expect(diceText(of("3d10>=8f=1", [9, 1, 5]))).toBe("9* 1x 5");
    expect(diceText(of("2d6!p", [6, 4, 2]))).toBe("6! 4→3 2");
    expect(diceText(of("2d6min3", [1, 5]))).toBe("1→3 5");
    expect(rollText(of("4d6dl1", [6, 4, 2, 1]))).toBe("4d6kh3: 12  [6 4 2 (1)]");
    expect(rollText(of("1d[Yes,No,Maybe]", [2]))).toBe("1d[Yes,No,Maybe]: No");
    expect(toText([of("1d6{6:3}", [8])])).toContain("(loaded dice)");
  });
});
