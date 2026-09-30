import { cryptoSource, type RandomSource } from "../random.ts";
import { roll, rollMany, type Roll, type RollSpec } from "../dice.ts";
import { parseNotation } from "../notation.ts";
import { READERS, diceFor, patternsOf, readDiceAs, type Outcome, type ReadingId } from "./readings.ts";
import { READING_WORDS } from "./words.ts";

/** The shelves the games are kept on. */
export type GameFamily = "board" | "dice" | "traditional" | "cards" | "roleplaying" | "handy";

/**
 * The dice for a game, and how the game reads them. A preset is data: a line
 * here, not code. Korokoro rolls and reads the dice; it does not run the game
 * (whose turn it is, a score sheet across rounds).
 */
export type Preset = {
  /** A short name for code, links and the command line: "yahtzee", "cho-han". */
  id: string;
  /** What people call the game. */
  name: string;
  /** The same in Japanese, for the tray. */
  nameJa: string;
  /** Other names it is found by: an older or public-domain name, a name in another language. */
  aliases: string[];
  family: GameFamily;
  /** The dice, as notation. */
  notation: string;
  /** How a roll is read: one of the named readings. */
  reading: ReadingId;
  /** Figures a reading needs: a pool's target number, a game's main. */
  options?: Record<string, number>;
  /** Whether the total is what matters. False where the reading is the result, as in Yahtzee or chō-han. */
  total: boolean;
  /** How many rolls a turn has when dice are held between them: 3 for Yahtzee. Left out when a turn is one roll. */
  rolls?: number;
  /** True where a roll is read in the light of the rolls before it: the point in craps, a turn's total in Pig. */
  runs?: true;
  /** What it is, in a line. */
  says: string;
  /** The same in Japanese. */
  saysJa: string;
  /** How the dice are used in the game, in a few sentences of our own. */
  how: string;
  /** Where the rule can be read. Left out of a preset that has no rule to cite, such as a coin. */
  source?: string;
};

const wiki = (page: string) => `https://en.wikipedia.org/wiki/${page}`;

