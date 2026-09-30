<h1 align="center">Korokoro <sub>コロコロ</sub></h1>

<p align="center"><strong>Fair dice for the table, with the odds of every throw.</strong><br>
Tap to roll up to ten dice, from a d4 to a d100, or type any dice at all. Exact probabilities, roll history and stats, in a tray that runs anywhere.</p>

<p align="center">
  <a href="https://github.com/johnmorrisdotca/korokoro/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/johnmorrisdotca/korokoro/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://www.npmjs.com/package/@johnmorrisdotca/korokoro"><img alt="npm" src="https://img.shields.io/npm/v/@johnmorrisdotca/korokoro?color=2f5d4a"></a>
  <a href="./LICENSE"><img alt="MIT licence" src="https://img.shields.io/badge/licence-MIT-2f5d4a"></a>
  <img alt="No dependencies" src="https://img.shields.io/badge/dependencies-0-2f5d4a">
  <img alt="TypeScript" src="https://img.shields.io/badge/types-TypeScript-3178c6">
</p>

<p align="center"><a href="https://johnmorrisdotca.github.io/korokoro/"><strong>Roll some dice →</strong></a></p>

<p align="center">
  <img src="docs/desktop.jpg" alt="Eight d6 on the felt, their total with a luck meter, and the stats panel with face counts and totals against the odds" width="720">
  <img src="docs/phone.jpg" alt="Four d6 with the lowest dropped, on a phone in dark mode: the dropped die struck through" width="220">
</p>

