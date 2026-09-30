// family-template.mjs: the header, the footer and the language chooser that every
// johnmorrisdotca package's demo site shares, beside family.css. Copied unchanged into
// each repository (scripts/family-template.mjs); a package never edits it.
//
// A site script uses it at build time:
//
//   import { FAMILY_SCRIPT, familyFooter, familyHead, familyHeader, familyUnreviewed } from "./family-template.mjs";
//
//   const page = `<!doctype html><html lang="en"><head>${familyHead({ id: "kyuubu", title, description })}
//     <link rel="stylesheet" href="family.css" /><link rel="stylesheet" href="site.css" /></head>
//     <body><main>${familyHeader({ id: "kyuubu" })} … ${familyUnreviewed({ id: "kyuubu" })} … ${familyFooter({ id: "kyuubu" })}</main>
//     <script>${FAMILY_SCRIPT}</script><script type="module"> … familyLanguage({ id: "kyuubu", words: WORDS, onChange }) … </script></body></html>`;
//
// The page's own words are a table { en: { pitch, name, nameLink, foot, … }, ja: { … } }; every
// element with data-say="key" is given words[lang][key] as text, never as HTML.

const OWNER = "johnmorrisdotca";

/** The packages, in the order the footer lists them. `kana` is the name as it is written in Japanese. */
export const FAMILY = [
  { id: "korokoro", name: "Korokoro", kana: "コロコロ" },
  { id: "kyuubu", name: "Kyuubu", kana: "キューブ" },
  { id: "hitotsu", name: "Hitotsu", kana: "一つ" },
  { id: "toranpu", name: "Toranpu", kana: "トランプ" },
  { id: "tane", name: "Tane", kana: "種" },
  { id: "narabe", name: "Narabe", kana: "並べ" },
  { id: "tenka", name: "Tenka", kana: "天下" },
  { id: "kumimoji", name: "Kumimoji", kana: "組み文字" },
];

/** The words the shared header and footer say themselves, in both languages. A page's own table is laid over these. */
export const FAMILY_WORDS = {
  en: { family: "The family:", licence: "MIT" },
  ja: { family: "姉妹パッケージ:", licence: "MIT" },
};

const escape = (text) => String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const member = (id) => {
  const found = FAMILY.find((one) => one.id === id);
  if (found === undefined) throw new Error(`${id} is not in the family`);
  return found;
};
const repo = (id) => `https://github.com/${OWNER}/${id}`;
const site = (id) => `https://${OWNER}.github.io/${id}/`;
const npm = (id) => `https://www.npmjs.com/package/@${OWNER}/${id}`;

/** The lines of <head> every site shares: charset, viewport, title, description, theme colour, Open Graph. The page adds its icon and its stylesheets. */
export function familyHead({ id, title, description, ogTitle, ogDescription }) {
  member(id);
  return [
    `<meta charset="utf-8" />`,
    `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />`,
    `<title>${escape(title)}</title>`,
    `<meta name="description" content="${escape(description)}" />`,
    `<meta name="theme-color" content="#2f5d4a" />`,
    `<meta property="og:title" content="${escape(ogTitle ?? title)}" />`,
    `<meta property="og:description" content="${escape(ogDescription ?? description)}" />`,
  ].join("\n    ");
}

/**
 * The header: the name with its kana, the pitch (data-say="pitch"), a line on the name
 * (data-say="name", and a link to the README's "The name", data-say="nameLink"), the
 * "English · 日本語" chooser, and the GitHub and npm pills. `links` adds pills before those
 * two: [{ href, say }] where `say` is a key in the page's words.
 */
export function familyHeader({ id, links = [] }) {
  const { name, kana } = member(id);
  return `<header>
        <div class="intro">
          <h1>${name}<span lang="ja">${kana}</span></h1>
          <p data-say="pitch"></p>
          <p class="name"><span data-say="name"></span> <a href="${repo(id)}#the-name" data-say="nameLink"></a></p>
        </div>
        <nav>
          <div class="lang" role="group" aria-label="Language / 言語">
            <button type="button" data-lang="en" lang="en">English</button>
            <button type="button" data-lang="ja" lang="ja">日本語</button>
          </div>${links.map((link) => `\n          <a href="${escape(link.href)}" data-say="${escape(link.say)}"></a>`).join("")}
          <a href="${repo(id)}">GitHub</a>
          <a href="${npm(id)}">npm</a>
        </nav>
      </header>`;
}

