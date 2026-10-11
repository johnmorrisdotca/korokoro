---
title: Exact odds
section: how-to
order: 2
description: Read a distribution, threshold chances and exact integer outcome counts.
---

## A probability for a total

```ts
import { parseNotation, distributionOf, chanceAtLeast, expectedTotal } from "@johnmorrisdotca/korokoro";
const spec = parseNotation("2d6")!;
const odds = distributionOf(spec);
console.log(chanceAtLeast(odds, 10), expectedTotal(odds));
console.log(odds.probabilities[7 - odds.min]);
```

Probabilities are fractions between zero and one, indexed from `min`, not by the total itself. The distribution describes the dice actually thrown, including the package's finite reroll and explosion caps.

## Count ways without floating point

```ts
import { parseNotation, exactCounts } from "@johnmorrisdotca/korokoro";
const exact = exactCounts(parseNotation("2d6")!);
if (exact) console.log(exact.min, String(exact.outcomes), exact.counts.map(String));
```

[exactCounts](api:exactCounts) gives BigInt counts where that representation is supported, and null for unsupported rule combinations or spans. Do not stringify BigInt directly as JSON; convert it to text. [distributionOf](api:distributionOf) is the probability API for a normalized valid spec.

## Odds with a held die

```ts
import { parseNotation, distributionHolding } from "@johnmorrisdotca/korokoro";
const odds = distributionHolding(parseNotation("2d6")!, [6, 3], [true, false]);
console.log(odds.min, odds.max);
```

Only the unheld die is uncertain. For repeated independent rolls, see [chanceAnyAtLeast](api:chanceAnyAtLeast) and [expectedHighest](api:expectedHighest). [How it works](how-it-works.md) explains which independence assumptions the engine uses.
