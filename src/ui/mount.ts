import {
  canHold,
  DEFAULT_SPEC,
  type DiceGroup,
  groupsOf,
  normalizeSpec,
  type Roll,
  type RollSpec,
  type Sides,
} from "../dice.ts";
import { getPreset, type Preset, presetSpec } from "../games/presets.ts";
import { loadHistory, type StorageLike } from "../history.ts";
import { checkNotation, formatNotation } from "../notation.ts";
import { expectedTotal } from "../odds.ts";
import { cryptoSource, type RandomSource, seededSource } from "../random.ts";
import { type DiceSet, loadSets, readSet } from "../sets.ts";
import { readShared, readSharedMany } from "../share.ts";
import { type Cloth, clothVars, isCloth } from "./cloth.ts";
import { h } from "./dom.ts";
import type { GamesState } from "./games.ts";
import type { MoreState } from "./more.ts";
import { bindSession } from "./mountBind.ts";
import {
  dieElement as dieElementOf,
  dieLabel as dieLabelOf,
  randomFace as randomFaceOf,
  renderControls as renderControlsOf,
  renderTray as renderTrayOf,
  restingDice as restingDiceOf,
  sumLine as sumLineOf,
} from "./mountControls.ts";
import {
  copyLink as copyLinkOf,
  exportPanel as exportPanelOf,
  linkTo as linkToOf,
  renderPanels as renderPanelsOf,
  renderResult as renderResultOf,
  renderWar as renderWarOf,
  restOf as restOfOf,
  save as saveOf,
  waiting as waitingOf,
} from "./mountResult.ts";
import {
  addDie as addDieOf,
  changeLit as changeLitOf,
  changeSpec as changeSpecOf,
  chooseGame as chooseGameOf,
  chooseWar as chooseWarOf,
  land as landOf,
  later as laterOf,
  oddsNow as oddsNowOf,
  renderMute as renderMuteOf,
  render as renderOf,
  segment as segmentOf,
  setKinds as setKindsOf,
  setLocale as setLocaleOf,
  settle as settleOf,
  sound as soundOf,
  startWar as startWarOf,
  takeOne as takeOneOf,
  throwDice as throwDiceOf,
  toggleHold as toggleHoldOf,
  useSeed as useSeedOf,
} from "./mountThrow.ts";
import type { RealDie } from "./panels.ts";
import type { PlaySound, RollSound } from "./sound.ts";
import { type RollerStrings, STRINGS } from "./strings.ts";
import { injectStyle } from "./style.ts";
import { WAR_DEFAULTS, type WarSession, type WarSettings } from "./war.ts";

/** Everything a tray can be told when it is mounted. All of it is optional.
 *
 * @example
 * ```ts
 * import type { RollerOptions } from "@johnmorrisdotca/korokoro";
 * const value: RollerOptions = { spec: { count: 2, sides: 6 }, storage: null, sound: false };
 * console.log(value.spec?.count);
 * ```
 */
