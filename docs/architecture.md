# Architecture

How the source is laid out, and why. Back to the [README](../README.md#architecture).

## Architecture

The core is plain functions over plain data with no DOM and no dependency:
dice, notation, exact odds, history and statistics, each in a module of its
own, with the command line a pure function too. The tray is a small DOM layer
under `ui/`, and the React component, the Vue component and the custom
element are thin wrappers around it, each its own entry point, so a page loads
only what it uses. The tabletop games are data (`games/`): a preset is a line
of dice and a named reading, rarely new code.

```text
src/
├── cli.ts             the command line as a pure function: arguments in, text and an exit code out
├── dice.ts            the dice the tray offers as buttons: the polyhedral set, the d30 and the percentile die
├── diceWar.ts         Dice War: players, rounds, wars and scores, seeded and kept as text
├── element-define.ts  the "/element/define" entry: registers the custom element by being imported
├── element.ts         the "/element" entry: the tray as a custom element for any page
├── export.ts          rolls written out as JSON, CSV or plain text, and read back
├── history.ts         the latest rolls, forgetting the oldest past a limit
├── index.ts           the main entry: dice, notation, odds, history and statistics, plus the tray to mount
├── loaded.ts          loaded dice, kept in plain sight: the weights are part of a die's name
├── math.ts            arithmetic over the kinds of dice in a roll
├── notation.ts        dice notation as a character sheet writes it, read into a spec and written back
├── odds.ts            exact odds for a spec, worked out rather than simulated
├── random.ts          where the randomness comes from, and how a seed replaces it
├── react.tsx          the "/react" entry: the tray as a React component
├── sets.ts            a named set of dice somebody wants to find again, kept on the device
├── share.ts           rolls as links, and the version of the notation a link is written in
├── stats.ts           everything worth saying about a history of rolls
├── version.ts         the version of this package, as package.json has it
├── vue.ts             the "/vue" entry: the tray as a Vue component
├── games/  the board and tabletop games whose dice the tray can set up and read
│   ├── odds.ts      exact odds for games that take more than one roll
│   ├── presets.ts   each game as a preset: its dice and how it reads them, and finding one by name
│   ├── readings.ts  how a roll is read in a game: a small set of named functions
│   └── words.ts     the words for every outcome of every reading, in English and Japanese
└── ui/  the tray that draws and rolls the dice
    ├── cloth.ts        the cloths a tray may be laid in
    ├── die.ts          one die on its own, rolling or only showing a face
    ├── dom.ts          a few lines of DOM building, so the tray needs no framework
    ├── faces.ts        each die drawn as its own shape
    ├── games.ts        the control for games: a search box and the games on their shelves
    ├── help.ts         one plain line for each option row, in both languages, for a page's Help switch
    ├── more.ts         everything one level down from the default tray: custom dice, loaded dice and saved sets
    ├── mount.ts        the tray itself: mounting it on a page, and the options it takes
    ├── panels.ts       the panels under the tray, drawn fresh from the state they are handed
    ├── sound.ts        the sound of a roll
    ├── sounds-data.ts  the tray's recorded dice, as base64 AAC audio, for the "/sounds" entry
    ├── strings.ts      every word the tray says, in English and Japanese
    ├── style.ts        the tray's look, injected once per document
    └── war.ts          the Dice War panel under the felt: the table, the scores, the last throw and the choices
```

Tests sit beside the code they test (`*.test.ts`), and `src/docs.test.js`
runs the README's examples. `bin/` is the few lines that hand the command line
the real process, `scripts/` builds the demo and the documentation site and
checks the package as npm packs it, `conformance/` is the vectors another
language's port checks itself against, `tray/` taps the tray in real browsers,
`website/` and `docs/` are the documentation, and `demo/` is the page
published on GitHub Pages.
