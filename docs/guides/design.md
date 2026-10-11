---
title: Design and entry points
section: explanation
order: 1
description: Understand the pure engine, optional browser layer and language or storage boundaries.
---

## Engine and interface

The main entry exposes roll specs, notation, exact odds, statistics and portable records. These functions can be called without a DOM. Browser mounts use that same engine; animation shows an already chosen result and does not choose the faces. Framework wrappers mount the native DOM interface rather than implementing another roller.

Use [the element entry](entry:element) when the host wants custom tags, [React](entry:react) or [Vue](entry:vue) for their wrappers, and [recorded sounds](entry:sounds) only when that data is needed. Bundle sizes on the entry pages are measured locally with everything each entry imports.

## Language and persistence

The UI has English and Japanese words. Locale or explicit strings select the native wording; pure record fields stay stable across languages. The [word list](../strings-ja.md) preserves the keys and both texts. The new Japanese guides need review before release.

History and named sets are local to storage supplied by the host. Storage readers validate records, and storage refusal is returned as a result. Frames opt out of storage. [Architecture](../../README.md#architecture), [other-language examples](../other-languages.md) and the [conformance data](../../conformance/korokoro-conformance.json) describe the implementation and ports without hiding detail from the README.
