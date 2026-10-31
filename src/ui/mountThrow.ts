import {
  type DiceGroup,
  diceOf,
  dieName,
  groupOf,
  groupsOf,
  MAX_DICE,
  MAX_GROUPS,
  normalizeSpec,
  type Roll,
  type RollSpec,
  roll,
  rollHeld,
  rollMany,
  specOf,
} from "../dice.ts";
import { diceWarOver } from "../diceWar.ts";
import { type Preset, presetSpec } from "../games/presets.ts";
import { addToHistory, saveHistory } from "../history.ts";
import { type Distribution, distributionHolding, expectedTotal } from "../odds.ts";
import { cryptoSource, seededSource } from "../random.ts";
import { h, refill, s } from "./dom.ts";
import { dieFace } from "./faces.ts";
import type { Session } from "./mountSession.ts";
import { createRollSound } from "./sound.ts";
import { newWar, throwWar, warNames } from "./war.ts";

/** A speaker, with waves when the sound is on and a cross when it is off. */
function speaker(on: boolean): SVGElement {
  return s(
    "svg",
    {
      viewBox: "0 0 24 24",
      width: 20,
      height: 20,
      fill: "none",
      stroke: "currentColor",
      "stroke-width": 2,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
      "aria-hidden": "true",
    },
    s("path", { d: "M4 9.5h3.5L12 6v12l-4.5-3.5H4z", fill: "currentColor" }),
    s("path", { d: on ? "M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10" : "M16 9.5l5 5M21 9.5l-5 5" }),
  );
}

export function later(session: Session, fn: () => void, ms: number) {
  const id = setTimeout(() => {
    session.timers.delete(id);
    fn();
  }, ms);
  session.timers.add(id);
}

export function segment<T extends string | number>(
  _session: Session,
  label: string,
  values: readonly T[],
  chosen: T | null,
  name: (v: T) => Node | string,
  pick: (v: T) => void,
  testId: string,
  dimmed: (v: T) => boolean = () => false,
  last: HTMLElement | null = null,
  inPool: (v: T) => boolean = () => false,
  help: Record<string, string> = {},
) {
  return h(
    "div",
    { class: "kk-row", ...help },
    h("span", { class: "kk-label", "data-testid": `${testId}-label` }, label),
    h(
      "div",
      { class: "kk-seg", role: "group", "aria-label": label, "data-testid": testId },
      ...values.map((v) => {
        const button = h(
          "button",
          {
            type: "button",
            "aria-pressed": String(v === chosen),
            "data-value": String(v),
            "data-in": inPool(v) ? "true" : null,
            disabled: dimmed(v),
          },
          name(v),
        );
        button.addEventListener("click", () => pick(v));
        return button;
      }),
      last,
    ),
  );
}

/** The spec changed: nothing is held any more, and the target follows the new average. */
export function settle(session: Session, before: string) {
  if (session.notation() !== before) {
    session.goal = Math.round(expectedTotal(session.spec));
    session.held = [];
  }
  session.showingShared = false;
  session.render();
}

/** The pool, set from its kinds. The kind last touched stays lit, found again by its sides. */
export function setKinds(session: Session, next: DiceGroup[], touched: string | null) {
  const before = session.notation();
  session.empty = next.length === 0;
  if (!session.empty) session.spec = specOf(next, session.spec.modifier);
  const found = touched === null ? -1 : groupsOf(session.spec).findIndex((g) => dieName(g) === touched);
  session.lit = session.empty ? 0 : found >= 0 ? found : Math.min(session.lit, groupsOf(session.spec).length - 1);
  session.settle(before);
}

/**
 * A change to one part keeps the rest. A whole spec (the dice, the bonus and
 * what is kept, all given) replaces everything, so typing `4d6dl1` after
 * `3d6!` does not leave the dice exploding.
 */
export function changeSpec(session: Session, next: Partial<RollSpec>) {
  const before = session.notation();
  const whole =
    next.count !== undefined && next.sides !== undefined && next.modifier !== undefined && next.keep !== undefined;
  // The dice set from outside (typed, or by the page) are a choice; the bonus alone is not.
  if (whole || next.count !== undefined || next.sides !== undefined || next.more !== undefined)
    session.suggested = false;
  session.spec = normalizeSpec(whole ? next : { ...session.spec, ...next });
  session.empty = false;
  session.lit = whole ? 0 : Math.min(session.lit, groupsOf(session.spec).length - 1);
  session.settle(before);
}

/** A change to the kind that is lit: its count, or what it keeps. */
export function changeLit(session: Session, next: Partial<DiceGroup>) {
  const all = session.kinds();
  const mine = all[session.lit];
  if (mine === undefined) return;
  if (next.count !== undefined) session.suggested = false;
  all[session.lit] = { ...mine, ...next };
  session.setKinds(all, dieName(mine));
}

/**
 * One more die of a kind: on the kind already in the pool, or as a new kind.
 * On the dice the tray opened with, a different kind takes their place, and
 * the same kind is simply one more of them.
 */
