---
title: Troubleshooting and FAQ
section: troubleshooting
order: 1
description: Handle invalid notation, unsupported exact counts, storage refusal and browser setup.
---

## Notation returns null

`parseNotation` returns null when the text cannot describe supported dice. Use `checkNotation` for a problem and message. The tray stays within ten dice; code can opt into larger plain pools up to one hundred with `maxDice`. Counts, sides, groups, labels, rerolls and formulas still have their own limits. [The limits section](../../README.md#limits) and [notation details](../notation.md) give the complete list.

## Exact counts return null

That means the BigInt counting representation is unavailable for the requested rule combination or span. It does not mean the chance is zero. Use the valid spec's distribution API where supported, or revise the rules. [Exact odds](exact-odds.md) shows both forms.

## A saved link, set or file is refused

`readShared`, `readSharedMany`, `readSet`, `makeSet` and `fromJSON` return null for invalid or unavailable data. `getPreset` returns undefined when a name is unknown. History/set parsers can drop invalid records. Keep a visible fallback rather than treating a refusal as a valid zero total.

## Storage or audio is unavailable

Storage writes return false when the host refuses them; reads fall back to an empty list. A frame uses no storage. The native sound layer is silent when audio is unavailable or blocked, and loads recordings only when sound is used. A silent tray still rolls normally.

## The tag or framework component does not appear

Import the definition entry for automatic tag registration, or call a definition helper once. Wait until a real DOM host exists before mounting. Browser-dependent examples are marked `no-run`, while the engine imports safely on a server. [Embed a tray](embed-a-tray.md) and [the browser support section](../../README.md#browser-support) show supported setup.
