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
npm install
npm run check    # lint, types and tests: the same as CI
npm run site     # builds the demo into ./site
npx serve site   # or any static server
```

- **Keep the core pure.** Everything outside `src/ui` and `src/react.tsx` is
  plain functions over plain data, with no DOM and no dependency. It is what
  makes the odds testable and the package usable anywhere.
- **Test what you change.** Tests sit beside their source as `*.test.ts`. A
  change to the odds needs a test against a number you can check by hand.
- **Never break a seed.** `seededSource` must throw the same dice for the same
  seed forever, because people share them. A test pins it.
- **Words go in `src/ui/strings.ts`**, in English and Japanese.
- One change per pull request, with a line in `CHANGELOG.md` under
  *Unreleased*.

## Releasing

Maintainers bump the version in `package.json`, move *Unreleased* to the new
version in `CHANGELOG.md`, tag `vX.Y.Z` and run `npm publish`.
