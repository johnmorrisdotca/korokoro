// One level down: rolling several times, dice of your own, loaded dice, saved sets, and testing a real die.
import { expect, test } from "@playwright/test";

import { die, open, roll, sound, state, tap, type } from "./tray.mjs";

const more = (page) => tap(page, '[data-testid="kk-more"] summary');

test("Times throws the roll several times in one tap", async ({ page }) => {
  const errors = await open(page);
  const resting = await state(page);
  await type(page, "4d6dl1");
  await more(page);
  for (let i = 0; i < 5; i++) await tap(page, '[data-testid="kk-times-up"]');
  let s = await state(page);
  expect(s.notation).toBe("6#4d6kh3");
  await roll(page);
  await tap(page, '[data-testid="kk-tab-history"]');
  s = await sound(page, errors);
  expect(s.setLines).toHaveLength(6);
  expect(s.setSum).toMatch(/^Sum of all 6: \d+$/);
  expect(s.historySets).toBe(1);
  expect(s.hint).toContain("Tap to roll all 6 again");
  // One entry in the history, which opens to its six rolls.
  await tap(page, '[data-testid="kk-history-set"] summary');
  expect((await state(page)).historyRows).toBe(6);
  await tap(page, '[data-testid="kk-tab-odds"]');
  await expect(page.locator('[data-testid="kk-set-odds"]')).toContainText("at least one of 6 rolls");
  // Back to one roll, and the page is where it was.
  for (let i = 0; i < 5; i++) await tap(page, '[data-testid="kk-times-down"]');
  await more(page);
  await roll(page);
  s = await sound(page, errors);
  expect(s.setLines).toHaveLength(0);
  expect(s.controlsTop).toBe(resting.controlsTop);
});

test("a die of your own is made, rolled, and its words are only ever text", async ({ page }) => {
  const errors = await open(page);
  await more(page);
  await page.locator('[data-testid="kk-custom-faces"]').fill("Yes, No, Maybe");
  await tap(page, '[data-testid="kk-custom-add"]');
  expect((await state(page)).notation).toBe("1d[Yes,No,Maybe]");
  await roll(page);
  let s = await sound(page, errors);
  expect(["Yes", "No", "Maybe"]).toContain(s.total);
  await page.locator('[data-testid="kk-custom-faces"]').fill("<b>bold</b>, <img src=x>");
  await tap(page, '[data-testid="kk-custom-add"]');
  await roll(page);
  s = await sound(page, errors);
  expect(s.markup).toBe(false);
  await page.locator('[data-testid="kk-custom-faces"]').fill("only");
  await tap(page, '[data-testid="kk-custom-add"]');
  await expect(page.locator('[data-testid="kk-custom-error"]')).not.toBeEmpty();
});

test("a loaded die says it is loaded, everywhere, and a fair one never does", async ({ page }) => {
  const errors = await open(page);
  await more(page);
  await tap(page, '[data-testid="kk-clear-pool"]');
  await tap(page, '[data-testid="kk-loaded-preset"][data-value="optimist"]');
  let s = await state(page);
  expect(s.notation).toBe("1d6{6:3}");
  await roll(page);
  s = await sound(page, errors);
  expect(s.loadedBadge).toBe(true);
  await expect(page.locator('[data-testid="kk-die"]').first()).toHaveAttribute("data-loaded", "true");
  await tap(page, '[data-testid="kk-tab-odds"]');
  await expect(page.locator('[data-testid="kk-odds-loaded"]')).toBeVisible();
  await tap(page, '[data-testid="kk-copy"]');
  await tap(page, '[data-testid="kk-clear-pool"]');
  await tap(page, die(6));
  await roll(page);
  s = await sound(page, errors);
  expect(s.loadedBadge).toBe(false);
});

test("a set is saved, used, kept across a reload, and deleted", async ({ page }) => {
  const errors = await open(page);
  await type(page, "1d8+3");
  await more(page);
  await page.locator('[data-testid="kk-set-name"]').fill("Longsword");
  await tap(page, '[data-testid="kk-set-save"]');
  await expect(page.locator('[data-testid="kk-set"]')).toHaveCount(1);
  await tap(page, '[data-testid="kk-clear-pool"]');
  await tap(page, '[data-testid="kk-set-use"]');
  expect((await state(page)).notation).toBe("1d8+3");
  await page.reload();
  await more(page);
  await expect(page.locator('[data-testid="kk-set"]')).toContainText("Longsword");
  await tap(page, '[data-testid="kk-set-delete"]');
  await expect(page.locator('[data-testid="kk-set"]')).toHaveCount(0);
  await sound(page, errors);
});

test("a real die's results are tested for fairness", async ({ page }) => {
  const errors = await open(page);
  await tap(page, '[data-testid="kk-tab-stats"]');
  await tap(page, '[data-testid="kk-test"] summary');
  const results = page.locator('[data-testid="kk-test-results"]');
  await results.fill(Array.from({ length: 60 }, (_, i) => (i % 3 === 0 ? 6 : (i % 6) + 1)).join(" "));
  await expect(page.locator('[data-testid="kk-test-verdict"]')).not.toBeEmpty();
  await results.fill("3 5 x");
  await expect(page.locator('[data-testid="kk-test-verdict"]')).toContainText("x");
  await sound(page, errors);
});
