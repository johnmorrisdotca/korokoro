import { type Roll, type RollSpec, roll, rollMany } from "../dice.ts";
import { parseNotation } from "../notation.ts";
import { cryptoSource, type RandomSource } from "../random.ts";
import { PRESETS } from "./presets.data.ts";
import { type diceFor, type Outcome, patternsOf, READERS, type ReadingId, readDiceAs } from "./readings.ts";
import { READING_WORDS } from "./words.ts";

export { PRESETS };

/** The shelves the games are kept on.
 *
 * @example
 * ```ts
 * import type { GameFamily } from "@johnmorrisdotca/korokoro";
 * const value: GameFamily = "dice";
 * console.log(value);
 * ```
 */
export type GameFamily = "board" | "dice" | "traditional" | "cards" | "roleplaying" | "handy";

/**
 * The dice for a game, and how the game reads them. A preset is data: a line
 * here, not code. Korokoro rolls and reads the dice; it does not run the game
 * (whose turn it is, a score sheet across rounds).
 *
 * @example
 * ```ts
 * import type { Preset } from "@johnmorrisdotca/korokoro";
 * import { getPreset } from "@johnmorrisdotca/korokoro";
 * const value: Preset = getPreset("cho-han")!;
 * console.log(value.notation);
 * ```
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
  /** False where holding a die and rolling the rest is no part of the game, as in craps or Monopoly: the tray then holds nothing. Left out where dice are held between rolls (Yahtzee, Farkle). */
  hold?: false;
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

/** A preset's name, for finding it: lower case, with what is not a letter or a digit taken out. */
const plainName = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}]/gu, "");

/** A preset by its id, its name or any of its other names: `getPreset("yahtzee")` and `getPreset("Yacht")` are the same game. Undefined when there is none.
 *
 * @param name - The preset or saved-set name to look up or write.
 * @returns A preset by its id, its name or any of its other names: `getPreset("yahtzee")` and `getPreset("Yacht")` are the same game. undefined when there is none.

 *
 * @example
 * ```ts
 * import { getPreset } from "@johnmorrisdotca/korokoro";
 * console.log(getPreset("Yacht")?.id, getPreset("unknown"));
 * ```
 */
export function getPreset(name: string): Preset | undefined {
  const wanted = plainName(name);
  if (wanted === "") return undefined;
  return (
    PRESETS.find((p) => plainName(p.id) === wanted || plainName(p.name) === wanted) ??
    PRESETS.find((p) => plainName(p.nameJa) === wanted || p.aliases.some((a) => plainName(a) === wanted))
  );
}

/** The presets a search finds: every word typed has to be in the name, another name, the one-line description or the notation. An empty search finds them all.
 *
 * @param search - Text to match against preset ids, names and aliases.
 * @returns The presets a search finds: every word typed has to be in the name, another name, the one-line description or the notation. An empty search finds them all.

 *
 * @example
 * ```ts
 * import { findPresets } from "@johnmorrisdotca/korokoro";
 * console.log(findPresets("yahtzee").map((preset) => preset.id));
 * ```
 */
export function findPresets(search: string): Preset[] {
  const words = search
    .toLowerCase()
    .normalize("NFKD")
    .split(/\s+/)
    .filter((w) => w !== "");
  return PRESETS.filter((p) => {
    const about = `${p.name} ${p.nameJa} ${p.aliases.join(" ")} ${p.says} ${p.saysJa} ${p.notation} ${p.id}`
      .toLowerCase()
      .normalize("NFKD");
    return words.every((w) => about.includes(w));
  });
}

/** A preset's dice, as a spec.
 *
 * @param preset - The game preset whose dice and reading are used.
 * @returns A preset's dice, as a spec.

 *
 * @example
 * ```ts
 * import { presetSpec } from "@johnmorrisdotca/korokoro";
 * import { formatNotation, getPreset } from "@johnmorrisdotca/korokoro";
 * const preset = getPreset("cho-han")!;
 * console.log(formatNotation(presetSpec(preset)));
 * ```
 */
export function presetSpec(preset: Preset): RollSpec {
  return parseNotation(preset.notation) as RollSpec;
}

