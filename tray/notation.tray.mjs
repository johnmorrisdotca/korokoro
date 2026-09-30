// Dice typed as notation: what is rolled, what is refused and how it says so, and the rules a roll is shown by.
import { expect, test } from "@playwright/test";

import { open, roll, sound, state, tap, type } from "./tray.mjs";

test("typed notation is rolled as typed, and written back one way", async ({ page }) => {
  const errors = await open(page);
  await type(page, "4d6dl1");
  let s = await state(page);
  expect(s.notation).toBe("4d6kh3");
  await roll(page);
  s = await sound(page, errors);
  expect(s.dice).toHaveLength(4);
  expect(s.dice.filter((d) => d.status === "dropped")).toHaveLength(1);
  const kept = s.dice.filter((d) => d.status === "kept").reduce((sum, d) => sum + d.face, 0);
  expect(Number(s.total)).toBe(kept);
  // Dice that are kept and dropped cannot be held: a die is a picture, and a tap on it rolls.
  expect(s.dice.some((d) => d.button)).toBe(false);
});

test("a refusal names the part and leaves the dice as they were", async ({ page }) => {
  const errors = await open(page);
  await type(page, "4d6!kh3");
  let s = await state(page);
  expect(s.error).toContain("“!”");
  await expect(page.locator('[data-testid="kk-notation"]')).toHaveAttribute("aria-invalid", "true");
  await type(page, "11d6");
  expect((await state(page)).error).toContain("“11”");
  await type(page, "6d10>=11");
  expect((await state(page)).error).toContain("“>=11”");
  await type(page, "3d8+2");
  s = await sound(page, errors);
  expect(s.error).toBe("");
  expect(s.notation).toBe("3d8+2");
});

test("successes are counted, and each die says whether it is one", async ({ page }) => {
  const errors = await open(page);
  await type(page, "6d10>7f1");
  let s = await state(page);
  expect(s.notation).toBe("6d10>=8f=1");
  await roll(page);
  s = await sound(page, errors);
  expect(s.headline).toContain("Successes");
  const successes = s.dice.filter((d) => d.face >= 8).length;
  const failures = s.dice.filter((d) => d.face === 1).length;
  expect(Number(s.total)).toBe(successes - failures);
  expect(s.dice.filter((d) => d.counts === "1")).toHaveLength(successes);
  expect(s.dice.filter((d) => d.counts === "-1")).toHaveLength(failures);
  // Read aloud, a success says so.
  const label = await page.locator('[data-testid="kk-die"] svg').first().getAttribute("aria-label");
  expect(label).toContain("d10");
  await page.locator('[data-testid="kk-tab-odds"]').click();
  await expect(page.locator('[data-testid="kk-odds"]')).toBeVisible();
});

test("exploding, penetrating and compounding dice add up to what they show", async ({ page }) => {
  const errors = await open(page, "?seed=boom");
  for (const text of ["3d6!", "3d6!!", "3d6!p", "3d6!>=5"]) {
    await type(page, text);
    for (let i = 0; i < 6; i++) {
      await roll(page);
      const s = await state(page);
      const standing = s.dice.filter((d) => d.status === "kept");
      // A penetrating die's extra dice count one less: the line under the total says which.
      const extras = text === "3d6!p" ? standing.filter((d) => d.exploded).length : 0;
      expect(Number(s.total), `${text}: ${s.sum}`).toBe(standing.reduce((sum, d) => sum + d.face, 0) - extras);
    }
  }
  await sound(page, errors);
});

test("marks, a least and a most, a sort and a label", async ({ page }) => {
  const errors = await open(page, "?seed=marks");
  await type(page, "4d6min2max5sd # steady hands");
  let s = await state(page);
  expect(s.notation).toBe("4d6min2max5sd # steady hands");
  await roll(page);
  s = await sound(page, errors);
  expect(s.headline).toContain("# steady hands");
  const worth = s.dice.map((d) => Math.min(5, Math.max(2, d.face)));
  expect(Number(s.total)).toBe(worth.reduce((a, b) => a + b, 0));
  // Shown from the highest down.
  expect(worth).toEqual([...worth].sort((a, b) => b - a));
  await type(page, "1d20cs>=11cf<=10");
  await roll(page);
  s = await sound(page, errors);
  expect(s.dice[0].hit).toBe(s.dice[0].face >= 11 ? "crit" : "fumble");
});

test("a link to typed dice opens them, and a label is only ever text", async ({ page }) => {
  const errors = await open(page, `?dice=${encodeURIComponent("2d6 # <b>bold</b>")}&v=2`);
  const s = await sound(page, errors);
  expect(s.notation).toBe("2d6 # <b>bold</b>");
  expect(s.markup).toBe(false);
});

test("a formula is rolled as written, shown with its dice, and left alone by the buttons", async ({ page }) => {
  const errors = await open(page, "?seed=formula");
  await type(page, "( 2d6 + 3 ) x 2");
  let s = await sound(page, errors);
  expect(s.notation).toBe("(2d6+3)*2");
  await expect(page.locator('[data-testid="kk-formula"]')).toBeVisible();
  // The chips, the count, the bonus and Keep cannot change a formula.
  await expect(page.locator('[data-testid="kk-chip"]').first()).toBeDisabled();
  await expect(page.locator('[data-testid="kk-mod-up"]')).toBeDisabled();
  await expect(page.locator('[data-testid="kk-count"] button').first()).toBeDisabled();
  await roll(page);
  s = await sound(page, errors);
  const [a, b] = s.dice.map((d) => d.face);
  expect(Number(s.total)).toBe((a + b + 3) * 2);
  expect(s.sum).toBe(`([${a} ${b}]+3)*2`);
  // A division has to be rounded, and the refusal says how.
  await type(page, "4d6/2");
  expect((await state(page)).error).toContain("floor(…)");
  await type(page, "floor(4d6/2)");
  await roll(page);
  s = await sound(page, errors);
  expect(Number(s.total)).toBe(Math.floor(s.dice.reduce((sum, d) => sum + d.face, 0) / 2));
  // A die tapped starts a new roll.
  await tap(page, '[data-testid="kk-sides"] button[data-value="20"]');
  s = await sound(page, errors);
  expect(s.notation).toBe("1d20");
  await expect(page.locator('[data-testid="kk-formula"]')).toHaveCount(0);
});

test("dice that all differ never show a face twice", async ({ page }) => {
  const errors = await open(page, "?seed=differ");
  await type(page, "5d6u");
  for (let i = 0; i < 8; i++) {
    await roll(page);
    const s = await state(page);
    expect(new Set(s.dice.map((d) => d.face)).size).toBe(5);
  }
  await tap(page, '[data-testid="kk-tab-odds"]');
  await sound(page, errors);
});
