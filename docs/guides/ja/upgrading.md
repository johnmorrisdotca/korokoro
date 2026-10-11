---
title: 更新と移行
section: upgrading
order: 1
description: 1.xの互換性、1.4の振り直しの変更、別のライブラリからの移行を説明します。
---

## メジャーバージョン1の中で更新する

現在のエンジンはバージョン1です。設定、共有した記録、ストレージの読み込みは、説明されている互換性を保ちます。このドキュメントの変更は、ガイドとリファレンスの構成、検証した例の追加です。乱数の手順や公開関数の引数は変わりません。[変更履歴](../../../CHANGELOG.md)に各リリースの内容があります。

## 1.4の振り直しの変更

`r<3`は条件を満たさなくなるまで、`ro<3`は1回だけ振り直します。古い設定の`reroll`は従来の意味のままです。`v`がない古いリンクも以前の読み方を保ち、新しいリンクはバージョン2を指定します。古い文字列の移行では`ro`に変更するか、`legacyReroll: true`を使います。

```ts
import { parseNotation, formatNotation } from "@johnmorrisdotca/korokoro";
const legacy = parseNotation("2d8r<3", { legacyReroll: true });
if (legacy) console.log(formatNotation(legacy));
```

[移行の資料](../../migrating.md)に、トレイでダイスを追加する動作など、以前の変更も残っています。

## 別のダイスライブラリから移行する

表記をテキストとして受け取り、設定として使う前に確認します。`RollSpec`はKorokoro独自の形です。別のライブラリの構文木をそのまま渡せません。振り直しや追加の上限、残す出目、文字、独自の面、式の丸め方を確認します。[表記の比較](../../notation-compared.md)に違いがあります。
