# Contributing to Korokoro

Thank you for helping. Bug reports, ideas and pull requests are all welcome.

## Reporting a bug

Open an issue with what you rolled (the dice notation, or a shared link),
what you expected, what happened, and your browser. A shared roll link is the
quickest way to show a result that looks wrong.

## Making a change

```sh
git clone https://github.com/johnmorrisdotca/korokoro
cd korokoro
pnpm install
pnpm check    # lint, types and tests: the same as CI
pnpm test:tray   # the tray in real browsers: builds the demo, then taps it
pnpm test:cli    # the command line, run as a child process
pnpm test:package   # npm pack, install the tarball, import every entry, run the commands
pnpm test:languages # the examples in Python, Go, Rust and C#, for whichever of them this machine has
pnpm docs:site      # the documentation site, into ./site/docs
pnpm site     # builds the demo into ./site
pnpm dlx serve site   # or any static server
```

- **The tray is tested by tapping it.** `tray/*.tray.mjs` are Playwright
  tests that open the built demo in Chromium and WebKit, at a phone's width by
  touch and at a desktop's by mouse, and do what a person does. After every
  flow they check that nothing is wider than the screen, nothing to tap is
  under 44px, and the page complained of nothing. A change to the tray comes
  with a test there. The first time, `pnpm exec playwright install chromium
  webkit` fetches the browsers.
- **The documentation site is made, not written.** `scripts/docs-site.mjs`
  cuts the README at its headings and takes the pages in `docs/` as they are;
  the API reference is TypeDoc's, from the doc comments. To change a page,
  change the README or the document it came from. A new section of the README
  has to be given a page in that script, or the build says so.
- **The demo's look is the family's.** `demo/family.css` and
  `scripts/family-template.mjs` are shared, unchanged, with the sibling
  packages; a test holds the stylesheet to the hash on its first line. What
  is Korokoro's own goes in `demo/site.css`. After a change to either,
  `node tray/look.mjs before` on the old build and
  `node tray/look.mjs before after` on the new compare 56 pictures of the
  page, pixel for pixel.
- **A change to a seeded roll or to the notation changes the conformance
  suite**, and the test that holds it fails until `pnpm docs:make` rewrites
  it. That is the moment to ask whether the change was meant: ports check
  themselves against that file.
- **Keep the core pure.** Everything outside `src/ui` and `src/react.tsx` is
  plain functions over plain data, with no DOM and no dependency. It is what
  makes the odds testable and the package usable anywhere.
- **Test what you change.** Tests sit beside their source as `*.test.ts`. A
  change to the odds needs a test against a number you can check by hand.
- **Never break a seed.** `seededSource` must throw the same dice for the same
  seed forever, because people share them. A test pins it.
- **Keep the odds exact.** A new rule needs its odds worked out, not sampled,
  and a test against a count of every outcome. If something cannot be both
  exact and quick, refuse it in the notation by name.
- **The show never rolls the dice.** The tumble and the sound present a roll
  the generator has already made; they must not draw from it.
- **Words go in `src/ui/strings.ts`**, in English and Japanese, then
  `pnpm docs:make` to bring `docs/strings-ja.md` up to date. Japanese is plain
  and polite, and uses the words Japanese tabletop players use: ダイス, ロール,
  出目, 振り直し.
- **Examples in the README are run by `src/docs.test.js`.** Change a number
  in one and the other has to follow.
- **Every export gets a doc comment**, and the README's tables (notation,
  options, limits) are kept in step with the code.
- **Sounds.** The recordings are the `.m4a` files in `sounds/`; `pnpm sounds`
  writes them into `src/ui/sounds-data.ts`, and a test fails if the two
  differ. A new recording must be CC0 or your own, and is named in `SOUNDS.md`.
- **No dependencies.** The package has none at run time and should stay so.
- One change per pull request, with a line in `CHANGELOG.md` under
  *Unreleased*.

## Adding a game

A game is **one entry of data and a test**. Nothing in the tray changes: the
Games list, the search, the odds table, the gallery in `docs/games.md` and
`rollPreset` all read the same list.

