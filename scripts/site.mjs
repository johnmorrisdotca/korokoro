// Builds the static demo for GitHub Pages into ./site: the page plus the compiled library.
// The page's header, footer and language chooser are the family's, from family-template.mjs,
// which is copied into this repository unchanged, as demo/family.css is.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

import { FAMILY_SCRIPT, familyFooter, familyHeader, familyUnreviewed } from "./family-template.mjs";

rmSync("site", { recursive: true, force: true });
mkdirSync("site", { recursive: true });
cpSync("demo", "site", { recursive: true });
cpSync("dist", "site/dist", { recursive: true });

const id = "korokoro";
const parts = {
  "<!-- family:header -->": familyHeader({ id }),
  "<!-- family:unreviewed -->": familyUnreviewed({ id }),
  "<!-- family:footer -->": familyFooter({ id }),
  "/* family:script */": FAMILY_SCRIPT,
};
let page = readFileSync("demo/index.html", "utf8");
for (const [mark, part] of Object.entries(parts)) {
  if (!page.includes(mark)) throw new Error(`demo/index.html has no ${mark}`);
  page = page.replace(mark, () => part);
}
writeFileSync("site/index.html", page);
// The API reference is made by `pnpm docs:site` into site/docs/reference; the README and every package of the family link `api.html`.
writeFileSync("site/api.html", '<!doctype html>\n<meta charset="utf-8">\n<title>Korokoro API reference</title>\n<meta http-equiv="refresh" content="0; url=docs/reference/">\n<link rel="canonical" href="docs/reference/">\n<p><a href="docs/reference/">The API reference</a></p>\n');
console.log("site/ is ready: serve it, or let the Pages workflow publish it.");
