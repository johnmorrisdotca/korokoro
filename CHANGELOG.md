# Changelog

All notable changes to this project are written here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.13.0] - 2026-10-01

### Added

- **The tray's cloth.** Lay the felt in green (its own), blue, red, black or
  wood, the five the whole family and itsutsu.com's boards offer: the
  `cloth` option, the `cloth` attribute on `<korokoro-roller>` (changed in
  place, keeping the dice and the rolls), `setCloth()` on the tray, and
  `?cloth=` on the embed page. `KOROKORO_CLOTHS` holds the colours.
- The demo's header has the family's cloth patches; the tray and the page
  follow them, and the embed code carries the cloth chosen.

## [1.12.0] - 2026-09-30

### Added

- **Embed the tray on any site.** `embed/` on the demo site is the dice and
  nothing else, for an iframe: `embed/?dice=2d6%2B3&size=small`. It takes
  `dice`, `size`, `lang`, `sound=off`, `seed` and the colours `felt` and
  `ink`, tells the page that frames it each roll, tracks nothing and loads
  nothing from anywhere else. The demo writes the iframe and the one-tag
  code for the dice last rolled, with a look at each size.
- **`size`**, on `mountRoller`, the element (`size="small"`), and the React
  and Vue components: `"small"` is the felt and the result alone, `"medium"`
  adds the choice of dice and bonus, `"large"` (the default) is everything.
  The type is `RollerSize`.
- **`roll`**, a third name for the command line beside `korokoro` and `koro`:
  `roll 2d6+3`.

## [1.11.0] - 2026-09-30

### Added

- **A documentation site**, at <https://johnmorrisdotca.github.io/korokoro/docs/>:
  a guide, the notation, the games, the command line, an API reference made
  from the source by TypeDoc, search, light and dark, and the real tray on
  the pages for live examples. Its pages are made from the README and `docs/`
  by `scripts/docs-site.mjs`, so nothing is written twice and every example on
  it is one the tests run. A stub in Japanese says the rest is to come.
- **Dice as plain text, from an address**: `/api/?roll=2d20kh1%2B5&seed=table`
  shows that roll as text, JSON or CSV and nothing else, by the same function
  the command line is. It runs in the browser and says so; a page that frames
  it is sent the answer and can ask for more.
- **A conformance suite and a specification**, for ports to other languages:
  `conformance/korokoro-conformance.json` (seeds and the numbers they give,
  notation and how it is written back or why it is refused, seeded rolls die
  for die, exact odds), `docs/spec/random.md` and `docs/spec/notation.md`. The
  suite is made from this implementation and a test fails when they differ;
  `conformance/port_check.py` is the generator written in Python from the
  specification alone, checking itself against the suite.
- **Use Korokoro from another language**: the shape of the command line's
  JSON, and a working example in Python, Go, Rust and C#, each a file CI runs.
- **`@johnmorrisdotca/korokoro/element/define`**: the custom element
  registered by being imported, so that one script tag is the whole of it.
  `defineRoller()` stays for a page that wants to choose when. It is the one
  module with an effect of its own, and `sideEffects` in `package.json` names
  it so that a bundler keeps it.
- **`notation` on the React component**, as on the Vue component and the
  element: `<DiceRoller notation="2d20kh1+5" />`, followed as it changes.
- **`keyboard: false`** (`keyboard="off"` on the element) leaves a page its
  Space key, for a tray that is one thing among many on a page.
- A page can use the package from a CDN with nothing to install; the example
  is tested as written.
- `pnpm docs:site`, `pnpm test:languages`, and `node tray/look.mjs`, which
  compares pictures of the demo before and after a change, pixel for pixel.

### Changed

- The demo's look is the family's: `demo/family.css`, shared unchanged with
  the sibling packages and held to its hash by a test, and the header, footer
  and language chooser from `scripts/family-template.mjs`. The footer now
  names the family. Everything above it is pixel for pixel what it was.
