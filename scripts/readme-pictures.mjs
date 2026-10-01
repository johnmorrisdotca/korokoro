// Takes the pictures the README shows, from the built demo in `site/`: `pnpm pictures` (builds the demo, then runs this).
// The page is served to a browser without a port, never fetched from the live site, and the same each run:
// the rolls come from a seed (`?seed=`) and motion is reduced.
// Output: docs/desktop.jpg (1280 wide, light, English), docs/phone.jpg (390 by 844, dark, Japanese) and docs/games.jpg (390 by 844, light, English) and docs/dice-war.jpg (390 by 844, light, English).
import { existsSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const site = join(root, "site");
const docs = join(root, "docs");
const host = "http://korokoro.test";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".jpg": "image/jpeg", ".png": "image/png", ".woff2": "font/woff2" };
const QUALITY = 76;

if (!existsSync(join(site, "index.html"))) throw new Error("site/ is not built: run `pnpm pictures` (it builds the demo first)");
const browser = await chromium.launch();

/** The built demo on a seed, with `notation` typed in, `rolls` throws of it made, and one tab of the panel under the dice open. */
async function shot({ width, height, colorScheme, lang, seed, notation, game, rolls, tab, path, scrollTo }) {
  const context = await browser.newContext({ viewport: { width, height }, colorScheme, reducedMotion: "reduce", locale: "en-US", deviceScaleFactor: 2 });
  const page = await context.newPage();
  await page.route(`${host}/**`, (route) => {
    const { pathname } = new URL(route.request().url());
    const asked = join(site, pathname === "/" ? "index.html" : pathname);
    const file = existsSync(asked) && statSync(asked).isDirectory() ? join(asked, "index.html") : asked;
    if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
    return route.fulfill({ body: readFileSync(file), contentType: TYPES[file.slice(file.lastIndexOf("."))] ?? "application/octet-stream" });
  });
  await page.goto(`${host}/?lang=${lang}&seed=${seed}`);
  await page.locator('[data-testid="kk-tray"]').waitFor();
  if (game) {
    await page.locator('[data-testid="kk-games-panel"] summary').click();
    await page.locator('[data-testid="kk-games-search"]').fill(game);
    await page.locator(`[data-testid="kk-game"][data-value="${game}"]`).click();
  } else {
    const box = page.locator('[data-testid="kk-notation"]');
    await box.fill(notation);
    await box.press("Enter");
  }
  // A throw is a tap on the felt where no die lies: its lower left corner.
  for (let throws = 0; throws < rolls; throws += 1) {
    const felt = await page.locator('[data-testid="kk-tray"]').first().boundingBox();
    await page.locator('[data-testid="kk-tray"]').first().click({ position: { x: 10, y: felt.height - 10 } });
  }
  if (tab) await page.locator(`[data-testid="kk-tab-${tab}"]`).click();
  await page.waitForTimeout(400);
  if (scrollTo) await page.locator(scrollTo).evaluate((element) => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 16));
  else await page.evaluate(() => window.scrollTo(0, 0));
  await page.mouse.move(0, 0);
  await page.screenshot({ path, type: "jpeg", quality: QUALITY });
  await context.close();
}

// Eight d6, from the top of the page so the header, the language chooser and the cloth patches show, with the stats of a few throws.
await shot({ width: 1280, height: 900, colorScheme: "light", lang: "en", seed: "readme", notation: "8d6", rolls: 12, tab: "stats", path: join(docs, "desktop.jpg") });
// Four d6 with the lowest dropped, on a phone in Japanese.
await shot({ width: 390, height: 844, colorScheme: "dark", lang: "ja", seed: "readme", notation: "4d6dl1", rolls: 1, path: join(docs, "phone.jpg"), scrollTo: '[data-testid="kk-tray"]' });
// Yahtzee chosen: five d6 and its three rolls.
await shot({ width: 390, height: 844, colorScheme: "light", lang: "en", seed: "readme", game: "yahtzee", rolls: 1, path: join(docs, "games.jpg"), scrollTo: '[data-testid="kk-tray"]' });
// Dice War chosen: three players, a few throws in, with the scores and the last throw under the felt.
await shot({ width: 390, height: 844, colorScheme: "light", lang: "en", seed: "readme", game: "dice-war", rolls: 4, path: join(docs, "dice-war.jpg"), scrollTo: '[data-testid="kk-war"]' });
await browser.close();
