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

<p align="center"><a href="https://johnmorrisdotca.github.io/korokoro/"><strong>Roll some dice →</strong></a></p>

<p align="center">
  <img src="docs/desktop.jpg" alt="Eight d6 on the felt, their total with a luck meter, and the stats panel with face counts and totals against the odds" width="720">
  <img src="docs/phone.jpg" alt="Four d6 with the lowest dropped, on a phone in dark mode: the dropped die struck through" width="220">
</p>

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

## Use it in your project

Korokoro is three things, each usable without the others: **an API** of plain
functions (roll, read notation, work out odds, keep a history), **a tray** you
mount into any element, and **a React component** that wraps the tray.

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
  return <DiceRoller wide spec={{ count: 2, sides: 20, keep: "highest" }} onRoll={(roll) => save(roll)} />;
}
```

The component takes the tray's options as props, plus any attribute for its
`<div>`. The tray mounts in the browser after the first render, so server
rendering draws an empty box and nothing needs a provider. In Next.js, use it
from a client component (`"use client"`).

### 4. Vue

```vue
<script setup>
import { onBeforeUnmount, onMounted, ref } from "vue";
import { mountRoller } from "@johnmorrisdotca/korokoro";

const box = ref(null);
let roller;
onMounted(() => (roller = mountRoller(box.value, { onRoll: (roll) => console.log(roll.total) })));
onBeforeUnmount(() => roller?.destroy());
</script>

<template><div ref="box"></div></template>
```

### 5. Svelte and Angular

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

```ts
// Angular: in a standalone component with <div #box></div> in its template
private box = viewChild.required<ElementRef<HTMLElement>>("box");
constructor() {
  afterNextRender(() => (this.roller = mountRoller(this.box().nativeElement)));
}
ngOnDestroy() {
  this.roller?.destroy();
}
```

Each of the five is built from the packed tarball and rolled in Chromium and
WebKit by `scripts/check-frameworks.mjs` before a release names it.

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
  16.2. The core runs in Node 20 and later, Deno and Bun.

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

Korokoro has siblings, each made for the same site, each MIT, each at
[github.com/johnmorrisdotca](https://github.com/johnmorrisdotca):

- [Kyuubu](https://github.com/johnmorrisdotca/kyuubu) (キューブ, how Japanese
  says "cube"): a turning cube for the browser, 2×2 to 7×7, drawn in CSS 3D.
- [Toranpu](https://github.com/johnmorrisdotca/toranpu) (トランプ, the everyday
  Japanese word for a deck of playing cards): ten card games as pure rules.
- [Tane](https://github.com/johnmorrisdotca/tane) (種, a seed, the kind you
  plant): seeded random numbers and daily seeds. Korokoro's seeded rolls are
  the same idea.
- [Hitotsu](https://github.com/johnmorrisdotca/hitotsu) (一つ, "one"): a
  colour-card game, named for the call a player makes with one card left.
- [Narabe](https://github.com/johnmorrisdotca/narabe) (並べ, "line them up"):
  a rules engine for gomoku, Reversi, Go, checkers and many more.
- [Tenka](https://github.com/johnmorrisdotca/tenka) (天下, "under heaven"):
  a world-conquest game for two to six.
- [Kumimoji](https://github.com/johnmorrisdotca/kumimoji) (組み文字, "letters
  put together"): a crossword tile race in English and Japanese.

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
- **Games, with their dice and their readings.** Yahtzee, Risk, craps,
  backgammon, Catan, Farkle, chō-han (丁半), chinchirorin (チンチロリン) and
  more: 44 games in one searchable list, each read the way the game reads
  it, with the exact odds of each outcome. See [Games](#games).
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
- **Made for a phone.** One thumb does everything: every control is at least
  44px, nothing needs a hover or a long press, and nothing moves when the dice
  land. English and Japanese.
- **It feels like dice.** Tap anywhere on the felt or press Space. The dice
  tumble for about half a second and land, with the sound of real dice and a
  mute button. Light and dark, and themeable. Under reduced motion there is no
  tumble and the sound starts off.

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
| `2d6r<3`, `2d6r<=2` | two d6; a 1 or a 2 is thrown again until it clears |
| `2d6ro<3`, `2d6ro<=2` | two d6; a 1 or a 2 is thrown again, once |
| `3d6!` | three exploding d6: a 6 throws another die and adds it |
| `3d6!ro<2+1` | all of it together: reroll, explode, then add 1 |
| `6d10>=8`, `6d10>7` | count successes: how many of six d10 show 8 or more |
| `6d10>=8f=1`, `6d10>7f1` | the same, and each 1 takes a success away |
| `5d10>=8!` | successes, with every 10 throwing another die (10-again) |
| `3d6=6`, `4d6<=2`, `3d6<>1` | count the sixes; the ones and twos; everything but ones |
| `3d6!>=5`, `3d6!=1` | explode on a 5 or a 6; explode on a 1 |
| `3d6!!` | compounding: the extra dice are added into the die that threw them |
| `3d6!p` | penetrating: each extra die counts one less |
| `3d6!!p` | both |
| `2d6r=3`, `2d6r3`, `2d6r>=5` | reroll 3s until clear; reroll 5s and 6s until clear |
| `2d6ro=6`, `2d6ro>=5` | reroll a 6 once; reroll a 5 or a 6 once |
| `2d6r`, `2d6ro` | `r` alone is the lowest face: reroll 1s until clear, or once |
| `4d6k3`, `4d6b3`, `4d6d1`, `2d20w1` | short for `kh3`, `kh3`, `dl1` and `kl1` |
| `4d6min2` | a die counts for at least 2: a 1 is read as a 2 |
| `4d6max5`, `4d6min2max5` | a die counts for at most 5; both together |
| `1d20cs>=19cf=1`, `1d20cscf` | mark critical successes and failures; `cs` alone is the highest face and `cf` the lowest. Only marks: the total is the same |
| `4d6sd`, `4d6sa`, `4d6s` | show the dice sorted, descending or ascending |
| `2d6+3 # fire damage`, `[fire damage] 2d6+3` | a label, saying what the roll is for |
| `1d20+1d4` | a d20 and a d4, added |
| `2d6+1d8+3` | two d6, a d8, plus 3 |
| `2d20kh1+1d4+5` | advantage, a d4 on top, plus 5: each kind keeps its own rules |
| `6#4d6dl1` | the whole roll, six times over: six ability scores |
| `3#2d20kh1+5` | three attacks with advantage, each plus 5 |
| `d[Yes,No,Maybe]` | a custom die: its faces are whatever you write |
| `2d[Hit=1,Miss=0,Miss=0]` | two custom dice whose faces are worth numbers; a face written twice comes up twice as often |
| `d[1,1,2,3,5,8]` | a custom die of numbers, each worth itself |
| `d6{6:3}` | a loaded d6: its 6 weighs three times the rest, and it is marked as loaded everywhere |

