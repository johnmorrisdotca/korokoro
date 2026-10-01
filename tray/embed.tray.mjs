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

test("the cloth: chosen on the header's patches, the demo's tray and the code follow; the embed and the element take it by name", async ({ page }) => {
  const errors = await open(page, "/?lang=en&cloth=red");
  // Every patch is named and big enough to press; the address's cloth is the one pressed.
  await expect(page.locator('button[data-cloth="red"]')).toHaveAttribute("aria-checked", "true");
  await expect(page.locator('button[data-cloth="wood"]')).toHaveAttribute("aria-label", "Wood");
  await expect(root(page)).toHaveAttribute("data-cloth", "red");
  await expect(page.locator('[data-testid="embed-tag"]')).toContainText('cloth="red"');
  await page.locator('button[data-cloth="wood"]').click();
  await expect(root(page)).toHaveAttribute("data-cloth", "wood");
  expect(await root(page).evaluate((tray) => getComputedStyle(tray).getPropertyValue("--kk-felt").trim())).toBe("#e2ba7a");
  await expect(page.locator('[data-testid="embed-preview"]')).toHaveAttribute("src", /cloth=wood/);
  await expect(page.locator('[data-testid="embed-tag"]')).toContainText('cloth="wood"');
  // Green is the tray's own, and is never written into the code.
  await page.locator('button[data-cloth="green"]').click();
  await expect(page.locator('[data-testid="embed-tag"]')).not.toContainText("cloth=");
  expect(errors).toEqual([]);
});

test("the embed page and the element lay the felt in the cloth they are given, and the element changes it in place", async ({ page }) => {
  const errors = await open(page, "/embed/?size=small&cloth=blue&sound=off");
  await expect(root(page)).toHaveAttribute("data-cloth", "blue");
  expect(await root(page).evaluate((tray) => getComputedStyle(tray).getPropertyValue("--kk-felt").trim())).toBe("#2865a6");
  await page.evaluate(async () => {
    await import("../dist/element-define.js");
    document.body.insertAdjacentHTML("beforeend", '<korokoro-roller id="mine" notation="1d20" size="small" cloth="black" sound="off" storage="off"></korokoro-roller>');
  });
  const mine = page.locator('#mine [data-testid="korokoro"]');
  await expect(mine).toHaveAttribute("data-cloth", "black");
  // A roll made, then the cloth changed: the roll stays, as the tray is not mounted again.
  await page.locator('#mine [data-testid="kk-tray"]').click();
  const total = await page.locator('#mine [data-testid="kk-total"]').textContent();
  await page.evaluate(() => document.getElementById("mine").setAttribute("cloth", "red"));
  await expect(mine).toHaveAttribute("data-cloth", "red");
  expect(await page.locator('#mine [data-testid="kk-total"]').textContent()).toBe(total);
  expect(errors).toEqual([]);
});
