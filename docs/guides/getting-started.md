---
title: Getting started
section: tutorial
order: 1
description: Install Korokoro, read notation, roll reproducibly and inspect the exact odds.
---

Korokoro has two parts: pure functions for dice and odds, and an optional browser tray. This tutorial uses the functions first, so it works in Node or a browser without a page layout.

## Install

```sh
npm install @johnmorrisdotca/korokoro
```

The package has no runtime dependencies and includes TypeScript declarations. Save a complete example as a TypeScript file and run it with Node 22 or later, or import it in your browser project.

## Read and roll

```ts
import { parseNotation, roll, seededSource } from "@johnmorrisdotca/korokoro";
const spec = parseNotation("2d6+3");
if (spec === null) throw new Error("The notation cannot be rolled");
const result = roll(spec, seededSource("first-table"), 0);
console.log(result.faces, result.total);
```

A roll records its spec, physical faces, which dice count, total, time and seed. Ordinary calls use the platform's cryptographic source; the seed above makes the tutorial repeatable. The time argument is epoch milliseconds, with zero used here so the example also has a fixed timestamp.

## Inspect the odds

```ts
import { parseNotation, distributionOf, expectedTotal } from "@johnmorrisdotca/korokoro";
const spec = parseNotation("2d6")!;
const odds = distributionOf(spec);
console.log(odds.min, odds.max, expectedTotal(spec));
```

For a browser interface, continue with [Embed a tray](embed-a-tray.md). For validation and more rules, use [Roll with notation](roll-with-notation.md). [The main entry](entry:main) lists every function.
