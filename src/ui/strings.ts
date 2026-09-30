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
  tapToRoll: string;
  tapAgain: string;
  rollLabel: string;
  rolling: string;
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
    notationHint: "e.g. 3d6+2, 2d20kh1, d100",
    notationBad: "Not dice this roller throws: 1 to 5 of d4, d6, d8, d10, d12, d20 or d100",
    tapToRoll: "Tap anywhere to roll",
    tapAgain: "Tap to roll again",
    rollLabel: "Roll {notation}",
    rolling: "Rolling…",
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
    dice: "サイコロの数",
    die: "種類",
    modifier: "修正値",
    keep: "採用",
    keepAll: "すべて",
    keepHighest: "最大",
    keepLowest: "最小",
    notation: "ダイス表記",
    notationHint: "例: 3d6+2、2d20kh1、d100",
    notationBad: "振れるのは d4・d6・d8・d10・d12・d20・d100 を1〜5個です",
    tapToRoll: "どこでもタップして振る",
    tapAgain: "タップしてもう一度",
    rollLabel: "{notation} を振る",
    rolling: "コロコロ…",
    total: "合計",
    critical: "クリティカル！",
    fumble: "ファンブル",
    allMatch: "ゾロ目！",
    luckier: "{percent} の出目より幸運",
    exactly: "ちょうど {total} が出る確率は {odds} 分の1",
    history: "履歴",
    stats: "統計",
    odds: "確率",
    noRolls: "まだ振っていません。サイコロをタップしてください。",
    clear: "履歴を消す",
    clearSure: "{n} 回分をすべて消しますか？",
    copyLink: "この出目のリンクをコピー",
    copied: "コピーしました",
    rolls: "振った回数",
    diceThrown: "振ったサイコロ",
    luck: "運",
    luckHint: "50% ちょうどが確率どおり",
    hotStreak: "最長の好調",
    coldStreak: "最長の不調",
    matches: "ゾロ目",
    nat20: "出目20",
    nat1: "出目1",
    faces: "d{sides} の各面（{n} 個）",
    fairnessWait: "公平さを判断するには、各面が5回ほど出るまで振ってください。",
    fairnessOk: "公平に見えます。公平なサイコロでもこの程度の偏りは {percent} の確率で起きます。",
    fairnessOdd: "珍しい偏りです（公平なサイコロで {percent}）。続けて振ってみましょう。",
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

export function fillIn(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in vars ? String(vars[name]) : whole));
}