export const PRESETS: readonly Preset[] = [
  // Board games
  { id: "monopoly", name: "Monopoly", nameJa: "モノポリー", aliases: ["property trading"], family: "board", notation: "2d6", reading: "doubles", options: { third: 1 }, total: true, runs: true, says: "Two dice; doubles roll again, and a third doubles in a row ends the turn.", saysJa: "ダイス2個。ゾロ目ならもう一度、3回続くと手番が終わります。", how: "Roll two dice and move their total. Doubles give another turn after the move. Doubles three times in a row send the player to jail without moving for the third.", source: wiki("Monopoly_(game)") },
  { id: "catan", name: "Catan", nameJa: "カタン", aliases: ["Settlers of Catan", "settlers"], family: "board", notation: "2d6", reading: "robber", total: true, says: "Two dice for which hexes produce; a seven moves the robber.", saysJa: "ダイス2個で資源の出るタイルを決めます。7なら盗賊が動きます。", how: "Two dice are rolled at the start of each turn, and hexes with that number produce. On a seven nothing is produced: the robber moves, and anybody holding eight cards or more discards half. The Odds tab shows why the 6 and the 8 are the numbers to build on.", source: wiki("Catan") },
  { id: "backgammon", name: "Backgammon", nameJa: "バックギャモン", aliases: ["tables"], family: "board", notation: "2d6", reading: "backgammon", total: false, says: "Two dice, each played as a move; doubles are played four times.", saysJa: "ダイス2個をそれぞれ1手として使います。ゾロ目は4回使います。", how: "Each die is a separate move. On doubles each die is played twice, four moves in all.", source: wiki("Backgammon") },
  { id: "doubling-cube", name: "Doubling cube", nameJa: "ダブリングキューブ", aliases: ["backgammon cube"], family: "board", notation: "1d[2,4,8,16,32,64]", reading: "sum", total: true, says: "The cube of 2, 4, 8, 16, 32 and 64, as a die.", saysJa: "2・4・8・16・32・64 のキューブをダイスとして振ります。", how: "In play the cube is turned, not rolled. It is here as a die for anybody who wants a power of two at random.", source: wiki("Backgammon") },
  { id: "snakes-and-ladders", name: "Snakes and Ladders", nameJa: "ヘビとはしご", aliases: ["Chutes and Ladders", "Moksha Patam"], family: "board", notation: "1d6", reading: "sixAgain", total: true, runs: true, says: "One die; a six moves and rolls again.", saysJa: "ダイス1個。6なら進んでもう一度振ります。", how: "Move the number rolled. After a six, the player moves and then rolls again.", source: wiki("Snakes_and_ladders") },
  { id: "ludo", name: "Ludo", nameJa: "ルドー", aliases: ["Parchís", "Mensch ärgere Dich nicht"], family: "board", notation: "1d6", reading: "sixAgain", options: { third: 1 }, total: true, runs: true, says: "One die; a six brings a token out and rolls again, but a third six in a row does not move.", saysJa: "ダイス1個。6でコマを出してもう一度振ります。6が3回続くと進めません。", how: "A six is needed to bring a token into play, and earns another roll. If that is a six there is another; a third six in a row is not moved and the turn passes.", source: wiki("Ludo") },
  { id: "parcheesi", name: "Parcheesi", nameJa: "パーチージ", aliases: ["Parchisi"], family: "board", notation: "2d6", reading: "doubles", total: true, runs: true, says: "Two dice; a five enters a piece, and doubles roll again.", saysJa: "ダイス2個。5でコマを出し、ゾロ目ならもう一度振ります。", how: "A piece leaves the nest on a five, on one die or as the sum of both. Doubles give another roll after moving. Some tables penalise a third doubles in a row.", source: wiki("Parcheesi") },
  { id: "pachisi", name: "Pachisi", nameJa: "パチーシ", aliases: ["Twenty-five", "cowries"], family: "board", notation: "6d[Down=0,Up=1]", reading: "cowries", total: false, says: "Six cowrie shells: the number that land mouth up is the move.", saysJa: "タカラガイ6個を投げ、口が上を向いた数で進みます。", how: "Two to five mouths up move that many squares. Six up moves 6, one up moves 10 and none up moves 25, and each of those three earns a grace: another throw, and leave to bring a piece in.", source: wiki("Pachisi") },
  { id: "risk", name: "Risk", nameJa: "リスク", aliases: ["world conquest", "battle dice"], family: "board", notation: "3d6+2d[1,2,3,4,5,6]", reading: "risk", total: false, says: "Up to three attack dice against up to two defence dice, highest against highest.", saysJa: "攻撃側は最大3個、守備側は最大2個。大きい目どうしを比べます。", how: "The attacker's dice are the pipped ones and the defender's the numbered tiles. The highest of each are compared, then the next highest; the lower die loses an army, and a tie goes to the defender. Take dice away with the chips to fight with fewer.", source: "https://risk.fandom.com/wiki/Risk_Board_Game" },

  // Dice games
  { id: "yahtzee", name: "Yahtzee", nameJa: "ヤッツィー", aliases: ["Yacht", "Generala", "Yatzy"], family: "dice", notation: "5d6", reading: "yahtzee", total: false, rolls: 3, says: "Five dice, three rolls, hold between them; names the combination.", saysJa: "ダイス5個を3回まで振れます。残したいダイスはホールドします。役の名前を表示します。", how: "Roll five dice, tap the ones to keep, and roll the rest, up to three rolls in all. The reading names the best of the lower-section combinations the dice make. It is not a score card: the thirteen boxes are yours to keep.", source: wiki("Yahtzee") },
  { id: "farkle", name: "Farkle", nameJa: "ファークル", aliases: ["Ten Thousand", "10000", "Zilch"], family: "dice", notation: "6d6", reading: "farkle", total: false, says: "Six dice; ones, fives and three of a kind score, and nothing scoring is a farkle.", saysJa: "ダイス6個。1と5、同じ目3個が得点です。得点がなければファークルです。", how: "A one scores 100 and a five 50. Three of a kind scores 100 times the face, and three ones 1,000. If no die scores, the turn's points are lost. Straights, three pairs and larger sets are scored differently from table to table and are not counted here.", source: wiki("Farkle") },
  { id: "bunco", name: "Bunco", nameJa: "バンコ", aliases: ["Bunko", "Bonko"], family: "dice", notation: "3d6", reading: "bunco", total: false, says: "Three dice; a point for each that shows the round's number, and 21 for all three.", saysJa: "ダイス3個。ラウンドの数字と同じ目1個につき1点、3個そろえば21点です。", how: "Six rounds, numbered one to six. A die matching the round's number scores a point. Three of the round's number is a Bunco, 21 points; three of any other number scores 5.", source: wiki("Bunco") },
  { id: "pig", name: "Pig", nameJa: "ピッグ", aliases: [], family: "dice", notation: "1d6", reading: "pig", total: true, runs: true, says: "One die, as often as you dare: a one loses the turn's total.", saysJa: "ダイス1個を好きなだけ振ります。1が出るとその手番の得点を失います。", how: "Each roll of 2 to 6 adds to the turn's total, and the player may hold at any time to bank it. A one ends the turn with nothing. First to 100 wins.", source: wiki("Pig_(dice_game)") },
  { id: "liars-dice", name: "Liar's dice", nameJa: "ライアーズダイス", aliases: ["Perudo", "Dudo"], family: "dice", notation: "5d6", reading: "counts", total: false, says: "A hand of five dice, counted face by face.", saysJa: "ダイス5個の手を、目ごとに数えます。", how: "Each player rolls five dice under a cup and bids on how many of a face are showing under all the cups. Ones are often wild. This rolls one hand; keep the screen to yourself.", source: wiki("Liar%27s_dice") },
  { id: "poker-dice", name: "Poker dice", nameJa: "ポーカーダイス", aliases: [], family: "dice", notation: "5d[9,10,J,Q,K,A]", reading: "pokerDice", total: false, says: "Five dice faced 9, 10, J, Q, K and A; names the hand.", saysJa: "9・10・J・Q・K・A の面を持つダイス5個。役の名前を表示します。", how: "Hands rank from five of a kind down through four of a kind, a full house, a straight, three of a kind, two pair and a pair to a bust. Some older rules count a straight as a bust.", source: wiki("Poker_dice") },
  { id: "ship-captain-crew", name: "Ship, captain and crew", nameJa: "シップ・キャプテン・クルー", aliases: ["6-5-4", "Ship of Fools"], family: "dice", notation: "5d6", reading: "shipCaptainCrew", total: false, rolls: 3, says: "Five dice, three rolls: a 6, then a 5, then a 4, and the other two are the cargo.", saysJa: "ダイス5個を3回まで。6、5、4 の順にそろえ、残り2個が積み荷です。", how: "The ship (6) must be kept before the captain (5), and the captain before the crew (4). With all three, the other two dice are the cargo and the score. Hold the dice you have banked and roll the rest.", source: wiki("Ship,_captain,_and_crew") },
  { id: "shut-the-box", name: "Shut the box", nameJa: "シャット・ザ・ボックス", aliases: ["Canoga"], family: "dice", notation: "2d6", reading: "shutTheBox", total: false, says: "Two dice; lists every set of tiles from 1 to 9 the total may shut.", saysJa: "ダイス2個。合計で閉じられる1〜9の札の組み合わせをすべて表示します。", how: "Shut any open tiles that add up to the total. Once 7, 8 and 9 are all shut a player may roll one die: take one away with its chip.", source: wiki("Shut_the_box") },
  { id: "mexico", name: "Mexico", nameJa: "メキシコ", aliases: ["Mex"], family: "dice", notation: "2d6", reading: "mexico", total: false, says: "Two dice read as one number, the higher die first; 21 is Mexico.", saysJa: "ダイス2個を、大きい目を十の位にして読みます。21がメキシコです。", how: "A 2 and a 1 is Mexico, the highest roll. Doubles come next, from double sixes down, and then the rest from 65 down to 31. The leader may roll up to three times, and only the last roll counts.", source: wiki("Mexico_(game)") },
  { id: "left-center-right", name: "Left Center Right", nameJa: "レフト・センター・ライト", aliases: ["LCR", "Left Right Center"], family: "dice", notation: "3d[L,C,R,Dot,Dot,Dot]", reading: "faces", total: false, says: "Three dice faced L, C, R and three dots.", saysJa: "L・C・R と点3面のダイス3個。", how: "Roll one die for each chip you hold, up to three. An L passes a chip to the left, an R to the right, a C puts one in the centre, and a dot keeps one. Take dice away with the chip when you hold fewer than three.", source: "https://officialgamerules.org/game-rules/left-center-right/" },

  // Casino and traditional games: the roll and how it is read, and nothing about stakes
  { id: "craps", name: "Craps", nameJa: "クラップス", aliases: [], family: "traditional", notation: "2d6", reading: "craps", total: true, runs: true, says: "The come-out, then the point or a seven.", saysJa: "カムアウトのあと、ポイントか7が出るまで振ります。", how: "On the come-out roll a 7 or an 11 is a natural and a 2, 3 or 12 is craps. Any other total becomes the point, and the shooter rolls on until the point comes again or a seven does.", source: wiki("Craps") },
  { id: "sic-bo", name: "Sic bo", nameJa: "大小（シックボー）", aliases: ["Tai sai", "Dai siu", "大小"], family: "traditional", notation: "3d6", reading: "sicBo", total: true, says: "Three dice: big is 11 to 17, small is 4 to 10, and a triple is neither.", saysJa: "ダイス3個。11〜17が大、4〜10が小、ゾロ目はどちらでもありません。", how: "The three dice are totalled. Big and small both leave out the triples.", source: wiki("Sic_bo") },
  { id: "chuck-a-luck", name: "Chuck-a-luck", nameJa: "チャック・ア・ラック", aliases: ["Birdcage"], family: "traditional", notation: "3d6", reading: "counts", total: false, says: "Three dice in a cage: how many times does your number show?", saysJa: "かごの中のダイス3個。選んだ数字がいくつ出たかを見ます。", how: "A player names a number from one to six, and the three dice show it once, twice, three times or not at all.", source: wiki("Chuck-a-luck") },
  { id: "hazard", name: "Hazard", nameJa: "ハザード", aliases: [], family: "traditional", notation: "2d6", reading: "hazard", options: { main: 7 }, total: true, runs: true, says: "The old English game craps came from, played here with a main of seven.", saysJa: "クラップスのもとになったイギリスの古いゲーム。ここではメインを7とします。", how: "The caster names a main from 5 to 9; this preset takes 7. Throwing the main is a nick, and so is an 11 when the main is 7. A 2, a 3 or a 12 is out. Anything else is the chance, and the caster throws on until the chance comes again or the main does.", source: wiki("Hazard_(game)") },
  { id: "cho-han", name: "Chō-han", nameJa: "丁半", aliases: ["丁半", "Cho-han", "Cho-han bakuchi"], family: "traditional", notation: "2d6", reading: "choHan", total: false, says: "Two dice under a cup: chō (丁) is even, han (半) is odd.", saysJa: "ツボの中のダイス2個。合計が偶数なら丁、奇数なら半です。", how: "Two dice are shaken in a bamboo cup and turned over. The call is on the total: chō for even, han for odd.", source: wiki("Ch%C5%8D-han") },
  { id: "chinchirorin", name: "Chinchirorin", nameJa: "チンチロリン", aliases: ["チンチロリン", "Chinchiro", "Cee-lo"], family: "traditional", notation: "3d6", reading: "chinchirorin", total: false, says: "Three dice in a bowl: pinzoro, arashi, shigoro, a pair and its point, hifumi, or no hand.", saysJa: "どんぶりにダイス3個。ピンゾロ、アラシ、シゴロ、目、ヒフミ、目なしを読みます。", how: "Three ones are pinzoro, the best hand, and any other triple is arashi. 4-5-6 is shigoro and 1-2-3 is hifumi. A pair makes the third die the point. Anything else is no hand (menashi), and the dice are thrown again, up to three times.", source: "https://ja.wikipedia.org/wiki/%E3%83%81%E3%83%B3%E3%83%81%E3%83%AD%E3%83%AA%E3%83%B3" },

  // Beside a card table
  { id: "first-player", name: "Who goes first", nameJa: "先攻を決める", aliases: ["first player", "dealer", "high roll"], family: "cards", notation: "4d6", reading: "highest", total: false, says: "One die for each player: the highest goes first, and a tie rolls again.", saysJa: "プレイヤー1人につきダイス1個。いちばん大きい目が先攻、同点なら振り直します。", how: "Set the number of dice to the number of players. The dice are read in order, the first die for the first player. Those who tie for highest roll again among themselves." },

  // Roleplaying games: the dice mechanic only
  { id: "d20", name: "d20 check", nameJa: "d20判定", aliases: ["Dungeons & Dragons", "D&D", "Pathfinder", "ability check", "attack roll", "saving throw"], family: "roleplaying", notation: "1d20", reading: "d20", total: true, says: "A d20 and a bonus, with the natural 20 and the natural 1 called out.", saysJa: "d20に修正値を足します。出目20と出目1を知らせます。", how: "Add the bonus with the stepper. The total is compared with a number the game master has in mind; the Odds tab gives the chance of reaching any target.", source: "https://www.dndbeyond.com/sources/dnd/basic-rules-2014/using-ability-scores" },
  { id: "advantage", name: "Advantage", nameJa: "有利", aliases: ["D&D advantage", "2d20 keep highest"], family: "roleplaying", notation: "2d20kh1", reading: "d20", total: true, says: "Two d20, and the higher one counts.", saysJa: "d20を2個振り、大きいほうを使います。", how: "Roll a second d20 and use the higher of the two.", source: "https://www.dndbeyond.com/sources/dnd/basic-rules-2014/using-ability-scores" },
  { id: "disadvantage", name: "Disadvantage", nameJa: "不利", aliases: ["D&D disadvantage", "2d20 keep lowest"], family: "roleplaying", notation: "2d20kl1", reading: "d20", total: true, says: "Two d20, and the lower one counts.", saysJa: "d20を2個振り、小さいほうを使います。", how: "Roll a second d20 and use the lower of the two.", source: "https://www.dndbeyond.com/sources/dnd/basic-rules-2014/using-ability-scores" },
  { id: "ability-scores", name: "Ability scores", nameJa: "能力値", aliases: ["4d6 drop lowest", "stats", "character creation"], family: "roleplaying", notation: "6#4d6kh3", reading: "scores", total: true, says: "Four d6, drop the lowest, six times over.", saysJa: "d6を4個振って最小の1個を除く、を6回行います。", how: "Roll four six-sided dice and total the highest three. Do it six times, for six numbers to assign.", source: "https://www.dndbeyond.com/sources/dnd/basic-rules-2014/step-by-step-characters" },
  { id: "fate", name: "Fate", nameJa: "フェイト", aliases: ["Fudge", "Fate Core", "4dF"], family: "roleplaying", notation: "4dF", reading: "fate", total: true, says: "Four Fate dice and a skill, read off the ladder.", saysJa: "フェイトダイス4個に技能値を足し、ラダーで読みます。", how: "Each die is a plus, a blank or a minus. Add them to the skill, set with the bonus, and read the total on the ladder from Terrible (−2) to Legendary (+8).", source: "https://fate-srd.com/fate-core/taking-action-dice-ladder" },
  { id: "blades", name: "Blades in the Dark", nameJa: "ブレイズ・イン・ザ・ダーク", aliases: ["Forged in the Dark", "d6 pool highest"], family: "roleplaying", notation: "2d6", reading: "bladesPool", total: false, says: "A pool of d6 read by its highest die; two sixes are a critical.", saysJa: "d6のプールを振り、いちばん大きい目で読みます。6が2個でクリティカルです。", how: "Roll a die for each dot in the action: set how many with the numbers. A 6 does it, a 4 or a 5 does it with a consequence, and 1 to 3 goes badly. More than one 6 is a critical.", source: "https://bladesinthedark.com/action-roll" },
  { id: "pbta", name: "Powered by the Apocalypse", nameJa: "パワード・バイ・ジ・アポカリプス", aliases: ["PbtA", "Apocalypse World", "Dungeon World", "2d6+stat"], family: "roleplaying", notation: "2d6", reading: "pbta", total: true, says: "Two d6 and a stat: 10 or more, 7 to 9, or 6 or less.", saysJa: "d6を2個振って能力値を足します。10以上、7〜9、6以下で読みます。", how: "Add the stat with the bonus. Ten or more is a full success, seven to nine a success at a cost, six or less a miss.", source: wiki("Powered_by_the_Apocalypse") },
  { id: "d10-pool", name: "d10 pool, 8 or more", nameJa: "d10プール（8以上）", aliases: ["Chronicles of Darkness", "World of Darkness", "Storytelling System"], family: "roleplaying", notation: "5d10", reading: "successes", options: { target: 8 }, total: false, says: "A pool of d10; every die showing 8 or more is a success.", saysJa: "d10のプール。8以上の目1個につき成功1です。", how: "Set the size of the pool with the numbers. Each die at 8 or more is a success. Games in the family add rules for tens; write the pool as `5d10!` in the notation box to have tens throw another die.", source: wiki("Storytelling_System") },
  { id: "d6-pool", name: "d6 pool, fives and sixes", nameJa: "d6プール（5と6）", aliases: ["Shadowrun"], family: "roleplaying", notation: "6d6", reading: "hitsAndGlitch", total: false, says: "A pool of d6; fives and sixes are hits, and too many ones are a glitch.", saysJa: "d6のプール。5と6がヒットです。1が多すぎるとグリッチです。", how: "Set the size of the pool with the numbers. Every 5 and 6 is a hit. If more than half the dice show a one, the roll is a glitch.", source: wiki("Shadowrun") },
  { id: "percentile", name: "Percentile check", nameJa: "パーセンテージ判定", aliases: ["Call of Cthulhu", "d100", "BRP", "roll under"], family: "roleplaying", notation: "1d100", reading: "percentile", total: true, says: "A d100 to roll at or under a skill, with the hard and extreme levels.", saysJa: "d100で技能値以下を出します。ハードとイクストリームも表示します。", how: "The roll succeeds against a skill at least as high as the number rolled. It is a hard success against a skill of twice the roll or more, and an extreme one at five times.", source: wiki("Call_of_Cthulhu_(role-playing_game)") },
  { id: "roll-under", name: "3d6, roll under", nameJa: "3d6（技能値以下）", aliases: ["GURPS"], family: "roleplaying", notation: "3d6", reading: "rollUnder", total: true, says: "Three d6 to roll at or under a skill; 3 and 4 are critical, 18 a disaster.", saysJa: "d6を3個振り、技能値以下なら成功です。3と4はクリティカル、18は大失敗です。", how: "The roll succeeds if it is at or under the skill. A 3 or a 4 is always a critical success and an 18 always a critical failure; a 17 is a critical failure too unless the skill is 16 or more.", source: wiki("GURPS") },
  { id: "d66", name: "d66", nameJa: "d66", aliases: ["d66 table"], family: "roleplaying", notation: "2d6", reading: "d66", total: false, says: "Two d6 read as tens and units: 11 to 66.", saysJa: "d6を2個振り、十の位と一の位として読みます（11〜66）。", how: "The first die is the tens and the second the units, for tables of 36 entries. Every number from 11 to 66 without a 7, 8, 9 or 0 in it is as likely as the next." },

  // Handy
  { id: "coin", name: "Coin", nameJa: "コイン", aliases: ["heads or tails", "flip"], family: "handy", notation: "1d[Heads,Tails]", reading: "faces", total: false, says: "Heads or tails.", saysJa: "表か裏か。", how: "A fair coin. Add coins with the numbers." },
  { id: "yes-no-maybe", name: "Yes, no, maybe", nameJa: "はい・いいえ・たぶん", aliases: ["decision die"], family: "handy", notation: "1d[Yes,No,Maybe]", reading: "faces", total: false, says: "A die for deciding.", saysJa: "決めるためのダイス。", how: "Each answer comes up one time in three." },
  { id: "pick-a-number", name: "Pick a number", nameJa: "数字を選ぶ", aliases: ["1 to N", "random number"], family: "handy", notation: "1d10", reading: "sum", total: true, says: "A number from 1 to 10, or to anything up to 1000.", saysJa: "1から10までの数字。1000まで変えられます。", how: "Type another size in the notation box: `d37` picks from 1 to 37." },
  { id: "rock-paper-scissors", name: "Rock, paper, scissors", nameJa: "じゃんけん", aliases: ["janken", "じゃんけん"], family: "handy", notation: "1d[Rock,Paper,Scissors]", reading: "faces", total: false, says: "One throw, or one for each player.", saysJa: "1回分。人数分に増やせます。", how: "Set two dice for two players, and read them in order." },
  { id: "compass", name: "Compass", nameJa: "方位", aliases: ["direction", "scatter"], family: "handy", notation: "1d[N,NE,E,SE,S,SW,W,NW]", reading: "faces", total: false, says: "One of eight directions.", saysJa: "8方位のどれか。", how: "For which way something wanders, drifts or scatters." },
  { id: "colour", name: "Colour die", nameJa: "色ダイス", aliases: ["color die"], family: "handy", notation: "1d[Red#c0392b,Blue#2e6fbd,Green#2f8f4f,Yellow#e0b43b,Purple#8e5bb5,Orange#e07b39]", reading: "faces", total: false, says: "One of six colours.", saysJa: "6色のどれか。", how: "Each face is drawn in its colour." },
];

