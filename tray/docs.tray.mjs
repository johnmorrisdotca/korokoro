// Published documentation addresses retain their jobs while the shared site supplies translated guides and search.
import { expect, test } from "@playwright/test";
import { open, roll } from "./tray.mjs";

async function docs(page, path) {
  await page.route("http://korokoro.test/**", async (route) => {
    const { readFile } = await import("node:fs/promises");
    const { join } = await import("node:path");
    const pathname = new URL(route.request().url()).pathname.replace(/^\/korokoro\//, "/");
    const file = join(process.cwd(), "site", pathname.endsWith("/") ? `${pathname}index.html` : pathname);
    const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json" };
    try { await route.fulfill({ body: await readFile(file), contentType: types[file.slice(file.lastIndexOf("."))] ?? "application/octet-stream" }); }
    catch { await route.fulfill({ status: 404, body: "" }); }
  });
  await page.goto(`http://korokoro.test/korokoro/docs/${path}`);
}

test("the documentation home has guides, reference and a link to the native dice demo", async ({ page }) => {
  await docs(page, "index.html");
  await expect(page.locator("h1")).toContainText("Dice roller with notation and exact odds");
  await expect(page.locator('main a[href*="getting-started.html"]').first()).toBeVisible();
  await expect(page.locator('a[href*="api/main/index.html"]').first()).toBeAttached();
});

test("the published notation guide leads to its translated recipe and live tray", async ({ page }) => {
  await docs(page, "guide/notation.html");
  await expect(page.locator("h1")).toHaveText("Roll with notation");
  await page.locator('main').getByRole("link", { name: "Embed a tray", exact: true }).click();
  await expect(page.locator("h1")).toHaveText("Embed a tray");
  const link = page.getByRole("link", { name: "Try the live tray" });
  await expect(link).toHaveAttribute("href", /embed\/\?notation=2d6/);
  // The same native tray can be rolled locally; the documentation points to its published frame.
  await open(page);
  await roll(page);
  await expect(page.locator('[data-testid="kk-result"]').first()).not.toHaveText("");
});

test("Japanese documentation is translated and the old API address reaches the new reference", async ({ page }) => {
  await docs(page, "ja/guides/getting-started.html");
  await expect(page.locator("h1")).toHaveText("使い始める");
  await expect(page.locator("main")).not.toContainText("準備中");
  await docs(page, "reference/functions/roll.html");
  await expect(page.locator("h1")).toContainText("roll");
});
