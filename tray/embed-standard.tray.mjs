import { expect, test } from "@playwright/test";
import { open } from "./tray.mjs";

test("the shared builder makes both a tray and a die and shares every host format", async ({ page }) => {
  const errors = await open(page, "/builder.html?lang=en");
  await expect(page.locator("html")).toHaveAttribute("data-ready", "true");
  await expect(page.locator("#bld-code")).toContainText("korokoro-roller");
  await expect(page.locator("#bld-code")).toContainText('storage="none"');
  await page.locator('[data-maker="die"]').click();
  await expect(page.locator("#bld-stage korokoro-die .kk-die")).toBeVisible();
  await page.locator('[data-option="sides"] [data-value="20"]').click();
  for (const format of ["iframe", "module", "react", "vue", "svelte", "angular", "html", "url"]) {
    await page.locator(`#bld-formats [data-format="${format}"]`).click();
    await expect(page.locator("#bld-code")).not.toHaveText("");
  }
  await expect(page.locator("#bld-code")).toContainText("/embed/die/?sides=20");
  await page.locator('[data-lang="ja"]').click();
  await expect(page.locator("#bld-maker-says")).toContainText("サイコロ");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("reflected properties update the tray and retain on-by-default boolean behaviour", async ({ page }) => {
  const errors = await open(page, "/pages/define.html");
  const state = await page.evaluate(() => {
    const element = document.querySelector("korokoro-roller");
    element.notation = "3d6+2";
    element.width = 320;
    element.theme = "dark";
    element.label = "My dice";
    element.sound = "off";
    element.hold = false;
    element.seed = "repeat";
    const first = element.hold;
    element.hold = null;
    return { notation: element.getAttribute("notation"), width: element.getAttribute("width"), label: element.getAttribute("aria-label"), theme: element.querySelector(".kk-root").dataset.theme, sound: element.sound, first, restored: element.hold };
  });
  expect(state).toEqual({ notation: "3d6+2", width: "320", label: "My dice", theme: "dark", sound: false, first: false, restored: true });
  expect(errors).toEqual([]);
});

test("the iframe accepts canonical parameter names and writes no stored history", async ({ page }) => {
  await page.addInitScript(() => {
    window.__stored = [];
    globalThis.Storage.prototype.setItem = function (key) { window.__stored.push(key); };
  });
  const errors = await open(page, "/embed/?notation=2d6%2B3&one-pip=black&size=large&theme=dark&sound=off&seed=repeat");
  await expect(page.locator("korokoro-roller")).toHaveAttribute("notation", "2d6+3");
  await expect(page.locator("korokoro-roller")).toHaveAttribute("one-pip", "black");
  await expect(page.locator(".kk-root")).toHaveAttribute("data-theme", "dark");
  await page.getByTestId("kk-tray").click();
  await expect(page.getByTestId("kk-total")).toContainText("2d6+3");
  expect(await page.evaluate(() => window.__stored)).toEqual([]);
  expect(errors).toEqual([]);
});

test("the standalone die iframe validates attributes and honours false spellings", async ({ page }) => {
  await open(page, "/embed/?size=small&sound=off");
  await page.goto("http://korokoro.test/embed/die/?sides=20&face=7&width=120&rollable=off&sound=no&lang=ja&label=One%20die");
  await expect(page.locator(".kk-die")).toBeVisible();
  const state = await page.locator("korokoro-die").evaluate((element) => ({ face: element.face, width: element.width, rollable: element.rollable, sound: element.sound, label: element.getAttribute("aria-label") }));
  expect(state).toEqual({ face: 7, width: "120", rollable: false, sound: false, label: "One die" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth && document.documentElement.scrollHeight <= window.innerHeight)).toBe(true);
});
