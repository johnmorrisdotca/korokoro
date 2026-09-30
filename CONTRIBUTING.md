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
pnpm site     # builds the demo into ./site
pnpm dlx serve site   # or any static server
```

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
- **Words go in `src/ui/strings.ts`**, in English and Japanese.
- **Every export gets a doc comment**, and the README's tables (notation,
  options, limits) are kept in step with the code.
- **Sounds.** The recordings are the `.m4a` files in `sounds/`; `pnpm sounds`
  writes them into `src/ui/sounds.data.ts`, and a test fails if the two
  differ. A new recording must be CC0 or your own, and is named in `SOUNDS.md`.
- **No dependencies.** The package has none at run time and should stay so.
- One change per pull request, with a line in `CHANGELOG.md` under
  *Unreleased*.

## Releasing

Maintainers bump the version in `package.json` and move *Unreleased* to the new
version in `CHANGELOG.md`, dated. Pushing the tag `vX.Y.Z` runs the Release
workflow, which checks that the tag matches `package.json`, builds the package
and attaches its tarball to a GitHub release. Publishing to npm is the
*Publish to npm* workflow, run by hand with the tag.
