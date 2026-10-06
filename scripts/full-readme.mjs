// The README as the whole it was before npm's limit cut it short: every section that moved to a page under docs/ put back in its
// place, with the links the page needed (relative to docs/) turned back into the README's own. npm shows only the first 65,536
// characters of a README, so the long reference material lives in pages under docs/ and the README keeps a summary and a link; the
// tests that hold the documentation to the code, and the documentation site, read the whole.
//
// A section that moved says so in a comment on its first line: `<!-- moved: docs/notation.md -->`, and the page holds the section
// under the same `## ` heading.
import { readFileSync } from "node:fs";
import { posix } from "node:path";

const MOVED = /<!-- moved: (docs\/[\w./-]+) -->/;

/** The text split at its `## ` headings, outside code fences: [{ heading, text }], the first with no heading. */
function sections(text) {
  const out = [{ heading: null, lines: [] }];
  let fenced = false;
  for (const line of text.split("\n")) {
    if (/^\s*```/.test(line)) fenced = !fenced;
    const heading = !fenced && /^## (.+)$/.exec(line);
    if (heading) out.push({ heading: heading[1], lines: [line] });
    else out.at(-1).lines.push(line);
  }
  return out.map(({ heading, lines }) => ({ heading, text: lines.join("\n") }));
}

/** A page's link made the README's again: to a heading that was moved with it, `#anchor`; to anything else, a path from the top. */
function fromDocs(body, moved) {
  let fenced = false;
  return body
    .split("\n")
    .map((line) => {
      if (/^\s*```/.test(line)) fenced = !fenced;
      if (fenced) return line;
      return line.replace(/\]\(([^)\s]+)\)/g, (whole, target) => {
        if (/^(https?:|mailto:|#)/.test(target)) return whole;
        const [path, anchor = ""] = target.split("#");
        const file = posix.normalize(posix.join("docs", path));
        if ((file === "README.md" || moved.has(file)) && anchor !== "") return `](#${anchor})`;
        return `](./${file}${anchor === "" ? "" : `#${anchor}`})`;
      });
    })
    .join("\n");
}

/** The README with every moved section put back. `read` reads a file of the repository by its path from the top. */
export function fullReadme(read = (file) => readFileSync(file, "utf8")) {
  const readme = read("README.md");
  const parts = sections(readme);
  const moved = new Set(parts.map((part) => MOVED.exec(part.text)?.[1]).filter(Boolean));
  const pages = new Map([...moved].map((file) => [file, sections(read(file))]));
  return parts
    .map((part) => {
      const file = MOVED.exec(part.text)?.[1];
      if (file === undefined || part.heading === null) return part.text;
      const found = pages.get(file).find((candidate) => candidate.heading === part.heading);
      if (found === undefined) throw new Error(`${file} has no “## ${part.heading}”, which the README says moved there`);
      return fromDocs(found.text, moved).replace(/\n+$/, "\n");
    })
    .join("\n");
}
