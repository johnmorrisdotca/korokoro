import type { Roll, RollSpec } from "../dice.ts";
import { type DiceGroup, dieName, groupsOf, hasTotal, isLoaded } from "../dice.ts";
import { chinchirorinHandWithin, crapsPass, yahtzeeWithin } from "../games/odds.ts";
import { type Preset, presetOdds } from "../games/presets.ts";
import { faceChances, loadingOf } from "../loaded.ts";
import { formatNotation } from "../notation.ts";
import {
  chanceAnyAtLeast,
  chanceAtLeast,
  type Distribution,
  distributionOf,
  expectedHighest,
  expectedTotal,
  mostLikely,
  spreadOf,
} from "../odds.ts";
import { type Fairness, fairnessTest, readResults } from "../stats.ts";
import { h } from "./dom.ts";
import { card, number, percent } from "./panels.ts";
import { axis, bars, chartEnd, labelAxis, tailNote } from "./panelsChart.ts";
import { fillIn, type RollerStrings } from "./strings.ts";

/** What a fairness test found, as a plain sentence: never a verdict on a handful of rolls, and the odds exact when there is one. */
export function fairnessWords(test: Fairness, t: RollerStrings, locale: string): string {
  if (test.verdict === "too-few")
    return `${t.fairnessWait} ${fillIn(t.fairnessCount, { n: test.rolls, min: test.minimum })}`;
  const p = test.p as number;
  if (test.verdict === "fair") return fillIn(t.fairnessOk, { percent: percent(p, locale) });
  if (test.verdict === "unusual") return fillIn(t.fairnessOdd, { percent: percent(p, locale) });
  // Past a million to one the exact figure stops meaning anything to anybody.
  const odds =
    p < 1e-6
      ? `${new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: 0 }).format(1e6)}+`
      : new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(1 / p);
  return fillIn(t.fairnessLopsided, { odds });
}

/** What somebody has typed into "Test a real die", kept by the tray so that a roll does not wipe it. */
export type RealDie = { open: boolean; text: string; sides: string };

/** Results from a real die, typed or pasted, and what the fairness test makes of them. It makes no roll. */
export function realDieSection(real: RealDie, t: RollerStrings, locale: string): HTMLElement {
  const box = h("textarea", {
    class: "kk-field kk-results",
    rows: 2,
    placeholder: t.testHint,
    "aria-label": t.testHint,
    inputmode: "numeric",
    autocomplete: "off",
    "data-testid": "kk-test-results",
  });
  box.value = real.text;
  const sides = h("input", {
    type: "text",
    class: "kk-field",
    inputmode: "numeric",
    value: real.sides,
    placeholder: "6",
    "aria-label": t.testSides,
    style: "width:4.5rem",
    "data-testid": "kk-test-sides",
  });
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
    chart.append(
      h("h4", {}, fillIn(t.faces, { sides: typed.sides, n: typed.rolls })),
      bars(typed.counts, test.expected, null),
      axis(1, typed.sides),
    );
  };
  box.addEventListener("input", judge);
  sides.addEventListener("input", judge);
  judge();
  const details = h(
    "details",
    { class: "kk-settings", open: real.open, "data-testid": "kk-test" },
    h("summary", {}, t.testTitle),
    h("div", { class: "kk-row" }, box, h("label", { class: "kk-label" }, t.testSides), sides),
    h("section", { class: "kk-chart" }, chart, verdict),
  );
  details.addEventListener("toggle", () => (real.open = details.open));
  return details;
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
  const share = (ways: bigint, outOf: bigint) =>
    `${percent(Number(ways) / Number(outOf), locale)} · ${ways.toLocaleString(locale)}/${outOf.toLocaleString(locale)}`;
  const further: [string, [bigint, bigint]][] =
    game?.id === "yahtzee"
      ? [[t.yahtzeeWithin, yahtzeeWithin(3)]]
      : game?.id === "craps"
        ? [[t.crapsPass, crapsPass()]]
        : game?.id === "chinchirorin"
          ? [[t.chinchirorinWithin, chinchirorinHandWithin(3)]]
          : [];
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
            ...[...(outcomes ?? [])]
              .sort((a, b) => b.chance - a.chance)
              .flatMap((line) => [h("dt", {}, line.text), h("dd", {}, share(line.ways, line.outOf))]),
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
        bars(
          faces.map((f) => f.chance),
          null,
          null,
        ),
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
  const now =
    holding === null && current !== null && formatNotation(current.spec) === formatNotation(spec)
      ? current.total - d.min
      : null;
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
      h(
        "h4",
        { "data-testid": "kk-odds-title" },
        holding === null ? formatNotation(spec) : fillIn(t.oddsHolding, { n: holding.held, notation: holding.rest }),
      ),
      bars(d.probabilities.slice(0, end + 1), fairMarks === null ? null : fairMarks.slice(0, end + 1), now),
      axis(min, min + end),
      tailNote(d, end, t, locale),
      loading !== null
        ? h(
            "p",
            { "data-testid": "kk-odds-loaded" },
            fillIn(t.oddsLoaded, {
              face: loading.face,
              a: loading.loaded[0],
              b: loading.loaded[1],
              c: loading.fair[0],
              d: loading.fair[1],
            }),
          )
        : fair !== null
          ? h("p", { "data-testid": "kk-odds-loaded" }, t.oddsLoadedMixed)
          : null,
    ),
    h("div", { class: "kk-target" }, h("label", { class: "kk-label" }, t.target), input, chance, said),
    // A set of rolls: the chance that any one of them reaches the target, and the highest to expect.
    times > 1 && holding === null
      ? h(
          "p",
          { class: "kk-fine", "data-testid": "kk-set-odds" },
          `${fillIn(t.anyAtLeast, { n: times, target })}: ${percent(chanceAnyAtLeast(d, target, times), locale)} · ${fillIn(t.expectedHighest, { n: times })}: ${number(expectedHighest(d, times), locale)}`,
        )
      : null,
    gameOdds,
  );
}
