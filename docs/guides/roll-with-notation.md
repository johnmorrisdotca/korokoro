---
title: Roll with notation
section: how-to
order: 1
description: Validate a roll, combine dice, keep selected faces and use a game preset.
---

## Validate before rolling

Use [checkNotation](api:checkNotation) when you need the reason for a refusal; [parseNotation](api:parseNotation) returns a spec or null.

```ts
import { checkNotation, roll, seededSource } from "@johnmorrisdotca/korokoro";
const checked = checkNotation("2d20kh1+5");
if (checked.ok) console.log(roll(checked.spec, seededSource("advantage"), 0).total);
else console.log(checked.problem, checked.message);
```

`kh` keeps the highest and `kl` the lowest. A mixed roll such as `1d20+1d4+3` retains its groups. `ro<3` rerolls once; `r<3` rerolls until clear, within the documented cap. Explosions, successes, custom faces and arithmetic have their own rules. The [notation reference](../notation.md) and [specification](../spec/notation.md) preserve the full details.

## Keep a die between rolls

```ts
import { normalizeSpec, rollFrom, rollHeld, seededSource } from "@johnmorrisdotca/korokoro";
const first = rollFrom(normalizeSpec({ count: 2, sides: 6 }), [6, 3], "first", 0, null)!;
const next = rollHeld(first, [true, false], seededSource("again"), 1);
console.log(next.faces);
```

The held mask is in physical-die order. Ask [canHold](api:canHold) before offering holding for rules that do not support it.

## Use a game's reading

```ts
import { getPreset, rollPreset, seededSource } from "@johnmorrisdotca/korokoro";
console.log(getPreset("Yacht")?.notation);
const turn = rollPreset("yahtzee", { source: seededSource("game-night"), at: 0 });
console.log(turn.reading.text);
```

A preset knows the dice and how to read a throw; it is not a full turn manager or score sheet. [The game gallery](../games.md) gives the rules and sources. Dice War has its own state engine, starting with [startDiceWar](api:startDiceWar).

For a native browser interface, continue with [Embed a tray](embed-a-tray.md).
