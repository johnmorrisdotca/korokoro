// The Games control: finding a game, playing its dice, and the ways in and out of one.
import { expect, test } from "@playwright/test";

import { open, roll, sound, state, tap, type } from "./tray.mjs";

const games = (page) => tap(page, '[data-testid="kk-games-panel"] summary');
async function choose(page, id, search) {
  // The list stays open after a game is stopped: open it only when it is shut.
  if (!(await page.locator('[data-testid="kk-games-panel"]').evaluate((panel) => panel.open))) await games(page);
  await page.locator('[data-testid="kk-games-search"]').fill(search);
  await tap(page, `[data-testid="kk-game"][data-value="${id}"]`);
}

test("a game is found by any of its names", async ({ page }) => {
  const errors = await open(page);
  expect((await state(page)).game).toBe("Games: none chosen");
  await games(page);
  expect((await state(page)).games).toBeGreaterThanOrEqual(40);
  const search = page.locator('[data-testid="kk-games-search"]');
  await search.fill("yacht");
  expect((await state(page)).games).toBe(1);
  await search.fill("丁半");
  expect((await state(page)).games).toBe(1);
  await search.fill("no such game");
  await expect(page.locator('[data-testid="kk-games-nothing"]')).toBeVisible();
  await expect(page.locator('[data-testid="kk-games-missing"]')).toHaveAttribute("href", /suggest-a-game/);
  await sound(page, errors);
});

test("Yahtzee is three rolls with dice held between them", async ({ page }) => {
  const errors = await open(page);
  await choose(page, "yahtzee", "yacht");
  let s = await state(page);
  expect([s.notation, s.game]).toEqual(["5d6", "Games: Yahtzee"]);
  await roll(page);
  s = await state(page);
  expect(s.hint).toContain("Roll 1 of 3");
  expect(s.headline).toContain("Yahtzee");
  const kept = [s.dice[0].face, s.dice[1].face];
  await tap(page, '[data-testid="kk-die"][data-index="0"]');
  await tap(page, '[data-testid="kk-die"][data-index="1"]');
  await roll(page);
  s = await state(page);
  expect([s.dice[0].face, s.dice[1].face]).toEqual(kept);
  await roll(page);
  s = await sound(page, errors);
  expect(s.hint).toContain("That was roll 3 of 3");
  expect(s.dice.some((d) => d.button)).toBe(false);
  await roll(page);
  expect((await state(page)).hint).toContain("Roll 1 of 3");
  await tap(page, '[data-testid="kk-tab-odds"]');
  expect((await state(page)).outcomes).toContain("347,897/7,558,272");
});

test("craps reads each roll in the light of the last, and holds nothing", async ({ page }) => {
  const errors = await open(page);
  await choose(page, "craps", "craps");
  const readings = [];
  for (let i = 0; i < 8; i++) {
    await roll(page);
    const s = await state(page);
    readings.push(s.reading);
    // Holding a die is no part of craps: the dice are pictures.
    expect(s.dice.some((d) => d.button)).toBe(false);
  }
  for (const reading of readings) expect(reading).toMatch(/come-out|point|seven out/i);
  const s = await sound(page, errors);
  await tap(page, '[data-testid="kk-tab-odds"]');
  expect((await state(page)).outcomes).toContain("244/495");
  expect(s.hint).not.toContain("hold");
});

test("Risk is read as a battle, with fewer dice when some are taken away", async ({ page }) => {
  const errors = await open(page);
  await choose(page, "risk", "risk");
  await roll(page);
  let s = await state(page);
  expect(s.notation).toBe("3d6+2d[1,2,3,4,5,6]");
  expect(s.total).toMatch(/loses/);
  await tap(page, '[data-testid="kk-tab-odds"]');
  expect((await state(page)).outcomes).toContain("2,890/7,776");
  // The second chip is the defender's dice: one taken away leaves three against one.
  await tap(page, '[data-testid="kk-chip"] >> nth=1');
  await roll(page);
  s = await sound(page, errors);
  expect(s.total).toMatch(/loses 1/);
});

test("a game is left by stopping it, by typing dice, and by Clear", async ({ page }) => {
  const errors = await open(page);
  await choose(page, "cho-han", "cho");
  await roll(page);
  expect((await state(page)).total).toMatch(/^(Chō|Han)/);
  await games(page);
  await tap(page, '[data-testid="kk-games-stop"]');
  expect((await state(page)).game).toBe("Games: none chosen");
  await choose(page, "pig", "pig");
  await type(page, "2d8");
  expect((await state(page)).game).toBe("Games: none chosen");
  await choose(page, "pig", "pig");
  await tap(page, '[data-testid="kk-clear-pool"]');
  expect((await state(page)).game).toBe("Games: none chosen");
  await sound(page, errors);
});

test("a link opens a game, in either language", async ({ page }) => {
  let errors = await open(page, "?game=cho-han&lang=en&seed=link");
  await roll(page);
  let s = await sound(page, errors);
  expect(s.game).toBe("Games: Chō-han");
  expect(s.total).toMatch(/^(Chō|Han)/);
  errors = await open(page, "?game=cho-han&lang=ja&seed=link");
  await roll(page);
  s = await sound(page, errors);
  expect(s.game).toBe("ゲーム: 丁半");
  expect(s.total).toMatch(/^(丁|半)/);
});

test("the demo's own examples set their dice and leave any game", async ({ page }) => {
  const errors = await open(page, "?game=yahtzee");
  await tap(page, '[data-roll="6#4d6dl1"]');
  await expect(page.locator('[data-testid="kk-set-line"]')).toHaveCount(6);
  const s = await sound(page, errors);
  expect([s.notation, s.game]).toEqual(["6#4d6kh3", "Games: none chosen"]);
});
