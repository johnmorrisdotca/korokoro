<h1 align="center">Korokoro <sub>コロコロ</sub></h1>

<p align="center"><strong>Fair dice for the table, with the odds of every throw.</strong><br>
Tap to roll one to five dice, from a d4 to a d100. Exact probabilities, roll history and stats, in a tray that runs anywhere.</p>

<p align="center">
  <a href="https://github.com/johnmorrisdotca/korokoro/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/johnmorrisdotca/korokoro/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://www.npmjs.com/package/@johnmorrisdotca/korokoro"><img alt="npm" src="https://img.shields.io/npm/v/@johnmorrisdotca/korokoro?color=2f5d4a"></a>
  <a href="./LICENSE"><img alt="MIT licence" src="https://img.shields.io/badge/licence-MIT-2f5d4a"></a>
  <img alt="No dependencies" src="https://img.shields.io/badge/dependencies-0-2f5d4a">
  <img alt="TypeScript" src="https://img.shields.io/badge/types-TypeScript-3178c6">
</p>

<p align="center"><a href="https://johnmorrisdotca.github.io/korokoro/"><strong>Roll some dice →</strong></a></p>

<p align="center">
  <img src="docs/desktop.jpg" alt="Three d6 on the felt, the total of 8 with a luck meter, and the stats panel with face counts and totals against the odds" width="720">
  <img src="docs/phone.jpg" alt="Two d20 rolled with advantage on a phone in dark mode, the lower die struck through" width="220">
</p>

