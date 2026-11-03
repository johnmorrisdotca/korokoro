import type { Language } from "./cliWords.data.ts";
import { WORDS } from "./cliWords.data.ts";
import { hasTotal, isSuccessRoll, type RollSpec } from "./dice.ts";
import { formatNotation } from "./notation.ts";
import { distributionOf, expectedTotal, mostLikely, spreadOf } from "./odds.ts";
import { fillIn } from "./ui/strings.ts";

export const percent = (p: number, language: Language) =>
  new Intl.NumberFormat(language, { style: "percent", maximumFractionDigits: p < 0.01 ? 3 : p < 0.1 ? 2 : 1 }).format(
    p,
  );
const figure = (n: number, language: Language) =>
  new Intl.NumberFormat(language, { maximumFractionDigits: 2 }).format(n);

/** The odds of a roll as the JSON output writes them. */
export function oddsOf(spec: RollSpec) {
  const odds = distributionOf(spec);
  return {
    notation: formatNotation(spec),
    min: odds.min,
    max: odds.max,
    expected: expectedTotal(spec),
    spread: spreadOf(spec),
    mostLikely: mostLikely(spec),
    probabilities: odds.probabilities,
  };
}

/** The odds of a roll as lines of text: the figures, then each total with its chance and a bar. Past forty totals, the forty likeliest. */
export function oddsText(spec: RollSpec, language: Language): string {
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
  const lines = shown.map(
    (line) =>
      `  ${String(line.total).padStart(wide)}  ${percent(line.p, language).padStart(7)}  ${"#".repeat(Math.max(line.p > 0 ? 1 : 0, Math.round((line.p / top) * 30)))}\n`,
  );
  const left = all.length - shown.length;
  return `${head}${lines.join("")}${left > 0 ? `  ${fillIn(t.more, { n: left, p: percent(floor, language) })}\n` : ""}`;
}
