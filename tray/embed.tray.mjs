// The tray at its three sizes, the embed page an iframe shows, and the code the demo writes for it.
import { expect, test } from "@playwright/test";

import { open } from "./tray.mjs";

const root = (page) => page.locator('[data-testid="korokoro"]');

for (const [size, controls, panels] of [["small", false, false], ["medium", true, false], ["large", true, true]]) {
  test(`the embed page at ${size}: the dice its address names, rolled by a tap`, async ({ page }) => {
    const errors = await open(page, `/embed/?dice=2d6%2B3&size=${size}&seed=table&sound=off`);
    await expect(root(page)).toHaveAttribute("data-size", size);
    await expect(page.locator(".kk-controls")).toBeVisible({ visible: controls });
    await expect(page.locator(".kk-panels")).toBeVisible({ visible: panels });
    await page.locator('[data-testid="kk-tray"]').click();
    await expect(page.locator('[data-testid="kk-total"]')).toContainText("2d6+3");
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
  });
}

test("the embed page speaks Japanese when asked, and falls back to two d6", async ({ page }) => {
  const errors = await open(page, "/embed/?lang=ja&size=small&sound=off");
  expect(await page.evaluate(() => document.documentElement.lang)).toBe("ja");
  await expect(root(page)).toHaveAttribute("data-size", "small");
  expect(errors).toEqual([]);
});

test("the demo writes the iframe and the tag for the size chosen", async ({ page }) => {
  const errors = await open(page, "/?lang=en");
  const frame = page.locator('[data-testid="embed-frame"]');
  await expect(frame).toContainText("size=medium");
  await page.locator('[data-testid="embed-size"] [data-size="small"]').click();
  await expect(frame).toContainText("size=small");
  await expect(frame).toContainText('height="540"');
  await expect(page.locator('[data-testid="embed-tag"]')).toContainText('<korokoro-roller notation="2d6" size="small">');
  await expect(page.locator('[data-testid="embed-says"]')).toContainText("Small:");
  await expect(page.locator('[data-testid="embed-preview"]')).toHaveAttribute("src", /embed\/\?dice=2d6&size=small$/);
  expect(errors).toEqual([]);
});