export function addDie(session: Session, die: DiceGroup, count = 1) {
  const name = dieName(die);
  // A formula is not added to by a tap: the die tapped starts a new roll, as it does on the dice the tray opened with.
  const all =
    session.spec.math !== undefined || (session.suggested && !session.kinds().some((g) => dieName(g) === name))
      ? []
      : session.kinds();
  session.suggested = false;
  const at = all.findIndex((g) => dieName(g) === name);
  // Never past the limits: the buttons dim there, and a die made or loaded below is held to them too.
  const room = MAX_DICE - all.reduce((sum, g) => sum + g.count, 0);
  const adding = Math.min(count, room);
  if (adding < 1 || (at < 0 && all.length >= MAX_GROUPS)) return false;
  if (at >= 0) all[at] = { ...(all[at] as DiceGroup), count: (all[at] as DiceGroup).count + adding };
  else all.push({ ...die, count: adding, keep: "all" });
  session.setKinds(all, name);
  return true;
}

/** One die fewer of a kind; its last die takes the kind out of the pool. */
export function takeOne(session: Session, index: number) {
  const all = session.kinds();
  const mine = all[index];
  if (mine === undefined) return;
  session.suggested = false;
  if (mine.count > 1) all[index] = { ...mine, count: mine.count - 1 };
  else all.splice(index, 1);
  session.setKinds(all, mine.count > 1 ? dieName(mine) : null);
}

/** The tray in another language. A choice made with the tray's own chooser is remembered on the device. */
export function setLocale(session: Session, next: string, remember: boolean) {
  session.locale = next;
  session.t = session.wordsFor(next);
  if (remember) {
    try {
      session.storage?.setItem(session.languageKey, next);
    } catch {
      // Not remembered on a device that keeps nothing.
    }
  }
  session.release.textContent = session.t.releaseAll;
  session.renderMute();
  session.render();
}

/** Sit down to Dice War: the tray's dice become the person's, and each roll is their throw. */
export function chooseWar(session: Session) {
  session.game = null;
  session.gameRolls = [];
  session.turn = 0;
  session.gamesState.open = false;
  session.startWar();
  session.changeSpec({ count: session.warSettings.dice, sides: 6, modifier: 0, keep: "all", times: 1 });
}

/** A fresh table from the settings last chosen. */
export function startWar(session: Session) {
  session.war = newWar(session.warSettings, warNames(session.warSettings.players, session.t.warYou));
}

/** Take up a game: its dice become the roll, and each roll is read the way the game reads it. */
export function chooseGame(session: Session, preset: Preset) {
  session.war = null;
  session.game = preset;
  session.gameRolls = [];
  session.turn = 0;
  session.gamesState.open = false;
  session.changeSpec(presetSpec(preset));
}

export function useSeed(session: Session, next: string | null) {
  session.seed = next;
  session.source = next === null ? cryptoSource() : seededSource(next);
  session.render();
}

export function toggleHold(session: Session, index: number) {
  const shown = session.showing();
  if (shown === null) return;
  if (session.held.length !== shown.faces.length) session.held = shown.faces.map(() => false);
  session.held[index] = session.held[index] !== true;
  session.goal = Math.round(expectedTotal(session.oddsNow()));
  session.renderTray();
  session.renderPanels();
}

/** The odds of what a tap on the felt would throw now: the pool's own, or with dice held, those of the dice still to roll. */
export function oddsNow(session: Session): RollSpec | Distribution {
  const shown = session.showing();
  return shown !== null && session.heldCount() > 0 && session.holdable()
    ? distributionHolding(session.spec, shown.faces, session.held)
    : session.spec;
}

export function renderMute(session: Session) {
  session.mute.setAttribute("aria-pressed", String(!session.muted));
  session.mute.setAttribute("aria-label", session.muted ? session.t.soundOff : session.t.soundOn);
  session.mute.setAttribute("title", session.muted ? session.t.soundOff : session.t.soundOn);
  session.mute.replaceChildren(speaker(!session.muted));
}

/** The sound of a throw: the page's own if it gave one, else the recorded dice, fetched on the first throw that wants them. */
export function sound(session: Session, dice: number, landings: number[]) {
  if (!session.hasSound || session.muted) return;
  try {
    if (session.options.playSound !== undefined)
      return session.options.playSound({ dice, ms: session.animationMs, landings });
    session.ownSound ??= createRollSound(session.win ?? undefined);
    session.ownSound.play({ dice, ms: session.animationMs, landings });
  } catch {
    // A sound that fails is no reason for the dice not to roll.
  }
}

export function render(session: Session) {
  session.renderControls();
  session.renderTray();
  session.renderResult();
  session.renderWar();
  session.renderPanels();
}

