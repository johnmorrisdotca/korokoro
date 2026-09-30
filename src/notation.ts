import { DIE_SIDES, normalizeSpec, type RollSpec } from "./dice.ts";

/**
 * Dice notation, the way a character sheet writes it: `3d6`, `1d20+5`,
 * `2d20kh1` (advantage), `2d20kl1` (disadvantage), `d100`.
 */
const NOTATION = /^\s*(\d*)\s*d\s*(\d+|%)\s*(k([hl])1?)?\s*([+-]\s*\d+)?\s*$/i;

/** A spec from notation, or null when the text is not dice this roller can throw. */
export function parseNotation(text: string): RollSpec | null {
  const match = NOTATION.exec(text);
  if (match === null) return null;
  const count = match[1] === "" ? 1 : Number(match[1]);
  const sides = match[2] === "%" ? 100 : Number(match[2]);
  if (!(DIE_SIDES as readonly number[]).includes(sides)) return null;
  const spec = normalizeSpec({
    count,
    sides: sides as RollSpec["sides"],
    modifier: match[5] === undefined ? 0 : Number(match[5].replace(/\s+/g, "")),
    keep: match[4] === undefined ? "all" : match[4].toLowerCase() === "h" ? "highest" : "lowest",
  });
  // Refuse rather than quietly roll something else: "9d6" is not "5d6".
  if (spec.count !== count) return null;
  if (match[4] !== undefined && spec.keep === "all") return null;
  return spec;
}

/** Notation for a spec: the inverse of `parseNotation`. */
export function formatNotation(spec: RollSpec): string {
  const keep = spec.keep === "highest" ? "kh1" : spec.keep === "lowest" ? "kl1" : "";
  const modifier = spec.modifier === 0 ? "" : spec.modifier > 0 ? `+${spec.modifier}` : `${spec.modifier}`;
  return `${spec.count}d${spec.sides}${keep}${modifier}`;
}
