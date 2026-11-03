import { roll } from "../dice.ts";
import { parseNotation } from "../notation.ts";
import type { RandomSource } from "../random.ts";
import { getPreset, type Preset, presetOdds, presetSpec, readPreset } from "./presets.ts";

/** A source that throws the faces it is handed, in order, on numbered dice. */
export function scripted(faces: number[]): RandomSource {
  const left = [...faces];
  return { seed: null, next: () => (left.shift() as number) - 1 };
}
export const game = (id: string): Preset => {
  const preset = getPreset(id);
  if (preset === undefined) throw new Error(`no preset ${id}`);
  return preset;
};
/** Throw a game's dice as given and read them, with the rolls before in the same game. */
export function read(id: string, faces: number[], before: number[][] = []) {
  const preset = game(id);
  const earlier = before.map((f, i) => roll(presetSpec(preset), scripted(f), i));
  const thrown = roll(presetSpec(preset), scripted(faces), 99);
  return readPreset(preset, thrown, earlier);
}
export const odds = (id: string, notation?: string) => {
  const table = presetOdds(game(id), notation === undefined ? undefined : parseNotation(notation)!);
  if (table === null) throw new Error(`${id} has no odds`);
  return new Map(table.map((line) => [line.outcome, [Number(line.ways), Number(line.outOf)]]));
};