/** A preset's name, for finding it: lower case, with what is not a letter or a digit taken out. */
const plainName = (text: string) => text.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]/gu, "");

/** A preset by its id, its name or any of its other names: `getPreset("yahtzee")` and `getPreset("Yacht")` are the same game. Undefined when there is none. */
export function getPreset(name: string): Preset | undefined {
  const wanted = plainName(name);
  if (wanted === "") return undefined;
  return PRESETS.find((p) => plainName(p.id) === wanted || plainName(p.name) === wanted) ?? PRESETS.find((p) => plainName(p.nameJa) === wanted || p.aliases.some((a) => plainName(a) === wanted));
}

/** The presets a search finds: every word typed has to be in the name, another name, the one-line description or the notation. An empty search finds them all. */
export function findPresets(search: string): Preset[] {
  const words = search.toLowerCase().normalize("NFKD").split(/\s+/).filter((w) => w !== "");
  return PRESETS.filter((p) => {
    const about = `${p.name} ${p.nameJa} ${p.aliases.join(" ")} ${p.says} ${p.saysJa} ${p.notation} ${p.id}`.toLowerCase().normalize("NFKD");
    return words.every((w) => about.includes(w));
  });
}

/** A preset's dice, as a spec. */
export function presetSpec(preset: Preset): RollSpec {
  return parseNotation(preset.notation) as RollSpec;
}

