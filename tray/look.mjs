// Pictures of the demo in its main states, to see whether a change to its styles moved anything:
//   node tray/look.mjs <folder>            take them
//   node tray/look.mjs <folder> <other>    take them into <other> and compare with <folder>, pixel for pixel
// Not a test: the pictures depend on the machine's fonts, so two runs are compared on one machine.
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import { chromium } from "@playwright/test";

// KOROKORO_SITE is another built site to look at, and KOROKORO_LOOK_ABOVE a selector for the first thing left out of the pictures, with all after it.
const site = process.env.KOROKORO_SITE ?? join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const above = process.env.KOROKORO_LOOK_ABOVE;
const [before, after] = process.argv.slice(2);
const into = after ?? before ?? "look";
mkdirSync(into, { recursive: true });
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const browser = await chromium.launch();
const names = [];
for (const width of [390, 1280]) {
  for (const scheme of ["light", "dark"]) {
    for (const lang of ["en", "ja"]) {
      const context = await browser.newContext({ viewport: { width, height: 900 }, colorScheme: scheme, reducedMotion: "reduce", locale: "en-US" });
      const page = await context.newPage();
      await page.route("http://korokoro.test/**", (route) => {
        const { pathname } = new URL(route.request().url());
        const file = join(site, pathname === "/" ? "index.html" : pathname);
        return existsSync(file) ? route.fulfill({ body: readFileSync(file), contentType: TYPES[file.slice(file.lastIndexOf("."))] ?? "application/octet-stream" }) : route.fulfill({ status: 404, body: "" });
      });
      await page.goto(`http://korokoro.test/?seed=look&lang=${lang}`);
      if (above !== undefined) await page.addStyleTag({ content: `${above}, ${above} ~ * { display: none !important; }` });
      const shot = async (state) => {
        // The time of a roll is the one thing that differs from run to run.
        await page.evaluate(() => document.querySelectorAll("time").forEach((time) => (time.textContent = "12:00:00")));
        const name = `${width}-${scheme}-${lang}-${state}.png`;
        names.push(name);
        await page.screenshot({ path: join(into, name), fullPage: true });
      };
      await shot("open");
      await page.locator("h1").click();
      await page.keyboard.press("Space");
      await page.keyboard.press("Space");
      await shot("rolled");
      const box = page.locator('[data-testid="kk-notation"]');
      await box.fill("11d6");
      await box.press("Enter");
      await shot("refused");
      await box.fill("6d10>=8f=1");
      await box.press("Enter");
      await page.locator("h1").click();
      await page.keyboard.press("Space");
      await page.locator('[data-testid="kk-tab-odds"]').click();
      await shot("odds");
      await page.locator('[data-testid="kk-tab-stats"]').click();
      await shot("stats");
      await page.locator('[data-testid="kk-games-panel"] summary').click();
      await page.locator('[data-testid="kk-game"][data-value="craps"]').click();
      await page.locator("h1").click();
      await page.keyboard.press("Space");
      await page.locator('[data-testid="kk-tab-odds"]').click();
      await page.locator('[data-testid="kk-games-panel"] summary').click();
      await page.locator('[data-testid="kk-more"] summary').click();
      await shot("games-more");
      await page.locator('[data-testid="kk-tab-history"]').click();
      await page.locator('[data-testid="kk-export"] summary').click();
      await page.locator('[data-lang="en"]').focus();
      await shot("history-export-focus");
      await context.close();
    }
  }
}

if (after !== undefined) {
  // Compare in a page: both pictures drawn to a canvas, and every pixel looked at.
  const page = await browser.newPage();
  let moved = 0;
  for (const name of names) {
    const [a, b] = [before, after].map((folder) => `data:image/png;base64,${readFileSync(join(folder, name)).toString("base64")}`);
    const found = await page.evaluate(async ([one, two]) => {
      const load = (src) => new Promise((resolve) => { const image = new Image(); image.onload = () => resolve(image); image.src = src; });
      const [x, y] = [await load(one), await load(two)];
      if (x.width !== y.width || x.height !== y.height) return `sizes differ: ${x.width}×${x.height} and ${y.width}×${y.height}`;
      const data = (image) => { const canvas = new OffscreenCanvas(image.width, image.height); const c = canvas.getContext("2d"); c.drawImage(image, 0, 0); return c.getImageData(0, 0, image.width, image.height).data; };
      const [p, q] = [data(x), data(y)];
      let count = 0, left = x.width, top = x.height, right = 0, bottom = 0;
      for (let i = 0; i < p.length; i += 4) {
        if (p[i] === q[i] && p[i + 1] === q[i + 1] && p[i + 2] === q[i + 2] && p[i + 3] === q[i + 3]) continue;
        count += 1;
        const px = (i / 4) % x.width, py = Math.floor(i / 4 / x.width);
        left = Math.min(left, px); right = Math.max(right, px); top = Math.min(top, py); bottom = Math.max(bottom, py);
      }
      return count === 0 ? null : `${count} pixels differ, within x ${left} to ${right}, y ${top} to ${bottom}`;
    }, [a, b]);
    if (found !== null) moved += 1;
    console.log(`${found === null ? "same" : "MOVED"} ${name}${found === null ? "" : `: ${found}`}`);
  }
  console.log(moved === 0 ? `all ${names.length} pictures are the same, pixel for pixel` : `${moved} of ${names.length} pictures differ`);
  process.exitCode = moved === 0 ? 0 : 1;
}
await browser.close();
