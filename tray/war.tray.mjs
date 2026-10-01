// Dice War in the tray: chosen under Games, played with the tray's own dice, kept as text, and left again.
import { expect, test } from "@playwright/test";

import { decodeDiceWar, diceWarOver, diceWarWinners, playDiceWar } from "../dist/index.js";
import { open, roll, sound, state, tap } from "./tray.mjs";

const war = (page, id) => page.locator(`[data-testid="${id}"]`);
async function sitDown(page) {
  await games(page);
  await tap(page, '[data-testid="kk-game"][data-value="dice-war"]');
  await expect(war(page, "kk-war")).toBeVisible();
}
/** The list of games shuts when a game is chosen: open it again if it is shut. */
async function games(page) {
  if (!(await page.locator('[data-testid="kk-games-panel"]').evaluate((panel) => panel.open))) await tap(page, '[data-testid="kk-games-panel"] summary');
}
const scores = (page) => page.locator('[data-testid="kk-war-seat"] b').allTextContents().then((cells) => cells.map(Number));

test("Dice War is on its own shelf, found by its name, and sits the person down with two computers", async ({ page }) => {
  const errors = await open(page);
  await tap(page, '[data-testid="kk-games-panel"] summary');
  await page.locator('[data-testid="kk-games-search"]').fill("war");
  expect((await state(page)).games).toBeGreaterThanOrEqual(1);
  await page.locator('[data-testid="kk-games-search"]').fill("yacht");
  await expect(page.locator('[data-testid="kk-game"][data-value="dice-war"]')).toBeHidden();
  await page.locator('[data-testid="kk-games-search"]').fill("");
  await tap(page, '[data-testid="kk-game"][data-value="dice-war"]');
  expect((await state(page)).game).toBe("Games: Dice War");
  await expect(war(page, "kk-war-seat")).toHaveCount(3);
  expect(await page.locator('[data-testid="kk-war-seat"] span').allTextContents()).toEqual(["You", "Aiko", "Ben"]);
  expect(await scores(page)).toEqual([0, 0, 0]);
  await expect(war(page, "kk-war-status")).toContainText("Round 1 · 5 points · At stake: 1");
  // One die: the tray's d6, and no die can be held in this game.
  expect((await state(page)).notation).toBe("1d6");
  await sound(page, errors);
});

test("each throw of the tray is the person's roll, the computers answer, and the game ends at the score", async ({ page }) => {
  const errors = await open(page);
  await sitDown(page);
  let throws = 0;
  while (!(await war(page, "kk-war").getAttribute("data-over")).includes("true")) {
    const before = await scores(page);
    await roll(page);
    throws += 1;
    expect(throws, "a game to five points ends").toBeLessThan(80);
    const s = await state(page);
    // The person's dice are the tray's, and the first line of the last throw says so.
    const lines = await war(page, "kk-war-throws").locator("li").allTextContents();
    expect(lines.some((line) => new RegExp(`^You ${s.dice[0].face} · `).test(line)), `a line of "${lines.join(" | ")}" says the tray threw a ${s.dice[0].face}`).toBe(true);
    const after = await scores(page);
    expect(after.reduce((a, b) => a + b, 0)).toBeGreaterThanOrEqual(before.reduce((a, b) => a + b, 0));
    expect(s.dice.some((die) => die.button), "no die is held in this game").toBe(false);
  }
  const final = await scores(page);
  expect(Math.max(...final)).toBeGreaterThanOrEqual(5);
  await expect(war(page, "kk-war-status")).toContainText("Game over");
  // The game as text reads back as the game on the page.
  await page.locator(".kk-war-keep summary").click();
  const text = await war(page, "kk-war-text").textContent();
  const game = decodeDiceWar(text);
  expect(game).not.toBeNull();
  expect(game.scores).toEqual(final);
  expect(diceWarOver(game)).toBe(true);
  const names = ["You", "Aiko", "Ben"];
  await expect(war(page, "kk-war-status")).toContainText(diceWarWinners(game).map((seat) => names[seat]).join(", "));
  // The tray goes on rolling once the game is over, and the game waits for a new one.
  await roll(page);
  expect(await scores(page)).toEqual(final);
  await tap(page, '[data-testid="kk-war-new"]');
  expect(await scores(page)).toEqual([0, 0, 0]);
  await sound(page, errors);
});

test("the table can be changed: more players, more dice, another way to end; and the text replays", async ({ page }) => {
  const errors = await open(page);
  await sitDown(page);
  await page.locator('[data-testid="kk-war-players"]').selectOption("5");
  await expect(war(page, "kk-war-seat")).toHaveCount(5);
  await page.locator('[data-testid="kk-war-dice"]').selectOption("2");
  expect((await state(page)).notation).toBe("2d6");
  await page.locator('[data-testid="kk-war-goal"]').selectOption("rounds:5");
  await expect(war(page, "kk-war-status")).toContainText("Round 1 of 5");
  await roll(page);
  await page.locator(".kk-war-keep summary").click();
  const game = decodeDiceWar(await war(page, "kk-war-text").textContent());
  expect(game).toMatchObject({ players: ["You", "Aiko", "Ben", "Chloé", "Dev"], dice: 2, goal: "rounds", to: 5 });
  const s = await state(page);
  expect(game.throws[0].rolls[0]).toMatchObject({ seat: 0, faces: s.dice.map((die) => die.face) });
  // The same table and seed, played again here with the same moves, is the same game.
  let again = decodeDiceWar(JSON.stringify({ ...JSON.parse(await war(page, "kk-war-text").textContent()), moves: [] }));
  for (const move of game.moves) again = playDiceWar(again, move);
  expect(again.scores).toEqual(game.scores);
  expect(again.throws).toEqual(game.throws);
  await sound(page, errors);
});

test("choosing another game, or stopping, takes the table away, and the tray's own dice end it too", async ({ page }) => {
  const errors = await open(page);
  await sitDown(page);
  await games(page);
  await tap(page, '[data-testid="kk-games-stop"]');
  await expect(war(page, "kk-war")).toHaveCount(0);
  expect((await state(page)).game).toBe("Games: none chosen");
  await sitDown(page);
  await games(page);
  await tap(page, '[data-testid="kk-game"][data-value="craps"]');
  await expect(war(page, "kk-war")).toHaveCount(0);
  await sitDown(page);
  // Dice that are not the table's end the game at the next roll.
  await tap(page, '[data-testid="kk-count"] button[data-value="3"]');
  await roll(page);
  await expect(war(page, "kk-war")).toHaveCount(0);
  await sound(page, errors);
});

test("the tray without Dice War asked for is as it was: no shelf, no table", async ({ page }) => {
  const errors = await open(page, "/pages/element.html");
  await expect(page.locator('[data-testid="kk-game"][data-value="dice-war"]')).toHaveCount(0);
  expect(errors).toEqual([]);
});
