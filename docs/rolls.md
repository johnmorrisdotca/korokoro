# Rolls

What a roll returns, many rolls at once, holding dice, and seeds. Back to the [README](../README.md#what-a-roll-returns).

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
