import { MAX_DICE, MAX_DICE_BY_CODE, MAX_TIMES } from "./dice.ts";
import { EXPORT_FORMAT } from "./export.ts";

export type Language = "en" | "ja";

export const WORDS = {
  en: {
    usage: `Usage: korokoro [options] [dice ...]        (also: koro, roll)

Roll dice written as notation, with exact odds.

  koro 2d6+3                 roll two d6 and add 3
  koro 4d6dl1 1d20           roll each
  koro 6#4d6dl1              six ability scores
  koro "6d10>=8f=1"          count successes (quote < and > for your shell)
  koro -o 2d20kh1+5          the odds of a roll, without rolling it
  koro -g yahtzee            a game's dice, read the way the game reads them
  koro --test "3 5 6 6 1 2"  is this real die fair?

Options:
  -s, --seed <seed>    the same seed throws the same dice
  -t, --times <n>      throw each roll n times (1 to ${MAX_TIMES})
      --max-dice <n>   allow up to n dice in a roll (${MAX_DICE} to ${MAX_DICE_BY_CODE}; default ${MAX_DICE})
  -o, --odds           show the odds and do not roll
  -g, --game <name>    roll a game's dice
      --games          list the games
      --test <results> test a real die's results for fairness
      --sides <n>      the die tested, when its highest face never came up
  -j, --json           print JSON (format ${EXPORT_FORMAT})
      --csv            print CSV
      --stdin          read dice from standard input, one roll to a line
      --lang <en|ja>   English or Japanese (default: your system's)
      --no-color       no colour (NO_COLOR is honoured too)
  -h, --help           this help
  -v, --version        the version

With no dice, rolls 2d6. Exit codes: 0 done, 1 something could not be rolled,
2 the command was wrong.
`,
    unknown: "unknown option {part}",
    needs: "{part} needs a value",
    timesBad: `--times takes a whole number from 1 to ${MAX_TIMES}`,
    sidesBad: "--sides takes a whole number from 2 to 1000",
    maxDiceBad: `--max-dice takes a whole number from ${MAX_DICE} to ${MAX_DICE_BY_CODE}`,
    countMany: "“{part}”: roll 1 to {n} dice at a time, and past 10 only plain dice, all added or one kept",
    langBad: "--lang takes en or ja",
    noGame: "no game is called “{part}”. `koro --games` lists them",
    both: "--json and --csv are one or the other",
    tryHelp: "Try `koro --help`.",
    sum: "sum {sum} · highest {highest} · lowest {lowest}",
    range: "range {min} to {max}",
    expected: "expected {n}",
    spread: "spread {n}",
    likely: "most likely {n}",
    successes: "successes",
    more: "… and {n} more totals, each {p} or less",
    likelyAll: "every total as likely as the next",
    loaded: "loaded dice",
    testBad: "“{part}” is not a result of this die",
    testFew: "{n} results on a d{sides}: too few to say. The test wants {minimum}.",
    testFair: "{n} results on a d{sides}: nothing to see. A fair die strays this far or further {p} of the time.",
    testUnusual:
      "{n} results on a d{sides}: unusual. A fair die strays this far only {p} of the time, which still happens.",
    testLopsided: "{n} results on a d{sides}: lopsided. A fair die strays this far {p} of the time.",
  },
  ja: {
    usage: `使い方: korokoro [オプション] [ダイス ...]        （koro、roll でも同じです）

表記で書いたダイスを振ります。確率は正確に計算します。

  koro 2d6+3                 d6を2個振って3を足します
  koro 4d6dl1 1d20           それぞれを振ります
  koro 6#4d6dl1              能力値を6つ振ります
  koro "6d10>=8f=1"          成功数を数えます（< と > はシェルで引用してください）
  koro -o 2d20kh1+5          振らずに確率を表示します
  koro -g yahtzee            ゲームのダイスを振り、そのゲームの読み方で表示します
  koro --test "3 5 6 6 1 2"  実物のダイスが公平かを検定します

オプション:
  -s, --seed <シード>   同じシードなら同じ出目になります
  -t, --times <回数>    それぞれを n 回振ります（1〜${MAX_TIMES}）
      --max-dice <n>    1回に振れるダイスを n 個までにします（${MAX_DICE}〜${MAX_DICE_BY_CODE}、既定は${MAX_DICE}）
  -o, --odds            確率を表示し、振りません
  -g, --game <名前>     ゲームのダイスを振ります
      --games           ゲームの一覧
      --test <出目>     実物のダイスの出目を検定します
      --sides <n>       検定するダイスの面数（最大の面が出ていないとき）
  -j, --json            JSON で出力します（形式 ${EXPORT_FORMAT}）
      --csv             CSV で出力します
      --stdin           標準入力から1行に1つずつ読みます
      --lang <en|ja>    英語または日本語（既定: システムの言語）
      --no-color        色を付けません（NO_COLOR にも従います）
  -h, --help            このヘルプ
  -v, --version         バージョン

ダイスを指定しなければ 2d6 を振ります。終了コード: 0 成功、1 振れないものがあった、
2 コマンドの誤り。
`,
    unknown: "不明なオプションです: {part}",
    needs: "{part} には値が必要です",
    timesBad: `--times は1〜${MAX_TIMES}の整数です`,
    sidesBad: "--sides は2〜1000の整数です",
    maxDiceBad: `--max-dice は${MAX_DICE}〜${MAX_DICE_BY_CODE}の整数です`,
    countMany:
      "「{part}」: 一度に振れるのは1〜{n}個です。10個を超えるときは、すべて足すか1個だけ採用する、ほかの指定のないダイスに限ります",
    langBad: "--lang は en か ja です",
    noGame: "「{part}」というゲームはありません。`koro --games` で一覧を表示します",
    both: "--json と --csv はどちらか一方です",
    tryHelp: "`koro --help` をご覧ください。",
    sum: "合計 {sum} · 最大 {highest} · 最小 {lowest}",
    range: "範囲 {min}〜{max}",
    expected: "期待値 {n}",
    spread: "ばらつき {n}",
    likely: "最頻値 {n}",
    successes: "成功数",
    more: "… ほかに {n} 通りの合計（それぞれ {p} 以下）",
    likelyAll: "どの合計も同じ確率",
    loaded: "イカサマダイス",
    testBad: "「{part}」はこのダイスの出目ではありません",
    testFew: "d{sides} の出目 {n} 個: まだ少なすぎます。検定には {minimum} 個必要です。",
    testFair: "d{sides} の出目 {n} 個: 偏りは見られません。公平なダイスでも {p} の確率でこのくらい偏ります。",
    testUnusual: "d{sides} の出目 {n} 個: やや珍しい偏りです。公平なダイスでここまで偏るのは {p} です。",
    testLopsided: "d{sides} の出目 {n} 個: 偏っています。公平なダイスでここまで偏るのは {p} です。",
  },
} as const;
