import { hasTotal, isSuccessRoll, roll, rollMany, setOf, MAX_TIMES, type Roll, type RollSpec } from "./dice.ts";
import { diceText, exportedRoll, formulaText, resultText, toCSV, EXPORT_FORMAT, type ExportedRoll } from "./export.ts";
import { PRESETS, getPreset, presetOdds, presetSpec, readPreset, type Preset } from "./games/presets.ts";
import { checkNotation, formatNotation, type NotationProblem } from "./notation.ts";
import { distributionOf, expectedTotal, mostLikely, spreadOf } from "./odds.ts";
import { cryptoSource, seededSource, type RandomSource } from "./random.ts";
import { fairnessTest, readResults } from "./stats.ts";
import { REFUSALS, STRINGS, fillIn } from "./ui/strings.ts";
import { VERSION } from "./version.ts";

/**
 * The command line, as a pure function: arguments and surroundings in, what
 * to print and the exit code out. `bin/korokoro.mjs` is the few lines that
 * hand it the real process. Nothing here touches a file, a terminal or the
 * network, so every line of it is tested as plain data.
 */

/** What the command line is run in. All of it is optional. */
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

/** What the command line came to. */
export type CliResult = {
  /** 0 when all went well, 1 when something asked for could not be rolled, 2 when the command itself was wrong. */
  code: 0 | 1 | 2;
  /** For standard output. */
  out: string;
  /** For standard error. */
  err: string;
};

type Language = "en" | "ja";