/** What a game makes of a roll: the outcome, and the words for it.
 *
 * @example
 * ```ts
 * import type { PresetReading } from "@johnmorrisdotca/korokoro";
 * import { getPreset, presetSpec, roll, seededSource, readPreset } from "@johnmorrisdotca/korokoro";
 * const value: PresetReading = readPreset(getPreset("cho-han")!, roll(presetSpec(getPreset("cho-han")!), seededSource("docs"), 0));
 * console.log(value.text);
 * ```
 */
export type PresetReading = Outcome & {
  /** The reading in a sentence, in English. Empty for a die that says it all itself, such as a coin. */
  text: string;
};

const fill = (template: string, values: Outcome["values"]) =>
  template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in values ? String(values[name]) : whole));

/**
 * Read a roll the way a game does. `before` is the rolls made just before it
 * in the same game, oldest first, for a game that reads a roll in their
 * light: the point in craps, a turn's total in Pig. `language` is "en" or
 * "ja". The roll may be of other dice than the preset opens with (a pool made
 * larger, a bonus added): it is read all the same.
 *
 * @param preset - The game preset whose dice and reading are used.
 * @param thrown - The completed roll to read or announce.
 * @param before - Earlier rolls needed by a reading with a running result.
 * @param language - English or Japanese for the reading text.
 * @returns Read a roll the way a game does. `before` is the rolls made just before it in the same game, oldest first, for a game that reads a roll in their light: the point in craps, a turn's total in Pig. `language` is "en" or "ja". The roll may be of other dice than the preset opens with (a pool made larger, a bonus added): it is read all the same.

 *
 * @example
 * ```ts
 * import { readPreset } from "@johnmorrisdotca/korokoro";
 * import { getPreset, normalizeSpec, rollFrom } from "@johnmorrisdotca/korokoro";
 * const preset = getPreset("cho-han")!;
 * const spec = normalizeSpec({ count: 2, sides: 6 });
 * const sample = rollFrom(spec, [2, 5], "saved", 0, null)!;
 * console.log(readPreset(preset, sample, [], "en").text);
 * ```
 */
export function readPreset(
  preset: Preset,
  thrown: Roll,
  before: readonly Roll[] = [],
  language: "en" | "ja" = "en",
): PresetReading {
  const outcome = readDiceAs(preset.reading, thrown, preset.runs === true ? before : [], preset.options ?? {});
  return {
    ...outcome,
    text: fill(READING_WORDS[language][`${preset.reading}.${outcome.outcome}`] ?? "", outcome.values),
  };
}

/** A game's dice thrown and read.
 *
 * @example
 * ```ts
 * import type { PresetRoll } from "@johnmorrisdotca/korokoro";
 * import { rollPreset, seededSource } from "@johnmorrisdotca/korokoro";
 * const value: PresetRoll = rollPreset("cho-han", { source: seededSource("docs"), at: 0 });
 * console.log(value.roll.total);
 * ```
 */
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
 *
 * @param name - The preset or saved-set name to look up or write.
 * @param options - Options for this call; omitted fields keep their documented defaults.
 * @returns Throw a game's dice and read them. `source` is the crypto generator unless a seeded one is given; `before` is the rolls so far in the same game. Throws a RangeError for a name that is no preset.

 *
 * @example
 * ```ts
 * import { rollPreset } from "@johnmorrisdotca/korokoro";
 * import { seededSource } from "@johnmorrisdotca/korokoro";
 * console.log(rollPreset("cho-han", { source: seededSource("table"), at: 0 }).reading.text);
 * ```
 */
export function rollPreset(
  name: string,
  options: { source?: RandomSource; at?: number; before?: readonly Roll[]; language?: "en" | "ja" } = {},
): PresetRoll {
  const preset = getPreset(name);
  if (preset === undefined) throw new RangeError(`korokoro: no game is called “${name}”`);
  const spec = presetSpec(preset);
  const source = options.source ?? cryptoSource();
  const rolls =
    (spec.times ?? 1) > 1 ? rollMany(spec, spec.times, source, options.at).rolls : [roll(spec, source, options.at)];
  const readings = rolls.map((r, i) =>
    readPreset(preset, r, [...(options.before ?? []), ...rolls.slice(0, i)], options.language),
  );
  return { preset, roll: rolls.at(-1) as Roll, rolls, readings, reading: readings.at(-1) as PresetReading };
}

