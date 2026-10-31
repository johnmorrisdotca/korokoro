/**
 * Korokoro コロコロ: fair dice, exact odds, and a history that remembers.
 *
 * The core is plain functions over plain data, with no dependency and no DOM:
 * roll, read the odds, keep a history and summarise it. The tap-to-roll tray
 * is `mountRoller` in `./ui/mount.ts`, exported here too.
 */

export { type CliResult, type CliSurroundings, cliLanguage, runCli } from "./cli.ts";
export * from "./dice.ts";
export * from "./diceWar.ts";
export * from "./export.ts";
export { asChance, chinchirorinHandWithin, crapsPass, yahtzeeWithin } from "./games/odds.ts";
export {
  findPresets,
  type GameFamily,
  getPreset,
  type OutcomeOdds,
  PRESETS,
  PRESETS as presets,
  type Preset,
  type PresetReading,
  type PresetRoll,
  presetOdds,
  presetSpec,
  readPreset,
  rollPreset,
} from "./games/presets.ts";
export { type Outcome, patternsOf, type ReadingId, readDiceAs, waysToShut } from "./games/readings.ts";
export { READING_WORDS } from "./games/words.ts";
export * from "./history.ts";
export * from "./loaded.ts";
export * from "./math.ts";
export * from "./notation.ts";
export * from "./odds.ts";
export * from "./random.ts";
export * from "./sets.ts";
export * from "./share.ts";
export * from "./stats.ts";
export { type Cloth, clothVars, isCloth, KOROKORO_CLOTHS } from "./ui/cloth.ts";
export { DIE_SIZE_PX, type DieHandle, type DieOptions, type DieSize, mountDie } from "./ui/die.ts";
export { mountRoller, type RollerHandle, type RollerOptions, type RollerSize } from "./ui/mount.ts";
export { createRollSound, type PlaySound, type RollSound, type SoundThrow } from "./ui/sound.ts";
export { type RollerStrings, STRINGS } from "./ui/strings.ts";
export { VERSION } from "./version.ts";
