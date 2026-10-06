# API

Every call, by what it does. Back to the [README](../README.md#api).

## API

Every function is pure unless it says otherwise, every type is exported, and
each has a doc comment your editor will show. The [API reference](https://johnmorrisdotca.github.io/korokoro/docs/reference/),
made from the source by `pnpm docs:site`, lists every export of every entry
point with its signature and its doc comment.

### Rolling

```ts
type DieSides = 4 | 6 | 8 | 10 | 12 | 20 | 30 | 100;  // the dice with a button
type Sides = number | "F";                           // 2 to 1000, or a Fate die
type Keep = "all" | "highest" | "lowest";
type DiceGroup = {       // one kind of dice and its rules
  count: number; sides: Sides; keep: Keep;
  keepCount?: number;    // how many `keep` keeps; left out when one
  explode?: true;        // left out when the dice do not explode
  reroll?: number;       // `ro<`: reroll once at this face or lower
  rerollUntil?: number;  // `r<`: reroll until above this face
  rerollWhen?: Compare;       // `ro=3`, `ro>=5`: the rerolls the two above cannot say
  rerollUntilWhen?: Compare;  // `r=3`, `r>=5`
  explodeWhen?: Compare;      // `!>=5`: the faces that explode, when not just the highest
  explodeKind?: "compound" | "penetrating" | "compound-penetrating";  // `!!`, `!p`, `!!p`
  floor?: number;        // `min2`
  ceiling?: number;      // `max5`
  success?: Compare;     // `>=8`: the dice are counted, not added
  failure?: Compare;     // `f=1`
  critical?: Compare;    // `cs>=19`
  fumble?: Compare;      // `cf=1`
  sort?: "ascending" | "descending";  // `sa`, `sd`
  unique?: true;         // `u`: the dice all differ
};
type Compare = { op: "=" | "<=" | ">=" | "<>"; n: number };  // `<3` is kept as `<=2`, `>7` as `>=8`
type RollSpec = DiceGroup & {
  modifier: number;
  more?: DiceGroup[];    // the other kinds of dice; left out when there is one
  times?: number;        // `6#`: how many times it is thrown; left out when once
  label?: string;        // `# fire damage`: what the roll is for; only ever shown as text
  math?: MathNode;       // a formula over the kinds' totals; left out when they are added
};
type MathNode =
  | { kind: "dice"; group: number }        // the total of the kind at this place
  | { kind: "number"; value: number }
  | { kind: "op"; op: "+" | "-" | "*" | "/"; left: MathNode; right: MathNode }
  | { kind: "call"; name: "floor" | "ceil" | "round" | "abs" | "max" | "min"; args: MathNode[] };

roll(spec: Partial<RollSpec>, source?: RandomSource, at?: number | { at?: number; maxDice?: number }): Roll
rollHeld(previous: Roll, held: boolean[], source?: RandomSource, at?: number): Roll
canHold(spec: RollSpec): boolean                    // plain dice only
groupsOf(spec: RollSpec): DiceGroup[]               // the kinds of dice, in order
specOf(groups: DiceGroup[], modifier?: number): RollSpec
diceCount(spec: RollSpec): number                   // dice asked for, over all kinds
sidesOf(spec: RollSpec, die: DieRoll): Sides        // the kind of die one die is
diceOf(roll: Roll): DieRoll[]                       // roll.dice, or worked out from the faces
readDice(spec: RollSpec, faces: number[]): DieRoll[] | null  // null if the dice could not show them
rollMany(spec, times?, source?, at?): RollSet        // { rolls, sum, highest, lowest }; times from the spec unless given; `at` as for roll
setOf(rolls: Roll[]): RollSet                       // the same summary of rolls already made
normalizeSpec(spec: Partial<RollSpec>, limits?: { maxDice?: number }): RollSpec  // brings a spec into range
groupTotals(roll: Roll): number[]                   // what each kind came to: what a formula puts together
groupRange(group: DiceGroup): { min: number; max: number }
isPlainDice(group: DiceGroup): boolean              // plain enough to be rolled in any number
rangeOf(spec: RollSpec): { min: number; max: number }
parseNotation(text: string, options?: { legacyReroll?: boolean; maxDice?: number }): RollSpec | null
checkNotation(text: string, options?): { ok: true; spec: RollSpec } | { ok: false; problem; part; message }
formatNotation(spec: RollSpec): string
isSuccessRoll(spec: RollSpec): boolean              // the total is a count of successes
dieOutcomes(group: DiceGroup): { least: number; chances: number[] }  // one die worked through its rules
rulesText(group: DiceGroup): string                 // a kind's modifiers as notation writes them
meets(compare: Compare, value: number): boolean
```

### Custom dice, loaded dice and sets

```ts
type CustomFace = { label: string; value?: number; colour?: string };
// on a DiceGroup: faces?: CustomFace[] for a custom die, weights?: number[] for a loaded one

isFair(spec): boolean                    // plain fair dice and nothing else
isLoaded(spec): boolean                  // a loaded die is in the roll
hasTotal(spec): boolean                  // false for a roll of words only
dieName(group): string                   // "d6", "d6{6:3}", "d[Yes,No,Maybe]"
chancesOf(group): number[]               // the chance of each face
faceChances(group): { face, label, chance, fair }[]
loadingOf(group): { face, loaded: [a, b], fair: [c, d] } | null   // "6 comes up 3 in 8, not 1 in 6"
LOADED_PRESETS                           // the three house dice

fairnessTest(counts: number[], chances?: number[]): Fairness   // { rolls, minimum, enough, statistic, p, verdict, … }
readResults(text: string, sides?: number)                     // results typed from a real die, as counts

makeSet(name, dice): DiceSet | null      // { name, notation }
loadSets(storage, key) / storeSets(storage, key, sets)
withSet(sets, set) / withoutSet(sets, name)
setQuery(set): string / readSet(query): DiceSet | null
```

### Randomness

```ts
type RandomSource = { next(): number; readonly seed: string | null };

cryptoSource(): RandomSource              // the default; crypto.getRandomValues, buffered
seededSource(seed: string): RandomSource  // sfc32 from a text seed; stable forever
newSeed(): string                         // eight characters nobody will misread
randomInt(source: RandomSource, n: number): number  // fair integer in [0, n)
```

### Odds

```ts
distributionOf(spec): { min: number; max: number; probabilities: number[] }
distributionHolding(spec, faces, held): Distribution  // the odds with some dice held
exactCounts(spec): { min: number; counts: bigint[]; outcomes: bigint } | null
// Each of these takes a spec, or a distribution already in hand:
chanceExactly(spec, total): number
chanceAtLeast(spec, target): number
chanceAtMost(spec, target): number
expectedTotal(spec): number
spreadOf(spec): number                    // standard deviation
mostLikely(spec): number[]
luckOf(spec, total): number               // 0 = worst possible, 0.5 = typical, 1 = best
chanceAnyAtLeast(spec, target, times): number  // at least one of several rolls reaches the target
expectedHighest(spec, times): number           // the best of several rolls, on average
```

### Games

```ts
PRESETS: readonly Preset[]                // every game; `presets` is the same list
getPreset(name): Preset | undefined       // by id, name, Japanese name or any other name
findPresets(search): Preset[]             // what the tray's search finds
presetSpec(preset): RollSpec              // its dice
rollPreset(name, { source?, at?, before?, language? }): PresetRoll  // throws RangeError for an unknown name
readPreset(preset, roll, before?, language?): PresetReading         // { outcome, values, tone, text }
presetOdds(preset, spec?, language?): OutcomeOdds[] | null          // { outcome, text, ways, outOf, chance }
readDiceAs(reading, roll, before?, options?): Outcome               // a reading without a game
patternsOf(spec): { dice, ways }[] | null // every way the dice can fall, counted
yahtzeeWithin(rolls): [bigint, bigint]    // a Yahtzee within so many rolls, as a fraction
crapsPass(): [bigint, bigint]             // 244 in 495
chinchirorinHandWithin(throws): [bigint, bigint]
waysToShut(total): number[][]             // the tiles a total may shut, in Shut the box
```

### Dice War

```ts
startDiceWar({ players, computers?, dice?, sides?, goal?, to?, seed? }): DiceWarGame | null   // null for a table it is not played at
playDiceWar(game, { faces? }): DiceWarGame | null     // people's dice by seat; null for a move the rules refuse
diceWarPeopleToRoll(game): number[]                   // the seats whose dice the next move must hand in
diceWarComputerFaces(game, round, war, seat): number[] // a computer's dice, from the seed
diceWarOver(game): boolean
diceWarWinners(game): number[]                        // the most points, shared where level; none while it goes on
diceWarSpec(game): RollSpec                           // the dice each player rolls, for the rest of the package
diceWarOdds({ players, dice?, sides? }, total?): DiceWarChances  // outright, war, and how a total fares
encodeDiceWar(game): string                           // the table, seed and moves, as text
decodeDiceWar(text): DiceWarGame | null               // every move played again; null for anything else
DICE_WAR_LIMITS                                       // the most and the fewest of everything
```

Types: `DiceWarOptions`, `DiceWarGame`, `DiceWarMove`, `DiceWarThrow`, `DiceWarRoll`, `DiceWarChances`, `DiceWarGoal`.

### History and stats

```ts
addToHistory(history, roll, limit = 500): Roll[]
loadHistory(storage, key): Roll[]         // a blocked or corrupt store reads as empty
saveHistory(storage, key, history): boolean
parseHistory(text): Roll[]                // drops any roll that does not add up
serializeHistory(history): string
statsOf(history, focus?: RollSpec): Stats // luck, streaks, matches, naturals, faces, totals
chiSquareTail(statistic, degrees): number
```

### Export and the command line

```ts
toJSON(rolls, { stats?: boolean }): string
fromJSON(text: string): Roll[] | null
toCSV(rolls): string                      // CSV_COLUMNS names the columns
toText(rolls): string
rollText(roll): string                    // "2d20kh1+5: 24  [19 (12)]"
diceText(roll): string                    // "19 (12)"
csvCell(value: string | number): string   // one cell, quoted and made safe
EXPORT_FORMAT: 1
VERSION: string                           // this package's version
runCli(args: string[], surroundings?: { env?, stdin?, colour?, locale?, now?, source? }): { code: 0 | 1 | 2; out: string; err: string }
cliLanguage(flag?, env?, locale?): "en" | "ja"
```

### Sharing

```ts
shareQuery(roll): string                  // "roll=2d20kh1%2B5&faces=17%2C4&at=…"
readShared(query): Roll | null            // refuses faces the dice could not show
shareQueryMany(rolls): string             // several rolls of one run in one link
readSharedMany(query): Roll[] | null
```

### The tray

```ts
mountRoller(element: HTMLElement, options?: RollerOptions): RollerHandle
```

| Option | Default | What it does |
| --- | --- | --- |
| `spec` | `2d6` | The dice showing at first, as a partial `RollSpec` |
| `wide` | `false` | Tray and panels side by side on a screen 900px or wider |
| `size` | `"large"` | How much is drawn. `"small"`: the felt and the result alone, for the dice it was given. `"medium"`: those and the choice of dice. `"large"`: everything, with history, stats and odds |
| `onRoll` | none | Called with each `Roll` once it has landed |
| `locale` | the page's `lang` | Numbers and times; `"ja…"` also picks the Japanese words |
| `strings` | English or Japanese | Your own words, for any language: `{ ...STRINGS.en, total: "Suma" }` |
| `storage` | `localStorage` | Where the history and the mute choice are kept; `null` keeps nothing |
| `storageKey` | `"korokoro.history"` | The key for the history; the mute choice is kept under this key plus `.muted` |
| `query` | the page's own | A query string that may hold a shared roll or a seed |
| `shareBase` | the page's address | Where shared links point |
| `cloth` | `"green"` | The felt's cloth: `"green"`, `"blue"`, `"red"`, `"black"` or `"wood"`; `theme` is laid over it, and `setCloth()` changes it in place |
| `onePip` | `"red"` | The colour of a d6's one pip, on the felt and in the history: `"red"` or `"black"`, the colour of the other pips. `setOnePip()` changes it in place |
| `theme` | none | CSS variables for the tray, such as `{ "--kk-felt": "#234" }` |
| `animationMs` | `650` | From the throw to the last die landing; reduced motion always skips it |
| `sound` | `true` | `false` makes the tray silent and takes the mute button away |
| `playSound` | the recorded dice | Your own sound for each throw: `({ dice, ms, landings }) => void` |
| `hold` | `true` | `false` stops dice being held: a tap anywhere on the felt rolls, a die included |
| `placeholder` | `true` | `false` makes the opening dice the user's own roll, so the first die tapped adds to them |
| `keyboard` | `true` | `false` leaves the page its Space key: the tray then rolls from the keyboard only when the focus is inside it. For a tray that is one thing among many on a page |
| `languageChooser` | `false` | `true` adds a small choice of English or 日本語 to the tray, remembered on the device |
| `diceWar` | `false` | `true` puts [Dice War](#dice-war) among the games, on a shelf of its own: a table of the person at the tray and computers, played with the tray's dice |

```ts
type RollerHandle = {
  roll(): void;                         // throw the dice showing
  history(): readonly Roll[];
  setSpec(spec: Partial<RollSpec>): void;  // part of the dice, or a whole spec
  setLocale(locale: string): void;         // "ja…" for Japanese, anything else English
  destroy(): void;
};
```

`setSpec` changes part of the dice (`{ sides: 20 }`) or, given a whole spec
such as `parseNotation("4d6dl1")`, all of them.

### How the tray works

One idea runs it: **the roll is a pool of dice.**

1. **Tap a die to add it.** The tray opens showing `2d6`, as a suggestion:
   its chip is dashed, the row says it is only a suggestion, and the buttons read *Choose a die*. The first die you tap
   takes its place, so one tap on d20 is `1d20`. After that every tap adds:
   d20, d4, d4 is `1d20+2d4`. (A tap on d6 while `2d6` is showing is simply a
   third d6.)
2. **A chip takes one away.** The row marked *This roll* has a chip for each
   kind of dice (`2d6`, with a minus beside it), and says under it that a tap
   takes one die away. Tap it and there is one die fewer; the last die
   takes the kind with it. *Clear* empties the roll, bonus and all.
3. **The numbers set how many** of the kind you touched last, so three d8 is
   *d8*, *3*.
4. **Tap the felt to roll.** Space does the same from a keyboard.
5. **Tap a die on the felt to hold it**, once it has been rolled. The next
   tap on the felt rolls the others. *Release all* lets every die go. Only
   plain dice can be held; with `hold: false`, none can.

**When the opening dice stop being a suggestion.** As soon as you build
anything: a die tapped, a chip, a number, notation typed, a spec set from
code, or a roll opened from a shared link. Rolling them does not, nor does the
bonus or the keep row: open the tray, roll `2d6` twice, tap d20, and you have
`1d20`. A page that mounts the tray with its own `spec` gets the same
treatment; `placeholder: false` makes those dice the user's own from the
start, so the first tap adds to them.

At ten dice or four kinds the buttons that would go past the limit dim, and
the row's label says why. The notation box says the same roll in writing as
you tap, and takes anything the buttons do not reach; it says which part it
refuses. On the felt a dropped or rerolled die is struck through, an exploded
die is ringed and marked `!`, and a held die is lifted, ringed in gold and
tagged.

Since 1.4.0 a tap on a die that has been rolled holds it, where before it
rolled again like the rest of the felt. A page that wants the old behaviour
passes `hold: false`.

### The roll itself never waits on the show

The dice are thrown by the generator before anything moves. The tumble and
the sound only present a roll that is already decided: they use their own
`Math.random` for where a die flies from and which recording plays, and never
draw from the dice's generator. So a seeded roll is the same with the
animation on, off or interrupted.
