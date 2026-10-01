// A framework sets a PROPERTY, not an attribute, on a custom element that has one of the name (React 19, Vue 3 and Svelte 5
// do: `<korokoro-die face="5">` is `die.face = 5`). `face` is also a read-only value, so the assignment must reach the
// attribute, and reading it must still give the face showing.
import { expect, test } from "@playwright/test";

import { open } from "./tray.mjs";

test("assigning face on a die sets the attribute and shows that face, and reading it gives the face showing", async ({ page }) => {
  const errors = await open(page, "/pages/define.html");
  await page.evaluate(() => {
    document.body.insertAdjacentHTML("beforeend", '<korokoro-die id="pd" sides="6" face="3" rollable="off"></korokoro-die>');
  });
  await expect(page.locator("#pd")).toHaveAttribute("face", "3");
  expect(await page.locator("#pd").evaluate((die) => die.face)).toBe(3);
  await page.evaluate(() => {
    document.getElementById("pd").face = 5;
  });
  await expect(page.locator("#pd")).toHaveAttribute("face", "5");
  expect(await page.locator("#pd").evaluate((die) => die.face)).toBe(5);
  // A string works as the attribute does, and null takes the attribute away.
  await page.evaluate(() => {
    document.getElementById("pd").face = "2";
  });
  await expect(page.locator("#pd")).toHaveAttribute("face", "2");
  await page.evaluate(() => {
    document.getElementById("pd").face = null;
  });
  await expect(page.locator("#pd")).not.toHaveAttribute("face", /.*/);
  expect(errors).toEqual([]);
});

test("every attribute either element watches can be set as a property without throwing", async ({ page }) => {
  const errors = await open(page, "/pages/define.html");
  const failed = await page.evaluate(() => {
    document.body.insertAdjacentHTML("beforeend", '<korokoro-die id="pd2" sides="6" face="4"></korokoro-die>');
    const trouble = [];
    for (const element of [document.querySelector("korokoro-roller"), document.getElementById("pd2")]) {
      for (const name of element.constructor.observedAttributes) {
        const property = name.replace(/-(\w)/g, (_, letter) => letter.toUpperCase());
        // Only the names that are properties of the element at all are a framework's to set; the rest are set as attributes.
        if (!(property in element) || !element.hasAttribute(name)) continue;
        try {
          element[property] = element.getAttribute(name);
        } catch (error) {
          trouble.push(`${element.localName}.${property}: ${error}`);
        }
      }
    }
    return trouble;
  });
  expect(failed).toEqual([]);
  expect(errors).toEqual([]);
});
