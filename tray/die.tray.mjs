// One die on its own: one that rolls on a tap, one that only shows a face, the colour of a d6's one pip, and the element.
import { expect, test } from "@playwright/test";

import { open, tap } from "./tray.mjs";

const rolls = '[data-testid="solo-rolls"] [data-testid="kk-solo-die"]';
const shows = '[data-testid="solo-shows"] [data-testid="kk-solo-die"]';
const face = async (page, selector) => Number(await page.locator(selector).getAttribute("data-face"));
const fits = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

test("a die that rolls: a tap throws it onto a face it has, and says so", async ({ page }) => {
  const errors = await open(page, "?lang=en");
  await expect(page.locator(rolls)).toHaveJSProperty("tagName", "BUTTON");
  await expect(page.locator(rolls)).toHaveAttribute("aria-label", "d20 showing 20. Tap to roll");
  const seen = new Set();
  for (let at = 0; at < 24; at++) {
    await tap(page, rolls);
    await expect(page.locator('[data-testid="solo-said"]')).toContainText("Rolled");
    const landed = await face(page, rolls);
    expect(landed).toBeGreaterThanOrEqual(1);
    expect(landed).toBeLessThanOrEqual(20);
    await expect(page.locator('[data-testid="solo-said"]')).toHaveText(`Rolled ${landed}.`);
    await expect(page.locator(rolls)).toHaveAttribute("aria-label", `d20 showing ${landed}. Tap to roll`);
    seen.add(landed);
  }
  expect(seen.size).toBeGreaterThan(3);
  expect(await fits(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test("a die that does not roll shows the face it is given, and a tap does nothing", async ({ page }) => {
  const errors = await open(page, "?lang=en");
  await expect(page.locator(shows)).toHaveJSProperty("tagName", "SPAN");
  await expect(page.locator(shows)).toHaveAttribute("role", "img");
  await expect(page.locator(shows)).toHaveAttribute("aria-label", "d20 showing 20");
  await page.locator(shows).scrollIntoViewIfNeeded();
  await page.locator(shows).click({ force: true });
  expect(await face(page, shows)).toBe(20);
  await tap(page, '[data-testid="solo-next"]');
  expect(await face(page, shows)).toBe(1);
  await tap(page, '[data-testid="solo-next"]');
  await expect(page.locator(shows)).toHaveAttribute("aria-label", "d20 showing 2");
  // Another kind: the die is made again, showing its top face.
  await tap(page, '[data-testid="solo-kind"] [data-sides="6"]');
  await expect(page.locator(shows)).toHaveAttribute("aria-label", "d6 showing 6");
  await expect(page.locator(rolls)).toHaveAttribute("data-sides", "6");
  await tap(page, '[data-testid="solo-next"]');
  expect(await face(page, shows)).toBe(1);
  expect(errors).toEqual([]);
});

test("a d6's one pip is red, and black when asked, on the die and on the tray", async ({ page }) => {
  await open(page, "?lang=en");
  await tap(page, '[data-testid="solo-kind"] [data-sides="6"]');
  await tap(page, '[data-testid="solo-next"]');
  await expect(page.locator(shows)).toHaveAttribute("data-face", "1");
  const pip = page.locator(`${shows} .kk-pip-one`);
  const fill = (locator) => locator.evaluate((el) => getComputedStyle(el).fill);
  const red = await fill(pip);
  const ink = await pip.evaluate((el) => getComputedStyle(el.closest(".kk-root")).getPropertyValue("--kk-die-ink").trim());
  expect(red).toBe("rgb(181, 69, 44)");
  await tap(page, '[data-testid="solo-pip"] [data-pip="black"]');
  expect(await fill(pip)).toBe("rgb(31, 35, 32)");
  expect(ink).toBe("#1f2320");
  await expect(page.locator('[data-testid="korokoro"]')).toHaveAttribute("data-one-pip", "black");
  await tap(page, '[data-testid="solo-pip"] [data-pip="red"]');
  expect(await fill(pip)).toBe(red);
});

test("the die is one steady square, never selectable, and the page still fits", async ({ page }) => {
  await open(page, "?lang=en");
  const box = (selector) => page.locator(selector).evaluate((el) => { const r = el.closest(".kk-solo").getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
  expect(await box(rolls)).toEqual([150, 150]);
  expect(await box(shows)).toEqual([150, 150]);
  expect(await page.locator(rolls).evaluate((el) => getComputedStyle(el.closest(".kk-solo")).userSelect)).toBe("none");
  expect(await fits(page)).toBeLessThanOrEqual(0);
});

test.describe("with motion allowed", () => {
  test.use({ reducedMotion: "no-preference" });

  test("it tumbles inside its square, and lands after the throw it was given", async ({ page }) => {
    await open(page, "?lang=en");
    const square = () => page.locator(rolls).evaluate((el) => { const r = el.closest(".kk-solo").getBoundingClientRect(); return `${Math.round(r.x)},${Math.round(r.y)},${Math.round(r.width)},${Math.round(r.height)}`; });
    await page.locator(rolls).scrollIntoViewIfNeeded();
    const before = await square();
    await page.locator(rolls).click();
    await expect(page.locator(rolls)).toHaveAttribute("data-rolling", "true");
    expect(await square()).toBe(before);
    await expect(page.locator(rolls)).toHaveAttribute("data-rolling", "false", { timeout: 3000 });
    expect(await square()).toBe(before);
    await expect(page.locator('[data-testid="solo-said"]')).toContainText("Rolled");
  });

  test("a throw in the middle of a tumble is not taken", async ({ page }) => {
    await open(page, "?lang=en");
    const landings = await page.evaluate(async () => {
      const { mountDie } = await import("/dist/index.js");
      const box = document.createElement("div");
      document.body.append(box);
      const landed = [];
      const die = mountDie(box, { sides: 6, animationMs: 300, onRoll: (f) => landed.push(f) });
      die.roll();
      die.roll();
      die.roll();
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      die.destroy();
      return landed;
    });
    expect(landings).toHaveLength(1);
  });
});

test("a seeded die throws the same faces every time", async ({ page }) => {
  await open(page, "?lang=en");
  const run = () =>
    page.evaluate(async () => {
      const { mountDie, seededSource } = await import("/dist/index.js");
      const box = document.createElement("div");
      document.body.append(box);
      const landed = [];
      const die = mountDie(box, { sides: 20, animationMs: 0, source: seededSource("table"), onRoll: (f) => landed.push(f) });
      for (let at = 0; at < 8; at++) die.roll();
      die.destroy();
      return landed;
    });
  const first = await run();
  expect(first).toHaveLength(8);
  expect(await run()).toEqual(first);
});

test("the element: a die by tag, one that shows a face, and an event for each throw", async ({ page }) => {
  const errors = await open(page, "?lang=en");
  await page.addScriptTag({ type: "module", content: 'import "/dist/element-define.js";' });
  await page.evaluate(() => {
    const holder = document.createElement("div");
    holder.id = "tags";
    holder.innerHTML = '<korokoro-die id="t-roll" sides="8" size="small" seed="x"></korokoro-die><korokoro-die id="t-show" sides="6" face="5" rollable="off" width="80" one-pip="black"></korokoro-die>';
    document.body.append(holder);
    window.__thrown = [];
    document.addEventListener("korokoro-die-roll", (event) => window.__thrown.push(event.detail));
  });
  await expect(page.locator("#t-roll button")).toHaveAttribute("aria-label", "d8 showing 8. Tap to roll");
  await expect(page.locator("#t-show [role=img]")).toHaveAttribute("aria-label", "d6 showing 5");
  expect(await page.locator("#t-roll .kk-solo").evaluate((el) => el.getBoundingClientRect().width)).toBe(48);
  expect(await page.locator("#t-show .kk-solo").evaluate((el) => el.getBoundingClientRect().width)).toBe(80);
  await page.locator("#t-roll button").scrollIntoViewIfNeeded();
  await page.locator("#t-roll button").click();
  await expect.poll(() => page.evaluate(() => window.__thrown.length)).toBe(1);
  await page.locator("#t-show").evaluate((el) => el.setAttribute("face", "3"));
  await expect(page.locator("#t-show [role=img]")).toHaveAttribute("aria-label", "d6 showing 3");
  await page.locator("#t-show").evaluate((el) => el.setAttribute("rollable", "on"));
  await expect(page.locator("#t-show button")).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("in Japanese the die speaks Japanese", async ({ page }) => {
  await open(page, "?lang=ja");
  await expect(page.locator(rolls)).toHaveAttribute("aria-label", "d20、出目は 20。タップで振る");
  expect(await fits(page)).toBeLessThanOrEqual(0);
});

test("the documentation shows both dice, live: one rolls on a tap, one never does", async ({ page }) => {
  const errors = await open(page, "/korokoro/docs/guide/use.html");
  const live = page.locator('[data-testid="live-die"]');
  await live.scrollIntoViewIfNeeded();
  await expect(live.locator('[data-testid="kk-solo-die"]')).toHaveCount(2);
  await live.locator("button.kk-die").click();
  await expect(live.locator(".live-die-said")).toContainText("Rolled");
  await expect(live.locator('[role="img"].kk-die')).toHaveAttribute("data-face", "5");
  await live.locator('[role="img"].kk-die').click({ force: true });
  await expect(live.locator('[role="img"].kk-die')).toHaveAttribute("data-face", "5");
  expect(await fits(page)).toBeLessThanOrEqual(0);
  expect(errors).toEqual([]);
});

test("the embed page draws a d6's one pip in black when its address says so", async ({ page }) => {
  const errors = await open(page, "/embed/?dice=1d6&size=small&sound=off&onepip=black");
  await expect(page.locator('[data-testid="korokoro"]')).toHaveAttribute("data-one-pip", "black");
  expect(errors).toEqual([]);
});
