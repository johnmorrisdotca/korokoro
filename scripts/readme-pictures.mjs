// Takes the pictures the README shows, from the built demo in `site/`: `pnpm screenshots:readme` (builds the demo, then runs this).
// The family's standard is in johnmorrisdotca/.github (README-STANDARD.md); the shared part is readme-pictures-lib.mjs.
// The page is served to a browser without a port, never fetched from the live site, and the same each run: the rolls come from a
// seed (`?seed=`), the dice are typed or chosen as a person does, a throw is a tap on the felt, and motion is reduced. It waits on
// the tray being drawn, never on a clock.
// Output: docs/images/<subject>-<desk|phone>-<light|dark>.webp.
import { takePictures } from "./readme-pictures-lib.mjs";

const TRAY = '[data-testid="kk-tray"]';
const ALL = '[data-testid="korokoro"]';
const address = (lang = "en") => `/?lang=${lang}&help=off&seed=readme`;

/** Type the dice (or choose a game), throw them `rolls` times by tapping the felt where no die lies, and open a tab of the panel under them. */
const roll = ({ notation, game, rolls = 1, tab }) => async (page) => {
  if (game) {
    await page.locator('[data-testid="kk-games-panel"] summary').click();
    await page.locator('[data-testid="kk-games-search"]').fill(game);
    await page.locator(`[data-testid="kk-game"][data-value="${game}"]`).click();
  } else {
    const box = page.locator('[data-testid="kk-notation"]');
    await box.fill(notation);
    await box.press("Enter");
  }
  for (let throws = 0; throws < rolls; throws += 1) {
    const felt = await page.locator(TRAY).first().boundingBox();
    const watch = game === "dice-war" ? '[data-testid="kk-war"]' : '[data-testid="kk-result"]';
    const before = await page.locator(watch).first().textContent();
    await page.locator(TRAY).first().click({ position: { x: 10, y: felt.height - 10 } });
    await page.waitForFunction(([selector, was]) => document.querySelector(selector)?.textContent !== was, [watch, before]);
  }
  if (tab) await page.locator(`[data-testid="kk-tab-${tab}"]`).click();
};
const scrollTo = (selector) => (page) => page.locator(selector).evaluate((element) => window.scrollTo(0, element.getBoundingClientRect().top + window.scrollY - 16));

await takePictures({
  shots: [
    // Eight d6, from the top of the page, with the stats of twelve throws. On a phone, in Japanese: four d6, the lowest dropped.
    {
      subject: "hero",
      views: ["desk", "phone"],
      url: address(),
      ready: TRAY,
      height: 900,
      async prepare(page, { view }) {
        if (view === "phone") {
          await page.goto(`http://korokoro.test${address("ja")}`);
          await page.waitForSelector(TRAY);
          await roll({ notation: "4d6dl1" })(page);
          await scrollTo(TRAY)(page);
        } else {
          await roll({ notation: "8d6", rolls: 12, tab: "stats" })(page);
          await page.evaluate(() => window.scrollTo(0, 0));
        }
      },
    },
    // Advantage: two d20, the higher kept, plus 5, and the exact odds of every total.
    { subject: "odds", views: ["desk"], url: address(), ready: TRAY, target: ALL, prepare: roll({ notation: "2d20kh1+5", rolls: 3, tab: "odds" }) },
    // The history of six throws of two d6.
    { subject: "history", views: ["desk"], url: address(), ready: TRAY, target: ALL, prepare: roll({ notation: "2d6+3", rolls: 6, tab: "history" }) },
    // A dice pool: count the d10 that show 8 or more, a 1 takes one away.
    { subject: "pool", views: ["desk"], url: address(), ready: TRAY, target: ALL, prepare: roll({ notation: "6d10>=8f=1", rolls: 2, tab: "odds" }) },
    // A die of your own: Hit, Miss and Miss, three of them.
    { subject: "custom-dice", views: ["desk"], url: address(), ready: TRAY, target: ALL, prepare: roll({ notation: "3d[Hit=1,Miss=0,Miss=0]", rolls: 2 }) },
    // Yahtzee chosen: five d6 and its three rolls, read the way the game reads them.
    { subject: "games", views: ["phone"], url: address(), ready: TRAY, target: ALL, prepare: roll({ game: "yahtzee", rolls: 1 }) },
    // Dice War: three players, a few throws in, with the scores and the last throw under the felt.
    { subject: "dice-war", views: ["phone"], scale: 1.5, url: address(), ready: TRAY, target: ALL, prepare: roll({ game: "dice-war", rolls: 4 }) },
    // One die on its own: a d20 that rolls and a d6 that only shows a face.
    { subject: "one-die", views: ["desk"], url: `${address()}#one-die`, ready: '[data-testid="solo-dice"]', target: '[data-testid="solo-dice"]' },
  ],
});
