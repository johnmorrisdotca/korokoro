<h1 align="center">Korokoro <sub>コロコロ</sub></h1>

<p align="center"><strong>Fair dice for the table, with the odds of every throw.</strong><br>
Tap dice to build a roll, up to ten in any mix from a d4 to a d100, or type any dice at all. Exact probabilities, roll history and stats, in a tray that runs anywhere.</p>

<p align="center">
  <a href="https://github.com/johnmorrisdotca/korokoro/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/johnmorrisdotca/korokoro/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://www.npmjs.com/package/@johnmorrisdotca/korokoro"><img alt="npm" src="https://img.shields.io/npm/v/@johnmorrisdotca/korokoro?color=2f5d4a"></a>
  <a href="./LICENSE"><img alt="MIT licence" src="https://img.shields.io/badge/licence-MIT-2f5d4a"></a>
  <img alt="No dependencies" src="https://img.shields.io/badge/dependencies-0-2f5d4a">
  <img alt="TypeScript" src="https://img.shields.io/badge/types-TypeScript-3178c6">
</p>

<p align="center"><a href="https://johnmorrisdotca.github.io/korokoro/"><strong>Roll some dice →</strong></a> · <a href="https://johnmorrisdotca.github.io/korokoro/docs/"><strong>Read the documentation →</strong></a></p>

<table align="center">
<tr>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/korokoro/main/docs/images/hero-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/korokoro/main/docs/images/hero-desk-light.webp" alt="The demo on a desk, in English, with eight d6 on the green felt after twelve rolls: the page header with the language chooser, five cloth patches and the Help switch, the dice showing 1 to 6 on white faces, their total of 30 with a luck meter, and beside them the Stats tab with the rolls, luck and streaks, the count of each face and the totals drawn against the odds" width="600">
</picture>
<br><em>The demo on a desk: eight d6 and the stats of twelve throws.</em>
</td>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/korokoro/main/docs/images/hero-phone-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/korokoro/main/docs/images/hero-phone-light.webp" alt="The demo on a phone, in Japanese: four d6 with the lowest dropped, shown faded on the felt and struck through in the sum 13, a luck meter, and under it the Japanese choice of dice, from 1 to 10 of them and from a d4 to a d12" width="190">
</picture>
<br><em>On a phone, in Japanese, in the device's light or dark.</em>
</td>
</tr>
</table>

A dice roller and a dice notation parser for tabletop games, RPGs and board
games, with the exact odds of every roll.

- **What is different.** The odds are exact, worked out and never simulated,
  for every notation it reads. The tray is finished: dice you tap, real dice
  sounds, history, stats and a link to any roll. And a seeded roll can be
  checked by anybody, die for die.
- **What it costs a project.** Nothing: no dependencies, and one import.
## Roll in 30 seconds

```sh
npm install @johnmorrisdotca/korokoro    # or pnpm add, or yarn add
```

```ts
import { chanceAtLeast, parseNotation, roll } from "@johnmorrisdotca/korokoro";

const attack = parseNotation("2d20kh1+5")!;  // advantage, plus 5
roll(attack).total;                          // 6 to 25, from the crypto generator
chanceAtLeast(attack, 15);                   // 0.7975: the exact chance of 15 or more
```

And 44 games come with their dice and their rules for reading them:

```ts
import { crapsPass, rollPreset } from "@johnmorrisdotca/korokoro";

rollPreset("yahtzee").reading.text;        // "A full house", "Chance, for 13", …
rollPreset("チンチロリン", { language: "ja" }).reading.text;  // "シゴロ（4・5・6）", …
crapsPass();                                // [244n, 495n]: the shooter's exact chance, 244 in 495
```

And from a terminal, on Linux, macOS or Windows:

```sh
npx @johnmorrisdotca/korokoro 2d20kh1+5 --seed table   # 2d20kh1+5: 24  [19 (12)]
```

