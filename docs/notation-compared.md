# Notation compared

What dice notation Korokoro reads, set beside what other dice rollers write.
The list of modifiers and their order for
[RPG Dice Roller](https://dice-roller.github.io/documentation/guide/notation/modifiers.html)
(`@dice-roller/rpg-dice-roller`) was checked against its documentation on
2026-09-30; it is the fullest notation in JavaScript, so it is the yardstick.
A test reads this page: every notation in the *Korokoro* column of a row
marked **yes** is rolled, and every one in a row marked **not yet** is
refused, so the page cannot claim more than the package does.

Two things Korokoro adds to every row: **exact odds** for whatever it reads,
and a **refusal that names the part** for whatever it does not. Nothing is
quietly rolled as something else.

## Dice

| Feature | Korokoro | Status | Notes |
| --- | --- | --- | --- |
| A die of any size | `d14`, `2d3`, `d1000` | **yes** | 2 to 1000 sides |
| Percentile | `d%`, `1d100` | **yes** | |
| Fate or Fudge dice | `4dF` | **yes** | The standard die: two minus, two blank, two plus. RPG Dice Roller's `dF.1` variant is not read |
| Several kinds in one roll | `1d20+1d4+3` | **yes** | Up to four kinds, ten dice |
| Custom faces | `d[Yes,No,Maybe]`, `2d[Hit=1,Miss=0,Miss=0]` | **yes** | Korokoro's own |
| Loaded dice, marked as loaded | `d6{6:3}` | **yes** | Korokoro's own |
| The whole roll several times | `6#4d6dl1` | **yes** | Korokoro's own spelling |

## Modifiers

| Feature | Korokoro | Status | Notes |
| --- | --- | --- | --- |
| Keep highest or lowest | `4d6kh3`, `4d6k3`, `2d20kl1` | **yes** | `k` alone is `kh` |
| Drop lowest or highest | `4d6dl1`, `4d6d1`, `5d10dh2` | **yes** | `d` alone is `dl` |
| Best and worst | `4d6b3`, `2d20w1` | **yes** | Aliases for `kh` and `kl` |
| Explode | `3d6!` | **yes** | |
| Explode at a compare point | `3d6!>=5`, `3d6!=1`, `3d6!<>6` | **yes** | As in RPG Dice Roller, `!=` here is "explode on", and "not" is `<>` |
| Compounding | `3d6!!`, `3d6!!>=5` | **yes** | |
| Penetrating | `3d6!p`, `3d6!!p` | **yes** | |
| Reroll until clear | `2d6r`, `2d6r<3`, `2d6r=3`, `2d6r>=5` | **yes** | May match at most half the faces, and stops after 10 |
| Reroll once | `2d6ro`, `2d6ro<3`, `2d6ro=6`, `2d6ro<>3` | **yes** | |
| Minimum and maximum | `4d6min2`, `4d6max5` | **yes** | |
| Count successes | `6d10>=8`, `6d10>7`, `3d6=6`, `4d6<3` | **yes** | |
| Failures that take a success away | `6d10>=8f=1`, `6d10>=8f<3` | **yes** | |
| Critical success and failure marks | `1d20cs>=19`, `1d20cf<3`, `1d20cscf` | **yes** | Marks only, as elsewhere |
| Sort | `4d6s`, `4d6sa`, `4d6sd` | **yes** | The roll keeps the order thrown; the dice are shown sorted |
| A label for the roll | `2d6+3 # fire damage`, `[fire damage] 2d6+3` | **yes** | One label for the roll |
| Unique dice | `4d6u`, `4d6uo` | **not yet** | Planned |
| Exploding dice kept or dropped | `4d6!kh3` | **not yet** | Tables disagree on whether an explosion is a new die in the pool; to be chosen |
| Successes among the dice kept | `4d6kh3>=5` | **not yet** | |

## Arithmetic and groups

| Feature | Korokoro | Status | Notes |
| --- | --- | --- | --- |
| A bonus | `2d6+3`, `4d8-1` | **yes** | One whole number up to 99, added or taken away |
| Multiplying and dividing | `2d6*2`, `4d6/2` | **not yet** | Planned |
| Brackets | `(2d6+3)*2` | **not yet** | Planned |
| Dice taken away | `1d20-1d4` | **not yet** | Planned with arithmetic |
| Functions | `floor(2d6/3)`, `max(1d6,1d8)` | **not yet** | Planned |
| Grouped rolls | `{4d6,3d8}kh1` | **not yet** | Planned |
| More than ten dice | `11d6` | **not yet** | Ten in the tray for good; more from code is planned where the odds stay exact |

## The order modifiers are applied in

Both rollers apply modifiers in a fixed order, whatever order they are
written in. The orders differ in two places.

| Step | Korokoro | RPG Dice Roller |
| --- | --- | --- |
| 1 | Reroll | Min |
| 2 | Explode | Max |
| 3 | Min and max | Explode |
| 4 | Keep and drop | Reroll |
| 5 | Count successes and failures | Unique |
| 6 | Critical marks | Keep |
| 7 | Sort | Drop |
| 8 | | Successes and failures |
| 9 | | Critical success, then critical failure |
| 10 | | Sort |

- **Reroll before explode.** In Korokoro a die is rerolled first, and the face
  left standing is the one that may explode. It has done so since 1.2.0, and
  seeded rolls depend on it.
- **Min and max after the explosion.** In Korokoro a die explodes on the face
  it threw, and `min` and `max` then change what it counts for.

A roll that uses only one of these at a time comes out the same either way.

## Other notations

- **Roll20.** `r` rerolls until clear and `ro` once, as Roll20 has them. Its
  grouped rolls and inline labels on each die are with the arithmetic above:
  not yet.
- **BCDice**, which Japanese tables use, is a different notation with a
  command for each game system. It is a candidate for a later release, as a
  reader beside this one.
- **A notation missing here?** Open an issue with an example and what it
  should roll.
