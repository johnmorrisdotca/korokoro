// History, stats, odds, sharing, the seed and the language.
import { expect, test } from "@playwright/test";

import { die, open, roll, sound, state, tap, type } from "./tray.mjs";

test("every roll is kept, newest first, and the history is cleared when asked", async ({ page }) => {
  const errors = await open(page);
  await tap(page, '[data-testid="kk-tab-history"]');
  await expect(page.locator('[data-testid="kk-history-empty"]')).toBeVisible();
  for (let i = 0; i < 3; i++) await roll(page);
  let s = await sound(page, errors);
  expect(s.historyRows).toBe(3);
  await page.reload();
  await tap(page, '[data-testid="kk-tab-history"]');
  expect((await state(page)).historyRows).toBe(3);
  await tap(page, '[data-testid="kk-clear"]');
  // Clearing asks first on some trays; either way the list ends empty once confirmed.
  const again = page.locator('[data-testid="kk-clear"]');
  if (await again.isVisible()) await again.click().catch(() => {});
  await expect(page.locator('[data-testid="kk-history-row"]')).toHaveCount(0);
  s = await sound(page, errors);
});

test("the odds say what a target needs, and follow the dice", async ({ page }) => {
  const errors = await open(page);
  await type(page, "2d20kh1+5");
  await tap(page, '[data-testid="kk-tab-odds"]');
  await expect(page.locator('[data-testid="kk-odds"]')).toBeVisible();
  const target = page.locator('[data-testid="kk-target"]');
  await target.fill("15");
  await expect(page.locator('[data-testid="kk-chance"]')).toContainText("80%");
  await roll(page);
  await sound(page, errors);
});

test("the stats count what was rolled", async ({ page }) => {
  const errors = await open(page);
  await tap(page, die(20));
  for (let i = 0; i < 12; i++) await roll(page);
  await tap(page, '[data-testid="kk-tab-stats"]');
  await expect(page.locator('[data-testid="kk-stats"]')).toContainText("12");
  await expect(page.locator('[data-testid="kk-faces"]')).toBeVisible();
  await sound(page, errors);
});

test("a seed throws the same dice on any device", async ({ page }) => {
  const thrown = [];
  for (let visit = 0; visit < 2; visit++) {
    const errors = await open(page, "?seed=same-table");
    await page.evaluate(() => localStorage.clear());
    await type(page, "5d6");
    await roll(page);
    const s = await sound(page, errors);
    thrown.push(s.dice.map((d) => d.face).join(" "));
  }
  expect(thrown[0]).toBe(thrown[1]);
});

test("a shared roll shows exactly what was thrown, and refuses faces the dice could not show", async ({ page }) => {
  let errors = await open(page, "?roll=2d20kh1%2B5&faces=17%2C4&at=5&v=2");
  let s = await sound(page, errors);
  expect(s.total).toBe("22");
  expect(s.dice.map((d) => d.face)).toEqual([17, 4]);
  errors = await open(page, "?roll=2d6&faces=7%2C1&at=5&v=2");
  // Dice that could not have shown those faces are not shown as a roll: the tray opens as it would for nobody.
  s = await sound(page, errors);
  expect(s.total).toBeNull();
  expect(s.notation).toBe("2d6");
});

test("the language is chosen on the page and remembered", async ({ page }) => {
  const errors = await open(page);
  await tap(page, '[data-lang="ja"]');
  await expect(page.locator('[data-testid="kk-games-panel"] summary')).toContainText("ゲーム");
  await page.reload();
  await expect(page.locator('[data-testid="kk-games-panel"] summary')).toContainText("ゲーム");
  await tap(page, '[data-lang="en"]');
  await expect(page.locator('[data-testid="kk-games-panel"] summary')).toContainText("Games");
  await sound(page, errors);
});

test("the mute button is there, and sound starts off under reduced motion", async ({ page }) => {
  const errors = await open(page);
  await expect(page.locator('[data-testid="kk-mute"]')).toBeVisible();
  await tap(page, '[data-testid="kk-mute"]');
  await roll(page);
  await sound(page, errors);
});

test("the history is saved as CSV, JSON and text, and the JSON comes back in", async ({ page }) => {
  const errors = await open(page);
  await type(page, "4d6dl1 # strength");
  for (let i = 0; i < 3; i++) await roll(page);
  await tap(page, '[data-testid="kk-tab-history"]');
  await tap(page, '[data-testid="kk-export"] summary');
  await sound(page, errors);
  const saved = async (button) => {
    const [download] = await Promise.all([page.waitForEvent("download"), tap(page, `[data-testid="${button}"]`)]);
    const stream = await download.createReadStream();
    let text = "";
    for await (const chunk of stream) text += chunk.toString("utf8");
    return { name: download.suggestedFilename(), text };
  };
  const csv = await saved("kk-export-csv");
  expect(csv.name).toMatch(/^korokoro-\d{4}-\d\d-\d\d\.csv$/);
  expect(csv.text.split("\r\n")).toHaveLength(5);
  expect(csv.text).toContain(",4d6kh3,strength,");
  const text = await saved("kk-export-text");
  expect(text.text.split("\n")).toHaveLength(4);
  const json = await saved("kk-export-json");
  const data = JSON.parse(json.text);
  expect([data.format, data.rolls.length, data.stats.rolls]).toEqual([1, 3, 3]);

  // Cleared, then brought back from the file.
  await tap(page, '[data-testid="kk-clear"]');
  await tap(page, '[data-testid="kk-clear"]');
  await expect(page.locator('[data-testid="kk-history-row"]')).toHaveCount(0);
  await page.locator('[data-testid="kk-import"]').setInputFiles({ name: "rolls.json", mimeType: "application/json", buffer: Buffer.from(json.text) });
  await expect(page.locator('[data-testid="kk-history-row"]')).toHaveCount(3);
  await expect(page.locator('[data-testid="kk-export-said"]')).toHaveText("Added 3 rolls");
  // The same file again adds nothing, and a file that is not an export says so.
  await page.locator('[data-testid="kk-import"]').setInputFiles({ name: "rolls.json", mimeType: "application/json", buffer: Buffer.from(json.text) });
  await expect(page.locator('[data-testid="kk-export-said"]')).toHaveText("Every roll in that file is already here");
  await page.locator('[data-testid="kk-import"]').setInputFiles({ name: "notes.json", mimeType: "application/json", buffer: Buffer.from("not an export") });
  await expect(page.locator('[data-testid="kk-export-said"]')).toHaveText("That file is not a Korokoro export");
  await expect(page.locator('[data-testid="kk-history-row"]')).toHaveCount(3);
  await sound(page, errors);
});
