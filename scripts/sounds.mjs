// Writes src/ui/sounds.data.ts from the recordings in ./sounds, so the tray can
// load them as one module with nothing for a bundler to configure. Run it after
// changing a recording: `pnpm sounds`. A test fails if the two fall out of step.
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

const files = readdirSync("sounds").filter((name) => name.endsWith(".m4a")).sort();
const entry = (name) => `  "${name.replace(".m4a", "")}":\n    "${readFileSync(`sounds/${name}`).toString("base64")}",`;
const lines = [
  "/**",
  " * The tray's recorded dice, as base64 AAC (.m4a): two shakes and four single",
  " * dice landing. From Kenney's Casino Audio pack, CC0; see SOUNDS.md. Written",
  " * by scripts/sounds.mjs from the files in ./sounds, never by hand, and loaded",
  " * only when a tray with its sound on first rolls.",
  " */",
  "export const SOUNDS = {",
  ...files.map(entry),
  "} as const;",
  "",
  "/** The name of one recording. */",
  "export type SoundName = keyof typeof SOUNDS;",
  "",
];
writeFileSync("src/ui/sounds.data.ts", lines.join("\n"));
console.log(`src/ui/sounds.data.ts: ${files.length} recordings, ${files.reduce((sum, name) => sum + readFileSync(`sounds/${name}`).length, 0)} bytes of audio.`);
