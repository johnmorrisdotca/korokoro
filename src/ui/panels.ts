import type { Roll, RollSpec } from "../dice.ts";
import { diceOf, faceRange, groupsOf, sidesOf, type Sides } from "../dice.ts";
import { formatNotation } from "../notation.ts";
import { chanceAtLeast, distributionHolding, distributionOf, expectedTotal, luckOf, mostLikely, spreadOf, type Distribution } from "../odds.ts";
import { statsOf } from "../stats.ts";
import { h } from "./dom.ts";
import { faceText } from "./faces.ts";
import { fillIn, type RollerStrings } from "./strings.ts";

/** The three panels under the tray, each drawn fresh from the state it is handed. */

/** A share as a percentage in the reader's language, with more digits the smaller it is. */
export function percent(x: number, locale: string): string {
  const digits = x > 0 && x < 0.01 ? 2 : x < 0.1 ? 1 : 0;
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: digits }).format(x);
}

function number(x: number, locale: string, digits = 1): string {
  return new Intl.NumberFormat(locale, { maximumFractionDigits: digits }).format(x);
}

/** Red below average, gold on it, green above: the same scale the luck meter uses. */
export function luckColour(luck: number): string {
  return luck < 0.35 ? "var(--kk-bad)" : luck > 0.65 ? "var(--kk-good)" : "#e0b43b";
}

/** Every roll kept, newest first: when, what was rolled, each die and the total. */
export function historyPanel(history: readonly Roll[], t: RollerStrings, locale: string): HTMLElement {
  if (history.length === 0) return h("p", { class: "kk-empty", "data-testid": "kk-history-empty" }, t.noRolls);
  const time = new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  const list = h("ol", { class: "kk-history", "data-testid": "kk-history", reversed: true });
  for (const r of [...history].reverse()) {
    const mini = h(
      "span",
      { class: "kk-mini" },
      ...diceOf(r).map((die, i, all) =>
        h(
          "span",
          { "data-kept": String(die.status === "kept"), "data-exploded": die.exploded ? "true" : null, "data-held": r.held?.[i] === true ? "true" : null, "data-first": i > 0 && die.group !== all[i - 1]?.group ? "true" : null },
          `${faceText(sidesOf(r.spec, die), die.face)}${die.exploded ? "!" : die.status === "rerolled" ? "↻" : ""}`,
        ),
      ),
    );
    // A roll with dice held is judged against the dice thrown again.
    const luck = luckOf(r.held !== undefined ? distributionHolding(r.spec, r.faces, r.held) : r.spec, r.total);
    const heldNote = r.held !== undefined ? ` · ${fillIn(t.heldBadge, { n: r.held.filter(Boolean).length })}` : "";
    list.append(
      h(
        "li",
        { "data-testid": "kk-history-row" },
        h("time", { datetime: new Date(r.at).toISOString() }, time.format(r.at)),
        h("span", { style: "display:grid;gap:3px" }, h("code", {}, `${formatNotation(r.spec)}${heldNote}`), mini),
        h(
          "span",
          { style: "display:inline-flex;align-items:center;gap:8px" },
          h("span", { class: "kk-dot", style: `background:${luckColour(luck)}`, title: fillIn(t.luckier, { percent: percent(luck, locale) }) }),
          h("strong", {}, String(r.total)),
        ),
      ),
    );
  }
  return list;
}

function card(value: string, label: string, testId?: string): HTMLElement {
  return h("div", { class: "kk-card", "data-testid": testId }, h("b", {}, value), h("span", {}, label));
}

/**
 * As many bars as a chart draws: what fits the panel on a phone at two pixels
 * a bar. A chart of more values draws neighbours together, each bar their sum.
 */
const MOST_BARS = 80;

function gathered(values: number[], width: number): number[] {
  if (width === 1) return values;
  const out = new Array<number>(Math.ceil(values.length / width)).fill(0);
  values.forEach((v, i) => (out[Math.floor(i / width)] = (out[Math.floor(i / width)] as number) + v));
  return out;
}

