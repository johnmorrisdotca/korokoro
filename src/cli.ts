import { oddsOf, oddsText, percent } from "./cliOdds.ts";
import type { Language } from "./cliWords.data.ts";
import { WORDS } from "./cliWords.data.ts";
import {
  hasTotal,
  MAX_DICE,
  MAX_DICE_BY_CODE,
  MAX_TIMES,
  type Roll,
  type RollSpec,
  roll,
  rollMany,
  setOf,
} from "./dice.ts";
import { diceText, EXPORT_FORMAT, type ExportedRoll, exportedRoll, formulaText, resultText, toCSV } from "./export.ts";
import { getPreset, PRESETS, type Preset, presetOdds, presetSpec, readPreset } from "./games/presets.ts";
import { checkNotation, formatNotation, type NotationProblem } from "./notation.ts";
import { cryptoSource, type RandomSource, seededSource } from "./random.ts";
import { fairnessTest, readResults } from "./stats.ts";
import { fillIn, REFUSALS, STRINGS } from "./ui/strings.ts";
import { VERSION } from "./version.ts";

/**
 * The command line, as a pure function: arguments and surroundings in, what
 * to print and the exit code out. `bin/korokoro.mjs` is the few lines that
 * hand it the real process. Nothing here touches a file, a terminal or the
 * network, so every line of it is tested as plain data.
 */

/** What the command line is run in. All of it is optional.
 *
 * @example
 * ```ts
 * import type { CliSurroundings } from "@johnmorrisdotca/korokoro";
 * const value: CliSurroundings = { env: {}, locale: "en" };
 * console.log(value.locale);
 * ```
 */
export type CliSurroundings = {
  /** The environment, for the language (`LC_ALL`, `LC_MESSAGES`, `LANG`) and `NO_COLOR`. */
  env?: Record<string, string | undefined>;
  /** Standard input, when `--stdin` asks for it: one notation to a line. */
  stdin?: string;
  /** Whether the output is a terminal that shows colour. `NO_COLOR` and `--no-color` still turn it off. */
  colour?: boolean;
  /** The system's language where the environment names none: what `Intl` says, on Windows. */
  locale?: string;
  /** The time, in epoch milliseconds, for the rolls made. Now, unless given. */
  now?: number;
  /** Where unseeded rolls come from. The crypto generator, unless given. */
  source?: RandomSource;
};

/** What the command line came to.
 *
 * @example
 * ```ts
 * import type { CliResult } from "@johnmorrisdotca/korokoro";
 * import { runCli } from "@johnmorrisdotca/korokoro";
 * const value: CliResult = runCli(["2d6", "--seed", "docs"]);
 * console.log(value.code);
 * ```
 */
export type CliResult = {
  /** 0 when all went well, 1 when something asked for could not be rolled, 2 when the command itself was wrong. */
  code: 0 | 1 | 2;
  /** For standard output. */
  out: string;
  /** For standard error. */
  err: string;
};

/** The language the command line speaks: `--lang`, or the environment's, or the system's; Japanese for `ja…`, English for anything else.
 *
 * @param flag - Explicit language flag, when supplied.
 * @param env - Environment variables used to choose the language.
 * @param locale - Locale to use when no explicit language is supplied.
 * @returns The language the command line speaks: `--lang`, or the environment's, or the system's; Japanese for `ja…`, English for anything else.

 *
 * @example
 * ```ts
 * import { cliLanguage } from "@johnmorrisdotca/korokoro";
 * console.log(cliLanguage(undefined, { LANG: "ja_JP.UTF-8" }));
 * ```
 */
export function cliLanguage(
  flag: string | undefined,
  env: Record<string, string | undefined> = {},
  locale?: string,
): Language {
  const named = [flag, env.LC_ALL, env.LC_MESSAGES, env.LANG].find(
    (value) => value !== undefined && value !== "" && value !== "C" && value !== "POSIX" && !value.startsWith("C."),
  );
  return (named ?? locale ?? "en").toLowerCase().startsWith("ja") ? "ja" : "en";
}

