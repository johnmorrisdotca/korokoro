import type { NotationProblem } from "../notation.ts";

export { STRINGS } from "./strings.data.ts";

/**
 * Every word the tray says, in English and Japanese. A page in another
 * language passes its own table: `{ ...STRINGS.en, roll: "Lanzar" }`.
 * `{n}` and the other braces are filled in; a table must keep them.
 *
 * @example
 * ```ts
 * import type { RollerStrings } from "@johnmorrisdotca/korokoro";
 * import { STRINGS } from "@johnmorrisdotca/korokoro";
 * const value: RollerStrings = STRINGS.en;
 * console.log(Object.keys(value).slice(0, 3));
 * ```
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
