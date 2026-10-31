import {
  DIE_SIDES,
  type DiceGroup,
  type DieRoll,
  type DieSides,
  diceOf,
  dieName,
  faceRange,
  groupOf,
  groupsOf,
  type Keep,
  MAX_DICE,
  MAX_GROUPS,
  MIN_DICE,
  type Roll,
  type Sides,
  specOf,
} from "../dice.ts";
import { formulaText } from "../export.ts";
import { checkNotation, formatNotation } from "../notation.ts";
import { newSeed } from "../random.ts";
import { makeSet, setQuery, storeSets, withoutSet, withSet } from "../sets.ts";
import { h, refill } from "./dom.ts";
import { dieFace, dieIcon, faceText, minusMark } from "./faces.ts";
import { gamesPanel } from "./games.ts";
import { helpMarks } from "./help.ts";
import { morePanel } from "./more.ts";
import type { Session } from "./mountSession.ts";
import { fillIn, REFUSALS } from "./strings.ts";

/** A pleasant set of faces for a tray nobody has rolled yet. */
const RESTING = [5, 3, 6, 2, 4, 1, 6, 3, 5, 2];
const RESTING_FATE = [1, 0, -1, 1, 0, 1, -1, 0, 1, -1];

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

/** What a die is and what became of it, in words: "d6: 6, exploded". */
export function dieLabel(session: Session, group: DiceGroup, die: DieRoll, isHeld: boolean): string {
  const words = [
    group.weights !== undefined ? session.t.dieLoaded : null,
    die.status === "dropped" ? session.t.dieDropped : die.status === "rerolled" ? session.t.dieRerolled : null,
    die.exploded ? session.t.dieExploded : null,
    die.counts === 1 ? session.t.dieSuccess : die.counts === -1 ? session.t.dieFailure : null,
    die.critical === "success" ? session.t.dieCritical : die.critical === "failure" ? session.t.dieFumble : null,
    isHeld ? session.t.held : null,
  ].filter((w) => w !== null);
  // A custom die is named by what it shows; its list of faces would be a mouthful.
  return `${group.faces !== undefined ? "" : `${dieName(group)}: `}${faceText(group, die.face)}${words.length > 0 ? `, ${words.join(", ")}` : ""}`;
}

/** One die on the felt. `hold` makes it a button that holds it; without, it is a picture and a tap goes through to the felt. */
export function dieElement(
  session: Session,
  group: DiceGroup,
  die: DieRoll,
  index: number,
  first: boolean,
  hold: ((index: number) => void) | null = null,
): HTMLElement {
  const sides = group.sides;
  const kept = die.status === "kept";
  const isHeld = session.held[index] === true;
  // A kind with marks of its own (cs, cf) is marked by them; otherwise a d20 shows its natural 20 and 1.
  const marked = group.critical !== undefined || group.fumble !== undefined;
  const hit = marked
    ? die.critical === "success"
      ? "crit"
      : die.critical === "failure"
        ? "fumble"
        : null
    : sides === 20 && group.faces === undefined && kept
      ? die.face === 20
        ? "crit"
        : die.face === 1
          ? "fumble"
          : null
      : null;
  const label = session.dieLabel(group, die, isHeld);
  const attrs = {
    class: "kk-die",
    "data-kept": String(kept),
    "data-status": die.status,
    "data-exploded": die.exploded ? "true" : null,
    "data-hit": hit,
    "data-counts": die.counts === undefined ? null : String(die.counts),
    "data-first": first ? "true" : null,
    "data-testid": "kk-die",
    "data-face": String(die.face),
    "data-index": String(index),
    "data-sides": String(sides),
    "data-loaded": group.weights !== undefined ? "true" : null,
    "data-custom": group.faces !== undefined ? "true" : null,
    title:
      kept && !die.exploded && group.weights === undefined && die.counts === undefined && die.critical === undefined
        ? null
        : label,
  };
  if (hold === null) return h("span", attrs, dieFace(group, die.face, label));
  const button = h(
    "button",
    { ...attrs, type: "button", "aria-pressed": String(isHeld), "data-tag": session.t.held },
    dieFace(group, die.face, label),
  );
  button.addEventListener("click", () => hold(index));
  return button;
}

/** A face to show while a die tumbles. It is for show: the roll was made before anything moved. */
export function randomFace(_session: Session, group: DiceGroup): number {
  const { low, high } = group.faces !== undefined ? { low: 1, high: group.faces.length } : faceRange(group.sides);
  return low + Math.floor(Math.random() * (high - low + 1));
}

/** The pool at rest, before it is thrown: each kind's dice in its own shape, showing pleasant faces. */
export function restingDice(session: Session): DieRoll[] {
  const all = session.kinds();
  const dice: DieRoll[] = [];
  all.forEach((group, index) => {
    for (let n = 0; n < group.count; n++) {
      const at = dice.length;
      const face = group.sides === "F" ? (RESTING_FATE[at] as number) : Math.min(RESTING[at] as number, group.sides);
      const custom = group.faces?.[face - 1];
      const one: DieRoll = { face, status: "kept", exploded: false, die: at };
      if (all.length > 1) one.group = index;
      if (custom !== undefined) one.label = custom.label;
      dice.push(one);
    }
  });
  return dice;
}

