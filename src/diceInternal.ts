import { type DiceGroup, faceRange } from "./dice.ts";

/** The lowest and highest face one die of a group can be recorded as: a custom die's faces are numbered from 1. */
export function facesOf(group: DiceGroup): { low: number; high: number } {
  return group.faces !== undefined ? { low: 1, high: group.faces.length } : faceRange(group.sides);
}

/** The rules a kind of dice may carry beyond its count, sides and keep, in the order they are copied. */
const RULES = [
  "keepCount",
  "explode",
  "reroll",
  "rerollUntil",
  "rerollWhen",
  "rerollUntilWhen",
  "explodeWhen",
  "explodeKind",
  "floor",
  "ceiling",
  "success",
  "failure",
  "critical",
  "fumble",
  "sort",
  "unique",
  "faces",
  "weights",
] as const;

export function copyRules(from: Partial<DiceGroup>, to: Partial<DiceGroup>): void {
  for (const rule of RULES) if (from[rule] !== undefined) (to as Record<string, unknown>)[rule] = from[rule];
}
