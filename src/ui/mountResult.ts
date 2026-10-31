import {
  type DiceGroup,
  diceCount,
  diceOf,
  groupsOf,
  hasTotal,
  isLoaded,
  isSuccessRoll,
  rangeOf,
  setOf,
  sidesOf,
  specOf,
} from "../dice.ts";
import { fromJSON, toCSV, toJSON, toText } from "../export.ts";
import { readPreset } from "../games/presets.ts";
import { HISTORY_LIMIT, saveHistory } from "../history.ts";
import { formatNotation } from "../notation.ts";
import { chanceExactly, distributionHolding, expectedTotal, luckOf } from "../odds.ts";
import { shareQuery, shareQueryMany } from "../share.ts";
import { h, refill } from "./dom.ts";
import type { Tab } from "./mount.ts";
import type { Session } from "./mountSession.ts";
import { historyPanel, oddsPanel, percent, statsPanel } from "./panels.ts";
import { fillIn } from "./strings.ts";
import { warNames, warPanel } from "./war.ts";

/** The panel under the felt, while a game of Dice War is on. */
export function renderWar(session: Session) {
  if (session.war === null) {
    session.warBox.hidden = true;
    session.warBox.replaceChildren();
    return;
  }
  session.warBox.hidden = false;
  session.warBox.replaceChildren(
    warPanel(
      session.war,
      warNames(session.war.settings.players, session.t.warYou),
      session.t,
      session.locale,
      (next) => {
        session.warSettings = { ...session.warSettings, ...next };
        session.startWar();
        if (next.dice !== undefined)
          session.changeSpec({ count: session.warSettings.dice, sides: 6, modifier: 0, keep: "all", times: 1 });
        else session.render();
      },
      () => {
        session.startWar();
        session.render();
      },
    ),
  );
}

/** The luck meter and the link as they will be once there is a roll, faint and still: the shape of a result before there is one. */
export function waiting(session: Session): HTMLElement[] {
  return [
    h("div", { class: "kk-luck", "data-waiting": "true", "aria-hidden": "true" }, h("div", { class: "kk-meter" })),
    h(
      "div",
      { class: "kk-actions" },
      h("button", { type: "button", class: "kk-link", disabled: true }, session.t.copyLink),
    ),
  ];
}

/** A link to this page carrying a query. A share base that has a query of its own, such as a language, keeps it. */
export function linkTo(session: Session, query: string): string {
  const base =
    session.options.shareBase ?? (session.win ? `${session.win.location.origin}${session.win.location.pathname}` : "");
  // A roll made as a game's is shared as that game's.
  return `${base}${base.includes("?") ? "&" : "?"}${query}${session.game === null ? "" : `&game=${session.game.id}`}`;
}

/** Put a link on the clipboard and say so on the button that asked; where there is no clipboard, show it to be copied by hand. */
export function copyLink(session: Session, url: string, button: HTMLElement) {
  const was = button.textContent;
  const done = () => {
    button.textContent = session.t.copied;
    session.later(() => (button.textContent = was), 1800);
  };
  const clipboard = session.win?.navigator.clipboard;
  if (clipboard) clipboard.writeText(url).then(done, () => session.win?.prompt(session.t.copyLink, url));
  else session.win?.prompt(session.t.copyLink, url);
}

