import type { Roll, RollSpec } from "../dice.ts";
import { type DiceGroup, diceOf, dieName, faceRange, groupOf, hasTotal, isLoaded } from "../dice.ts";
import { formatNotation } from "../notation.ts";
import { distributionHolding, luckOf } from "../odds.ts";
import { fairnessTest, statsOf } from "../stats.ts";
import { h } from "./dom.ts";
import { faceText } from "./faces.ts";
import { axis, bars, chartEnd, labelAxis, tailNote } from "./panelsChart.ts";
import type { RealDie } from "./panelsOdds.ts";
import { fairnessWords, realDieSection } from "./panelsOdds.ts";
import { fillIn, type RollerStrings } from "./strings.ts";

export type { RealDie } from "./panelsOdds.ts";
export { fairnessWords, oddsPanel } from "./panelsOdds.ts";

/** The three panels under the tray, each drawn fresh from the state it is handed. */

/** A share as a percentage in the reader's language, with more digits the smaller it is. */
export function percent(x: number, locale: string): string {
  const digits = x > 0 && x < 0.01 ? 2 : x < 0.1 ? 1 : 0;
  return new Intl.NumberFormat(locale, { style: "percent", maximumFractionDigits: digits }).format(x);
}

export function number(x: number, locale: string, digits = 1): string {
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
          {
            "data-kept": String(die.status === "kept"),
            "data-exploded": die.exploded ? "true" : null,
            "data-counts": die.counts === undefined ? null : String(die.counts),
            "data-held": r.held?.[i] === true ? "true" : null,
            "data-first": i > 0 && die.group !== all[i - 1]?.group ? "true" : null,
            "data-loaded": groupOf(r.spec, die).weights !== undefined ? "true" : null,
          },
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
      h(
        "time",
        { datetime: new Date(r.at).toISOString() },
        r.set === undefined ? time.format(r.at) : `${r.set.index + 1}/${r.set.of}`,
      ),
      h(
        "span",
        { style: "display:grid;gap:3px" },
        h("code", {}, `${formatNotation({ ...r.spec, times: undefined })}${heldNote}`),
        mini,
      ),
      h(
        "span",
        { style: "display:inline-flex;align-items:center;gap:8px" },
        h("span", {
          class: "kk-dot",
          style: `background:${luckColour(luck)}`,
          title: fillIn(t.luckier, { percent: percent(luck, locale) }),
        }),
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

export function card(value: string, label: string, testId?: string): HTMLElement {
  return h("div", { class: "kk-card", "data-testid": testId }, h("b", {}, value), h("span", {}, label));
}

/** The history in numbers: luck, streaks, each face's count and the totals against the odds. */
export function statsPanel(
  history: readonly Roll[],
  spec: RollSpec,
  kind: DiceGroup,
  t: RollerStrings,
  locale: string,
  real: RealDie,
): HTMLElement {
  const test = realDieSection(real, t, locale);
  if (history.length === 0)
    return h("div", { class: "kk-panel", style: "padding:0" }, h("p", { class: "kk-empty" }, t.noRolls), test);
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
        h(
          "h4",
          {},
          `${fillIn(t.faces, { sides: name.slice(1), n: faces.dice })}${faces.loaded === true ? ` · ${t.dieLoaded}` : ""}`,
        ),
        bars(
          faces.counts,
          faces.counts.map(() => faces.dice / faces.counts.length),
          null,
        ),
        faces.labels !== undefined
          ? labelAxis(faces.labels)
          : axis(faceRange(faces.sides).low, faceRange(faces.sides).high),
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
        bars(
          totals.seen.slice(0, end + 1),
          totals.expectedShare.slice(0, end + 1).map((p) => p * totals.rolls),
          null,
        ),
        axis(totals.min, totals.min + end),
        tailNote({ min: totals.min, probabilities: totals.expectedShare }, end, t, locale),
        h(
          "p",
          {},
          `${t.seenVsExpected} ${t.average} ${number(totals.average, locale)} · ${t.expected} ${number(totals.expected, locale)}`,
        ),
      ),
    );
  }
  panel.append(test);
  return panel;
}
