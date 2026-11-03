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
├── cliOdds.ts         the odds lines the command line prints
├── cliWords.data.ts   the command line's English and Japanese words
├── dice.ts            the dice the tray offers as buttons: the polyhedral set, the d30 and the percentile die
├── diceInternal.ts    the face range and the rule-copying shared by the spec and the throw
├── diceLabels.ts      the labels, faces and weights a spec is written with, and its rules in words
├── diceLimits.ts      the largest and smallest a die, a pool and each modifier may be
├── diceNormalize.ts   a spec checked and brought into range, and what one kind of die can come to
├── diceOutcomes.ts    the ranges, kept faces and outcomes of one kind of die
├── diceRoll.ts        throwing a spec: one roll, a roll with dice held, and a set of rolls
├── diceRollEngine.ts  the throw itself: drawing, exploding, rerolling and keeping
├── diceRolled.ts      what a throw gives back: a die, a roll and a set of rolls
├── diceRules.ts       questions about a spec: whether it explodes, rerolls, holds or counts successes
├── diceSpec.ts        the shape of a spec: a group of dice, its keep rule and its comparisons
├── diceWar.ts         Dice War: players, rounds, wars and scores, seeded and kept as text
├── diceWarSave.ts     Dice War kept as text and read back
├── diceWarTypes.ts    the options, throws and game state of Dice War
├── element-define.ts  the "/element/define" entry: registers the custom element by being imported
├── element.ts         the "/element" entry: the tray as a custom element for any page
├── elementDie.ts      one die as its own custom element
├── elementShared.ts   the server-safe element base and the attribute helpers both elements use
├── export.ts          rolls written out as JSON, CSV or plain text, and read back
├── history.ts         the latest rolls, forgetting the oldest past a limit
├── index.ts           the main entry: dice, notation, odds, history and statistics, plus the tray to mount
├── loaded.ts          loaded dice, kept in plain sight: the weights are part of a die's name
├── math.ts            arithmetic over the kinds of dice in a roll
├── notation.ts        dice notation as a character sheet writes it, read into a spec and written back
├── notationGroup.ts   one kind of dice read from the front of a notation, modifiers included
├── oddsDistribution.ts  the distribution of a spec, cached, and the odds drawn from it
├── oddsWays.ts        counting the ways each total can come up
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
│   ├── presets.ts        each game as a preset: its dice and how it reads them, and finding one by name
│   ├── presets.data.ts   the table of games: dice, readings and the English and Japanese lines
│   ├── readings.ts  how a roll is read in a game: a small set of named functions
│   ├── readingsReaders.ts  the named functions that read a roll
│   └── words.ts     the words for every outcome of every reading, in English and Japanese
└── ui/  the tray that draws and rolls the dice
    ├── cloth.ts        the cloths a tray may be laid in
    ├── die.ts          one die on its own, rolling or only showing a face
    ├── dom.ts          a few lines of DOM building, so the tray needs no framework
    ├── faces.ts        each die drawn as its own shape
    ├── games.ts        the control for games: a search box and the games on their shelves
    ├── help.ts         one plain line for each option row, in both languages, for a page's Help switch
    ├── more.ts         everything one level down from the default tray: custom dice, loaded dice and saved sets
    ├── mount.ts           the tray itself: mounting it on a page, and the options it takes
    ├── mountBind.ts       joins the tray's closed-over fields to the functions that were split out
    ├── mountControls.ts   the controls under the felt: dice, notation, seeds and the games
    ├── mountDom.ts        laying the cloth on the tray and deciding which key press rolls
    ├── mountResult.ts     the result, the history and the panels under a roll
    ├── mountSession.ts    the tray's shared state, as the pieces of the tray see it
    ├── mountThrow.ts      throwing the dice that are showing, and landing them
    ├── mountTray.ts       the dice on the tray and the line that adds them
    ├── mountTypes.ts      the options the tray takes and the handle it gives back
    ├── panels.ts       the panels under the tray, drawn fresh from the state they are handed
    ├── panelsChart.ts  bars and axes for the charts in the panels
    ├── panelsOdds.ts   the odds panel and the real-die check
    ├── sound.ts        the sound of a roll
    ├── sounds-data.ts  the tray's recorded dice, as base64 AAC audio, for the "/sounds" entry
    ├── strings.ts         every word the tray says, in English and Japanese
    ├── strings.data.ts    the built-in English and Japanese words
    ├── style.ts        the tray's look, injected once per document
    └── war.ts          the Dice War panel under the felt: the table, the scores, the last throw and the choices
```

Tests sit beside the code they test (`*.test.ts`), and `src/docs.test.js`
holds documentation promises to the source. `scripts/check-readme-examples.mjs`
runs the README examples; the shared documentation generator also runs the
public API and guide examples. `bin/` is the few lines that hand the command line
the real process, `scripts/` builds the demo and the documentation site and
checks the package as npm packs it, `conformance/` is the vectors another
language's port checks itself against, `tray/` taps the tray in real browsers,
`docs/guides/` and `docs/guides/ja/` are the documentation-site guides, and
`docs/site.json` supplies the approved job and header words. The older
`website/` source is retained as a historical reference; the shared generator
now builds `site/docs/`. `demo/` is the native page published on GitHub Pages.
