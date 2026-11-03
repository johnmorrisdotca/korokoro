import type { RollSpec } from "../dice.ts";
import { groupsOf } from "../dice.ts";
import { h } from "./dom.ts";
import { percent } from "./panels.ts";
import { fillIn, type RollerStrings } from "./strings.ts";

/**
 * As many bars as a chart draws: what fits the panel on a phone at two pixels
 * a bar. A chart of more values draws neighbours together, each bar their sum.
 */
const MOST_BARS = 80;

function gathered(values: number[], width: number): number[] {
  if (width === 1) return values;
  const out = new Array<number>(Math.ceil(values.length / width)).fill(0);
  values.forEach((v, i) => {
    out[Math.floor(i / width)] = (out[Math.floor(i / width)] as number) + v;
  });
  return out;
}

/**
 * Where a chart of exploding dice stops: the first total past which
 * everything left comes up less than one time in a thousand, or the last
 * index in `upTo` if that is further. Other charts run to their end.
 */
export function chartEnd(spec: RollSpec, probabilities: number[], upTo: number): number {
  const last = probabilities.length - 1;
  if (!groupsOf(spec).some((g) => g.explode === true)) return last;
  let tail = 0;
  let end = last;
  while (end > 0 && tail + (probabilities[end] as number) < 0.001) tail += probabilities[end--] as number;
  return Math.max(end, Math.min(last, upTo));
}

export function tailNote(
  d: { min: number; probabilities: number[] },
  end: number,
  t: RollerStrings,
  locale: string,
): HTMLElement | null {
  if (end >= d.probabilities.length - 1) return null;
  const tail = d.probabilities.slice(end + 1).reduce((a, b) => a + b, 0);
  return h(
    "p",
    { "data-testid": "kk-tail" },
    fillIn(t.chartTail, { total: d.min + end, percent: percent(tail, locale) }),
  );
}

/** Bars with an optional expected mark over each, scaled to the tallest of either. */
export function bars(all: number[], allExpected: number[] | null, nowAt: number | null): HTMLElement {
  const width = Math.ceil(all.length / MOST_BARS);
  const values = gathered(all, width);
  const expected = allExpected === null ? null : gathered(allExpected, width);
  const now = nowAt === null ? null : Math.floor(nowAt / width);
  const top = Math.max(1e-9, ...values, ...(expected ?? []));
  return h(
    "div",
    { class: "kk-bars", "aria-hidden": "true" },
    ...values.map((v, i) => {
      const bar = h(
        "span",
        { class: "kk-bar", "data-now": String(now === i) },
        h("b", { style: `height:${(v / top) * 100}%` }),
      );
      const e = expected?.[i];
      if (e !== undefined) bar.append(h("i", { style: `bottom:calc(${(e / top) * 100}% - 1px)` }));
      return bar;
    }),
  );
}

/** The words of a custom die's faces under their bars, each cut short where it would not fit. */
export function labelAxis(labels: string[]): HTMLElement {
  return h("div", { class: "kk-axis kk-axis-words" }, ...labels.map((label) => h("span", { title: label }, label)));
}

export function axis(from: number, to: number): HTMLElement {
  const mid = Math.round((from + to) / 2);
  return h(
    "div",
    { class: "kk-axis" },
    h("span", {}, String(from)),
    h("span", {}, String(mid)),
    h("span", {}, String(to)),
  );
}
