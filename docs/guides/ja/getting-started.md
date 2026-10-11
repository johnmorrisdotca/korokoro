---
title: 使い始める
section: tutorial
order: 1
description: インストールし、表記を読み取り、同じロールを再現して確率を調べます。
---

Korokoroには、ダイスと確率を扱う関数と、ブラウザに表示するトレイがあります。このページでは関数から始めます。ページのレイアウトを用意しなくても、Nodeやブラウザで試せます。

## インストール

```sh
npm install @johnmorrisdotca/korokoro
```

実行時の依存パッケージはありません。TypeScriptの型定義が含まれます。例をTypeScriptのファイルとして保存し、Node 22以降で実行するか、ブラウザのプロジェクトから読み込みます。

## 表記を読み取って振る

```ts
import { parseNotation, roll, seededSource } from "@johnmorrisdotca/korokoro";
const spec = parseNotation("2d6+3");
if (spec === null) throw new Error("ダイス表記を読み取れません");
const result = roll(spec, seededSource("first-table"), 0);
console.log(result.faces, result.total);
```

結果には、設定、出目、合計に数えるダイス、合計、日時、シードが含まれます。通常は端末の暗号論的乱数を使います。ここではシードで結果を再現し、日時にも0を指定しています。

## 確率を調べる

```ts
import { parseNotation, distributionOf, expectedTotal } from "@johnmorrisdotca/korokoro";
const spec = parseNotation("2d6")!;
const odds = distributionOf(spec);
console.log(odds.min, odds.max, expectedTotal(spec));
```

画面に表示するには[トレイの埋め込み](embed-a-tray.md)、表記の確認には[ダイス表記で振る](roll-with-notation.md)に進みます。[メインのエントリ](entry:main)に関数の一覧があります。