export function renderResult(session: Session) {
  if (session.rolling) {
    refill(
      session.result,
      h("div", { class: "kk-total" }, h("small", {}, session.t.rolling), "…"),
      h("div", { class: "kk-sum" }, "\u00a0"),
      ...session.waiting(),
    );
    return;
  }
  if (session.empty) {
    refill(
      session.result,
      h("div", { class: "kk-total", style: "opacity:.35" }, h("small", {}, session.t.pool), "–"),
      h("div", { class: "kk-sum" }, session.t.addToRoll),
      ...session.waiting(),
    );
    return;
  }
  if (session.current === null) {
    const { min, max } = rangeOf(session.spec);
    refill(
      session.result,
      h("div", { class: "kk-total", style: "opacity:.35" }, h("small", {}, formatNotation(session.spec)), "?"),
      h(
        "div",
        { class: "kk-sum" },
        `${session.t.expected} ${new Intl.NumberFormat(session.locale, { maximumFractionDigits: 1 }).format(expectedTotal(session.spec))} · ${session.t.range} ${min}–${max}`,
      ),
      ...session.waiting(),
    );
    return;
  }
  const r = session.current;
  const thrown = diceOf(r);
  // A roll with dice held is judged against the dice that were thrown again, not against a fresh roll of them all.
  const against = r.held !== undefined ? distributionHolding(r.spec, r.faces, r.held) : r.spec;
  const luck = luckOf(against, r.total);
  const exact = chanceExactly(against, r.total);
  const badges: HTMLElement[] = [];
  if (session.showingShared) badges.push(h("span", { class: "kk-badge" }, session.t.shared));
  if (r.held !== undefined)
    badges.push(h("span", { class: "kk-badge" }, fillIn(session.t.heldBadge, { n: r.held.filter(Boolean).length })));
  // A natural is one d20 read on its own: the one kept, or the only one thrown.
  const twenties = thrown.filter((die) => die.status === "kept" && sidesOf(r.spec, die) === 20);
  const natural = twenties.length === 1 ? twenties[0]?.face : null;
  if (natural === 20) badges.push(h("span", { class: "kk-badge", "data-tone": "good" }, session.t.critical));
  if (natural === 1) badges.push(h("span", { class: "kk-badge", "data-tone": "bad" }, session.t.fumble));
  if (
    r.spec.more === undefined &&
    r.faces.length > 1 &&
    r.faces.length === diceCount(r.spec) &&
    r.faces.every((f) => f === r.faces[0])
  )
    badges.push(h("span", { class: "kk-badge", "data-tone": "good" }, session.t.allMatch));

  const set = session.currentSet !== null && session.currentSet.at(-1) === r ? session.currentSet : null;
  const copy = h("button", { type: "button", class: "kk-link", "data-testid": "kk-copy" }, session.t.copyLink);
  copy.addEventListener("click", () =>
    session.copyLink(session.linkTo(set === null ? shareQuery(r) : shareQueryMany(set)), copy),
  );
  // What the game makes of the roll, in the game's words.
  const reading =
    session.game === null
      ? null
      : readPreset(session.game, r, session.gameRolls.slice(0, -1), session.japanese() ? "ja" : "en");
  const says =
    reading === null || reading.text === ""
      ? null
      : h("div", { class: "kk-reading", "data-tone": reading.tone, "data-testid": "kk-reading" }, reading.text);
  if (set !== null) {
    // A set: every roll on a line of its own, the highest and lowest marked, and what they all come to.
    const all = setOf(set);
    const lines = set.map((one, i) => {
      const mark =
        all.highest !== all.lowest && one.total === all.highest
          ? "highest"
          : all.highest !== all.lowest && one.total === all.lowest
            ? "lowest"
            : null;
      const line = session.sumLine(one);
      line.removeAttribute("data-testid");
      const words =
        session.game === null
          ? ""
          : readPreset(session.game, one, set.slice(0, i), session.japanese() ? "ja" : "en").text;
      return h(
        "li",
        { "data-mark": mark, "data-testid": "kk-set-line" },
        h("span", { class: "kk-set-n" }, String(i + 1)),
        line,
        h("b", {}, hasTotal(one.spec) ? String(one.total) : words),
        mark === null ? null : h("i", {}, mark === "highest" ? session.t.setHighest : session.t.setLowest),
      );
    });
    refill(
      session.result,
      h(
        "div",
        { class: "kk-total kk-words", "data-testid": "kk-total" },
        h("small", {}, `${session.t.total} · ${formatNotation(r.spec)}`),
        set
          .map((one) =>
            hasTotal(one.spec)
              ? String(one.total)
              : diceOf(one)
                  .map((d) => d.label ?? String(d.face))
                  .join(" "),
          )
          .join(" · "),
      ),
      h(
        "ol",
        {
          class: "kk-set-list",
          tabindex: 0,
          "aria-label": fillIn(session.t.setRolls, { n: set.length }),
          "data-testid": "kk-set-list",
        },
        ...lines,
      ),
      hasTotal(r.spec)
        ? h(
            "div",
            { class: "kk-sum", "data-testid": "kk-set-sum" },
            fillIn(session.t.setSum, { n: set.length, sum: all.sum }),
          )
        : null,
      h("div", { class: "kk-actions" }, ...badges, copy),
    );
    return;
  }
  // Where the game's reading is the result, it takes the total's place.
  if (session.game !== null && !session.game.total && reading !== null && reading.text !== "") {
    refill(
      session.result,
      h(
        "div",
        { class: "kk-total kk-words", "data-testid": "kk-total", "data-tone": reading.tone },
        h("small", {}, `${session.japanese() ? session.game.nameJa : session.game.name} · ${formatNotation(r.spec)}`),
        h("span", { "data-testid": "kk-reading" }, reading.text),
      ),
      r.faces.length > 1 ? session.sumLine(r) : h("div", { class: "kk-sum" }, "\u00a0"),
      session.waiting()[0] as HTMLElement,
      h("div", { class: "kk-actions" }, ...badges, copy),
    );
    return;
  }
  // A loaded roll says so beside its total, whatever else it says.
  if (isLoaded(r.spec))
    badges.unshift(
      h("span", { class: "kk-badge", "data-tone": "bad", "data-testid": "kk-loaded-badge" }, session.t.loadedBadge),
    );
  // A roll of words is its words: there is no total to show, and no luck to measure.
  if (!hasTotal(r.spec)) {
    refill(
      session.result,
      h(
        "div",
        { class: "kk-total kk-words", "data-testid": "kk-total" },
        h("small", {}, `${session.t.result} · ${formatNotation(r.spec)}`),
        thrown.map((die) => die.label ?? String(die.face)).join(" · "),
      ),
      h("div", { class: "kk-sum" }, "\u00a0"),
      session.waiting()[0] as HTMLElement,
      h("div", { class: "kk-actions" }, ...badges, copy),
    );
    return;
  }
  refill(
    session.result,
    h(
      "div",
      { class: "kk-total", "data-testid": "kk-total" },
      h("small", {}, `${isSuccessRoll(r.spec) ? session.t.successes : session.t.total} · ${formatNotation(r.spec)}`),
      String(r.total),
    ),
    r.faces.length > 1 || r.spec.modifier !== 0 || r.spec.math !== undefined ? session.sumLine(r) : null,
    says,
    h(
      "div",
      { class: "kk-luck" },
      h("div", { class: "kk-meter" }, h("i", { style: `left:${luck * 100}%` })),
      h(
        "span",
        {},
        `${fillIn(session.t.luckier, { percent: percent(luck, session.locale) })} · ${fillIn(session.t.exactly, { odds: exact > 0 ? new Intl.NumberFormat(session.locale, { maximumFractionDigits: exact > 0.1 ? 1 : 0 }).format(1 / exact) : "∞", total: r.total })}`,
      ),
    ),
    // The badges share the link's row, so a natural 20 does not push everything below it down.
    h("div", { class: "kk-actions" }, ...badges, copy),
  );
}