const WORDS = {
  en: {
    usage: `Usage: korokoro [options] [dice ...]        (also: koro)

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
    testUnusual: "{n} results on a d{sides}: unusual. A fair die strays this far only {p} of the time, which still happens.",
    testLopsided: "{n} results on a d{sides}: lopsided. A fair die strays this far {p} of the time.",
  },
  ja: {
    usage: `使い方: korokoro [オプション] [ダイス ...]        （koro でも同じです）

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

/** The language the command line speaks: `--lang`, or the environment's, or the system's; Japanese for `ja…`, English for anything else. */
export function cliLanguage(flag: string | undefined, env: Record<string, string | undefined> = {}, locale?: string): Language {
  const named = [flag, env.LC_ALL, env.LC_MESSAGES, env.LANG].find((value) => value !== undefined && value !== "" && value !== "C" && value !== "POSIX" && !value.startsWith("C."));
  return (named ?? locale ?? "en").toLowerCase().startsWith("ja") ? "ja" : "en";
}

const FLAGS_WITH_VALUES: Record<string, string> = { "-s": "seed", "--seed": "seed", "-t": "times", "--times": "times", "-g": "game", "--game": "game", "--test": "test", "--sides": "sides", "--lang": "lang" };
const FLAGS: Record<string, string> = { "-o": "odds", "--odds": "odds", "--games": "games", "-j": "json", "--json": "json", "--csv": "csv", "--stdin": "stdin", "--no-color": "noColour", "--no-colour": "noColour", "-h": "help", "--help": "help", "-v": "version", "--version": "version" };

type Asked = { values: Record<string, string>; flags: Set<string>; dice: string[]; wrong: { message: "unknown" | "needs"; part: string } | null };

/** The arguments sorted into options and dice. An argument that starts with a digit, a `d`, a `[` or a sign and a digit is dice, so `-1d6` style input is never mistaken for an option. */
function sortArguments(args: readonly string[]): Asked {
  const asked: Asked = { values: {}, flags: new Set(), dice: [], wrong: null };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i] as string;
    const [name, inline] = arg.startsWith("--") && arg.includes("=") ? [arg.slice(0, arg.indexOf("=")), arg.slice(arg.indexOf("=") + 1)] : [arg, undefined];
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

const percent = (p: number, language: Language) => new Intl.NumberFormat(language, { style: "percent", maximumFractionDigits: p < 0.01 ? 3 : p < 0.1 ? 2 : 1 }).format(p);
const figure = (n: number, language: Language) => new Intl.NumberFormat(language, { maximumFractionDigits: 2 }).format(n);

/** The odds of a roll as the JSON output writes them. */
function oddsOf(spec: RollSpec) {
  const odds = distributionOf(spec);
  return { notation: formatNotation(spec), min: odds.min, max: odds.max, expected: expectedTotal(spec), spread: spreadOf(spec), mostLikely: mostLikely(spec), probabilities: odds.probabilities };
}

/** The odds of a roll as lines of text: the figures, then each total with its chance and a bar. Past forty totals, the forty likeliest. */
function oddsText(spec: RollSpec, language: Language): string {
  const t = WORDS[language];
  const odds = oddsOf(spec);
  const head = `${odds.notation}${isSuccessRoll(spec) ? ` (${t.successes})` : ""}\n  ${fillIn(t.range, { min: odds.min, max: odds.max })} · ${fillIn(t.expected, { n: figure(odds.expected, language) })} · ${fillIn(t.spread, { n: figure(odds.spread, language) })} · ${odds.mostLikely.length > 3 ? t.likelyAll : fillIn(t.likely, { n: odds.mostLikely.join(", ") })}\n`;
  if (!hasTotal(spec)) return head;
  const all = odds.probabilities.map((p, i) => ({ total: odds.min + i, p })).filter((line) => line.p > 0);
  const most = 40;
  // The likeliest forty, a tie going to the lower total, shown in order.
  const likeliest = new Set([...all].sort((a, b) => b.p - a.p || a.total - b.total).slice(0, most));
  const shown = all.filter((line) => likeliest.has(line));
  const floor = Math.max(0, ...all.filter((line) => !likeliest.has(line)).map((line) => line.p));
  const top = Math.max(...all.map((line) => line.p));
  const wide = String(odds.max).length;
  const lines = shown.map((line) => `  ${String(line.total).padStart(wide)}  ${percent(line.p, language).padStart(7)}  ${"#".repeat(Math.max(line.p > 0 ? 1 : 0, Math.round((line.p / top) * 30)))}\n`);
  const left = all.length - shown.length;
  return `${head}${lines.join("")}${left > 0 ? `  ${fillIn(t.more, { n: left, p: percent(floor, language) })}\n` : ""}`;
}

/**
 * Run the command line. See `koro --help` for what it takes. One seed serves
 * the whole run: the rolls are drawn from it one after another, in the order
 * asked for, so the same command prints the same dice.
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
  const colour = around.colour === true && !asked.flags.has("noColour") && (env.NO_COLOR === undefined || env.NO_COLOR === "");
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
    if (json) return { code: 0, out: `${JSON.stringify({ format: EXPORT_FORMAT, test: { sides: read.sides, counts: read.counts, rolls: test.rolls, minimum: test.minimum, statistic: test.statistic, p: test.p, verdict: test.verdict } }, null, 2)}\n`, err: "" };
    const words = test.verdict === "too-few" ? t.testFew : test.verdict === "fair" ? t.testFair : test.verdict === "unusual" ? t.testUnusual : t.testLopsided;
    return { code: 0, out: `${fillIn(words, { n: test.rolls, sides: read.sides, minimum: test.minimum, p: test.p === null ? "" : percent(test.p, language) })}\n`, err: "" };
  }

  // The games, listed.
  if (asked.flags.has("games")) {
    if (json) return { code: 0, out: `${JSON.stringify({ format: EXPORT_FORMAT, games: PRESETS.map((p) => ({ id: p.id, name: p.name, nameJa: p.nameJa, aliases: p.aliases, family: p.family, notation: p.notation, says: p.says, saysJa: p.saysJa })) }, null, 2)}\n`, err: "" };
    const wide = Math.max(...PRESETS.map((p) => p.id.length));
    return { code: 0, out: PRESETS.map((p) => `${p.id.padEnd(wide)}  ${language === "ja" ? p.nameJa : p.name} (${p.notation}): ${language === "ja" ? p.saysJa : p.says}\n`).join(""), err: "" };
  }

  let times: number | undefined;
  if (asked.values.times !== undefined) {
    times = Number(asked.values.times);
    if (!Number.isInteger(times) || times < 1 || times > MAX_TIMES) return wrong(t.timesBad);
  }
  let game: Preset | undefined;
  if (asked.values.game !== undefined) {
    game = getPreset(asked.values.game);
    if (game === undefined) return { code: 1, out: "", err: `korokoro: ${fillIn(t.noGame, { part: asked.values.game })}\n` };
  }

  // What to roll: the dice named, the lines of standard input, a game's dice, or 2d6.
  const typed = [...asked.dice, ...(asked.flags.has("stdin") ? (around.stdin ?? "").split(/\r?\n/).map((line) => line.trim()).filter((line) => line !== "") : [])];
  const specs: RollSpec[] = [];
  const errors: { input: string; problem: NotationProblem; part: string; message: string }[] = [];
  for (const input of typed) {
    const read = checkNotation(input);
    if (read.ok) specs.push(read.spec);
    else errors.push({ input, problem: read.problem, part: read.part, message: language === "ja" ? fillIn(STRINGS.ja[REFUSALS[read.problem]], { part: read.part }) : read.message });
  }
  if (typed.length === 0) specs.push(game !== undefined ? presetSpec(game) : (checkNotation("2d6") as { spec: RollSpec }).spec);
  const err = errors.map((e) => `korokoro: ${e.input === e.part || e.part === "" ? "" : `${e.input}: `}${e.message}\n`).join("");
  const code = errors.length > 0 ? 1 : 0;

  if (asked.flags.has("odds")) {
    if (json) return { code, out: `${JSON.stringify({ format: EXPORT_FORMAT, odds: specs.map((spec) => ({ ...oddsOf(spec), ...(game === undefined ? {} : { game: game.id, outcomes: (presetOdds(game, spec, language) ?? []).map((o) => ({ outcome: o.outcome, text: o.text, ways: String(o.ways), outOf: String(o.outOf), chance: o.chance })) }) })), ...(errors.length > 0 ? { errors } : {}) }, null, 2)}\n`, err };
    if (csv) return { code, out: `notation,total,chance\r\n${specs.flatMap((spec) => { const odds = oddsOf(spec); return odds.probabilities.map((p, i) => `${odds.notation.includes(",") ? `"${odds.notation}"` : odds.notation},${odds.min + i},${p}\r\n`); }).join("")}`, err };
    const outcomes = (spec: RollSpec) => (game === undefined ? "" : (presetOdds(game, spec, language) ?? []).map((o) => `  ${o.text}: ${percent(o.chance, language)} (${o.ways}/${o.outOf})\n`).join(""));
    return { code, out: specs.map((spec) => `${oddsText(spec, language)}${outcomes(spec)}`).join("\n"), err };
  }

  const source = asked.values.seed !== undefined ? seededSource(asked.values.seed) : (around.source ?? cryptoSource());
  const at = around.now ?? Date.now();
  const thrown: Roll[][] = specs.map((spec) => {
    const many = times ?? spec.times ?? 1;
    return many > 1 ? rollMany(spec, many, source, at).rolls : [roll(spec, source, at)];
  });
  const readings = (rolls: Roll[]) => rolls.map((r, i) => (game === undefined ? null : readPreset(game, r, rolls.slice(0, i), language)));

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
    return { code, out: `${JSON.stringify({ format: EXPORT_FORMAT, generator: `korokoro ${VERSION}`, rolls, ...(errors.length > 0 ? { errors } : {}) }, null, 2)}\n`, err };
  }
  if (csv) return { code, out: toCSV(thrown.flat()), err };

  const lines = thrown.map((rolls) => {
    const read = readings(rolls);
    const each = rolls.map((r, i) => {
      const reading = read[i];
      const words = reading !== null && reading !== undefined && reading.text !== "" ? reading.text : null;
      const name = game === undefined ? formatNotation({ ...r.spec, times: undefined } as RollSpec) : `${language === "ja" ? game.nameJa : game.name} (${formatNotation({ ...r.spec, times: undefined } as RollSpec)})`;
      if (!hasTotal(r.spec)) return `${name}: ${bold(words ?? resultText(r))}${words === null ? "" : `  [${diceText(r)}]`}\n`;
      const headline = game !== undefined && !game.total && words !== null ? words : `${r.total}${words === null ? "" : ` · ${words}`}`;
      return `${name}: ${bold(headline)}  ${r.spec.math !== undefined ? formulaText(r) : `[${diceText(r)}]`}${r.loaded === true ? `  (${t.loaded})` : ""}\n`;
    });
    const first = rolls[0] as Roll;
    const all = setOf(rolls);
    return `${each.join("")}${rolls.length > 1 && hasTotal(first.spec) ? `  ${fillIn(t.sum, { sum: all.sum, highest: all.highest, lowest: all.lowest })}\n` : ""}`;
  });
  return { code, out: lines.join(""), err };
}