export function renderTray(session: Session) {
  const shown = session.showing();
  const thrown = shown === null ? session.restingDice() : diceOf(shown);
  const from = shown?.spec ?? session.spec;
  const hold = session.holdable() ? session.toggleHold : null;
  const holding = hold !== null ? session.heldCount() : 0;
  session.tray.setAttribute(
    "aria-label",
    session.empty ? session.t.addToRoll : fillIn(session.t.rollLabel, { notation: session.notation() }),
  );
  session.tray.disabled = session.empty || (holding > 0 && holding === thrown.length);
  session.felt.setAttribute("data-rolling", String(session.rolling));
  session.diceBox.setAttribute("data-count", thrown.length > MAX_DICE ? "many" : String(thrown.length));
  // Dice asked to be sorted are shown so, kind by kind; the roll keeps the order they were thrown in.
  const shownOrder = thrown.map((die, i) => ({ die, i }));
  if (shown !== null && groupsOf(from).some((g) => g.sort !== undefined)) {
    shownOrder.sort((a, b) => {
      const kind = (a.die.group ?? 0) - (b.die.group ?? 0);
      const sort = groupOf(from, a.die).sort;
      if (kind !== 0 || sort === undefined) return kind !== 0 ? kind : a.i - b.i;
      const by = (a.die.value ?? a.die.face) - (b.die.value ?? b.die.face);
      return by !== 0 ? (sort === "ascending" ? by : -by) : a.i - b.i;
    });
  }
  session.diceBox.replaceChildren(
    ...shownOrder.map(({ die, i }, at) =>
      session.dieElement(groupOf(from, die), die, i, at > 0 && die.group !== shownOrder[at - 1]?.die.group, hold),
    ),
  );
  const words = session.empty
    ? session.t.addToRoll
    : session.current === null
      ? session.t.tapToRoll
      : (session.spec.times ?? 1) > 1
        ? fillIn(session.t.timesHold, { n: session.spec.times ?? 1 })
        : session.turnOver() && shown !== null
          ? fillIn(session.t.turnOver, { n: session.game?.rolls ?? 0 })
          : hold === null
            ? session.t.tapAgain
            : holding === 0
              ? session.game?.rolls !== undefined
                ? fillIn(session.t.turnRoll, { a: session.turn, n: session.game.rolls })
                : session.t.tapAgainHold
              : holding === thrown.length
                ? session.t.allHeld
                : fillIn(session.t.rollRest, { n: thrown.length - holding });
  // Space rolls from a keyboard; the key is shown only where there is room for it beside the shorter hints.
  refill(
    session.hint,
    words,
    session.empty || hold !== null || session.options.keyboard === false ? null : h("kbd", {}, "Space"),
  );
  session.release.hidden = holding === 0;
}

/** The dice as a sum, the way it would be said: each kind together, a kind of several dice in brackets, a die that does not count struck through. */
export function sumLine(session: Session, r: Roll): HTMLElement {
  const thrown = diceOf(r);
  const all = groupsOf(r.spec);
  const line = h("div", { class: "kk-sum", "data-testid": "kk-sum" });
  // A formula is shown as it was written, each kind of dice as it fell.
  if (r.spec.math !== undefined) {
    line.append(formulaText(r));
    return line;
  }
  all.forEach((group, index) => {
    const mine = thrown.filter((die) => (die.group ?? 0) === index);
    // Signs and words sit side by side; numbers are added.
    const joiner =
      group.sides === "F"
        ? " "
        : group.success !== undefined || (group.faces?.every((f) => f.value === undefined) ?? false)
          ? " · "
          : " + ";
    if (index > 0) line.append(" + ");
    const bracket = all.length > 1 && mine.length > 1;
    if (bracket) line.append("(");
    mine.forEach((die, i) => {
      if (i > 0) line.append(joiner);
      // A die worth something other than its face says both: 6→5 for a penetrating die, 1→2 for a raised one.
      const face = `${faceText(group, die.face)}${group.faces === undefined && die.value !== undefined ? `→${die.value}` : ""}`;
      if (die.status === "kept" && die.counts !== undefined)
        line.append(
          h(
            die.counts === 1 ? "b" : "i",
            { title: die.counts === 1 ? session.t.dieSuccess : session.t.dieFailure },
            `${face}${die.exploded ? "!" : ""}${die.counts === 1 ? "✓" : "✗"}`,
          ),
        );
      else if (die.status === "kept") line.append(`${face}${die.exploded ? "!" : ""}`);
      else
        line.append(
          h(
            "s",
            { title: die.status === "rerolled" ? session.t.dieRerolled : session.t.dieDropped },
            `${face}${die.status === "rerolled" ? "↻" : ""}`,
          ),
        );
    });
    if (bracket) line.append(")");
  });
  if (r.spec.modifier !== 0) line.append(r.spec.modifier > 0 ? ` + ${r.spec.modifier}` : ` − ${-r.spec.modifier}`);
  return line;
}
