// Keep published VitePress/TypeDoc addresses leading to the shared site's pages.
// The source guides remain in docs/; this writes redirects, never another copy of their content.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { modelOf } from "./docs-site.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const guideAliases = {
  start: "getting-started", use: "embed-a-tray", examples: "roll-with-notation", notation: "roll-with-notation",
  rolls: "seeded-shared-rolls", dice: "custom-loaded-dice", games: "roll-with-notation", odds: "exact-odds",
  cli: "seeded-shared-rolls", tray: "embed-a-tray", limits: "troubleshooting", about: "design", gallery: "roll-with-notation",
  "notation-compared": "upgrading", "loaded-dice": "custom-loaded-dice", "other-languages": "design",
  "plain-output": "embed-a-tray", "spec-notation": "how-it-works", "spec-random": "how-it-works", migrating: "upgrading", "strings-ja": "design",
};
const escape = (text) => text.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");

/** Restore the old documentation URLs after the shared generator builds its pages. */
export default function docsCompatibility() {
  const model = modelOf(root);
  const aliases = new Map();
  for (const language of ["", "ja/"]) {
    for (const [old, target] of Object.entries(guideAliases)) aliases.set(`${language}guide/${old}.html`, `${language}guides/${target}.html`);
    aliases.set(`${language}guide/api.html`, `${language}api/main/index.html`);
    aliases.set(`${language}guide/changes.html`, `${language}changelog.html`);
    aliases.set(`${language}reference/index.html`, `${language}api/main/index.html`);
  }
  const folder = { function: "functions", class: "classes", const: "variables", type: "types" };
  for (const item of model.reference.items) {
    aliases.set(`reference/${folder[item.kind]}/${item.name}.html`, item.page);

  }
  for (const entry of model.reference.entries) aliases.set(`reference/modules/${entry.slug === "main" ? "index" : entry.slug}.html`, `api/${entry.slug}/index.html`);
  for (const [old, target] of aliases) {
    const file = join(root, "site", "docs", old);
    const continuing = old.startsWith("ja/") ? "ドキュメントへ進む" : "Continue to the documentation";
    const address = posix.relative(posix.dirname(old), target);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, `<!doctype html>\n<html lang="${old.startsWith("ja/") ? "ja" : "en"}"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Korokoro documentation</title><link rel="canonical" href="${escape(address)}"><script>location.replace(${JSON.stringify(address)} + location.hash);</script></head><body><main><h1>Korokoro documentation</h1><p><a href="${escape(address)}">${continuing}</a></p></main></body></html>\n`);
  }
  console.log(`ok   ${aliases.size} published documentation addresses retained`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) docsCompatibility();
