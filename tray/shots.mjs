// Pictures of the tray for a person to look at: `node tray/shots.mjs <folder> <name>`. Not a test.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

const site = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const [folder = ".", name = "tray"] = process.argv.slice(2);
const browser = await chromium.launch();
for (const width of [390, 1280]) {
  const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: "reduce", locale: "en-US" });
  const page = await context.newPage();
  await page.route("http://korokoro.test/**", (route) => {
    const { pathname } = new URL(route.request().url());
    const file = join(site, pathname === "/" ? "index.html" : pathname);
    return existsSync(file) ? route.fulfill({ body: readFileSync(file), contentType: file.endsWith(".js") ? "text/javascript" : "text/html" }) : route.fulfill({ status: 404, body: "" });
  });
  for (const [step, text, tab] of [
    ["pool", "6d10>=8f=1", "history"],
    ["again", "5d10>=8!", "odds"],
    ["penetrating", "3d6!p", "history"],
    ["marks", "4d6min2max5sd # steady hands", "history"],
    ["attack", "1d20cs>=19cf=1+1d4+5 # attack", "odds"],
  ]) {
    await page.goto(`http://korokoro.test/?seed=k17-${step}`);
    const box = page.locator('[data-testid="kk-notation"]');
    await box.fill(text);
    await box.press("Enter");
    await page.locator("h1").click();
    for (let i = 0; i < 3; i++) await page.keyboard.press("Space");
    await page.locator(`[data-testid="kk-tab-${tab}"]`).click();
    await page.screenshot({ path: join(folder, `${name}-${step}-${width}.png`), fullPage: width === 1280 ? false : true });
  }
  await context.close();
}
await browser.close();
