---
title: Keep and share rolls
section: how-to
order: 3
description: Use reproducible sources, round-trip a shared roll and save portable history.
---

## Reproduce a throw

```ts
import { normalizeSpec, roll, seededSource } from "@johnmorrisdotca/korokoro";
const spec = normalizeSpec({ count: 2, sides: 6 });
const first = roll(spec, seededSource("club-night"), 1700000000000);
const repeat = roll(spec, seededSource("club-night"), 1700000000000);
console.log(first.faces.join() === repeat.faces.join());
```

A source advances each time it is used. Recreate the source for the first throw again, or keep one source to produce a sequence. The seed is for reproducibility; the default cryptographic source is for an unguessable throw.

## Round-trip a link and JSON

```ts
import { normalizeSpec, roll, seededSource, shareQuery, readShared, toJSON, fromJSON } from "@johnmorrisdotca/korokoro";
const result = roll(normalizeSpec({ count: 2, sides: 6 }), seededSource("club-night"), 0);
console.log(readShared(shareQuery(result))?.total);
console.log(fromJSON(toJSON([result]))?.length);
```

The readers reconstruct totals from validated dice and faces. Invalid or newer formats may return null; a host should handle that rather than trusting an external total. [The history API](api:addToHistory) keeps newest rolls first, with a bounded list, and storage functions report refusal without throwing. [CLI and export details](../command-line.md) cover CSV and plain text; [other-language examples](../other-languages.md) use the same records.
