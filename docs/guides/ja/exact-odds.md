---
title: 正確な確率
section: how-to
order: 2
description: 分布、合計の確率、整数の件数、ホールドした場合の確率を調べます。
---

## 合計の確率を調べる

```ts
import { parseNotation, distributionOf, chanceAtLeast, expectedTotal } from "@johnmorrisdotca/korokoro";
const spec = parseNotation("2d6")!;
const odds = distributionOf(spec);
console.log(chanceAtLeast(odds, 10), expectedTotal(odds));
console.log(odds.probabilities[7 - odds.min]);
```

確率は0から1の値です。配列の添字は合計そのものではなく、`min`からの差です。振り直しや追加のダイスにも、パッケージの上限を含めて計算します。

## 整数で数える

```ts
import { parseNotation, exactCounts } from "@johnmorrisdotca/korokoro";
const exact = exactCounts(parseNotation("2d6")!);
if (exact) console.log(exact.min, String(exact.outcomes), exact.counts.map(String));
```

[exactCounts](api:exactCounts)は、対応する規則ではBigIntの件数を返します。対応しない組み合わせや範囲ではnullです。BigIntをJSONにする場合は、文字列に変換します。正規化した設定の確率には[distributionOf](api:distributionOf)を使います。

## ホールドした出目を固定する

```ts
import { parseNotation, distributionHolding } from "@johnmorrisdotca/korokoro";
const odds = distributionHolding(parseNotation("2d6")!, [6, 3], [true, false]);
console.log(odds.min, odds.max);
```

ホールドしていないダイスだけが変わります。繰り返す場合は[chanceAnyAtLeast](api:chanceAnyAtLeast)や[expectedHighest](api:expectedHighest)を使います。[計算の仕組み](how-it-works.md)に前提を説明しています。
