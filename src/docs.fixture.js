import { fullReadme } from "../scripts/full-readme.mjs";

// The README with the sections that moved to pages under docs/ put back: the tests hold the whole of what it says to the code.
export const readme = fullReadme();
export const cell = (text) => text.replace(/\\\|/g, "|").trim();

/** The rows of the table under a heading: each row's cells. */
export function table(heading) {
  const from = readme.indexOf(heading);
  if (from < 0) throw new Error(`the README has no “${heading}”`);
  const rows = [];
  for (const line of readme.slice(from).split("\n").slice(1)) {
    if (line.startsWith("|"))
      rows.push(
        line
          .split(/(?<!\\)\|/)
          .slice(1, -1)
          .map(cell),
      );
    else if (rows.length > 0) break;
  }
  return rows.slice(2);
}

export const codes = (text) => [...text.matchAll(/`([^`]+)`/g)].map((m) => m[1]);