- The file of recorded sounds is `dist/ui/sounds-data.js` (it was
  `sounds.data.js`). The old name made VitePress take it for one of its own
  data files and fail to build a site that used the tray. The `./sounds`
  entry is unchanged.


## [1.10.0] - 2026-09-30

### Added

- **A web component**: `<korokoro-roller notation="2d20kh1+5" wide>`, from
  `@johnmorrisdotca/korokoro/element`. Call `defineRoller()` once. Attributes
  for the dice, the language and the everyday options; an `options` property
  for what a string cannot carry; `roll()`, `setSpec()` and `history` on the
  element; and a `korokoro-roll` event for each roll. Importing it on a
  server does nothing and throws nothing.
- **A Vue component**: `<DiceRoller notation="2d20kh1+5" wide @roll="…" />`,
  from `@johnmorrisdotca/korokoro/vue`. The tray's options as props, a `roll`
  event, the dice and the language followed as they change, and `roll()`,
  `history()`, `setSpec()` and `setLocale()` on a template ref. It renders an
  empty box on a server. Vue is an optional peer dependency, 3.3 or later;
  the package itself still has none.
- Both are tapped in Chromium and WebKit by `pnpm test:tray`, imported from
  the npm tarball by ESM and by `require` in `pnpm test:package`, and built
  into a small project each by `scripts/check-frameworks.mjs`.


## [1.9.0] - 2026-09-30

### Added

- **Arithmetic.** `(2d6+3)*2`, `2d6x2`, `1d20-1d4`, `floor(4d6/2)`,
  `ceil(…)`, `round(…)`, `abs(1d6-1d6)`, `max(1d6,1d8)`, `min(…)`, with
  brackets as deep as you like. Worked out in whole-number fractions, never in
  floating point, in the roll and in its odds alike, and the odds are exact.
  A division has to be rounded, so that a roll always comes to a whole number.
- **Grouped rolls that keep one**: `{4d6,3d8}kh1` and `kl1`, written back as
  `max(4d6,3d8)` and `min(…)`.
- **Dice that all differ**: `4d6u`. Each die is thrown from the faces not yet
  showing. Exact odds, counted in whole numbers.
- **More than ten dice, for a caller that asks**: the one option `maxDice`, on
  `parseNotation(text, { maxDice: 100 })`, `normalizeSpec(spec, { maxDice })`,
  `roll(spec, source, { maxDice })` and `rollMany`, takes a roll up to a
  hundred plain dice, all added or one kept, and `--max-dice` does the same on
  the command line. Without it each stops at ten, as it always has:
  `roll({ count: 50, sides: 6 })` still throws ten dice. `roll`'s third
  argument is the time of the roll, as before, or `{ at, maxDice }`.
- `MathNode`, `evaluateMath`, `checkMath`, `mathText`, `mathRange`,
  `spreadMath`, `groupTotals`, `groupRange`, `isPlainDice`, `formulaText`,
  `MAX_DICE_BY_CODE`, `MAX_UNIQUE_SIDES` and the `MAX_MATH_…` limits.
- In the tray, a formula is typed and shown as it was written, each kind of
  dice as it fell: `([6 4]+3)*2`. The dice buttons start a new roll and cannot
  change a formula, and the tray says so.

### Changed

- Four spellings that were refused are now read: `1d20-1d4` (dice taken away),
  and `2d6+3+1d4`, `3+2d6` and `2d6+1+1`, which are the plain rolls
  `2d6+1d4+3`, `2d6+3` and `2d6+2`. `checkNotation` no longer gives the
  `"minus"` problem. Nothing that was read before is read differently, and
  every seeded roll replays as it did.


## [1.8.0] - 2026-09-30

### Added

