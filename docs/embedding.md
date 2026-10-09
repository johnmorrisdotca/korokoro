# One die, and embedding the tray

A die on its own, and the tray on a page you do not build. Back to the [README](../README.md#one-die-on-its-own).

## One die on its own

A single die with nothing round it: no felt, no total, no panels. For a page
that wants a die to look at, or one to tap. There are two kinds, chosen by one
option.

- **A die that rolls** (`rollable`, the default) is a button. A tap, Enter or
  Space throws it; it tumbles, lands on the face the generator chose before
  anything moved, and says so to a screen reader.
- **A die that does not roll** (`rollable: false`) is a picture of one face,
  the one you give it, changed from code with `show()`.

```ts
import { mountDie } from "@johnmorrisdotca/korokoro";

const die = mountDie(document.getElementById("die"), { sides: 20, size: "large", onRoll: (face) => console.log(face) });
die.roll();                                            // as a tap does

mountDie(document.getElementById("shown"), { sides: 6, face: 5, rollable: false, onePip: "black" });
```

It keeps one steady square (`small` 48 pixels, `medium` 96, `large` 150, or
`width`): the tumble moves only the picture inside it, so nothing on the page
moves. Nothing on it can be selected, and a device that asks for reduced motion
gets no tumble. It is silent unless you say `sound: true`, because a die on
somebody's page has not been asked to make noise.

| Option | Default | What it does |
| --- | --- | --- |
| `sides` | `6` | 2 to 1000, or `"F"` for a Fate die |
| `faces` | none | A die of your own, as in notation's `d[Yes,No]`: `[{ label: "Yes" }, { label: "No" }]` |
| `face` | the top face | The face showing at first |
| `rollable` | `true` | `false` is a die that only shows a face |
| `size`, `width` | `"medium"` | `"small"`, `"medium"` or `"large"`; or a width in pixels, which wins |
| `onePip` | `"red"` | The colour of a d6's one pip: `"red"` or `"black"` |
| `source` | cryptographic | `seededSource("table")` throws the same faces for everyone |
| `animationMs` | `600` | The tumble; reduced motion always skips it |
| `sound`, `playSound` | `false` | Whether a throw makes the sound of dice, and a sound of your own |
| `onRoll` | none | Called with the face once it has landed |
| `cloth`, `theme`, `locale`, `strings` | | As on the tray |

The handle has `roll()`, `show(face)`, `setSides(sides, face?, faces?)`,
`setOnePip(colour)`, `setLocale(locale)`, `setRollable(on)`, `destroy()`, and
`face`, `rolling` and `element`.

As a tag, from the same script as `<korokoro-roller>`:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/korokoro@1/dist/element-define.js"></script>
<korokoro-die sides="20" size="large"></korokoro-die>
<korokoro-die sides="6" face="5" rollable="off"></korokoro-die>
```

| Attribute | What it does |
| --- | --- |
| `sides`, `face` | The kind of die, and the face showing |
| `rollable="off"` | A die that shows and does not roll; `rollable="on"` makes it roll again |
| `size`, `width` | `small`, `medium`, `large`, or pixels |
| `one-pip` | `red` (unless said) or `black` |
| `lang`, `seed`, `sound`, `animation-ms`, `cloth` | As the options of the same names; `sound="on"` for dice sounds |

Each throw is a `korokoro-die-roll` event with the face as its `detail`;
changing `face` shows that face at once. The [demo](https://johnmorrisdotca.github.io/korokoro/#one-die)
has one of each.

## Embed it on any site

A tray on a page you do not build: a blog, a wiki, a forum. Choose how much
of it you want.

| Size | What is shown | Room at 360px wide |
| --- | --- | --- |
| `small` | The felt and the result, for the dice you name. Tap to roll | about 540px tall |
| `medium` | Those, and the choice of dice and bonus | about 1320px |
| `large` | Everything: history, stats and odds too. Side by side from 900px wide | about 1600px |

An iframe, where the page allows no scripts:

```html
<iframe src="https://johnmorrisdotca.github.io/korokoro/embed/?dice=2d6%2B3&size=small" title="Korokoro" width="360" height="540" style="border:0;max-width:100%" loading="lazy"></iframe>
```

The canonical address uses the element's names: `notation`, `size`, `lang`,
`width`, `theme`, `cloth`, `one-pip`, `label`, `seed`, `sound`, `hold`,
`placeholder`, `keyboard`, `wide`, `language-chooser`, `dice-war` and
`animation-ms`. Values are validated before the element is configured.
Existing `dice`, `roll` and `onepip` links and validated `felt` / `ink` colours
remain aliases. The iframe writes no history or preferences, at any size.
Every roll sends `{ type: "korokoro-roll", detail }`, with the element's
JSON-safe roll detail. The older `{ korokoro: "roll", notation, total, dice }`
message remains available for existing hosts.

One tag, where the page may run a script, with nothing to install:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/korokoro@1/dist/element-define.js"></script>
<korokoro-roller notation="2d6+3" size="small"></korokoro-roller>
```

[The demo](https://johnmorrisdotca.github.io/korokoro/#embed) writes both
for the dice you last rolled there, with a look at each size.


## Build and share your setup

[Build your dice](https://johnmorrisdotca.github.io/korokoro/builder.html) to preview a dice tray or one die. The shared builder writes custom-element, iframe, ES-module, React 19, Vue, Svelte, Angular, plain-HTML and URL-only code. Its URL hash preserves the setup and selected code tab. The npm script is pinned to the package's current major. Defaults are omitted; the tray's notation and storage-free setup are explicit.

All observed attributes can be set as properties. Hyphenated names also have camel-case aliases: one-pip / onePip and animation-ms / animationMs, for example. Existing numeric face reading and assignment remain unchanged. Boolean properties preserve the actual defaults: hold, keyboard and placeholder are on when omitted, whereas wide and dice-war are off. Off, false, no, none and 0 turn a flag off. Null removes an attribute and restores its default.

Width constrains the component in CSS pixels; theme can be light, dark or auto; label supplies an accessible group name. The styles are installed in the mounted element's own document or shadow root. Existing host sizing is retained when width is absent.

The single-die iframe lives at [embed/die/](https://johnmorrisdotca.github.io/korokoro/embed/die/). It validates sides, face, display size, pixel width, language, seed, sound and rollability and sends `{ type: "korokoro-die-roll", detail: face }`. Both pages are transparent, noindex and free of document scrolling. Reduced motion is honoured by the existing die/roller renderers.

A host checks the origin and source of each message:

```js
const frame = document.querySelector("iframe");
window.addEventListener("message", (event) => {
  if (event.origin !== "https://johnmorrisdotca.github.io") return;
  if (event.source !== frame.contentWindow) return;
  if (event.data?.type === "korokoro-roll") console.log(event.data.detail.total);
  if (event.data?.type === "korokoro-die-roll") console.log(event.data.detail);
});
```
