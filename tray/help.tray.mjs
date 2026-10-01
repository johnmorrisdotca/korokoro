// The Help switch in the family header: off, the page is as it was; on, each option row says in one line what it does.
// And the choosers' marks: every die's mark is one size, and every label sits at the middle of its button.
import { expect, test } from "@playwright/test";

import { open } from "./tray.mjs";

const lines = (page) => page.locator(".fam-help");

test("Help is off at first, shows one line under each option row when pressed, and follows the language", async ({ page }) => {
  const errors = await open(page, "/?lang=en&seed=help");
  const row = page.locator('.kk-row:has([data-testid="kk-sides"])');
  const switchButton = page.locator("[data-help-switch]");
  await expect(switchButton).toHaveAttribute("aria-pressed", "false");
  await expect(lines(page).first()).toBeHidden();
  const felt = await page.locator('[data-testid="kk-tray"]').boundingBox();
  await switchButton.click();
  await expect(switchButton).toHaveAttribute("aria-pressed", "true");
  await expect(row.locator(".fam-help")).toBeVisible();
  await expect(row.locator(".fam-help")).toContainText("Tap a die to add one");
  // The felt is above the options and does not move.
  expect(await page.locator('[data-testid="kk-tray"]').boundingBox()).toEqual(felt);
  // Every die button has hover words.
  for (const button of await row.locator("button").all()) expect(await button.getAttribute("title")).toBeTruthy();
  await page.locator('[data-lang="ja"]').click();
  await expect(row.locator(".fam-help")).toContainText("ダイスをタップ");
  // A row drawn again keeps its line, and the choice is kept.
  await page.locator('[data-testid="kk-sides"] [data-value="20"]').click();
  await expect(page.locator('.kk-row:has([data-testid="kk-sides"]) .fam-help')).toBeVisible();
  await page.reload();
  await expect(page.locator("[data-help-switch]")).toHaveAttribute("aria-pressed", "true");
  await page.locator("[data-help-switch]").click();
  await expect(lines(page).first()).toBeHidden();
  expect(errors).toEqual([]);
});

test("the pool row says what it is and what a tap does, in each state of the roll", async ({ page }) => {
  await open(page, "/?lang=en&seed=pool");
  const hint = page.locator('[data-testid="kk-pool-hint"]');
  await expect(hint).toContainText("only a suggestion");
  await page.locator('[data-testid="kk-sides"] [data-value="8"]').click();
  await expect(hint).toContainText("Tap a group to take one die away");
  await expect(page.locator('[data-testid="kk-chip"]').first()).toHaveAttribute("title", /Take one d8 away/);
});

test("every die's mark is the same size, and every label is at the middle of its button", async ({ page }) => {
  await open(page, "/?lang=en&seed=centre");
  const sizes = await page.locator('[data-testid="kk-sides"] .kk-icon').evaluateAll((icons) => icons.map((icon) => [Math.round(icon.getBoundingClientRect().width), Math.round(icon.getBoundingClientRect().height)]));
  expect(sizes).toHaveLength(8);
  expect(new Set(sizes.map((size) => size.join("x"))).size).toBe(1);
  // The chosen button of the counts is a circle with its number at the middle of it.
  const centre = await page.locator('[data-testid="kk-count"] button[aria-pressed="true"]').evaluate((button) => {
    const range = document.createRange();
    range.selectNodeContents(button);
    const text = range.getBoundingClientRect();
    const box = button.getBoundingClientRect();
    return Math.abs(text.left + text.width / 2 - (box.left + box.width / 2));
  });
  expect(centre).toBeLessThanOrEqual(1);
});