/** One line of a game's odds: an outcome, the words for it, and its chance as a whole-number count of the equally likely throws.
 *
 * @example
 * ```ts
 * import type { OutcomeOdds } from "@johnmorrisdotca/korokoro";
 * import { getPreset, presetOdds } from "@johnmorrisdotca/korokoro";
 * const value: OutcomeOdds = presetOdds(getPreset("cho-han")!)![0]!;
 * console.log(value.text);
 * ```
 */
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
 *
 * @param preset - The game preset whose dice and reading are used.
 * @param spec - Dice counts, sides, rules and modifier; omitted fields use the documented defaults.
 * @param language - English or Japanese for the reading text.
 * @returns The exact odds of each outcome of a game's first roll: a natural in craps, each hand in chinchirorin, each result of a Risk battle. Every way the dice can fall is counted, in whole numbers. `spec` is the preset's own dice unless others are given (a larger pool, fewer battle dice). null where there is nothing to count: a reading that is only the total, whose odds `distributionOf` gives; a reading that depends on the order of the dice; or dice that are rerolled or explode.

 *
 * @example
 * ```ts
 * import { presetOdds } from "@johnmorrisdotca/korokoro";
 * import { getPreset } from "@johnmorrisdotca/korokoro";
 * const preset = getPreset("cho-han")!;
 * console.log(presetOdds(preset)?.map((outcome) => outcome.text));
 * ```
 */
export function presetOdds(
  preset: Preset,
  spec: RollSpec = presetSpec(preset),
  language: "en" | "ja" = "en",
): OutcomeOdds[] | null {
  if (["sum", "scores", "faces", "d66", "counts", "shutTheBox", "percentile", "highest"].includes(preset.reading))
    return null;
  const patterns = patternsOf({ ...spec, times: undefined } as RollSpec);
  if (patterns === null) return null;
  const read = READERS[preset.reading] as (
    dice: ReturnType<typeof diceFor>,
    before: never[],
    options: Record<string, number>,
  ) => Outcome;
  const tally = new Map<string, { values: Outcome["values"]; ways: bigint }>();
  let outOf = 0n;
  for (const { dice, ways } of patterns) {
    const outcome = read(dice, [], preset.options ?? {});
    // Outcomes that differ only in a figure are one line: every total that is "the point", every face that is a triple.
    const key = GROUPED.has(`${preset.reading}.${outcome.outcome}`)
      ? outcome.outcome
      : `${outcome.outcome}|${JSON.stringify(outcome.values)}`;
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
    const words =
      (grouped ? GROUP_WORDS[language][`${preset.reading}.${name}`] : undefined) ??
      fill(
        READING_WORDS[language][`${preset.reading}.${name}` as keyof (typeof READING_WORDS)["en"]] ?? name,
        line.values,
      );
    return {
      outcome: alone ? name : `${name}:${Object.values(line.values).join(",")}`,
      text: words,
      ways: line.ways,
      outOf,
      chance: Number(line.ways) / Number(outOf),
    };
  });
}

/** Outcomes whose odds are given as one line whatever their figures. */
const GROUPED = new Set([
  "doubles.total",
  "doubles.doubles",
  "robber.total",
  "backgammon.moves",
  "backgammon.doubles",
  "sixAgain.move",
  "craps.natural",
  "craps.craps",
  "craps.point",
  "hazard.nick",
  "hazard.out",
  "hazard.chance",
  "yahtzee.yahtzee",
  "yahtzee.four",
  "yahtzee.three",
  "yahtzee.chance",
  "farkle.scores",
  "bunco.three",
  "bunco.count",
  "pig.turn",
  "shipCaptainCrew.crew",
  "mexico.doubles",
  "mexico.number",
  "sicBo.big",
  "sicBo.small",
  "sicBo.triple",
  "choHan.cho",
  "choHan.han",
  "chinchirorin.arashi",
  "chinchirorin.point",
  "d20.natural20",
  "d20.natural1",
  "d20.total",
  "bladesPool.partial",
  "bladesPool.bad",
  "pbta.strong",
  "pbta.weak",
  "pbta.miss",
  "rollUnder.under",
  "rollUnder.critical",
  "rollUnder.fail",
  "rollUnder.fumble",
  "cowries.move",
  "cowries.grace",
]);

