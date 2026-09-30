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
| `notationReroll` | “{part}”: a reroll has to include the lowest face and leave the highest, and r (until clear) at most half the faces; ro rerolls once | 「{part}」: 振り直しは最小の面を含み、最大の面を残してください。r（出るまで振り直し）は面の半分まで、ro は一度だけです |
| `notationKinds` | “{part}”: a roll has at most 4 kinds of dice | 「{part}」: 一度に振れるダイスは4種類までです |
| `notationMinus` | “{part}”: dice are added together; only the bonus can be taken away | 「{part}」: ダイスは足し算だけです。引けるのは修正値だけです |
| `notationExplode` | “{part}”: only dice of 100 sides or fewer explode, and not Fate dice or dice that are kept or dropped | 「{part}」: 爆発できるのは100面以下のダイスだけです。dF や採用・除外とは併用できません |
| `dieDropped` | dropped | 不採用 |
| `dieRerolled` | rerolled | 振り直し |
| `dieExploded` | exploded | 爆発 |
| `chartTail` | Totals past {total} are off the chart: together they come up {percent} of the time. | {total} より上の合計は省略しています（合わせて {percent}）。 |
| `soundOn` | Sound is on. Tap to mute | 音はオンです。タップで消音 |
| `soundOff` | Sound is off. Tap to turn it on | 音はオフです。タップでオン |
| `pool` | Rolling | 振るダイス |
| `poolSays` | Rolling {notation} | {notation} を振ります |
| `add` | Add a die | ダイスを追加 |
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
