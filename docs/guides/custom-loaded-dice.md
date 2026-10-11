---
title: Custom and loaded dice
section: how-to
order: 4
description: Give faces words and values, or weight a numbered die and inspect its fairness.
---

## Faces with words

```ts
import { parseNotation, roll, seededSource, hasTotal } from "@johnmorrisdotca/korokoro";
const spec = parseNotation("2d[Hit=1,Miss=0,Miss=0]")!;
console.log(hasTotal(spec));
console.log(roll(spec, seededSource("custom"), 0).total);
```

A repeated physical face appears more often. A face may have a label, a numeric value and a colour; labels remain text. The logged face is its physical index, so reconstruction still knows which face was thrown.

## Weight a numbered die

```ts
import { parseNotation, loadingOf, isFair, faceChances } from "@johnmorrisdotca/korokoro";
const loaded = parseNotation("1d6{6:3}")!;
console.log(isFair(loaded), loadingOf(loaded));
console.log(faceChances(loaded).map((face) => face.chance));
```

This d6 weights its six three times and each other face once. It is explicitly loaded; uniform weights normalize to a fair die. [Loaded-die details](../loaded-dice.md) explain detection from repeated results and the sample size needed before a fairness test says enough. [Custom-die details](../custom-dice.md) retain the limits for labels, values and physical faces.
