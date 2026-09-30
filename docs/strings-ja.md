# The tray's words, in English and Japanese

Made from `src/ui/strings.ts` by `pnpm docs:make`; a test fails if the two differ, so this list is never out of date.

**The Japanese has not yet been reviewed by a native reader.** If a line reads wrongly or unnaturally, please
open a *Fix a translation* issue with the string's name. `{n}` and the other braces are filled in when shown.

| Name | English | Japanese |
| --- | --- | --- |
| `dice` | Dice | ダイスの数 |
| `die` | Die | 種類 |
| `modifier` | Bonus | 修正値 |
| `keep` | Keep | 採用 |
| `keepAll` | All | すべて |
| `keepHighest` | Highest | 最大 |
| `keepLowest` | Lowest | 最小 |
| `notation` | Dice notation | ダイス表記 |
| `notationHint` | e.g. 1d20+1d4+3, 2d20kh1, 4d6dl1, 3d6!, 4dF | 例: 1d20+1d4+3、2d20kh1、4d6dl1、3d6!、4dF |
| `notationBad` | Not dice notation. Try 3d6+2, 1d20+1d4, 2d20kh1, 4d6dl1, 3d6!, 2d8r<3 or 4dF | ダイス表記ではありません。例: 3d6+2、1d20+1d4、2d20kh1、4d6dl1、3d6!、2d8r<3、4dF |
| `notationCount` | “{part}”: roll 1 to 10 dice at a time | 「{part}」: 一度に振れるのは1〜10個です |
| `notationSides` | “{part}”: a die has 2 to 1000 sides, or is dF | 「{part}」: 面の数は2〜1000、または dF です |
| `notationBonus` | “{part}”: a bonus is at most 99 either way | 「{part}」: 修正値は±99までです |
| `notationTwice` | “{part}”: use each modifier once, and keep or drop, not both | 「{part}」: 同じ指定は一度だけです。採用と除外は同時に使えません |
| `notationKeep` | “{part}”: keep or drop at least one die, and fewer than all of them | 「{part}」: 採用・除外は1個以上、全部より少なくしてください |
| `notationReroll` | “{part}”: a reroll has to reroll some face and spare another, and r (until clear) at most half the faces; ro rerolls once | 「{part}」: 振り直す面と残す面がそれぞれ必要です。r（出るまで振り直し）は面の半分まで、ro は一度だけです |
| `notationKinds` | “{part}”: a roll has at most 4 kinds of dice | 「{part}」: 一度に振れるダイスは4種類までです |
| `notationMinus` | “{part}”: dice are added together; only the bonus can be taken away | 「{part}」: ダイスは足し算だけです。引けるのは修正値だけです |
| `notationExplode` | “{part}”: only dice of 100 sides or fewer explode, on some faces but not all, and not Fate dice or dice that are kept or dropped | 「{part}」: 爆発できるのは100面以下のダイスだけで、すべての面では爆発できません。dF や採用・除外とは併用できません |
| `dieDropped` | dropped | 不採用 |
| `dieRerolled` | rerolled | 振り直し |
| `dieExploded` | exploded | 爆発 |
| `chartTail` | Totals past {total} are off the chart: together they come up {percent} of the time. | {total} より上の合計は省略しています（合わせて {percent}）。 |
| `soundOn` | Sound is on. Tap to mute | 音はオンです。タップで消音 |
| `soundOff` | Sound is off. Tap to turn it on | 音はオフです。タップでオン |
| `pool` | Rolling | 振るダイス |
| `poolSays` | Rolling {notation} | {notation} を振ります |
| `add` | Add a die | ダイスを追加 |
| `choose` | Choose a die | ダイスを選ぶ |
| `addToRoll` | Tap a die below to add it | 下のダイスをタップして追加 |
| `limitDice` | {n} dice is the most in one roll | 一度に振れるのは{n}個までです |
| `limitKinds` | {n} kinds of dice is the most in one roll | 一度に振れるのは{n}種類までです |
| `takeOne` | Take one {die} away ({n} in the roll) | {die} を1個減らす（いま {n} 個） |
| `clearPool` | Clear | クリア |
| `clearPoolLabel` | Take every die away | すべてのダイスを外す |
| `tapAgainHold` | Tap the felt to roll again, or a die to hold it | フェルトをタップで振り直し、ダイスをタップでホールド |
| `rollRest` | Tap the felt to roll the other {n} | フェルトをタップして残りの {n} 個を振る |
| `allHeld` | Every die is held. Tap one to let it go | すべてホールド中です。ダイスをタップで解除 |
| `held` | held | ホールド |
| `heldBadge` | {n} held | {n} 個ホールド |
| `releaseAll` | Release all | すべて解除 |
| `oddsHolding` | {n} held, {notation} still to roll | {n} 個ホールド、残りは {notation} |
| `notationCustom` | “{part}”: a custom die has 2 to 20 faces of up to 16 characters, each with an optional =value and #colour, and takes no modifiers | 「{part}」: カスタムダイスは2〜20面、各面16文字まで（=数値と#色は任意）です。修飾は付けられません |
| `notationWeights` | “{part}”: a loaded die has up to 100 sides and weights from 0 to 99 that are not all the same, with at least two faces that can come up | 「{part}」: イカサマダイスは100面まで、重みは0〜99です。すべて同じ重みにはできず、出る面が2つ以上必要です |
| `dieLoaded` | loaded | イカサマ |
| `loadedBadge` | Loaded dice | イカサマダイス |
| `result` | Result | 結果 |
| `moreDice` | More: times, custom dice, loaded dice and sets | その他: 回数・カスタムダイス・イカサマダイス・セット |
| `customTitle` | Make a die | ダイスを作る |
| `customHint` | Its faces, with commas between: Yes, No, Maybe | 面をカンマで区切って入力: はい, いいえ, たぶん |
| `customAdd` | Add it to the roll | ロールに追加 |
| `loadedTitle` | Loaded dice | イカサマダイス |
| `loadedNote` | The buttons above roll fair dice. These do not, and they say so: a loaded die is marked on the felt, in the history and in any link to it. | 上のボタンは公平なダイスを振ります。こちらは公平ではなく、そのことを必ず表示します。フェルト、履歴、リンクのすべてに印が付きます。 |
| `loadedOptimist` | The Optimist | 楽天家 |
| `loadedOptimistSays` | A die weighted towards its six, which it shows three times in eight. It believes in you more than the odds do. | 6に重みを付けたダイスです。8回に3回は6が出ます。確率よりも、あなたを信じています。 |
| `loadedFlat` | The Six-Ace Flat | シックス・エース・フラット |
| `loadedFlatSays` | Shaved a little thin between the 1 and the 6, so those two faces land twice as often as the rest. The oldest job a file ever did. | 1と6の面の間を少し薄く削ったダイスです。この2つの面が、ほかの面の2倍出ます。やすりの最も古い仕事です。 |
| `loadedOddCouple` | The Odd Couple | 奇数のふたり |
| `loadedOddCoupleSays` | Two dice with no even faces. Between them they have never made a seven, and they are not going to start now. | 偶数の面がないダイスが2個。合計が7になったことは一度もなく、これからもありません。 |
| `oddsLoaded` | Loaded: {face} comes up {a} in {b}, not {c} in {d}. The marks are the fair die. | イカサマ: {face} は {b} 回に {a} 回出ます（公平なら {d} 回に {c} 回）。印は公平なダイスです。 |
| `oddsLoadedMixed` | Loaded dice. The marks are the same roll with fair dice. | イカサマダイスです。印は同じロールを公平なダイスで振った場合です。 |
| `oddsFaces` | Each face of {die} | {die} の各面 |
| `setsTitle` | Sets | セット |
| `setName` | A name for this roll | このロールの名前 |
| `setSave` | Save | 保存 |
| `setNone` | No sets saved yet. Name the roll above to keep it on this device. | 保存したセットはまだありません。上でロールに名前を付けると、この端末に保存されます。 |
| `setRoll` | Use {name}: {notation} | {name} を使う: {notation} |
| `setDelete` | Delete {name} | {name} を削除 |
| `setCopy` | Copy a link to {name} | {name} のリンクをコピー |
| `fairnessLopsided` | A fair die would give results this lopsided about 1 time in {odds}. This die has some explaining to do. | 公平なダイスでここまで偏るのは、およそ {odds} 回に1回です。このダイスには説明が必要です。 |
| `fairnessCount` | {n} of {min} throws so far. | 現在 {n} 回（{min} 回必要）。 |
| `testTitle` | Test a real die | 本物のダイスを検定 |
| `testHint` | Type or paste what it rolled: 3 5 6 6 1 … | 出目を入力または貼り付け: 3 5 6 6 1 … |
| `testSides` | Sides | 面数 |
| `testBad` | “{part}” is not a face of this die | 「{part}」はこのダイスの面ではありません |
| `language` | Language | 言語 |
| `notationTimes` | “{part}”: a roll is thrown 1 to 100 times | 「{part}」: 振る回数は1〜100回です |
| `notationSuccesses` | “{part}”: successes are counted over all the dice, by a comparison some dice meet and some do not; f needs a success to take from, and counting does not go with keep or drop | 「{part}」: 成功数はその種類のダイスすべてで数えます。一部のダイスだけが満たす条件にしてください。f は成功の条件が必要で、採用・除外とは併用できません |
| `notationClamp` | “{part}”: min goes above the die's lowest face and max below its highest, with min no greater than max | 「{part}」: min は最小の面より上、max は最大の面より下にし、min は max 以下にしてください |
| `notationMarks` | “{part}”: cs and cf take a comparison some dice meet and some do not | 「{part}」: cs と cf には、一部のダイスだけが満たす条件を指定してください |
| `notationLabel` | “{part}”: a label is up to 40 characters, without # [ ] { or } | 「{part}」: ラベルは40文字までで、# [ ] { } は使えません |
| `successes` | Successes | 成功数 |
| `dieSuccess` | a success | 成功 |
| `dieFailure` | takes a success away | 成功を1つ減らす |
| `dieCritical` | critical success | クリティカル |
| `dieFumble` | critical failure | ファンブル |
| `times` | Times | 回数 |
| `timesHold` | Tap to roll all {n} again. Dice are held one roll at a time | タップで {n} 回分をもう一度振ります。ホールドは1回ずつのロールで使えます |
| `setSum` | Sum of all {n}: {sum} | {n} 回の合計: {sum} |
| `setHighest` | highest | 最大 |
| `setLowest` | lowest | 最小 |
| `setRolls` | {n} rolls | {n} 回 |
| `anyAtLeast` | Chance that at least one of {n} rolls is {target} or more | {n} 回のうち少なくとも1回が {target} 以上になる確率 |
| `expectedHighest` | Expected highest of {n} | {n} 回の最大値の期待値 |
| `games` | Games | ゲーム |
| `gamesNone` | none chosen | 選択なし |
| `gamesSearch` | Search games: yahtzee, craps, d20… | ゲームを検索: ヤッツィー、クラップス、d20… |
| `gamesNothing` | No game by that name. | その名前のゲームはありません。 |
| `gamesMissing` | Is your game missing? Tell us | 遊びたいゲームがありませんか？教えてください |
| `gamesStop` | Stop reading rolls as {name} | {name} として読むのをやめる |
| `gamesNote` | Game names are trademarks of their owners. Korokoro is not affiliated with them; it rolls the dice their rules call for. | ゲーム名は各権利者の商標です。Korokoro は各社と提携しておらず、ルールに沿ってダイスを振るだけです。 |
| `familyBoard` | Board games | ボードゲーム |
| `familyDice` | Dice games | ダイスゲーム |
| `familyTraditional` | Traditional games | 伝統的なゲーム |
| `familyCards` | Beside a card table | カードゲームのお供 |
| `familyRoleplaying` | Roleplaying games | ロールプレイングゲーム |
| `familyHandy` | Handy | 便利なダイス |
| `outcomes` | How a roll comes out | 出目の内訳 |
| `turnRoll` | Roll {a} of {n}. Tap the felt to roll again, or a die to hold it | {n} 回中 {a} 回目。フェルトをタップで振り直し、ダイスをタップでホールド |
| `turnOver` | That was roll {n} of {n}. Tap the felt for a new turn | {n} 回振りました。フェルトをタップすると新しい手番です |
| `yahtzeeWithin` | A Yahtzee within three rolls, holding the most of a kind | 3回以内にヤッツィー（同じ目を最も多く残した場合） |
| `crapsPass` | The shooter passes: a natural, or the point before a seven | シューターの勝ち: ナチュラル、または7より先にポイント |
| `chinchirorinWithin` | A hand within three throws | 3回以内に役ができる |
| `tapToRoll` | Tap anywhere to roll | どこでもタップして振る |
| `tapAgain` | Tap to roll again | タップしてもう一度 |
| `rollLabel` | Roll {notation} | {notation} を振る |
| `rolling` | Rolling… | コロコロ… |
| `total` | Total | 合計 |
| `critical` | Natural 20! | クリティカル！ |
| `fumble` | Natural 1 | ファンブル |
| `allMatch` | All the same! | ゾロ目！ |
| `luckier` | Luckier than {percent} of rolls | {percent} の出目より幸運 |
| `exactly` | 1 in {odds} chance of exactly {total} | ちょうど {total} が出る確率は {odds} 分の1 |
| `history` | History | 履歴 |
| `stats` | Stats | 統計 |
| `odds` | Odds | 確率 |
| `noRolls` | No rolls yet. Tap the dice to throw the first. | まだ振っていません。ダイスをタップしてください。 |
| `clear` | Clear history | 履歴を消す |
| `clearSure` | Clear all {n} rolls? | {n} 回分をすべて消しますか？ |
| `exportTitle` | Export and import | 書き出しと読み込み |
| `exportNote` | CSV opens in a spreadsheet, and the JSON can be brought back in here or on another device. | CSV は表計算ソフトで開けます。JSON はここや別の端末で読み込み直せます。 |
| `exportCsv` | Save as CSV | CSV で保存 |
| `exportJson` | Save as JSON | JSON で保存 |
| `exportText` | Save as text | テキストで保存 |
| `importJson` | Import JSON | JSON を読み込む |
| `imported` | Added {n} rolls | {n} 回分を追加しました |
| `importNothing` | Every roll in that file is already here | このファイルのロールはすべて登録済みです |
| `importBad` | That file is not a Korokoro export | このファイルは Korokoro の書き出しではありません |
| `copyLink` | Copy link to this roll | この出目のリンクをコピー |
| `copied` | Link copied | コピーしました |
| `rolls` | Rolls | 振った回数 |
| `diceThrown` | Dice thrown | 振ったダイス |
| `luck` | Luck | 運 |
| `luckHint` | 50% is exactly as lucky as the dice promise | 50% ちょうどが確率どおり |
| `hotStreak` | Best hot streak | 最長の好調 |
| `coldStreak` | Longest cold streak | 最長の不調 |
| `matches` | All dice matching | ゾロ目 |
| `nat20` | Natural 20s | 出目20 |
| `nat1` | Natural 1s | 出目1 |
| `faces` | Each face of the d{sides}, over {n} dice | d{sides} の各面（{n} 個） |
| `fairnessWait` | Roll more to judge fairness: each face needs about five throws. | 公平さを判断するには、各面が5回ほど出るまで振ってください。 |
| `fairnessOk` | Looks fair: a fair die strays this far {percent} of the time. | 公平に見えます。公平なダイスでもこの程度の偏りは {percent} の確率で起きます。 |
| `fairnessOdd` | Unusual: a fair die strays this far only {percent} of the time. Keep rolling; streaks happen. | 珍しい偏りです（公平なダイスで {percent}）。続けて振ってみましょう。 |
| `totals` | Totals of {notation}, over {n} rolls | {notation} の合計（{n} 回） |
| `seenVsExpected` | Bars are what you rolled; marks are what the odds expect. | 棒は実際の出目、印は確率上の期待値です。 |
| `average` | Your average | 平均 |
| `expected` | Expected | 期待値 |
| `spread` | Typical spread | 標準偏差 |
| `mostLikely` | Most likely | 最も出やすい |
| `range` | Range | 範囲 |
| `target` | Need at least | 目標値 |
| `chanceAtLeast` | Chance to roll {target} or more | {target} 以上が出る確率 |
| `randomness` | Randomness | 乱数 |
| `fair` | Fair | 公平 |
| `fairHint` | Your device's cryptographic generator: nobody can predict it. | 端末の暗号論的乱数。誰にも予測できません。 |
| `seeded` | Seeded | シード |
| `seededHint` | The same seed throws the same dice, so a table can check them. | 同じシードなら同じ出目。卓のみんなで確かめられます。 |
| `newSeed` | New seed | 新しいシード |
| `shared` | A roll somebody shared | 共有された出目 |
| `savedNowhere` | History is not being kept on this device (storage is blocked). | この端末では履歴を保存できません（ストレージが無効です）。 |