export type RollerOptions = {
  /** For numbers and times, and for which built-in words to use: "ja…" is Japanese, anything else English. */
  locale?: string;
  /** Words to use instead of the built-in ones. */
  strings?: Partial<RollerStrings>;
  /** Where the history is kept. Defaults to localStorage; pass null to keep nothing. */
  storage?: StorageLike | null;
  /** The key the history is kept under. Defaults to "korokoro.history". */
  storageKey?: string;
  /** The dice showing when the tray opens. */
  spec?: Partial<RollSpec>;
  /** A query string that may hold a shared roll or a seed. Defaults to the page's own. */
  query?: string;
  /** The address a shared link points at. Defaults to the page's own, without its query. */
  shareBase?: string;
  /** The cloth the felt is laid in: "green" (unless said), "blue", "red", "black" or "wood", the family's five. `theme` is laid over it. */
  cloth?: Cloth;
  /** The colour of a d6's one pip, on the felt and in the history: `"red"` (unless said) or `"black"`, the colour of the other pips. */
  onePip?: "red" | "black";
  /** CSS variables for the tray, such as `{ "--kk-felt": "#234" }`: set on the tray itself, so they win over its defaults in both themes. */
  theme?: Record<`--kk-${string}`, string>;
  /** Tray and panels side by side on a wide screen. */
  wide?: boolean;
  /** Called once each roll has landed. */
  onRoll?: (roll: Roll) => void;
  /** Length of the tumble, in milliseconds, from the throw to the last die landing. Reduced motion always skips it. */
  animationMs?: number;
  /**
   * Whether the tray has a sound at all. Left out or true, it has a mute
   * button, and starts with the sound on unless the device asks for reduced
   * motion or somebody muted it here before. False, it is silent and has no button.
   */
  sound?: boolean;
  /** A sound of your own for each throw, in place of the recorded dice. It is called only while the tray is not muted. */
  playSound?: PlaySound;
  /**
   * Whether a die on the felt can be tapped to hold it while the rest are
   * rolled again. Left out or true, plain dice can be held once they have been
   * rolled. False, a tap anywhere on the felt rolls, a die included.
   */
  hold?: boolean;
  /**
   * Whether the dice the tray opens with are only a suggestion. Left out or
   * true, they are: the first die button tapped replaces them with one of that
   * die, so one tap gives a d20, and every tap after that adds. False, the
   * opening dice are the user's own roll and the first tap adds to them. A
   * roll that arrives by a shared link is always the user's.
   */
  placeholder?: boolean;
  /**
   * Whether Space rolls from anywhere on the page. Left out or true, it does,
   * unless something that takes typing has the focus. False, the page keeps
   * its Space (to scroll, say) and the tray rolls from the keyboard only when
   * the focus is inside it: for a tray that is one thing among many on a page.
   */
  keyboard?: boolean;
  /**
   * Whether Dice War is among the games: a table of the person at the tray and computers, played with the tray's own dice
   * (`diceWar.ts` has the rules). Off unless asked for, so a tray that does not want a game in it is as it was.
   */
  diceWar?: boolean;
  /** Whether the tray offers its own small choice of language, English or 日本語, remembered on the device. Off unless asked for, so the tray stays as plain as it was. */
  languageChooser?: boolean;
  /**
   * How much of the tray is drawn, for a tray put into a small space on
   * somebody's page. "small" is the felt and the result and nothing else: the
   * dice are the ones it was given. "medium" adds the choice of dice and the
   * bonus. "large", and left out, is everything: the history, the stats and
   * the odds too.
   */
  size?: RollerSize;
};

/** How much of the tray is drawn: the felt alone, the felt and the choice of dice, or all of it.
 *
 * @example
 * ```ts
 * import type { RollerSize } from "@johnmorrisdotca/korokoro";
 * const value: RollerSize = "small";
 * console.log(value);
 * ```
 */
export type RollerSize = "small" | "medium" | "large";

/** What `mountRoller` hands back: the tray, driven from code.
 *
 * @example
 * ```ts no-run
 * import type { RollerHandle } from "@johnmorrisdotca/korokoro";
 * import { mountRoller } from "@johnmorrisdotca/korokoro";
 * const value: RollerHandle = mountRoller(document.createElement("div"), { sound: false, storage: null });
 * console.log(value.history());
 * ```
 */
export type RollerHandle = {
  /** Throw the dice showing, as a tap on the felt does. */
  roll(): void;
  /** Every roll kept so far, oldest first. */
  history(): readonly Roll[];
  /** Change part of the dice, or all of them: a spec with its count, sides, bonus and keep all given, as `parseNotation` returns, replaces the lot. */
  setSpec(spec: Partial<RollSpec>): void;
  /** Change the tray's language: "ja…" for Japanese, anything else for English, with `strings` still laid over it. */
  setLocale(locale: string): void;
  /** Lay the felt in another cloth, at once, keeping every die and roll: "green", "blue", "red", "black" or "wood". */
  setCloth(cloth: Cloth): void;
  /** Change the colour of a d6's one pip at once: "red" or "black". */
  setOnePip(colour: "red" | "black"): void;
  /** Take the tray out of the page and stop its timers and its sound. */
  destroy(): void;
};

export type Tab = "history" | "stats" | "odds";

function defaultStorage(): StorageLike | undefined {
  try {
    return globalThis.localStorage ?? undefined;
  } catch {
    return undefined;
  }
}

