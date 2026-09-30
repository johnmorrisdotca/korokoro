import { DEFAULT_SPEC, DIE_SIDES, MAX_DICE, MIN_DICE, normalizeSpec, rangeOf, roll, type DieSides, type Keep, type Roll, type RollSpec } from "../dice.ts";
import { addToHistory, loadHistory, saveHistory, type StorageLike } from "../history.ts";
import { formatNotation, parseNotation } from "../notation.ts";
import { chanceExactly, expectedTotal, luckOf } from "../odds.ts";
import { cryptoSource, newSeed, seededSource, type RandomSource } from "../random.ts";
import { readShared, shareQuery } from "../share.ts";
import { h, refill } from "./dom.ts";
import { dieFace, dieIcon } from "./faces.ts";
import { historyPanel, oddsPanel, percent, statsPanel } from "./panels.ts";
import { injectStyle } from "./style.ts";
import { STRINGS, fillIn, type RollerStrings } from "./strings.ts";

export type RollerOptions = {
  /** For numbers and times, and for which built-in words to use: "ja…" is Japanese, anything else English. */
  locale?: string;
  /** Words to use instead of the built-in ones. */
  strings?: Partial<RollerStrings>;
  /** Where the history is kept. Defaults to localStorage; pass null to keep nothing. */
  storage?: StorageLike | null;
  storageKey?: string;
  /** The dice showing when the tray opens. */
  spec?: Partial<RollSpec>;
  /** A query string that may hold a shared roll or a seed. Defaults to the page's own. */
  query?: string;
  /** The address a shared link points at. Defaults to the page's own, without its query. */
  shareBase?: string;
  /** CSS variables for the tray, such as `{ "--kk-felt": "#234" }`: set on the tray itself, so they win over its defaults in both themes. */
  theme?: Record<`--kk-${string}`, string>;
  /** Tray and panels side by side on a wide screen. */
  wide?: boolean;
  /** Called once each roll has landed. */
  onRoll?: (roll: Roll) => void;
  /** Length of the tumble, in milliseconds. Reduced motion always skips it. */
  animationMs?: number;
};

export type RollerHandle = {
  roll(): void;
  history(): readonly Roll[];
  setSpec(spec: Partial<RollSpec>): void;
  destroy(): void;
};

type Tab = "history" | "stats" | "odds";

/** A pleasant set of faces for a tray nobody has rolled yet. */
const RESTING = [5, 3, 6, 2, 4];

