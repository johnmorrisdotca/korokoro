#!/usr/bin/env node
// The command line: `korokoro` and `koro`. All of it is `runCli`, a pure
// function in the package; these lines hand it the real process.
import { readFileSync } from "node:fs";
import process from "node:process";

import { runCli } from "../dist/cli.js";

const args = process.argv.slice(2);
let stdin;
if (args.includes("--stdin")) {
  try {
    stdin = readFileSync(0, "utf8");
  } catch {
    // Nothing was piped in: no lines to read.
    stdin = "";
  }
}
const result = runCli(args, {
  env: process.env,
  stdin,
  colour: process.stdout.isTTY === true,
  locale: Intl.DateTimeFormat().resolvedOptions().locale,
});
if (result.out !== "") process.stdout.write(result.out);
if (result.err !== "") process.stderr.write(result.err);
process.exitCode = result.code;