```
roll     = [times "#"] dice { "+" dice } [bonus] [ "#" label ]
times    = 1 to 100: how many times the whole roll is thrown
dice     = [count] "d" sides { modifier }
count    = 1 to 10 over the whole roll, and 1 when left out
sides    = 2 to 1000, "%" for 100, or "F" for a Fate die
         | number "{" face ":" weight { "," face ":" weight } "}"     a loaded die
         | "[" face { "," face } "]"                                 a custom die
face     = words [ "=" value ] [ "#" colour ]      in a custom die
modifier = ( "!" | "!!" | "!p" | "!!p" ) [compare]     explode; compounding; penetrating; both
         | "r" [point] | "ro" [point]                  reroll until clear, or once
         | "kh" [n] | "kl" [n] | "dh" [n] | "dl" [n]   keep or drop; k and b are kh, d is dl, w is kl
         | "min" n | "max" n                           the least and the most a die counts for
         | compare                                     count successes
         | "f" point                                   a failure takes a success away
         | "cs" [point] | "cf" [point]                 mark critical dice
         | "sa" | "sd" | "s"                           show the dice sorted
compare  = ( "=" | "<" | ">" | "<=" | ">=" | "<>" ) number
point    = compare | "!=" number | number              a bare number is "="
bonus    = "+" or "-", then 0 to 99
label    = up to 40 characters; "[label]" in front of the roll is read too
```

Letters in either case, spaces allowed between the parts. A roll holds up to
four kinds of dice, each with its own modifiers, and the bonus comes last.
Two kinds that are the same dice under the same rules are one kind: `2d6+3d6`
is `5d6`.

### How the modifiers combine

They may be written in any order, each at most once, and are always applied in
this one:

| Step | Rule | What happens |
| --- | --- | --- |
| 1 | **Reroll** (`r`, `ro`) | With `ro`, a die meeting the reroll is thrown again once, and the new face stands whatever it is. With `r`, it is thrown again until it clears, up to 10 times. |
| 2 | **Explode** (`!`, `!!`, `!p`, `!!p`) | If the face left standing explodes, another die is thrown, and it follows steps 1 and 2 itself. A die may throw up to 10 more; the last is read as it lies. |
| 3 | **Least and most** (`min`, `max`) | Each die is read as no less than `min` and no more than `max`. A penetrating die's extra dice then count one less. The face thrown is kept and shown; what it counts for is beside it. |
| 4 | **Keep or drop** (`kh`, `kl`, `dh`, `dl`) | Picks among that kind's dice left standing. A tie keeps the die thrown first. |
| 5 | **Count** (a comparison, and `f`) | If successes are counted, each die standing that meets the comparison is 1, each that meets `f` is −1, and the kind's total is their sum. Each die of an explosion is a die of its own; a compounding die is one die, compared once for its whole chain. |
| 6 | **Mark** (`cs`, `cf`) | Dice meeting them are marked. Nothing else changes. |
| 7 | **Sort** (`sa`, `sd`) | The order the dice are shown in. The roll keeps the order they were thrown in. |
| 8 | **Add** | The kinds are added together, then the bonus. |

