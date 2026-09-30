// Rewrites the documents that are made from the source (docs/strings-ja.md so far), by
// running their test with leave to write. On any platform: no shell syntax is involved.
import { spawnSync } from "node:child_process";
import process from "node:process";

const made = spawnSync("pnpm", ["exec", "vitest", "run", "src/docs.test.js"], { stdio: "inherit", shell: process.platform === "win32", env: { ...process.env, UPDATE_DOCS: "1" } });
process.exit(made.status ?? 1);