const FLAGS_WITH_VALUES: Record<string, string> = {
  "-s": "seed",
  "--seed": "seed",
  "-t": "times",
  "--times": "times",
  "--max-dice": "maxDice",
  "-g": "game",
  "--game": "game",
  "--test": "test",
  "--sides": "sides",
  "--lang": "lang",
};
const FLAGS: Record<string, string> = {
  "-o": "odds",
  "--odds": "odds",
  "--games": "games",
  "-j": "json",
  "--json": "json",
  "--csv": "csv",
  "--stdin": "stdin",
  "--no-color": "noColour",
  "--no-colour": "noColour",
  "-h": "help",
  "--help": "help",
  "-v": "version",
  "--version": "version",
};

type Asked = {
  values: Record<string, string>;
  flags: Set<string>;
  dice: string[];
  wrong: { message: "unknown" | "needs"; part: string } | null;
};

/** The arguments sorted into options and dice. An argument that starts with a digit, a `d`, a `[` or a sign and a digit is dice, so `-1d6` style input is never mistaken for an option. */
function sortArguments(args: readonly string[]): Asked {
  const asked: Asked = { values: {}, flags: new Set(), dice: [], wrong: null };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i] as string;
    const [name, inline] =
      arg.startsWith("--") && arg.includes("=")
        ? [arg.slice(0, arg.indexOf("=")), arg.slice(arg.indexOf("=") + 1)]
        : [arg, undefined];
    if (arg === "--") {
      asked.dice.push(...args.slice(i + 1));
      break;
    }
    if (name in FLAGS_WITH_VALUES) {
      const value = inline ?? args[++i];
      if (value === undefined) {
        asked.wrong ??= { message: "needs", part: name };
        break;
      }
      asked.values[FLAGS_WITH_VALUES[name] as string] = value;
    } else if (name in FLAGS && inline === undefined) asked.flags.add(FLAGS[name] as string);
    // The first wrong option is the one reported; the rest are still read, so that the report comes in the language asked for.
    else if (arg.startsWith("-") && !/^-\d/.test(arg)) asked.wrong ??= { message: "unknown", part: arg };
    else asked.dice.push(arg);
  }
  return asked;
}

/**
 * Run the command line. See `koro --help` for what it takes. One seed serves
 * the whole run: the rolls are drawn from it one after another, in the order
 * asked for, so the same command prints the same dice.
 *
 * @param args - Command-line arguments, without the executable name.
 * @param around - Environment, locale, clock and input supplied by the host.
 * @returns Run the command line. See `koro --help` for what it takes. One seed serves the whole run: the rolls are drawn from it one after another, in the order asked for, so the same command prints the same dice.

 *
 * @example
 * ```ts
 * import { runCli } from "@johnmorrisdotca/korokoro";
 * console.log(runCli(["2d6", "--seed", "table"]).code);
 * ```
 */
