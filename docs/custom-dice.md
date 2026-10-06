# Dice of your own

Custom dice, loaded dice and the fairness test, and sets of dice. Back to the [README](../README.md#custom-dice).

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
[Loaded dice, and how to catch one](loaded-dice.md).

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
