import { chancesOf, faceRange, type DiceGroup } from "./dice.ts";

/**
 * Loaded dice, kept in one place and in plain sight. Korokoro's own dice are
 * fair. These are not, they say so, and nothing here can make one pass for a
 * fair die: a loaded die's weights are part of its name (`d6{6:3}`), of its
 * spec, of every roll it makes and of every link to one.
 */
export type LoadedPreset = {
  /** A short id, for code and links. */
  id: string;
  /** What the die is called. */
  name: string;
  /** The dice, as notation. */
  notation: string;
  /** What it does, in a line. */
  says: string;
};

/** Three loaded dice to try, each an old trick with a long record. */
export const LOADED_PRESETS: readonly LoadedPreset[] = [
  {
    id: "optimist",
    name: "The Optimist",
    notation: "1d6{6:3}",
    says: "A die weighted towards its six, which it shows three times in eight. It believes in you more than the odds do.",
  },
  {
    id: "flat",
    name: "The Six-Ace Flat",
    notation: "1d6{1:2,6:2}",
    says: "Shaved a little thin between the 1 and the 6, so those two faces land twice as often as the rest. The oldest job a file ever did.",
  },
  {
    id: "odd-couple",
    name: "The Odd Couple",
    notation: "2d6{2:0,4:0,6:0}",
    says: "Two dice with no even faces. Between them they have never made a seven, and they are not going to start now.",
  },
];

/** One face of a die and how often it comes up, beside how often it would on a fair one. */
export type FaceChance = {
  /** The face, as a roll records it. */
  face: number;
  /** What it says, on a custom die; its number otherwise. */
  label: string;
  /** Its chance on this die. */
  chance: number;
  /** Its chance if every face were as likely as the next. */
  fair: number;
};

/** Every face of one die of a group with its chance, beside the fair die's. For a custom die of words this is its odds: the faces have no total to have odds of. */
export function faceChances(group: DiceGroup): FaceChance[] {
  const low = group.faces !== undefined ? 1 : faceRange(group.sides).low;
  const chances = chancesOf(group);
  return chances.map((chance, i) => ({ face: low + i, label: group.faces?.[i]?.label ?? String(low + i), chance, fair: 1 / chances.length }));
}

function lowestTerms(top: number, bottom: number): [number, number] {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const common = gcd(top, bottom);
  return [top / common, bottom / common];
}

/**
 * What a loaded die's loading comes to, as exact fractions, for the face it
 * favours most: `{ face: 6, loaded: [3, 8], fair: [1, 6] }` is "6 comes up 3
 * in 8, not 1 in 6". Null for a die that is not loaded.
 */
export function loadingOf(group: DiceGroup): { face: number; loaded: [number, number]; fair: [number, number] } | null {
  if (group.weights === undefined) return null;
  const all = group.weights.reduce((a, b) => a + b, 0);
  const heaviest = group.weights.indexOf(Math.max(...group.weights));
  return { face: faceRange(group.sides).low + heaviest, loaded: lowestTerms(group.weights[heaviest] as number, all), fair: [1, group.weights.length] };
}
