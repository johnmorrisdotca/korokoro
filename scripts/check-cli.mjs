// Runs the built command line as a person would: as a child process, on
// whatever system this is. `pnpm test:cli` builds first. The rules of the
// command line are tested as plain data in src/cli.test.ts; this is the part
// only a real process can show: the exit code, the two streams, standard
// input, the environment.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bin = join(root, "bin", "korokoro.mjs");
const { version } = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
// An environment with no language of its own, so each case says what it means.
const bare = { ...process.env, LC_ALL: "", LC_MESSAGES: "", LANG: "en_US.UTF-8", NO_COLOR: "" };

let failed = 0;
function check(what, args, want, { input, env } = {}) {
  const ran = spawnSync(process.execPath, [bin, ...args], { input, encoding: "utf8", env: { ...bare, ...env } });
  const got = { code: ran.status, out: ran.stdout, err: ran.stderr };
  const problems = [];
  if (want.code !== undefined && got.code !== want.code) problems.push(`exit code ${got.code}, wanted ${want.code}`);
  for (const stream of ["out", "err"]) {
    const wanted = want[stream];
    if (wanted === undefined) continue;
    const ok = wanted instanceof RegExp ? wanted.test(got[stream]) : typeof wanted === "function" ? wanted(got[stream]) : got[stream] === wanted;
    if (!ok) problems.push(`${stream} was ${JSON.stringify(got[stream])}, wanted ${wanted instanceof RegExp ? wanted : JSON.stringify(wanted)}`);
  }
  if (problems.length > 0) failed += 1;
  console.log(`${problems.length === 0 ? "ok  " : "FAIL"} ${what}${problems.map((p) => `\n       ${p}`).join("")}`);
  return got;
}

check("the version", ["--version"], { code: 0, out: `${version}\n`, err: "" });
check("help", ["--help"], { code: 0, out: /^Usage: korokoro/, err: "" });
check("a seeded roll", ["4d6dl1", "1d20", "--seed", "table"], { code: 0, out: "4d6kh3: 8  [1 2 (1) 5]\n1d20: 18  [18]\n", err: "" });
check("nothing asked for is 2d6", [], { code: 0, out: /^2d6: \d+ {2}\[\d \d\]\n$/, err: "" });
check("a refusal goes to standard error, with exit code 1", ["11d6"], { code: 1, out: "", err: "korokoro: 11d6: “11”: roll 1 to 10 dice at a time\n" });
check("a wrong option is exit code 2", ["--bogus"], { code: 2, out: "", err: /unknown option --bogus/ });
check("standard input, one roll to a line", ["--stdin", "--seed", "table"], { code: 0, out: "4d6kh3: 8  [1 2 (1) 5]\n1d20: 18  [18]\n", err: "" }, { input: "4d6dl1\n1d20\n" });
check("standard input with Windows line endings", ["--stdin", "--seed", "table"], { code: 0, out: "4d6kh3: 8  [1 2 (1) 5]\n1d20: 18  [18]\n", err: "" }, { input: "4d6dl1\r\n\r\n1d20\r\n" });
check("empty standard input", ["--stdin", "--seed", "table"], { code: 0, out: /^2d6: / }, { input: "" });
const json = check("JSON", ["2d6+3", "--seed", "table", "--json"], { code: 0, out: /^\{\n {2}"format": 1,/, err: "" });
try {
  const data = JSON.parse(json.out);
  if (data.rolls.length !== 1 || data.rolls[0].notation !== "2d6+3" || data.rolls[0].seed !== "table") throw new Error("not the roll asked for");
  console.log("ok   the JSON parses, and is the roll asked for");
} catch (error) {
  failed += 1;
  console.log(`FAIL the JSON parses: ${error.message}`);
}
check("CSV, ended CRLF", ["2d6", "--seed", "table", "--csv"], { code: 0, out: /^time,notation,label,total,dice,faces,seed,held,loaded,set\r\n[^\r\n]+\r\n$/, err: "" });
check("the odds", ["--odds", "2d6"], { code: 0, out: /range 2 to 12 · expected 7/, err: "" });
check("a game", ["--game", "yahtzee", "--seed", "table"], { code: 0, out: "Yahtzee (5d6): Chance, for 13  [1 2 1 5 4]\n", err: "" });
check("the games", ["--games"], { code: 0, out: /^backgammon|\nyahtzee /, err: "" });
check("more than ten dice, when asked for", ["40d6", "--seed", "table", "--max-dice", "100"], { code: 0, out: /^40d6: \d+ {2}\[(\d ){39}\d\]\n$/, err: "" });
check("more than ten dice, when not", ["40d6"], { code: 1, out: "", err: "korokoro: 40d6: “40”: roll 1 to 10 dice at a time\n" });
check("--max-dice past a hundred", ["2d6", "--max-dice", "101"], { code: 2, out: "", err: /--max-dice takes a whole number from 10 to 100/ });
check("a real die", ["--test", "3 5 6 6 1 2"], { code: 0, out: "6 results on a d6: too few to say. The test wants 30.\n", err: "" });
check("Japanese by flag", ["--game", "cho-han", "--seed", "table", "--lang", "ja"], { code: 0, out: /^丁半 \(2d6\): (丁|半)/, err: "" });
check("Japanese by LANG", ["--help"], { code: 0, out: /^使い方: korokoro/ }, { env: { LANG: "ja_JP.UTF-8" } });
check("Japanese by LC_ALL over LANG", ["11d6"], { code: 1, err: "korokoro: 11d6: 「11」: 一度に振れるのは1〜10個です\n" }, { env: { LC_ALL: "ja_JP.UTF-8", LANG: "en_US.UTF-8" } });
check("English by flag over LANG", ["--help", "--lang", "en"], { code: 0, out: /^Usage: korokoro/ }, { env: { LANG: "ja_JP.UTF-8" } });
const plain = (text) => !text.includes(String.fromCharCode(27));
check("no colour when piped", ["2d6", "--seed", "table"], { code: 0, out: plain });
check("NO_COLOR is honoured", ["2d6", "--seed", "table"], { code: 0, out: plain }, { env: { NO_COLOR: "1" } });

if (failed > 0) {
  console.log(`${failed} failed`);
  process.exit(1);
}
console.log("the command line does what it says, on", process.platform, process.version);