/** What a game makes of a roll: the outcome, and the words for it. */
export type PresetReading = Outcome & {
  /** The reading in a sentence, in English. Empty for a die that says it all itself, such as a coin. */
  text: string;
};

const fill = (template: string, values: Outcome["values"]) => template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in values ? String(values[name]) : whole));

/**
 * Read a roll the way a game does. `before` is the rolls made just before it
 * in the same game, oldest first, for a game that reads a roll in their
 * light: the point in craps, a turn's total in Pig. `language` is "en" or
 * "ja". The roll may be of other dice than the preset opens with (a pool made
 * larger, a bonus added): it is read all the same.
 */
export function readPreset(preset: Preset, thrown: Roll, before: readonly Roll[] = [], language: "en" | "ja" = "en"): PresetReading {
  const outcome = readDiceAs(preset.reading, thrown, preset.runs === true ? before : [], preset.options ?? {});
  return { ...outcome, text: fill(READING_WORDS[language][`${preset.reading}.${outcome.outcome}`] ?? "", outcome.values) };
}

/** A game's dice thrown and read. */
export type PresetRoll = {
  preset: Preset;
  /** The roll, or for a set such as ability scores, the last roll of it. */
  roll: Roll;
  /** Every roll thrown: one, or a set. */
  rolls: Roll[];
  /** What the game makes of each roll, in order. */
  readings: PresetReading[];
  /** What the game makes of the roll: of the last, for a set. */
  reading: PresetReading;
};

