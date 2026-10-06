# Dice notation

The notation: everything a roll can be written as, the grammar, the formulas, the order the modifiers apply in, and what is refused. Back to the [README](../README.md#dice-notation).

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
| `4d6u` | four d6 that all show different faces |
| `(2d6+3)*2`, `2d6x2` | arithmetic: `+ - * /` and brackets; `x` multiplies too |
| `1d20-1d4` | dice taken away |
| `floor(4d6/2)`, `ceil(4d6/2)`, `round(4d6/2)` | a division, rounded down, up, or to the nearest (a half goes up) |
| `abs(1d6-1d6)`, `max(1d6,1d8)`, `min(1d6,1d8,4)` | how far apart; the higher; the lowest |
| `{4d6,3d8}kh1`, `{4d6,3d8}kl1` | a group: the higher, or the lower, of its rolls |
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
roll     = [times "#"] ( dice { "+" dice } [bonus] | formula ) [ "#" label ]
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
         | "u"                                         the dice all differ
bonus    = "+" or "-", then 0 to 99
label    = up to 40 characters; "[label]" in front of the roll is read too
formula  = term { ( "+" | "-" ) term }
term     = factor { ( "*" | "x" | "/" ) factor }
factor   = dice | number | "-" factor | "(" formula ")"
         | ( "floor" | "ceil" | "round" | "abs" ) "(" formula ")"
         | ( "max" | "min" ) "(" formula "," formula { "," formula } ")"
         | "{" formula "," formula { "," formula } "}" ( "kh1" | "kl1" )
number   = a whole number up to 9999
```

Letters in either case, spaces allowed between the parts. A roll holds up to
four kinds of dice, each with its own modifiers, and the bonus comes last.
Two kinds that are the same dice under the same rules are one kind: `2d6+3d6`
is `5d6`.

### Formulas

Anything past adding is a formula: `(2d6+3)*2`, `1d20-1d4`, `floor(4d6/2)`,
`max(1d20,1d20)+5`. The dice are thrown exactly as they would be without it,
each kind in the order written with its own modifiers; the formula is only how
their totals are put together.

```ts
const half = roll(parseNotation("floor(4d6/2)")!, seededSource("table-7"));
half.faces;                       // [6, 4, 2, 1]
half.total;                       // 6: thirteen, halved, rounded down
rangeOf(half.spec);               // { min: 2, max: 12 }
expectedTotal(half.spec);         // 6.75
chanceAtLeast(half.spec, 8);      // 0.3356
```

- **The odds are exact**, as everywhere else. Each kind of dice is named once,
  so the kinds stay independent, and the arithmetic is done in whole-number
  fractions, never in floating point.
- **A roll comes to a whole number.** A division has to be rounded: `4d6/2` is
  refused, and the refusal says to write `floor(4d6/2)`, `ceil(…)` or
  `round(…)`. `round` sends a half up.
- **A formula that only adds is a plain roll**, written the one way:
  `(2d6+3)` and `3+2d6` are `2d6+3`.
- **A group keeps one of its rolls**: `{4d6,3d8}kh1` is `max(4d6,3d8)`, and is
  written back so.
- In the tray a formula is typed, and changed where it was typed: the dice
  buttons start a new roll, and cannot take a die out of the middle of one.

### Dice that all differ

`4d6u` is four d6 showing four different faces. Each die is thrown from the
faces not yet showing, which comes to the same odds as rerolling any duplicate
until there is none, and never needs a second throw. Fair dice of up to 100
sides, no more of them than the die has faces. `6d6u` is always 21.

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
[Migrating](migrating.md).)

Two things differ from some other rollers, and
[Notation compared](notation-compared.md) sets them side by side: a
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
| `11d6`, `0d6` | one to ten dice at a time (code may ask for more: see [Limits](../README.md#limits)) |
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
| `4d6/2`, `max(1d6/2,3)` | a division has to be rounded, so that the roll comes to a whole number |
| `6/(1d4-1)` | a formula must not be able to divide by nothing |
| `(2d6`, `floor(2d6,2)`, `{4d6,3d8}kh2`, `2d6*10000` | brackets match, a function takes what it takes, a group keeps one of its rolls, and numbers stop at 9999 |
| `1d1000*1d1000*1d1000` | a formula's totals must not spread too wide to count |
| `7d6u`, `4d6uo`, `3d6!u` | dice that all differ: no more dice than faces, no rule that throws a die again, and `uo` (reroll a duplicate once) is not read |
| `2d6 # 3`, `2d6 # one # two` | a label is up to 40 characters, not only digits, and has no `#`, brackets or braces (for a repeat, write `3#2d6`) |
| `0#2d6`, `101#2d6` | a roll is thrown 1 to 100 times |
| `1d4+1d6+1d8+1d10+1d12` | a roll has at most four kinds of dice |
| `6d6+5d8` | ten dice at most over the whole roll |
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
