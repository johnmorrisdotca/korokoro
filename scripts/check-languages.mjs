// Runs the examples on docs/other-languages.md: each is a real program in
// docs/examples/languages that starts `koro` and reads its JSON. The package
// is packed and installed into a scratch prefix first, so that `koro` is the
// command somebody who installed it would have.
//
//   pnpm build && node scripts/check-languages.mjs
//
// A language whose tools are not on this machine is skipped, unless
// KOROKORO_ALL_LANGUAGES is set, as it is in CI, where all four must run.
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const examples = join(root, "docs", "examples", "languages");
const windows = process.platform === "win32";
const scratch = mkdtempSync(join(tmpdir(), "korokoro-languages-"));
const run = (command, args, options = {}) => spawnSync(command, args, { encoding: "utf8", shell: windows, ...options });

const packed = run("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", scratch], { cwd: root });
if (packed.status !== 0) throw new Error(packed.stderr);
const tarball = join(scratch, JSON.parse(packed.stdout)[0].filename);
const prefix = join(scratch, "prefix");
const installed = run("npm", ["install", "--global", "--prefix", prefix, "--no-audit", "--no-fund", "--silent", tarball]);
if (installed.status !== 0) throw new Error(installed.stderr);
const env = { ...process.env, PATH: `${windows ? prefix : join(prefix, "bin")}${delimiter}${process.env.PATH}` };

const languages = [
  ["Python", "python3", ["roll.py"], examples],
  ["Go", "go", ["run", "roll.go"], examples],
  ["Rust", "cargo", ["run", "--quiet"], join(examples, "rust")],
  ["C#", "dotnet", ["run"], join(examples, "csharp")],
];
let failed = 0;
for (const [name, tool, args, cwd] of languages) {
  // Go says its version to `go version`; the others to `--version`.
  if (run(tool, [tool === "go" ? "version" : "--version"]).status !== 0) {
    if (process.env.KOROKORO_ALL_LANGUAGES !== undefined) {
      failed += 1;
      console.log(`FAIL ${name}: ${tool} is not on this machine`);
    } else console.log(`skip ${name}: ${tool} is not on this machine`);
    continue;
  }
  const ran = run(tool, args, { cwd, env });
  const said = ran.stdout.trim().split(/\r?\n/).at(-1);
  if (ran.status === 0 && said === "24") console.log(`ok   ${name} rolled 2d20kh1+5 from the seed "table" and read 24`);
  else {
    failed += 1;
    console.log(`FAIL ${name}: exit ${ran.status}, said ${JSON.stringify(ran.stdout)}\n${ran.stderr}`);
  }
}
rmSync(scratch, { recursive: true, force: true });
process.exit(failed > 0 ? 1 : 0);