/**
 * Throw a game's dice and read them. `source` is the crypto generator unless
 * a seeded one is given; `before` is the rolls so far in the same game.
 * Throws a RangeError for a name that is no preset.
 */
export function rollPreset(name: string, options: { source?: RandomSource; at?: number; before?: readonly Roll[]; language?: "en" | "ja" } = {}): PresetRoll {
  const preset = getPreset(name);
  if (preset === undefined) throw new RangeError(`korokoro: no game is called “${name}”`);
  const spec = presetSpec(preset);
  const source = options.source ?? cryptoSource();
  const rolls = (spec.times ?? 1) > 1 ? rollMany(spec, spec.times, source, options.at).rolls : [roll(spec, source, options.at)];
  const readings = rolls.map((r, i) => readPreset(preset, r, [...(options.before ?? []), ...rolls.slice(0, i)], options.language));
  return { preset, roll: rolls.at(-1) as Roll, rolls, readings, reading: readings.at(-1) as PresetReading };
}

/** One line of a game's odds: an outcome, the words for it, and its chance as a whole-number count of the equally likely throws. */
export type OutcomeOdds = {
  outcome: string;
  /** The outcome in words, with its figures left as they were first seen: "Three of a kind". */
  text: string;
  /** How many of the throws come out this way. */
  ways: bigint;
  /** How many throws there are. */
  outOf: bigint;
  /** The same as a chance. */
  chance: number;
};

