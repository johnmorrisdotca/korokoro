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

- **Every die a table needs.** One to five of d4, d6, d8, d10, d12, d20, d30 or
  d100, with a bonus, and advantage or disadvantage (keep the highest or lowest).
- **And any other dice, by notation.** A die of any size from 2 sides to 1000,
  Fate dice, keep or drop (`4d6dl1`), rerolls (`2d6r<3`) and exploding dice
  (`3d6!`), each die's fate shown on the felt.
- **Fair by construction.** Rolls come from `crypto.getRandomValues`, turned
  into faces by rejection sampling, so no face is favoured by a modulo.
- **Reproducible when asked.** A seeded mode (sfc32) throws the same dice for the
  same seed on every device, so a table can check a roll.
- **Exact odds.** Each total's chance is counted, not simulated: the chance to
  meet a target, the average, the spread and how lucky a throw was. That holds
  for dropped, rerolled and exploding dice too.
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
| `d30`, `2d30+3` | one thirty-sided die; two of them, plus 3 |
| `d%`, `1d100` | one percentile die |
| `d14`, `2d3`, `d1000` | a die of any size, from 2 sides to 1000 |
| `4dF` | four Fate dice, each −1, 0 or +1 |
| `2d20kh1`, `2d20kh` | two d20, keep the highest (advantage) |
| `2d20kl1` | two d20, keep the lowest (disadvantage) |
| `4d6kh3` | four d6, keep the highest three |
| `4d6dl1` | four d6, drop the lowest one: the same roll as `4d6kh3` |
| `5d10dh2` | five d10, drop the highest two: the same roll as `5d10kl3` |
| `2d6r<3`, `2d6r<=2` | two d6; a 1 or a 2 is thrown again, once |
| `3d6!` | three exploding d6: a 6 throws another die and adds it |
| `3d6!r<2+1` | all of it together: reroll, explode, then add 1 |

```
roll     = [count] "d" sides { modifier } [bonus]
count    = 1 to 5, and 1 when left out
sides    = 2 to 1000, "%" for 100, or "F" for a Fate die
modifier = "!" | "r<" face | "r<=" face | "kh" [n] | "kl" [n] | "dh" [n] | "dl" [n]
bonus    = "+" or "-", then 0 to 99
```

Letters in either case, spaces allowed between the parts.

**How the modifiers combine.** They may be written in any order, each at most
once, and are always applied in this one:

1. **Reroll.** A die showing the reroll face or lower is thrown again, once.
   The new face stands whatever it is, so a low face becomes rarer, never
   impossible. (Roll20 calls this `ro`; its `r` rerolls until the die clears.)
2. **Explode.** If the face left standing is the die's highest, another die is
   thrown and added, and it follows the same two rules. A die may throw up to
   10 more (`MAX_EXPLOSIONS`); the last is read as it lies.
3. **Keep or drop** picks among the dice left standing. A tie keeps the die
   thrown first.
4. **The bonus** is added.

Each die is settled, rerolls and explosions and all, before the next is
thrown, so a seeded roll replays die for die.

**What is refused**, by `parseNotation` returning `null` and by `checkNotation`
naming the part, rather than quietly rolled as something different:

| Refused | Why |
| --- | --- |
| `6d6`, `0d6` | one to five dice at a time |
| `d1`, `d1001` | a die has 2 to 1000 sides |
| `2d6+100` | a bonus is at most 99 either way |
| `4d6kh4`, `4d6dl4`, `1d20kh1` | keep or drop has to leave at least one die and fewer than all |
| `4d6kh3dl1`, `3d6!!` | one keep or drop, and each modifier once |
| `2d6r<1`, `2d6r<7` | a reroll has to include the lowest face and spare the highest |
| `4d6!kh3` | exploding dice are not kept or dropped: tables disagree on whether an explosion is a new die in the pool or part of the die that threw it |
| `4dF!`, `2d1000!` | Fate dice do not explode, nor do dice of more than 100 sides |

```ts
checkNotation("4d6!kh3");
// { ok: false, problem: "explode", part: "!", message: "“!”: dice explode only with 100 sides or fewer, …" }
```

