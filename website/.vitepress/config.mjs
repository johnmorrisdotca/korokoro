// The documentation site: VitePress, laid over the family's colours. Its pages
// are made from the README and docs/ by scripts/docs-site.mjs, which also
// writes the sidebar; this file says how they are put together.
import { readFileSync } from "node:fs";

import { defineConfig } from "vitepress";

const sidebar = JSON.parse(readFileSync(new URL("./sidebar.json", import.meta.url), "utf8"));
const repo = "https://github.com/johnmorrisdotca/korokoro";

export default defineConfig({
  title: "Korokoro",
  description: "Dice roller and dice notation parser with exact odds: the documentation.",
  lang: "en",
  base: "/korokoro/docs/",
  outDir: "../site/docs",
  cleanUrls: false,
  lastUpdated: false,
  head: [["meta", { name: "theme-color", content: "#2f5d4a" }]],
  vue: { template: { compilerOptions: { isCustomElement: (tag) => tag === "korokoro-roller" } } },
  locales: {
    root: { label: "English", lang: "en" },
    ja: { label: "日本語", lang: "ja", link: "/ja/", description: "正確な確率を計算するダイスローラー: ドキュメント" },
  },
  themeConfig: {
    siteTitle: "Korokoro コロコロ",
    nav: [
      { text: "Guide", link: "/guide/start" },
      { text: "Notation", link: "/guide/notation" },
      { text: "API", link: "/reference/" },
      { text: "Roll some dice", link: "https://johnmorrisdotca.github.io/korokoro/" },
    ],
    sidebar: { "/guide/": sidebar, "/reference/": sidebar },
    socialLinks: [
      { icon: "github", link: repo },
      { icon: "npm", link: "https://www.npmjs.com/package/@johnmorrisdotca/korokoro" },
    ],
    search: { provider: "local" },
    outline: { level: [2, 3] },
    editLink: { pattern: `${repo}/blob/main/README.md`, text: "These pages are made from the README and docs/ on GitHub" },
    footer: { message: "MIT © John Morris", copyright: "Korokoro is one of a family: Kyuubu, Hitotsu, Toranpu, Tane, Narabe, Tenka, Kumimoji." },
  },
});
