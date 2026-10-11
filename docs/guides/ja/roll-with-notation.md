---
title: ダイス表記で振る
section: how-to
order: 1
description: ダイス表記を検証し、ホールドとゲームの読み方を使います。
---

## 振る前に確認する

[checkNotation](api:checkNotation)では、読み取れない理由も分かります。[parseNotation](api:parseNotation)は設定を返し、読み取れない場合はnullを返します。

```ts
import { checkNotation, roll, seededSource } from "@johnmorrisdotca/korokoro";
const checked = checkNotation("2d20kh1+5");
if (checked.ok) console.log(roll(checked.spec, seededSource("advantage"), 0).total);
else console.log(checked.problem, checked.message);
```

`kh`は高い出目、`kl`は低い出目を残します。`1d20+1d4+3`のように種類を組み合わせられます。`ro<3`は1回だけ振り直し、`r<3`は上限内で条件を満たさなくなるまで振り直します。[表記の資料](../../notation.md)と[仕様](../../spec/notation.md)に詳しい規則があります。

## ダイスをホールドする

```ts
import { normalizeSpec, rollFrom, rollHeld, seededSource } from "@johnmorrisdotca/korokoro";
const first = rollFrom(normalizeSpec({ count: 2, sides: 6 }), [6, 3], "first", 0, null)!;
const next = rollHeld(first, [true, false], seededSource("again"), 1);
console.log(next.faces);
```

真偽値はダイスの順に指定します。規則によってはホールドできないので、[canHold](api:canHold)で確認します。

## ゲームの読み方を使う

```ts
import { getPreset, rollPreset, seededSource } from "@johnmorrisdotca/korokoro";
console.log(getPreset("Yacht")?.notation);
const turn = rollPreset("yahtzee", { source: seededSource("game-night"), at: 0 });
console.log(turn.reading.text);
```

プリセットには、使うダイスと出目の読み方が入っています。手番の管理や得点表はアプリ側で用意します。[ゲームの一覧](../../games.md)に規則と出典があります。ダイスウォーには[startDiceWar](api:startDiceWar)から始める状態管理があります。

ブラウザに表示するには[トレイの埋め込み](embed-a-tray.md)に進みます。
