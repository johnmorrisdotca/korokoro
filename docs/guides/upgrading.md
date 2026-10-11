---
title: Upgrading
section: upgrading
order: 1
description: Keep 1.x notation and stored rolls compatible, including the reroll change and library migration.
---

## Within major version 1

The current public engine is version 1. Existing specs, shared records and storage readers retain their documented compatibility. This documentation rollout changes the guide/reference layout and adds validated examples; it does not change the dice algorithm or public call signatures. The [changelog](../../CHANGELOG.md) records each release.

## The 1.4 reroll change

Text `r<3` now rerolls until clear; `ro<3` rerolls once. Older saved specs keep their `reroll` meaning. Old shared links with no `v` keep the older interpretation, while newer links carry version 2. If an application has old notation strings, change reroll-once text to `ro`, or parse with `legacyReroll: true` while migrating.

```ts
import { parseNotation, formatNotation } from "@johnmorrisdotca/korokoro";
const legacy = parseNotation("2d8r<3", { legacyReroll: true });
if (legacy) console.log(formatNotation(legacy));
```

The [full migration history](../migrating.md) keeps the details of the tray's add-die behavior and other earlier changes.

## Coming from another dice library

Keep notation as text at the boundary and validate it before using a spec. `RollSpec` is Korokoro's structure; another library's AST is not interchangeable. Check reroll/explosion caps, keep/drop spelling, labels, custom faces and formula rounding. [Notation compared](../notation-compared.md) lists the differences rather than claiming identical behavior.