*Korokoro* is the sound of dice tumbling, in Japanese. It began as the dice
roller on [Itsutsu](https://itsutsu.com/dice), a site for board games, which
uses this package exactly as published.

## What it is

Three things in one small package, each usable without the others:

- **A tray** you put on any page: pick the dice, tap the felt, read the total,
  the odds, the history and the stats. Plain DOM, no framework.
- **A React component** that wraps the tray.
- **A core of plain functions**: roll dice, read dice notation, work out exact
  odds, keep a history and summarise it. No DOM, so it runs in Node, Deno and
  Bun as well as a browser.

## Features

- **Every die a table needs.** One to ten of d4, d6, d8, d10, d12, d20, d30 or
  d100 at a tap, with a bonus, and advantage or disadvantage.
- **And any other dice, by notation.** A die of any size from 2 sides to 1000,
  Fate dice, keep or drop (`4d6dl1`), rerolls (`2d6r<3`) and exploding dice
  (`3d6!`), with what became of each die shown on the felt.
- **Fair by construction.** Rolls come from `crypto.getRandomValues`, turned
  into faces by rejection sampling, so no face is favoured by a modulo.
- **Reproducible when asked.** A seeded mode throws the same dice for the same
  seed on every device, so a table can check a roll.
- **Exact odds.** Each total's chance is worked out, never simulated: the
  chance to meet a target, the average, the spread and how lucky a throw was.
- **History and stats.** Up to 500 rolls kept on the device: luck, hot and cold
  streaks, matching dice, natural 20s and 1s, each face's count with a
  chi-square fairness test, and your totals drawn against the odds.
- **Shareable.** Any roll becomes a link that shows exactly what was thrown.
- **It feels like dice.** Tap anywhere on the felt or press Space. The dice
  tumble for about half a second and land, with the sound of real dice and a
  mute button. Light and dark, themeable, English and Japanese. Under reduced
  motion there is no tumble and the sound starts off.
- **Small and dependency-free.** About 57 kB minified (21 kB gzipped), plus
  36 kB of recorded sound that is fetched only when a roll first needs it.

## Install

```sh
pnpm add @johnmorrisdotca/korokoro    # or npm install, or yarn add
```

ES modules with TypeScript types, and no dependencies. The React component
needs React 18 or later. It works through Vite, Next.js and a plain
`<script type="module">` with nothing to configure.

## Quick start

### The tray, on any page

```html
<div id="dice"></div>
<script type="module">
  import { mountRoller } from "@johnmorrisdotca/korokoro";

  const roller = mountRoller(document.getElementById("dice"), {
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
rendering draws an empty box and nothing needs a provider. In Next.js, use it
from a client component (`"use client"`).

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
| `8d6`, `10d10` | up to ten dice at once |
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
count    = 1 to 10, and 1 when left out
sides    = 2 to 1000, "%" for 100, or "F" for a Fate die
modifier = "!" | "r<" face | "r<=" face | "kh" [n] | "kl" [n] | "dh" [n] | "dl" [n]
bonus    = "+" or "-", then 0 to 99
```

Letters in either case, spaces allowed between the parts.

### How the modifiers combine

They may be written in any order, each at most once, and are always applied in
this one:

1. **Reroll.** A die showing the reroll face or lower is thrown again, once.
   The new face stands whatever it is, so a low face becomes rarer, never
   impossible. (Roll20 calls this `ro`; its `r` rerolls until the die clears.)
2. **Explode.** If the face left standing is the die's highest, another die is
   thrown and added, and it follows the same two rules. A die may throw up to
   10 more; the last is read as it lies.
3. **Keep or drop** picks among the dice left standing. A tie keeps the die
   thrown first.
4. **The bonus** is added.

Each die is settled, rerolls and explosions and all, before the next is
thrown, so a seeded roll replays die for die.

### What is refused

`parseNotation` returns `null`, and `checkNotation` names the part, rather
than quietly rolling something different:

| Refused | Why |
| --- | --- |
| `11d6`, `0d6` | one to ten dice at a time |
| `d1`, `d1001` | a die has 2 to 1000 sides |
| `2d6+100` | a bonus is at most 99 either way |
| `4d6kh4`, `4d6dl4`, `1d20kh1` | keep or drop has to leave at least one die and fewer than all |
| `4d6kh3dl1`, `3d6!!` | one keep or drop, and each modifier once |
| `2d6r<1`, `2d6r<7` | a reroll has to include the lowest face and spare the highest |
| `4d6!kh3` | exploding dice are not kept or dropped: tables disagree on whether an explosion is a new die in the pool or part of the die that threw it |
| `4dF!`, `2d1000!` | Fate dice do not explode, nor do dice of more than 100 sides |

```ts
checkNotation("4d6!kh3");
// { ok: false, problem: "explode", part: "!",
//   message: "“!”: dice explode only with 100 sides or fewer, never Fate dice, and not together with keep or drop" }
```

`formatNotation` writes each roll one way: the dice, `!`, `r<`, `kh` or `kl`,
then the bonus. So `4d6dl1` is written back as `4d6kh3`.

## What a roll returns

A roll is plain data. This is `4d6dl1` thrown from the seed `table-7`:

```ts
roll(parseNotation("4d6dl1")!, seededSource("table-7"));
```

```json
{
  "id": "mg5sjk00-9",
  "spec": { "count": 4, "sides": 6, "modifier": 0, "keep": "highest", "keepCount": 3 },
  "faces": [6, 4, 2, 1],
  "kept": [true, true, true, false],
  "total": 12,
  "at": 1759190400000,
  "seed": "table-7",
  "dice": [
    { "face": 6, "status": "kept", "exploded": false, "die": 0 },
    { "face": 4, "status": "kept", "exploded": false, "die": 1 },
    { "face": 2, "status": "kept", "exploded": false, "die": 2 },
    { "face": 1, "status": "dropped", "exploded": false, "die": 3 }
  ]
}
```

- `faces` is every die thrown, in the order thrown. Rerolled dice and the dice
  an explosion added are among them, so it can be longer than `spec.count`.
- `kept` says which faces count. **The total is always the kept faces plus the
  bonus.**
- `dice` says what became of each face: `kept`, `dropped` by keep or drop, or
  `rerolled` (the die after it is its replacement), whether it `exploded`, and
  which of the dice asked for (`die`, from 0) it belongs to.

`3d6!` from the same seed throws five dice, because two of them exploded:

```ts
faces  // [6, 3, 6, 4, 5]
dice   // die 0: 6 (exploded), 3 · die 1: 6 (exploded), 4 · die 2: 5
total  // 24
```

## Odds

```ts
const spec = parseNotation("4d6dl1")!;
expectedTotal(spec);        // 12.2445987654321
spreadOf(spec);             // 2.85 (standard deviation)
mostLikely(spec);           // [13]
chanceExactly(spec, 18);    // 0.0162 (21 in 1296)
chanceAtLeast(spec, 15);    // the chance of 15 or more
luckOf(spec, 12);           // 0.448: a 12 beats 44.8% of rolls, a tie counted as half
distributionOf(spec);       // { min: 3, max: 18, probabilities: [ … ] }
```

Nothing is simulated and nothing is left out:

| Dice | How the odds are found |
| --- | --- |
| Plain dice, any size, and Fate dice | Every outcome counted in whole numbers (BigInt), however many there are |
| Keep one (advantage) | Counted in whole numbers by the closed form: the highest is at most *k* when every die is |
| Keep or drop several | The sum of the highest *n*, dealt out value by value over the pool |
| Rerolls | Each face's chance after one reroll, then as above |
| Exploding dice | Each chain's chance up to the limit, then summed over the dice |

**Counts.** Ten d1000 has 10^30 outcomes, far more than a JavaScript number
holds exactly, so plain dice and advantage are counted as `BigInt` and only
turned into a probability at the end. `exactCounts` hands the whole numbers
out:

```ts
exactCounts(parseNotation("8d6")!);
// { min: 8, outcomes: 1679616n, counts: [1n, 8n, 36n, … ] }   135954n of them total 28
exactCounts(parseNotation("4d6dl1")!);   // null: see below
```

**Probabilities.** Rerolled and exploding dice, and several dice kept from a
pool, do not have equally likely outcomes to count, so their odds are worked
out as probabilities, right to the last digits a number holds (about fifteen).
`exactCounts` returns `null` for them and never a guess.

**Exploding dice** have no last total in theory. Here a die stops after 10
explosions, in the roll and in the odds alike, so the odds are exactly those
of the dice as thrown and they sum to 1. A d6 reaches that limit once in 60
million dice.

**Speed.** The slowest roll the package accepts, `10d1000kh9`, takes about a
tenth of a second the first time and nothing after: each spec's odds are
remembered.

## Seeded and shared rolls

Under **Randomness** the tray switches between **Fair**, your device's
cryptographic generator that nobody can predict, and **Seeded**, where the
same seed throws the same sequence of dice everywhere. A seed can also arrive
in the address (`?seed=table-7`), so a game master can hand the whole table
the same dice.

### Checking a seeded roll

A seed is a stream: its first roll, its second, and so on. To check somebody's
roll, throw the same dice in the same order from the same seed:

```ts
const dice = seededSource("table-7");
roll(parseNotation("4d6dl1")!, dice).faces;   // [6, 4, 2, 1] for everyone, always
roll(parseNotation("3d6!")!, dice).faces;     // [6, 3, 6, 4, 5], the second roll from that seed
```

The generator is sfc32, started from the seed's text. It is pinned by tests:
a seed shared today throws the same dice in every later version. It is meant
for checking, not for secrets; anybody who knows the seed knows the dice.

### Sharing a roll

**Copy link to this roll** puts the throw in the address:

```
?roll=4d6kh3&faces=6%2C4%2C2%2C1&at=1759190400000&seed=table-7
```

Whoever opens it sees the same dice and total, marked as a shared roll and
kept out of their own history. `readShared` refuses a link whose faces the
dice could not have shown.

## API

Every function is pure unless it says otherwise, every type is exported, and
each has a doc comment your editor will show.

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

roll(spec: Partial<RollSpec>, source?: RandomSource, at?: number): Roll
diceOf(roll: Roll): DieRoll[]                       // roll.dice, or worked out from the faces
readDice(spec: RollSpec, faces: number[]): DieRoll[] | null  // null if the dice could not show them
normalizeSpec(spec: Partial<RollSpec>): RollSpec    // brings a spec into range
rangeOf(spec: RollSpec): { min: number; max: number }
parseNotation(text: string): RollSpec | null
checkNotation(text: string): { ok: true; spec: RollSpec } | { ok: false; problem; part; message }
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
exactCounts(spec): { min: number; counts: bigint[]; outcomes: bigint } | null
chanceExactly(spec, total): number
chanceAtLeast(spec, target): number
chanceAtMost(spec, target): number
expectedTotal(spec): number
spreadOf(spec): number                    // standard deviation
mostLikely(spec): number[]
luckOf(spec, total): number               // 0 = worst possible, 0.5 = typical, 1 = best
```

### History and stats

```ts
addToHistory(history, roll, limit = 500): Roll[]
loadHistory(storage, key): Roll[]         // a blocked or corrupt store reads as empty
saveHistory(storage, key, history): boolean
parseHistory(text): Roll[]                // drops any roll that does not add up
serializeHistory(history): string
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
```

| Option | Default | What it does |
| --- | --- | --- |
| `spec` | `2d6` | The dice showing at first, as a partial `RollSpec` |
| `wide` | `false` | Tray and panels side by side on a screen 900px or wider |
| `onRoll` | none | Called with each `Roll` once it has landed |
| `locale` | the page's `lang` | Numbers and times; `"ja…"` also picks the Japanese words |
| `strings` | English or Japanese | Your own words, for any language: `{ ...STRINGS.en, total: "Suma" }` |
| `storage` | `localStorage` | Where the history and the mute choice are kept; `null` keeps nothing |
| `storageKey` | `"korokoro.history"` | The key for the history; the mute choice is kept under this key plus `.muted` |
| `query` | the page's own | A query string that may hold a shared roll or a seed |
| `shareBase` | the page's address | Where shared links point |
| `theme` | none | CSS variables for the tray, such as `{ "--kk-felt": "#234" }` |
| `animationMs` | `650` | From the throw to the last die landing; reduced motion always skips it |
| `sound` | `true` | `false` makes the tray silent and takes the mute button away |
| `playSound` | the recorded dice | Your own sound for each throw: `({ dice, ms, landings }) => void` |

```ts
type RollerHandle = {
  roll(): void;                         // throw the dice showing
  history(): readonly Roll[];
  setSpec(spec: Partial<RollSpec>): void;  // part of the dice, or a whole spec
  destroy(): void;
};
```

`setSpec` changes part of the dice (`{ sides: 20 }`) or, given a whole spec
such as `parseNotation("4d6dl1")`, all of them. The buttons are the eight
standard dice; everything else is typed into the notation box, which says
which part it refuses. On the felt a dropped or rerolled die is struck through
and an exploded die is ringed and marked `!`.

### The roll itself never waits on the show

The dice are thrown by the generator before anything moves. The tumble and
the sound only present a roll that is already decided: they use their own
`Math.random` for where a die flies from and which recording plays, and never
draw from the dice's generator. So a seeded roll is the same with the
animation on, off or interrupted.

## Sound

The tray plays a shake while the dice tumble and a knock as each lands, from
recordings of real dice. Ten dice landing are five knocks, not ten.

- It starts with the sound on, or off where the device asks for reduced
  motion. The speaker button on the felt mutes it, and the choice is
  remembered on the device.
- The recordings (36 kB) are fetched the first time a roll needs them and not
  before: a muted tray, or one mounted with `sound: false`, never downloads
  them. If they cannot be fetched or decoded, the tray plays a short knock it
  makes itself.
- A browser only lets a page make sound after somebody has touched it, so a
  roll started by code before any tap is silent.
- Nothing throws where there is no audio, as on a server or in a test.

```ts
mountRoller(el, { sound: false });                       // silent, no button
mountRoller(el, { playSound: ({ dice }) => myClack(dice) });  // your own sound
```

Dice sounds from Kenney's Casino Audio, CC0, [kenney.nl](https://kenney.nl/assets/casino-audio).
[SOUNDS.md](./SOUNDS.md) names the files and what was done to them.

## Theming

Every colour is a CSS variable on `.kk-root`. Pass them as `theme`, which sets
them on the tray itself and so wins in light and dark alike:

```js
mountRoller(el, { theme: { "--kk-felt": "#23405a", "--kk-felt-deep": "#162a3c", "--kk-accent": "#d4a017" } });
```

`--kk-surface`, `--kk-ink`, `--kk-muted`, `--kk-rule`, `--kk-felt`,
`--kk-felt-deep`, `--kk-felt-ink`, `--kk-accent`, `--kk-accent-ink`,
`--kk-good`, `--kk-bad`, `--kk-die`, `--kk-die-edge`, `--kk-die-ink`,
`--kk-pip-one`, `--kk-radius`, `--kk-font`.

## Limits

All of these are exported constants, and the notation refuses anything past
them by name.

| Limit | Value | Constant |
| --- | --- | --- |
| Dice in one roll | 1 to 10 | `MIN_DICE`, `MAX_DICE` |
| Sides of a die | 2 to 1000, or `F` | `MIN_SIDES`, `MAX_SIDES` |
| Bonus | −99 to +99 | `MAX_MODIFIER` |
| Explosions for each die | 10 more dice | `MAX_EXPLOSIONS` |
| Largest die that may explode | d100 | `MAX_EXPLODING_SIDES` |
| Rolls kept in a history | 500 | `HISTORY_LIMIT` |
| Length of notation read | 64 characters | |

## Browser support

Any browser from the last few years: it needs ES2020 with `BigInt`,
`crypto.getRandomValues` and CSS `color-mix` (Chrome and Edge 111, Firefox
113, Safari 16.2). The sound needs the Web Audio API and AAC decoding, which
those browsers have; without them the tray is silent or plays its own knock.
The core also runs in Node 20 and later, Deno and Bun.

## Roadmap

- Dice of different kinds in one roll (`1d20+1d4`)
- Hold some dice and roll the rest, as Yacht and Farkle do
- Custom dice with your own faces, and sets of dice saved on the device
- Exploding dice that are kept or dropped, once a table's rule is chosen
- Rerolling until the die clears (`r`, as Roll20 has it, beside reroll once)
- Export the history as CSV

Left out on purpose: shared live rooms, which need a server, and dice skins
for sale. Korokoro runs from a static page and costs nothing to host.

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

[MIT](./LICENSE) © John Morris. The dice recordings are CC0; see
[SOUNDS.md](./SOUNDS.md).
