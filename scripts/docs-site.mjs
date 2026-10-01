// Makes the pages of the documentation site from what the repository already
// says: the README, split at its headings into pages, and the documents in
// docs/. Nothing is written twice: a sentence corrected in the README is
// corrected on the site, and every example on the site is one the tests run.
//
//   pnpm docs:site      builds the package, makes the pages, then builds the site into site/docs
//
// What it writes (website/guide, website/reference, website/public and two
// files under website/.vitepress) is made, not kept: git ignores it.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const out = join(root, "website");
const REPO = "https://github.com/johnmorrisdotca/korokoro/blob/main/";
const read = (file) => readFileSync(join(root, file), "utf8");

/** The README's sections, gathered into pages: [address, title, the README's own headings that go on it, a line for the home page]. */
const FROM_README = [
  ["start", "Getting started", ["Roll in 30 seconds", "Who it is for", "Features"]],
  ["use", "Use it in your project", ["Use it in your project"]],
  ["notation", "Dice notation", ["Dice notation"]],
  ["rolls", "Rolls", ["What a roll returns", "Several rolls in one go", "Holding dice", "Seeded and shared rolls"]],
  ["dice", "Dice of your own", ["Custom dice", "Loaded dice, and testing a die", "Sets of dice"]],
  ["games", "Games and Dice War", ["Games", "Dice War"]],
  ["odds", "Odds", ["Odds"]],
  ["cli", "The command line and export", ["The command line", "Export", "Dice from an address"]],
  ["api", "API in brief", ["API"]],
  ["tray", "The tray", ["Sound", "Theming", "Browser support", "Accessibility", "Languages"]],
  ["limits", "Limits", ["Limits"]],
  ["about", "About Korokoro", ["Architecture", "The name", "Where it comes from, and where it is used", "Roadmap", "Contributing", "Licence"]],
];

/** The documents in docs/, as they are: [file, address, title]. */
const FROM_DOCS = [
  ["docs/games.md", "gallery", "The games, one by one"],
  ["docs/notation-compared.md", "notation-compared", "Notation compared"],
  ["docs/loaded-dice.md", "loaded-dice", "Loaded dice, and how to catch one"],
  ["docs/other-languages.md", "other-languages", "From another language"],
  ["docs/plain-output.md", "plain-output", "Dice as plain text"],
  ["docs/spec/notation.md", "spec-notation", "Specification: the notation"],
  ["docs/spec/random.md", "spec-random", "Specification: the generator"],
  ["docs/migrating.md", "migrating", "Migrating"],
  ["docs/strings-ja.md", "strings-ja", "The tray's words, in English and Japanese"],
  ["CHANGELOG.md", "changes", "Changes"],
];

/** Live dice, put on a page under a heading: the tray itself, for the reader to roll. */
const LIVE = {
  "Roll in 30 seconds": `notation="2d20kh1+5"`,
  "Dice notation": `notation="4d6dl1"`,
  Formulas: `notation="(2d6+3)*2"`,
  "Custom dice": `notation="d[Yes,No,Maybe]"`,
  "Loaded dice, and testing a die": `notation="d6{6:3}"`,
  "Holding dice": `notation="5d6"`,
  Games: `query="?game=yahtzee"`,
  Odds: `notation="2d6"`,
  "Several rolls in one go": `notation="6#4d6dl1"`,
};

/** A heading's address, as GitHub makes it: the same one the README's own links use. */
const slug = (heading) =>
  heading
    .trim()
    .toLowerCase()
    .replace(/<[^>]*>/g, "")
    .replace(/[^\p{L}\p{N}\s_-]/gu, "")
    .replace(/\s/g, "-");