- **A command line**: `korokoro`, and `koro` for short, on Linux, macOS and
  Windows. It rolls any notation (`koro 2d20kh1+5`), several rolls at once,
  a roll many times (`--times`, or `6#`), from a seed (`--seed`); shows the
  exact odds without rolling (`--odds`); rolls and reads a game's dice
  (`--game`, `--games`); tests a real die for fairness (`--test`); reads rolls
  from standard input (`--stdin`); and prints JSON (`--json`, versioned by
  `format`) or CSV (`--csv`) for other programs. English or Japanese, from
  `--lang`, the environment or the system. `NO_COLOR` is honoured. Exit codes
  0, 1 and 2.
- `runCli(args, surroundings)`: the whole command line as a pure function.
- **Export**: `toJSON`, `toCSV` and `toText` write rolls out, and `fromJSON`
  reads the JSON back, trusting nothing in it. The CSV never hands a
  spreadsheet a formula. `rollText`, `diceText`, `csvCell`, `CSV_COLUMNS`,
  `EXPORT_FORMAT`.
- **Export and import in the tray**, one level down under the history: save
  as CSV, JSON or text, and bring a JSON export back in.
- `VERSION`.
- `pnpm test:cli` runs the built command line as a child process, and
  `pnpm test:package` packs the package with npm, installs the tarball into an
  empty project, imports every entry in `exports` by ESM and by `require`, and
  runs both commands as installed. CI runs the two on Linux, macOS and Windows
  with Node 22 and 24, and the release workflow runs the package check before
  it publishes.


## [1.7.0] - 2026-09-30

### Added

- **Counting successes.** `6d10>=8` is how many of six d10 show 8 or more, and
  `f=1` takes one away for each 1. Any comparison: `=`, `<`, `>`, `<=`, `>=`,
  `<>`. The headline reads *Successes*, each die says whether it is one, and
  the odds are exact.
- **Explosions on the faces you say**, and two more kinds of them: `3d6!>=5`,
  compounding `3d6!!`, penetrating `3d6!p`, and `3d6!!p`.
- **Rerolls at any comparison**: `2d6r=3`, `2d6r>=5`, `2d6ro=6`; `r` and `ro`
  alone reroll the lowest face.
- **A least and a most for each die**: `4d6min2`, `4d6max5`.
- **Critical marks**: `1d20cs>=19cf=1`. Marks only; the total is the same.
- **Sorted dice**: `4d6sd`, `4d6sa`. The roll keeps the order thrown.
- **A label for the roll**: `2d6+3 # fire damage`, or `[fire damage] 2d6+3`.
  Text, and only ever shown as text.
- Short forms other rollers write: `4d6k3`, `4d6d1`, `4d6b3`, `2d20w1`.
- `Compare`, `meets`, `isSuccessRoll`, `countsSuccesses`, `dieOutcomes`,
  `rulesText`, `playsByNewRules`, `rollLabel`, `MAX_ROLL_LABEL`; on a die,
  `counts` and `critical`, and `value` wherever a die is worth something other
  than its face.
- [Notation compared](./docs/notation-compared.md): what is read, what is
  still to come, and where the order of modifiers differs from RPG Dice
  Roller's. A test holds the page to the package.
- A table of the order modifiers are applied in, in the README.
- **The tray's tests are in the repository**: `pnpm test:tray` opens the built
  demo in Chromium and WebKit with Playwright (a development dependency only)
  and taps it, at a phone's width by touch and at a desktop's by mouse. CI
  runs them.
- A game can say that dice are not held in it (`hold: false` on a preset), and
  the tray then holds none: craps, Monopoly and the rest no longer offer it.

### Changed

- `3d6!!` and `2d6r2` were refused and are now read, as compounding dice and
  as a reroll of 2s. Nothing that was read before is read differently, and
  every seeded roll replays as it did.
- A refusal of a reroll or an explosion is worded for the wider rules.


## [1.6.0] - 2026-09-30

### Added

