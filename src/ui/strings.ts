import type { NotationProblem } from "../notation.ts";

/**
 * Every word the tray says, in English and Japanese. A page in another
 * language passes its own table: `{ ...STRINGS.en, roll: "Lanzar" }`.
 * `{n}` and the other braces are filled in; a table must keep them.
 */
export type RollerStrings = {
  dice: string;
  die: string;
  modifier: string;
  keep: string;
  keepAll: string;
  keepHighest: string;
  keepLowest: string;
  notation: string;
  notationHint: string;
  notationBad: string;
  notationCount: string;
  notationSides: string;
  notationBonus: string;
  notationTwice: string;
  notationKeep: string;
  notationReroll: string;
  notationExplode: string;
  notationKinds: string;
  notationMinus: string;
  dieDropped: string;
  dieRerolled: string;
  dieExploded: string;
  chartTail: string;
  soundOn: string;
  soundOff: string;
  pool: string;
  poolSays: string;
  poolHint: string;
  poolSuggested: string;
  add: string;
  choose: string;
  addToRoll: string;
  limitDice: string;
  limitKinds: string;
  takeOne: string;
  clearPool: string;
  clearPoolLabel: string;
  tapAgainHold: string;
  rollRest: string;
  allHeld: string;
  held: string;
  heldBadge: string;
  releaseAll: string;
  oddsHolding: string;
  notationCustom: string;
  notationWeights: string;
  dieLoaded: string;
  loadedBadge: string;
  result: string;
  moreDice: string;
  customTitle: string;
  customHint: string;
  customAdd: string;
  loadedTitle: string;
  loadedNote: string;
  loadedOptimist: string;
  loadedOptimistSays: string;
  loadedFlat: string;
  loadedFlatSays: string;
  loadedOddCouple: string;
  loadedOddCoupleSays: string;
  oddsLoaded: string;
  oddsLoadedMixed: string;
  oddsFaces: string;
  setsTitle: string;
  setName: string;
  setSave: string;
  setNone: string;
  setRoll: string;
  setDelete: string;
  setCopy: string;
  fairnessLopsided: string;
  fairnessCount: string;
  testTitle: string;
  testHint: string;
  testSides: string;
  testBad: string;
  language: string;
  notationTimes: string;
  /** Refusals for the rules added in 1.7.0. `{part}` is the text refused. */
  notationSuccesses: string;
  notationClamp: string;
  notationMarks: string;
  notationLabel: string;
  /** Refusals for the rules added in 1.9.0. */
  notationUnique: string;
  notationMath: string;
  notationFraction: string;
  notationZero: string;
  /** Said where the dice buttons are, when the roll is a formula: they cannot change it. */
  formula: string;
  /** The headline's label on a roll that counts successes, where other rolls say Total. */
  successes: string;
  /** What became of a die, for a screen reader and a hover: a success, a die that takes one away, a marked die. */
  dieSuccess: string;
  dieFailure: string;
  dieCritical: string;
  dieFumble: string;
  times: string;
  timesHold: string;
  setSum: string;
  setHighest: string;
  setLowest: string;
  setRolls: string;
  anyAtLeast: string;
  expectedHighest: string;
  games: string;
  gamesNone: string;
  gamesSearch: string;
  gamesNothing: string;
  gamesMissing: string;
  gamesStop: string;
  gamesNote: string;
  familyBoard: string;
  familyDice: string;
  familyTraditional: string;
  familyCards: string;
  familyRoleplaying: string;
  familyHandy: string;
  warFamily: string;
  warName: string;
  warSays: string;
  warYou: string;
  warPlayers: string;
  warDice: string;
  warPlayTo: string;
  warPoints: string;
  warRounds: string;
  warNew: string;
  warRoundLine: string;
  warRoundOf: string;
  warAtStake: string;
  warYourThrow: string;
  warLast: string;
  warTakes: string;
  warWar: string;
  warCalledOff: string;
  warWon: string;
  warOdds: string;
  warYourOdds: string;
  warBeats: string;
  warScores: string;
  warKeep: string;
  outcomes: string;
  turnRoll: string;
  turnOver: string;
  yahtzeeWithin: string;
  crapsPass: string;
  chinchirorinWithin: string;
  tapToRoll: string;
  tapAgain: string;
  rollLabel: string;
  rolling: string;
  dieAlone: string;
  dieAloneRollable: string;
  dieAloneRolled: string;
  total: string;
  critical: string;
  fumble: string;
  allMatch: string;
  luckier: string;
  exactly: string;
  history: string;
  stats: string;
  odds: string;
  noRolls: string;
  clear: string;
  clearSure: string;
  /** Exporting the history, and bringing a JSON export back in. `{n}` is how many rolls were added. */
  exportTitle: string;
  exportNote: string;
  exportCsv: string;
  exportJson: string;
  exportText: string;
  importJson: string;
  imported: string;
  importNothing: string;
  importBad: string;
  copyLink: string;
  copied: string;
  rolls: string;
  diceThrown: string;
  luck: string;
  luckHint: string;
  hotStreak: string;
  coldStreak: string;
  matches: string;
  nat20: string;
  nat1: string;
  faces: string;
  fairnessWait: string;
  fairnessOk: string;
  fairnessOdd: string;
  totals: string;
  seenVsExpected: string;
  average: string;
  expected: string;
  spread: string;
  mostLikely: string;
  range: string;
  target: string;
  chanceAtLeast: string;
  randomness: string;
  fair: string;
  fairHint: string;
  seeded: string;
  seededHint: string;
  newSeed: string;
  shared: string;
  savedNowhere: string;
};