The kinds are thrown in the order written, and each die is settled, rerolls
and explosions and all, before the next is thrown, so a seeded roll replays
die for die. This is Roll20's meaning of `r` and `ro`, and the one most dice
libraries follow. (Until 1.4.0 this package's `r` rerolled once: see
[Migrating](./docs/migrating.md).)

Two things differ from some other rollers, and
[Notation compared](./docs/notation-compared.md) sets them side by side: a
reroll comes before an explosion here, and `min` and `max` are applied to
what a die counts for, after it has exploded on the face it threw.

Counting successes, from the seed `table-7`:

```ts
const pool = roll(parseNotation("6d10>=8f=1")!, seededSource("table-7"));
pool.faces;                          // [10, 6, 6, 3, 4, 3]
pool.total;                          // 1: one success, and no 1 to take it away
pool.dice[0].counts;                 // 1
chanceAtLeast(pool.spec, 3);         // 0.1859: three successes or more
expectedTotal(pool.spec);            // 1.2
```

### What is refused

`parseNotation` returns `null`, and `checkNotation` names the part, rather
than quietly rolling something different:

| Refused | Why |
| --- | --- |
| `11d6`, `0d6` | one to ten dice at a time |
| `d1`, `d1001` | a die has 2 to 1000 sides |
| `2d6+100` | a bonus is at most 99 either way |
| `4d6kh4`, `4d6dl4`, `1d20kh1` | keep or drop has to leave at least one die and fewer than all |
| `4d6kh3dl1`, `3d6!r<2!` | one keep or drop, and each modifier once |
| `2d6ro<1`, `2d6ro<7`, `2d6r=7` | a reroll has to reroll some face and spare another |
| `1d6r<5`, `2d6r>=3` | a reroll until clear may match at most half the faces, so that it ends; `ro` has no such limit |
| `6d10>=11`, `6d10>=1` | a success has to be one some dice meet and some do not |
| `6d10f1`, `6d10>=8f>=8` | a failure needs a success to take from, and must not overlap it |
| `4d6kh3>=5` | successes are counted over all the dice of a kind, not together with keep or drop |
| `3d6!>=1`, `3d6!=7` | dice explode on some faces, never all and never none |
| `4d6min1`, `4d6max6`, `4d6min5max4` | `min` goes above the lowest face and `max` below the highest, with `min` no greater than `max` |
| `1d20cs>=21` | a mark has to be one some dice can meet |
| `2d6 # 3`, `2d6 # one # two` | a label is up to 40 characters, not only digits, and has no `#`, brackets or braces (for a repeat, write `3#2d6`) |
| `0#2d6`, `101#2d6` | a roll is thrown 1 to 100 times |
| `1d4+1d6+1d8+1d10+1d12` | a roll has at most four kinds of dice |
| `6d6+5d8` | ten dice at most over the whole roll |
| `1d20-1d4` | dice are added together; only the bonus can be taken away |
| `d[only]`, `2d[Yes,No]kh1` | a custom die has 2 to 20 faces and takes no modifiers |
| `d6{7:2}`, `d6{6:1}` | a loaded die names faces it has, and a die whose weights are all the same is not loaded |
| `4d6!kh3` | exploding dice are not kept or dropped: tables disagree on whether an explosion is a new die in the pool or part of the die that threw it |
| `4dF!`, `2d1000!` | Fate dice do not explode, nor do dice of more than 100 sides |

```ts
checkNotation("4d6!kh3");
// { ok: false, problem: "explode", part: "!",
//   message: "“!”: dice explode only with 100 sides or fewer, never Fate dice, not together with keep or drop, and on some faces but not all" }
```

`formatNotation` writes each roll one way: each kind as its dice, then the
count of successes, the explosion, the reroll, `kh` or `kl`, `min` and `max`,
the marks and the sort; the kinds joined by `+`; then the bonus and the label.
So `4d6dl1` is written back as `4d6kh3`, `6#4d6dl1` as `6#4d6kh3`, `6d10>7` as
`6d10>=8`, and `6d10!>=10>=8` as `6d10>=8!`. A success is written before an
explosion because `!>=8` is an explosion at 8 or more.