- **Games.** The dice of 44 games, and how each game reads them: Monopoly,
  Catan, Backgammon and its doubling cube, Snakes and Ladders, Ludo,
  Parcheesi, Pachisi, Risk; Yahtzee, Farkle, Bunco, Pig, Liar's dice, Poker
  dice, Ship captain and crew, Shut the box, Mexico, Left Center Right; Craps,
  Sic bo, Chuck-a-luck, Hazard, Chō-han (丁半) and Chinchirorin (チンチロリン);
  a d20 check, advantage, disadvantage, ability scores, Fate, Blades in the
  Dark, Powered by the Apocalypse, d10 and d6 pools, percentile, 3d6
  roll-under and d66; and a coin, yes-no-maybe, pick a number,
  rock-paper-scissors, a compass and a colour die. Each is one entry of data.
  Korokoro rolls and reads the dice; it does not run the game.
- **One Games control in the tray**, closed until it is opened: a search box
  and the games on their shelves. Choosing one sets the dice and reads every
  roll in the game's terms ("A small straight", "8 is the point", "The
  defender loses 2"). Yahtzee and Ship, captain and crew count their three
  rolls and hold dice between them; craps, Pig, Hazard and the doubles games
  read a roll in the light of the ones before it. `?game=yahtzee` opens one by
  link, and a shared roll carries its game.
- **Exact odds of each outcome** in the Odds tab and in `presetOdds`, counted
  over every way the dice can fall, with `yahtzeeWithin`, `crapsPass` and
  `chinchirorinHandWithin` for the figures that take more than one roll.
- `PRESETS` (also `presets`), `getPreset`, `findPresets`, `presetSpec`,
  `rollPreset`, `readPreset`, `presetOdds`, `readDiceAs`, `patternsOf`,
  `waysToShut` and `READING_WORDS`. A game is found by its id, its name, its
  Japanese name or any other name it goes by.
- **Several rolls in one go.** `rollMany(spec, times)` throws the same dice up
  to 100 times from the one generator and returns ordinary rolls with their
  sum, highest and lowest; `6#4d6dl1` writes it as notation. In the tray it is
  **Times**, under *More*, from 1 to 10: one tap, a list of every roll with
  the highest and lowest marked, one entry in the history, one sound, and one
  link for the lot. `setOf`, `MAX_TIMES`, `shareQueryMany`, `readSharedMany`.
- `chanceAnyAtLeast(spec, target, times)` and `expectedHighest(spec, times)`:
  the chance that at least one of several rolls reaches a target, and the best
  of them on average.
- [A gallery of the games](./docs/games.md), made from the data and checked by
  a test, a *Suggest a game* issue template, and a worked example of adding a
  game in CONTRIBUTING.

### Changed

- The tray's *Custom dice, loaded dice and sets* is now *More: times, custom
  dice, loaded dice and sets*.
- While several rolls are thrown at once, dice are not held: the tray says why.


## [1.5.0] - 2026-09-30

### Added

- **Custom dice.** A die with any faces you like: `d[Yes,No,Maybe]`,
  `2d[Hit=1,Miss=0,Miss=0]`, `d[1,1,2,3,5,8]`. Up to 20 faces, each up to 16
  characters, with an optional value for totals and an optional colour; a face
  written twice comes up twice as often. Exact odds over what the faces are
  worth, and how often each face comes up where they are only words. A face's
  words are text and are never read as HTML.
- **Sets of dice**, saved by name on the device and shared by a link
  (`?dice=…&name=…`). `makeSet`, `loadSets`, `storeSets`, `setQuery`,
  `readSet`.
- **Loaded dice, for the curious and the suspicious.** `d6{6:3}` is a d6 that
  favours its six. Korokoro's own dice remain fair; these are the world's most
  conscientious cheats, marked on the felt, in the history, beside the total,
  in the data (`loaded: true`) and in every link, with no way to share one as
  fair. Three house dice come with it: the Optimist, the Six-Ace Flat and the
  Odd Couple, who have never made a seven. `isFair(spec)` refuses the lot in
  one call.
- **A fairness test.** `fairnessTest(counts)` is a chi-square test of whether a
  die's results look fair, with the chance worked out exactly and no verdict
  on a handful of rolls. The Stats tab uses it, and *Test a real die* takes
  results typed or pasted from a die you can pick up.
