# Dice as plain text

<https://johnmorrisdotca.github.io/korokoro/api/> is a page that rolls the
dice named in its address and shows the answer as plain text, JSON or CSV,
with nothing else on it:

<https://johnmorrisdotca.github.io/korokoro/api/?roll=2d20kh1%2B5&seed=table>

```
2d20kh1+5: 24  [19 (12)]
```

It is for a link in a chat, a bookmark, a frame in another page, or a quick
look at some odds.

**It runs in your browser.** Korokoro has no server: nothing is sent
anywhere, and a program cannot fetch dice from this address, because what
comes back is the page, not the answer. A program should use
[the command line](command-line.md#the-command-line) or the package. A hosted
HTTP API is not planned, because it would need a server and somebody to pay
for it.

## The address

| Part | What it does |
| --- | --- |
| `roll=2d6+3` | The dice. Give it more than once to roll several. A `+` is written `%2B` and a `#` is `%23` |
| `seed=table` | The same seed throws the same dice |
| `times=6` | Throw each roll this many times, 1 to 100 |
| `format=text` | `text` (the default), `json` or `csv` |
| `odds=1` | Show the exact odds and do not roll |
| `game=yahtzee` | A game's dice, read the way the game reads them. `games` lists them |
| `max-dice=40` | Allow up to that many plain dice in a roll, 10 to 100 |
| `lang=ja` | English (the default) or Japanese |

With no `roll` it shows this list. The answers are the command line's: the
page hands the address to the same function `koro` is, so
`?roll=4d6dl1&seed=table&format=json` is `koro 4d6dl1 --seed table --json`,
character for character.

## In a frame

A page that frames this one is sent the answer, and can ask for more:

```html
<iframe id="dice" src="https://johnmorrisdotca.github.io/korokoro/api/?roll=2d6&format=json" hidden></iframe>
<script>
  window.addEventListener("message", (event) => {
    if (event.origin !== "https://johnmorrisdotca.github.io" || !event.data.korokoro) return;
    const { query, code, out, err, data } = event.data.korokoro;
    console.log(code === 0 ? data.rolls[0].total : err);
  });
  // Later, another roll from the same frame:
  document.getElementById("dice").contentWindow.postMessage({ korokoro: { ask: "?roll=1d20%2B5&format=json" } }, "https://johnmorrisdotca.github.io");
</script>
```

The message is `{ korokoro: { query, code, out, err, data } }`: the query
answered, the exit code (0, 1 or 2, as on the command line), the text, what
went wrong, and for `format=json` the JSON already read. In your own page,
the package does the same with no frame at all.

## From a CDN, with nothing to install

The package is on npm, and so on the CDNs that serve npm. A page needs one
script tag:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/korokoro@1/dist/element-define.js"></script>
<korokoro-roller notation="2d20kh1+5"></korokoro-roller>
```

or, to call the functions:

```html
<script type="module">
  import { chanceAtLeast, parseNotation, roll } from "https://cdn.jsdelivr.net/npm/@johnmorrisdotca/korokoro@1/dist/index.js";

  const attack = parseNotation("2d20kh1+5");
  document.body.append(`Rolled ${roll(attack).total}; 15 or more comes up ${Math.round(chanceAtLeast(attack, 15) * 100)}% of the time.`);
</script>
```

`@1` follows the newest 1.x. For a page that must not change under you, name
a version in full (`@1.11.0`). A new version takes about half an hour to
reach npm's listing and the CDNs after it is released. The element's
self-registering entry (`element-define.js`) is in 1.11.0 and later.
