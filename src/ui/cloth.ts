/**
 * THE CLOTHS A TRAY MAY BE LAID IN: the same five the whole family offers, and itsutsu.com's boards —
 * green (the tray's own, unless said), blue, red, black, and wood. Each is the felt's colour, its deep
 * edge and the ink written on it, given to the tray as its `--kk-felt` variables.
 */
export const KOROKORO_CLOTHS = {
  green: { felt: "#2f5d4a", deep: "#1f4135", ink: "#f3efe4" },
  blue: { felt: "#2865a6", deep: "#1a4677", ink: "#f3efe4" },
  red: { felt: "#a3342e", deep: "#7a231f", ink: "#f3efe4" },
  black: { felt: "#2f3236", deep: "#1b1d20", ink: "#ece8dc" },
  wood: { felt: "#e2ba7a", deep: "#c4954f", ink: "#2b1d0e" },
} as const;

/** A cloth's name. */
export type Cloth = keyof typeof KOROKORO_CLOTHS;

/** Whether a text names a cloth. */
export function isCloth(text: unknown): text is Cloth {
  return typeof text === "string" && Object.hasOwn(KOROKORO_CLOTHS, text);
}

/** A cloth as the tray's CSS variables; nothing for a name that is not a cloth, so the tray keeps its own. */
export function clothVars(cloth: string | undefined | null): Record<`--kk-${string}`, string> {
  if (!isCloth(cloth)) return {};
  const { felt, deep, ink } = KOROKORO_CLOTHS[cloth];
  return { "--kk-felt": felt, "--kk-felt-deep": deep, "--kk-felt-ink": ink };
}