/** The line shown only in Japanese: that the Japanese has not yet been read by a native reader, with the way to correct it. */
export function familyUnreviewed({ id }) {
  member(id);
  return `<p class="unreviewed" id="unreviewed" lang="ja" hidden>この日本語は、まだ日本語を母語とする方の確認を受けていません。<a href="${repo(id)}/issues/new?template=fix-a-translation.md">訂正を歓迎します</a>。</p>`;
}

/** The footer: the page's own note (data-say="foot"), the install line and the licence, and the family, each by its demo site, this package marked as the one being read. */
export function familyFooter({ id }) {
  member(id);
  const links = FAMILY.map((one) => `<a href="${site(one.id)}"${one.id === id ? ` aria-current="page"` : ""}>${one.name}</a>`).join("");
  return `<footer>
        <span data-say="foot"></span>
        <span><code>npm install @${OWNER}/${id}</code> · <a href="${repo(id)}/blob/main/LICENSE" data-say="licence"></a> © John Morris</span>
        <span class="family"><span data-say="family"></span>${links}<a href="https://itsutsu.com">itsutsu.com</a></span>
      </footer>`;
}

/**
 * The chooser's behaviour, as the source of a classic script that defines `familyLanguage`.
 * The address first (?lang=ja or ?lang=en), then what this device chose, then the browser's
 * language. `familyLanguage({ id, words, onChange })` fills every [data-say], sets <html lang>,
 * presses the right button, shows the not-yet-reviewed line in Japanese only, and returns
 * { lang, asked, say(), set(lang) }. `onChange(lang)` runs after each switch, not on the first fill.
 * [data-say-label] sets aria-label and [data-say-placeholder] sets placeholder, the same way.
 */
export const FAMILY_SCRIPT = `function familyLanguage(options) {
  var SHARED = ${JSON.stringify(FAMILY_WORDS)};
  var KEY = options.id + ".page.lang";
  var asked = new URLSearchParams(location.search).get("lang");
  if (asked !== "ja" && asked !== "en") asked = null;
  var kept = null;
  try { kept = localStorage.getItem(KEY); } catch (error) { /* A browser that keeps nothing follows its own language. */ }
  var pick = function (tag) { return String(tag).toLowerCase().indexOf("ja") === 0 ? "ja" : "en"; };
  var state = { lang: asked !== null ? asked : kept === "ja" || kept === "en" ? kept : pick(navigator.language), asked: asked };
  var word = function (key) {
    var own = options.words[state.lang] || {};
    return key in own ? own[key] : SHARED[state.lang][key];
  };
  state.word = word;
  state.say = function () {
    document.documentElement.lang = state.lang;
    document.querySelectorAll("[data-say]").forEach(function (el) { var text = word(el.dataset.say); if (text !== undefined) el.textContent = text; });
    document.querySelectorAll("[data-say-label]").forEach(function (el) { var text = word(el.dataset.sayLabel); if (text !== undefined) el.setAttribute("aria-label", text); });
    document.querySelectorAll("[data-say-placeholder]").forEach(function (el) { var text = word(el.dataset.sayPlaceholder); if (text !== undefined) el.setAttribute("placeholder", text); });
    document.querySelectorAll("[data-lang]").forEach(function (button) { button.setAttribute("aria-pressed", String(button.dataset.lang === state.lang)); });
    var note = document.getElementById("unreviewed");
    if (note !== null) note.hidden = state.lang !== "ja";
  };
  state.set = function (lang) {
    state.lang = lang === "ja" ? "ja" : "en";
    try { localStorage.setItem(KEY, state.lang); } catch (error) { /* Not remembered; still switched. */ }
    state.say();
    if (typeof options.onChange === "function") options.onChange(state.lang);
  };
  document.querySelectorAll("[data-lang]").forEach(function (button) {
    button.addEventListener("click", function () { state.set(button.dataset.lang); });
  });
  state.say();
  return state;
}`;
