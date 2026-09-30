# Loaded dice, and how to catch one

Every die Korokoro rolls from its buttons is fair. This page is about the
other kind. People have been improving their dice for about as long as there
have been dice to improve: a little weight on one side, a little shaved off
another, or a die simply numbered with the faces its owner preferred. Korokoro
can do all of it, and then does the one thing no sharper ever did, which is
tell everybody. It is, as far as we know, the world's most conscientious cheat.

So this page has two halves. The first loads a die. The second catches one.

## A short and disreputable history

**The London set.** London Museum keeps a set of 24 false dice of the late
fifteenth century, made of bone and found on the Thames foreshore in a pewter
pot. Three of them carry only the numbers one to three, twice over, and three
only four to six: these were known as low and high "despatchers". X-rays show
the rest were weighted with drops of mercury. The museum adds that loaded dice
were called "fulhams", presumably after the Thames-side village of Fulham and
the company it kept. Somebody owned all 24, and somebody, one assumes in a
hurry, let the river have them. [1]

**Dice that were never square.** A study of 110 dated dice from the
Netherlands found those made before about 650 CE highly variable in shape and
in how their faces were numbered, and those made between 1100 and 1450 highly
standardised. For much of history, in other words, an honest die and a crooked
one were not as far apart as either party would have liked. [2]

**The man who rolled 315,672 dice.** In 1894 the biologist Walter Weldon threw
twelve dice 26,306 times and counted the fives and sixes. They came up very
slightly too often: about 0.3377 of the time, where a fair die promises a
third. Karl Pearson used the figures in the paper of 1900 that introduced the
chi-square test, the same test this page uses below. [3]

Our thanks to Weldon, and to anybody else who has ever rolled a die six
hundred times to settle an argument. The argument was probably not worth it.
The data were.

## Loading a die

A loaded die is a numbered die with some faces weighted. Name the face and its
weight in braces; every face you leave out weighs 1.

| Notation | The die |
| --- | --- |
| `d6{6:3}` | a d6 whose 6 weighs three times the rest: it shows three times in eight |
| `d6{1:2,6:2}` | a d6 whose 1 and 6 each come up twice as often as the others |
| `2d6{2:0,4:0,6:0}` | two d6 whose even faces never come up at all |
| `2d20{20:2}kh1` | advantage, on a pair of d20 that like their 20 |

Weights are whole numbers from 0 to 99, on dice of up to 100 sides. At least
two faces have to be able to come up. A die whose weights are all the same is
a fair die, and the notation refuses to call it loaded: `d6{6:1}` is an error,
not a d6 with a guilty conscience.

```ts
import { isFair, parseNotation, roll, seededSource } from "@johnmorrisdotca/korokoro";

const optimist = parseNotation("d6{6:3}")!;
optimist.weights;                                  // [1, 1, 1, 1, 1, 3]
isFair(optimist);                                  // false
const thrown = roll(optimist, seededSource("table-7"));
thrown.faces;                                      // [2]: even an optimist has off days
thrown.loaded;                                     // true
```

The generator does not change. A loaded die draws one fair number from the
same stream a fair die would, and the weights decide which face that number
lands on. So a seeded loaded roll replays exactly, which makes it the first
loaded die in history that can be audited.

## The three house dice

They live in the tray under *Custom dice, loaded dice and sets*, one level
down from the honest ones, and in the package as `LOADED_PRESETS`.

- **The Optimist**, `1d6{6:3}`. A die weighted towards its six, which it shows
  three times in eight. It believes in you more than the odds do.
- **The Six-Ace Flat**, `1d6{1:2,6:2}`. Shaved a little thin between the 1 and
  the 6, so those two faces land twice as often as the rest. The oldest job a
  file ever did.
- **The Odd Couple**, `2d6{2:0,4:0,6:0}`. Two dice with no even faces. Between
  them they have never made a seven, and they are not going to start now.

```ts
import { chanceExactly, distributionOf, parseNotation } from "@johnmorrisdotca/korokoro";

const couple = parseNotation("2d6{2:0,4:0,6:0}")!;
chanceExactly(couple, 7);        // 0
distributionOf(couple).min;      // 2
distributionOf(couple).max;      // 10
```

## It always says so

This is the rule the rest hangs on: **a loaded die can never pass as a fair
one.** The loading is part of the die's name, so it cannot be left off.

- **On the felt**, a loaded die wears a small red weight on its corner.
- **Beside the total**, a badge reads *Loaded dice*.
- **In the history**, the row says *loaded* and the notation carries its braces.
- **In a link**, the notation is `roll=1d6%7B6%3A3%7D`, braces and all. Open
  it and the mark is there. No link to a loaded roll reads as a fair one.
- **In the data**, the roll carries `loaded: true` and its spec carries the
  weights. A history that has had the flag edited out gets it back on the way
  in, because it is worked out from the dice and never trusted as stored.
- **In code**, `isFair(spec)` is false for anything loaded, and for a custom
  die too. A site that wants only honest standard dice refuses the rest in one
  call.

The buttons on the tray always roll fair dice. There is no setting that loads
them, and no option that hides the mark.

## Two sets of odds

A loaded die's weights are whole numbers, so its odds are exact fractions, and
Korokoro gives them the same way it gives a fair die's.