The `#` stands apart from the dice on purpose: `6#4d6` is six rolls of `4d6`,
never 6 times their total.

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
- A die worth something other than its face says so in `value`: a custom
  face's value, a face raised by `min` or lowered by `max`, a penetrating
  die's extra die with its one taken off. `3d6!p` from the same seed is faces
  `[6, 4, 2, 1]`, where the 4 is an extra die worth 3, and a total of 12.
- In a roll that counts successes, `counts` is 1 on a success and −1 on a die
  that takes one away, and the total is their sum plus the bonus.
  `isSuccessRoll(spec)` says whether a roll's total is a count.
- `critical` is `"success"` or `"failure"` on a die marked by `cs` or `cf`.

`3d6!` from the same seed throws five dice, because two of them exploded:

```ts
faces  // [6, 3, 6, 4, 5]
dice   // die 0: 6 (exploded), 3 · die 1: 6 (exploded), 4 · die 2: 5
total  // 24
```

In a roll of several kinds each die also says which kind it is (`group`, from
0), and `sidesOf(spec, die)` gives its sides. `1d20+2d4+3` from `table-7`:

```ts
faces  // [10, 2, 4]
dice   // group 0 (the d20): 10 · group 1 (the d4s): 2, 4
total  // 19
```

## Custom dice

A custom die is its faces: up to 20 of them, each up to 16 characters.

```ts
const spec = parseNotation("3d[Hit=1,Miss=0,Miss=0]")!;
const thrown = roll(spec, seededSource("table-7"));
thrown.dice.map((d) => d.label);   // ["Miss", "Hit", "Miss"]
thrown.faces;                      // [3, 1, 2]: each face by its place on the die, from 1
thrown.total;                      // 1: the faces' values added up
expectedTotal(spec);               // 1: three dice, each a hit one time in three
```

- **`Hit=1`** gives a face a value for the total. A number alone is worth
  itself (`d[1,1,2,3,5,8]`). A face with no value adds nothing.
- **`Yes#2a7`** gives a face a colour, as `#rgb` or `#rrggbb`.
- **A face written twice** comes up twice as often.
- **A die of words only**, such as `d[Yes,No,Maybe]`, has no total: the roll is
  what the faces say, `hasTotal(spec)` is false, and its odds are how often
  each face comes up (`faceChances`).
- **A face's words are text.** They are never read as HTML, in the tray or
  anywhere else, and the characters notation is written with (`, [ ] { } = # +`)
  cannot be part of one.
- A custom die takes no modifiers, and `isFair` is false for it: its faces are
  whatever somebody made them.

In the tray, custom dice are made under *More*,
one level down: type the faces with commas between them.

## Loaded dice, and testing a die

Korokoro's own dice are fair. It can also load one, and then it tells
everybody: `d6{6:3}` shows its 6 three times in eight, wears a mark on the
felt, in the history and in every link, and is `loaded: true` in the data.
`isFair(spec)` lets a site refuse anything loaded in one call.

```ts
const optimist = parseNotation("d6{6:3}")!;
isFair(optimist);                             // false
roll(optimist).loaded;                        // true
fairnessTest([30, 30, 30, 30, 30, 90]).verdict;  // "lopsided": a fair d6 does this about never
fairnessTest([82, 95, 103, 98, 104, 118]).verdict;  // "fair"
```

`fairnessTest` is a chi-square test of how often each face came up, and works
on any counts: a history here, or a real die's results typed into **Stats →
Test a real die**. It says nothing until it has at least five throws expected
of each face.

The whole story, with the three house dice, the two sets of odds and a short
history of crooked dice, is in
[Loaded dice, and how to catch one](./docs/loaded-dice.md).

## Sets of dice

A set is a roll with a name, kept on the device: "Longsword" for `1d8+3`,
"Skirmish" for `3d[Hit=1,Miss=0,Miss=0]`. In the tray they live under
*More*: name the roll showing, and it is there next time.
A set is shared by a link, which anybody can open and keep:

```
?dice=3d%5BHit%3D1%2CMiss%3D0%2CMiss%3D0%5D&name=Skirmish&v=2
```

```ts
const set = makeSet("Skirmish", "3d[Hit=1,Miss=0,Miss=0]")!;
setQuery(set);                  // the query above
readSet(setQuery(set));         // { name: "Skirmish", notation: "3d[Hit=1,Miss=0,Miss=0]" }
```

Sets are kept in the browser's storage and nowhere else: there is no account
and no server. Up to 50 of them.

## Several rolls in one go

