import { readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";

import { fullReadme } from "../scripts/full-readme.mjs";

/** The Architecture tree (docs/architecture.md, which the README links) names every source file, and nothing that is not one, so it cannot fall behind the code. */
describe("the README's Architecture", () => {
  it("names exactly the files under src/", () => {
    const readme = fullReadme();
    const section = readme.slice(readme.indexOf("## Architecture"));
    const tree = section.slice(section.indexOf("```text"), section.indexOf("```", section.indexOf("```text") + 7));
    const named = [...tree.matchAll(/[├└]── ([\w.-]+\.(?:ts|tsx|js|mjs))\b/g)].map((match) => match[1]).sort();
    const files = readdirSync("src", { recursive: true })
      .filter((path) => /\.(ts|tsx|js|mjs)$/.test(path) && !/\.(test|fixture)\./.test(path))
      .map((path) => path.split(/[\\/]/).at(-1))
      .sort();
    expect(named).toEqual(files);
  });
});