*Korokoro* is the sound of dice tumbling, in Japanese. It began as the dice
roller on [Itsutsu](https://itsutsu.com/dice), a site for board games, which
uses this package exactly as published.

## Features

- **Every die a table needs.** One to five of d4, d6, d8, d10, d12, d20 or d100,
  with a bonus, and advantage or disadvantage (keep the highest or lowest).
- **Fair by construction.** Rolls come from `crypto.getRandomValues`, turned
  into faces by rejection sampling, so no face is favoured by a modulo.
- **Reproducible when asked.** A seeded mode (sfc32) throws the same dice for the
  same seed on every device, so a table can check a roll.
- **Exact odds.** Each total's chance is counted, not simulated: the chance to
  meet a target, the average, the spread and how lucky a throw was.
- **History and stats.** Up to 500 rolls kept on the device: luck, hot and cold
  streaks, matching dice, natural 20s and 1s, each face's count with a
  chi-square fairness test, and your totals drawn against the odds.
- **Shareable.** Any roll becomes a link that shows exactly what was thrown.
- **A tray that feels like dice.** Tap anywhere on the felt or press Space;
  dice tumble and land, drawn in each die's own shape. Light and dark, themeable,
  English and Japanese, and reduced motion respected.
- **Small and dependency-free.** A plain-function core, a plain-DOM tray and an
  optional React component. It runs from a static page, such as GitHub Pages.

## Install

```sh
pnpm add @johnmorrisdotca/korokoro
```

ES modules with TypeScript types. The core and the tray have no dependencies;
the React component needs React 18 or later.

## Quick start

### The tray, on any page

```html
<div id="dice"></div>
<script type="module">
  import { mountRoller } from "@johnmorrisdotca/korokoro";

  mountRoller(document.getElementById("dice"), {
    wide: true,                          // tray and panels side by side on a wide screen
    spec: { count: 1, sides: 20, modifier: 5 },
    onRoll: (roll) => console.log(roll.total),
  });
</script>
```

### In React

```tsx
import { DiceRoller } from "@johnmorrisdotca/korokoro/react";

export function Table() {
  return <DiceRoller wide spec={{ count: 2, sides: 20, keep: "highest" }} onRoll={(roll) => save(roll)} />;
}
```

The component takes the tray's options as props, plus any attribute for its
`<div>`. The tray mounts in the browser after the first render, so server
rendering draws an empty box and nothing needs a provider.

### Just the numbers

```ts
import { chanceAtLeast, parseNotation, roll, seededSource } from "@johnmorrisdotca/korokoro";

const attack = parseNotation("2d20kh1+5")!; // advantage, +5
roll(attack).total;                         // 6 to 25, from the crypto generator
roll(attack, seededSource("table-7"));      // the same throw every time
chanceAtLeast(attack, 15);                  // 0.7975
```

## Dice notation

| Notation | Means |
| --- | --- |
| `d20`, `1d20` | one twenty-sided die |
| `3d6+2` | three d6, plus 2 |
| `4d8-1` | four d8, minus 1 |
| `2d20kh1` | two d20, keep the highest (advantage) |
| `2d20kl1` | two d20, keep the lowest (disadvantage) |
| `d%`, `1d100` | one percentile die |

One to five dice, of the seven kinds above, with a bonus from −99 to +99.
Anything else is refused (`parseNotation` returns `null`) rather than quietly
rolled as something different.

## API

Every function is pure unless it says otherwise, and every type is exported.

### Rolling

```ts
type DieSides = 4 | 6 | 8 | 10 | 12 | 20 | 100;
type Keep = "all" | "highest" | "lowest";
type RollSpec = { count: number; sides: DieSides; modifier: number; keep: Keep };
type Roll = {
  id: string; spec: RollSpec;
  faces: number[];    // each die, in the order thrown
  kept: boolean[];    // which faces count towards the total
  total: number; at: number; seed: string | null;
};

roll(spec: Partial<RollSpec>, source?: RandomSource, at?: number): Roll
normalizeSpec(spec: Partial<RollSpec>): RollSpec    // clamps into range
rangeOf(spec: RollSpec): { min: number; max: number }
parseNotation(text: string): RollSpec | null
formatNotation(spec: RollSpec): string
```

### Randomness

```ts
type RandomSource = { next(): number; readonly seed: string | null };

cryptoSource(): RandomSource              // the default; crypto.getRandomValues, buffered
seededSource(seed: string): RandomSource  // sfc32 from a text seed; stable forever
newSeed(): string                         // eight characters nobody will misread
randomInt(source: RandomSource, n: number): number  // fair integer in [0, n)
```

### Odds

```ts
distributionOf(spec): { min: number; max: number; probabilities: number[] }
chanceExactly(spec, total): number
chanceAtLeast(spec, target): number
chanceAtMost(spec, target): number
expectedTotal(spec): number
spreadOf(spec): number                    // standard deviation
mostLikely(spec): number[]
luckOf(spec, total): number               // 0 = worst possible, 0.5 = typical, 1 = best
```

Distributions are exact. Five d100 is ten billion outcomes, counted by
convolution in a few thousand steps.

### History and stats

```ts
addToHistory(history, roll, limit = 500): Roll[]
loadHistory(storage, key): Roll[]         // a blocked or corrupt store reads as empty
saveHistory(storage, key, history): boolean
statsOf(history, focus?: RollSpec): Stats // luck, streaks, matches, naturals, faces, totals
chiSquareTail(statistic, degrees): number
```

### Sharing

```ts
shareQuery(roll): string                  // "roll=2d20kh1%2B5&faces=17%2C4&at=…"
readShared(query): Roll | null            // refuses faces the dice could not show
```

### The tray

```ts
mountRoller(element: HTMLElement, options?: RollerOptions): RollerHandle

type RollerOptions = {
  locale?: string;                        // numbers, times, and "ja…" for Japanese words
  strings?: Partial<RollerStrings>;       // your own words, for any language
  storage?: StorageLike | null;           // default localStorage; null keeps nothing
  storageKey?: string;                    // default "korokoro.history"
  spec?: Partial<RollSpec>;               // the dice showing at first
  query?: string;                         // a shared roll or seed; default location.search
  shareBase?: string;                     // where shared links point
  theme?: Record<`--kk-${string}`, string>;
  wide?: boolean;
  onRoll?: (roll: Roll) => void;
  animationMs?: number;                   // default 650; reduced motion always skips it
};
type RollerHandle = { roll(): void; history(): readonly Roll[]; setSpec(spec): void; destroy(): void };
```

## Seeded and shared rolls

Under **Randomness** the tray switches between **Fair**, your device's
cryptographic generator that nobody can predict, and **Seeded**, where the same
seed throws the same sequence of dice everywhere. A seed can also arrive in the
address (`?seed=table-7`), so a game master can hand the whole table the same
dice.

**Copy link to this roll** puts the throw in the address. Whoever opens it sees
the same dice and total, marked as a shared roll and kept out of their own
history.

## Theming

Every colour is a CSS variable on `.kk-root`. Pass them as `theme`, which sets
them on the tray itself and so wins in light and dark alike:

```js
mountRoller(el, { theme: { "--kk-felt": "#23405a", "--kk-felt-deep": "#162a3c", "--kk-accent": "#d4a017" } });
```

`--kk-surface`, `--kk-ink`, `--kk-muted`, `--kk-rule`, `--kk-felt`,
`--kk-felt-deep`, `--kk-felt-ink`, `--kk-accent`, `--kk-good`, `--kk-bad`,
`--kk-die`, `--kk-die-edge`, `--kk-die-ink`, `--kk-pip-one`, `--kk-radius`,
`--kk-font`.

## Browser support

Any browser from the last few years: it needs ES2020, `crypto.getRandomValues`
and CSS `color-mix` (Chrome and Edge 111, Firefox 113, Safari 16.2). The core
also runs in Node 20 and later, Deno and Bun, where the platform provides
`crypto`.

## Roadmap

- Custom dice: any number of sides, and Fate dice
- Exploding dice and rerolls (`3d6!`, `4d6r1`)
- Keep the highest or lowest *n* (`4d6kh3` for ability scores)
- Rolls as sounds, and a shake-to-roll on phones
- Export the history as CSV

Ideas and pull requests are welcome.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). In short:

```sh
pnpm install
pnpm check   # lint, types and tests
pnpm site    # build the demo into ./site, then serve it
```

Please follow the [code of conduct](./CODE_OF_CONDUCT.md).

## Changes

See [CHANGELOG.md](./CHANGELOG.md).

## Licence

[MIT](./LICENSE) © John Morris
