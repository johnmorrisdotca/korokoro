# Odds

The exact odds: chances, averages and luck, for any roll. Back to the [README](../README.md#odds).

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