export function renderPanels(session: Session) {
  const tabs: [Tab, string][] = [
    ["history", `${session.t.history}${session.history.length > 0 ? ` (${session.history.length})` : ""}`],
    ["stats", session.t.stats],
    ["odds", session.t.odds],
  ];
  const strip = h("div", { class: "kk-tabs", role: "tablist" });
  for (const [key, label] of tabs) {
    const button = h(
      "button",
      { type: "button", role: "tab", "aria-selected": String(session.tab === key), "data-testid": `kk-tab-${key}` },
      label,
    );
    button.addEventListener("click", () => {
      session.tab = key;
      session.clearArmed = false;
      session.renderPanels();
    });
    strip.append(button);
  }
  const body = h("div", { class: "kk-panel", role: "tabpanel" });
  if (session.tab === "history") {
    body.append(historyPanel(session.history, session.t, session.locale));
    if (session.history.length > 0) {
      const clear = h(
        "button",
        { type: "button", class: "kk-link", "data-danger": String(session.clearArmed), "data-testid": "kk-clear" },
        session.clearArmed ? fillIn(session.t.clearSure, { n: session.history.length }) : session.t.clear,
      );
      clear.addEventListener("click", () => {
        if (!session.clearArmed) {
          session.clearArmed = true;
          session.renderPanels();
          session.later(() => {
            session.clearArmed = false;
            session.renderPanels();
          }, 4000);
          return;
        }
        session.clearArmed = false;
        session.history = [];
        session.storageWorks = saveHistory(session.storage, session.storageKey, session.history);
        session.render();
      });
      body.append(h("div", { class: "kk-actions" }, clear));
    }
    body.append(session.exportPanel());
    if (!session.storageWorks) body.append(h("p", { class: "kk-empty", style: "padding:0" }, session.t.savedNowhere));
  } else if (session.tab === "stats") {
    body.append(
      statsPanel(
        session.history,
        session.spec,
        session.kinds()[session.lit] ?? session.spec,
        session.t,
        session.locale,
        session.realDie,
      ),
    );
  } else if (session.empty) {
    body.append(h("p", { class: "kk-empty" }, session.t.addToRoll));
  } else {
    const now = session.oddsNow();
    const holding = "probabilities" in now ? { odds: now, held: session.heldCount(), rest: session.restOf() } : null;
    body.append(
      oddsPanel(
        session.spec,
        session.goal,
        session.current,
        session.t,
        session.locale,
        (value) => (session.goal = value),
        holding,
        session.game,
        session.japanese() ? "ja" : "en",
      ),
    );
  }
  session.panels.replaceChildren(strip, body);
}

