# Contributing

Thank you for helping. Bug reports, ideas, corrections to the Japanese and pull
requests are all welcome.

This first part is the same in every package of the family. It is the master
text kept in
[johnmorrisdotca/.github](https://github.com/johnmorrisdotca/.github/blob/main/CONTRIBUTING.md),
copied unchanged into `scripts/community/CONTRIBUTING.md`, and a test holds
this file to that copy. What is particular to the package follows it, under
the heading "Particular to" and the package's name.

## Before you start

Open an issue first for anything bigger than a typo, so that we can agree on the
shape before you spend time on it. Taking part follows the
[Code of Conduct](CODE_OF_CONDUCT.md); report a security concern privately, as
[SECURITY.md](SECURITY.md) says.

## Making a change

```sh
pnpm install
pnpm check          # lint, types and tests: the same as CI
pnpm test:package   # pack it as npm does, install it in an empty project, import every entry
pnpm site           # build the demo into ./site, as GitHub Pages publishes it
```

The package's own further commands (its browser tests, its command line, its
data scripts) are listed under its own heading below.

## House rules, shared by every package of the family

- **No runtime dependencies.** Development dependencies are for tests, builds and
  documentation only.
- **The core is pure.** Every function in it returns new values and never
  changes what it was given.
- **Test what you change.** Tests sit beside the code they test. A rule you
  change has a test that would have caught it.
- **Words a person reads come in English and Japanese.** If you cannot write the
  Japanese, say so in the pull request and someone will.
- **Option values and names are kebab case.**
- **Art and sound are CC0 or public domain only**, checked at the source and
  credited. Data and word lists may be under another licence that lets them be
  shipped, with its notice kept in `NOTICE.md`. No GPL or LGPL code.
- **Needs Node 22 or later.**
- **A README table, example or count that a test holds to the code** changes
  together with the code.
- **The family's own files are the same in every package**: `demo/family.css`,
  `scripts/family-template.mjs`, `scripts/family-readme.mjs`,
  `scripts/release-notes.mjs`, the files in `scripts/community/` and
  `family.test.js` (in `src/`, or in `test/`). Do not edit one here. To change
  one, change it in every repository at once, bump `FAMILY_TEMPLATE_VERSION` for
  the template, and record the new hash in `family.test.js`. What is the
  package's own goes in its own stylesheet, `demo/<name>.css`, and its page
  builder, `scripts/site.mjs`.
- **The list of the family in the README is made, not written.**
  `pnpm family:readme` writes it between its markers from
  `scripts/family-template.mjs`.
- **The workflows are the family's too.** `ci.yml` runs `pnpm check`, the demo's
  browser tests and the packed package on Linux, macOS and Windows; `pages.yml`
  is the same text in every package. A package adds jobs of its own after those.

## Pull requests

One change per pull request. Say what changed and how you checked it, and add a
line to `CHANGELOG.md` under **Unreleased**: for a change a user would notice,
and for one to the repository alone.

## Releasing

Maintainers bump the version in `package.json` (and in `src/version.ts`, where
the package has one), move *Unreleased* to the new version in `CHANGELOG.md`,
dated, push, wait for CI and tag `vX.Y.Z`, the same as `package.json`'s version.
The Release workflow (`.github/workflows/release.yml`) checks and builds the
package, attaches the tarball to a GitHub release and publishes it to npm by
trusted publishing, with provenance and no token. A version already on npm is
not published again.

## Particular to Korokoro

### Reporting a bug

Open an issue with what you rolled (the dice notation, or a shared link),
what you expected, what happened, and your browser. A shared roll link is the
quickest way to show a result that looks wrong.

### Commands and rules

```sh
pnpm check    # lint, types and tests: the same as CI
pnpm test:tray   # the tray in real browsers: builds the demo, then taps it
pnpm test:cli    # the command line, run as a child process
pnpm test:package   # npm pack, install the tarball, import every entry, run the commands
pnpm test:languages # the examples in Python, Go, Rust and C#, for whichever of them this machine has
pnpm docs:site      # the documentation site, into ./site/docs
pnpm site     # builds the demo into ./site
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
- **A change to the demo's look is compared picture by picture.** What is
  Korokoro's own goes in `demo/korokoro.css`. After a change to it,
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

### Adding a game

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
