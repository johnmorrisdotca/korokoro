/**
 * Korokoro コロコロ: fair dice, exact odds, and a history that remembers.
 *
 * The core is plain functions over plain data, with no dependency and no DOM:
 * roll, read the odds, keep a history and summarise it. The tap-to-roll tray
 * is `mountRoller` in `./ui/mount.ts`, exported here too.
 */
export * from "./random.ts";
export * from "./dice.ts";
export * from "./math.ts";
export * from "./notation.ts";
export * from "./odds.ts";
export * from "./stats.ts";
export * from "./history.ts";
export * from "./share.ts";
export * from "./sets.ts";
export * from "./loaded.ts";
export * from "./export.ts";
export { VERSION } from "./version.ts";
export { cliLanguage, runCli, type CliResult, type CliSurroundings } from "./cli.ts";
export { PRESETS, PRESETS as presets, findPresets, getPreset, presetOdds, presetSpec, readPreset, rollPreset, type GameFamily, type OutcomeOdds, type Preset, type PresetReading, type PresetRoll } from "./games/presets.ts";
export { asChance, chinchirorinHandWithin, crapsPass, yahtzeeWithin } from "./games/odds.ts";
export { patternsOf, readDiceAs, waysToShut, type Outcome, type ReadingId } from "./games/readings.ts";
export { READING_WORDS } from "./games/words.ts";
export { mountRoller, type RollerHandle, type RollerOptions } from "./ui/mount.ts";
export { STRINGS, type RollerStrings } from "./ui/strings.ts";
export { createRollSound, type PlaySound, type RollSound, type SoundThrow } from "./ui/sound.ts";