/** Hand the person a file to keep: a link to the text, clicked for them. */
export function save(session: Session, name: string, type: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = h("a", { href: url, download: name, hidden: true });
  session.doc.body.append(link);
  link.click();
  link.remove();
  session.later(() => URL.revokeObjectURL(url), 1000);
}

/** One level down in the history: the rolls as a file, and a JSON export brought back in. */
export function exportPanel(session: Session): HTMLElement {
  const day = new Date().toISOString().slice(0, 10);
  const button = (words: string, id: string, act: () => void) => {
    const made = h(
      "button",
      { type: "button", class: "kk-link", "data-testid": id, disabled: session.history.length === 0 },
      words,
    );
    made.addEventListener("click", act);
    return made;
  };
  const file = h("input", {
    type: "file",
    accept: "application/json,.json",
    class: "kk-file",
    "data-testid": "kk-import",
    "aria-label": session.t.importJson,
  });
  const pick = h("label", { class: "kk-link kk-pick" }, session.t.importJson, file);
  file.addEventListener("change", () => {
    const chosen = file.files?.[0];
    if (chosen === undefined) return;
    void chosen.text().then((text) => {
      const read = fromJSON(text);
      if (read === null) session.exportSaid = session.t.importBad;
      else {
        // Rolls already here are not added twice; the rest join the history in the order they were thrown.
        const have = new Set(session.history.map((r) => r.id));
        const fresh = read.filter((r) => !have.has(r.id));
        session.exportSaid =
          fresh.length === 0 ? session.t.importNothing : fillIn(session.t.imported, { n: fresh.length });
        if (fresh.length > 0) {
          session.history = [...session.history, ...fresh].sort((a, b) => a.at - b.at).slice(-HISTORY_LIMIT);
          session.storageWorks = saveHistory(session.storage, session.storageKey, session.history);
        }
      }
      session.renderPanels();
    });
  });
  const details = h(
    "details",
    { class: "kk-settings", open: session.exportOpen, "data-testid": "kk-export" },
    h("summary", {}, session.t.exportTitle),
    h(
      "div",
      { class: "kk-actions" },
      button(session.t.exportCsv, "kk-export-csv", () =>
        session.save(`korokoro-${day}.csv`, "text/csv;charset=utf-8", toCSV(session.history)),
      ),
      button(session.t.exportJson, "kk-export-json", () =>
        session.save(`korokoro-${day}.json`, "application/json", toJSON(session.history, { stats: true })),
      ),
      button(session.t.exportText, "kk-export-text", () =>
        session.save(`korokoro-${day}.txt`, "text/plain;charset=utf-8", toText(session.history)),
      ),
      pick,
    ),
    h(
      "p",
      { class: "kk-fine", role: "status", "data-testid": "kk-export-said" },
      session.exportSaid === "" ? session.t.exportNote : session.exportSaid,
    ),
  );
  details.addEventListener("toggle", () => (session.exportOpen = details.open));
  return details;
}

/** The dice still to roll while some are held, as notation: `3d6` of a `5d6` with two held. */
export function restOf(session: Session): string {
  let at = 0;
  const rest: DiceGroup[] = [];
  for (const group of groupsOf(session.spec)) {
    let free = 0;
    for (let n = 0; n < group.count; n++, at++) if (session.held[at] !== true) free += 1;
    if (free > 0) rest.push({ ...group, count: free });
  }
  return rest.length === 0 ? "" : formatNotation(specOf(rest));
}