Or with nothing to install, [roll some dice in the demo](https://johnmorrisdotca.github.io/korokoro/).
## Who it is for

- **Roleplaying games.** A d20 with advantage (`2d20kh1+5`), ability scores
  (`4d6dl1`), a fireball's damage (`8d6`), a d20 and a d4 together
  (`1d20+1d4`). For Dungeons & Dragons, Pathfinder and anything else that
  rolls polyhedral dice.
- **Board games and dice games.** `2d6` for the table; five dice with holds
  for Yahtzee (`5d6`); six for Farkle (`6d6`); a die with your game's own
  faces (`d[Hit,Miss,Miss]`).
- **Fun.** Tap the felt.
- **Teaching and research.** The exact odds and a chart for any roll: `2d6`
  makes 7 one time in 6. A seed makes a classroom's rolls repeatable.
- **The curious and the suspicious.** Loaded dice that say they are loaded
  (`d6{6:3}`), and a test for whether a real die is fair.

Game names are trademarks of their respective owners. Korokoro is not
affiliated with or endorsed by them; it rolls the dice their rules call for.
## Features

- **Every die a table needs, in any mix.** Tap a die to add it: up to ten of
  d4, d6, d8, d10, d12, d20, d30 and d100, up to four kinds in one roll
  (`1d20+2d4+3`), with a bonus, and advantage or disadvantage.
- **Hold and roll again.** After a roll, tap a die to hold it and roll the
  rest, as Yahtzee and Farkle do. The odds follow the dice still to roll.
- **And any other dice, by notation.** A die of any size from 2 sides to 1000,
  Fate dice, keep or drop (`4d6dl1`), rerolls (`2d6r<3`, `2d6ro<3`) and
  exploding dice (`3d6!`), with what became of each die shown on the felt.
- **Dice pools.** Count successes (`6d10>=8`), with failures that take them
  away (`f=1`), dice that explode on the faces you say, compounding and
  penetrating dice, a least and a most for each die, critical marks, sorted
  dice and a label for the roll. The odds are exact for all of it.
- **Arithmetic.** `(2d6+3)*2`, `1d20-1d4`, `floor(4d6/2)`, `max(1d20,1d20)+5`,
  worked out in exact fractions, with exact odds. And dice that all differ
  (`4d6u`).
- **Games, with their dice and their readings.** Yahtzee, Risk, craps,
  backgammon, Catan, Farkle, chō-han (丁半), chinchirorin (チンチロリン) and
  more: 44 games in one searchable list, each read the way the game reads
  it, with the exact odds of each outcome. See [Games](#games).
- **A game to play: Dice War.** Everyone rolls, the highest total scores, and a
  tie is war. Two to eight players, any of them a computer, seeded and saved
  as text, with its exact odds, and in the tray's Games. See
  [Dice War](#dice-war).
- **Several rolls in one tap.** `6#4d6dl1` is six ability scores at once, with
  the highest, the lowest and the sum.
- **Dice of your own.** A die with any faces you like, words or numbers
  (`d[Yes,No,Maybe]`), and sets of dice saved by name on the device and shared
  by a link.
- **Loaded dice, honestly marked, and a fairness test.** A die weighted to
  order (`d6{6:3}`) that says so everywhere it appears, and a chi-square test
  that tells you whether a die, ours or a real one, looks fair.
- **Fair by construction.** Rolls come from `crypto.getRandomValues`, turned
  into faces by rejection sampling, so no face is favoured by a modulo.
- **Reproducible when asked.** A seeded mode throws the same dice for the same
  seed on every device, so a table can check a roll.
- **Exact odds.** Each total's chance is worked out, never simulated: the
  chance to meet a target, the average, the spread and how lucky a throw was.
- **History and stats.** Up to 500 rolls kept on the device: luck, hot and cold
  streaks, matching dice, natural 20s and 1s, each face's count with a
  fairness test, and your totals drawn against the odds.
- **Shareable.** Any roll becomes a link that shows exactly what was thrown.
- **A command line.** `koro 2d20kh1+5` in a terminal on Linux, macOS or
  Windows, with the odds, the games, JSON and CSV. See
  [The command line](#the-command-line).
- **Export.** A history as CSV for a spreadsheet, JSON that reads back in, or
  plain text.
- **Made for a phone.** One thumb does everything: every control is at least
  44px, nothing needs a hover or a long press, and nothing moves when the dice
  land. English and Japanese.
- **It feels like dice.** Tap anywhere on the felt or press Space. The dice
  tumble for about half a second and land, with the sound of real dice and a
  mute button. Light and dark, and themeable. Under reduced motion there is no
  tumble and the sound starts off.
### What's in it

Each picture is the real tray, drawn by the package and taken from [the demo](https://johnmorrisdotca.github.io/korokoro/) with `pnpm screenshots:readme`, in light and dark. Every roll is from the seed `readme`, so the pictures are the same each run.

<table>
<tr>
<td align="center" valign="top" width="50%">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/korokoro/main/docs/images/odds-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/korokoro/main/docs/images/odds-desk-light.webp" alt="The Odds tab of the demo on a desk: two d20 with the higher kept and 5 added, rolled three times, showing 11 and 25 as the total on the felt, the total 16 with a luck meter, and beside it the odds of every total from 6 to 25 as a rising and falling bar chart, the expected 18.8, the spread and the chance of 15 or more" width="420">
</picture>
<br><em><strong>Exact odds.</strong> Advantage plus 5: the chance of every total, worked out and not simulated.</em>
</td>
<td align="center" valign="top" width="50%">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/korokoro/main/docs/images/history-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/korokoro/main/docs/images/history-desk-light.webp" alt="The History tab of the demo on a desk: two d6 plus 3 rolled six times, showing the latest roll 10 on the felt, and beside it a list of the six rolls with the time, the dice and each total, a Clear history button and the Export and import link" width="420">
</picture>
<br><em><strong>History.</strong> The latest rolls, kept on the device, with export to CSV, JSON or text.</em>
</td>
</tr>
<tr>
<td align="center" valign="top" width="50%">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/korokoro/main/docs/images/pool-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/korokoro/main/docs/images/pool-desk-light.webp" alt="A dice pool in the demo on a desk: six d10 on the felt, three of them with a tick for a success because they show 8 or more, the result 3 successes, and beside it the odds chart for successes and the chance of at least 1" width="420">
</picture>
<br><em><strong>Dice pools.</strong> Count successes (<code>6d10>=8f=1</code>): the ticked dice are the ones that count.</em>
</td>
<td align="center" valign="top" width="50%">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/korokoro/main/docs/images/custom-dice-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/korokoro/main/docs/images/custom-dice-desk-light.webp" alt="A die of your own in the demo on a desk: three dice on the felt labelled Miss, Miss and Hit, the total 1 with a luck meter, and beside them the history of two rolls of the custom dice" width="420">
</picture>
<br><em><strong>Dice of your own.</strong> Faces you write, worth numbers or not: <code>3d[Hit=1,Miss=0,Miss=0]</code>.</em>
</td>
</tr>
<tr>
<td align="center" valign="top" width="50%">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/korokoro/main/docs/images/games-phone-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/korokoro/main/docs/images/games-phone-light.webp" alt="Yahtzee chosen in the demo on a phone: five d6 on the felt on roll 1 of 3, the line Tap the felt to roll again, or tap a die to hold it, the reading Chance, for 20 under Yahtzee, the Copy link button, and the choice of dice, the roll history and the stats tabs" width="240">
</picture>
<br><em><strong>Games.</strong> 44 games, each read the way the game reads its dice, with the exact odds of each outcome.</em>
</td>
<td align="center" valign="top" width="50%">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/korokoro/main/docs/images/dice-war-phone-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/korokoro/main/docs/images/dice-war-phone-light.webp" alt="Dice War in the demo on a phone: you and two computers, the scores, the last throws with a war in them, and the odds of your roll under the felt" width="240">
</picture>
<br><em><strong>Dice War.</strong> Everybody rolls, the highest scores, and a tie is war; two to eight players, any of them a computer.</em>
</td>
</tr>
<tr>
<td align="center" valign="top" width="50%">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/korokoro/main/docs/images/one-die-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/korokoro/main/docs/images/one-die-desk-light.webp" alt="Two single dice in the demo on a desk, each on green felt with no panels: a d20 showing 20 under the words Rolls when tapped, and a d20 showing 20 under the words Shown a face, with a Next face button under it" width="420">
</picture>
<br><em><strong>One die.</strong> A die that rolls when it is tapped, and a die that only shows the face you give it.</em>
</td>
<td></td>
</tr>
</table>

## Use it in your project

Korokoro is an API and a tray, each usable without the other: **an API** of
plain functions (roll, read notation, work out odds, keep a history), and **a
tray** you mount into any element, which also comes as **a React component**,
**a Vue component** and **a web component**.

### Install

```sh
npm install @johnmorrisdotca/korokoro
pnpm add @johnmorrisdotca/korokoro
yarn add @johnmorrisdotca/korokoro
```

It is ES modules only, with its types included, and needs Node 22 or later outside a browser. A page with no bundler loads the tag from a CDN (`@1` is the major version).

### 1. The API alone

```ts
import { checkNotation, distributionOf, roll, seededSource } from "@johnmorrisdotca/korokoro";

const read = checkNotation("4d6dl1");            // { ok: true, spec } or the part refused and why
if (read.ok) {
  const thrown = roll(read.spec, seededSource("table-7"));
  thrown.faces;                                  // [6, 4, 2, 1]: every die, in the order thrown
  thrown.kept;                                   // [true, true, true, false]: the 1 was dropped
  thrown.total;                                  // 12
  distributionOf(read.spec).probabilities;       // the exact chance of every total from 3 to 18
}
```

### 2. The tray, in plain HTML

```html
<div id="dice"></div>
<script type="module">
  import { mountRoller } from "@johnmorrisdotca/korokoro";

  mountRoller(document.getElementById("dice"), {
    spec: { count: 1, sides: 20, modifier: 5 },
    onRoll: (roll) => console.log(roll.total),
  });
</script>
```

### 3. React

```tsx
import { DiceRoller } from "@johnmorrisdotca/korokoro/react";

export function Table() {
  return <DiceRoller wide notation="2d20kh1+5" onRoll={(roll) => save(roll)} />;
}
```

The component takes the tray's options as props, `notation` as a shorter way
to give the dice (the tray follows it when it changes), and any attribute for
its `<div>`. The tray mounts in the browser after the first render, so server
rendering draws an empty box and nothing needs a provider. In Next.js, use it
from a client component (`"use client"`).

### 4. Vue

```vue
<script setup>
import { DiceRoller } from "@johnmorrisdotca/korokoro/vue";
</script>

<template>
  <DiceRoller notation="2d20kh1+5" wide @roll="(roll) => save(roll)" />
</template>
```

The props are the tray's options, with `notation` as a shorter way to give the
dice, and each roll is a `roll` event. The dice and `locale` are followed as
they change; `roll()`, `history()`, `setSpec()` and `setLocale()` are there on
a template ref. It renders an empty box on the server (Nuxt included) and
mounts the tray in the browser. Vue 3.3 or later.

### 5. A web component

```html
<korokoro-roller notation="2d20kh1+5" wide></korokoro-roller>

<script type="module">
  import { defineRoller } from "@johnmorrisdotca/korokoro/element";

  defineRoller();
  document.addEventListener("korokoro-roll", (event) => console.log(event.detail.total));
</script>
```

A custom element, for any page and any framework that renders HTML. Call
`defineRoller()` once; each roll is a `korokoro-roll` event that bubbles, with
the roll as its `detail`.

Or with no call at all: importing `@johnmorrisdotca/korokoro/element/define`
registers the element by being imported, so one script tag is the whole of
it, [from a CDN](./docs/plain-output.md#from-a-cdn-with-nothing-to-install) or
from your own bundle:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/korokoro@1/dist/element-define.js"></script>
<korokoro-roller notation="2d20kh1+5"></korokoro-roller>
```

| Attribute | What it does |
| --- | --- |
| `notation` | The dice showing at first, and again whenever it changes |
| `lang` | `ja` for Japanese, anything else English; the page's own language when left out |
| `wide` | Tray and panels side by side on a wide screen |
| `size` | `small` is the felt and the result alone, `medium` adds the choice of dice, `large` (or left out) is everything |
| `sound="off"` | No sound and no mute button |
| `hold="off"` | Dice are not held |
| `placeholder="off"` | The opening dice are the user's own roll |
| `keyboard="off"` | Space rolls only when the focus is inside the tray |
| `language-chooser` | The tray's own choice of English or 日本語 |
| `dice-war` | [Dice War](#dice-war) among the games |
| `storage="none"`, `storage-key` | Keep no history; or the key it is kept under |
| `animation-ms`, `share-base`, `query` | As the options of the same names |
| `cloth` | The felt's cloth: `green` (unless said), `blue`, `red`, `black` or `wood`, the family's five; changed in place, keeping the dice and the rolls |
| `one-pip` | The colour of a d6's one pip: `red` (unless said) or `black`; changed in place |

What an attribute cannot carry (a theme, your own words, your own sound) goes
on the element's `options` property. React 19, Vue 3 and Svelte 5 set a
property rather than an attribute on a custom element that has one of the
name; the only name here that is also a property is the die's `face`, and
`die.face = 5` sets the `face` attribute, as the attribute does. `roll()`, `setSpec()` and `history` are
on the element. The tray is drawn in the element's own light DOM, so the
page's `--kk-…` variables theme it as they do a mounted tray.

### 6. Svelte and Angular

The same one call in the framework's mount hook, and `destroy()` on the way
out:

```svelte
<script>
  import { onMount } from "svelte";
  import { mountRoller } from "@johnmorrisdotca/korokoro";
  let box;
  onMount(() => {
    const roller = mountRoller(box);
    return () => roller.destroy();
  });
</script>

<div bind:this={box}></div>
```

```ts no-check
// Angular: in a standalone component with <div #box></div> in its template
private box = viewChild.required<ElementRef<HTMLElement>>("box");
constructor() {
  afterNextRender(() => (this.roller = mountRoller(this.box().nativeElement)));
}
ngOnDestroy() {
  this.roller?.destroy();
}
```

Each of the six (Vue, Svelte, Angular, React, the web component and a plain
page) is built from the packed tarball and rolled in Chromium and WebKit by
`scripts/check-frameworks.mjs` before a release names it.

### What a developer gets

- **Typed results.** TypeScript types for everything, with a doc comment on
  every export.
- **A random source you can replace.** The default is the platform's
  cryptographic generator; `seededSource("any text")` is reproducible; and
  anything with a `next()` that returns a 32-bit number will do.
- **No dependencies**, ES modules, a `default` export condition for tools that
  resolve from CommonJS, and `sideEffects: false`, so a bundler drops what
  you do not import.
- **Sizes.** Rolling, notation and odds alone are about 16 kB minified (6 kB
  gzipped) once a bundler has shaken the rest out. With the tray it is about
  98 kB (35 kB gzipped). The recorded sounds are another 36 kB (23 kB
  gzipped), fetched only when a roll first needs them.
- **Where it runs.** Browsers from Chrome and Edge 111, Firefox 113 and Safari
  16.2. The core runs in Node 22 and later, Deno and Bun.
## Examples

Each example is a whole recipe: copy it and it works. The ones in TypeScript are run in CI against the built package (`pnpm test:readme`), so none of them is a guess, and the output shown is what they print. The odds, the notation and the games each have a reference of their own, linked from the section that names them.

### A tray on a page with no script of your own

Save this as a file and open it: dice to tap, real dice sounds, history, stats and the odds, in one tag. The module comes from a CDN, and `@1` is the major version. Each roll is an event that bubbles.

```html
<!doctype html>
<meta charset="utf-8">
<title>Dice</title>
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/korokoro@1/dist/element-define.js"></script>
<korokoro-roller notation="2d20kh1+5" wide></korokoro-roller>
<p id="said"></p>
<script>
  document.addEventListener("korokoro-roll", (event) => {
    document.getElementById("said").textContent = `${event.detail.spec.count}d${event.detail.spec.sides} came to ${event.detail.total}`;
  });
</script>
```

### Roll with advantage, and know the odds

The roll comes from the platform's cryptographic generator; the odds are worked out exactly, never simulated. A seeded source replays the same dice anywhere, so a table can check a roll.

```ts
import { chanceAtLeast, expectedTotal, parseNotation, roll, seededSource } from "@johnmorrisdotca/korokoro";

const attack = parseNotation("2d20kh1+5")!;                    // advantage, plus 5
const thrown = roll(attack, seededSource("table"));            // the same dice for the same seed, on every device
console.log(thrown.faces, thrown.kept, "->", thrown.total);
console.log("at least 15:", chanceAtLeast(attack, 15).toFixed(4), "| average:", expectedTotal(attack));
console.log(roll(attack, seededSource("table")).total === thrown.total);
```

```text
[ 19, 12 ] [ true, false ] -> 24
at least 15: 0.7975 | average: 18.825
true
```

### Six ability scores in one go

`4d6dl1` is four d6 with the lowest dropped, and `rollMany` throws it six times from one generator, so a seed replays the whole lot.

```ts
import { parseNotation, rollMany, seededSource } from "@johnmorrisdotca/korokoro";

const scores = rollMany(parseNotation("4d6dl1")!, 6, seededSource("table"));
console.log(scores.rolls.map((one) => one.total), "sum", scores.sum, "highest", scores.highest, "lowest", scores.lowest);
```

```text
[ 8, 12, 11, 9, 13, 12 ] sum 65 highest 13 lowest 8
```

### A dice pool, counted

`6d10>=8f=1` counts how many of six d10 show 8 or more, and each 1 takes a success away. The odds of three successes or more are exact.

```ts
import { chanceAtLeast, expectedTotal, parseNotation, roll, seededSource } from "@johnmorrisdotca/korokoro";

const pool = parseNotation("6d10>=8f=1")!;
const thrown = roll(pool, seededSource("pool"));
console.log(thrown.faces, "->", thrown.total, "successes");
console.log("three or more:", chanceAtLeast(pool, 3).toFixed(4), "| expected:", expectedTotal(pool).toFixed(1));
```

```text
[ 6, 9, 8, 9, 1, 8 ] -> 3 successes
three or more: 0.1859 | expected: 1.2
```

### What the notation refuses, and why

A bad roll is `null` from `parseNotation`, and `checkNotation` names the part that was refused, so a form can say so.

```ts
import { checkNotation } from "@johnmorrisdotca/korokoro";

for (const text of ["4d6dl1", "11d6", "2d6+"]) {
  const read = checkNotation(text);
  console.log(text.padEnd(8), read.ok ? "read" : `refused: ${read.message}`);
}
```

```text
4d6dl1   read
11d6     refused: “11”: roll 1 to 10 dice at a time
2d6+     refused: “+”: this is not dice notation
```

### Dice of your own, and loaded dice that say so

A die is whatever faces you write, and a die weighted to order says so everywhere it appears. `isFair` lets a site refuse anything loaded in one call; `fairnessTest` says whether a real die's counts look fair.

```ts
import { expectedTotal, fairnessTest, isFair, parseNotation, roll, seededSource } from "@johnmorrisdotca/korokoro";

const hits = parseNotation("3d[Hit=1,Miss=0,Miss=0]")!;
const thrown = roll(hits, seededSource("table-7"));
console.log(thrown.dice!.map((die) => die.label), "total", thrown.total, "| expected", expectedTotal(hits));

const optimist = parseNotation("d6{6:3}")!;
console.log("fair:", isFair(optimist), "| marked loaded:", roll(optimist, seededSource("x")).loaded);
console.log(fairnessTest([30, 30, 30, 30, 30, 90]).verdict);      // a real d6 thrown 240 times
```

```text
[ 'Miss', 'Hit', 'Miss' ] total 1 | expected 1
fair: false | marked loaded: true
lopsided
```

### A game's dice, read the way the game reads them

Forty-four games come with their dice and their rules for reading them, found by any name the game goes by. A game is read, not run: Korokoro throws the dice and says what the game makes of them.

```ts
import { crapsPass, getPreset, rollPreset, seededSource } from "@johnmorrisdotca/korokoro";

const thrown = rollPreset("yahtzee", { source: seededSource("table") });
console.log(thrown.roll.faces, "-", thrown.reading.text, `(${thrown.reading.outcome})`);
console.log(getPreset("Yacht") === getPreset("yahtzee"));          // other names find it too
console.log(crapsPass(), "-> the shooter's exact chance is 244 in 495");
```

```text
[ 1, 2, 1, 5, 4 ] - Chance, for 13 (chance)
true
[ 244n, 495n ] -> the shooter's exact chance is 244 in 495
```

### Hold some dice and roll the rest

As in Yahtzee and Farkle: keep the sixes, throw the others again from the same source, so a seeded game replays.

```ts
import { parseNotation, roll, rollHeld, seededSource } from "@johnmorrisdotca/korokoro";

const dice = seededSource("yacht");
const first = roll(parseNotation("5d6")!, dice);
const second = rollHeld(first, first.faces.map((face) => face === 6), dice);   // true holds a die
console.log(first.faces, "->", second.faces);
```

```text
[ 3, 3, 6, 3, 6 ] -> [ 3, 4, 6, 1, 6 ]
```

### Dice War, played from a seed

The one game here that is played and not only read: everybody rolls, the highest scores, a tie is war. The computers' dice come from the seed, a person's are handed in, and the game is kept as text.

```ts
import { diceWarOdds, encodeDiceWar, playDiceWar, startDiceWar } from "@johnmorrisdotca/korokoro";

let game = startDiceWar({ players: ["You", "Aiko", "Ben"], computers: [false, true, true], seed: "table", to: 5 })!;
game = playDiceWar(game, { faces: { "0": [4] } })!;              // you rolled a 4 at the table; the others are the seed's
console.log("scores", game.scores, "| a war in", (1 / diceWarOdds({ players: 3 }).war).toFixed(1), "throws");
console.log(encodeDiceWar(game).length > 40);
```

```text
scores [ 0, 1, 0 ] | a war in 4.2 throws
true
```

### Export a history, and share a roll

A history is written out as CSV for a spreadsheet, JSON that reads back in, or plain text for a chat, and any roll becomes a link that shows exactly what was thrown.

```ts
import { parseNotation, roll, seededSource, shareQuery, toCSV, toText } from "@johnmorrisdotca/korokoro";

const rolls = [roll(parseNotation("4d6dl1")!, seededSource("table-7"), 1759190400000)];
console.log(toText(rolls).trim());
console.log(toCSV(rolls).split("\r\n")[1]);
console.log(`https://johnmorrisdotca.github.io/korokoro/?${shareQuery(rolls[0]!)}`);
```

```text
2025-09-30T00:00:00.000Z  4d6kh3: 12  [6 4 2 (1)]
2025-09-30T00:00:00.000Z,4d6kh3,,12,6 4 2 (1),6 4 2 1,table-7,,,
https://johnmorrisdotca.github.io/korokoro/?roll=4d6kh3&faces=6%2C4%2C2%2C1&at=1759190400000&seed=table-7&v=2
```

### From a terminal

Three commands are the same: `korokoro`, `koro` and `roll`. They need Node 22 and nothing else, on Linux, macOS and Windows; the whole reference is under [The command line](#the-command-line).

```sh
npx @johnmorrisdotca/korokoro 2d20kh1+5 --seed table
npm install -g @johnmorrisdotca/korokoro
koro 6#4d6dl1 --seed table
roll 2d6+3
```

```text
2d20kh1+5: 24  [19 (12)]
4d6kh3: 8  [1 2 (1) 5]
4d6kh3: 12  [4 6 (1) 2]
…
```

### One die on a page

A single die with nothing round it: a d20 that rolls when it is tapped, and a d6 that only shows a face. The tag comes from the same script as the tray.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/korokoro@1/dist/element-define.js"></script>
<korokoro-die sides="20" size="large"></korokoro-die>
<korokoro-die sides="6" face="5" rollable="off"></korokoro-die>
```

### A look of your own

Every colour is a custom property on the tray. Pass them as `theme`, which sets them on the tray itself and so wins in light and dark alike.

```ts no-run
import { mountRoller } from "@johnmorrisdotca/korokoro";

mountRoller(document.getElementById("dice")!, { theme: { "--kk-felt": "#23405a", "--kk-felt-deep": "#162a3c", "--kk-accent": "#d4a017" } });
```

## Dice notation

<!-- moved: docs/notation.md -->

A roll is written the way a character sheet writes it, and read back the same way. A few of the commonest, with what they mean:

| Notation | Means |
| --- | --- |
| `d20`, `3d6+2`, `4d8-1` | one twenty-sided die; three d6 plus 2; four d8 minus 1 |
| `4dF` | four Fate dice, each −1, 0 or +1 |
| `2d20kh1`, `2d20kl1` | advantage and disadvantage: keep the highest or the lowest |
| `4d6dl1` | four d6, drop the lowest one |
| `2d6r<3`, `3d6!` | reroll the low faces; explode on the highest |
| `6d10>=8f=1` | a pool: count the successes, a 1 takes one away |
| `(2d6+3)*2`, `floor(4d6/2)`, `max(1d20,1d20)+5` | arithmetic, in exact fractions |
| `6#4d6dl1` | the whole roll six times: six ability scores |
| `d[Yes,No,Maybe]`, `d6{6:3}` | a die of your own; a loaded die, marked as loaded |

[The notation page](docs/notation.md#dice-notation) has the whole table, the grammar, the formulas, the order the modifiers apply in, the success pools, and what is refused and why.

## What a roll returns

<!-- moved: docs/rolls.md -->

A roll is plain data: every die's face, whether it was kept, what became of it, the total, the time, the seed and the notation it was thrown from, as JSON. [Rolls](docs/rolls.md#what-a-roll-returns) shows one in full.

## Custom dice

<!-- moved: docs/custom-dice.md -->

A custom die is its faces: up to 20 of them, each up to 16 characters, worth a number or not (`3d[Hit=1,Miss=0,Miss=0]`). [Dice of your own](docs/custom-dice.md#custom-dice) has the rules and the odds.

## Loaded dice, and testing a die

<!-- moved: docs/custom-dice.md -->

Korokoro's own dice are fair. It can also load one (`d6{6:3}`), and then it tells everybody: the die wears a mark everywhere it appears, and `isFair` lets a site refuse anything loaded. A chi-square test says whether a real die looks fair. [More](docs/custom-dice.md#loaded-dice-and-testing-a-die).

## Sets of dice

<!-- moved: docs/custom-dice.md -->

A set is a roll with a name, kept on the device and shared by a link. [More](docs/custom-dice.md#sets-of-dice).

## Several rolls in one go

<!-- moved: docs/rolls.md -->

`6#4d6dl1` is six ability scores at once, with the highest, the lowest and the sum; `rollMany` throws them from one generator, so a seed replays the lot. [More](docs/rolls.md#several-rolls-in-one-go).

## Games

<!-- moved: docs/games-and-dice-war.md -->

Korokoro knows the dice of 44 games and how each game reads them: Yahtzee, Risk, craps, backgammon, Catan, Farkle, chō-han (丁半), chinchirorin (チンチロリン) and more, in one searchable list, each with the exact odds of every outcome. A game is read, not run. [Games and Dice War](docs/games-and-dice-war.md#games) has the shelves, the code and the limits; the [gallery](docs/games.md) shows every game one by one.

## Dice War

<!-- moved: docs/games-and-dice-war.md -->

The one game here that is played and not only read: two to eight players, any of them a computer; everybody rolls, the highest total scores, and a tie is war. Seeded, kept as text, with exact odds, and in the tray's Games. [More](docs/games-and-dice-war.md#dice-war).

## Holding dice

<!-- moved: docs/rolls.md -->

`rollHeld` keeps some dice of a roll and throws the rest again from the same source, as Yahtzee and Farkle do, so a seeded game replays. [More](docs/rolls.md#holding-dice).

## Odds

<!-- moved: docs/odds.md -->

The odds are worked out, never simulated: the chance of a total, of at least a target, the average, the spread, the most likely total and how lucky a throw was, for every notation it reads, including pools and formulas. [Odds](docs/odds.md#odds) shows each call.

## The command line

<!-- moved: docs/command-line.md -->

Installing the package puts three commands on the path, `korokoro`, `koro` and `roll`, which are the same: `roll 2d6+3`. They need Node 22 or later and nothing else, and print the roll, the odds, a game, JSON or CSV. [The command line](docs/command-line.md#the-command-line) has every option and the output of each command.

## Export

<!-- moved: docs/command-line.md -->

A history is written out three ways: CSV for a spreadsheet, JSON that reads back in, and plain text. [More](docs/command-line.md#export).

## Dice from an address

<!-- moved: docs/command-line.md -->

A page at `api/` shows a roll as plain text from its address, in your browser, for a link, a bookmark or a frame. [More](docs/command-line.md#dice-from-an-address).

## Seeded and shared rolls

<!-- moved: docs/rolls.md -->

Under **Randomness** the tray switches between **Fair**, the device's cryptographic generator, and **Seeded**, where the same seed throws the same sequence everywhere, so anybody can check a roll die for die. [More](docs/rolls.md#seeded-and-shared-rolls).

## One die on its own

<!-- moved: docs/embedding.md -->

A single die with nothing round it, that rolls when tapped or only shows a face: `mountDie` and the `<korokoro-die>` tag. [Embedding](docs/embedding.md#one-die-on-its-own) has the options.

## Embed it on any site

<!-- moved: docs/embedding.md -->

The tray on a page you do not build, in an iframe or as one tag, in three sizes. [Embedding](docs/embedding.md#embed-it-on-any-site) has the address and the sizes.

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

```ts no-check
mountRoller(el, { sound: false });                       // silent, no button
mountRoller(el, { playSound: ({ dice }) => myClack(dice) });  // your own sound
```

Dice sounds from Kenney's Casino Audio, CC0, [kenney.nl](https://kenney.nl/assets/casino-audio).
[SOUNDS.md](./SOUNDS.md) names the files and what was done to them.
## API

<!-- moved: docs/api.md -->

Every function is pure unless it says otherwise, every type is exported, and each has a doc comment your editor will show. The [API reference](https://johnmorrisdotca.github.io/korokoro/api.html), made from the source by `pnpm docs:site`, lists every export of every entry point with its signature and its doc comment. [The API page](docs/api.md#api) says what each call does, by what it is for.

### Entry points

| Import | What it holds |
| --- | --- |
| `@johnmorrisdotca/korokoro` | Dice, notation, exact odds, history and statistics, games, Dice War, export and sharing, and the tray to mount |
| `@johnmorrisdotca/korokoro/react` | `DiceRoller`: the tray as a React component |
| `@johnmorrisdotca/korokoro/vue` | `DiceRoller`: the tray as a Vue component |
| `@johnmorrisdotca/korokoro/element` | The custom elements, defined by `defineRoller()` |
| `@johnmorrisdotca/korokoro/element/define` | Defines `<korokoro-roller>` and `<korokoro-die>` by being imported |
| `@johnmorrisdotca/korokoro/sounds` | The recorded dice, as base64 AAC audio, fetched by the first roll that needs them |

### The calls to learn first

| Call | What it does |
| --- | --- |
| `parseNotation(text)` and `checkNotation(text)` | A roll read from notation, or `null`; or the part refused and why |
| `roll(spec, source?)` | A roll: every die, what became of it, the total |
| `seededSource(text)` | A source that throws the same dice for the same seed |
| `chanceAtLeast(spec, n)`, `expectedTotal(spec)`, `distributionOf(spec)` | Exact odds |
| `rollMany`, `rollHeld`, `rollPreset` | Several rolls, held dice, and a game's dice |
| `mountRoller(element, options)` | The tray |

## Theming

Every colour is a CSS variable on `.kk-root`. Pass them as `theme`, which sets
them on the tray itself and so wins in light and dark alike:

```js no-check
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
| Dice in one roll, asked for from code | up to 100, all plain | `MAX_DICE_BY_CODE` |
| Sides of dice that all differ | 100 | `MAX_UNIQUE_SIDES` |
| A number in a formula | 9999 | `MAX_MATH_NUMBER` |
| The span of a formula's totals | 1,000,000 | `MAX_MATH_TOTALS` |
| Kinds of dice in one roll | 4 | `MAX_GROUPS` |
| Rerolls until clear, for each die | 10 | `MAX_REROLLS` |
| Faces of a custom die | 2 to 20 | `MAX_FACES` |
| Characters in a custom face | 16 | `MAX_LABEL` |
| A custom face's value | −9999 to 9999 | `MAX_FACE_VALUE` |
| A loaded die | up to 100 sides, weights 0 to 99 | `MAX_LOADED_SIDES`, `MAX_WEIGHT` |
| Sets kept on a device | 50, names up to 40 characters | `MAX_SETS`, `MAX_SET_NAME` |
| Sides of a die | 2 to 1000, or `F` | `MIN_SIDES`, `MAX_SIDES` |
| Bonus | −99 to +99 | `MAX_MODIFIER` |
| Explosions for each die | 10 more dice | `MAX_EXPLOSIONS` |
| Largest die that may explode | d100 | `MAX_EXPLODING_SIDES` |
| Times a roll is thrown in one go | 1 to 100 (1 to 10 in the tray) | `MAX_TIMES` |
| A roll's label | 40 characters | `MAX_ROLL_LABEL` |
| Rolls kept in a history | 500 | `HISTORY_LIMIT` |
| Length of notation read | 400 characters | |

### More than ten dice

The tray and typed notation stop at ten dice: that is what fits a felt, and
what a table throws. Code may ask for up to a hundred:

```ts no-check
const volley = parseNotation("40d6", { maxDice: 100 })!;         // null without the option
normalizeSpec({ count: 40, sides: 6 }, { maxDice: 100 }).count;  // 40; 10 without it
roll(volley, seededSource("table"), { maxDice: 100 }).faces.length;  // 40; 10 without it
expectedTotal(volley);            // 140
chanceAtLeast(volley, 150);       // 0.1902
exactCounts(volley)!.outcomes;    // 6 to the 40th, a whole number of 32 digits
```

The one option, `maxDice`, is the same on all three, and on `rollMany`. Each
stops at ten without it, as it always has: `roll({ count: 50, sides: 6 })`
throws ten dice. `roll`'s third argument is the time of the roll, as before,
or `{ at, maxDice }`. On the command line it is `--max-dice 100`.

Past ten, every kind has to be plain dice: fair numbered or Fate dice, all
added or one kept (`100d20kh1`), which is where the odds stay exact and quick
however many there are. Anything else past ten is refused by name.
## Accessibility

- **Every control is a real control.** The tray's controls are native buttons, fields and summaries, at least 44 pixels square, and nothing needs a hover or a long press. Space rolls (or a tap on the felt), and a die on the felt can be held from the keyboard.
- **Results are spoken.** Each result is announced politely as it lands, in a live region, and the dice that will be rolled are said aloud as they change. A die is named by its face and what became of it ("d6: 6, exploded"). Dice War says its status in a polite line and lists the scores as a list.
- **Nothing depends on colour alone.** A die dropped, held, exploded or counted as a success is marked by shape (faded and struck through, a pin, a mark) as well as by colour, and a loaded die wears a mark everywhere it appears.
- **Reduced motion is respected.** The tumble and the landing are skipped on a device that asks for less motion, and the sound starts off there too. Nothing on the felt moves when the dice land: the box stays one size.
- **Sound is optional and never the only sign.** The speaker button mutes it and the choice is remembered; every roll is also written down.
- **Light and dark** follow the page, and every colour is a custom property (see [Theming](#theming)); the colour pairs have not been measured against WCAG contrast ratios.
- **Not yet.** The felt's dice are drawn as pictures, so a screen reader hears them through the result line and not die by die on the felt. The Japanese has not been read by a native reader (see [Languages](#languages)).

## Browser support

Any browser from the last few years: it needs ES2020 with `BigInt`,
`crypto.getRandomValues` and CSS `color-mix` (Chrome and Edge 111, Firefox
113, Safari 16.2). The sound needs the Web Audio API and AAC decoding, which
those browsers have; without them the tray is silent or plays its own knock.
It is tested in Chromium and in WebKit, Safari's engine, at phone size with
touch. The core also runs in Node 22 and later, Deno and Bun.
## Languages

English and Japanese, chosen by `locale` or the page's `lang`, or by the
reader where a page turns on `languageChooser`. The demo has a chooser of its
own, follows the browser's language on a first visit, and takes `?lang=ja` or
`?lang=en` in the address. **Japanese:
included; not yet reviewed by a native reader. Corrections welcome.** Every
Japanese string is listed beside its English in
[docs/strings-ja.md](./docs/strings-ja.md), and there is an issue template
for fixing one. Any other language is a table of your own passed as `strings`.
## Roadmap

- More notation, as tables ask for it
  ([Notation compared](./docs/notation-compared.md) keeps the list)
- Standalone executables of the command line, for machines without Node
- The documentation in Japanese
- More games: [suggest one](https://github.com/johnmorrisdotca/korokoro/issues/new?template=suggest-a-game.md)
- BCDice's notation, which Japanese tables use, as a candidate
- Ports to other languages are welcome: there is
  [a specification and a conformance suite](./docs/other-languages.md#writing-a-port)
  to write one against
- A hosted HTTP API: not planned, because it needs a server. The command line
  and the package will cover programs.
- Exploding dice that are kept or dropped, once a table's rule is chosen

Left out on purpose: shared live rooms, which need a server, dice skins for
sale, and 3D dice. Korokoro runs from a static page and costs nothing to host.

Ideas and pull requests are welcome.
## Architecture

<!-- moved: docs/architecture.md -->

The core is plain functions over plain data with no DOM and no dependency: dice, notation, exact odds, history and statistics, each in a module of its own, and the command line a pure function too. The tray is a small DOM layer, and the React and Vue components and the custom element are thin wrappers around it, each its own entry point, so a page loads only what it uses. The tabletop games are data: a preset is a line of dice and a named reading. [Architecture](docs/architecture.md#architecture) lists every source file and what it does.

## The name

*Korokoro* (コロコロ) is a Japanese sound-word for something small and round
rolling or tumbling along: a die across a table, an acorn down a slope.
Japanese has a great many words of this kind, which name a thing by the sound
or the feel of it, and this one is the sound of what the package does. Say it
in four even beats: ko-ro-ko-ro.

Dice, as it happens, are *saikoro* (サイコロ) in Japanese, which ends on the
same two beats. We make no claim about where either word comes from; it is a
pleasant echo.
## Where it comes from, and where it is used

Korokoro was built for [Itsutsu](https://itsutsu.com), a site for board games,
puzzles, card games and dice games played at your own pace. *Itsutsu* (五つ) is
Japanese for "five", after five in a row, the game the site began with. The
site needed dice that were fair and that anybody could check, and once they
existed they seemed worth sharing.

### Used by

- [Itsutsu](https://itsutsu.com), for its dice.

That is the whole list so far. Using Korokoro in something? Open an *Add my
project* issue and we will add you.

### The family

<!-- family:start (made by scripts/family-readme.mjs from scripts/family-template.mjs; change those, not this) -->
Korokoro is one of twenty-four packages, each made for the same site, each at
[github.com/johnmorrisdotca](https://github.com/johnmorrisdotca). The code of every one is MIT.

- [Korokoro](https://github.com/johnmorrisdotca/korokoro) (コロコロ): dice, with notation, exact odds, real sounds and the dice of many games. [Demo](https://johnmorrisdotca.github.io/korokoro/).
- [Kyuubu](https://github.com/johnmorrisdotca/kyuubu) (キューブ): a turning cube for the browser, 2×2 to 7×7, with record solves to replay. [Demo](https://johnmorrisdotca.github.io/kyuubu/).
- [Hitotsu](https://github.com/johnmorrisdotca/hitotsu) (一つ): a colour-card shedding game for two to eight, with the house rules people play. [Demo](https://johnmorrisdotca.github.io/hitotsu/).
- [Toranpu](https://github.com/johnmorrisdotca/toranpu) (トランプ): a deck of playing cards, card games with computer players, and solitaires. [Demo](https://johnmorrisdotca.github.io/toranpu/).
- [Tane](https://github.com/johnmorrisdotca/tane) (種): seeded random numbers and daily seeds, the same in every browser and on every server. [Demo](https://johnmorrisdotca.github.io/tane/).
- [Narabe](https://github.com/johnmorrisdotca/narabe) (並べ): one rules engine for abstract board games, from gomoku and Reversi to Go and checkers. [Demo](https://johnmorrisdotca.github.io/narabe/).
- [Tenka](https://github.com/johnmorrisdotca/tenka) (天下): world conquest for two to six, on a map of the real world. [Demo](https://johnmorrisdotca.github.io/tenka/).
- [Kumimoji](https://github.com/johnmorrisdotca/kumimoji) (組み文字): a crossword tile race, in English and Japanese kana. [Demo](https://johnmorrisdotca.github.io/kumimoji/).
- [Tsunagi](https://github.com/johnmorrisdotca/tsunagi) (繋ぎ): a line-joining logic puzzle whose every level has exactly one answer. [Demo](https://johnmorrisdotca.github.io/tsunagi/).
- [Jarajara](https://github.com/johnmorrisdotca/jarajara) (ジャラジャラ): mahjong tiles drawn as SVG, stacked layouts, and the matching solitaire Awase. [Demo](https://johnmorrisdotca.github.io/jarajara/).
- [Suido](https://github.com/johnmorrisdotca/suido) (水道): a pipe puzzle: turn the pieces until the water reaches every drain. [Demo](https://johnmorrisdotca.github.io/suido/).
- [Domino](https://github.com/johnmorrisdotca/domino) (ドミノ): dominoes and Mexican Train. [Demo](https://johnmorrisdotca.github.io/domino/).
- [Kotoba](https://github.com/johnmorrisdotca/kotoba) (言葉): word lists and word-game rules in English, French, German and Japanese. [Demo](https://johnmorrisdotca.github.io/kotoba/).
- [Sugoroku](https://github.com/johnmorrisdotca/sugoroku) (双六): backgammon and its variants, with the doubling cube and match play. [Demo](https://johnmorrisdotca.github.io/sugoroku/).
- [Kazu](https://github.com/johnmorrisdotca/kazu) (数): grid number puzzles: Sudoku and its variants, Futoshiki and Skyscrapers. [Demo](https://johnmorrisdotca.github.io/kazu/).
- [Meikyuu](https://github.com/johnmorrisdotca/meikyuu) (迷宮): mazes on squares, hexagons, triangles and circles, made from a seed and drawn through with a finger or the mouse. [Demo](https://johnmorrisdotca.github.io/meikyuu/).
- [Hikidashi](https://github.com/johnmorrisdotca/hikidashi) (引き出し): a drawer of small Japanese text tools: era dates, kanji numerals, readings and sentence difficulty. [Demo](https://johnmorrisdotca.github.io/hikidashi/).
- [Chizu](https://github.com/johnmorrisdotca/chizu) (地図): maps of the world and of countries' regions, in English and Japanese, with a quiz and callouts. [Demo](https://johnmorrisdotca.github.io/chizu/).
- [Bushu](https://github.com/johnmorrisdotca/bushu) (部首): find a kanji by the parts it is made of. [Demo](https://johnmorrisdotca.github.io/bushu/).
- [Tobiishi](https://github.com/johnmorrisdotca/tobiishi) (飛び石): peg solitaire with nine boards and seeded solvable challenges. [Demo](https://johnmorrisdotca.github.io/tobiishi/).
- [Jirai](https://github.com/johnmorrisdotca/jirai) (地雷): minesweeper on shaped grids with verified no-guess boards. [Demo](https://johnmorrisdotca.github.io/jirai/).
- [Gunjin](https://github.com/johnmorrisdotca/gunjin) (軍人): five hidden-rank strategy games with pass-the-device play. [Demo](https://johnmorrisdotca.github.io/gunjin/).
- [Karakuri](https://github.com/johnmorrisdotca/karakuri) (からくり): eight hyper-casual puzzle games, some of them physics: draw a shield, pull pins, cut ropes, slide blocks, pour tubes. [Demo](https://johnmorrisdotca.github.io/karakuri/).
- [Houseki](https://github.com/johnmorrisdotca/houseki) (宝石): gem and stone matching puzzles: falling triplets, stone collapse, colour chains and gem swap. [Demo](https://johnmorrisdotca.github.io/houseki/).

**This package is Korokoro.** The demos of all twenty-four share one header and footer, so each links the rest.
<!-- family:end -->
## Development

```sh
pnpm install
pnpm check                # lint, types and tests
pnpm test:package        # pack it, install it, and use it as published
pnpm test:cli            # the command line, as a child process
pnpm test:tray           # the demo and the documentation site, built and tapped in real browsers
pnpm test:readme         # run every example in this README against the built package
pnpm site                # build the demo into ./site, then serve it
pnpm screenshots:readme  # take the README's pictures from the built demo, in light and dark
pnpm docs:site           # build the documentation site
```

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md); the commands are under [Development](#development).

Please follow the [code of conduct](./CODE_OF_CONDUCT.md).

## Changes

See [CHANGELOG.md](./CHANGELOG.md), and [docs/migrating.md](./docs/migrating.md) for the one change so far that needs a second look: what `r` means. The latest release, 1.15.2, adds no code: it is this README in full, with pictures of the tray, examples that are run on every change, an Accessibility section, and the long reference material moved to pages under `docs/`.

## Licence

[MIT](./LICENSE) © John Morris. The dice recordings are CC0; see
[SOUNDS.md](./SOUNDS.md).