/** A Markdown file as its lines, with which of them are inside a code fence. */
function lines(text) {
  let fenced = false;
  return text.split("\n").map((line) => {
    const fence = /^\s*```/.test(line);
    if (fence) fenced = !fenced;
    return { line, code: fenced || fence };
  });
}

// 1. The README, cut at its second-level headings.
const readme = lines(read("README.md"));
const sections = new Map();
let current = null;
for (const { line, code } of readme) {
  const heading = !code && /^## (.+)$/.exec(line);
  if (heading) {
    current = heading[1];
    sections.set(current, []);
  } else if (current !== null) sections.get(current).push(line);
}
const used = new Set(FROM_README.flatMap(([, , names]) => names));
const left = [...sections.keys()].filter((name) => !used.has(name) && name !== "Changes");
if (left.length > 0) throw new Error(`the README has sections with no page: ${left.join(", ")}`);

// 2. Where every heading lives, so that a link to it finds it on whichever page it went to.
const pages = [];
for (const [address, title, names] of FROM_README) {
  const body = names.flatMap((name) => {
    if (!sections.has(name)) throw new Error(`the README has no section “${name}”`);
    return names.length === 1 && name === title ? sections.get(name) : [`## ${name}`, ...sections.get(name)];
  });
  pages.push({ address, title, source: "README.md", body: body.join("\n") });
}
for (const [file, address, title] of FROM_DOCS) {
  // The document's own first heading is its title; the page is given the title listed here.
  pages.push({ address, title, source: file, body: read(file).replace(/^# .+\n/, "") });
}
const home = new Map();
for (const page of pages) {
  home.set(`${page.source}#`, page.address);
  for (const { line, code } of lines(page.body)) {
    const heading = !code && /^#{2,4} (.+)$/.exec(line);
    if (heading) home.set(`${page.source}#${slug(heading[1])}`, page.address);
  }
}
// The README's page titles are headings of its own too.
for (const [address, , names] of FROM_README) for (const name of names) home.set(`README.md#${slug(name)}`, address);

/** A link as the site wants it: to the page a heading went to, or to the file on GitHub when it is not a page. */
function link(target, source) {
  if (/^(https?:|mailto:|#$)/.test(target)) return target;
  const [path, anchor = ""] = target.split("#");
  const file = path === "" ? source : posix.normalize(posix.join(posix.dirname(source), path));
  const page = home.get(`${file}#${anchor}`) ?? home.get(`${file}#`);
  if (page === undefined || (anchor !== "" && !home.has(`${file}#${anchor}`) && file === "README.md")) {
    if (file === "README.md" || file.startsWith("..")) throw new Error(`${source} links to ${target}, which is nowhere on the site`);
    return `${REPO}${file}${anchor === "" ? "" : `#${anchor}`}`;
  }
  return `/guide/${page}${anchor === "" ? "" : `#${anchor}`}`;
}

/** A page's Markdown, made ready: links pointed at the site, headings given the addresses links use, live dice put in. */
function ready(page) {
  const made = [];
  // A heading said twice on a page is numbered from the second, as GitHub numbers it.
  const seen = new Map();
  const address = (heading) => {
    const base = slug(heading);
    const times = seen.get(base) ?? 0;
    seen.set(base, times + 1);
    return times === 0 ? base : `${base}-${times}`;
  };
  for (const { line, code } of lines(page.body)) {
    if (code) {
      made.push(line);
      continue;
    }
    let text = line.replace(/\]\(([^)\s]+)\)/g, (whole, target) => `](${link(target, page.source)})`);
    // The README's pictures are HTML so that GitHub centres them; here they are plain pictures.
    text = text.replace(/<p align="center"><img src="docs\/([^"]+)" alt="([^"]*)"[^>]*><\/p>/, (whole, file, alt) => `![${alt}](/${file})`);
    const heading = /^(#{2,4}) (.+)$/.exec(text);
    if (heading) {
      made.push(`${heading[1]} ${heading[2]} {#${address(heading[2])}}`);
      const live = page.source === "README.md" ? LIVE[heading[2]] : undefined;
      if (live !== undefined) made.push("", `<LiveDice ${live} />`);
      if (page.source === "README.md" && heading[2] === "One die on its own") made.push("", "<LiveDie />");
    } else made.push(text);
  }
  const first = page.source === "README.md" && LIVE[page.title] !== undefined && !page.body.includes(`## ${page.title}`) ? `\n<LiveDice ${LIVE[page.title]} />\n` : "";
  return `---\ntitle: ${JSON.stringify(page.title)}\n---\n\n# ${page.title}\n${first}\n${made.join("\n")}\n`;
}

rmSync(join(out, "guide"), { recursive: true, force: true });
rmSync(join(out, "public"), { recursive: true, force: true });
mkdirSync(join(out, "guide"), { recursive: true });
mkdirSync(join(out, "public"), { recursive: true });
for (const page of pages) writeFileSync(join(out, "guide", `${page.address}.md`), ready(page));
for (const picture of ["desktop.jpg", "phone.jpg", "games.jpg"]) cpSync(join(root, "docs", picture), join(out, "public", picture));

// 3. The sidebar, in the order a reader would want the pages.
const entry = (address) => ({ text: pages.find((page) => page.address === address).title, link: `/guide/${address}` });
const sidebar = [
  { text: "Start", items: ["start", "use"].map(entry) },
  { text: "Rolling", items: ["notation", "rolls", "dice", "games", "gallery", "odds", "loaded-dice"].map(entry) },
  { text: "Using it", items: ["tray", "cli", "plain-output", "other-languages", "api", "limits"].map(entry).concat([{ text: "API reference", link: "/reference/" }]) },
  { text: "Reference", items: ["notation-compared", "spec-notation", "spec-random", "strings-ja", "migrating", "changes"].map(entry) },
  { text: "About", items: ["about"].map(entry) },
];
writeFileSync(join(out, ".vitepress", "sidebar.json"), `${JSON.stringify(sidebar, null, 2)}\n`);

// 4. The family's colours and type, read from family.css and never copied by hand: the site's theme is laid over them.
const family = read("demo/family.css");
const block = (pattern) => (pattern.exec(family)?.[1] ?? "").replace(/\s+/g, " ").trim();
const light = block(/:root \{([^}]*)\}/);
const dark = block(/:root\[data-theme="dark"\] \{([^}]*)\}/);
if (!light.includes("--page") || !dark.includes("--page")) throw new Error("family.css has no colours where they were");
writeFileSync(join(out, ".vitepress", "theme", "family-tokens.css"), `/* Made from demo/family.css by scripts/docs-site.mjs: the family's own values, under the site's own names. */\n:root { ${light} }\n.dark { ${dark} }\n`);

console.log(`website/ has ${pages.length} pages, from the README and docs/`);
