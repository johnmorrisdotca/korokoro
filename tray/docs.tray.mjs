// The documentation site, as built: its pages open, its links lead somewhere, its live dice roll.
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

import { open, roll } from "./tray.mjs";

const built = join(dirname(fileURLToPath(import.meta.url)), "..", "site", "docs");
const BASE = "/korokoro/docs/";

test("the home page opens, in the family's colours, with dice to roll", async ({ page }) => {
  const errors = await open(page, BASE);
  await expect(page.locator("h1")).toContainText("Korokoro");
  // The page's own colour is the family's: the demo's paper, not the theme's white.
  const paper = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(["rgb(244, 239, 228)", "rgb(20, 22, 20)"]).toContain(paper);
  await expect(page.locator('[data-testid="kk-tray"]')).toBeVisible();
  await roll(page);
  await expect(page.locator('[data-testid="kk-total"]')).toContainText("2D20KH1+5", { ignoreCase: true });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("a guide page has its live dice, its search and its links", async ({ page }) => {
  const errors = await open(page, `${BASE}guide/notation.html`);
  await expect(page.locator("h1")).toHaveText(/Dice notation/);
  // The page is its words first: the dice are folded away until asked for.
  await expect(page.locator('[data-testid="kk-tray"]').first()).toBeHidden();
  await page.locator('[data-testid="live-dice"] summary').first().click();
  await expect(page.locator('[data-testid="kk-notation"]').first()).toHaveValue("4d6kh3");
  await roll(page);
  await expect(page.locator(".kk-root").first().locator('[data-testid="kk-die"]')).toHaveCount(4);
  // A page of several trays keeps its Space key: it scrolls the page, and rolls nothing.
  const before = await page.locator(".kk-root").first().locator('[data-testid="kk-history-row"]').count();
  await page.locator("h1").click();
  await page.keyboard.press("Space");
  expect(await page.locator(".kk-root").first().locator('[data-testid="kk-history-row"]').count()).toBe(before);
  await expect(page.locator(".kk-hint kbd")).toHaveCount(0);
  // A link the README made to another of its sections now leads to the page that section is on.
  const limits = page.locator('.vp-doc a[href$="guide/limits.html#limits"]').first();
  await expect(limits).toHaveCount(1);
  await expect(page.locator(".VPNavBarSearch, .VPNavBarSearchButton, #local-search").first()).toBeAttached();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("the Japanese page says it is a stub, and its tray speaks Japanese", async ({ page }) => {
  const errors = await open(page, `${BASE}ja/`);
  await expect(page.locator(".vp-doc")).toContainText("準備中");
  await expect(page.locator('[data-testid="kk-games-panel"] summary')).toContainText("ゲーム");
  expect(errors).toEqual([]);
});

test("every page links only to pages and headings that are there", () => {
  const pages = [];
  const walk = (folder) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      if (entry.isDirectory()) walk(join(folder, entry.name));
      else if (entry.name.endsWith(".html")) pages.push(join(folder, entry.name));
    }
  };
  walk(built);
  expect(pages.length).toBeGreaterThan(200);
  const ids = new Map(pages.map((file) => [file, new Set([...readFileSync(file, "utf8").matchAll(/ id="([^"]+)"/g)].map((m) => m[1]))]));
  const lost = [];
  for (const file of pages) {
    // The guide's pages are the ones written here; the reference is TypeDoc's, checked by its own build.
    if (file.includes(`${join("docs", "reference")}`)) continue;
    const html = readFileSync(file, "utf8");
    const main = html.slice(html.indexOf('class="vp-doc'));
    for (const [, href] of main.matchAll(/<a [^>]*href="(\/korokoro\/docs\/[^"]*)"/g)) {
      const [path, anchor] = href.slice(BASE.length).split("#");
      const target = join(built, path === "" || path.endsWith("/") ? `${path}index.html` : path);
      if (!existsSync(target)) lost.push(`${file.slice(built.length)} → ${href}`);
      else if (anchor !== undefined && anchor !== "" && !ids.get(target)?.has(decodeURIComponent(anchor))) lost.push(`${file.slice(built.length)} → ${href} (no such heading)`);
    }
  }
  expect(lost).toEqual([]);
});
