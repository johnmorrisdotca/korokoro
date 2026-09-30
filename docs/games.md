# Games

Made from `src/games/presets.ts` by `pnpm docs:make`; a test fails if the two differ, so this page is never out of date.

Korokoro knows the dice of 44 games: which dice are thrown, and how the game reads them. Choose one under **Games** in the tray,
open it by a link (`?game=yahtzee`), or call `rollPreset("yahtzee")`. Any of a game's names finds it.

**Korokoro rolls and reads the dice; it does not run the game.** Whose turn it is, the board and the score sheet stay on your table.
The odds are exact: every way the dice can fall is counted, never sampled.

**Is your game missing? [Tell us](https://github.com/johnmorrisdotca/korokoro/issues/new?template=suggest-a-game.md).** A game is one line of data
and a test; [CONTRIBUTING](../CONTRIBUTING.md#adding-a-game) shows how.

Game names are trademarks of their owners and are used here only to say which game's dice these are. Korokoro is not affiliated with
or endorsed by any of them. The rules are described in our own words, with a link to where each can be read.

- [Board games](#board-games): Monopoly, Catan, Backgammon, Doubling cube, Snakes and Ladders, Ludo, Parcheesi, Pachisi, Risk
- [Dice games](#dice-games): Yahtzee, Farkle, Bunco, Pig, Liar's dice, Poker dice, Ship, captain and crew, Shut the box, Mexico, Left Center Right
- [Traditional games](#traditional-games): Craps, Sic bo, Chuck-a-luck, Hazard, Chō-han, Chinchirorin
- [Beside a card table](#beside-a-card-table): Who goes first
- [Roleplaying games](#roleplaying-games): d20 check, Advantage, Disadvantage, Ability scores, Fate, Blades in the Dark, Powered by the Apocalypse, d10 pool, 8 or more, d6 pool, fives and sixes, Percentile check, 3d6, roll under, d66
- [Handy dice](#handy-dice): Coin, Yes, no, maybe, Pick a number, Rock, paper, scissors, Compass, Colour die

## Board games

### Monopoly

`monopoly` · dice `2d6` · モノポリー · also found as property trading

Two dice; doubles roll again, and a third doubles in a row ends the turn.

Roll two dice and move their total. Doubles give another turn after the move. Doubles three times in a row send the player to jail without moving for the third.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| No doubles | 83.3% | 30 of 36 |
| Doubles | 16.7% | 6 of 36 |

Rules: <https://en.wikipedia.org/wiki/Monopoly_(game)>

### Catan

`catan` · dice `2d6` · カタン · also found as Settlers of Catan, settlers

Two dice for which hexes produce; a seven moves the robber.

Two dice are rolled at the start of each turn, and hexes with that number produce. On a seven nothing is produced: the robber moves, and anybody holding eight cards or more discards half. The Odds tab shows why the 6 and the 8 are the numbers to build on.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| Any other total | 83.3% | 30 of 36 |
| Seven: the robber moves | 16.7% | 6 of 36 |

Rules: <https://en.wikipedia.org/wiki/Catan>

### Backgammon

`backgammon` · dice `2d6` · バックギャモン · also found as tables

Two dice, each played as a move; doubles are played four times.

Each die is a separate move. On doubles each die is played twice, four moves in all.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| Two different numbers | 83.3% | 30 of 36 |
| Doubles | 16.7% | 6 of 36 |

Rules: <https://en.wikipedia.org/wiki/Backgammon>

### Doubling cube

`doubling-cube` · dice `1d[2,4,8,16,32,64]` · ダブリングキューブ · also found as backgammon cube

The cube of 2, 4, 8, 16, 32 and 64, as a die.

In play the cube is turned, not rolled. It is here as a die for anybody who wants a power of two at random.

Totals run from 2 to 64, 21 on average; the likeliest are all as likely as each other, at 16.7% each.

Rules: <https://en.wikipedia.org/wiki/Backgammon>

### Snakes and Ladders

`snakes-and-ladders` · dice `1d6` · ヘビとはしご · also found as Chutes and Ladders, Moksha Patam

One die; a six moves and rolls again.

Move the number rolled. After a six, the player moves and then rolls again.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| One to five | 83.3% | 5 of 6 |
| A six: move, and roll again | 16.7% | 1 of 6 |

Rules: <https://en.wikipedia.org/wiki/Snakes_and_ladders>

### Ludo

`ludo` · dice `1d6` · ルドー · also found as Parchís, Mensch ärgere Dich nicht

One die; a six brings a token out and rolls again, but a third six in a row does not move.

A six is needed to bring a token into play, and earns another roll. If that is a six there is another; a third six in a row is not moved and the turn passes.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| One to five | 83.3% | 5 of 6 |
| A six: move, and roll again | 16.7% | 1 of 6 |

Rules: <https://en.wikipedia.org/wiki/Ludo>

### Parcheesi

`parcheesi` · dice `2d6` · パーチージ · also found as Parchisi

Two dice; a five enters a piece, and doubles roll again.

A piece leaves the nest on a five, on one die or as the sum of both. Doubles give another roll after moving. Some tables penalise a third doubles in a row.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| No doubles | 83.3% | 30 of 36 |
| Doubles | 16.7% | 6 of 36 |

Rules: <https://en.wikipedia.org/wiki/Parcheesi>

### Pachisi

`pachisi` · dice `6d[Down=0,Up=1]` · パチーシ · also found as Twenty-five, cowries

Six cowrie shells: the number that land mouth up is the move.

Two to five mouths up move that many squares. Six up moves 6, one up moves 10 and none up moves 25, and each of those three earns a grace: another throw, and leave to bring a piece in.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| Two to five up | 87.5% | 56 of 64 |
| None, one or six up: a grace | 12.5% | 8 of 64 |

Rules: <https://en.wikipedia.org/wiki/Pachisi>

### Risk

`risk` · dice `3d6+2d[1,2,3,4,5,6]` · リスク · also found as world conquest, battle dice

Up to three attack dice against up to two defence dice, highest against highest.

The attacker's dice are the pipped ones and the defender's the numbered tiles. The highest of each are compared, then the next highest; the lower die loses an army, and a tie goes to the defender. Take dice away with the chips to fight with fewer.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| The defender loses 2 | 37.2% | 2890 of 7776 |
| Each side loses 1 | 33.6% | 2611 of 7776 |
| The attacker loses 2 | 29.3% | 2275 of 7776 |

Rules: <https://risk.fandom.com/wiki/Risk_Board_Game>

## Dice games

### Yahtzee

`yahtzee` · dice `5d6` · ヤッツィー · also found as Yacht, Generala, Yatzy

Five dice, three rolls, hold between them; names the combination.

Roll five dice, tap the ones to keep, and roll the rest, up to three rolls in all. The reading names the best of the lower-section combinations the dice make. It is not a score card: the thirteen boxes are yours to keep.

A turn is up to 3 rolls, and the tray holds the dice you tap between them.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| Nothing but chance | 63.3% | 4920 of 7776 |
| Three of a kind | 15.4% | 1200 of 7776 |
| A small straight | 12.3% | 960 of 7776 |
| A full house | 3.9% | 300 of 7776 |
| A large straight | 3.1% | 240 of 7776 |
| Four of a kind | 1.9% | 150 of 7776 |
| Yahtzee | 0.08% | 6 of 7776 |
| A Yahtzee within the three rolls, holding the most of a kind each time | 4.6% | 347897 of 7558272 |

Rules: <https://en.wikipedia.org/wiki/Yahtzee>

### Farkle

`farkle` · dice `6d6` · ファークル · also found as Ten Thousand, 10000, Zilch

Six dice; ones, fives and three of a kind score, and nothing scoring is a farkle.

A one scores 100 and a five 50. Three of a kind scores 100 times the face, and three ones 1,000. If no die scores, the turn's points are lost. Straights, three pairs and larger sets are scored differently from table to table and are not counted here.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| Something scores | 96.9% | 45216 of 46656 |
| Farkle: nothing scores | 3.1% | 1440 of 46656 |

Rules: <https://en.wikipedia.org/wiki/Farkle>

### Bunco

`bunco` · dice `3d6` · バンコ · also found as Bunko, Bonko

Three dice; a point for each that shows the round's number, and 21 for all three.

Six rounds, numbered one to six. A die matching the round's number scores a point. Three of the round's number is a Bunco, 21 points; three of any other number scores 5.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| Anything else | 97.2% | 210 of 216 |
| Three alike | 2.8% | 6 of 216 |

Rules: <https://en.wikipedia.org/wiki/Bunco>

### Pig

`pig` · dice `1d6` · ピッグ

One die, as often as you dare: a one loses the turn's total.

Each roll of 2 to 6 adds to the turn's total, and the player may hold at any time to bank it. A one ends the turn with nothing. First to 100 wins.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| Two to six | 83.3% | 5 of 6 |
| A one: the turn scores nothing | 16.7% | 1 of 6 |

Rules: <https://en.wikipedia.org/wiki/Pig_(dice_game)>

### Liar's dice

`liars-dice` · dice `5d6` · ライアーズダイス · also found as Perudo, Dudo

A hand of five dice, counted face by face.

Each player rolls five dice under a cup and bids on how many of a face are showing under all the cups. Ones are often wild. This rolls one hand; keep the screen to yourself.

Rules: <https://en.wikipedia.org/wiki/Liar%27s_dice>

### Poker dice

`poker-dice` · dice `5d[9,10,J,Q,K,A]` · ポーカーダイス

Five dice faced 9, 10, J, Q, K and A; names the hand.

Hands rank from five of a kind down through four of a kind, a full house, a straight, three of a kind, two pair and a pair to a bust. Some older rules count a straight as a bust.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| A pair | 46.3% | 3600 of 7776 |
| Two pair | 23.1% | 1800 of 7776 |
| Three of a kind | 15.4% | 1200 of 7776 |
| A bust | 6.2% | 480 of 7776 |
| A full house | 3.9% | 300 of 7776 |
| A straight | 3.1% | 240 of 7776 |
| Four of a kind | 1.9% | 150 of 7776 |
| Five of a kind | 0.08% | 6 of 7776 |

Rules: <https://en.wikipedia.org/wiki/Poker_dice>

### Ship, captain and crew

`ship-captain-crew` · dice `5d6` · シップ・キャプテン・クルー · also found as 6-5-4, Ship of Fools

Five dice, three rolls: a 6, then a 5, then a 4, and the other two are the cargo.

The ship (6) must be kept before the captain (5), and the captain before the crew (4). With all three, the other two dice are the cargo and the score. Hold the dice you have banked and roll the rest.

A turn is up to 3 rolls, and the tray holds the dice you tap between them.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| No ship yet: a 6 is needed | 40.2% | 3125 of 7776 |
| A ship: a 5 is needed for the captain | 27.0% | 2101 of 7776 |
| Ship and captain: a 4 is needed for the crew | 17.0% | 1320 of 7776 |
| Ship, captain and crew | 15.8% | 1230 of 7776 |

Rules: <https://en.wikipedia.org/wiki/Ship,_captain,_and_crew>

### Shut the box

`shut-the-box` · dice `2d6` · シャット・ザ・ボックス · also found as Canoga

Two dice; lists every set of tiles from 1 to 9 the total may shut.

Shut any open tiles that add up to the total. Once 7, 8 and 9 are all shut a player may roll one die: take one away with its chip.

Rules: <https://en.wikipedia.org/wiki/Shut_the_box>

### Mexico

`mexico` · dice `2d6` · メキシコ · also found as Mex

Two dice read as one number, the higher die first; 21 is Mexico.

A 2 and a 1 is Mexico, the highest roll. Doubles come next, from double sixes down, and then the rest from 65 down to 31. The leader may roll up to three times, and only the last roll counts.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| Anything else | 77.8% | 28 of 36 |
| Doubles | 16.7% | 6 of 36 |
| Mexico | 5.6% | 2 of 36 |

Rules: <https://en.wikipedia.org/wiki/Mexico_(game)>

### Left Center Right

`left-center-right` · dice `3d[L,C,R,Dot,Dot,Dot]` · レフト・センター・ライト · also found as LCR, Left Right Center

Three dice faced L, C, R and three dots.

Roll one die for each chip you hold, up to three. An L passes a chip to the left, an R to the right, a C puts one in the centre, and a dot keeps one. Take dice away with the chip when you hold fewer than three.

Rules: <https://officialgamerules.org/game-rules/left-center-right/>

## Traditional games

### Craps

`craps` · dice `2d6` · クラップス

The come-out, then the point or a seven.

On the come-out roll a 7 or an 11 is a natural and a 2, 3 or 12 is craps. Any other total becomes the point, and the shooter rolls on until the point comes again or a seven does.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| A point (4, 5, 6, 8, 9 or 10) | 66.7% | 24 of 36 |
| A natural (7 or 11) | 22.2% | 8 of 36 |
| Craps (2, 3 or 12) | 11.1% | 4 of 36 |
| The shooter passes: a natural, or the point before a seven | 49.3% | 244 of 495 |

Rules: <https://en.wikipedia.org/wiki/Craps>

### Sic bo

`sic-bo` · dice `3d6` · 大小（シックボー） · also found as Tai sai, Dai siu, 大小

Three dice: big is 11 to 17, small is 4 to 10, and a triple is neither.

The three dice are totalled. Big and small both leave out the triples.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| Big | 48.6% | 105 of 216 |
| Small | 48.6% | 105 of 216 |
| A triple | 2.8% | 6 of 216 |

Rules: <https://en.wikipedia.org/wiki/Sic_bo>

### Chuck-a-luck

`chuck-a-luck` · dice `3d6` · チャック・ア・ラック · also found as Birdcage

Three dice in a cage: how many times does your number show?

A player names a number from one to six, and the three dice show it once, twice, three times or not at all.

Rules: <https://en.wikipedia.org/wiki/Chuck-a-luck>

### Hazard

`hazard` · dice `2d6` · ハザード

The old English game craps came from, played here with a main of seven.

The caster names a main from 5 to 9; this preset takes 7. Throwing the main is a nick, and so is an 11 when the main is 7. A 2, a 3 or a 12 is out. Anything else is the chance, and the caster throws on until the chance comes again or the main does.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| A chance | 66.7% | 24 of 36 |
| A nick | 22.2% | 8 of 36 |
| Out | 11.1% | 4 of 36 |

Rules: <https://en.wikipedia.org/wiki/Hazard_(game)>

### Chō-han

`cho-han` · dice `2d6` · 丁半 · also found as 丁半, Cho-han, Cho-han bakuchi

Two dice under a cup: chō (丁) is even, han (半) is odd.

Two dice are shaken in a bamboo cup and turned over. The call is on the total: chō for even, han for odd.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| Chō (even) | 50.0% | 18 of 36 |
| Han (odd) | 50.0% | 18 of 36 |

Rules: <https://en.wikipedia.org/wiki/Ch%C5%8D-han>

### Chinchirorin

`chinchirorin` · dice `3d6` · チンチロリン · also found as チンチロリン, Chinchiro, Cee-lo

Three dice in a bowl: pinzoro, arashi, shigoro, a pair and its point, hifumi, or no hand.

Three ones are pinzoro, the best hand, and any other triple is arashi. 4-5-6 is shigoro and 1-2-3 is hifumi. A pair makes the third die the point. Anything else is no hand (menashi), and the dice are thrown again, up to three times.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| Menashi: no hand, so throw again, up to three times | 50.0% | 108 of 216 |
| A pair and a point | 41.7% | 90 of 216 |
| Shigoro: 4, 5, 6 | 2.8% | 6 of 216 |
| Hifumi: 1, 2, 3 | 2.8% | 6 of 216 |
| Arashi (a triple but ones) | 2.3% | 5 of 216 |
| Pinzoro: three ones, the best hand | 0.46% | 1 of 216 |
| A hand within three throws | 87.5% | 7 of 8 |

Rules: <https://ja.wikipedia.org/wiki/%E3%83%81%E3%83%B3%E3%83%81%E3%83%AD%E3%83%AA%E3%83%B3>

## Beside a card table

### Who goes first

`first-player` · dice `4d6` · 先攻を決める · also found as first player, dealer, high roll

One die for each player: the highest goes first, and a tie rolls again.

Set the number of dice to the number of players. The dice are read in order, the first die for the first player. Those who tie for highest roll again among themselves.

No rule to cite: the dice say it all.

## Roleplaying games

### d20 check

`d20` · dice `1d20` · d20判定 · also found as Dungeons & Dragons, D&D, Pathfinder, ability check, attack roll, saving throw

A d20 and a bonus, with the natural 20 and the natural 1 called out.

Add the bonus with the stepper. The total is compared with a number the game master has in mind; the Odds tab gives the chance of reaching any target.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| Anything else | 90.0% | 18 of 20 |
| A natural 20 | 5.0% | 1 of 20 |
| A natural 1 | 5.0% | 1 of 20 |

Rules: <https://www.dndbeyond.com/sources/dnd/basic-rules-2014/using-ability-scores>

### Advantage

`advantage` · dice `2d20kh1` · 有利 · also found as D&D advantage, 2d20 keep highest

Two d20, and the higher one counts.

Roll a second d20 and use the higher of the two.

Totals run from 1 to 20, 13.83 on average; the likeliest is 20, at 9.8%.

Rules: <https://www.dndbeyond.com/sources/dnd/basic-rules-2014/using-ability-scores>

### Disadvantage

`disadvantage` · dice `2d20kl1` · 不利 · also found as D&D disadvantage, 2d20 keep lowest

Two d20, and the lower one counts.

Roll a second d20 and use the lower of the two.

Totals run from 1 to 20, 7.17 on average; the likeliest is 1, at 9.8%.

Rules: <https://www.dndbeyond.com/sources/dnd/basic-rules-2014/using-ability-scores>

### Ability scores

`ability-scores` · dice `6#4d6kh3` · 能力値 · also found as 4d6 drop lowest, stats, character creation

Four d6, drop the lowest, six times over.

Roll four six-sided dice and total the highest three. Do it six times, for six numbers to assign.

Totals run from 3 to 18, 12.24 on average for each of the 6 rolls; the likeliest is 13, at 13.3%.

Rules: <https://www.dndbeyond.com/sources/dnd/basic-rules-2014/step-by-step-characters>

### Fate

`fate` · dice `4dF` · フェイト · also found as Fudge, Fate Core, 4dF

Four Fate dice and a skill, read off the ladder.

Each die is a plus, a blank or a minus. Add them to the skill, set with the bonus, and read the total on the ladder from Terrible (−2) to Legendary (+8).

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| Mediocre (0) | 23.5% | 19 of 81 |
| Average (+1) | 19.8% | 16 of 81 |
| Poor (-1) | 19.8% | 16 of 81 |
| Fair (+2) | 12.3% | 10 of 81 |
| Terrible (-2) | 12.3% | 10 of 81 |
| Good (+3) | 4.9% | 4 of 81 |
| -3: below the foot of the ladder | 4.9% | 4 of 81 |
| Great (+4) | 1.2% | 1 of 81 |
| -4: below the foot of the ladder | 1.2% | 1 of 81 |

Rules: <https://fate-srd.com/fate-core/taking-action-dice-ladder>

### Blades in the Dark

`blades` · dice `2d6` · ブレイズ・イン・ザ・ダーク · also found as Forged in the Dark, d6 pool highest

A pool of d6 read by its highest die; two sixes are a critical.

Roll a die for each dot in the action: set how many with the numbers. A 6 does it, a 4 or a 5 does it with a consequence, and 1 to 3 goes badly. More than one 6 is a critical.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| A 4 or a 5 at best | 44.4% | 16 of 36 |
| A 6: you do it | 27.8% | 10 of 36 |
| A 3 at best | 25.0% | 9 of 36 |
| A critical: you do it with increased effect | 2.8% | 1 of 36 |

Rules: <https://bladesinthedark.com/action-roll>

### Powered by the Apocalypse

`pbta` · dice `2d6` · パワード・バイ・ジ・アポカリプス · also found as PbtA, Apocalypse World, Dungeon World, 2d6+stat

Two d6 and a stat: 10 or more, 7 to 9, or 6 or less.

Add the stat with the bonus. Ten or more is a full success, seven to nine a success at a cost, six or less a miss.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| 7 to 9 | 41.7% | 15 of 36 |
| 6 or less | 41.7% | 15 of 36 |
| 10 or more | 16.7% | 6 of 36 |

Rules: <https://en.wikipedia.org/wiki/Powered_by_the_Apocalypse>

### d10 pool, 8 or more

`d10-pool` · dice `5d10` · d10プール（8以上） · also found as Chronicles of Darkness, World of Darkness, Storytelling System

A pool of d10; every die showing 8 or more is a success.

Set the size of the pool with the numbers. Each die at 8 or more is a success. Games in the family add rules for tens; write the pool as `5d10!` in the notation box to have tens throw another die.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| 1 success | 36.0% | 36015 of 100000 |
| 2 successes | 30.9% | 30870 of 100000 |
| No successes | 16.8% | 16807 of 100000 |
| 3 successes | 13.2% | 13230 of 100000 |
| 4 successes | 2.8% | 2835 of 100000 |
| 5 successes | 0.24% | 243 of 100000 |

Rules: <https://en.wikipedia.org/wiki/Storytelling_System>

### d6 pool, fives and sixes

`d6-pool` · dice `6d6` · d6プール（5と6） · also found as Shadowrun

A pool of d6; fives and sixes are hits, and too many ones are a glitch.

Set the size of the pool with the numbers. Every 5 and 6 is a hit. If more than half the dice show a one, the roll is a glitch.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| 2 hits | 32.8% | 15300 of 46656 |
| 1 hit | 25.9% | 12096 of 46656 |
| 3 hits | 21.9% | 10240 of 46656 |
| No hits | 8.4% | 3942 of 46656 |
| 4 hits | 8.2% | 3840 of 46656 |
| 5 hits | 1.6% | 768 of 46656 |
| A glitch (hits: 1): more than half the dice show a one | 0.41% | 192 of 46656 |
| A glitch (hits: 0): more than half the dice show a one | 0.33% | 154 of 46656 |
| 6 hits | 0.14% | 64 of 46656 |
| A glitch (hits: 2): more than half the dice show a one | 0.13% | 60 of 46656 |

Rules: <https://en.wikipedia.org/wiki/Shadowrun>

### Percentile check

`percentile` · dice `1d100` · パーセンテージ判定 · also found as Call of Cthulhu, d100, BRP, roll under

A d100 to roll at or under a skill, with the hard and extreme levels.

The roll succeeds against a skill at least as high as the number rolled. It is a hard success against a skill of twice the roll or more, and an extreme one at five times.

Totals run from 1 to 100, 50.5 on average; the likeliest are all as likely as each other, at 1.0% each.

Rules: <https://en.wikipedia.org/wiki/Call_of_Cthulhu_(role-playing_game)>

### 3d6, roll under

`roll-under` · dice `3d6` · 3d6（技能値以下） · also found as GURPS

Three d6 to roll at or under a skill; 3 and 4 are critical, 18 a disaster.

The roll succeeds if it is at or under the skill. A 3 or a 4 is always a critical success and an 18 always a critical failure; a 17 is a critical failure too unless the skill is 16 or more.

| A roll comes out | Chance | Ways |
| --- | ---: | ---: |
| 5 to 16: a success at that skill or more | 96.3% | 208 of 216 |
| 3 or 4: always a critical success | 1.9% | 4 of 216 |
| 17: a failure | 1.4% | 3 of 216 |
| 18: always a critical failure | 0.46% | 1 of 216 |

Rules: <https://en.wikipedia.org/wiki/GURPS>

### d66

`d66` · dice `2d6` · d66 · also found as d66 table

Two d6 read as tens and units: 11 to 66.

The first die is the tens and the second the units, for tables of 36 entries. Every number from 11 to 66 without a 7, 8, 9 or 0 in it is as likely as the next.

No rule to cite: the dice say it all.

## Handy dice

### Coin

`coin` · dice `1d[Heads,Tails]` · コイン · also found as heads or tails, flip

Heads or tails.

A fair coin. Add coins with the numbers.

No rule to cite: the dice say it all.

### Yes, no, maybe

`yes-no-maybe` · dice `1d[Yes,No,Maybe]` · はい・いいえ・たぶん · also found as decision die

A die for deciding.

Each answer comes up one time in three.

No rule to cite: the dice say it all.

### Pick a number

`pick-a-number` · dice `1d10` · 数字を選ぶ · also found as 1 to N, random number

A number from 1 to 10, or to anything up to 1000.

Type another size in the notation box: `d37` picks from 1 to 37.

Totals run from 1 to 10, 5.5 on average; the likeliest are all as likely as each other, at 10.0% each.

No rule to cite: the dice say it all.

### Rock, paper, scissors

`rock-paper-scissors` · dice `1d[Rock,Paper,Scissors]` · じゃんけん · also found as janken, じゃんけん

One throw, or one for each player.

Set two dice for two players, and read them in order.

No rule to cite: the dice say it all.

### Compass

`compass` · dice `1d[N,NE,E,SE,S,SW,W,NW]` · 方位 · also found as direction, scatter

One of eight directions.

For which way something wanders, drifts or scatters.

No rule to cite: the dice say it all.

### Colour die

`colour` · dice `1d[Red#c0392b,Blue#2e6fbd,Green#2f8f4f,Yellow#e0b43b,Purple#8e5bb5,Orange#e07b39]` · 色ダイス · also found as color die

One of six colours.

Each face is drawn in its colour.

No rule to cite: the dice say it all.
