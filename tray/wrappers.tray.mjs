// The tray as a custom element and as a Vue component: the same tray, reached another way.
import { expect, test } from "@playwright/test";

import { open, roll, sound, state, tap } from "./tray.mjs";

for (const [what, path, seed] of [
  ["<korokoro-roller>", "/pages/element.html", "element"],
  ["the Vue component", "/pages/vue.html", "vue"],
]) {
  test(`${what} shows the dice it is given, and says each roll`, async ({ page }) => {
    const errors = await open(page, path);
    let s = await sound(page, errors);
    expect(s.notation).toBe("1d20+5");
    // The dice given are a suggestion, as the tray's own opening dice are: the first die tapped takes their place.
    expect(s.suggested).toBe("true");
    await roll(page);
    s = await sound(page, errors);
    expect(s.dice).toHaveLength(1);
    await expect(page.locator("#total")).toHaveText(s.total);
    await expect(page.locator("#heard")).toHaveText("1");
    // The seed in its query makes the roll the same every time.
    const first = s.total;
    await page.reload();
    await roll(page);
    expect((await state(page)).total).toBe(first);
    expect(seed).toBeTruthy();
  });

  test(`${what} follows its dice and its language as they change, without losing its history`, async ({ page }) => {
    const errors = await open(page, path);
    await roll(page);
    await tap(page, "#dice");
    let s = await state(page);
    expect(s.notation).toBe("4d6kh3");
    await tap(page, '[data-testid="kk-tab-history"]');
    expect((await state(page)).historyRows).toBe(1);
    await tap(page, "#ja");
    await expect(page.locator('[data-testid="kk-games-panel"] summary')).toContainText("ゲーム");
    expect((await state(page)).historyRows).toBe(1);
    await roll(page);
    s = await sound(page, errors);
    expect(s.dice).toHaveLength(4);
    await expect(page.locator("#heard")).toHaveText("2");
  });

  test(`${what} takes its tray with it when it goes`, async ({ page }) => {
    const errors = await open(page, path);
    await roll(page);
    await tap(page, "#away");
    await expect(page.locator('[data-testid="kk-tray"]')).toHaveCount(0);
    await expect(page.locator(".kk-root")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test("<korokoro-roller> reads its attributes, takes options a string cannot carry, and rolls from code", async ({ page }) => {
  const errors = await open(page, "/pages/element.html");
  // sound="off": no mute button. storage="none": nothing kept.
  await expect(page.locator('[data-testid="kk-mute"]')).toHaveCount(0);
  await page.evaluate(() => window.roller.roll());
  await expect(page.locator("#heard")).toHaveText("1");
  expect(await page.evaluate(() => window.roller.history.length)).toBe(1);
  expect(await page.evaluate(() => localStorage.length)).toBe(0);
  // The options property mounts the tray afresh, themed.
  await tap(page, "#theme");
  expect(await page.evaluate(() => getComputedStyle(document.querySelector(".kk-felt")).getPropertyValue("--kk-felt").trim())).toBe("rgb(34, 51, 68)");
  expect((await state(page)).notation).toBe("1d20+5");
  // Registered once, under its own tag, as a block.
  expect(await page.evaluate(() => [customElements.get("korokoro-roller") === window.roller.constructor, getComputedStyle(window.roller).display])).toEqual([true, "block"]);
  await tap(page, "#wide");
  await sound(page, errors);
});

test("the Vue component rolls from code, through a template ref", async ({ page }) => {
  const errors = await open(page, "/pages/vue.html");
  await tap(page, "#code");
  await expect(page.locator("#heard")).toHaveText("1");
  await sound(page, errors);
});
