---
title: How the dice and odds work
section: explanation
order: 2
description: Read the seeded generator specification and the rules behind reproducible exact calculations.
---

## From a source to a face

A random source supplies unsigned 32-bit integers. `randomInt` uses rejection sampling, so reducing a number to a face does not bias low faces when the range does not divide 2³². Seed text is hashed to initialize sfc32, then the documented warm-up advances it. [The full generator specification](../spec/random.md) retains the exact arithmetic and conformance requirements.

## From faces to a result

The spec says which faces reroll or explode, which dice are kept, whether successes are counted and how groups are combined. Reconstruction uses the same rules as a new throw; a serialized total is not an authority. [Roll records](../rolls.md) and [the notation specification](../spec/notation.md) keep the detailed field and grammar contracts.

## From a spec to odds

Plain sums combine independent outcome distributions. Kept dice, weighted faces, finite rerolls and arithmetic use the native cases documented in the engine. The caps make rolls terminate and keep the exact model aligned with actual throws. A held face is fixed rather than sampled again. A fairness test needs enough expected observations before its statistic can be interpreted; it is not a promise based on a few throws. See [loaded dice](../loaded-dice.md) and the reference for [fairnessTest](api:fairnessTest).
