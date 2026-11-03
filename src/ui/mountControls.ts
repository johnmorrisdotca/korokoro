import {
  DIE_SIDES,
  type DieSides,
  dieName,
  groupsOf,
  type Keep,
  MAX_DICE,
  MAX_GROUPS,
  MIN_DICE,
  type Sides,
  specOf,
} from "../dice.ts";
import { checkNotation, formatNotation } from "../notation.ts";
import { newSeed } from "../random.ts";
import { makeSet, setQuery, storeSets, withoutSet, withSet } from "../sets.ts";
import { h, refill } from "./dom.ts";
import { dieIcon, minusMark } from "./faces.ts";
import { gamesPanel } from "./games.ts";
import { helpMarks } from "./help.ts";
import { morePanel } from "./more.ts";
import type { Session } from "./mountSession.ts";
import { fillIn, REFUSALS } from "./strings.ts";

export { dieElement, dieLabel, randomFace, renderTray, restingDice, sumLine } from "./mountTray.ts";

export function renderControls(session: Session) {
  const all = session.kinds();
  // A roll written as a formula is changed where it was written: the buttons cannot take a die out of the middle of it.
  const formula = !session.empty && session.spec.math !== undefined;
  const total = all.reduce((sum, g) => sum + g.count, 0);
  const mine = all[session.lit];
  const room = MAX_DICE - total;
  const full = room < 1;
  const counts = Array.from({ length: MAX_DICE - MIN_DICE + 1 }, (_, i) => i + MIN_DICE);
  const minus = h(
    "button",
    { type: "button", "aria-label": `${session.t.modifier} −1`, "data-testid": "kk-mod-down", disabled: formula },
    "−",
  );
  const plus = h(
    "button",
    { type: "button", "aria-label": `${session.t.modifier} +1`, "data-testid": "kk-mod-up", disabled: formula },
    "+",
  );
  minus.addEventListener("click", () => session.changeSpec({ modifier: session.spec.modifier - 1 }));
  plus.addEventListener("click", () => session.changeSpec({ modifier: session.spec.modifier + 1 }));
  const mod = session.spec.modifier > 0 ? `+${session.spec.modifier}` : String(session.spec.modifier);

  const input = h("input", {
    type: "text",
    value: session.notation(),
    "aria-label": session.t.notation,
    placeholder: session.t.notationHint,
    // A phone must not correct "2d6" into a word, or start it with a capital.
    autocomplete: "off",
    autocapitalize: "none",
    autocorrect: "off",
    spellcheck: "false",
    inputmode: "text",
    enterkeyhint: "done",
    "data-testid": "kk-notation",
  });
  const error = h("span", { class: "kk-error", role: "alert" });
  const apply = () => {
    if (input.value.trim() === "" && session.empty) return;
    const read = checkNotation(input.value);
    if (!read.ok) {
      input.setAttribute("aria-invalid", "true");
      error.textContent = fillIn(session.t[REFUSALS[read.problem]], { part: read.part });
      return;
    }
    // Dice typed by hand are their own roll, not a game's.
    session.game = null;
    session.changeSpec(read.spec);
  };
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") apply();
  });
  input.addEventListener("change", apply);

  const seeded = session.seed !== null;
  const seedInput = h("input", {
    type: "text",
    class: "kk-field",
    value: session.seed ?? "",
    "aria-label": session.t.seeded,
    "data-testid": "kk-seed",
    autocapitalize: "none",
    autocorrect: "off",
    spellcheck: "false",
  });
  seedInput.addEventListener("change", () => session.useSeed(seedInput.value.trim() || newSeed()));
  const fresh = h("button", { type: "button", class: "kk-link" }, session.t.newSeed);
  fresh.addEventListener("click", () => session.useSeed(newSeed()));

  // The pool: one chip for each kind of dice, and a tap on a chip takes one die of it away.
  const chips = all.map((group, index) => {
    const text = formatNotation(specOf([group]));
    const chip = h(
      "button",
      {
        type: "button",
        class: "kk-chip",
        "data-testid": "kk-chip",
        "data-value": dieName(group).slice(1),
        "data-lit": String(index === session.lit),
        "data-suggested": String(session.suggested),
        "aria-label": formula ? text : fillIn(session.t.takeOne, { die: dieName(group), n: group.count }),
        title: formula ? text : fillIn(session.t.takeOne, { die: dieName(group), n: group.count }),
        disabled: formula,
      },
      h("span", {}, text),
      h("i", { "aria-hidden": "true", class: "kk-chip-x" }, minusMark()),
    );
    chip.addEventListener("click", () => session.takeOne(index));
    return chip;
  });
  const clear = h(
    "button",
    {
      type: "button",
      class: "kk-clear",
      "data-testid": "kk-clear-pool",
      "aria-label": session.t.clearPoolLabel,
      disabled: session.empty,
    },
    session.t.clearPool,
  );
  // Clear takes the bonus with the dice: nothing is left to roll.
  clear.addEventListener("click", () => {
    session.suggested = false;
    session.spec = { ...session.spec, modifier: 0 };
    session.game = null;
    session.setKinds([], null);
  });

  // A button that would take the roll past a limit is dimmed, and the row's label says which limit.
  const allKinds = all.length >= MAX_GROUPS;
  const inRoll = (sides: Sides) => all.some((g) => dieName(g) === dieName(session.plainDie(sides)));
  const cannotAdd = (sides: Sides) => !formula && (full || (allKinds && !inRoll(sides)));
  // While the dice are only suggested, a tap chooses; after that, it adds. The label says which.
  const addLabel = formula
    ? session.t.choose
    : full
      ? fillIn(session.t.limitDice, { n: MAX_DICE })
      : allKinds
        ? fillIn(session.t.limitKinds, { n: MAX_GROUPS })
        : session.suggested
          ? session.t.choose
          : session.t.add;

  refill(
    session.controls,
    h(
      "div",
      { class: "kk-row" },
      h("span", { class: "kk-label" }, session.t.pool),
      h(
        "div",
        {
          class: "kk-pool",
          role: "group",
          "aria-label": session.t.pool,
          "data-testid": "kk-pool",
          "data-suggested": String(session.suggested),
        },
        ...chips,
      ),
      // What the chips are and what a tap on one does, said in the row itself, in whichever state the roll is in.
      h(
        "p",
        { class: "kk-fine kk-pool-hint", "data-testid": "kk-pool-hint" },
        formula
          ? session.t.formula
          : session.empty
            ? session.t.addToRoll
            : session.suggested
              ? fillIn(session.t.poolSuggested, { notation: session.notation() })
              : session.t.poolHint,
      ),
    ),
    session.segment(
      all.length > 1 && mine !== undefined ? dieName(mine) : session.t.dice,
      counts,
      mine?.count ?? null,
      (n) => String(n),
      (n) => session.changeLit({ count: n }),
      "kk-count",
      (n) => formula || mine === undefined || n > mine.count + room,
      undefined,
      undefined,
      helpMarks("count"),
    ),
    // The buttons are the dice a table owns; any other die is typed as notation, and then no button is lit.
    session.segment<Sides>(
      addLabel,
      DIE_SIDES,
      // A loaded or custom die lights no button: the buttons are the fair dice.
      mine !== undefined && mine.weights === undefined && mine.faces === undefined ? mine.sides : null,
      (n) => h("span", { class: "kk-die-pick" }, dieIcon(n as DieSides), `d${n}`),
      (n) => void session.addDie(session.plainDie(n)),
      "kk-sides",
      cannotAdd,
      clear,
      inRoll,
      helpMarks("sides"),
    ),
    h(
      "div",
      { class: "kk-row", ...helpMarks("bonus") },
      h("span", { class: "kk-label" }, session.t.modifier),
      h("div", { class: "kk-stepper" }, minus, h("output", { "data-testid": "kk-mod" }, mod), plus),
      h("span", { class: "kk-notation" }, input),
      error,
      formula ? h("span", { class: "kk-fine kk-formula", "data-testid": "kk-formula" }, session.t.formula) : null,
    ),
    // Always there, so the rows below never move; dimmed while there is one die or none to choose among.
    session.segment<Keep>(
      session.t.keep,
      ["all", "highest", "lowest"],
      mine === undefined || (mine.keepCount ?? 1) > 1 ? null : mine.keep,
      (k) => (k === "all" ? session.t.keepAll : k === "highest" ? session.t.keepHighest : session.t.keepLowest),
      (k) => session.changeLit({ keep: k, keepCount: 1 }),
      "kk-keep",
      (k) => formula || mine === undefined || (mine.count < 2 && k !== "all"),
      undefined,
      undefined,
      helpMarks("keep"),
    ),
    h(
      "details",
      { class: "kk-settings", open: seeded },
      h("summary", {}, `${session.t.randomness}: ${seeded ? `${session.t.seeded} (${session.seed})` : session.t.fair}`),
      session.segment(
        session.t.randomness,
        ["fair", "seeded"] as const,
        seeded ? "seeded" : "fair",
        (m) => (m === "fair" ? session.t.fair : session.t.seeded),
        (m) => (m === "fair" ? session.useSeed(null) : session.useSeed(session.seed ?? newSeed())),
        "kk-mode",
      ),
      h("p", {}, seeded ? session.t.seededHint : session.t.fairHint),
      seeded ? h("div", { class: "kk-row" }, seedInput, fresh) : null,
    ),
    // The tray's own language chooser, for a page that asks for one: quiet, and last but for what is one level down.
    session.options.languageChooser === true
      ? session.segment(
          session.t.language,
          ["en", "ja"] as const,
          session.locale.toLowerCase().startsWith("ja") ? "ja" : "en",
          (l) => (l === "en" ? "English" : "日本語"),
          (l) => session.setLocale(l, true),
          "kk-language",
        )
      : null,
    gamesPanel(
      session.gamesState,
      session.game,
      session.japanese(),
      session.t,
      session.chooseGame,
      () => {
        session.game = null;
        session.war = null;
        session.render();
      },
      session.options.diceWar === true
        ? {
            name: session.t.warName,
            says: session.t.warSays,
            chosen: session.war !== null,
            choose: session.chooseWar,
            value: "dice-war",
          }
        : null,
    ),
    morePanel(session.more, session.sets, !session.empty, session.spec.times ?? 1, session.TRAY_TIMES, session.t, {
      times(n) {
        session.changeSpec({ times: n });
      },
      add(text) {
        const read = checkNotation(text);
        if (!read.ok) return fillIn(session.t[REFUSALS[read.problem]], { part: read.part });
        // A die made or picked here joins the roll like a tapped one: every kind in what was typed, as many as there is room for.
        for (const group of groupsOf(read.spec))
          if (!session.addDie(group, group.count))
            return fillIn(full ? session.t.limitDice : session.t.limitKinds, { n: full ? MAX_DICE : MAX_GROUPS });
        return null;
      },
      save(name) {
        const set = makeSet(name, session.spec);
        if (set === null) return;
        session.sets = withSet(session.sets, set);
        session.storageWorks = storeSets(session.storage, session.setsKey, session.sets) && session.storageWorks;
      },
      use(set) {
        const read = checkNotation(set.notation);
        session.game = null;
        session.war = null;
        if (read.ok) session.changeSpec(read.spec);
      },
      remove(set) {
        session.sets = withoutSet(session.sets, set.name);
        storeSets(session.storage, session.setsKey, session.sets);
        session.renderControls();
      },
      copy(set, button) {
        session.copyLink(session.linkTo(setQuery(set)), button);
      },
      redraw: session.renderControls,
    }),
  );
  const saying = session.empty ? session.t.addToRoll : fillIn(session.t.poolSays, { notation: session.notation() });
  if (session.said.textContent !== saying) session.said.textContent = saying;
}
