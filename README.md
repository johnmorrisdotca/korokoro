# Korokoro コロコロ

Fair dice for the table. Tap the felt to roll one to five dice (d4, d6, d8, d10,
d12, d20 or d100), with a bonus, advantage or disadvantage, and read the total,
the exact odds, your roll history and your stats.

*Korokoro* is the sound of dice tumbling in Japanese.

**[Try it](https://johnmorrisdotca.github.io/korokoro/)**

<p>
  <img src="docs/desktop.jpg" alt="The dice tray with three d6 thrown, and the stats panel beside it" width="640">
  <img src="docs/phone.jpg" alt="Two d20 with advantage on a phone in dark mode" width="200">
</p>

- **Fair.** Rolls come from the device's cryptographic generator
  (`crypto.getRandomValues`), picked by rejection sampling so no face is
  favoured. A **seeded** mode throws the same dice for the same seed, so a table
  can check a roll.
- **Exact odds.** Every total's chance is counted, not simulated: the chance of
  meeting a target, the average, the spread, and how lucky a roll was.
- **History and stats.** Kept on the device, up to 500 rolls: luck, hot and
  cold streaks, natural 20s and 1s, each face's count with a fairness check,
  and your totals against what the odds expect.
- **Shareable.** Any roll can be copied as a link that shows exactly what was
  thrown.
- **No dependencies, no server.** The core is plain functions; the tray is
  plain DOM. It runs from a static page, such as GitHub Pages, for free.
- **English and Japanese** built in; pass your own words for any other language.

It is the dice roller on [Itsutsu](https://itsutsu.com/dice), which uses this
package as it is.

## Install

```sh
npm install @johnmorrisdotca/korokoro
```

ES modules with types. The core has no dependencies; the React component needs
React 18 or later.

## Use the tray

```html
<div id="roller"></div>
<script type="module">
  import { mountRoller } from "@johnmorrisdotca/korokoro";
  const roller = mountRoller(document.getElementById("roller"), {
    wide: true, // tray and panels side by side on a wide screen
    spec: { count: 1, sides: 20, modifier: 5 },
    onRoll: (roll) => console.log(roll.total),
  });
</script>
```

Options: `locale`, `strings`, `storage` (`null` keeps nothing), `storageKey`,
`spec`, `theme`, `query`, `shareBase`, `wide`, `onRoll`, `animationMs`. The handle has
`roll()`, `history()`, `setSpec(spec)` and `destroy()`.

Tap or click the felt to roll, or press Space. Motion is skipped for anyone who
asks their system for reduced motion.

### In React

```tsx
import { DiceRoller } from "@johnmorrisdotca/korokoro/react";

<DiceRoller wide spec={{ count: 2, sides: 20, keep: "highest" }} onRoll={(roll) => save(roll)} />
```

It takes the same options as props, plus any attribute for its `<div>`. The
tray is mounted in the browser after the first render, so server rendering
draws an empty box.

### Theming

Every colour is a CSS variable on `.kk-root`. Pass them as `theme`, which sets
them on the tray itself and so wins in light and dark alike
(`theme: { "--kk-felt": "#23405a" }`), or override them with a rule more specific
than `.kk-root`: `--kk-surface`, `--kk-ink`, `--kk-muted`, `--kk-rule`,
`--kk-felt`, `--kk-felt-deep`, `--kk-felt-ink`, `--kk-accent`, `--kk-good`,
`--kk-bad`, `--kk-die`, `--kk-die-edge`, `--kk-die-ink`, `--kk-pip-one`,
`--kk-radius`, `--kk-font`.

## Use the core

```ts
import { roll, parseNotation, chanceAtLeast, statsOf, seededSource } from "@johnmorrisdotca/korokoro";

const spec = parseNotation("2d20kh1+5")!; // advantage, +5
roll(spec).total;                         // 6 to 25, from crypto
roll(spec, seededSource("table-7"));      // the same every time
chanceAtLeast(spec, 15);                  // 0.7975
```

| Function | What it does |
| --- | --- |
| `roll(spec, source?, at?)` | Throws the dice. `spec` is `{ count, sides, modifier, keep }`. |
| `parseNotation(text)` / `formatNotation(spec)` | `3d6+2`, `1d20`, `2d20kh1`, `2d20kl1`, `d%`. |
| `distributionOf(spec)` | Every total and its exact chance. |
| `chanceAtLeast`, `chanceAtMost`, `chanceExactly` | Odds of a target. |
| `expectedTotal`, `spreadOf`, `mostLikely`, `luckOf` | Average, standard deviation, peak, and how lucky a total was (0 to 1). |
| `statsOf(history, focus?)` | Streaks, luck, matches, natural 20s and 1s, faces with a fairness test, totals against the odds. |
| `addToHistory`, `loadHistory`, `saveHistory` | A history kept in `localStorage` (or anything shaped like it). |
| `shareQuery(roll)` / `readShared(query)` | A roll as a link, and back. |
| `cryptoSource()`, `seededSource(seed)`, `randomInt(source, n)` | Where the randomness comes from. |

## Develop

```sh
npm install
npm test        # the unit tests
npm run site    # builds ./site, the GitHub Pages demo
npx serve site  # or any static server
```

`.github/workflows/ci.yml` runs the tests and the build on every push and pull
request. `.github/workflows/pages.yml` publishes `site/` to GitHub Pages on every
push to `main` (turn Pages on with source "GitHub Actions" in the repository
settings).

## Changes

See [CHANGELOG.md](./CHANGELOG.md).

## Licence

MIT. See [LICENSE](./LICENSE).
