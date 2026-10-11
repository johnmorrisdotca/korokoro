---
title: ロールを保存・共有する
section: how-to
order: 3
description: シードで出目を再現し、リンクとJSONで記録を共有します。
---

## 同じロールを再現する

```ts
import { normalizeSpec, roll, seededSource } from "@johnmorrisdotca/korokoro";
const spec = normalizeSpec({ count: 2, sides: 6 });
const first = roll(spec, seededSource("club-night"), 1700000000000);
const repeat = roll(spec, seededSource("club-night"), 1700000000000);
console.log(first.faces.join() === repeat.faces.join());
```

乱数源は使うたびに進みます。最初の出目をもう一度得るには乱数源を作り直し、連続した出目には同じ乱数源を使い続けます。シードは再現用です。予測できない出目には、初期値の暗号論的乱数を使います。

## リンクとJSONで保存する

```ts
import { normalizeSpec, roll, seededSource, shareQuery, readShared, toJSON, fromJSON } from "@johnmorrisdotca/korokoro";
const result = roll(normalizeSpec({ count: 2, sides: 6 }), seededSource("club-night"), 0);
console.log(readShared(shareQuery(result))?.total);
console.log(fromJSON(toJSON([result]))?.length);
```

読み込み時には、設定と出目から合計を計算し直します。不正な内容や新しい形式ではnullになる場合があります。外部の合計をそのまま信用せず、結果を確認します。[履歴のAPI](api:addToHistory)では新しいロールを先頭に置き、件数を制限します。ストレージに保存できなかった場合も結果で分かります。[コマンドラインと保存形式](../../command-line.md)、[別の言語の例](../../other-languages.md)も参照できます。
