/**
 * Korokoro コロコロ: fair dice, exact odds, and a history that remembers.
 *
 * The core is plain functions over plain data, with no dependency and no DOM:
 * roll, read the odds, keep a history and summarise it. The tap-to-roll tray
 * is `mountRoller` in `./ui/mount.ts`, exported here too.
 */
export * from "./random.ts";
export * from "./dice.ts";
export * from "./notation.ts";
export * from "./odds.ts";
export * from "./stats.ts";
export * from "./history.ts";
export * from "./share.ts";
export { mountRoller, type RollerHandle, type RollerOptions } from "./ui/mount.ts";
export { STRINGS, type RollerStrings } from "./ui/strings.ts";