- In the tray, all of the above lives one level down, under *Custom dice,
  loaded dice and sets*. The buttons still roll fair dice and nothing else.
- The odds of a loaded roll drawn over the same dice if they were fair, with a
  line such as "6 comes up 3 in 8, not 1 in 6".
- A language choice: `languageChooser: true` adds English and 日本語 to the
  tray, `setLocale` changes it from code, and the demo has a chooser of its
  own that follows the browser, remembers the choice and takes `?lang=ja`.
- `docs/loaded-dice.md`: how to load a die, how to catch one, and a short
  history of crooked dice with its sources.
- The README gains *Roll in 30 seconds*, *Use it in your project* (the API,
  plain HTML, React, Vue, Svelte and Angular, each proved from the packed
  tarball by `scripts/check-frameworks.mjs`), *The name*, *Used by* and *The
  family*.
- `isFair`, `isLoaded`, `hasTotal`, `dieName`, `chancesOf`, `valueOfFace`,
  `groupOf`, `rollFrom`, `faceChances`, `loadingOf`, `LOADED_PRESETS`,
  `readResults`, and the limits for custom and loaded dice.

### Changed

- `chiSquareTail` is now exact (the incomplete gamma function), where it was
  an approximation good to a couple of digits. Fairness figures in the Stats
  tab may differ in their last digit.
- `faceStats` counts only fair dice when given a number of sides, so a loaded
  d6's results are never mixed into the fair d6's.
- Notation may be up to 400 characters, to make room for a custom die.
- Long notation wraps in the tray and no longer widens the page.

## [1.4.0] - 2026-09-30

### Changed

- **`r` now rerolls until clear, and `ro` rerolls once**, as Roll20 and the
  dice libraries that follow it write them. `2d8r<3` used to throw a 1 or a 2
  again once; it now throws it again until it shows 3 or more. Write `2d8ro<3`
  for the old behaviour. A reroll until clear may match at most half a die's
  faces and stops after 10 rerolls (`MAX_REROLLS`), so it always ends, and its
  odds are exact, that limit included. Specs, stored histories and links made
  by 1.2.0 and 1.3.0 still mean what they meant: see `docs/migrating.md`.
- In the tray, a tap on a die that has been rolled holds it, where it used to
  roll again. A tap on the felt beside the dice, or Space, rolls. `hold: false`
  keeps every tap a roll.
- In the tray, tapping a die button adds a die of that kind to the roll, where
  it used to change the kind of every die. The number row sets how many of the
  kind last touched. The dice the tray opens with are a suggestion, which the
  first die tapped replaces, so a fresh tray and one tap on d20 is still
  `1d20`; `placeholder: false` makes them the user's own.
- A dropped or rerolled die is struck through in the sum under the total,
  where it was in brackets; brackets now gather a kind of dice, as in
  `14 + (3 + 2) + 1`.

### Added

- Several kinds of dice in one roll: `1d20+1d4`, `2d6+1d8+3`,
  `2d20kh1+1d4+5`. Up to four kinds and ten dice, each kind with its own
  modifiers, with exact odds for the lot. `RollSpec.more` holds the other
  kinds; a roll of one kind is the same object it always was.
- Building a roll by tapping: each tap on a die adds one, a chip for each kind
  takes one away, *Clear* empties the roll, and the notation box writes it out
  as you go. At ten dice or four kinds the buttons that would go past dim and
  the row says why.
- Holding dice: after a roll, tap dice on the felt to hold them and roll the
  rest, as Yacht and Farkle do. *Release all* lets them go. The Odds tab
  follows the dice still to roll. `rollHeld`, `canHold` and
  `distributionHolding` do the same from code; a roll records which dice were
  held, and a seed replays it.
- Every odds function takes a distribution as well as a spec.
- `groupsOf`, `specOf`, `diceCount`, `sidesOf`, `MAX_GROUPS`, `MAX_REROLLS`,
  `SHARE_VERSION`, and a `legacyReroll` option for reading old notation.