export function runCli(args: readonly string[], around: CliSurroundings = {}): CliResult {
  const asked = sortArguments(args);
  const env = around.env ?? {};
  const lang = asked.values.lang;
  const language = cliLanguage(lang, env, around.locale);
  const t = WORDS[language];
  const wrong = (message: string): CliResult => ({ code: 2, out: "", err: `korokoro: ${message}\n${t.tryHelp}\n` });
  if (asked.wrong !== null) return wrong(fillIn(t[asked.wrong.message], { part: asked.wrong.part }));
  if (lang !== undefined && lang !== "en" && lang !== "ja") return wrong(t.langBad);
  if (asked.flags.has("help")) return { code: 0, out: t.usage, err: "" };
  if (asked.flags.has("version")) return { code: 0, out: `${VERSION}\n`, err: "" };
  const json = asked.flags.has("json");
  const csv = asked.flags.has("csv");
  if (json && csv) return wrong(t.both);
  const colour =
    around.colour === true && !asked.flags.has("noColour") && (env.NO_COLOR === undefined || env.NO_COLOR === "");
  const bold = (text: string) => (colour ? `\u001b[1m${text}\u001b[0m` : text);

  // A real die's results, tested.
  if (asked.values.test !== undefined) {
    let sides: number | undefined;
    if (asked.values.sides !== undefined) {
      sides = Number(asked.values.sides);
      if (!Number.isInteger(sides) || sides < 2 || sides > 1000) return wrong(t.sidesBad);
    }
    const read = readResults(asked.values.test, sides);
    if (!read.ok) return { code: 1, out: "", err: `korokoro: ${fillIn(t.testBad, { part: read.part })}\n` };
    const test = fairnessTest(read.counts);
    if (json)
      return {
        code: 0,
        out: `${JSON.stringify({ format: EXPORT_FORMAT, test: { sides: read.sides, counts: read.counts, rolls: test.rolls, minimum: test.minimum, statistic: test.statistic, p: test.p, verdict: test.verdict } }, null, 2)}\n`,
        err: "",
      };
    const words =
      test.verdict === "too-few"
        ? t.testFew
        : test.verdict === "fair"
          ? t.testFair
          : test.verdict === "unusual"
            ? t.testUnusual
            : t.testLopsided;
    return {
      code: 0,
      out: `${fillIn(words, { n: test.rolls, sides: read.sides, minimum: test.minimum, p: test.p === null ? "" : percent(test.p, language) })}\n`,
      err: "",
    };
  }

  // The games, listed.
  if (asked.flags.has("games")) {
    if (json)
      return {
        code: 0,
        out: `${JSON.stringify({ format: EXPORT_FORMAT, games: PRESETS.map((p) => ({ id: p.id, name: p.name, nameJa: p.nameJa, aliases: p.aliases, family: p.family, notation: p.notation, says: p.says, saysJa: p.saysJa })) }, null, 2)}\n`,
        err: "",
      };
    const wide = Math.max(...PRESETS.map((p) => p.id.length));
    return {
      code: 0,
      out: PRESETS.map(
        (p) =>
          `${p.id.padEnd(wide)}  ${language === "ja" ? p.nameJa : p.name} (${p.notation}): ${language === "ja" ? p.saysJa : p.says}\n`,
      ).join(""),
      err: "",
    };
  }

  let times: number | undefined;
  if (asked.values.times !== undefined) {
    times = Number(asked.values.times);
    if (!Number.isInteger(times) || times < 1 || times > MAX_TIMES) return wrong(t.timesBad);
  }
  let maxDice = MAX_DICE;
  if (asked.values.maxDice !== undefined) {
    maxDice = Number(asked.values.maxDice);
    if (!Number.isInteger(maxDice) || maxDice < MAX_DICE || maxDice > MAX_DICE_BY_CODE) return wrong(t.maxDiceBad);
  }
  let game: Preset | undefined;
  if (asked.values.game !== undefined) {
    game = getPreset(asked.values.game);
    if (game === undefined)
      return { code: 1, out: "", err: `korokoro: ${fillIn(t.noGame, { part: asked.values.game })}\n` };
  }

  // What to roll: the dice named, the lines of standard input, a game's dice, or 2d6.
  const typed = [
    ...asked.dice,
    ...(asked.flags.has("stdin")
      ? (around.stdin ?? "")
          .split(/\r?\n/)
          .map((line) => line.trim())
          .filter((line) => line !== "")
      : []),
  ];
  const specs: RollSpec[] = [];
  const errors: { input: string; problem: NotationProblem; part: string; message: string }[] = [];
  for (const input of typed) {
    const read = checkNotation(input, { maxDice });
    if (read.ok) specs.push(read.spec);
    // Past ten dice the limit is the one asked for, and the refusal says so, in either language.
    else if (read.problem === "count" && maxDice > MAX_DICE)
      errors.push({
        input,
        problem: read.problem,
        part: read.part,
        message: fillIn(t.countMany, { part: read.part, n: maxDice }),
      });
    else
      errors.push({
        input,
        problem: read.problem,
        part: read.part,
        message: language === "ja" ? fillIn(STRINGS.ja[REFUSALS[read.problem]], { part: read.part }) : read.message,
      });
  }
  if (typed.length === 0)
    specs.push(game !== undefined ? presetSpec(game) : (checkNotation("2d6") as { spec: RollSpec }).spec);
  const err = errors
    .map((e) => `korokoro: ${e.input === e.part || e.part === "" ? "" : `${e.input}: `}${e.message}\n`)
    .join("");
  const code = errors.length > 0 ? 1 : 0;

  if (asked.flags.has("odds")) {
    if (json)
      return {
        code,
        out: `${JSON.stringify({ format: EXPORT_FORMAT, odds: specs.map((spec) => ({ ...oddsOf(spec), ...(game === undefined ? {} : { game: game.id, outcomes: (presetOdds(game, spec, language) ?? []).map((o) => ({ outcome: o.outcome, text: o.text, ways: String(o.ways), outOf: String(o.outOf), chance: o.chance })) }) })), ...(errors.length > 0 ? { errors } : {}) }, null, 2)}\n`,
        err,
      };
    if (csv)
      return {
        code,
        out: `notation,total,chance\r\n${specs
          .flatMap((spec) => {
            const odds = oddsOf(spec);
            return odds.probabilities.map(
              (p, i) =>
                `${odds.notation.includes(",") ? `"${odds.notation}"` : odds.notation},${odds.min + i},${p}\r\n`,
            );
          })
          .join("")}`,
        err,
      };
    const outcomes = (spec: RollSpec) =>
      game === undefined
        ? ""
        : (presetOdds(game, spec, language) ?? [])
            .map((o) => `  ${o.text}: ${percent(o.chance, language)} (${o.ways}/${o.outOf})\n`)
            .join("");
    return { code, out: specs.map((spec) => `${oddsText(spec, language)}${outcomes(spec)}`).join("\n"), err };
  }

  const source = asked.values.seed !== undefined ? seededSource(asked.values.seed) : (around.source ?? cryptoSource());
  const at = around.now ?? Date.now();
  const thrown: Roll[][] = specs.map((spec) => {
    const many = times ?? spec.times ?? 1;
    return many > 1 ? rollMany(spec, many, source, { at, maxDice }).rolls : [roll(spec, source, { at, maxDice })];
  });
  const readings = (rolls: Roll[]) =>
    rolls.map((r, i) => (game === undefined ? null : readPreset(game, r, rolls.slice(0, i), language)));

  if (json) {
    const rolls = thrown.flatMap((rolls) => {
      const read = readings(rolls);
      return rolls.map((r, i): ExportedRoll & { game?: string; reading?: { outcome: string; text: string } } => {
        const out: ExportedRoll & { game?: string; reading?: { outcome: string; text: string } } = exportedRoll(r);
        const reading = read[i];
        if (game !== undefined && reading !== null && reading !== undefined) {
          out.game = game.id;
          out.reading = { outcome: reading.outcome, text: reading.text };
        }
        return out;
      });
    });
    return {
      code,
      out: `${JSON.stringify({ format: EXPORT_FORMAT, generator: `korokoro ${VERSION}`, rolls, ...(errors.length > 0 ? { errors } : {}) }, null, 2)}\n`,
      err,
    };
  }
  if (csv) return { code, out: toCSV(thrown.flat()), err };

  const lines = thrown.map((rolls) => {
    const read = readings(rolls);
    const each = rolls.map((r, i) => {
      const reading = read[i];
      const words = reading !== null && reading !== undefined && reading.text !== "" ? reading.text : null;
      const name =
        game === undefined
          ? formatNotation({ ...r.spec, times: undefined } as RollSpec)
          : `${language === "ja" ? game.nameJa : game.name} (${formatNotation({ ...r.spec, times: undefined } as RollSpec)})`;
      if (!hasTotal(r.spec))
        return `${name}: ${bold(words ?? resultText(r))}${words === null ? "" : `  [${diceText(r)}]`}\n`;
      const headline =
        game !== undefined && !game.total && words !== null
          ? words
          : `${r.total}${words === null ? "" : ` · ${words}`}`;
      return `${name}: ${bold(headline)}  ${r.spec.math !== undefined ? formulaText(r) : `[${diceText(r)}]`}${r.loaded === true ? `  (${t.loaded})` : ""}\n`;
    });
    const first = rolls[0] as Roll;
    const all = setOf(rolls);
    return `${each.join("")}${rolls.length > 1 && hasTotal(first.spec) ? `  ${fillIn(t.sum, { sum: all.sum, highest: all.highest, lowest: all.lowest })}\n` : ""}`;
  });
  return { code, out: lines.join(""), err };
}