`formatNotation` writes each roll one way: the dice, `!`, `r<`, `kh` or `kl`,
then the bonus. So `4d6dl1` is written back as `4d6kh3`.

## API

Every function is pure unless it says otherwise, and every type is exported.

### Rolling

```ts
type DieSides = 4 | 6 | 8 | 10 | 12 | 20 | 30 | 100;  // the dice with a button
type Sides = number | "F";                           // 2 to 1000, or a Fate die
type Keep = "all" | "highest" | "lowest";
type RollSpec = {
  count: number; sides: Sides; modifier: number; keep: Keep;
  keepCount?: number; // how many `keep` keeps; left out when one
  explode?: true;     // left out when the dice do not explode
  reroll?: number;    // reroll once at this face or lower; left out when none
};
type DieRoll = {
  face: number;
  status: "kept" | "dropped" | "rerolled";
  exploded: boolean;  // it showed its highest face and threw the next die
  die: number;        // which of the dice asked for it belongs to, from 0
};
type Roll = {
  id: string; spec: RollSpec;
  faces: number[];    // every die thrown, in order: rerolled and exploded dice too
  kept: boolean[];    // which faces count towards the total
  total: number; at: number; seed: string | null;
  dice?: DieRoll[];   // what happened to each face; on every roll the package makes
};

roll(spec: Partial<RollSpec>, source?: RandomSource, at?: number): Roll
diceOf(roll: Roll): DieRoll[]                       // roll.dice, or worked out from the faces
readDice(spec: RollSpec, faces: number[]): DieRoll[] | null  // null if the dice could not show them
normalizeSpec(spec: Partial<RollSpec>): RollSpec    // clamps into range
rangeOf(spec: RollSpec): { min: number; max: number }
parseNotation(text: string): RollSpec | null
checkNotation(text: string): { ok: true; spec: RollSpec } | { ok: false; problem: NotationProblem; part: string; message: string }
formatNotation(spec: RollSpec): string
```

The total is always the kept faces plus the bonus. A roll of `2d6!r<2` that
threw 1, 6, 1, 3, 4 reads:

```ts
roll.faces  // [1, 6, 1, 3, 4]
roll.kept   // [false, true, false, true, true]
roll.dice   // rerolled, kept and exploded, rerolled, kept, kept
roll.total  // 13
```

Limits, all exported: `MAX_DICE` 5, `MIN_SIDES` 2, `MAX_SIDES` 1000,
`MAX_MODIFIER` 99, `MAX_EXPLOSIONS` 10, `MAX_EXPLODING_SIDES` 100.

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
convolution in a few thousand steps. Nothing is simulated or left out:

| Dice | How the odds are found |
| --- | --- |
| Plain dice, any size, and Fate dice | Every outcome counted, in whole numbers below 2^53 |
| Keep one (advantage) | The closed form: the highest is at most *k* when every die is |
| Keep or drop several | The sum of the highest *n*, dealt out value by value over the pool |
| Rerolls | Each face's chance after one reroll, then as above |
| Exploding dice | Each chain's chance up to `MAX_EXPLOSIONS`, then summed over the dice |

Exploding dice have no last total in theory. Here a die stops after 10
explosions, in the roll and in the odds alike, so the odds are exactly those
of the dice as thrown and they sum to 1; a d6 reaches that limit once in 60
million dice. Rerolled and exploding dice are worked out as probabilities
rather than counts, right to the last digits a number holds.

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

`setSpec` changes part of the dice (`{ sides: 20 }`) or, given a whole spec
such as `parseNotation("4d6dl1")`, all of them. The buttons are the eight
standard dice; everything else is typed into the notation box, which says
which part it refuses. On the felt a dropped or rerolled die is struck
through and an exploded die is ringed and marked `!`.

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

- More than five dice, and dice of different kinds in one roll (`8d6`, `1d20+1d4`)
- Exploding dice that are kept or dropped, once a table's rule is chosen
- Rerolling until the die clears (`r`, as Roll20 has it, beside reroll once)
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
