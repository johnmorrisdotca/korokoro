// Plain JavaScript, so that reading files needs no Node types in a package that has none.
import { Buffer } from "node:buffer";
import { readFileSync, readdirSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { SOUNDS } from "./sounds.data.ts";

describe("the recordings", () => {
  const files = readdirSync("sounds").filter((name) => name.endsWith(".m4a")).sort();

  it("are the files in ./sounds, byte for byte: run `pnpm sounds` after changing one", () => {
    expect(Object.keys(SOUNDS)).toEqual(files.map((name) => name.replace(".m4a", "")));
    for (const name of files) expect(SOUNDS[name.replace(".m4a", "")]).toBe(readFileSync(`sounds/${name}`).toString("base64"));
  });

  it("are two shakes and four dice landing, AAC in an .m4a, and small", () => {
    expect(files).toEqual(["dice-shake-1.m4a", "dice-shake-2.m4a", "die-throw-1.m4a", "die-throw-2.m4a", "die-throw-3.m4a", "die-throw-4.m4a"]);
    let bytes = 0;
    for (const name of files) {
      const file = readFileSync(`sounds/${name}`);
      expect(file.toString("latin1", 4, 12)).toBe("ftypM4A ");
      expect(file.includes(Buffer.from("mp4a", "latin1"))).toBe(true);
      bytes += file.length;
    }
    expect(bytes).toBeLessThan(30_000);
    expect(readFileSync("src/ui/sounds.data.ts").length).toBeLessThan(60_000);
  });

  it("are named in SOUNDS.md, with where they came from and their licence", () => {
    const notes = readFileSync("SOUNDS.md", "utf8");
    for (const name of files) expect(notes).toContain(name);
    expect(notes).toContain("CC0");
    expect(notes).toContain("kenney.nl");
  });

  it("are never part of the core: only a roll with its sound on imports them", () => {
    const sources = ["src/index.ts", "src/react.tsx", "src/ui/mount.ts", "src/ui/sound.ts", "src/ui/panels.ts", "src/ui/faces.ts"].map((path) => readFileSync(path, "utf8"));
    for (const source of sources) expect(source).not.toMatch(/from "\.\/(ui\/)?sounds\.data\.ts"/);
    expect(readFileSync("src/ui/sound.ts", "utf8")).toContain('import("./sounds.data.ts")');
  });
});