/**
 * Where a chart of exploding dice stops: the first total past which
 * everything left comes up less than one time in a thousand, or the last
 * index in `upTo` if that is further. Other charts run to their end.
 */
function chartEnd(spec: RollSpec, probabilities: number[], upTo: number): number {
  const last = probabilities.length - 1;
  if (!groupsOf(spec).some((g) => g.explode === true)) return last;
  let tail = 0;
  let end = last;
  while (end > 0 && tail + (probabilities[end] as number) < 0.001) tail += probabilities[end--] as number;
  return Math.max(end, Math.min(last, upTo));
}

function tailNote(d: { min: number; probabilities: number[] }, end: number, t: RollerStrings, locale: string): HTMLElement | null {
  if (end >= d.probabilities.length - 1) return null;
  const tail = d.probabilities.slice(end + 1).reduce((a, b) => a + b, 0);
  return h("p", { "data-testid": "kk-tail" }, fillIn(t.chartTail, { total: d.min + end, percent: percent(tail, locale) }));
}

/** Bars with an optional expected mark over each, scaled to the tallest of either. */
function bars(all: number[], allExpected: number[] | null, nowAt: number | null): HTMLElement {
  const width = Math.ceil(all.length / MOST_BARS);
  const values = gathered(all, width);
  const expected = allExpected === null ? null : gathered(allExpected, width);
  const now = nowAt === null ? null : Math.floor(nowAt / width);
  const top = Math.max(1e-9, ...values, ...(expected ?? []));
  return h(
    "div",
    { class: "kk-bars", "aria-hidden": "true" },
    ...values.map((v, i) => {
      const bar = h("span", { class: "kk-bar", "data-now": String(now === i) }, h("b", { style: `height:${(v / top) * 100}%` }));
      const e = expected?.[i];
      if (e !== undefined) bar.append(h("i", { style: `bottom:calc(${(e / top) * 100}% - 1px)` }));
      return bar;
    }),
  );
}

function axis(from: number, to: number): HTMLElement {
  const mid = Math.round((from + to) / 2);
  return h("div", { class: "kk-axis" }, h("span", {}, String(from)), h("span", {}, String(mid)), h("span", {}, String(to)));
}

/** The history in numbers: luck, streaks, each face's count and the totals against the odds. */
export function statsPanel(history: readonly Roll[], spec: RollSpec, sides: Sides, t: RollerStrings, locale: string): HTMLElement {
  if (history.length === 0) return h("p", { class: "kk-empty" }, t.noRolls);
  const stats = statsOf(history, spec, sides);
  const panel = h("div", { class: "kk-panel", style: "padding:0", "data-testid": "kk-stats" });
  const cards = h(
    "div",
    { class: "kk-cards" },
    card(String(stats.rolls), t.rolls, "kk-stat-rolls"),
    card(String(stats.diceThrown), t.diceThrown),
    card(stats.luck === null ? "–" : percent(stats.luck, locale), t.luck),
    card(String(stats.longestHot), t.hotStreak),
    card(String(stats.longestCold), t.coldStreak),
    card(String(stats.matches), t.matches),
  );
  if (stats.naturalTwenties + stats.naturalOnes > 0) {
    cards.append(card(String(stats.naturalTwenties), t.nat20), card(String(stats.naturalOnes), t.nat1));
  }
  panel.append(cards, h("p", { class: "kk-empty", style: "padding:0;text-align:left;font-size:.8rem" }, t.luckHint));

  const faces = stats.faces;
  if (faces !== null && faces.dice > 0) {
    const verdict =
      faces.fairness === null
        ? t.fairnessWait
        : fillIn(faces.fairness < 0.01 ? t.fairnessOdd : t.fairnessOk, { percent: percent(faces.fairness, locale) });
    panel.append(
      h(
        "section",
        { class: "kk-chart" },
        h("h4", {}, fillIn(t.faces, { sides: faces.sides, n: faces.dice })),
        bars(faces.counts, faces.counts.map(() => faces.dice / faces.counts.length), null),
        axis(faceRange(faces.sides).low, faceRange(faces.sides).high),
        h("p", {}, verdict),
      ),
    );
  }
  const totals = stats.totals;
  if (totals !== null && totals.rolls > 0) {
    const end = chartEnd(spec, totals.expectedShare, totals.highest - totals.min);
    panel.append(
      h(
        "section",
        { class: "kk-chart" },
        h("h4", {}, fillIn(t.totals, { notation: totals.notation, n: totals.rolls })),
        bars(totals.seen.slice(0, end + 1), totals.expectedShare.slice(0, end + 1).map((p) => p * totals.rolls), null),
        axis(totals.min, totals.min + end),
        tailNote({ min: totals.min, probabilities: totals.expectedShare }, end, t, locale),
        h("p", {}, `${t.seenVsExpected} ${t.average} ${number(totals.average, locale)} · ${t.expected} ${number(totals.expected, locale)}`),
      ),
    );
  }
  return panel;
}

