// Building a roll by tapping, rolling it, holding dice, and the limits.
import { expect, test } from "@playwright/test";

import { chip, count, die, open, roll, sound, state, tap, type } from "./tray.mjs";

test("the opening dice are a suggestion: the first die tapped takes their place", async ({ page }) => {
  const errors = await open(page);
  let s = await state(page);
  expect(s.notation).toBe("2d6");
  expect(s.suggested).toBe("true");
  await tap(page, die(20));
  s = await state(page);
  expect(s.notation).toBe("1d20");
  expect(s.suggested).toBe("false");
  await tap(page, die(4));
  await tap(page, die(4));
  expect((await state(page)).notation).toBe("1d20+2d4");
  await sound(page, errors);
});

for (const [what, query, steps, want] of [
  ["roll twice, then a d20", "", ["roll", "roll", "die 20"], "1d20"],
  ["Clear, d8, 3", "", ["clear", "die 8", "count 3"], "3d8"],
  ["a count makes the dice the user's own", "", ["count 3", "die 20"], "3d6+1d20"],
  ["a tap on the die showing is one more of it", "", ["die 6"], "3d6"],
  ["the bonus stays when the dice are replaced", "", ["bonus", "die 20"], "1d20+1"],
  ["a die taken away, then a d20", "", ["chip 6", "die 20"], "1d6+1d20"],
  ["typed dice are the user's own", "", ["type 3d8", "die 4"], "3d8+1d4"],
  ["a shared roll is the user's own", "?roll=1d20&faces=17&at=5&v=2", ["die 4"], "1d20+1d4"],
]) {
  test(`taps: ${what}`, async ({ page }) => {
    const errors = await open(page, query);
    for (const step of steps) {
      const [verb, arg] = step.split(" ");
      if (verb === "roll") await roll(page);
      else if (verb === "die") await tap(page, die(arg));
      else if (verb === "count") await tap(page, count(arg));
      else if (verb === "chip") await tap(page, chip(arg));
      else if (verb === "clear") await tap(page, '[data-testid="kk-clear-pool"]');
      else if (verb === "bonus") await tap(page, '[data-testid="kk-mod-up"]');
      else if (verb === "type") await type(page, arg);
    }
    expect((await state(page)).notation).toBe(want);
    await sound(page, errors);
  });
}

test("a roll is built, thrown, changed and thrown again, and nothing on the page moves", async ({ page }) => {
  const errors = await open(page);
  const resting = await state(page);
  await tap(page, '[data-testid="kk-clear-pool"]');
  await tap(page, die(20));
  await tap(page, die(4));
  await tap(page, die(4));
  for (let i = 0; i < 3; i++) await tap(page, '[data-testid="kk-mod-up"]');
  let s = await state(page);
  expect(s.notation).toBe("1d20+2d4+3");
  expect(s.chips).toHaveLength(2);
  await roll(page);
  s = await sound(page, errors);
  expect(s.dice.map((d) => d.sides)).toEqual(["20", "4", "4"]);
  expect(Number(s.total)).toBe(s.dice.reduce((sum, d) => sum + d.face, 3));
  expect(s.headline).toContain("1d20+2d4+3");
  // The controls are where they were before anything was rolled, and the felt is as tall.
  expect(s.controlsTop).toBe(resting.controlsTop);
  expect(s.feltHeight).toBe(resting.feltHeight);
  await tap(page, chip(4));
  expect((await state(page)).notation).toBe("1d20+1d4+3");
  await roll(page);
  s = await sound(page, errors);
  expect(s.dice).toHaveLength(2);
  expect(s.controlsTop).toBe(resting.controlsTop);
});

test("a die is held and the rest are thrown again", async ({ page }) => {
  const errors = await open(page);
  await tap(page, die(6));
  await tap(page, count(5));
  await roll(page);
  let s = await state(page);
  expect(s.dice.every((d) => d.button)).toBe(true);
  const kept = [s.dice[0].face, s.dice[3].face];
  await tap(page, '[data-testid="kk-die"][data-index="0"]');
  await tap(page, '[data-testid="kk-die"][data-index="3"]');
  s = await state(page);
  expect(s.dice.map((d) => d.held)).toEqual([true, false, false, true, false]);
  expect(s.hint).toContain("roll the other 3");
  expect(s.releaseShown).toBe(true);
  await roll(page);
  s = await sound(page, errors);
  expect([s.dice[0].face, s.dice[3].face]).toEqual(kept);
  expect(s.dice.map((d) => d.held)).toEqual([true, false, false, true, false]);
  await tap(page, '[data-testid="kk-release"]');
  s = await state(page);
  expect(s.dice.some((d) => d.held)).toBe(false);
  expect(s.releaseShown).toBe(false);
  // With every die held there is nothing to roll, and the felt says so.
  for (let i = 0; i < 5; i++) await tap(page, `[data-testid="kk-die"][data-index="${i}"]`);
  await expect(page.locator('[data-testid="kk-tray"]')).toBeDisabled();
});

test("the limits dim the dice that would pass them, and say why", async ({ page }) => {
  const errors = await open(page);
  await tap(page, '[data-testid="kk-clear-pool"]');
  for (const sides of [20, 4, 6, 8]) await tap(page, die(sides));
  let s = await state(page);
  expect(s.notation).toBe("1d20+1d4+1d6+1d8");
  // Four kinds: every other die is dimmed.
  expect(s.dim).toEqual(expect.arrayContaining(["10", "12", "30", "100"]));
  await tap(page, count(7));
  s = await state(page);
  expect(s.notation).toBe("1d20+1d4+1d6+7d8");
  // Ten dice: nothing more can be added.
  expect(s.dim).toEqual(expect.arrayContaining(["4", "6", "8", "20"]));
  expect(s.said).not.toBe("");
  await roll(page);
  s = await sound(page, errors);
  expect(s.dice).toHaveLength(10);
});

test("the keyboard rolls, and every control has a name", async ({ page, isMobile }) => {
  test.skip(isMobile === true, "a phone has no Space key");
  const errors = await open(page);
  await page.locator("h1").click();
  await page.keyboard.press("Space");
  let s = await state(page);
  expect(s.total).not.toBe("?");
  const names = await page.evaluate(() => [...document.querySelectorAll(".kk-root button")].filter((b) => b.getBoundingClientRect().width > 0).map((b) => (b.getAttribute("aria-label") ?? b.querySelector("svg")?.getAttribute("aria-label") ?? b.textContent ?? "").trim()));
  expect(names.filter((name) => name === "")).toEqual([]);
  s = await sound(page, errors);
});