```ts
import { exactCounts, expectedTotal, faceChances, loadingOf, parseNotation } from "@johnmorrisdotca/korokoro";

const optimist = parseNotation("d6{6:3}")!;
expectedTotal(optimist);                         // 4.125, where a fair d6 averages 3.5
loadingOf(optimist);                             // { face: 6, loaded: [3, 8], fair: [1, 6] }
faceChances(optimist)[5];                        // { face: 6, label: "6", chance: 0.375, fair: 0.1666… }
exactCounts(parseNotation("2d6{6:3}")!);         // 64 outcomes, 9 of them a twelve
```

In the tray's Odds tab the bars are the die as loaded, a mark across each bar
shows the same die if it were fair, and a line says it plainly: *6 comes up 3
in 8, not 1 in 6.*

## Is this die loaded?

Now the other side of the table. Given how often each face came up,
`fairnessTest` asks how surprised a fair die would be: a chi-square
goodness-of-fit test, worked out exactly and not read off a table.

```ts
import { fairnessTest } from "@johnmorrisdotca/korokoro";

fairnessTest([82, 95, 103, 98, 104, 118]);
// 600 rolls · statistic 7.02 · p 0.219 · verdict "fair"

fairnessTest([58, 28, 41, 36, 47, 30]);
// 240 rolls · statistic 15.85 · p 0.0073 · verdict "unusual"

fairnessTest([30, 30, 30, 30, 30, 90]);
// 240 rolls · statistic 75 · p 0.0000000000000093 · verdict "lopsided"
```

- **`fair`** means the counts are the sort a fair die produces: `p` is 5% or
  more.
- **`unusual`** means a fair die would stray this far less than one time in
  twenty. One time in twenty still happens, roughly once every twenty times.
- **`lopsided`** means less than one time in a thousand. This die has some
  explaining to do.
- **`too-few`** means the test declines to say. It wants at least five throws
  expected of every face, so 30 rolls for a d6 and 100 for a d20, and until
  then `p` is `null`. It will not pronounce on a handful: five rolls with two
  sixes is an evening, not evidence.

`p` is the chance that a fair die would give counts at least this lopsided. It
is not the chance that the die is fair. A die can pass and still be crooked in
a way these counts did not happen to show; all a test can do is fail to find
anything.

### Testing a real die

The genuinely useful case is a die you can pick up. Roll it, write down what
it shows, and paste the results into **Stats → Test a real die** in the tray,
or into `readResults`:

```ts
import { fairnessTest, readResults } from "@johnmorrisdotca/korokoro";

const typed = readResults("3 5 6 6 1");   // spaces, commas or new lines
typed.ok && typed.counts;                 // [1, 0, 1, 0, 1, 2]
typed.ok && fairnessTest(typed.counts).verdict;   // "too-few": 5 of the 30 it wants
```

It makes no roll and sends nothing anywhere. The arithmetic happens on your
device.

### Catching our own

Roll the Optimist 240 times and ask:

```ts
import { fairnessTest, parseNotation, roll, seededSource } from "@johnmorrisdotca/korokoro";

const source = seededSource("suspect");
const counts = [0, 0, 0, 0, 0, 0];
for (let i = 0; i < 240; i++) counts[roll(parseNotation("d6{6:3}")!, source).total - 1] += 1;
counts;                          // [31, 21, 34, 21, 34, 99]
fairnessTest(counts).verdict;    // "lopsided"
```

Ninety-nine sixes in 240. The test is not fooled, and neither is anybody
reading the history, since every one of those rolls said *loaded* on it.

## And Korokoro's own dice?

They are fair, and you need not take that on trust.

- **Read how a face is chosen.** `randomInt` in `src/random.ts` takes numbers
  from the browser's cryptographic generator and throws away any that would
  favour one face over another, which is the step a careless `% 6` leaves out.
- **Check a roll.** A seeded roll can be thrown again by anybody and comes
  out the same, die for die. See *Checking a seeded roll* in the README.
- **Test the dice.** Roll a fair d6 a few hundred times and open the Stats
  tab, or do it in code. From the seed `honest`, 240 rolls give
  `[33, 44, 44, 39, 42, 38]`, and the verdict is `fair`.

If you ever catch the fair dice out, that is a bug, and we would like to hear
about it more than almost anything.

## Sources

1. London Museum, "False die", object 41603: a set of 24 false dice, bone,
   late fifteenth century, found on the Thames foreshore.
   <https://www.londonmuseum.org.uk/collections/v/object-41603/false-die-die/>
2. Jelmer W. Eerkens and Alex de Voogt, "The Evolution of Cubic Dice: From
   the Roman Through Post-Medieval Period in the Netherlands", *Acta
   Archaeologica* 88 (2017).
   <https://onlinelibrary.wiley.com/doi/abs/10.1111/j.1600-0390.2017.12182.x>
3. Zacariah Labby, "Weldon's Dice, Automated", *Chance* 22, no. 4 (2009), for
   Weldon's 26,306 throws of twelve dice in 1894 and their use in Karl
   Pearson's paper of 1900.
   <https://www.tandfonline.com/doi/abs/10.1080/09332480.2009.10722977>