export function throwDice(session: Session) {
  if (session.rolling || session.empty) return;
  const shown = session.showing();
  const keeping =
    shown !== null && session.holdable() && session.heldCount() > 0 ? session.held.slice(0, shown.faces.length) : null;
  // With every die held there is nothing to throw.
  if (keeping?.every(Boolean) === true) return;
  // The generator throws the dice here, before anything moves; the tumble and the sound only show what it threw.
  const many =
    (session.spec.times ?? 1) > 1
      ? rollMany(session.spec, Math.min(session.TRAY_TIMES, session.spec.times ?? 1), session.source).rolls
      : null;
  const thrown =
    many !== null
      ? (many.at(-1) as Roll)
      : keeping !== null && shown !== null
        ? rollHeld(shown, keeping, session.source)
        : roll(session.spec, session.source);
  session.showingShared = false;
  const moving = thrown.faces.map((_, i) => keeping?.[i] !== true);
  const movers = moving.filter(Boolean).length;
  if (session.animationMs === 0) {
    session.sound(
      movers,
      moving.flatMap((m) => (m ? [0] : [])),
    );
    return session.land(thrown, many);
  }
  // Each die starts a moment after the one before and tumbles for its own time; all are down by animationMs.
  const gap = movers < 2 ? 0 : Math.min(45, (session.animationMs * 0.22) / (movers - 1));
  let order = 0;
  const waits = moving.map((m) => (m ? Math.round(order++ * gap) : 0));
  const tumbles = waits.map((wait) => Math.round((session.animationMs - wait) * (0.86 + Math.random() * 0.14)));
  session.sound(
    movers,
    waits.flatMap((wait, i) => (moving[i] ? [wait + (tumbles[i] as number)] : [])),
  );
  session.rolling = true;
  session.renderResult();
  session.felt.setAttribute("data-rolling", "true");
  const dice = diceOf(thrown);
  const shapes: [HTMLElement, DiceGroup][] = [];
  session.diceBox.setAttribute("data-count", dice.length > MAX_DICE ? "many" : String(dice.length));
  session.diceBox.replaceChildren(
    ...dice.map((die, i) => {
      const kind = groupOf(thrown.spec, die);
      const first = i > 0 && die.group !== dice[i - 1]?.group;
      // A held die stays where it is, showing its face.
      if (!moving[i]) return session.dieElement(kind, die, i, first);
      const el = session.dieElement(
        kind,
        { face: session.randomFace(kind), status: "kept", exploded: false, die: i },
        i,
        first,
      );
      el.removeAttribute("aria-pressed");
      el.classList.add("kk-tumble");
      el.style.setProperty("--kk-x0", `${Math.round((Math.random() - 0.5) * 160)}px`);
      el.style.setProperty("--kk-y0", `${Math.round(-40 - Math.random() * 60)}px`);
      el.style.setProperty("--kk-r0", `${Math.round((Math.random() - 0.5) * 720)}deg`);
      el.style.setProperty("--kk-t", `${tumbles[i]}ms`);
      el.style.setProperty("--kk-wait", `${waits[i]}ms`);
      shapes.push([el, kind]);
      return el;
    }),
  );
  refill(session.hint, " ");
  session.release.hidden = true;
  const flicker = () => {
    for (const [el, kind] of shapes) el.replaceChildren(dieFace(kind, session.randomFace(kind), session.t.rolling));
  };
  const step = Math.max(60, Math.round(session.animationMs / 9));
  for (let at = step; at < session.animationMs; at += step) session.later(flicker, at);
  session.later(() => session.land(thrown, many), session.animationMs + 60);
}

export function land(session: Session, thrown: Roll, many: Roll[] | null = null) {
  session.rolling = false;
  session.current = thrown;
  session.currentSet = many;
  // A roll with dice held is the next roll of the same turn; any other begins one.
  session.turn = thrown.held !== undefined ? session.turn + 1 : 1;
  session.gameRolls = [...session.gameRolls, ...(many ?? [thrown])].slice(-24);
  // What was held stays held for the next throw; a fresh roll holds nothing.
  session.held = thrown.held !== undefined ? [...thrown.held] : thrown.faces.map(() => false);
  for (const one of many ?? [thrown]) session.history = addToHistory(session.history, one);
  session.storageWorks = saveHistory(session.storage, session.storageKey, session.history);
  session.goal = Math.round(expectedTotal(session.oddsNow()));
  // A throw at a game of Dice War: the tray's dice are the person's, if they are the table's dice and nothing else.
  if (session.war !== null) {
    const plain =
      thrown.spec.count === session.war.settings.dice &&
      thrown.spec.sides === 6 &&
      thrown.spec.modifier === 0 &&
      thrown.spec.more === undefined &&
      (thrown.spec.times ?? 1) === 1 &&
      thrown.faces.length === session.war.settings.dice;
    const played = plain && !diceWarOver(session.war.game) ? throwWar(session.war, thrown.faces) : null;
    // Dice that are not the table's end the game; a game that is over simply waits for a new one.
    if (!plain) session.war = null;
    else if (played !== null) session.war = played;
  }
  session.render();
  session.diceBox.querySelectorAll(".kk-die").forEach((el, i) => {
    if (thrown.held?.[i] !== true) el.classList.add("kk-land");
  });
  try {
    session.win?.navigator.vibrate?.(12);
  } catch {
    // A browser that refuses vibration refuses silently; so does this.
  }
  session.options.onRoll?.(thrown);
}
