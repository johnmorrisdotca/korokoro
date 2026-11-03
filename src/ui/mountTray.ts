import {
  type DiceGroup,
  type DieRoll,
  diceOf,
  dieName,
  faceRange,
  groupOf,
  groupsOf,
  MAX_DICE,
  type Roll,
} from "../dice.ts";
import { formulaText } from "../export.ts";
import { h, refill } from "./dom.ts";
import { dieFace, faceText } from "./faces.ts";
import type { Session } from "./mountSession.ts";
import { fillIn } from "./strings.ts";

/** A pleasant set of faces for a tray nobody has rolled yet. */
const RESTING = [5, 3, 6, 2, 4, 1, 6, 3, 5, 2];
const RESTING_FATE = [1, 0, -1, 1, 0, 1, -1, 0, 1, -1];

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