/**
 * The exact odds of each outcome of a game's first roll: a natural in craps,
 * each hand in chinchirorin, each result of a Risk battle. Every way the dice
 * can fall is counted, in whole numbers. `spec` is the preset's own dice
 * unless others are given (a larger pool, fewer battle dice).
 *
 * Null where there is nothing to count: a reading that is only the total,
 * whose odds `distributionOf` gives; a reading that depends on the order of
 * the dice; or dice that are rerolled or explode.
 */
export function presetOdds(preset: Preset, spec: RollSpec = presetSpec(preset), language: "en" | "ja" = "en"): OutcomeOdds[] | null {
  if (["sum", "scores", "faces", "d66", "counts", "shutTheBox", "percentile", "highest"].includes(preset.reading)) return null;
  const patterns = patternsOf({ ...spec, times: undefined } as RollSpec);
  if (patterns === null) return null;
  const read = READERS[preset.reading] as (dice: ReturnType<typeof diceFor>, before: never[], options: Record<string, number>) => Outcome;
  const tally = new Map<string, { values: Outcome["values"]; ways: bigint }>();
  let outOf = 0n;
  for (const { dice, ways } of patterns) {
    const outcome = read(dice, [], preset.options ?? {});
    // Outcomes that differ only in a figure are one line: every total that is "the point", every face that is a triple.
    const key = GROUPED.has(`${preset.reading}.${outcome.outcome}`) ? outcome.outcome : `${outcome.outcome}|${JSON.stringify(outcome.values)}`;
    const line = tally.get(key) ?? { values: outcome.values, ways: 0n };
    line.ways += ways;
    tally.set(key, line);
    outOf += ways;
  }
  // An outcome with one line is named plainly; one with several (three successes, four successes) is named with its figures.
  const lines = [...tally].map(([key, line]) => ({ name: key.split("|")[0] as string, line }));
  return lines.map(({ name, line }) => {
    const grouped = GROUPED.has(`${preset.reading}.${name}`);
    const alone = lines.filter((l) => l.name === name).length === 1;
    const words = (grouped ? GROUP_WORDS[language][`${preset.reading}.${name}`] : undefined) ?? fill(READING_WORDS[language][`${preset.reading}.${name}` as keyof (typeof READING_WORDS)["en"]] ?? name, line.values);
    return { outcome: alone ? name : `${name}:${Object.values(line.values).join(",")}`, text: words, ways: line.ways, outOf, chance: Number(line.ways) / Number(outOf) };
  });
}