function defaultStorage(): StorageLike | undefined {
  try {
    return globalThis.localStorage ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Put a dice tray into an element: pick the dice, tap anywhere on the felt to
 * throw them, and read the total, the odds, the history and the stats below.
 */
export function mountRoller(target: HTMLElement, options: RollerOptions = {}): RollerHandle {
  const doc = target.ownerDocument;
  const win = doc.defaultView;
  injectStyle(doc);
  const locale = options.locale ?? doc.documentElement.lang ?? "en";
  const t: RollerStrings = { ...(locale.toLowerCase().startsWith("ja") ? STRINGS.ja : STRINGS.en), ...options.strings };
  const storage = options.storage === null ? undefined : (options.storage ?? defaultStorage());
  const storageKey = options.storageKey ?? "korokoro.history";
  const query = options.query ?? win?.location.search ?? "";
  const reduced = win?.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const animationMs = reduced ? 0 : (options.animationMs ?? 650);

  const params = new URLSearchParams(query.replace(/^\?/, ""));
  const shared = readShared(params);
  let spec = normalizeSpec(shared?.spec ?? options.spec ?? DEFAULT_SPEC);
  let history = loadHistory(storage, storageKey);
  let current: Roll | null = shared;
  let showingShared = shared !== null;
  let rolling = false;
  let tab: Tab = "history";
  let goal = Math.round(expectedTotal(spec));
  let seed = params.get("seed");
  let source: RandomSource = seed === null ? cryptoSource() : seededSource(seed);
  let clearArmed = false;
  let storageWorks = storage !== undefined;
  const timers = new Set<ReturnType<typeof setTimeout>>();

  const root = h("div", { class: "kk-root", "data-wide": String(options.wide === true), "data-testid": "korokoro" });
  for (const [name, value] of Object.entries(options.theme ?? {})) root.style.setProperty(name, value);
  const controls = h("div", { class: "kk-controls" });
  const tray = h("button", { type: "button", class: "kk-tray", "data-testid": "kk-tray" });
  const result = h("div", { class: "kk-result", "aria-live": "polite", "data-testid": "kk-result" });
  const panels = h("div", { class: "kk-panels" });
  // The felt first: on a phone it sits under the thumb, and the choices wait below it.
  root.append(tray, result, controls, panels);
  target.replaceChildren(root);

  function later(fn: () => void, ms: number) {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  }

  function segment<T extends string | number>(label: string, values: readonly T[], chosen: T, name: (v: T) => Node | string, pick: (v: T) => void, testId: string) {
    return h(
      "div",
      { class: "kk-row" },
      h("span", { class: "kk-label" }, label),
      h(
        "div",
        { class: "kk-seg", role: "group", "aria-label": label, "data-testid": testId },
        ...values.map((v) => {
          const button = h("button", { type: "button", "aria-pressed": String(v === chosen), "data-value": String(v) }, name(v));
          button.addEventListener("click", () => pick(v));
          return button;
        }),
      ),
    );
  }

  function changeSpec(next: Partial<RollSpec>) {
    const before = formatNotation(spec);
    spec = normalizeSpec({ ...spec, ...next });
    if (formatNotation(spec) !== before) goal = Math.round(expectedTotal(spec));
    showingShared = false;
    render();
  }

  function renderControls() {
    const counts = Array.from({ length: MAX_DICE - MIN_DICE + 1 }, (_, i) => i + MIN_DICE);
    const minus = h("button", { type: "button", "aria-label": `${t.modifier} −1`, "data-testid": "kk-mod-down" }, "−");
    const plus = h("button", { type: "button", "aria-label": `${t.modifier} +1`, "data-testid": "kk-mod-up" }, "+");
    minus.addEventListener("click", () => changeSpec({ modifier: spec.modifier - 1 }));
    plus.addEventListener("click", () => changeSpec({ modifier: spec.modifier + 1 }));
    const mod = spec.modifier > 0 ? `+${spec.modifier}` : String(spec.modifier);

    const input = h("input", {
      type: "text",
      value: formatNotation(spec),
      "aria-label": t.notation,
      placeholder: t.notationHint,
      autocomplete: "off",
      spellcheck: "false",
      "data-testid": "kk-notation",
    });
    const error = h("span", { class: "kk-error", role: "alert" });
    const apply = () => {
      const parsed = parseNotation(input.value);
      if (parsed === null) {
        input.setAttribute("aria-invalid", "true");
        error.textContent = t.notationBad;
        return;
      }
      changeSpec(parsed);
    };
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") apply();
    });
    input.addEventListener("change", apply);

    const seeded = seed !== null;
    const seedInput = h("input", { type: "text", value: seed ?? "", "aria-label": t.seeded, "data-testid": "kk-seed", spellcheck: "false" });
    seedInput.addEventListener("change", () => useSeed(seedInput.value.trim() || newSeed()));
    const fresh = h("button", { type: "button", class: "kk-link" }, t.newSeed);
    fresh.addEventListener("click", () => useSeed(newSeed()));

    refill(controls,
      segment(t.dice, counts, spec.count, (n) => String(n), (n) => changeSpec({ count: n }), "kk-count"),
      segment(t.die, DIE_SIDES, spec.sides, (n: DieSides) => h("span", { style: "display:inline-flex;align-items:center;gap:4px" }, dieIcon(n), `d${n}`), (n) => changeSpec({ sides: n }), "kk-sides"),
      h(
        "div",
        { class: "kk-row" },
        h("span", { class: "kk-label" }, t.modifier),
        h("div", { class: "kk-stepper" }, minus, h("output", { "data-testid": "kk-mod" }, mod), plus),
        h("span", { class: "kk-notation" }, input),
        error,
      ),
      spec.count > 1
        ? segment<Keep>(t.keep, ["all", "highest", "lowest"], spec.keep, (k) => (k === "all" ? t.keepAll : k === "highest" ? t.keepHighest : t.keepLowest), (k) => changeSpec({ keep: k }), "kk-keep")
        : null,
      h(
        "details",
        { class: "kk-settings", open: seeded },
        h("summary", {}, `${t.randomness}: ${seeded ? `${t.seeded} (${seed})` : t.fair}`),
        segment(t.randomness, ["fair", "seeded"] as const, seeded ? "seeded" : "fair", (m) => (m === "fair" ? t.fair : t.seeded), (m) => (m === "fair" ? useSeed(null) : useSeed(seed ?? newSeed())), "kk-mode"),
        h("p", {}, seeded ? t.seededHint : t.fairHint),
        seeded ? h("div", { class: "kk-row" }, seedInput, fresh) : null,
      ),
    );
  }

  function useSeed(next: string | null) {
    seed = next;
    source = next === null ? cryptoSource() : seededSource(next);
    render();
  }

  function dieElement(sides: DieSides, face: number, kept: boolean, index: number): HTMLElement {
    const hit = sides === 20 && kept ? (face === 20 ? "crit" : face === 1 ? "fumble" : null) : null;
    return h("span", { class: "kk-die", "data-kept": String(kept), "data-hit": hit, "data-testid": "kk-die", "data-face": String(face), "data-index": String(index) }, dieFace(sides, face, `d${sides}: ${face}`));
  }

  function renderTray() {
    tray.setAttribute("aria-label", fillIn(t.rollLabel, { notation: formatNotation(spec) }));
    tray.setAttribute("data-rolling", String(rolling));
    const shown = current !== null && (showingShared || formatNotation(current.spec) === formatNotation(spec)) ? current : null;
    const sides = shown?.spec.sides ?? spec.sides;
    const faces = shown?.faces ?? RESTING.slice(0, spec.count).map((f) => Math.min(f, sides));
    const kept = shown?.kept ?? faces.map(() => true);
    const dice = h("div", { class: "kk-dice", "data-count": String(faces.length) }, ...faces.map((f, i) => dieElement(sides, f, kept[i] ?? true, i)));
    tray.replaceChildren(
      dice,
      h("span", { class: "kk-hint" }, current === null ? t.tapToRoll : t.tapAgain, h("kbd", {}, "Space")),
    );
    return dice;
  }

  function renderResult() {
    if (rolling) {
      result.replaceChildren(h("div", { class: "kk-total" }, h("small", {}, t.rolling), "…"));
      return;
    }
    if (current === null) {
      const { min, max } = rangeOf(spec);
      refill(result,
        h("div", { class: "kk-total", style: "opacity:.35" }, h("small", {}, formatNotation(spec)), "?"),
        h("div", { class: "kk-sum" }, `${t.expected} ${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(expectedTotal(spec))} · ${t.range} ${min}–${max}`),
      );
      return;
    }
    const r = current;
    const parts = r.faces.map((f, i) => (r.kept[i] ? String(f) : `(${f})`));
    const mod = r.spec.modifier === 0 ? "" : r.spec.modifier > 0 ? ` + ${r.spec.modifier}` : ` − ${-r.spec.modifier}`;
    const luck = luckOf(r.spec, r.total);
    const exact = chanceExactly(r.spec, r.total);
    const badges: HTMLElement[] = [];
    if (showingShared) badges.push(h("span", { class: "kk-badge" }, t.shared));
    const keptFace = r.faces[r.kept.indexOf(true)];
    if (r.spec.sides === 20 && (r.spec.keep !== "all" || r.spec.count === 1) && keptFace === 20) badges.push(h("span", { class: "kk-badge", "data-tone": "good" }, t.critical));
    if (r.spec.sides === 20 && (r.spec.keep !== "all" || r.spec.count === 1) && keptFace === 1) badges.push(h("span", { class: "kk-badge", "data-tone": "bad" }, t.fumble));
    if (r.faces.length > 1 && r.faces.every((f) => f === r.faces[0])) badges.push(h("span", { class: "kk-badge", "data-tone": "good" }, t.allMatch));

    const copy = h("button", { type: "button", class: "kk-link", "data-testid": "kk-copy" }, t.copyLink);
    copy.addEventListener("click", () => {
      const base = options.shareBase ?? (win ? `${win.location.origin}${win.location.pathname}` : "");
      const url = `${base}?${shareQuery(r)}`;
      const done = () => {
        copy.textContent = t.copied;
        later(() => (copy.textContent = t.copyLink), 1800);
      };
      const clipboard = win?.navigator.clipboard;
      if (clipboard) clipboard.writeText(url).then(done, () => win?.prompt(t.copyLink, url));
      else win?.prompt(t.copyLink, url);
    });
    refill(result,
      h("div", { class: "kk-total", "data-testid": "kk-total" }, h("small", {}, `${t.total} · ${formatNotation(r.spec)}`), String(r.total)),
      r.faces.length > 1 || r.spec.modifier !== 0 ? h("div", { class: "kk-sum" }, `${parts.join(" + ")}${mod}`) : null,
      badges.length > 0 ? h("div", { class: "kk-actions" }, ...badges) : null,
      h(
        "div",
        { class: "kk-luck" },
        h("div", { class: "kk-meter" }, h("i", { style: `left:${luck * 100}%` })),
        h("span", {}, `${fillIn(t.luckier, { percent: percent(luck, locale) })} · ${fillIn(t.exactly, { odds: exact > 0 ? new Intl.NumberFormat(locale, { maximumFractionDigits: exact > 0.1 ? 1 : 0 }).format(1 / exact) : "∞", total: r.total })}`),
      ),
      h("div", { class: "kk-actions" }, copy),
    );
  }

  function renderPanels() {
    const tabs: [Tab, string][] = [["history", `${t.history}${history.length > 0 ? ` (${history.length})` : ""}`], ["stats", t.stats], ["odds", t.odds]];
    const strip = h("div", { class: "kk-tabs", role: "tablist" });
    for (const [key, label] of tabs) {
      const button = h("button", { type: "button", role: "tab", "aria-selected": String(tab === key), "data-testid": `kk-tab-${key}` }, label);
      button.addEventListener("click", () => {
        tab = key;
        clearArmed = false;
        renderPanels();
      });
      strip.append(button);
    }
    const body = h("div", { class: "kk-panel", role: "tabpanel" });
    if (tab === "history") {
      body.append(historyPanel(history, t, locale));
      if (history.length > 0) {
        const clear = h("button", { type: "button", class: "kk-link", "data-danger": String(clearArmed), "data-testid": "kk-clear" }, clearArmed ? fillIn(t.clearSure, { n: history.length }) : t.clear);
        clear.addEventListener("click", () => {
          if (!clearArmed) {
            clearArmed = true;
            renderPanels();
            later(() => {
              clearArmed = false;
              renderPanels();
            }, 4000);
            return;
          }
          clearArmed = false;
          history = [];
          storageWorks = saveHistory(storage, storageKey, history);
          render();
        });
        body.append(h("div", { class: "kk-actions" }, clear));
      }
      if (!storageWorks) body.append(h("p", { class: "kk-empty", style: "padding:0" }, t.savedNowhere));
    } else if (tab === "stats") {
      body.append(statsPanel(history, spec, t, locale));
    } else {
      body.append(oddsPanel(spec, goal, current, t, locale, (value) => (goal = value)));
    }
    panels.replaceChildren(strip, body);
  }

  function render() {
    renderControls();
    renderTray();
    renderResult();
    renderPanels();
  }

  function throwDice() {
    if (rolling) return;
    const thrown = roll(spec, source);
    showingShared = false;
    if (animationMs === 0) return land(thrown);
    rolling = true;
    renderResult();
    tray.setAttribute("data-rolling", "true");
    const dice = renderTray();
    const shapes: HTMLElement[] = [];
    const flicker = () => {
      for (const el of shapes) el.replaceChildren(dieFace(spec.sides, 1 + Math.floor(Math.random() * spec.sides), t.rolling));
    };
    dice.replaceChildren(
      ...thrown.faces.map((_, i) => {
        const el = dieElement(spec.sides, 1 + Math.floor(Math.random() * spec.sides), true, i);
        el.classList.add("kk-tumble");
        el.style.setProperty("--kk-x0", `${Math.round((Math.random() - 0.5) * 160)}px`);
        el.style.setProperty("--kk-y0", `${Math.round(-40 - Math.random() * 60)}px`);
        el.style.setProperty("--kk-r0", `${Math.round((Math.random() - 0.5) * 720)}deg`);
        el.style.setProperty("--kk-t", `${animationMs - 80 + Math.round(Math.random() * 120)}ms`);
        return el;
      }),
    );
    shapes.push(...(Array.from(dice.children) as HTMLElement[]));
    const step = Math.max(60, Math.round(animationMs / 9));
    for (let at = step; at < animationMs; at += step) later(flicker, at);
    later(() => land(thrown), animationMs + 60);
  }

  function land(thrown: Roll) {
    rolling = false;
    current = thrown;
    history = addToHistory(history, thrown);
    storageWorks = saveHistory(storage, storageKey, history);
    render();
    tray.querySelectorAll(".kk-die").forEach((el) => el.classList.add("kk-land"));
    try {
      win?.navigator.vibrate?.(12);
    } catch {
      // A browser that refuses vibration refuses silently; so does this.
    }
    options.onRoll?.(thrown);
  }

  tray.addEventListener("click", throwDice);
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== " " || event.defaultPrevented) return;
    const el = event.target as HTMLElement | null;
    if (el !== null && el !== doc.body && el !== root && !root.contains(el)) return;
    if (el?.closest("input, textarea, select, button, summary, [contenteditable]")) return;
    event.preventDefault();
    throwDice();
  };
  doc.addEventListener("keydown", onKey);
  render();

  return {
    roll: throwDice,
    history: () => history,
    setSpec: (next) => changeSpec(next),
    destroy() {
      for (const id of timers) clearTimeout(id);
      doc.removeEventListener("keydown", onKey);
      target.replaceChildren();
    },
  };
}