- Refusals that name their part for the new rules: too many kinds, too many
  dice over the whole roll, and dice taken away.
- For phones: every control in the tray is at least 44px, the notation box
  turns off autocorrect and capitals, and nothing below the felt moves when
  the dice land or the roll grows.
- `docs/strings-ja.md`, every Japanese string beside its English, made from
  the source; and an issue template for fixing a translation. The Japanese has
  not yet been reviewed by a native reader.
- `docs/migrating.md`.
- The README's notation tables and examples are now run by the tests.

## [1.3.0] - 2026-09-30

### Added

- Up to ten dice in one roll, where it was five: `8d6`, `10d10kh3`. The tray's
  count goes from 1 to 10, in two rows of five on a phone, and ten dice sit on
  the felt in two even rows.
- The sound of real dice: a shake while they tumble and a knock as each lands,
  with a mute button on the felt that the device remembers. The recordings are
  fetched only when a roll first needs them. It starts muted where the device
  asks for reduced motion.
- `sound: false` for a silent tray with no button, and `playSound` for a sound
  of your own. The React component passes both through.
- `exactCounts`: the odds of plain dice and of one die kept, as whole numbers.
- The dice now start their tumble one after another and land one after
  another, all within `animationMs`.
- `@johnmorrisdotca/korokoro/sounds`, the recordings on their own, and
  `createRollSound` for using them outside the tray.

### Changed

- Plain dice and advantage are counted in `BigInt`, so ten d1000 (10^30
  outcomes) is as exact as two d6. Every figure from 1.0.0 to 1.2.0 is
  unchanged, and so is every seeded roll.
- `9d6` and the like, refused until now, are rolled; `normalizeSpec` brings a
  count down to ten where it brought it down to five.
- The average and the luck of a roll are worked out once for each spec, so a
  long history of large rolls no longer slows the tray.
- The README is rewritten for everything from 1.0.0 to here, the demo page says
  what the tray can do, and every exported function and type has a doc comment.

### Credits

- Dice sounds from Kenney's Casino Audio, CC0, kenney.nl. See `SOUNDS.md`.

## [1.2.0] - 2026-09-30

### Added

- Dice of any size, from 2 sides to 1000: `d3`, `d14`, `2d1000`. The tray's
  buttons stay the eight dice a table owns; any other die is typed as notation
  and drawn as a plain token that says what it is.
- Fate dice: `4dF`, each −1, 0 or +1.
- Keep or drop any number of dice: `4d6kh3`, `5d10kl2`, `4d6dl1`, `5d8dh2`.
- Rerolls: `2d6r<3` or `2d6r<=2` throws a 1 or a 2 again, once, and the new
  face stands.
- Exploding dice: `3d6!`. A die showing its highest face throws another, up to
  `MAX_EXPLOSIONS` (10) more for each die, on dice of 100 sides or fewer.
- Exact odds for all of the above. Exploding dice stop at the same limit in
  the roll and in the odds, so the odds are those of the dice as thrown.
- `Roll.dice`: what happened to every die thrown (kept, dropped or rerolled,
  and whether it exploded), with `diceOf` and `readDice` to work it out from a
  roll's faces. `Roll.faces` and `Roll.kept` now include rerolled dice and the
  dice an explosion added, and the total is still the kept faces plus the bonus.
- `checkNotation`, which says which part of a notation was refused and why.
  `parseNotation` still returns `null`.
- In the tray: dropped and rerolled dice are struck through, exploded dice are
  marked, and a refused notation says which part. Charts of many totals draw
  neighbouring totals as one bar, and no longer run off a phone.
- `isSides`, `faceRange`, `keptCount`, and the limits `MIN_SIDES`, `MAX_SIDES`,
  `MAX_EXPLOSIONS` and `MAX_EXPLODING_SIDES`.

### Changed