/** The words for a line of odds that gathers several figures. */
const GROUP_WORDS: { en: Record<string, string>; ja: Record<string, string> } = {
  en: {
    "doubles.total": "No doubles",
    "doubles.doubles": "Doubles",
    "robber.total": "Any other total",
    "backgammon.moves": "Two different numbers",
    "backgammon.doubles": "Doubles",
    "sixAgain.move": "One to five",
    "craps.natural": "A natural (7 or 11)",
    "craps.craps": "Craps (2, 3 or 12)",
    "craps.point": "A point (4, 5, 6, 8, 9 or 10)",
    "hazard.nick": "A nick",
    "hazard.out": "Out",
    "hazard.chance": "A chance",
    "yahtzee.yahtzee": "Yahtzee",
    "yahtzee.four": "Four of a kind",
    "yahtzee.three": "Three of a kind",
    "yahtzee.chance": "Nothing but chance",
    "farkle.scores": "Something scores",
    "bunco.three": "Three alike",
    "bunco.count": "Anything else",
    "pig.turn": "Two to six",
    "shipCaptainCrew.crew": "Ship, captain and crew",
    "mexico.doubles": "Doubles",
    "mexico.number": "Anything else",
    "sicBo.big": "Big",
    "sicBo.small": "Small",
    "sicBo.triple": "A triple",
    "choHan.cho": "Chō (even)",
    "choHan.han": "Han (odd)",
    "chinchirorin.arashi": "Arashi (a triple but ones)",
    "chinchirorin.point": "A pair and a point",
    "d20.natural20": "A natural 20",
    "d20.natural1": "A natural 1",
    "d20.total": "Anything else",
    "bladesPool.partial": "A 4 or a 5 at best",
    "bladesPool.bad": "A 3 at best",
    "pbta.strong": "10 or more",
    "pbta.weak": "7 to 9",
    "pbta.miss": "6 or less",
    "rollUnder.under": "5 to 16: a success at that skill or more",
    "rollUnder.critical": "3 or 4: always a critical success",
    "rollUnder.fail": "17: a failure",
    "rollUnder.fumble": "18: always a critical failure",
    "cowries.move": "Two to five up",
    "cowries.grace": "None, one or six up: a grace",
  },
  ja: {
    "doubles.total": "ゾロ目以外",
    "doubles.doubles": "ゾロ目",
    "robber.total": "7以外",
    "backgammon.moves": "異なる2つの目",
    "backgammon.doubles": "ゾロ目",
    "sixAgain.move": "1〜5",
    "craps.natural": "ナチュラル（7か11）",
    "craps.craps": "クラップス（2・3・12）",
    "craps.point": "ポイント（4・5・6・8・9・10）",
    "hazard.nick": "ニック",
    "hazard.out": "アウト",
    "hazard.chance": "チャンス",
    "yahtzee.yahtzee": "ヤッツィー",
    "yahtzee.four": "フォーカード",
    "yahtzee.three": "スリーカード",
    "yahtzee.chance": "チャンスのみ",
    "farkle.scores": "得点あり",
    "bunco.three": "3個そろい",
    "bunco.count": "それ以外",
    "pig.turn": "2〜6",
    "shipCaptainCrew.crew": "船・船長・乗組員",
    "mexico.doubles": "ゾロ目",
    "mexico.number": "それ以外",
    "sicBo.big": "大",
    "sicBo.small": "小",
    "sicBo.triple": "ゾロ目",
    "choHan.cho": "丁（偶数）",
    "choHan.han": "半（奇数）",
    "chinchirorin.arashi": "アラシ（1以外のゾロ目）",
    "chinchirorin.point": "ペアと目",
    "d20.natural20": "出目20",
    "d20.natural1": "出目1",
    "d20.total": "それ以外",
    "bladesPool.partial": "最大が4か5",
    "bladesPool.bad": "最大が3以下",
    "pbta.strong": "10以上",
    "pbta.weak": "7〜9",
    "pbta.miss": "6以下",
    "rollUnder.under": "5〜16: 技能値がその数以上なら成功",
    "rollUnder.critical": "3か4: 必ずクリティカル成功",
    "rollUnder.fail": "17: 失敗",
    "rollUnder.fumble": "18: 必ずクリティカル失敗",
    "cowries.move": "表が2〜5個",
    "cowries.grace": "表が0・1・6個（もう一度）",
  },
};
