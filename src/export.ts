import { diceOf, groupOf, hasTotal, isSuccessRoll, valueOfFace, type DieRoll, type Roll } from "./dice.ts";
import { parseHistory } from "./history.ts";
import { mathText } from "./math.ts";
import { formatNotation } from "./notation.ts";
import { statsOf, type Stats } from "./stats.ts";
import { VERSION } from "./version.ts";

/**
 * Rolls written out for other programs and for people: JSON that reads back
 * in, CSV for a spreadsheet, and plain text for a chat or a log. All three are
 * pure: rolls in, a string out. What is done with the string (a file, a
 * clipboard, a terminal) is the caller's.
 */

/** The shape of the JSON this package writes. It goes up only when a reader of the old shape would be wrong about the new one. */
export const EXPORT_FORMAT = 1;

/** One roll as the JSON export writes it. */
export type ExportedRoll = {
  id: string;
  /** The dice as notation, its label included. */
  notation: string;
  /** The same dice as a spec: what `fromJSON` reads. */
  spec: Roll["spec"];
  /** Every die thrown, in the order thrown. */
  faces: number[];
  /** Which faces count. */
  kept: boolean[];
  total: number;
  /** True when the total is a count of successes. Left out otherwise. */
  successes?: true;
  /** What the faces say, on a roll of custom dice. Left out otherwise. */
  words?: string[];
  /** Epoch milliseconds, and the same moment as ISO 8601 in UTC. */
  at: number;
  time: string;
  seed: string | null;
  held?: boolean[];
  loaded?: true;
  set?: Roll["set"];
  /** What became of each die. */
  dice: DieRoll[];
};

/** A whole JSON export. */
export type Exported = {
  format: typeof EXPORT_FORMAT;
  generator: string;
  rolls: ExportedRoll[];
  stats?: Stats;
};

/** One roll as the JSON export writes it. */
export function exportedRoll(roll: Roll): ExportedRoll {
  const dice = diceOf(roll);
  const out: ExportedRoll = { id: roll.id, notation: formatNotation(roll.spec), spec: roll.spec, faces: roll.faces, kept: roll.kept, total: roll.total, at: roll.at, time: new Date(roll.at).toISOString(), seed: roll.seed, dice };
  if (isSuccessRoll(roll.spec)) out.successes = true;
  if (dice.some((d) => d.label !== undefined)) out.words = dice.map((d) => d.label ?? String(d.face));
  if (roll.held !== undefined) out.held = roll.held;
  if (roll.loaded === true) out.loaded = true;
  if (roll.set !== undefined) out.set = roll.set;
  return out;
}

/** Rolls as JSON, two spaces deep, with the format's number first. `stats: true` adds `statsOf` the rolls. `fromJSON` reads it back. */
export function toJSON(rolls: readonly Roll[], options: { stats?: boolean } = {}): string {
  const out: Exported = { format: EXPORT_FORMAT, generator: `korokoro ${VERSION}`, rolls: rolls.map(exportedRoll) };
  if (options.stats === true) out.stats = statsOf(rolls);
  return `${JSON.stringify(out, null, 2)}\n`;
}

/**
 * Rolls from JSON that `toJSON` wrote, or a history that `serializeHistory`
 * did. Nothing in it is trusted: each roll is put together again from its
 * dice and its faces, and one that does not add up is left out. Null when the
 * text is not JSON, holds no list of rolls, or is of a later format than this
 * version reads.
 */
export function fromJSON(text: string): Roll[] | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof data !== "object" || data === null) return null;
  const format = (data as { format?: unknown }).format;
  if (format !== undefined && (typeof format !== "number" || format > EXPORT_FORMAT)) return null;
  if (!Array.isArray(data) && !Array.isArray((data as { rolls?: unknown }).rolls)) return null;
  return parseHistory(text);
}