/** Outcomes whose odds are given as one line whatever their figures. */
const GROUPED = new Set([
  "doubles.total", "doubles.doubles", "robber.total", "backgammon.moves", "backgammon.doubles", "sixAgain.move", "craps.natural", "craps.craps", "craps.point",
  "hazard.nick", "hazard.out", "hazard.chance", "yahtzee.yahtzee", "yahtzee.four", "yahtzee.three", "yahtzee.chance", "farkle.scores", "bunco.three", "bunco.count",
  "pig.turn", "shipCaptainCrew.crew", "mexico.doubles", "mexico.number", "sicBo.big", "sicBo.small", "sicBo.triple", "choHan.cho", "choHan.han", "chinchirorin.arashi",
  "chinchirorin.point", "d20.natural20", "d20.natural1", "d20.total", "bladesPool.partial", "bladesPool.bad", "pbta.strong", "pbta.weak", "pbta.miss", "rollUnder.under",
  "rollUnder.critical", "rollUnder.fail", "rollUnder.fumble", "cowries.move", "cowries.grace",
]);

/** The words for a line of odds that gathers several figures. */
const GROUP_WORDS: { en: Record<string, string>; ja: Record<string, string> } = {
  en: {
    "doubles.total": "No doubles", "doubles.doubles": "Doubles", "robber.total": "Any other total", "backgammon.moves": "Two different numbers", "backgammon.doubles": "Doubles", "sixAgain.move": "One to five",
    "craps.natural": "A natural (7 or 11)", "craps.craps": "Craps (2, 3 or 12)", "craps.point": "A point (4, 5, 6, 8, 9 or 10)", "hazard.nick": "A nick", "hazard.out": "Out", "hazard.chance": "A chance",
    "yahtzee.yahtzee": "Yahtzee", "yahtzee.four": "Four of a kind", "yahtzee.three": "Three of a kind", "yahtzee.chance": "Nothing but chance", "farkle.scores": "Something scores", "bunco.three": "Three alike", "bunco.count": "Anything else",
    "pig.turn": "Two to six", "shipCaptainCrew.crew": "Ship, captain and crew", "mexico.doubles": "Doubles", "mexico.number": "Anything else", "sicBo.big": "Big", "sicBo.small": "Small", "sicBo.triple": "A triple",
    "choHan.cho": "Chō (even)", "choHan.han": "Han (odd)", "chinchirorin.arashi": "Arashi (a triple but ones)", "chinchirorin.point": "A pair and a point", "d20.natural20": "A natural 20", "d20.natural1": "A natural 1", "d20.total": "Anything else",
    "bladesPool.partial": "A 4 or a 5 at best", "bladesPool.bad": "A 3 at best", "pbta.strong": "10 or more", "pbta.weak": "7 to 9", "pbta.miss": "6 or less", "rollUnder.under": "5 to 16: a success at that skill or more", "rollUnder.critical": "3 or 4: always a critical success", "rollUnder.fail": "17: a failure", "rollUnder.fumble": "18: always a critical failure",
    "cowries.move": "Two to five up", "cowries.grace": "None, one or six up: a grace",
  },
  ja: {
    "doubles.total": "ゾロ目以外", "doubles.doubles": "ゾロ目", "robber.total": "7以外", "backgammon.moves": "異なる2つの目", "backgammon.doubles": "ゾロ目", "sixAgain.move": "1〜5",
    "craps.natural": "ナチュラル（7か11）", "craps.craps": "クラップス（2・3・12）", "craps.point": "ポイント（4・5・6・8・9・10）", "hazard.nick": "ニック", "hazard.out": "アウト", "hazard.chance": "チャンス",
    "yahtzee.yahtzee": "ヤッツィー", "yahtzee.four": "フォーカード", "yahtzee.three": "スリーカード", "yahtzee.chance": "チャンスのみ", "farkle.scores": "得点あり", "bunco.three": "3個そろい", "bunco.count": "それ以外",
    "pig.turn": "2〜6", "shipCaptainCrew.crew": "船・船長・乗組員", "mexico.doubles": "ゾロ目", "mexico.number": "それ以外", "sicBo.big": "大", "sicBo.small": "小", "sicBo.triple": "ゾロ目",
    "choHan.cho": "丁（偶数）", "choHan.han": "半（奇数）", "chinchirorin.arashi": "アラシ（1以外のゾロ目）", "chinchirorin.point": "ペアと目", "d20.natural20": "出目20", "d20.natural1": "出目1", "d20.total": "それ以外",
    "bladesPool.partial": "最大が4か5", "bladesPool.bad": "最大が3以下", "pbta.strong": "10以上", "pbta.weak": "7〜9", "pbta.miss": "6以下", "rollUnder.under": "5〜16: 技能値がその数以上なら成功", "rollUnder.critical": "3か4: 必ずクリティカル成功", "rollUnder.fail": "17: 失敗", "rollUnder.fumble": "18: 必ずクリティカル失敗",
    "cowries.move": "表が2〜5個", "cowries.grace": "表が0・1・6個（もう一度）",
  },
};
