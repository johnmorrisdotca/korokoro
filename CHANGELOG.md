# Changelog

All notable changes to this project are written here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/johnmorrisdotca/korokoro/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/johnmorrisdotca/korokoro/releases/tag/v1.2.0
[1.1.0]: https://github.com/johnmorrisdotca/korokoro/releases/tag/v1.1.0
[1.0.0]: https://github.com/johnmorrisdotca/korokoro/releases/tag/v1.0.0
