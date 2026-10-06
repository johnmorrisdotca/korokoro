# Games and Dice War

The dice of 44 games and how each is read, and the game of Dice War. Back to the [README](../README.md#games).

## Games

Korokoro knows the dice of 44 games, and how each game reads them. Open
**Games** in the tray, type a few letters, and choose one; or link straight to
it with `?game=yahtzee`; or call it from code, by any name the game goes by:

```ts
const thrown = rollPreset("yahtzee", { source: seededSource("table") });
thrown.roll.faces;       // [1, 2, 1, 5, 4]
thrown.reading.text;     // "Chance, for 13"
thrown.reading.outcome;  // "chance": the same in every language

getPreset("Yacht") === getPreset("yahtzee");   // true: other names find it too
presetOdds(getPreset("craps")!);
// a natural (7 or 11) 8 of 36, craps (2, 3 or 12) 4 of 36, a point 24 of 36
```

| Shelf | Games |
| --- | --- |
| Board games | Monopoly, Catan, Backgammon and its doubling cube, Snakes and Ladders, Ludo, Parcheesi, Pachisi (six cowries), Risk |
| Dice games | Yahtzee, Farkle, Bunco, Pig, Liar's dice, Poker dice, Ship captain and crew, Shut the box, Mexico, Left Center Right |
| Traditional games | Craps, Sic bo, Chuck-a-luck, Hazard, Chō-han (丁半), Chinchirorin (チンチロリン) |
| Roleplaying games | a d20 check, advantage and disadvantage, ability scores, Fate, Blades in the Dark, Powered by the Apocalypse, d10 and d6 pools, percentile, 3d6 roll-under, d66 |
| Handy dice | a coin, yes-no-maybe, pick a number, rock-paper-scissors, a compass, a colour die; and who goes first at a card table |

Every one is in the [gallery](games.md), with its dice, how it is read,
the exact odds of each outcome and a link to the rules.

- **A game is read, not run.** Korokoro throws the dice and says what the game
  makes of them: "a small straight", "8 is the point", "the defender loses 2".
  Whose turn it is, the board and the score sheet stay on your table. The one
  exception is [Dice War](api.md#dice-war), which is run: it is a game with players
  and a score, and nothing else.
- **Turns of several rolls hold dice.** Yahtzee and Ship, captain and crew give
  three rolls: tap dice to hold them between rolls, and the tray counts.
- **A roll is read in the light of the ones before it** where the game does:
  the point in craps, the turn's total in Pig, a third doubles in Monopoly.
- **Exact odds of each outcome**, counted over every way the dice can fall:
  Risk's three against two is 2,890, 2,611 and 2,275 of 7,776.
- **The dice are fair.** A game never loads a die; only you can, and a loaded
  die stays marked whatever game is showing.
- **Nothing about stakes.** The traditional games are here for their dice and
  their odds.

**Is your game missing? [Tell us](https://github.com/johnmorrisdotca/korokoro/issues/new?template=suggest-a-game.md)**,
or add it: a game is one line of data and a test, and
[CONTRIBUTING](../CONTRIBUTING.md#adding-a-game) walks through one.

Game names are trademarks of their owners, used here only to say which game's
dice these are. Korokoro is not affiliated with or endorsed by any of them.

## Dice War

The simplest game there is for dice, and the one game here that is played and
not only read. Two to eight players, any of them a computer. Each round
everybody rolls the same dice, one die unless you say more, and the highest
total scores a point. If two or more tie for highest it is **war**: only the
tied players roll again, the stake grows by a point for each war, and whoever
wins takes everything at stake. The game is played to a score (first to reach
it) or for a number of rounds (the most points when they are up; level, the
win is shared). The points are only points: nothing is staked.

```ts
import { decodeDiceWar, diceWarOdds, diceWarPeopleToRoll, encodeDiceWar, playDiceWar, startDiceWar } from "@johnmorrisdotca/korokoro";

let game = startDiceWar({ players: ["You", "Aiko", "Ben"], computers: [false, true, true], seed: "table", to: 5 })!;
game = playDiceWar(game, { faces: { "0": [4] } })!;   // you rolled a 4 at the table; Aiko and Ben's dice are the seed's
game.scores;                                          // [0, 1, 0]: Aiko took the round
diceWarPeopleToRoll(game);                            // [0]: only you have dice to hand in
decodeDiceWar(encodeDiceWar(game));                   // the same game, read back from its text
diceWarOdds({ players: 3 }).war;                      // 0.2361…: one throw in 4.2 ties for highest
diceWarOdds({ players: 3 }, 4).beats;                 // 0.25: a 4 beats both of the others a quarter of the time
```

- **Pure and seeded.** A computer's dice come from the game's seed, the round,
  the war and the seat, so the same seed and the same dice handed in for the
  people make the same game on any device. A person's dice are what the tray
  (or a real die) showed, handed in as the move. A table of computers needs no
  dice at all: `playDiceWar(game, {})`.
- **Kept as text.** `encodeDiceWar` writes the table, the seed and the moves,
  never a score; `decodeDiceWar` plays every move again and refuses anything
  the rules would not allow, so a changed save is not a game.
- **Exact odds.** `diceWarOdds` works the chance of a war, and how a total
  fares against everybody else's, from the exact odds of the dice
  ([Odds](api.md#odds)), never by simulation.
- **In the tray.** `mountRoller(el, { diceWar: true })` (or `diceWar` on the
  component, `dice-war` on the element) puts it on a shelf of its own in
  **Games**: you and up to seven computers, a scoreboard, the last throw, the odds
  of your roll, and the game as text. The tray's roll is your throw, and the
  computers answer at once, wars included. The tray's dice are the table's, so
  changing them ends the game. It is off unless asked for, so a tray that does not
  want a game is as it was.

| Limit | Value | Constant |
| --- | --- | --- |
| Players | 2 to 8 | `DICE_WAR_LIMITS.fewestPlayers`, `mostPlayers` |
| Dice each | 1 to 10, of 2 to 1000 sides | `DICE_WAR_LIMITS.mostDice`, `MAX_SIDES` |
| A game to a score | 1 to 100 points | `DICE_WAR_LIMITS.mostPoints` |
| A game for rounds | 1 to 200 | `DICE_WAR_LIMITS.mostRounds` |
| Wars in one round | 100, then it is called off with nobody scoring | `DICE_WAR_LIMITS.mostWars` |
