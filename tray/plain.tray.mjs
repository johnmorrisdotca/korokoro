// The plain-output page, the page that frames it, and a page written for a CDN.
import { expect, test } from "@playwright/test";

import { open, roll, sound, state } from "./tray.mjs";

const out = (page) => page.locator('[data-testid="api-out"]');

test("an address is answered as the command line would answer it", async ({ page }) => {
  let errors = await open(page, "/api/?roll=2d20kh1%2B5&seed=table");
  await expect(out(page)).toHaveText("2d20kh1+5: 24  [19 (12)]\n", { useInnerText: false });
  await expect(out(page)).toHaveAttribute("data-code", "0");
  await expect(page.locator('[data-testid="api-err"]')).toBeHidden();
  expect(errors).toEqual([]);

  errors = await open(page, "/api/?roll=2d20kh1%2B5&seed=table&format=json");
  const data = JSON.parse(await out(page).textContent());
  expect([data.format, data.rolls[0].total, data.rolls[0].faces]).toEqual([1, 24, [19, 12]]);

  errors = await open(page, "/api/?roll=2d6&roll=1d20&seed=table&format=csv");
  expect((await out(page).textContent()).split("\r\n")).toHaveLength(4);

  errors = await open(page, "/api/?roll=4d6dl1&times=6&seed=table");
  expect((await out(page).textContent()).split("\n")).toHaveLength(8);

  errors = await open(page, "/api/?roll=2d6&odds=1");
  await expect(out(page)).toContainText("range 2 to 12 · expected 7");

  errors = await open(page, "/api/?game=cho-han&seed=table&lang=ja");
  await expect(out(page)).toContainText("丁半");
  expect(await page.evaluate(() => document.documentElement.lang)).toBe("ja");

  errors = await open(page, "/api/?roll=-1d6%2B10&seed=table");
  await expect(out(page)).toContainText("-1d6+10: ");
  expect(errors).toEqual([]);
});

test("what cannot be rolled is said, with the command line's exit code", async ({ page }) => {
  await open(page, "/api/?roll=11d6");
  await expect(out(page)).toHaveAttribute("data-code", "1");
  await expect(page.locator('[data-testid="api-err"]')).toHaveText("korokoro: 11d6: “11”: roll 1 to 10 dice at a time");
  await open(page, "/api/?roll=2d6&format=xml");
  await expect(out(page)).toHaveAttribute("data-code", "2");
  await open(page, "/api/?roll=40d6&max-dice=100&seed=table");
  await expect(out(page)).toHaveAttribute("data-code", "0");
});

test("with no dice it says how it is used, and that it runs in the browser", async ({ page }) => {
  const errors = await open(page, "/api/");
  await expect(out(page)).toContainText("?roll=2d6+3");
  await expect(page.locator('[data-testid="api-note"]')).toContainText("This page runs in your browser");
  // Nothing on it is wider than a phone.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test("a page that frames it is sent the answer, and can ask for more", async ({ page }) => {
  const errors = await open(page, "/pages/frame.html");
  await expect(page.locator("#first")).toHaveText(/^\?roll=2d6&seed=frame&format=json 0 \d+$/);
  await expect(page.locator("#second")).toHaveText("?roll=1d20%2B5&seed=frame&format=json 0 1d20+5");
  await expect(page.locator("#bad")).toHaveText("1 korokoro: 11d6: “11”: roll 1 to 10 dice at a time");
  expect(errors).toEqual([]);
});

test("a page written for a CDN works as written", async ({ page }) => {
  const errors = await open(page, "/pages/cdn.html");
  await expect(page.locator("#said")).toHaveText(/^Rolled \d+; 15 or more comes up 80% of the time\.$/);
  let s = await sound(page, errors);
  expect(s.notation).toBe("2d20kh1+5");
  await roll(page);
  s = await state(page);
  expect(s.dice).toHaveLength(2);
  expect(errors).toEqual([]);
});
