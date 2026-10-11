---
title: Embed a tray
section: how-to
order: 5
description: Mount the native tray, use a custom element or iframe and handle host messages.
---

## Mount it from code

```ts no-run
import { mountRoller } from "@johnmorrisdotca/korokoro";
const target = document.createElement("div");
document.body.append(target);
const tray = mountRoller(target, { spec: { count: 2, sides: 6 }, storage: null, sound: false, onRoll: (result) => console.log(result.total) });
tray.roll();
// When the host removes this interface:
tray.destroy();
```

`storage: null` keeps no history. Calling `destroy()` removes listeners and the mounted interface. A host can also mount one die with [mountDie](api:mountDie), or use the [React](entry:react) and [Vue](entry:vue) wrappers.

## One tag or an iframe

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/korokoro@1/dist/element-define.js"></script>
<korokoro-roller notation="2d6" size="small" sound="off"></korokoro-roller>
```

[Try both single dice](https://johnmorrisdotca.github.io/korokoro/#one-die), [Try the live tray](https://johnmorrisdotca.github.io/korokoro/embed/?notation=2d6&size=small&lang=en) or [build your own setup](https://johnmorrisdotca.github.io/korokoro/builder.html). The builder supplies framework snippets, validated iframe URLs and copied setup links. The frame stores nothing. [Element attributes, events and the original embedding reference](../embedding.md) describe the full contract.

## Receive a frame message

```ts no-run
const frame = document.querySelector<HTMLIFrameElement>("iframe");
window.addEventListener("message", (event) => {
  if (!frame || event.origin !== "https://johnmorrisdotca.github.io" || event.source !== frame.contentWindow) return;
  console.log(event.data.type);
});
```

Check both origin and source before consuming a message. The native element's composed events cross a shadow boundary; a frame forwards their JSON-safe payload.
