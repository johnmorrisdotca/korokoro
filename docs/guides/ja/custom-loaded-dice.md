---
title: 独自のダイスと重み
section: how-to
order: 4
description: 文字や数値を付けた面と、重み付きのダイスを作ります。
---

## 出目に文字を付ける

```ts
import { parseNotation, roll, seededSource, hasTotal } from "@johnmorrisdotca/korokoro";
const spec = parseNotation("2d[Hit=1,Miss=0,Miss=0]")!;
console.log(hasTotal(spec));
console.log(roll(spec, seededSource("custom"), 0).total);
```

同じ面を複数入れると、その面が出やすくなります。面には文字、数値、色を指定できます。文字はテキストとして表示します。記録には面の位置が入るので、同じ出目を再構成できます。

## 番号付きダイスに重みを付ける

```ts
import { parseNotation, loadingOf, isFair, faceChances } from "@johnmorrisdotca/korokoro";
const loaded = parseNotation("1d6{6:3}")!;
console.log(isFair(loaded), loadingOf(loaded));
console.log(faceChances(loaded).map((face) => face.chance));
```

このd6では6の重みが3、ほかの面が1です。重みがすべて同じ場合は、公平なダイスとして正規化します。[重み付きダイスの資料](../../loaded-dice.md)に、出目から調べる方法と必要な件数があります。[独自のダイスの資料](../../custom-dice.md)には、文字数、数値、面の数の上限があります。
