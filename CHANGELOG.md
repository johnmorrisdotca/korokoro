# Changelog

All notable changes to this project are written here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/johnmorrisdotca/korokoro/compare/v1.7.0...HEAD
[1.7.0]: https://github.com/johnmorrisdotca/korokoro/releases/tag/v1.7.0
[1.6.0]: https://github.com/johnmorrisdotca/korokoro/releases/tag/v1.6.0
[1.5.0]: https://github.com/johnmorrisdotca/korokoro/releases/tag/v1.5.0
[1.4.0]: https://github.com/johnmorrisdotca/korokoro/releases/tag/v1.4.0
[1.3.0]: https://github.com/johnmorrisdotca/korokoro/releases/tag/v1.3.0
[1.2.0]: https://github.com/johnmorrisdotca/korokoro/releases/tag/v1.2.0
[1.1.0]: https://github.com/johnmorrisdotca/korokoro/releases/tag/v1.1.0
[1.0.0]: https://github.com/johnmorrisdotca/korokoro/releases/tag/v1.0.0