Ability scores are `4d6dl1` six times; three attacks are the same roll three
times. `rollMany` throws them one after another from the one generator, so a
seed replays the whole lot, and each is an ordinary `Roll` that says which
run it belongs to (`roll.set`).

```ts
const scores = rollMany(parseNotation("4d6dl1")!, 6, seededSource("table"));
scores.rolls.map((r) => r.total);   // [8, 12, 11, 9, 13, 12]
scores.sum;                         // 65
scores.highest;                     // 13
scores.lowest;                      // 8

rollMany(parseNotation("6#4d6dl1")!);  // the notation carries the count too

chanceAnyAtLeast(parseNotation("4d6dl1")!, 18, 6);  // 0.0934: at least one 18 among the six
expectedHighest(parseNotation("4d6dl1")!, 6);       // 15.66: the best of six, on average
```

In the tray it is **Times**, under *More*, from 1 to 10. One tap throws them
all: the felt shows the last, and a list under the total gives each roll with
the highest and the lowest marked, and the sum. The history keeps them as one
entry that opens, the sound plays once, and *Copy link* shares all of them.
Dice are held one roll at a time, so holding waits until Times is back at 1,
and the tray says so.

## Games

Korokoro knows the dice of 44 games, and how each game reads them. Open
**Games** in the tray, type a few letters, and choose one; or link straight to
it with `?game=yahtzee`; or call it from code, by any name the game goes by:

```ts
const thrown = rollPreset("yahtzee", { source: seededSource("table") });
thrown.roll.faces;       // [1, 2, 1, 5, 4]
thrown.reading.text;     // "Chance, for 13"
thrown.reading.outcome;  // "chance": the same in every language

getPreset("Yacht") === getPreset("yahtzee");   // true: other names find it too
presetOdds(getPreset("craps")!);
// a natural (7 or 11) 8 of 36, craps (2, 3 or 12) 4 of 36, a point 24 of 36
```

<p align="center"><img src="docs/games.jpg" alt="Yahtzee chosen on a phone: five d6 on the felt, read as a large straight, on roll 1 of 3" width="260"></p>

| Shelf | Games |
| --- | --- |
| Board games | Monopoly, Catan, Backgammon and its doubling cube, Snakes and Ladders, Ludo, Parcheesi, Pachisi (six cowries), Risk |
| Dice games | Yahtzee, Farkle, Bunco, Pig, Liar's dice, Poker dice, Ship captain and crew, Shut the box, Mexico, Left Center Right |
| Traditional games | Craps, Sic bo, Chuck-a-luck, Hazard, Chō-han (丁半), Chinchirorin (チンチロリン) |
| Roleplaying games | a d20 check, advantage and disadvantage, ability scores, Fate, Blades in the Dark, Powered by the Apocalypse, d10 and d6 pools, percentile, 3d6 roll-under, d66 |
| Handy dice | a coin, yes-no-maybe, pick a number, rock-paper-scissors, a compass, a colour die; and who goes first at a card table |

Every one is in the [gallery](./docs/games.md), with its dice, how it is read,
the exact odds of each outcome and a link to the rules.

- **A game is read, not run.** Korokoro throws the dice and says what the game
  makes of them: "a small straight", "8 is the point", "the defender loses 2".
  Whose turn it is, the board and the score sheet stay on your table.
- **Turns of several rolls hold dice.** Yahtzee and Ship, captain and crew give
  three rolls: tap dice to hold them between rolls, and the tray counts.
- **A roll is read in the light of the ones before it** where the game does:
  the point in craps, the turn's total in Pig, a third doubles in Monopoly.
- **Exact odds of each outcome**, counted over every way the dice can fall:
  Risk's three against two is 2,890, 2,611 and 2,275 of 7,776.
- **The dice are fair.** A game never loads a die; only you can, and a loaded
  die stays marked whatever game is showing.
- **Nothing about stakes.** The traditional games are here for their dice and
  their odds.