/** The built-in words, in English and Japanese. */
export const STRINGS: { en: RollerStrings; ja: RollerStrings } = {
  en: {
    dice: "Dice",
    die: "Die",
    modifier: "Bonus",
    keep: "Keep",
    keepAll: "All",
    keepHighest: "Highest",
    keepLowest: "Lowest",
    notation: "Dice notation",
    notationHint: "e.g. 1d20+1d4+3, 2d20kh1, 4d6dl1, 3d6!, 4dF",
    notationBad: "Not dice notation. Try 3d6+2, 1d20+1d4, 2d20kh1, 4d6dl1, 3d6!, 2d8r<3 or 4dF",
    notationCount: "“{part}”: roll 1 to 10 dice at a time",
    notationSides: "“{part}”: a die has 2 to 1000 sides, or is dF",
    notationBonus: "“{part}”: a bonus is at most 99 either way",
    notationTwice: "“{part}”: use each modifier once, and keep or drop, not both",
    notationKeep: "“{part}”: keep or drop at least one die, and fewer than all of them",
    notationReroll: "“{part}”: a reroll has to reroll some face and spare another, and r (until clear) at most half the faces; ro rerolls once",
    notationKinds: "“{part}”: a roll has at most 4 kinds of dice",
    notationMinus: "“{part}”: dice are added together; only the bonus can be taken away",
    notationExplode: "“{part}”: only dice of 100 sides or fewer explode, on some faces but not all, and not Fate dice or dice that are kept or dropped",
    dieDropped: "dropped",
    dieRerolled: "rerolled",
    dieExploded: "exploded",
    chartTail: "Totals past {total} are off the chart: together they come up {percent} of the time.",
    soundOn: "Sound is on. Tap to mute",
    soundOff: "Sound is off. Tap to turn it on",
    pool: "This roll",
    poolSays: "Rolling {notation}",
    poolHint: "These dice will be rolled. Tap a group to take one die away.",
    poolSuggested: "{notation} is only a suggestion. Tap a die below to choose your own.",
    add: "Add a die",
    choose: "Choose a die",
    addToRoll: "Tap a die below to add it",
    limitDice: "{n} dice is the most in one roll",
    limitKinds: "{n} kinds of dice is the most in one roll",
    takeOne: "Take one {die} away ({n} in the roll)",
    clearPool: "Clear",
    clearPoolLabel: "Take every die away",
    tapAgainHold: "Tap the felt to roll again, or a die to hold it",
    rollRest: "Tap the felt to roll the other {n}",
    allHeld: "Every die is held. Tap one to let it go",
    held: "held",
    heldBadge: "{n} held",
    releaseAll: "Release all",
    oddsHolding: "{n} held, {notation} still to roll",
    notationCustom: "“{part}”: a custom die has 2 to 20 faces of up to 16 characters, each with an optional =value and #colour, and takes no modifiers",
    notationWeights: "“{part}”: a loaded die has up to 100 sides and weights from 0 to 99 that are not all the same, with at least two faces that can come up",
    dieLoaded: "loaded",
    loadedBadge: "Loaded dice",
    result: "Result",
    moreDice: "More: times, custom dice, loaded dice and sets",
    customTitle: "Make a die",
    customHint: "Its faces, with commas between: Yes, No, Maybe",
    customAdd: "Add it to the roll",
    loadedTitle: "Loaded dice",
    loadedNote: "The buttons above roll fair dice. These do not, and they say so: a loaded die is marked on the felt, in the history and in any link to it.",
    loadedOptimist: "The Optimist",
    loadedOptimistSays: "A die weighted towards its six, which it shows three times in eight. It believes in you more than the odds do.",
    loadedFlat: "The Six-Ace Flat",
    loadedFlatSays: "Shaved a little thin between the 1 and the 6, so those two faces land twice as often as the rest. The oldest job a file ever did.",
    loadedOddCouple: "The Odd Couple",
    loadedOddCoupleSays: "Two dice with no even faces. Between them they have never made a seven, and they are not going to start now.",
    oddsLoaded: "Loaded: {face} comes up {a} in {b}, not {c} in {d}. The marks are the fair die.",
    oddsLoadedMixed: "Loaded dice. The marks are the same roll with fair dice.",
    oddsFaces: "Each face of {die}",
    setsTitle: "Sets",
    setName: "A name for this roll",
    setSave: "Save",
    setNone: "No sets saved yet. Name the roll above to keep it on this device.",
    setRoll: "Use {name}: {notation}",
    setDelete: "Delete {name}",
    setCopy: "Copy a link to {name}",
    fairnessLopsided: "A fair die would give results this lopsided about 1 time in {odds}. This die has some explaining to do.",
    fairnessCount: "{n} of {min} throws so far.",
    testTitle: "Test a real die",
    testHint: "Type or paste what it rolled: 3 5 6 6 1 …",
    testSides: "Sides",
    testBad: "“{part}” is not a face of this die",
    language: "Language",
    notationTimes: "“{part}”: a roll is thrown 1 to 100 times",
    notationSuccesses: "“{part}”: successes are counted over all the dice, by a comparison some dice meet and some do not; f needs a success to take from, and counting does not go with keep or drop",
    notationClamp: "“{part}”: min goes above the die's lowest face and max below its highest, with min no greater than max",
    notationMarks: "“{part}”: cs and cf take a comparison some dice meet and some do not",
    notationLabel: "“{part}”: a label is up to 40 characters, without # [ ] { or }",
    notationUnique: "“{part}”: dice that all differ (u) are fair dice of 100 sides or fewer, no more of them than the die has faces, with no reroll, explosion or keep; uo is not read",
    notationMath: "“{part}”: a formula is dice and whole numbers up to 9999 with + - * / and brackets that match, floor() ceil() round() abs() max() min(), or {a,b}kh1; its totals must not spread too wide to count",
    notationFraction: "“{part}”: round a division so the roll comes to a whole number: floor(…), ceil(…) or round(…)",
    notationZero: "“{part}”: this can divide by nothing",
    formula: "This roll is a formula. Change it in the box, or tap a die to start again",
    successes: "Successes",
    dieSuccess: "a success",
    dieFailure: "takes a success away",
    dieCritical: "critical success",
    dieFumble: "critical failure",
    times: "Times",
    timesHold: "Tap to roll all {n} again. Dice are held one roll at a time",
    setSum: "Sum of all {n}: {sum}",
    setHighest: "highest",
    setLowest: "lowest",
    setRolls: "{n} rolls",
    anyAtLeast: "Chance that at least one of {n} rolls is {target} or more",
    expectedHighest: "Expected highest of {n}",
    games: "Games",
    gamesNone: "none chosen",
    gamesSearch: "Search games: yahtzee, craps, d20…",
    gamesNothing: "No game by that name.",
    gamesMissing: "Is your game missing? Tell us",
    gamesStop: "Stop reading rolls as {name}",
    gamesNote: "Game names are trademarks of their owners. Korokoro is not affiliated with them; it rolls the dice their rules call for.",
    familyBoard: "Board games",
    familyDice: "Dice games",
    familyTraditional: "Traditional games",
    familyCards: "Beside a card table",
    familyRoleplaying: "Roleplaying games",
    familyHandy: "Handy",
    warFamily: "Play with the tray",
    warName: "Dice War",
    warSays: "Everyone rolls and the highest total scores a point. A tie for highest is war: only the tied roll again, for every point at stake.",
    warYou: "You",
    warPlayers: "Players",
    warDice: "Dice each",
    warPlayTo: "Play to",
    warPoints: "{n} points",
    warRounds: "{n} rounds",
    warNew: "New game",
    warRoundLine: "Round {n}",
    warRoundOf: "Round {n} of {of}",
    warAtStake: "At stake: {n}",
    warYourThrow: "Tap the tray to roll your dice.",
    warLast: "The last throw",
    warTakes: "{name} takes {n}",
    warWar: "War: {names} tied on {total}",
    warCalledOff: "The war was called off: nobody scores",
    warWon: "Game over: {names} won.",
    warOdds: "A tie for highest comes up about one throw in {odds}.",
    warYourOdds: "A {total} beats everyone {beats} of the time, ties for highest {ties} and loses {loses}.",
    warBeats: "{name} {total}",
    warScores: "Scores",
    warKeep: "The game as text",
    outcomes: "How a roll comes out",
    turnRoll: "Roll {a} of {n}. Tap the felt to roll again, or a die to hold it",
    turnOver: "That was roll {n} of {n}. Tap the felt for a new turn",
    yahtzeeWithin: "A Yahtzee within three rolls, holding the most of a kind",
    crapsPass: "The shooter passes: a natural, or the point before a seven",
    chinchirorinWithin: "A hand within three throws",
    tapToRoll: "Tap anywhere to roll",
    tapAgain: "Tap to roll again",
    rollLabel: "Roll {notation}",
    rolling: "Rolling…",
    dieAlone: "{die} showing {face}",
    dieAloneRollable: "{die} showing {face}. Tap to roll",
    dieAloneRolled: "{die}: {face}",
    total: "Total",
    critical: "Natural 20!",
    fumble: "Natural 1",
    allMatch: "All the same!",
    luckier: "Luckier than {percent} of rolls",
    exactly: "1 in {odds} chance of exactly {total}",
    history: "History",
    stats: "Stats",
    odds: "Odds",
    noRolls: "No rolls yet. Tap the dice to throw the first.",
    clear: "Clear history",
    clearSure: "Clear all {n} rolls?",
    exportTitle: "Export and import",
    exportNote: "CSV opens in a spreadsheet, and the JSON can be brought back in here or on another device.",
    exportCsv: "Save as CSV",
    exportJson: "Save as JSON",
    exportText: "Save as text",
    importJson: "Import JSON",
    imported: "Added {n} rolls",
    importNothing: "Every roll in that file is already here",
    importBad: "That file is not a Korokoro export",
    copyLink: "Copy link to this roll",
    copied: "Link copied",
    rolls: "Rolls",
    diceThrown: "Dice thrown",
    luck: "Luck",
    luckHint: "50% is exactly as lucky as the dice promise",
    hotStreak: "Best hot streak",
    coldStreak: "Longest cold streak",
    matches: "All dice matching",
    nat20: "Natural 20s",
    nat1: "Natural 1s",
    faces: "Each face of the d{sides}, over {n} dice",
    fairnessWait: "Roll more to judge fairness: each face needs about five throws.",
    fairnessOk: "Looks fair: a fair die strays this far {percent} of the time.",
    fairnessOdd: "Unusual: a fair die strays this far only {percent} of the time. Keep rolling; streaks happen.",
    totals: "Totals of {notation}, over {n} rolls",
    seenVsExpected: "Bars are what you rolled; marks are what the odds expect.",
    average: "Your average",
    expected: "Expected",
    spread: "Typical spread",
    mostLikely: "Most likely",
    range: "Range",
    target: "Need at least",
    chanceAtLeast: "Chance to roll {target} or more",
    randomness: "Randomness",
    fair: "Fair",
    fairHint: "Your device's cryptographic generator: nobody can predict it.",
    seeded: "Seeded",
    seededHint: "The same seed throws the same dice, so a table can check them.",
    newSeed: "New seed",
    shared: "A roll somebody shared",
    savedNowhere: "History is not being kept on this device (storage is blocked).",
  },
  ja: {
    dice: "ダイスの数",
    die: "種類",
    modifier: "修正値",
    keep: "採用",
    keepAll: "すべて",
    keepHighest: "最大",
    keepLowest: "最小",
    notation: "ダイス表記",
    notationHint: "例: 1d20+1d4+3、2d20kh1、4d6dl1、3d6!、4dF",
    notationBad: "ダイス表記ではありません。例: 3d6+2、1d20+1d4、2d20kh1、4d6dl1、3d6!、2d8r<3、4dF",
    notationCount: "「{part}」: 一度に振れるのは1〜10個です",
    notationSides: "「{part}」: 面の数は2〜1000、または dF です",
    notationBonus: "「{part}」: 修正値は±99までです",
    notationTwice: "「{part}」: 同じ指定は一度だけです。採用と除外は同時に使えません",
    notationKeep: "「{part}」: 採用・除外は1個以上、全部より少なくしてください",
    notationReroll: "「{part}」: 振り直す面と残す面がそれぞれ必要です。r（出るまで振り直し）は面の半分まで、ro は一度だけです",
    notationKinds: "「{part}」: 一度に振れるダイスは4種類までです",
    notationMinus: "「{part}」: ダイスは足し算だけです。引けるのは修正値だけです",
    notationExplode: "「{part}」: 爆発できるのは100面以下のダイスだけで、すべての面では爆発できません。dF や採用・除外とは併用できません",
    dieDropped: "不採用",
    dieRerolled: "振り直し",
    dieExploded: "爆発",
    chartTail: "{total} より上の合計は省略しています（合わせて {percent}）。",
    soundOn: "音はオンです。タップで消音",
    soundOff: "音はオフです。タップでオン",
    pool: "振るダイス",
    poolSays: "{notation} を振ります",
    poolHint: "これから振るダイスです。タップすると、その種類のダイスが1個減ります。",
    poolSuggested: "{notation} は仮のダイスです。下のダイスをタップして、自分で選んでください。",
    add: "ダイスを追加",
    choose: "ダイスを選ぶ",
    addToRoll: "下のダイスをタップして追加",
    limitDice: "一度に振れるのは{n}個までです",
    limitKinds: "一度に振れるのは{n}種類までです",
    takeOne: "{die} を1個減らす（いま {n} 個）",
    clearPool: "クリア",
    clearPoolLabel: "すべてのダイスを外す",
    tapAgainHold: "フェルトをタップで振り直し、ダイスをタップでホールド",
    rollRest: "フェルトをタップして残りの {n} 個を振る",
    allHeld: "すべてホールド中です。ダイスをタップで解除",
    held: "ホールド",
    heldBadge: "{n} 個ホールド",
    releaseAll: "すべて解除",
    oddsHolding: "{n} 個ホールド、残りは {notation}",
    notationCustom: "「{part}」: カスタムダイスは2〜20面、各面16文字まで（=数値と#色は任意）です。修飾は付けられません",
    notationWeights: "「{part}」: イカサマダイスは100面まで、重みは0〜99です。すべて同じ重みにはできず、出る面が2つ以上必要です",
    dieLoaded: "イカサマ",
    loadedBadge: "イカサマダイス",
    result: "結果",
    moreDice: "その他: 回数・カスタムダイス・イカサマダイス・セット",
    customTitle: "ダイスを作る",
    customHint: "面をカンマで区切って入力: はい, いいえ, たぶん",
    customAdd: "ロールに追加",
    loadedTitle: "イカサマダイス",
    loadedNote: "上のボタンは公平なダイスを振ります。こちらは公平ではなく、そのことを必ず表示します。フェルト、履歴、リンクのすべてに印が付きます。",
    loadedOptimist: "楽天家",
    loadedOptimistSays: "6に重みを付けたダイスです。8回に3回は6が出ます。確率よりも、あなたを信じています。",
    loadedFlat: "シックス・エース・フラット",
    loadedFlatSays: "1と6の面の間を少し薄く削ったダイスです。この2つの面が、ほかの面の2倍出ます。やすりの最も古い仕事です。",
    loadedOddCouple: "奇数のふたり",
    loadedOddCoupleSays: "偶数の面がないダイスが2個。合計が7になったことは一度もなく、これからもありません。",
    oddsLoaded: "イカサマ: {face} は {b} 回に {a} 回出ます（公平なら {d} 回に {c} 回）。印は公平なダイスです。",
    oddsLoadedMixed: "イカサマダイスです。印は同じロールを公平なダイスで振った場合です。",
    oddsFaces: "{die} の各面",
    setsTitle: "セット",
    setName: "このロールの名前",
    setSave: "保存",
    setNone: "保存したセットはまだありません。上でロールに名前を付けると、この端末に保存されます。",
    setRoll: "{name} を使う: {notation}",
    setDelete: "{name} を削除",
    setCopy: "{name} のリンクをコピー",
    fairnessLopsided: "公平なダイスでここまで偏るのは、およそ {odds} 回に1回です。このダイスには説明が必要です。",
    fairnessCount: "現在 {n} 回（{min} 回必要）。",
    testTitle: "本物のダイスを検定",
    testHint: "出目を入力または貼り付け: 3 5 6 6 1 …",
    testSides: "面数",
    testBad: "「{part}」はこのダイスの面ではありません",
    language: "言語",
    notationTimes: "「{part}」: 振る回数は1〜100回です",
    notationSuccesses: "「{part}」: 成功数はその種類のダイスすべてで数えます。一部のダイスだけが満たす条件にしてください。f は成功の条件が必要で、採用・除外とは併用できません",
    notationClamp: "「{part}」: min は最小の面より上、max は最大の面より下にし、min は max 以下にしてください",
    notationMarks: "「{part}」: cs と cf には、一部のダイスだけが満たす条件を指定してください",
    notationLabel: "「{part}」: ラベルは40文字までで、# [ ] { } は使えません",
    notationUnique: "「{part}」: すべて異なる出目（u）にできるのは、100面以下の公平なダイスで、個数が面数以下のときだけです。振り直し・爆発・採用とは併用できません。uo は使えません",
    notationMath: "「{part}」: 式に使えるのは、ダイス、9999までの整数、+ - * /、対応の取れた括弧、floor() ceil() round() abs() max() min()、{a,b}kh1 です。合計の範囲が広すぎる式は計算できません",
    notationFraction: "「{part}」: 割り算は floor(…)、ceil(…)、round(…) のいずれかで整数にしてください",
    notationZero: "「{part}」: この式は0で割ることがあります",
    formula: "このロールは式です。入力欄で変更するか、ダイスをタップして新しく始めてください",
    successes: "成功数",
    dieSuccess: "成功",
    dieFailure: "成功を1つ減らす",
    dieCritical: "クリティカル",
    dieFumble: "ファンブル",
    times: "回数",
    timesHold: "タップで {n} 回分をもう一度振ります。ホールドは1回ずつのロールで使えます",
    setSum: "{n} 回の合計: {sum}",
    setHighest: "最大",
    setLowest: "最小",
    setRolls: "{n} 回",
    anyAtLeast: "{n} 回のうち少なくとも1回が {target} 以上になる確率",
    expectedHighest: "{n} 回の最大値の期待値",
    games: "ゲーム",
    gamesNone: "選択なし",
    gamesSearch: "ゲームを検索: ヤッツィー、クラップス、d20…",
    gamesNothing: "その名前のゲームはありません。",
    gamesMissing: "遊びたいゲームがありませんか？教えてください",
    gamesStop: "{name} として読むのをやめる",
    gamesNote: "ゲーム名は各権利者の商標です。Korokoro は各社と提携しておらず、ルールに沿ってダイスを振るだけです。",
    familyBoard: "ボードゲーム",
    familyDice: "ダイスゲーム",
    familyTraditional: "伝統的なゲーム",
    familyCards: "カードゲームのお供",
    familyRoleplaying: "ロールプレイングゲーム",
    familyHandy: "便利なダイス",
    warFamily: "トレイで遊ぶ",
    warName: "ダイスウォー",
    warSays: "全員がダイスを振り、合計がいちばん大きい人が1点です。同点なら戦争で、並んだ人だけがもう一度振り、かかっている点をすべて取ります。",
    warYou: "あなた",
    warPlayers: "人数",
    warDice: "1人のダイス数",
    warPlayTo: "終わり",
    warPoints: "{n}点",
    warRounds: "{n}ラウンド",
    warNew: "新しいゲーム",
    warRoundLine: "ラウンド{n}",
    warRoundOf: "ラウンド{n}／{of}",
    warAtStake: "かかっている点: {n}",
    warYourThrow: "トレイをタップしてダイスを振ってください。",
    warLast: "直前の1投",
    warTakes: "{name}が{n}点を取りました",
    warWar: "戦争: {names}が{total}で並びました",
    warCalledOff: "戦争は打ち切りです。誰にも点は入りません",
    warWon: "ゲーム終了: {names}の勝ちです。",
    warOdds: "同点でいちばん大きくなるのは、約{odds}回に1回です。",
    warYourOdds: "{total}は、{beats}の確率で全員に勝ち、{ties}で最高点が並び、{loses}で負けます。",
    warBeats: "{name} {total}",
    warScores: "得点",
    warKeep: "このゲームをテキストで",
    outcomes: "出目の内訳",
    turnRoll: "{n} 回中 {a} 回目。フェルトをタップで振り直し、ダイスをタップでホールド",
    turnOver: "{n} 回振りました。フェルトをタップすると新しい手番です",
    yahtzeeWithin: "3回以内にヤッツィー（同じ目を最も多く残した場合）",
    crapsPass: "シューターの勝ち: ナチュラル、または7より先にポイント",
    chinchirorinWithin: "3回以内に役ができる",
    tapToRoll: "どこでもタップして振る",
    tapAgain: "タップしてもう一度",
    rollLabel: "{notation} を振る",
    rolling: "コロコロ…",
    dieAlone: "{die}、出目は {face}",
    dieAloneRollable: "{die}、出目は {face}。タップで振る",
    dieAloneRolled: "{die}: {face}",
    total: "合計",
    critical: "クリティカル！",
    fumble: "ファンブル",
    allMatch: "ゾロ目！",
    luckier: "{percent} の出目より幸運",
    exactly: "ちょうど {total} が出る確率は {odds} 分の1",
    history: "履歴",
    stats: "統計",
    odds: "確率",
    noRolls: "まだ振っていません。ダイスをタップしてください。",
    clear: "履歴を消す",
    clearSure: "{n} 回分をすべて消しますか？",
    exportTitle: "書き出しと読み込み",
    exportNote: "CSV は表計算ソフトで開けます。JSON はここや別の端末で読み込み直せます。",
    exportCsv: "CSV で保存",
    exportJson: "JSON で保存",
    exportText: "テキストで保存",
    importJson: "JSON を読み込む",
    imported: "{n} 回分を追加しました",
    importNothing: "このファイルのロールはすべて登録済みです",
    importBad: "このファイルは Korokoro の書き出しではありません",
    copyLink: "この出目のリンクをコピー",
    copied: "コピーしました",
    rolls: "振った回数",
    diceThrown: "振ったダイス",
    luck: "運",
    luckHint: "50% ちょうどが確率どおり",
    hotStreak: "最長の好調",
    coldStreak: "最長の不調",
    matches: "ゾロ目",
    nat20: "出目20",
    nat1: "出目1",
    faces: "d{sides} の各面（{n} 個）",
    fairnessWait: "公平さを判断するには、各面が5回ほど出るまで振ってください。",
    fairnessOk: "公平に見えます。公平なダイスでもこの程度の偏りは {percent} の確率で起きます。",
    fairnessOdd: "珍しい偏りです（公平なダイスで {percent}）。続けて振ってみましょう。",
    totals: "{notation} の合計（{n} 回）",
    seenVsExpected: "棒は実際の出目、印は確率上の期待値です。",
    average: "平均",
    expected: "期待値",
    spread: "標準偏差",
    mostLikely: "最も出やすい",
    range: "範囲",
    target: "目標値",
    chanceAtLeast: "{target} 以上が出る確率",
    randomness: "乱数",
    fair: "公平",
    fairHint: "端末の暗号論的乱数。誰にも予測できません。",
    seeded: "シード",
    seededHint: "同じシードなら同じ出目。卓のみんなで確かめられます。",
    newSeed: "新しいシード",
    shared: "共有された出目",
    savedNowhere: "この端末では履歴を保存できません（ストレージが無効です）。",
  },
};

/** A template with its `{name}` places filled in. A name with no value is left as it is. */
export function fillIn(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
}

/** Which of the tray's words refuses each kind of notation. */
export const REFUSALS: Record<NotationProblem, keyof RollerStrings> = {
  shape: "notationBad",
  count: "notationCount",
  sides: "notationSides",
  bonus: "notationBonus",
  twice: "notationTwice",
  keep: "notationKeep",
  reroll: "notationReroll",
  explode: "notationExplode",
  kinds: "notationKinds",
  minus: "notationMinus",
  custom: "notationCustom",
  weights: "notationWeights",
  times: "notationTimes",
  successes: "notationSuccesses",
  clamp: "notationClamp",
  marks: "notationMarks",
  label: "notationLabel",
  unique: "notationUnique",
  math: "notationMath",
  fraction: "notationFraction",
  zero: "notationZero",
};