/** The odds of the dice showing: the average, the spread, every total's chance and the chance to reach a target. */
export function oddsPanel(
  spec: RollSpec,
  target: number,
  current: Roll | null,
  t: RollerStrings,
  locale: string,
  onTarget: (value: number) => void,
  holding: { odds: Distribution; held: number; rest: string } | null = null,
): HTMLElement {
  // With dice held, the odds are those of the dice still to roll, on top of the held ones.
  const d = holding?.odds ?? distributionOf(spec);
  const { min, max } = d;
  const now = holding === null && current !== null && formatNotation(current.spec) === formatNotation(spec) ? current.total - d.min : null;
  const end = chartEnd(spec, d.probabilities, now ?? 0);
  const input = h("input", {
    type: "number",
    inputmode: "numeric",
    value: String(target),
    min: String(min),
    max: String(max),
    "aria-label": t.target,
    "data-testid": "kk-target",
  });
  const chance = h("span", { class: "kk-big", "data-testid": "kk-chance" }, percent(chanceAtLeast(d, target), locale));
  const said = h("span", { style: "color:var(--kk-muted);font-size:.85rem" }, fillIn(t.chanceAtLeast, { target }));
  // Updated in place, so the field keeps its focus while somebody types.
  input.addEventListener("input", () => {
    if (input.value.trim() === "") return;
    const value = Math.trunc(Number(input.value));
    if (!Number.isFinite(value)) return;
    chance.textContent = percent(chanceAtLeast(d, value), locale);
    said.textContent = fillIn(t.chanceAtLeast, { target: value });
    onTarget(value);
  });
  return h(
    "div",
    { class: "kk-panel", style: "padding:0", "data-testid": "kk-odds" },
    h(
      "div",
      { class: "kk-cards" },
      card(number(expectedTotal(d), locale), t.expected),
      card(`±${number(spreadOf(d), locale)}`, t.spread),
      card(mostLikely(d).length > 3 ? `${min}–${max}` : mostLikely(d).join(", "), t.mostLikely),
      card(`${min}–${max}`, t.range),
    ),
    h(
      "section",
      { class: "kk-chart" },
      h("h4", { "data-testid": "kk-odds-title" }, holding === null ? formatNotation(spec) : fillIn(t.oddsHolding, { n: holding.held, notation: holding.rest })),
      bars(d.probabilities.slice(0, end + 1), null, now),
      axis(min, min + end),
      tailNote(d, end, t, locale),
    ),
    h(
      "div",
      { class: "kk-target" },
      h("label", { class: "kk-label" }, t.target),
      input,
      chance,
      said,
    ),
  );
}
