---
title: トレイの埋め込み
section: how-to
order: 5
description: トレイ、タグ、iframeを表示し、送信元を確認してメッセージを受け取ります。
---

## コードから表示する

```ts no-run
import { mountRoller } from "@johnmorrisdotca/korokoro";
const target = document.createElement("div");
document.body.append(target);
const tray = mountRoller(target, { spec: { count: 2, sides: 6 }, storage: null, sound: false, onRoll: (result) => console.log(result.total) });
tray.roll();
tray.destroy();
```

`storage: null`では履歴を保存しません。画面を取り除くときに`destroy()`を呼びます。1個のダイスには[mountDie](api:mountDie)を使えます。[React](entry:react)と[Vue](entry:vue)のコンポーネントもあります。

## タグまたはiframeを使う

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/korokoro@1/dist/element-define.js"></script>
<korokoro-roller notation="2d6" size="small" sound="off"></korokoro-roller>
```

[2種類の単独のダイスを試す](https://johnmorrisdotca.github.io/korokoro/?lang=ja#one-die)、[トレイを試す](https://johnmorrisdotca.github.io/korokoro/embed/?notation=2d6&size=small&lang=ja)、または[埋め込みビルダー](https://johnmorrisdotca.github.io/korokoro/builder.html?lang=ja)で設定を作ります。コード、iframeのURL、設定のリンクをコピーできます。iframeでは保存しません。[属性、イベント、埋め込みの資料](../../embedding.md)に詳しい説明があります。

## iframeのメッセージを受け取る

```ts no-run
const frame = document.querySelector<HTMLIFrameElement>("iframe");
window.addEventListener("message", (event) => {
  if (!frame || event.origin !== "https://johnmorrisdotca.github.io" || event.source !== frame.contentWindow) return;
  console.log(event.data.type);
});
```

送信元のoriginとiframeの両方を確認します。ネイティブ要素のイベントはShadow DOMの境界を越えて届き、iframeはJSONで表せる内容を転送します。