Here is Pig, whole. The entry, in `src/games/presets.ts`:

```ts
{
  id: "pig",                 // for code and links: ?game=pig
  name: "Pig",
  nameJa: "ピッグ",
  aliases: [],               // other names people search by
  family: "dice",            // the shelf: board, dice, traditional, cards, roleplaying, handy
  notation: "1d6",           // the dice, as they would be typed
  reading: "pig",            // how a roll is read: one of the readings in readings.ts
  total: true,               // whether the total is the headline
  runs: true,                // a roll is read in the light of the rolls before it
  says: "One die, as often as you dare: a one loses the turn's total.",
  saysJa: "ダイス1個を好きなだけ振ります。1が出るとその手番の得点を失います。",
  how: "Each roll of 2 to 6 adds to the turn's total, and the player may hold at any time to bank it. A one ends the turn with nothing. First to 100 wins.",
  source: "https://en.wikipedia.org/wiki/Pig_(dice_game)",
}
```

Most games need no more than that, because their reading already exists:
`sum`, `doubles`, `sixAgain`, `counts`, `successes`, `highest` and the rest
are in `src/games/readings.ts`. Pig has a reading of its
own, which is a small pure function there and its words, in English and
Japanese, in `src/games/words.ts`:

```ts
pig: (dice, before) => {
  const face = all(dice)[0];
  if (face === 1) return bad("out");
  let turn = face;
  for (let i = before.length - 1; i >= 0 && all(before[i])[0] !== 1; i--) turn += all(before[i])[0];
  return plain("turn", { face, turn });
},
```

```ts
"pig.turn": "{face}: the turn stands at {turn}",
"pig.out": "A one: the turn scores nothing",
```

And the test, in `src/games/games.test.ts`, against dice set down by hand:

```ts
expect(read("pig", [1])).toMatchObject({ outcome: "out", tone: "bad" });
expect(read("pig", [4], [[6], [1], [3], [5]]).text).toBe("4: the turn stands at 12");
```

Then `pnpm docs:make` writes the game into the gallery, and `pnpm check` runs
every game through the same questions: its notation parses, it is read in
both languages, its odds add up to every way the dice can fall, and it has a
source.

The rules for a game:

- **Check the rule against a source, and link it.** Describe it in your own
  words; do not copy a rulebook.
- **Read the dice, do not run the game.** No boards, turns or score sheets.
- **Nothing about stakes**: no bets, payouts or advice on them. Children use
  the site this was built for.
- **Fair dice only.** A game never loads a die.
- **Say where tables differ**, in `how`, and read only what is agreed.
- **Exact odds.** If the reading has outcomes, `presetOdds` counts them; pin
  one figure you can check by hand or against a published table.

Not sure how to do any of it? Open a *Suggest a game* issue with the rules and
a link, and that is enough.

## Releasing

Maintainers bump the version in `package.json` and move *Unreleased* to the new
version in `CHANGELOG.md`, dated. Pushing the tag `vX.Y.Z` runs the Release
workflow, which checks that the tag matches `package.json`, runs the checks,
builds and packs the package, attaches the tarball to a GitHub release, and
publishes it to npm with provenance, through npm's trusted publishing (no
token is kept). A version already on npm is not published again. The workflow
can also be run by hand.

## House rules, shared by every package of the family

- Open an issue first for anything bigger than a typo, so that we can agree on the shape before you spend time on it.
- No runtime dependencies. Every function that plays or checks a game is pure: it returns new values and never changes what it was given.
- Tests sit beside the code they test. A rule you change has a test that would have caught it.
- Words a player reads come in English and Japanese. If you cannot write the Japanese, say so in the pull request and someone will.
- Option values and names are kebab case.
- Art and sound are CC0 or public domain only, checked at the source, and credited in the README. No GPL or LGPL code.
- Needs Node 22 or later. A change a user would notice gets a line in `CHANGELOG.md`.
- `SECURITY.md` and `CODE_OF_CONDUCT.md` are the family's text, copied unchanged from the master in [johnmorrisdotca/.github](https://github.com/johnmorrisdotca/.github); a copy is kept in `scripts/community` and a test holds the two to it.