/**
 * Put a dice tray into an element.
 *
 * One model runs the whole tray: **the roll is a pool of dice**. Tapping a die
 * button adds one die of that kind to the pool; a chip in the pool takes one
 * away; the number row sets how many of the kind last touched. The dice the
 * tray opens with are a suggestion, not yet anybody's roll, so the first die
 * tapped takes their place: one tap gives a d20, and d20, d4, d4 gives
 * `1d20+2d4`. The notation box says the same pool in writing and can be typed
 * into for anything the buttons do not reach.
 *
 * A tap on the felt throws the pool. Once plain dice have been thrown, a tap
 * on a die holds it and the next throw rolls the rest.
 * @param target - The HTMLElement that owns the native interface.
 * @param options - Native settings and callbacks for this mounted interface.
 * @returns The native mounted handle, including controls and destroy() cleanup.
 * @example
 * ```ts
 * import { mountRoller } from "@johnmorrisdotca/korokoro";
 * const show = (host: HTMLElement, options: Parameters<typeof mountRoller>[1]) => mountRoller(host, options);
 * console.log(typeof show); // function
 * ```
 */
export function mountRoller(target: HTMLElement, options: RollerOptions = {}): RollerHandle {
  const doc = target.ownerDocument;
  const win = doc.defaultView;
  const tree = target.getRootNode();
  injectStyle(doc, tree.nodeType === 11 && "host" in tree ? (tree as ShadowRoot) : undefined);
  const wordsFor = (tag: string): RollerStrings => ({
    ...(tag.toLowerCase().startsWith("ja") ? STRINGS.ja : STRINGS.en),
    ...options.strings,
  });
  let locale = options.locale ?? doc.documentElement.lang ?? "en";
  let t: RollerStrings = wordsFor(locale);
  const storage = options.storage === null ? undefined : (options.storage ?? defaultStorage());
  const storageKey = options.storageKey ?? "korokoro.history";
  const query = options.query ?? win?.location.search ?? "";
  const reduced = win?.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const animationMs = reduced ? 0 : (options.animationMs ?? 650);
  const mutedKey = `${storageKey}.muted`;
  const languageKey = `${storageKey}.lang`;
  if (options.languageChooser === true) {
    // What this device chose last time, when the tray has its own chooser.
    try {
      const kept = storage?.getItem(languageKey);
      if (kept === "en" || kept === "ja") {
        locale = kept;
        t = wordsFor(kept);
      }
    } catch {
      // A storage that refuses to be read leaves the page's language.
    }
  }
  const hasSound = options.sound !== false;
  const mayHold = options.hold !== false;

  const params = new URLSearchParams(query.replace(/^\?/, ""));
  // A link may hold one roll, or a set of them thrown together.
  const sharedSet = readSharedMany(params);
  const shared = sharedSet?.at(-1) ?? readShared(params);
  // A link to a game: its dice, and its way of reading them.
  const linkedGame = getPreset(params.get("game") ?? "");
  // A link to a set of dice: the dice to roll, not a roll already made.
  const linked = shared === null ? readSet(params) : null;
  const linkedSpec = linked === null ? null : checkNotation(linked.notation);
  let spec = normalizeSpec(
    shared?.spec ??
      (linkedSpec?.ok === true ? linkedSpec.spec : null) ??
      (linkedGame === undefined ? null : presetSpec(linkedGame)) ??
      options.spec ??
      DEFAULT_SPEC,
  );
  /** The game the rolls are being read as, when one is chosen. */
  let game: Preset | null = linkedGame ?? null;
  /** The game of Dice War being played with the tray, when one is chosen: it takes the place of reading the rolls as a game's. */
  let war: WarSession | null = null;
  /** The settings the next game of Dice War is made from: the last chosen. */
  let warSettings: WarSettings = { ...WAR_DEFAULTS };
  /** The rolls made since the game was chosen, for a game that reads a roll in the light of the ones before. */
  let gameRolls: Roll[] = [];
  /** Which roll of a turn the dice showing are, where a game's turn is several rolls with dice held between them. */
  let turn = 0;
  /** The set the roll showing is the last of, when the dice were thrown several times at once. */
  let currentSet: Roll[] | null = sharedSet;
  const gamesState: GamesState = { open: false, search: "" };
  /** Whether the history's export is open, and what it last said. */
  let exportOpen = false;
  let exportSaid = "";
  const japanese = () => locale.toLowerCase().startsWith("ja");
  /** The most times the tray throws a roll as a set. */
  const TRAY_TIMES = 10;
  const setsKey = `${storageKey}.sets`;
  let sets: DiceSet[] = loadSets(storage, setsKey);
  const more: MoreState = { open: false, faces: "", name: linked?.name ?? "", error: "" };
  const realDie: RealDie = { open: false, text: "", sides: "" };
  /** The pool with every die taken away: the spec is kept for its bonus, and nothing can be thrown. */
  let empty = false;
  /** Which kind of dice the number row and the keep row are about: the one last touched. */
  let lit = 0;
  /**
   * Whether the dice showing are still the ones the tray opened with, which
   * nobody has chosen: then the first die tapped replaces them. Building
   * anything makes the roll the user's: a die tapped, a chip, a number, typed
   * notation, a spec set from code. Rolling, the bonus and the keep row do not.
   */
  let suggested = options.placeholder !== false && shared === null && linked === null && linkedGame === undefined;
  let history = loadHistory(storage, storageKey);
  let current: Roll | null = shared;
  let showingShared = shared !== null;
  /** Which dice of the roll showing are held, one for each of its faces. */
  let held: boolean[] = [];
  let rolling = false;
  let tab: Tab = "history";
  let goal = Math.round(expectedTotal(spec));
  let seed = params.get("seed");
  let source: RandomSource = seed === null ? cryptoSource() : seededSource(seed);
  let clearArmed = false;
  let storageWorks = storage !== undefined;
  // Quiet to begin with where motion is reduced; after that, whatever this device last chose.
  let muted = reduced;
  try {
    const kept = storage?.getItem(mutedKey);
    if (kept === "1" || kept === "0") muted = kept === "1";
  } catch {
    // A storage that refuses to be read leaves the default.
  }
  let ownSound: RollSound | null = null;
  const timers = new Set<ReturnType<typeof setTimeout>>();

  const root = h("div", {
    class: "kk-root",
    "data-wide": String(options.wide === true && (options.size ?? "large") === "large"),
    "data-size": options.size === "small" || options.size === "medium" ? options.size : "large",
    "data-testid": "korokoro",
  });
  const wear = (cloth: string | undefined) => {
    for (const [name, value] of Object.entries({ ...clothVars(cloth), ...(options.theme ?? {}) }))
      root.style.setProperty(name, value);
    root.dataset.cloth = isCloth(cloth) ? cloth : "green";
  };
  wear(options.cloth);
  root.dataset.onePip = options.onePip === "black" ? "black" : "red";
  const controls = h("div", { class: "kk-controls" });
  // The felt is the picture; the tray is the button that fills it. The dice sit over the button, so one that can be held is a button of its own.
  const tray = h("button", { type: "button", class: "kk-tray", "data-testid": "kk-tray" });
  const diceBox = h("div", { class: "kk-dice" });
  const hint = h("span", { class: "kk-hint" });
  const mute = h("button", { type: "button", class: "kk-mute", "data-testid": "kk-mute" });
  const release = h(
    "button",
    { type: "button", class: "kk-release", "data-testid": "kk-release", hidden: true },
    t.releaseAll,
  );
  const felt = h(
    "div",
    { class: "kk-felt", "data-testid": "kk-felt" },
    tray,
    diceBox,
    hint,
    release,
    hasSound ? mute : null,
  );
  const result = h("div", { class: "kk-result", "aria-live": "polite", "data-testid": "kk-result" });
  const warBox = h("div", { class: "kk-war-box", hidden: true });
  const panels = h("div", { class: "kk-panels" });
  // What is about to be rolled, said aloud as it changes.
  const said = h("div", { class: "kk-sr", "aria-live": "polite", "data-testid": "kk-said" });
  // The felt first: on a phone it sits under the thumb, and the choices wait below it.
  root.append(felt, result, warBox, controls, panels, said);
  target.replaceChildren(root);
  const notation = () => (empty ? "" : formatNotation(spec));
  const kinds = (): DiceGroup[] => (empty ? [] : groupsOf(spec));
  /** The plain die of a size, as a kind: what a die button stands for. */
  const plainDie = (sides: Sides): DiceGroup => ({
    count: 1,
    sides,
    keep: "all",
  }); /** The roll on the felt, when it is a roll of the pool as it stands now. */
  const showing = () =>
    current !== null && !empty && (showingShared || formatNotation(current.spec) === formatNotation(spec))
      ? current
      : null;
  /** Whether the dice on the felt can be held: plain dice that have been thrown. */
  /** A game's turn of several rolls is over: the dice showing are its last. */
  const turnOver = () => game?.rolls !== undefined && turn >= game.rolls;
  const holdable = () =>
    mayHold &&
    war === null &&
    !rolling &&
    !showingShared &&
    showing() !== null &&
    canHold(spec) &&
    (spec.times ?? 1) === 1 &&
    !turnOver() &&
    game?.hold !== false;
  const heldCount = () => held.filter(Boolean).length;
  const session = bindSession(
    {
      options: () => options,
      doc: () => doc,
      win: () => win,
      wordsFor: () => wordsFor,
      locale: () => locale,
      t: () => t,
      storage: () => storage,
      storageKey: () => storageKey,
      animationMs: () => animationMs,
      languageKey: () => languageKey,
      hasSound: () => hasSound,
      spec: () => spec,
      game: () => game,
      war: () => war,
      warSettings: () => warSettings,
      gameRolls: () => gameRolls,
      turn: () => turn,
      currentSet: () => currentSet,
      gamesState: () => gamesState,
      exportOpen: () => exportOpen,
      exportSaid: () => exportSaid,
      japanese: () => japanese,
      TRAY_TIMES: () => TRAY_TIMES,
      setsKey: () => setsKey,
      sets: () => sets,
      more: () => more,
      realDie: () => realDie,
      empty: () => empty,
      lit: () => lit,
      suggested: () => suggested,
      history: () => history,
      current: () => current,
      showingShared: () => showingShared,
      held: () => held,
      rolling: () => rolling,
      tab: () => tab,
      goal: () => goal,
      seed: () => seed,
      source: () => source,
      clearArmed: () => clearArmed,
      storageWorks: () => storageWorks,
      muted: () => muted,
      ownSound: () => ownSound,
      timers: () => timers,
      controls: () => controls,
      tray: () => tray,
      diceBox: () => diceBox,
      hint: () => hint,
      mute: () => mute,
      release: () => release,
      felt: () => felt,
      result: () => result,
      warBox: () => warBox,
      panels: () => panels,
      said: () => said,
      notation: () => notation,
      kinds: () => kinds,
      plainDie: () => plainDie,
      showing: () => showing,
      turnOver: () => turnOver,
      holdable: () => holdable,
      heldCount: () => heldCount,
    },
    {
      locale: (value) => {
        locale = value;
      },
      t: (value) => {
        t = value;
      },
      spec: (value) => {
        spec = value;
      },
      game: (value) => {
        game = value;
      },
      war: (value) => {
        war = value;
      },
      warSettings: (value) => {
        warSettings = value;
      },
      gameRolls: (value) => {
        gameRolls = value;
      },
      turn: (value) => {
        turn = value;
      },
      currentSet: (value) => {
        currentSet = value;
      },
      exportOpen: (value) => {
        exportOpen = value;
      },
      exportSaid: (value) => {
        exportSaid = value;
      },
      sets: (value) => {
        sets = value;
      },
      empty: (value) => {
        empty = value;
      },
      lit: (value) => {
        lit = value;
      },
      suggested: (value) => {
        suggested = value;
      },
      history: (value) => {
        history = value;
      },
      current: (value) => {
        current = value;
      },
      showingShared: (value) => {
        showingShared = value;
      },
      held: (value) => {
        held = value;
      },
      rolling: (value) => {
        rolling = value;
      },
      tab: (value) => {
        tab = value;
      },
      goal: (value) => {
        goal = value;
      },
      seed: (value) => {
        seed = value;
      },
      source: (value) => {
        source = value;
      },
      clearArmed: (value) => {
        clearArmed = value;
      },
      storageWorks: (value) => {
        storageWorks = value;
      },
      ownSound: (value) => {
        ownSound = value;
      },
    },
    (session) => ({
      later: (fn, ms) => laterOf(session, fn, ms),
      segment: (label, values, chosen, name, pick, testId, dimmed, last, inPool, help) =>
        segmentOf(session, label, values, chosen, name, pick, testId, dimmed, last, inPool, help),
      settle: (before) => settleOf(session, before),
      setKinds: (next, touched) => setKindsOf(session, next, touched),
      changeSpec: (next) => changeSpecOf(session, next),
      changeLit: (next) => changeLitOf(session, next),
      addDie: (die, count) => addDieOf(session, die, count),
      takeOne: (index) => takeOneOf(session, index),
      renderControls: () => renderControlsOf(session),
      setLocale: (next, remember) => setLocaleOf(session, next, remember),
      chooseWar: () => chooseWarOf(session),
      startWar: () => startWarOf(session),
      renderWar: () => renderWarOf(session),
      chooseGame: (preset) => chooseGameOf(session, preset),
      useSeed: (next) => useSeedOf(session, next),
      dieLabel: (group, die, isHeld) => dieLabelOf(session, group, die, isHeld),
      dieElement: (group, die, index, first, hold) => dieElementOf(session, group, die, index, first, hold),
      randomFace: (group) => randomFaceOf(session, group),
      restingDice: () => restingDiceOf(session),
      toggleHold: (index) => toggleHoldOf(session, index),
      oddsNow: () => oddsNowOf(session),
      renderTray: () => renderTrayOf(session),
      sumLine: (r) => sumLineOf(session, r),
      waiting: () => waitingOf(session),
      linkTo: (query) => linkToOf(session, query),
      copyLink: (url, button) => copyLinkOf(session, url, button),
      renderResult: () => renderResultOf(session),
      renderPanels: () => renderPanelsOf(session),
      save: (name, type, text) => saveOf(session, name, type, text),
      exportPanel: () => exportPanelOf(session),
      restOf: () => restOfOf(session),
      renderMute: () => renderMuteOf(session),
      sound: (dice, landings) => soundOf(session, dice, landings),
      render: () => renderOf(session),
      throwDice: () => throwDiceOf(session),
      land: (thrown, many) => landOf(session, thrown, many),
    }),
  );
  tray.addEventListener("click", session.throwDice);
  release.addEventListener("click", () => {
    held = held.map(() => false);
    goal = Math.round(expectedTotal(session.oddsNow()));
    session.renderTray();
    session.renderPanels();
  });
  mute.addEventListener("click", () => {
    muted = !muted;
    try {
      storage?.setItem(mutedKey, muted ? "1" : "0");
    } catch {
      // Not remembered on a device that keeps nothing; still muted for now.
    }
    session.renderMute();
  });
  session.renderMute();
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== " " || event.defaultPrevented) return;
    const el = event.target as HTMLElement | null;
    if (el !== null && el !== doc.body && el !== root && !root.contains(el)) return;
    // A tray that leaves the page its Space rolls only from inside itself.
    if (options.keyboard === false && (el === null || !root.contains(el))) return;
    if (el?.closest("input, textarea, select, button, summary, [contenteditable]")) return;
    event.preventDefault();
    session.throwDice();
  };
  doc.addEventListener("keydown", onKey);
  session.render();

  return {
    roll: session.throwDice,
    history: () => history,
    setSpec: (next) => {
      // Dice set from outside are their own roll, not a game's.
      game = null;
      war = null;
      session.changeSpec(next);
    },
    setLocale: (next) => session.setLocale(next, false),
    setCloth: (next) => {
      // The theme's own --kk-felt, where given, still wins; otherwise the old cloth's colours are taken off first.
      for (const name of ["--kk-felt", "--kk-felt-deep", "--kk-felt-ink"]) root.style.removeProperty(name);
      wear(next);
    },
    setOnePip: (colour) => {
      root.dataset.onePip = colour === "black" ? "black" : "red";
    },
    destroy() {
      for (const id of timers) clearTimeout(id);
      doc.removeEventListener("keydown", onKey);
      ownSound?.close();
      target.replaceChildren();
    },
  };
}
