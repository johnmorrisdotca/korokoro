# Changelog

All notable changes to this project are written here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/).

## [Unreleased]

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

[Unreleased]: https://github.com/johnmorrisdotca/korokoro/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/johnmorrisdotca/korokoro/releases/tag/v1.0.0
