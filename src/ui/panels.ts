import type { Roll, RollSpec } from "../dice.ts";
import { diceOf, dieName, faceRange, groupOf, groupsOf, hasTotal, isLoaded, type DiceGroup } from "../dice.ts";
import { faceChances, loadingOf } from "../loaded.ts";
import { formatNotation } from "../notation.ts";
import { chanceAnyAtLeast, chanceAtLeast, distributionHolding, distributionOf, expectedHighest, expectedTotal, luckOf, mostLikely, spreadOf, type Distribution } from "../odds.ts";
import { chinchirorinHandWithin, crapsPass, yahtzeeWithin } from "../games/odds.ts";
import { presetOdds, type Preset } from "../games/presets.ts";
import { fairnessTest, readResults, statsOf, type Fairness } from "../stats.ts";
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
  const row = (r: Roll): HTMLElement => {
    const mini = h(
      "span",
      { class: "kk-mini" },
      ...diceOf(r).map((die, i, all) =>
        h(
          "span",
          { "data-kept": String(die.status === "kept"), "data-exploded": die.exploded ? "true" : null, "data-counts": die.counts === undefined ? null : String(die.counts), "data-held": r.held?.[i] === true ? "true" : null, "data-first": i > 0 && die.group !== all[i - 1]?.group ? "true" : null, "data-loaded": groupOf(r.spec, die).weights !== undefined ? "true" : null },
          `${faceText(groupOf(r.spec, die), die.face)}${die.exploded ? "!" : die.status === "rerolled" ? "↻" : ""}`,
        ),
      ),
    );
    // A roll with dice held is judged against the dice thrown again.
    const luck = luckOf(r.held !== undefined ? distributionHolding(r.spec, r.faces, r.held) : r.spec, r.total);
    const heldNote = `${r.held !== undefined ? ` · ${fillIn(t.heldBadge, { n: r.held.filter(Boolean).length })}` : ""}${isLoaded(r.spec) ? ` · ${t.dieLoaded}` : ""}`;
    return h(
      "li",
      { "data-testid": "kk-history-row" },
      h("time", { datetime: new Date(r.at).toISOString() }, r.set === undefined ? time.format(r.at) : `${r.set.index + 1}/${r.set.of}`),
      h("span", { style: "display:grid;gap:3px" }, h("code", {}, `${formatNotation({ ...r.spec, times: undefined })}${heldNote}`), mini),
      h(
        "span",
        { style: "display:inline-flex;align-items:center;gap:8px" },
        h("span", { class: "kk-dot", style: `background:${luckColour(luck)}`, title: fillIn(t.luckier, { percent: percent(luck, locale) }) }),
        h("strong", {}, hasTotal(r.spec) ? String(r.total) : ""),
      ),
    );
  };
  const newest = [...history].reverse();
  for (let i = 0; i < newest.length; i++) {
    const r = newest[i] as Roll;
    if (r.set === undefined) {
      list.append(row(r));
      continue;
    }
    // A set thrown together is one entry, which opens to show its rolls.
    const together = [r];
    while (newest[i + 1]?.set?.id === r.set.id) together.push(newest[++i] as Roll);
    together.reverse();
    const first = together[0] as Roll;
    list.append(
      h(
        "li",
        { class: "kk-history-set", "data-testid": "kk-history-set" },
        h(
          "details",
          {},
          h(
            "summary",
            {},
            h("time", { datetime: new Date(first.at).toISOString() }, time.format(first.at)),
            h("code", {}, formatNotation({ ...first.spec, times: together.length })),
            h("strong", {}, together.map((one) => (hasTotal(one.spec) ? String(one.total) : "·")).join(" · ")),
          ),
          h("ol", { class: "kk-history" }, ...together.map(row)),
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

/** The words of a custom die's faces under their bars, each cut short where it would not fit. */
function labelAxis(labels: string[]): HTMLElement {
  return h("div", { class: "kk-axis kk-axis-words" }, ...labels.map((label) => h("span", { title: label }, label)));
}

function axis(from: number, to: number): HTMLElement {
  const mid = Math.round((from + to) / 2);
  return h("div", { class: "kk-axis" }, h("span", {}, String(from)), h("span", {}, String(mid)), h("span", {}, String(to)));
}

/** What a fairness test found, as a plain sentence: never a verdict on a handful of rolls, and the odds exact when there is one. */
export function fairnessWords(test: Fairness, t: RollerStrings, locale: string): string {
  if (test.verdict === "too-few") return `${t.fairnessWait} ${fillIn(t.fairnessCount, { n: test.rolls, min: test.minimum })}`;
  const p = test.p as number;
  if (test.verdict === "fair") return fillIn(t.fairnessOk, { percent: percent(p, locale) });
  if (test.verdict === "unusual") return fillIn(t.fairnessOdd, { percent: percent(p, locale) });
  // Past a million to one the exact figure stops meaning anything to anybody.
  const odds = p < 1e-6 ? new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 0 }).format(1e6) + "+" : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(1 / p);
  return fillIn(t.fairnessLopsided, { odds });
}

/** What somebody has typed into "Test a real die", kept by the tray so that a roll does not wipe it. */
export type RealDie = { open: boolean; text: string; sides: string };

/** Results from a real die, typed or pasted, and what the fairness test makes of them. It makes no roll. */
function realDieSection(real: RealDie, t: RollerStrings, locale: string): HTMLElement {
  const box = h("textarea", { class: "kk-field kk-results", rows: 2, placeholder: t.testHint, "aria-label": t.testHint, inputmode: "numeric", autocomplete: "off", "data-testid": "kk-test-results" });
  box.value = real.text;
  const sides = h("input", { type: "text", class: "kk-field", inputmode: "numeric", value: real.sides, placeholder: "6", "aria-label": t.testSides, style: "width:4.5rem", "data-testid": "kk-test-sides" });
  const verdict = h("p", { "aria-live": "polite", "data-testid": "kk-test-verdict" });
  const chart = h("div", {});
  const judge = () => {
    real.text = box.value;
    real.sides = sides.value;
    const size = /^\d{1,3}$/.test(sides.value.trim()) && Number(sides.value) >= 2 ? Number(sides.value) : undefined;
    const typed = readResults(box.value, size);
    chart.replaceChildren();
    if (!typed.ok) {
      verdict.textContent = fillIn(t.testBad, { part: typed.part });
      return;
    }
    if (typed.rolls === 0) {
      verdict.textContent = "";
      return;
    }
    const test = fairnessTest(typed.counts);
    verdict.textContent = fairnessWords(test, t, locale);
    chart.append(h("h4", {}, fillIn(t.faces, { sides: typed.sides, n: typed.rolls })), bars(typed.counts, test.expected, null), axis(1, typed.sides));
  };
  box.addEventListener("input", judge);
  sides.addEventListener("input", judge);
  judge();
  const details = h("details", { class: "kk-settings", open: real.open, "data-testid": "kk-test" }, h("summary", {}, t.testTitle), h("div", { class: "kk-row" }, box, h("label", { class: "kk-label" }, t.testSides), sides), h("section", { class: "kk-chart" }, chart, verdict));
  details.addEventListener("toggle", () => (real.open = details.open));
  return details;
}

/** The history in numbers: luck, streaks, each face's count and the totals against the odds. */
export function statsPanel(history: readonly Roll[], spec: RollSpec, kind: DiceGroup, t: RollerStrings, locale: string, real: RealDie): HTMLElement {
  const test = realDieSection(real, t, locale);
  if (history.length === 0) return h("div", { class: "kk-panel", style: "padding:0" }, h("p", { class: "kk-empty" }, t.noRolls), test);
  const stats = statsOf(history, spec, kind);
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
    // A numbered die, loaded or not, is tested against the fair die of its size: that is how a loaded one is found out.
    const verdict = fairnessWords(fairnessTest(faces.counts), t, locale);
    const name = dieName(kind);
    panel.append(
      h(
        "section",
        { class: "kk-chart", "data-testid": "kk-faces" },
        h("h4", {}, `${fillIn(t.faces, { sides: name.slice(1), n: faces.dice })}${faces.loaded === true ? ` · ${t.dieLoaded}` : ""}`),
        bars(faces.counts, faces.counts.map(() => faces.dice / faces.counts.length), null),
        faces.labels !== undefined ? labelAxis(faces.labels) : axis(faceRange(faces.sides).low, faceRange(faces.sides).high),
        h("p", { "data-testid": "kk-fairness" }, verdict),
      ),
    );
  }
  const totals = stats.totals;
  if (totals !== null && totals.rolls > 0 && hasTotal(spec)) {
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
  panel.append(test);
  return panel;
}

/** The same roll with every die fair: a loaded roll's odds are drawn against it. */
function specFair(spec: RollSpec): RollSpec {
  const [first, ...more] = groupsOf(spec).map((g) => {
    const fair = { ...g };
    delete fair.weights;
    return fair;
  });
  const out: RollSpec = { ...(first as DiceGroup), modifier: spec.modifier };
  if (more.length > 0) out.more = more;
  return out;
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
  game: Preset | null = null,
  language: "en" | "ja" = "en",
): HTMLElement {
  const times = spec.times ?? 1;
  // How the game's roll comes out, outcome by outcome, each counted exactly.
  const outcomes = game === null || holding !== null ? null : presetOdds(game, spec, language);
  const share = (ways: bigint, outOf: bigint) => `${percent(Number(ways) / Number(outOf), locale)} · ${ways.toLocaleString(locale)}/${outOf.toLocaleString(locale)}`;
  const further: [string, [bigint, bigint]][] = game?.id === "yahtzee" ? [[t.yahtzeeWithin, yahtzeeWithin(3)]] : game?.id === "craps" ? [[t.crapsPass, crapsPass()]] : game?.id === "chinchirorin" ? [[t.chinchirorinWithin, chinchirorinHandWithin(3)]] : [];
  const gameOdds =
    outcomes === null && further.length === 0
      ? null
      : h(
          "section",
          { class: "kk-chart", "data-testid": "kk-outcomes" },
          h("h4", {}, t.outcomes),
          h(
            "dl",
            { class: "kk-outcomes" },
            ...[...(outcomes ?? [])].sort((a, b) => b.chance - a.chance).flatMap((line) => [h("dt", {}, line.text), h("dd", {}, share(line.ways, line.outOf))]),
            ...further.flatMap(([words, [ways, outOf]]) => [h("dt", {}, words), h("dd", {}, share(ways, outOf))]),
          ),
        );
  const kinds = groupsOf(spec);
  const only = kinds.length === 1 ? (kinds[0] as DiceGroup) : null;
  // A die of words has no totals to have odds of: its odds are how often each face comes up.
  if (!hasTotal(spec) && only !== null) {
    const faces = faceChances(only);
    return h(
      "div",
      { class: "kk-panel", style: "padding:0", "data-testid": "kk-odds" },
      h(
        "section",
        { class: "kk-chart" },
        h("h4", { "data-testid": "kk-odds-title" }, fillIn(t.oddsFaces, { die: dieName(only) })),
        bars(faces.map((f) => f.chance), null, null),
        labelAxis(faces.map((f) => f.label)),
        h("p", {}, faces.map((f) => `${f.label} ${percent(f.chance, locale)}`).join(" · ")),
      ),
    );
  }
  // With dice held, the odds are those of the dice still to roll, on top of the held ones.
  const d = holding?.odds ?? distributionOf(spec);
  // A loaded roll is drawn over the fair one: the bars are the dice as loaded, the marks the same dice if they were fair.
  const loading = holding === null && isLoaded(spec) ? (only !== null ? loadingOf(only) : null) : null;
  const fair = holding === null && isLoaded(spec) ? distributionOf(specFair(spec)) : null;
  const fairMarks = fair === null ? null : d.probabilities.map((_, i) => fair.probabilities[d.min + i - fair.min] ?? 0);
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
      bars(d.probabilities.slice(0, end + 1), fairMarks === null ? null : fairMarks.slice(0, end + 1), now),
      axis(min, min + end),
      tailNote(d, end, t, locale),
      loading !== null
        ? h("p", { "data-testid": "kk-odds-loaded" }, fillIn(t.oddsLoaded, { face: loading.face, a: loading.loaded[0], b: loading.loaded[1], c: loading.fair[0], d: loading.fair[1] }))
        : fair !== null
          ? h("p", { "data-testid": "kk-odds-loaded" }, t.oddsLoadedMixed)
          : null,
    ),
    h(
      "div",
      { class: "kk-target" },
      h("label", { class: "kk-label" }, t.target),
      input,
      chance,
      said,
    ),
    // A set of rolls: the chance that any one of them reaches the target, and the highest to expect.
    times > 1 && holding === null
      ? h("p", { class: "kk-fine", "data-testid": "kk-set-odds" }, `${fillIn(t.anyAtLeast, { n: times, target })}: ${percent(chanceAnyAtLeast(d, target, times), locale)} · ${fillIn(t.expectedHighest, { n: times })}: ${number(expectedHighest(d, times), locale)}`)
      : null,
    gameOdds,
  );
}