**Is your game missing? [Tell us](https://github.com/johnmorrisdotca/korokoro/issues/new?template=suggest-a-game.md)**,
or add it: a game is one line of data and a test, and
[CONTRIBUTING](./CONTRIBUTING.md#adding-a-game) walks through one.

Game names are trademarks of their owners, used here only to say which game's
dice these are. Korokoro is not affiliated with or endorsed by any of them.

## Holding dice

`rollHeld` keeps some dice of a roll and throws the rest again, from the same
source, so a seeded game replays. Only plain dice can be held (`canHold`): no
keep or drop, reroll or explosion. Custom and loaded dice can be held too.

```ts
const dice = seededSource("yacht");
const first = roll(parseNotation("5d6")!, dice);                  // [3, 3, 6, 3, 6]
const second = rollHeld(first, first.faces.map((f) => f === 6), dice);
second.faces;  // [3, 4, 6, 1, 6]: the sixes stayed, the other three were thrown again
second.held;   // [false, false, true, false, true]
```

The odds with dice held are those of the dice still to roll, on top of the
held ones:

```ts
const odds = distributionHolding(first.spec, first.faces, [false, false, true, false, true]);
odds.min;                // 15: two sixes held, three dice still to roll
expectedTotal(odds);     // 22.5
chanceAtLeast(odds, 24); // 0.375
```

Every odds function takes a spec or a distribution like this one. In a
history, a roll with dice held counts only its new dice towards the stats,
and is left out of luck, streaks and totals: what was held was a choice.

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
| Rerolls, once or until clear | Each face's chance of being the one left standing, then as above |
| Exploding dice | Each chain's chance up to the limit, then summed over the dice |
| Loaded and custom dice | Counted in whole numbers like fair dice, each face standing for as many outcomes as it weighs |
| Several kinds of dice | Each kind as above, then every pair of their totals: a convolution |
| Dice held | The dice still to roll as above, moved up by the held faces |

**Counts.** Ten d1000 has 10^30 outcomes, far more than a JavaScript number
holds exactly, so plain dice and advantage are counted as `BigInt` and only
turned into a probability at the end. `exactCounts` hands the whole numbers
out:

```ts
exactCounts(parseNotation("8d6")!);
// { min: 8, outcomes: 1679616n, counts: [1n, 8n, 36n, … ] }   135954n of them total 28
exactCounts(parseNotation("1d20+1d4")!); // { min: 2, outcomes: 80n, counts: [1n, 2n, 3n, 4n, 4n, … ] }
exactCounts(parseNotation("4d6dl1")!);   // null: see below
```

**Probabilities.** Rerolled and exploding dice, and several dice kept from a
pool, do not have equally likely outcomes to count, so their odds are worked
out as probabilities, right to the last digits a number holds (about fifteen).
`exactCounts` returns `null` for them and never a guess.

**Exploding dice and rerolls until clear** could go on for ever in theory.
Here a die stops after 10 explosions, and after 10 rerolls, in the roll and in
the odds alike, so the odds are exactly those of the dice as thrown and they
sum to 1. Nothing is approximated and no remainder is left over. A d6
exploding, or rerolling its 1s, reaches that limit once in 60 million dice; a
reroll until clear of half a die's faces, the most allowed, reaches it once in
a thousand.

**Speed.** The slowest roll the package accepts, `10d1000kh9`, takes about a
tenth of a second the first time and nothing after: each spec's odds are
remembered. Large mixed pools (`5d1000+5d999`) are put together as
probabilities, and `exactCounts` returns `null` for them.

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
?roll=4d6kh3&faces=6%2C4%2C2%2C1&at=1759190400000&seed=table-7&v=2
```

Whoever opens it sees the same dice and total, marked as a shared roll and
kept out of their own history. `readShared` refuses a link whose faces the
dice could not have shown. `v=2` is the notation's version; a link without it
was made before 1.4.0 and is read as it was written then.

## API

Every function is pure unless it says otherwise, every type is exported, and
each has a doc comment your editor will show.

### Rolling

```ts
type DieSides = 4 | 6 | 8 | 10 | 12 | 20 | 30 | 100;  // the dice with a button
type Sides = number | "F";                           // 2 to 1000, or a Fate die
type Keep = "all" | "highest" | "lowest";
type DiceGroup = {       // one kind of dice and its rules
  count: number; sides: Sides; keep: Keep;
  keepCount?: number;    // how many `keep` keeps; left out when one
  explode?: true;        // left out when the dice do not explode
  reroll?: number;       // `ro<`: reroll once at this face or lower
  rerollUntil?: number;  // `r<`: reroll until above this face
  rerollWhen?: Compare;       // `ro=3`, `ro>=5`: the rerolls the two above cannot say
  rerollUntilWhen?: Compare;  // `r=3`, `r>=5`
  explodeWhen?: Compare;      // `!>=5`: the faces that explode, when not just the highest
  explodeKind?: "compound" | "penetrating" | "compound-penetrating";  // `!!`, `!p`, `!!p`
  floor?: number;        // `min2`
  ceiling?: number;      // `max5`
  success?: Compare;     // `>=8`: the dice are counted, not added
  failure?: Compare;     // `f=1`
  critical?: Compare;    // `cs>=19`
  fumble?: Compare;      // `cf=1`
  sort?: "ascending" | "descending";  // `sa`, `sd`
};
type Compare = { op: "=" | "<=" | ">=" | "<>"; n: number };  // `<3` is kept as `<=2`, `>7` as `>=8`
type RollSpec = DiceGroup & {
  modifier: number;
  more?: DiceGroup[];    // the other kinds of dice; left out when there is one
  times?: number;        // `6#`: how many times it is thrown; left out when once
  label?: string;        // `# fire damage`: what the roll is for; only ever shown as text
};

roll(spec: Partial<RollSpec>, source?: RandomSource, at?: number): Roll
rollHeld(previous: Roll, held: boolean[], source?: RandomSource, at?: number): Roll
canHold(spec: RollSpec): boolean                    // plain dice only
groupsOf(spec: RollSpec): DiceGroup[]               // the kinds of dice, in order
specOf(groups: DiceGroup[], modifier?: number): RollSpec
diceCount(spec: RollSpec): number                   // dice asked for, over all kinds
sidesOf(spec: RollSpec, die: DieRoll): Sides        // the kind of die one die is
diceOf(roll: Roll): DieRoll[]                       // roll.dice, or worked out from the faces
readDice(spec: RollSpec, faces: number[]): DieRoll[] | null  // null if the dice could not show them
rollMany(spec, times?, source?, at?): RollSet        // { rolls, sum, highest, lowest }; times from the spec unless given
setOf(rolls: Roll[]): RollSet                       // the same summary of rolls already made
normalizeSpec(spec: Partial<RollSpec>): RollSpec    // brings a spec into range
rangeOf(spec: RollSpec): { min: number; max: number }
parseNotation(text: string, options?: { legacyReroll?: boolean }): RollSpec | null
checkNotation(text: string, options?): { ok: true; spec: RollSpec } | { ok: false; problem; part; message }
formatNotation(spec: RollSpec): string
isSuccessRoll(spec: RollSpec): boolean              // the total is a count of successes
dieOutcomes(group: DiceGroup): { least: number; chances: number[] }  // one die worked through its rules
rulesText(group: DiceGroup): string                 // a kind's modifiers as notation writes them
meets(compare: Compare, value: number): boolean
```

### Custom dice, loaded dice and sets

```ts
type CustomFace = { label: string; value?: number; colour?: string };
// on a DiceGroup: faces?: CustomFace[] for a custom die, weights?: number[] for a loaded one

isFair(spec): boolean                    // plain fair dice and nothing else
isLoaded(spec): boolean                  // a loaded die is in the roll
hasTotal(spec): boolean                  // false for a roll of words only
dieName(group): string                   // "d6", "d6{6:3}", "d[Yes,No,Maybe]"
chancesOf(group): number[]               // the chance of each face
faceChances(group): { face, label, chance, fair }[]
loadingOf(group): { face, loaded: [a, b], fair: [c, d] } | null   // "6 comes up 3 in 8, not 1 in 6"
LOADED_PRESETS                           // the three house dice

fairnessTest(counts: number[], chances?: number[]): Fairness   // { rolls, minimum, enough, statistic, p, verdict, … }
readResults(text: string, sides?: number)                     // results typed from a real die, as counts

makeSet(name, dice): DiceSet | null      // { name, notation }
loadSets(storage, key) / storeSets(storage, key, sets)
withSet(sets, set) / withoutSet(sets, name)
setQuery(set): string / readSet(query): DiceSet | null
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
distributionHolding(spec, faces, held): Distribution  // the odds with some dice held
exactCounts(spec): { min: number; counts: bigint[]; outcomes: bigint } | null
// Each of these takes a spec, or a distribution already in hand:
chanceExactly(spec, total): number
chanceAtLeast(spec, target): number
chanceAtMost(spec, target): number
expectedTotal(spec): number
spreadOf(spec): number                    // standard deviation
mostLikely(spec): number[]
luckOf(spec, total): number               // 0 = worst possible, 0.5 = typical, 1 = best
chanceAnyAtLeast(spec, target, times): number  // at least one of several rolls reaches the target
expectedHighest(spec, times): number           // the best of several rolls, on average
```

### Games

```ts
PRESETS: readonly Preset[]                // every game; `presets` is the same list
getPreset(name): Preset | undefined       // by id, name, Japanese name or any other name
findPresets(search): Preset[]             // what the tray's search finds
presetSpec(preset): RollSpec              // its dice
rollPreset(name, { source?, at?, before?, language? }): PresetRoll  // throws RangeError for an unknown name
readPreset(preset, roll, before?, language?): PresetReading         // { outcome, values, tone, text }
presetOdds(preset, spec?, language?): OutcomeOdds[] | null          // { outcome, text, ways, outOf, chance }
readDiceAs(reading, roll, before?, options?): Outcome               // a reading without a game
patternsOf(spec): { dice, ways }[] | null // every way the dice can fall, counted
yahtzeeWithin(rolls): [bigint, bigint]    // a Yahtzee within so many rolls, as a fraction
crapsPass(): [bigint, bigint]             // 244 in 495
chinchirorinHandWithin(throws): [bigint, bigint]
waysToShut(total): number[][]             // the tiles a total may shut, in Shut the box
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
shareQueryMany(rolls): string             // several rolls of one run in one link
readSharedMany(query): Roll[] | null
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
| `hold` | `true` | `false` stops dice being held: a tap anywhere on the felt rolls, a die included |
| `placeholder` | `true` | `false` makes the opening dice the user's own roll, so the first die tapped adds to them |
| `languageChooser` | `false` | `true` adds a small choice of English or 日本語 to the tray, remembered on the device |

```ts
type RollerHandle = {
  roll(): void;                         // throw the dice showing
  history(): readonly Roll[];
  setSpec(spec: Partial<RollSpec>): void;  // part of the dice, or a whole spec
  setLocale(locale: string): void;         // "ja…" for Japanese, anything else English
  destroy(): void;
};
```

`setSpec` changes part of the dice (`{ sides: 20 }`) or, given a whole spec
such as `parseNotation("4d6dl1")`, all of them.

### How the tray works

One idea runs it: **the roll is a pool of dice.**

1. **Tap a die to add it.** The tray opens showing `2d6`, as a suggestion:
   its chip is dashed and the row reads *Choose a die*. The first die you tap
   takes its place, so one tap on d20 is `1d20`. After that every tap adds:
   d20, d4, d4 is `1d20+2d4`. (A tap on d6 while `2d6` is showing is simply a
   third d6.)
2. **A chip takes one away.** The row marked *Rolling* has a chip for each
   kind of dice (`2d6 −`). Tap it and there is one die fewer; the last die
   takes the kind with it. *Clear* empties the roll, bonus and all.
3. **The numbers set how many** of the kind you touched last, so three d8 is
   *d8*, *3*.
4. **Tap the felt to roll.** Space does the same from a keyboard.
5. **Tap a die on the felt to hold it**, once it has been rolled. The next
   tap on the felt rolls the others. *Release all* lets every die go. Only
   plain dice can be held; with `hold: false`, none can.

**When the opening dice stop being a suggestion.** As soon as you build
anything: a die tapped, a chip, a number, notation typed, a spec set from
code, or a roll opened from a shared link. Rolling them does not, nor does the
bonus or the keep row: open the tray, roll `2d6` twice, tap d20, and you have
`1d20`. A page that mounts the tray with its own `spec` gets the same
treatment; `placeholder: false` makes those dice the user's own from the
start, so the first tap adds to them.

At ten dice or four kinds the buttons that would go past the limit dim, and
the row's label says why. The notation box says the same roll in writing as
you tap, and takes anything the buttons do not reach; it says which part it
refuses. On the felt a dropped or rerolled die is struck through, an exploded
die is ringed and marked `!`, and a held die is lifted, ringed in gold and
tagged.

Since 1.4.0 a tap on a die that has been rolled holds it, where before it
rolled again like the rest of the felt. A page that wants the old behaviour
passes `hold: false`.

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

## Browser support

Any browser from the last few years: it needs ES2020 with `BigInt`,
`crypto.getRandomValues` and CSS `color-mix` (Chrome and Edge 111, Firefox
113, Safari 16.2). The sound needs the Web Audio API and AAC decoding, which
those browsers have; without them the tray is silent or plays its own knock.
It is tested in Chromium and in WebKit, Safari's engine, at phone size with
touch. The core also runs in Node 20 and later, Deno and Bun.

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

- More notation: arithmetic and brackets, grouped rolls, and dice that must
  all differ ([Notation compared](./docs/notation-compared.md) keeps the list)
- Export of a history as CSV, JSON and plain text, and import of the JSON
- A command-line tool for Linux, macOS and Windows
- A web component and a Vue wrapper, and a documentation site
- More games: [suggest one](https://github.com/johnmorrisdotca/korokoro/issues/new?template=suggest-a-game.md)
- BCDice's notation, which Japanese tables use, as a candidate
- Ports to other languages are welcome; a conformance suite is planned so
  that a port can be checked against this one
- A hosted HTTP API: not planned, because it needs a server. The command line
  and the package will cover programs.
- Exploding dice that are kept or dropped, once a table's rule is chosen

Left out on purpose: shared live rooms, which need a server, dice skins for
sale, and 3D dice. Korokoro runs from a static page and costs nothing to host.

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

See [CHANGELOG.md](./CHANGELOG.md), and [docs/migrating.md](./docs/migrating.md)
for the one change so far that needs a second look: what `r` means.

## Licence

[MIT](./LICENSE) © John Morris. The dice recordings are CC0; see
[SOUNDS.md](./SOUNDS.md).