- `RollSpec.sides` is now `number | "F"` (the type `Sides`), where it was one
  of the listed dice. `DieSides` and `DIE_SIDES` are still that list: the dice
  with a button. `RollSpec` gains three optional fields, `keepCount`, `explode`
  and `reroll`, which are left out of a roll that does not use them, so a
  1.0.0 spec, its notation, its seeded rolls and its odds are unchanged.
- Notation that 1.1.0 refused because the die was not on the list, such as
  `2d7`, is now rolled, and `normalizeSpec` keeps such a die where it used to
  fall back to a d6.
- The tray's strings gain the words for refusals and for a die's status;
  `notationBad` no longer lists the dice.

## [1.1.0] - 2026-09-30

### Added

- The d30, a thirty-sided die: in the tray's row of dice, in notation (`d30`,
  `2d30+3`, `2d30kh1`), in the exact odds, and in history, stats and shared
  links. It is drawn as a rhombic triacontahedron seen face on.

### Fixed

- The package's `exports` now carry a `default` condition beside `import`, so
  tools that resolve it from CommonJS-compiled code (Playwright specs, for one)
  find it instead of failing with `No "exports" main defined`.

## [1.0.0] - 2026-09-30

### Added

- Roll one to five dice at once: d4, d6, d8, d10, d12, d20 or d100, with a
  bonus, and advantage or disadvantage (keep the highest or lowest).
- Dice notation: `3d6+2`, `1d20`, `2d20kh1`, `2d20kl1`, `d%`.
- Fair rolls from `crypto.getRandomValues` with rejection sampling, and a seeded
  generator (sfc32) that throws the same dice for the same seed.
- Exact odds for every roll: each total's chance, the chance to meet a target,
  the average, the spread, the most likely totals and how lucky a roll was.
- A history of up to 500 rolls kept in `localStorage`, read back defensively.
- Stats: luck, hot and cold streaks, matching dice, natural 20s and 1s, each
  face's count with a chi-square fairness test, and totals against the odds.
- Any roll as a shareable link.
- The tray: tap the felt or press Space to roll, animated dice drawn in each
  die's own shape, history, stats and odds panels, English and Japanese, light
  and dark, themeable through CSS variables, and reduced motion respected.
- `DiceRoller`, a React component, from `@johnmorrisdotca/korokoro/react`.
- A static demo, published to GitHub Pages.

[Unreleased]: https://github.com/johnmorrisdotca/korokoro/compare/v1.13.0...HEAD
[1.13.0]: https://github.com/johnmorrisdotca/korokoro/compare/v1.12.0...v1.13.0
[1.12.0]: https://github.com/johnmorrisdotca/korokoro/compare/v1.11.0...v1.12.0
[1.11.0]: https://github.com/johnmorrisdotca/korokoro/releases/tag/v1.11.0
[1.10.0]: https://github.com/johnmorrisdotca/korokoro/releases/tag/v1.10.0
[1.9.0]: https://github.com/johnmorrisdotca/korokoro/releases/tag/v1.9.0
[1.8.0]: https://github.com/johnmorrisdotca/korokoro/releases/tag/v1.8.0
[1.7.0]: https://github.com/johnmorrisdotca/korokoro/releases/tag/v1.7.0
[1.6.0]: https://github.com/johnmorrisdotca/korokoro/releases/tag/v1.6.0
[1.5.0]: https://github.com/johnmorrisdotca/korokoro/releases/tag/v1.5.0
[1.4.0]: https://github.com/johnmorrisdotca/korokoro/releases/tag/v1.4.0
[1.3.0]: https://github.com/johnmorrisdotca/korokoro/releases/tag/v1.3.0
[1.2.0]: https://github.com/johnmorrisdotca/korokoro/releases/tag/v1.2.0
[1.1.0]: https://github.com/johnmorrisdotca/korokoro/releases/tag/v1.1.0
[1.0.0]: https://github.com/johnmorrisdotca/korokoro/releases/tag/v1.0.0
