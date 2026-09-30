// What every tray test starts from: the built demo in `site/`, served to the
// page without a port, and the tray's state read off the page.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

const site = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const pages = join(dirname(fileURLToPath(import.meta.url)), "pages");
const vue = join(dirname(fileURLToPath(import.meta.url)), "..", "node_modules", "vue", "dist", "vue.esm-browser.prod.js");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png" };

/** Open the demo with a query, and collect anything the page complains of. */
export async function open(page, query = "?seed=tray") {
  if (!existsSync(join(site, "index.html"))) throw new Error("site/ is not built: run `pnpm site` first (`pnpm test:tray` does)");
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await page.route("http://korokoro.test/**", (route) => {
    const { pathname } = new URL(route.request().url());
    // The demo, and beside it the pages that try the custom element and the Vue component, with Vue's own browser build for the second.
    const file = pathname === "/vue.js" ? vue : pathname.startsWith("/pages/") ? join(pages, pathname.slice(7)) : join(site, pathname === "/" ? "index.html" : pathname);
    if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
    return route.fulfill({ body: readFileSync(file), contentType: TYPES[file.slice(file.lastIndexOf("."))] ?? "application/octet-stream" });
  });
  // A query opens the demo; a path opens another page.
  await page.goto(`http://korokoro.test/${query.startsWith("/") ? query.slice(1) : query}`);
  await expect(page.locator('[data-testid="kk-tray"]')).toBeVisible();
  return errors;
}

/** Tap, as a finger would where the page is touched and as a mouse where it is not. */
export async function tap(page, selector, options = {}) {
  const target = page.locator(selector).first();
  await target.scrollIntoViewIfNeeded();
  if (test.info().project.use.hasTouch === true) await target.tap(options);
  else await target.click(options);
}

/** Tap the felt where no die and no button lies: its lower left corner. */
export async function roll(page) {
  const felt = page.locator('[data-testid="kk-tray"]');
  await felt.scrollIntoViewIfNeeded();
  const box = await felt.boundingBox();
  await tap(page, '[data-testid="kk-tray"]', { position: { x: 10, y: box.height - 10 } });
}

/** Type notation into the box and enter it. */
export async function type(page, text) {
  const box = page.locator('[data-testid="kk-notation"]');
  await box.fill(text);
  await box.press("Enter");
}

export const die = (sides) => `[data-testid="kk-sides"] button[data-value="${sides}"]`;
export const count = (n) => `[data-testid="kk-count"] button[data-value="${n}"]`;
export const chip = (sides) => `[data-testid="kk-chip"][data-value="${sides}"]`;

/** The tray as the page shows it. */
export function state(page) {
  return page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const all = (s) => [...document.querySelectorAll(s)];
    const box = (e) => e.getBoundingClientRect();
    return {
      notation: q('[data-testid="kk-notation"]').value,
      error: q(".kk-error")?.textContent ?? "",
      chips: all('[data-testid="kk-chip"]').map((c) => c.textContent.trim()),
      headline: q('[data-testid="kk-total"] small')?.textContent ?? null,
      total: q('[data-testid="kk-total"]')?.lastChild.textContent ?? null,
      sum: q('[data-testid="kk-sum"]')?.textContent ?? null,
      reading: q('[data-testid="kk-reading"]')?.textContent ?? null,
      dice: all('[data-testid="kk-die"]').map((d) => ({ sides: d.dataset.sides, face: Number(d.dataset.face), held: d.getAttribute("aria-pressed") === "true", status: d.dataset.status, counts: d.dataset.counts ?? null, hit: d.dataset.hit ?? null, exploded: d.dataset.exploded === "true", button: d.tagName === "BUTTON" })),
      hint: q(".kk-hint").textContent,
      said: q('[data-testid="kk-said"]')?.textContent ?? "",
      dim: all('[data-testid="kk-sides"] button:disabled, [data-testid="kk-count"] button:disabled').map((b) => b.dataset.value),
      suggested: q('[data-testid="kk-chip"]')?.dataset.suggested ?? null,
      game: q('[data-testid="kk-games-panel"] summary').textContent,
      games: all('[data-testid="kk-game"]').filter((g) => !g.hidden).length,
      setLines: all('[data-testid="kk-set-line"]').map((l) => l.textContent),
      setSum: q('[data-testid="kk-set-sum"]')?.textContent ?? null,
      historyRows: all('[data-testid="kk-history-row"]').length,
      historySets: all('[data-testid="kk-history-set"]').length,
      outcomes: q('[data-testid="kk-outcomes"]')?.textContent ?? null,
      oddsTitle: q('[data-testid="kk-odds-title"]')?.textContent ?? null,
      releaseShown: q('[data-testid="kk-release"]') !== null && !q('[data-testid="kk-release"]').hidden,
      loadedBadge: q('[data-testid="kk-loaded-badge"]') !== null,
      pageWidth: document.documentElement.scrollWidth,
      windowWidth: window.innerWidth,
      controlsTop: Math.round(box(q(".kk-controls")).top + window.scrollY),
      feltHeight: Math.round(box(q(".kk-felt")).height),
      // Anything to be tapped that is smaller than a fingertip. Links in running text are words, not targets.
      small: all(".kk-root button, .kk-root input, .kk-root textarea, .kk-root summary")
        .filter((e) => box(e).width > 0 && !e.hidden && (box(e).height < 43.5 || box(e).width < 43.5))
        .map((e) => `${e.dataset.testid ?? e.className ?? e.tagName}: ${Math.round(box(e).width)}×${Math.round(box(e).height)}`),
      markup: q(".kk-root").innerHTML.includes("<img") || q(".kk-root").innerHTML.includes("<b>bold"),
    };
  });
}

/** What holds in every state the tray can be in: nothing wider than the screen, nothing too small to tap, nothing complained of. */
export async function sound(page, errors) {
  const s = await state(page);
  expect(s.pageWidth, "the page is no wider than the window").toBe(s.windowWidth);
  expect(s.small, "every target is at least 44px").toEqual([]);
  expect(errors, "the page complained of nothing").toEqual([]);
  return s;
}