/** A die as plain text: its face or its words; `!` exploded, `(…)` dropped, `[…]` rerolled, `*` a success, `x` takes a success away, `→n` what it counts for when that is not its face. */
function dieText(roll: Roll, die: DieRoll): string {
  const group = groupOf(roll.spec, die);
  const face = die.label ?? String(die.face);
  if (die.status === "dropped") return `(${face})`;
  if (die.status === "rerolled") return `[${face}]`;
  const worth = group.faces === undefined && die.value !== undefined && die.value !== valueOfFace(group, die.face) ? `→${die.value}` : "";
  return `${face}${worth}${die.exploded ? "!" : ""}${die.counts === 1 ? "*" : die.counts === -1 ? "x" : ""}`;
}

/** The dice of a roll as plain text, in the order thrown: `6 4 2 (1)`. */
export function diceText(roll: Roll): string {
  return diceOf(roll)
    .map((die) => dieText(roll, die))
    .join(" ");
}

/** A formula's roll with each kind of dice written as it fell: `([6 1]+3)*2-[3]`. For a roll without a formula, the same as `diceText`. */
export function formulaText(roll: Roll): string {
  const { math } = roll.spec;
  if (math === undefined) return diceText(roll);
  const dice = diceOf(roll);
  return mathText(math, (group) => `[${dice.filter((die) => (die.group ?? 0) === group).map((die) => dieText(roll, die)).join(" ")}]`);
}

/** A roll's result as it would be said: its total, or for dice that are only words, the words. */
export function resultText(roll: Roll): string {
  return hasTotal(roll.spec)
    ? String(roll.total)
    : diceOf(roll)
        .map((d) => d.label ?? String(d.face))
        .join(" ");
}

/** One roll on one line: `2d20kh1+5: 22  [17 (4)]`, or for a formula `(2d6+3)*2: 20  ([6 1]+3)*2`. */
export function rollText(roll: Roll): string {
  const dice = roll.spec.math !== undefined ? formulaText(roll) : `[${diceText(roll)}]`;
  return `${formatNotation(roll.spec)}: ${resultText(roll)}${hasTotal(roll.spec) ? `  ${dice}` : ""}`;
}

/** Rolls as plain text, one to a line, each with its time in UTC, oldest first as given. */
export function toText(rolls: readonly Roll[]): string {
  return rolls.map((roll) => `${new Date(roll.at).toISOString()}  ${rollText(roll)}${roll.loaded === true ? "  (loaded dice)" : ""}\n`).join("");
}

/** The columns of the CSV export, in order. */
export const CSV_COLUMNS = ["time", "notation", "label", "total", "dice", "faces", "seed", "held", "loaded", "set"] as const;

/**
 * One cell of CSV. Quoted when it holds a comma, a quote or a line break. A
 * cell that a spreadsheet would run as a formula (one starting with `=`, `+`,
 * `-`, `@`, a tab or a carriage return) is given a leading apostrophe, unless
 * it is simply a number, so that opening an export can never run anything.
 */
export function csvCell(value: string | number): string {
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text) && !/^-?\d+(\.\d+)?$/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * Rolls as CSV for a spreadsheet: a header, then a row for each roll, lines
 * ended CRLF as RFC 4180 has them. `total` is empty for dice that are only
 * words; `dice` is each die as text (see `diceText`); `faces` is the bare
 * faces thrown; `held` is which dice were held, counted from 1; `set` is
 * `2/6` for the second roll of six.
 */
export function toCSV(rolls: readonly Roll[]): string {
  const rows = rolls.map((roll) => {
    const { label, ...dice } = roll.spec;
    return [
      new Date(roll.at).toISOString(),
      formatNotation(dice),
      label ?? "",
      hasTotal(roll.spec) ? roll.total : "",
      diceText(roll),
      roll.faces.join(" "),
      roll.seed ?? "",
      roll.held === undefined ? "" : roll.held.flatMap((h, i) => (h ? [i + 1] : [])).join(" "),
      roll.loaded === true ? "loaded" : "",
      roll.set === undefined ? "" : `${roll.set.index + 1}/${roll.set.of}`,
    ];
  });
  return [CSV_COLUMNS as readonly (string | number)[], ...rows].map((row) => `${row.map(csvCell).join(",")}\r\n`).join("");
}
