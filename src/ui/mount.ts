import {
  DEFAULT_SPEC,
  DIE_SIDES,
  MAX_DICE,
  MAX_GROUPS,
  MIN_DICE,
  canHold,
  diceCount,
  diceOf,
  dieName,
  faceRange,
  groupOf,
  groupsOf,
  hasTotal,
  isLoaded,
  isSuccessRoll,
  normalizeSpec,
  rangeOf,
  roll,
  rollHeld,
  rollMany,
  setOf,
  sidesOf,
  specOf,
  type DiceGroup,
  type DieRoll,
  type DieSides,
  type Keep,
  type Roll,
  type RollSpec,
  type Sides,
} from "../dice.ts";
import { HISTORY_LIMIT, addToHistory, loadHistory, saveHistory, type StorageLike } from "../history.ts";
import { checkNotation, formatNotation } from "../notation.ts";
import { chanceExactly, distributionHolding, expectedTotal, luckOf, type Distribution } from "../odds.ts";
import { cryptoSource, newSeed, seededSource, type RandomSource } from "../random.ts";
import { loadSets, makeSet, readSet, setQuery, storeSets, withSet, withoutSet, type DiceSet } from "../sets.ts";
import { readShared, readSharedMany, shareQuery, shareQueryMany } from "../share.ts";
import { getPreset, presetSpec, readPreset, type Preset } from "../games/presets.ts";
import { formulaText, fromJSON, toCSV, toJSON, toText } from "../export.ts";
import { gamesPanel, type GamesState } from "./games.ts";
import { h, refill, s } from "./dom.ts";
import { dieFace, dieIcon, faceText } from "./faces.ts";
import { morePanel, type MoreState } from "./more.ts";
import { historyPanel, oddsPanel, percent, statsPanel, type RealDie } from "./panels.ts";
import { createRollSound, type PlaySound, type RollSound } from "./sound.ts";
import { clothVars, isCloth, type Cloth } from "./cloth.ts";
import { injectStyle } from "./style.ts";
import { REFUSALS, STRINGS, fillIn, type RollerStrings } from "./strings.ts";

/** Everything a tray can be told when it is mounted. All of it is optional. */
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

/** How much of the tray is drawn: the felt alone, the felt and the choice of dice, or all of it. */
export type RollerSize = "small" | "medium" | "large";

/** What `mountRoller` hands back: the tray, driven from code. */
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
  /** Take the tray out of the page and stop its timers and its sound. */
  destroy(): void;
};

type Tab = "history" | "stats" | "odds";

/** A pleasant set of faces for a tray nobody has rolled yet. */
const RESTING = [5, 3, 6, 2, 4, 1, 6, 3, 5, 2];
const RESTING_FATE = [1, 0, -1, 1, 0, 1, -1, 0, 1, -1];

/** A speaker, with waves when the sound is on and a cross when it is off. */
function speaker(on: boolean): SVGElement {
  return s(
    "svg",
    { viewBox: "0 0 24 24", width: 20, height: 20, fill: "none", stroke: "currentColor", "stroke-width": 2, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true" },
    s("path", { d: "M4 9.5h3.5L12 6v12l-4.5-3.5H4z", fill: "currentColor" }),
    s("path", { d: on ? "M15.5 9.5a3.5 3.5 0 0 1 0 5M18 7a7 7 0 0 1 0 10" : "M16 9.5l5 5M21 9.5l-5 5" }),
  );
}

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
 */
export function mountRoller(target: HTMLElement, options: RollerOptions = {}): RollerHandle {
  const doc = target.ownerDocument;
  const win = doc.defaultView;
  injectStyle(doc);
  const wordsFor = (tag: string): RollerStrings => ({ ...(tag.toLowerCase().startsWith("ja") ? STRINGS.ja : STRINGS.en), ...options.strings });
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
  let spec = normalizeSpec(shared?.spec ?? (linkedSpec?.ok === true ? linkedSpec.spec : null) ?? (linkedGame === undefined ? null : presetSpec(linkedGame)) ?? options.spec ?? DEFAULT_SPEC);
  /** The game the rolls are being read as, when one is chosen. */
  let game: Preset | null = linkedGame ?? null;
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

  const root = h("div", { class: "kk-root", "data-wide": String(options.wide === true && (options.size ?? "large") === "large"), "data-size": options.size === "small" || options.size === "medium" ? options.size : "large", "data-testid": "korokoro" });
  const wear = (cloth: string | undefined) => {
    for (const [name, value] of Object.entries({ ...clothVars(cloth), ...(options.theme ?? {}) })) root.style.setProperty(name, value);
    root.dataset.cloth = isCloth(cloth) ? cloth : "green";
  };
  wear(options.cloth);
  const controls = h("div", { class: "kk-controls" });
  // The felt is the picture; the tray is the button that fills it. The dice sit over the button, so one that can be held is a button of its own.
  const tray = h("button", { type: "button", class: "kk-tray", "data-testid": "kk-tray" });
  const diceBox = h("div", { class: "kk-dice" });
  const hint = h("span", { class: "kk-hint" });
  const mute = h("button", { type: "button", class: "kk-mute", "data-testid": "kk-mute" });
  const release = h("button", { type: "button", class: "kk-release", "data-testid": "kk-release", hidden: true }, t.releaseAll);
  const felt = h("div", { class: "kk-felt", "data-testid": "kk-felt" }, tray, diceBox, hint, release, hasSound ? mute : null);
  const result = h("div", { class: "kk-result", "aria-live": "polite", "data-testid": "kk-result" });
  const panels = h("div", { class: "kk-panels" });
  // What is about to be rolled, said aloud as it changes.
  const said = h("div", { class: "kk-sr", "aria-live": "polite", "data-testid": "kk-said" });
  // The felt first: on a phone it sits under the thumb, and the choices wait below it.
  root.append(felt, result, controls, panels, said);
  target.replaceChildren(root);

  function later(fn: () => void, ms: number) {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  }

  function segment<T extends string | number>(
    label: string,
    values: readonly T[],
    chosen: T | null,
    name: (v: T) => Node | string,
    pick: (v: T) => void,
    testId: string,
    dimmed: (v: T) => boolean = () => false,
    last: HTMLElement | null = null,
    inPool: (v: T) => boolean = () => false,
  ) {
    return h(
      "div",
      { class: "kk-row" },
      h("span", { class: "kk-label", "data-testid": `${testId}-label` }, label),
      h(
        "div",
        { class: "kk-seg", role: "group", "aria-label": label, "data-testid": testId },
        ...values.map((v) => {
          const button = h("button", { type: "button", "aria-pressed": String(v === chosen), "data-value": String(v), "data-in": inPool(v) ? "true" : null, disabled: dimmed(v) }, name(v));
          button.addEventListener("click", () => pick(v));
          return button;
        }),
        last,
      ),
    );
  }

  const notation = () => (empty ? "" : formatNotation(spec));
  const kinds = (): DiceGroup[] => (empty ? [] : groupsOf(spec));
  /** The plain die of a size, as a kind: what a die button stands for. */
  const plainDie = (sides: Sides): DiceGroup => ({ count: 1, sides, keep: "all" });

  /** The spec changed: nothing is held any more, and the target follows the new average. */
  function settle(before: string) {
    if (notation() !== before) {
      goal = Math.round(expectedTotal(spec));
      held = [];
    }
    showingShared = false;
    render();
  }

  /** The pool, set from its kinds. The kind last touched stays lit, found again by its sides. */
  function setKinds(next: DiceGroup[], touched: string | null) {
    const before = notation();
    empty = next.length === 0;
    if (!empty) spec = specOf(next, spec.modifier);
    const found = touched === null ? -1 : groupsOf(spec).findIndex((g) => dieName(g) === touched);
    lit = empty ? 0 : found >= 0 ? found : Math.min(lit, groupsOf(spec).length - 1);
    settle(before);
  }

  /**
   * A change to one part keeps the rest. A whole spec (the dice, the bonus and
   * what is kept, all given) replaces everything, so typing `4d6dl1` after
   * `3d6!` does not leave the dice exploding.
   */
  function changeSpec(next: Partial<RollSpec>) {
    const before = notation();
    const whole = next.count !== undefined && next.sides !== undefined && next.modifier !== undefined && next.keep !== undefined;
    // The dice set from outside (typed, or by the page) are a choice; the bonus alone is not.
    if (whole || next.count !== undefined || next.sides !== undefined || next.more !== undefined) suggested = false;
    spec = normalizeSpec(whole ? next : { ...spec, ...next });
    empty = false;
    lit = whole ? 0 : Math.min(lit, groupsOf(spec).length - 1);
    settle(before);
  }

  /** A change to the kind that is lit: its count, or what it keeps. */
  function changeLit(next: Partial<DiceGroup>) {
    const all = kinds();
    const mine = all[lit];
    if (mine === undefined) return;
    if (next.count !== undefined) suggested = false;
    all[lit] = { ...mine, ...next };
    setKinds(all, dieName(mine));
  }

  /**
   * One more die of a kind: on the kind already in the pool, or as a new kind.
   * On the dice the tray opened with, a different kind takes their place, and
   * the same kind is simply one more of them.
   */
  function addDie(die: DiceGroup, count = 1) {
    const name = dieName(die);
    // A formula is not added to by a tap: the die tapped starts a new roll, as it does on the dice the tray opened with.
    const all = spec.math !== undefined || (suggested && !kinds().some((g) => dieName(g) === name)) ? [] : kinds();
    suggested = false;
    const at = all.findIndex((g) => dieName(g) === name);
    // Never past the limits: the buttons dim there, and a die made or loaded below is held to them too.
    const room = MAX_DICE - all.reduce((sum, g) => sum + g.count, 0);
    const adding = Math.min(count, room);
    if (adding < 1 || (at < 0 && all.length >= MAX_GROUPS)) return false;
    if (at >= 0) all[at] = { ...(all[at] as DiceGroup), count: (all[at] as DiceGroup).count + adding };
    else all.push({ ...die, count: adding, keep: "all" });
    setKinds(all, name);
    return true;
  }

  /** One die fewer of a kind; its last die takes the kind out of the pool. */
  function takeOne(index: number) {
    const all = kinds();
    const mine = all[index];
    if (mine === undefined) return;
    suggested = false;
    if (mine.count > 1) all[index] = { ...mine, count: mine.count - 1 };
    else all.splice(index, 1);
    setKinds(all, mine.count > 1 ? dieName(mine) : null);
  }

  function renderControls() {
    const all = kinds();
    // A roll written as a formula is changed where it was written: the buttons cannot take a die out of the middle of it.
    const formula = !empty && spec.math !== undefined;
    const total = all.reduce((sum, g) => sum + g.count, 0);
    const mine = all[lit];
    const room = MAX_DICE - total;
    const full = room < 1;
    const counts = Array.from({ length: MAX_DICE - MIN_DICE + 1 }, (_, i) => i + MIN_DICE);
    const minus = h("button", { type: "button", "aria-label": `${t.modifier} −1`, "data-testid": "kk-mod-down", disabled: formula }, "−");
    const plus = h("button", { type: "button", "aria-label": `${t.modifier} +1`, "data-testid": "kk-mod-up", disabled: formula }, "+");
    minus.addEventListener("click", () => changeSpec({ modifier: spec.modifier - 1 }));
    plus.addEventListener("click", () => changeSpec({ modifier: spec.modifier + 1 }));
    const mod = spec.modifier > 0 ? `+${spec.modifier}` : String(spec.modifier);

    const input = h("input", {
      type: "text",
      value: notation(),
      "aria-label": t.notation,
      placeholder: t.notationHint,
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
      if (input.value.trim() === "" && empty) return;
      const read = checkNotation(input.value);
      if (!read.ok) {
        input.setAttribute("aria-invalid", "true");
        error.textContent = fillIn(t[REFUSALS[read.problem]], { part: read.part });
        return;
      }
      // Dice typed by hand are their own roll, not a game's.
      game = null;
      changeSpec(read.spec);
    };
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") apply();
    });
    input.addEventListener("change", apply);

    const seeded = seed !== null;
    const seedInput = h("input", { type: "text", class: "kk-field", value: seed ?? "", "aria-label": t.seeded, "data-testid": "kk-seed", autocapitalize: "none", autocorrect: "off", spellcheck: "false" });
    seedInput.addEventListener("change", () => useSeed(seedInput.value.trim() || newSeed()));
    const fresh = h("button", { type: "button", class: "kk-link" }, t.newSeed);
    fresh.addEventListener("click", () => useSeed(newSeed()));

    // The pool: one chip for each kind of dice, and a tap on a chip takes one die of it away.
    const chips = all.map((group, index) => {
      const text = formatNotation(specOf([group]));
      const chip = h(
        "button",
        { type: "button", class: "kk-chip", "data-testid": "kk-chip", "data-value": dieName(group).slice(1), "data-lit": String(index === lit), "data-suggested": String(suggested), "aria-label": formula ? text : fillIn(t.takeOne, { die: dieName(group), n: group.count }), title: text, disabled: formula },
        h("span", {}, text),
        h("i", { "aria-hidden": "true" }, "−"),
      );
      chip.addEventListener("click", () => takeOne(index));
      return chip;
    });
    const clear = h("button", { type: "button", class: "kk-clear", "data-testid": "kk-clear-pool", "aria-label": t.clearPoolLabel, disabled: empty }, t.clearPool);
    // Clear takes the bonus with the dice: nothing is left to roll.
    clear.addEventListener("click", () => {
      suggested = false;
      spec = { ...spec, modifier: 0 };
      game = null;
      setKinds([], null);
    });

    // A button that would take the roll past a limit is dimmed, and the row's label says which limit.
    const allKinds = all.length >= MAX_GROUPS;
    const inRoll = (sides: Sides) => all.some((g) => dieName(g) === dieName(plainDie(sides)));
    const cannotAdd = (sides: Sides) => !formula && (full || (allKinds && !inRoll(sides)));
    // While the dice are only suggested, a tap chooses; after that, it adds. The label says which.
    const addLabel = formula ? t.choose : full ? fillIn(t.limitDice, { n: MAX_DICE }) : allKinds ? fillIn(t.limitKinds, { n: MAX_GROUPS }) : suggested ? t.choose : t.add;

    refill(controls,
      h("div", { class: "kk-row" }, h("span", { class: "kk-label" }, t.pool), h("div", { class: "kk-pool", role: "group", "aria-label": t.pool, "data-testid": "kk-pool", "data-suggested": String(suggested) }, ...chips)),
      segment(
        all.length > 1 && mine !== undefined ? dieName(mine) : t.dice,
        counts,
        mine?.count ?? null,
        (n) => String(n),
        (n) => changeLit({ count: n }),
        "kk-count",
        (n) => formula || mine === undefined || n > mine.count + room,
      ),
      // The buttons are the dice a table owns; any other die is typed as notation, and then no button is lit.
      segment<Sides>(
        addLabel,
        DIE_SIDES,
        // A loaded or custom die lights no button: the buttons are the fair dice.
        mine !== undefined && mine.weights === undefined && mine.faces === undefined ? mine.sides : null,
        (n) => h("span", { style: "display:inline-flex;align-items:center;gap:4px" }, dieIcon(n as DieSides), `d${n}`),
        (n) => void addDie(plainDie(n)),
        "kk-sides",
        cannotAdd,
        clear,
        inRoll,
      ),
      h(
        "div",
        { class: "kk-row" },
        h("span", { class: "kk-label" }, t.modifier),
        h("div", { class: "kk-stepper" }, minus, h("output", { "data-testid": "kk-mod" }, mod), plus),
        h("span", { class: "kk-notation" }, input),
        error,
        formula ? h("span", { class: "kk-fine kk-formula", "data-testid": "kk-formula" }, t.formula) : null,
      ),
      // Always there, so the rows below never move; dimmed while there is one die or none to choose among.
      segment<Keep>(
        t.keep,
        ["all", "highest", "lowest"],
        mine === undefined || (mine.keepCount ?? 1) > 1 ? null : mine.keep,
        (k) => (k === "all" ? t.keepAll : k === "highest" ? t.keepHighest : t.keepLowest),
        (k) => changeLit({ keep: k, keepCount: 1 }),
        "kk-keep",
        (k) => formula || mine === undefined || (mine.count < 2 && k !== "all"),
      ),
      h(
        "details",
        { class: "kk-settings", open: seeded },
        h("summary", {}, `${t.randomness}: ${seeded ? `${t.seeded} (${seed})` : t.fair}`),
        segment(t.randomness, ["fair", "seeded"] as const, seeded ? "seeded" : "fair", (m) => (m === "fair" ? t.fair : t.seeded), (m) => (m === "fair" ? useSeed(null) : useSeed(seed ?? newSeed())), "kk-mode"),
        h("p", {}, seeded ? t.seededHint : t.fairHint),
        seeded ? h("div", { class: "kk-row" }, seedInput, fresh) : null,
      ),
      // The tray's own language chooser, for a page that asks for one: quiet, and last but for what is one level down.
      options.languageChooser === true
        ? segment(t.language, ["en", "ja"] as const, locale.toLowerCase().startsWith("ja") ? "ja" : "en", (l) => (l === "en" ? "English" : "日本語"), (l) => setLocale(l, true), "kk-language")
        : null,
      gamesPanel(gamesState, game, japanese(), t, chooseGame, () => {
        game = null;
        render();
      }),
      morePanel(more, sets, !empty, spec.times ?? 1, TRAY_TIMES, t, {
        times(n) {
          changeSpec({ times: n });
        },
        add(text) {
          const read = checkNotation(text);
          if (!read.ok) return fillIn(t[REFUSALS[read.problem]], { part: read.part });
          // A die made or picked here joins the roll like a tapped one: every kind in what was typed, as many as there is room for.
          for (const group of groupsOf(read.spec)) if (!addDie(group, group.count)) return fillIn(full ? t.limitDice : t.limitKinds, { n: full ? MAX_DICE : MAX_GROUPS });
          return null;
        },
        save(name) {
          const set = makeSet(name, spec);
          if (set === null) return;
          sets = withSet(sets, set);
          storageWorks = storeSets(storage, setsKey, sets) && storageWorks;
        },
        use(set) {
          const read = checkNotation(set.notation);
          game = null;
          if (read.ok) changeSpec(read.spec);
        },
        remove(set) {
          sets = withoutSet(sets, set.name);
          storeSets(storage, setsKey, sets);
          renderControls();
        },
        copy(set, button) {
          copyLink(linkTo(setQuery(set)), button);
        },
        redraw: renderControls,
      }),
    );
    const saying = empty ? t.addToRoll : fillIn(t.poolSays, { notation: notation() });
    if (said.textContent !== saying) said.textContent = saying;
  }

  /** The tray in another language. A choice made with the tray's own chooser is remembered on the device. */
  function setLocale(next: string, remember: boolean) {
    locale = next;
    t = wordsFor(next);
    if (remember) {
      try {
        storage?.setItem(languageKey, next);
      } catch {
        // Not remembered on a device that keeps nothing.
      }
    }
    release.textContent = t.releaseAll;
    renderMute();
    render();
  }

  /** Take up a game: its dice become the roll, and each roll is read the way the game reads it. */
  function chooseGame(preset: Preset) {
    game = preset;
    gameRolls = [];
    turn = 0;
    gamesState.open = false;
    changeSpec(presetSpec(preset));
  }

  function useSeed(next: string | null) {
    seed = next;
    source = next === null ? cryptoSource() : seededSource(next);
    render();
  }

  /** What a die is and what became of it, in words: "d6: 6, exploded". */
  function dieLabel(group: DiceGroup, die: DieRoll, isHeld: boolean): string {
    const words = [
      group.weights !== undefined ? t.dieLoaded : null,
      die.status === "dropped" ? t.dieDropped : die.status === "rerolled" ? t.dieRerolled : null,
      die.exploded ? t.dieExploded : null,
      die.counts === 1 ? t.dieSuccess : die.counts === -1 ? t.dieFailure : null,
      die.critical === "success" ? t.dieCritical : die.critical === "failure" ? t.dieFumble : null,
      isHeld ? t.held : null,
    ].filter((w) => w !== null);
    // A custom die is named by what it shows; its list of faces would be a mouthful.
    return `${group.faces !== undefined ? "" : `${dieName(group)}: `}${faceText(group, die.face)}${words.length > 0 ? `, ${words.join(", ")}` : ""}`;
  }

  /** One die on the felt. `hold` makes it a button that holds it; without, it is a picture and a tap goes through to the felt. */
  function dieElement(group: DiceGroup, die: DieRoll, index: number, first: boolean, hold: ((index: number) => void) | null = null): HTMLElement {
    const sides = group.sides;
    const kept = die.status === "kept";
    const isHeld = held[index] === true;
    // A kind with marks of its own (cs, cf) is marked by them; otherwise a d20 shows its natural 20 and 1.
    const marked = group.critical !== undefined || group.fumble !== undefined;
    const hit = marked ? (die.critical === "success" ? "crit" : die.critical === "failure" ? "fumble" : null) : sides === 20 && group.faces === undefined && kept ? (die.face === 20 ? "crit" : die.face === 1 ? "fumble" : null) : null;
    const label = dieLabel(group, die, isHeld);
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
      title: kept && !die.exploded && group.weights === undefined && die.counts === undefined && die.critical === undefined ? null : label,
    };
    if (hold === null) return h("span", attrs, dieFace(group, die.face, label));
    const button = h("button", { ...attrs, type: "button", "aria-pressed": String(isHeld), "data-tag": t.held }, dieFace(group, die.face, label));
    button.addEventListener("click", () => hold(index));
    return button;
  }

  /** A face to show while a die tumbles. It is for show: the roll was made before anything moved. */
  function randomFace(group: DiceGroup): number {
    const { low, high } = group.faces !== undefined ? { low: 1, high: group.faces.length } : faceRange(group.sides);
    return low + Math.floor(Math.random() * (high - low + 1));
  }

  /** The pool at rest, before it is thrown: each kind's dice in its own shape, showing pleasant faces. */
  function restingDice(): DieRoll[] {
    const all = kinds();
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

  /** The roll on the felt, when it is a roll of the pool as it stands now. */
  const showing = () => (current !== null && !empty && (showingShared || formatNotation(current.spec) === formatNotation(spec)) ? current : null);
  /** Whether the dice on the felt can be held: plain dice that have been thrown. */
  /** A game's turn of several rolls is over: the dice showing are its last. */
  const turnOver = () => game?.rolls !== undefined && turn >= game.rolls;
  const holdable = () => mayHold && !rolling && !showingShared && showing() !== null && canHold(spec) && (spec.times ?? 1) === 1 && !turnOver() && game?.hold !== false;
  const heldCount = () => held.filter(Boolean).length;

  function toggleHold(index: number) {
    const shown = showing();
    if (shown === null) return;
    if (held.length !== shown.faces.length) held = shown.faces.map(() => false);
    held[index] = held[index] !== true;
    goal = Math.round(expectedTotal(oddsNow()));
    renderTray();
    renderPanels();
  }

  /** The odds of what a tap on the felt would throw now: the pool's own, or with dice held, those of the dice still to roll. */
  function oddsNow(): RollSpec | Distribution {
    const shown = showing();
    return shown !== null && heldCount() > 0 && holdable() ? distributionHolding(spec, shown.faces, held) : spec;
  }

  function renderTray() {
    const shown = showing();
    const thrown = shown === null ? restingDice() : diceOf(shown);
    const from = shown?.spec ?? spec;
    const hold = holdable() ? toggleHold : null;
    const holding = hold !== null ? heldCount() : 0;
    tray.setAttribute("aria-label", empty ? t.addToRoll : fillIn(t.rollLabel, { notation: notation() }));
    tray.disabled = empty || (holding > 0 && holding === thrown.length);
    felt.setAttribute("data-rolling", String(rolling));
    diceBox.setAttribute("data-count", thrown.length > MAX_DICE ? "many" : String(thrown.length));
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
    diceBox.replaceChildren(...shownOrder.map(({ die, i }, at) => dieElement(groupOf(from, die), die, i, at > 0 && die.group !== shownOrder[at - 1]?.die.group, hold)));
    const words = empty
      ? t.addToRoll
      : current === null
        ? t.tapToRoll
        : (spec.times ?? 1) > 1
          ? fillIn(t.timesHold, { n: spec.times ?? 1 })
          : turnOver() && shown !== null
            ? fillIn(t.turnOver, { n: game?.rolls ?? 0 })
            : hold === null
              ? t.tapAgain
              : holding === 0
                ? game?.rolls !== undefined
                  ? fillIn(t.turnRoll, { a: turn, n: game.rolls })
                  : t.tapAgainHold
            : holding === thrown.length
              ? t.allHeld
              : fillIn(t.rollRest, { n: thrown.length - holding });
    // Space rolls from a keyboard; the key is shown only where there is room for it beside the shorter hints.
    refill(hint, words, empty || hold !== null || options.keyboard === false ? null : h("kbd", {}, "Space"));
    release.hidden = holding === 0;
  }

  /** The dice as a sum, the way it would be said: each kind together, a kind of several dice in brackets, a die that does not count struck through. */
  function sumLine(r: Roll): HTMLElement {
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
      const joiner = group.sides === "F" ? " " : group.success !== undefined || (group.faces !== undefined && group.faces.every((f) => f.value === undefined)) ? " · " : " + ";
      if (index > 0) line.append(" + ");
      const bracket = all.length > 1 && mine.length > 1;
      if (bracket) line.append("(");
      mine.forEach((die, i) => {
        if (i > 0) line.append(joiner);
        // A die worth something other than its face says both: 6→5 for a penetrating die, 1→2 for a raised one.
        const face = `${faceText(group, die.face)}${group.faces === undefined && die.value !== undefined ? `→${die.value}` : ""}`;
        if (die.status === "kept" && die.counts !== undefined) line.append(h(die.counts === 1 ? "b" : "i", { title: die.counts === 1 ? t.dieSuccess : t.dieFailure }, `${face}${die.exploded ? "!" : ""}${die.counts === 1 ? "✓" : "✗"}`));
        else if (die.status === "kept") line.append(`${face}${die.exploded ? "!" : ""}`);
        else line.append(h("s", { title: die.status === "rerolled" ? t.dieRerolled : t.dieDropped }, `${face}${die.status === "rerolled" ? "↻" : ""}`));
      });
      if (bracket) line.append(")");
    });
    if (r.spec.modifier !== 0) line.append(r.spec.modifier > 0 ? ` + ${r.spec.modifier}` : ` − ${-r.spec.modifier}`);
    return line;
  }

  /** The luck meter and the link as they will be once there is a roll, faint and still: the shape of a result before there is one. */
  function waiting(): HTMLElement[] {
    return [
      h("div", { class: "kk-luck", "data-waiting": "true", "aria-hidden": "true" }, h("div", { class: "kk-meter" })),
      h("div", { class: "kk-actions" }, h("button", { type: "button", class: "kk-link", disabled: true }, t.copyLink)),
    ];
  }

  /** A link to this page carrying a query. A share base that has a query of its own, such as a language, keeps it. */
  function linkTo(query: string): string {
    const base = options.shareBase ?? (win ? `${win.location.origin}${win.location.pathname}` : "");
    // A roll made as a game's is shared as that game's.
    return `${base}${base.includes("?") ? "&" : "?"}${query}${game === null ? "" : `&game=${game.id}`}`;
  }

  /** Put a link on the clipboard and say so on the button that asked; where there is no clipboard, show it to be copied by hand. */
  function copyLink(url: string, button: HTMLElement) {
    const was = button.textContent;
    const done = () => {
      button.textContent = t.copied;
      later(() => (button.textContent = was), 1800);
    };
    const clipboard = win?.navigator.clipboard;
    if (clipboard) clipboard.writeText(url).then(done, () => win?.prompt(t.copyLink, url));
    else win?.prompt(t.copyLink, url);
  }

  function renderResult() {
    if (rolling) {
      refill(result, h("div", { class: "kk-total" }, h("small", {}, t.rolling), "…"), h("div", { class: "kk-sum" }, "\u00a0"), ...waiting());
      return;
    }
    if (empty) {
      refill(result, h("div", { class: "kk-total", style: "opacity:.35" }, h("small", {}, t.pool), "–"), h("div", { class: "kk-sum" }, t.addToRoll), ...waiting());
      return;
    }
    if (current === null) {
      const { min, max } = rangeOf(spec);
      refill(result,
        h("div", { class: "kk-total", style: "opacity:.35" }, h("small", {}, formatNotation(spec)), "?"),
        h("div", { class: "kk-sum" }, `${t.expected} ${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(expectedTotal(spec))} · ${t.range} ${min}–${max}`),
        ...waiting(),
      );
      return;
    }
    const r = current;
    const thrown = diceOf(r);
    // A roll with dice held is judged against the dice that were thrown again, not against a fresh roll of them all.
    const against = r.held !== undefined ? distributionHolding(r.spec, r.faces, r.held) : r.spec;
    const luck = luckOf(against, r.total);
    const exact = chanceExactly(against, r.total);
    const badges: HTMLElement[] = [];
    if (showingShared) badges.push(h("span", { class: "kk-badge" }, t.shared));
    if (r.held !== undefined) badges.push(h("span", { class: "kk-badge" }, fillIn(t.heldBadge, { n: r.held.filter(Boolean).length })));
    // A natural is one d20 read on its own: the one kept, or the only one thrown.
    const twenties = thrown.filter((die) => die.status === "kept" && sidesOf(r.spec, die) === 20);
    const natural = twenties.length === 1 ? twenties[0]?.face : null;
    if (natural === 20) badges.push(h("span", { class: "kk-badge", "data-tone": "good" }, t.critical));
    if (natural === 1) badges.push(h("span", { class: "kk-badge", "data-tone": "bad" }, t.fumble));
    if (r.spec.more === undefined && r.faces.length > 1 && r.faces.length === diceCount(r.spec) && r.faces.every((f) => f === r.faces[0])) badges.push(h("span", { class: "kk-badge", "data-tone": "good" }, t.allMatch));

    const set = currentSet !== null && currentSet.at(-1) === r ? currentSet : null;
    const copy = h("button", { type: "button", class: "kk-link", "data-testid": "kk-copy" }, t.copyLink);
    copy.addEventListener("click", () => copyLink(linkTo(set === null ? shareQuery(r) : shareQueryMany(set)), copy));
    // What the game makes of the roll, in the game's words.
    const reading = game === null ? null : readPreset(game, r, gameRolls.slice(0, -1), japanese() ? "ja" : "en");
    const says = reading === null || reading.text === "" ? null : h("div", { class: "kk-reading", "data-tone": reading.tone, "data-testid": "kk-reading" }, reading.text);
    if (set !== null) {
      // A set: every roll on a line of its own, the highest and lowest marked, and what they all come to.
      const all = setOf(set);
      const lines = set.map((one, i) => {
        const mark = all.highest !== all.lowest && one.total === all.highest ? "highest" : all.highest !== all.lowest && one.total === all.lowest ? "lowest" : null;
        const line = sumLine(one);
        line.removeAttribute("data-testid");
        const words = game === null ? "" : readPreset(game, one, set.slice(0, i), japanese() ? "ja" : "en").text;
        return h("li", { "data-mark": mark, "data-testid": "kk-set-line" }, h("span", { class: "kk-set-n" }, String(i + 1)), line, h("b", {}, hasTotal(one.spec) ? String(one.total) : words), mark === null ? null : h("i", {}, mark === "highest" ? t.setHighest : t.setLowest));
      });
      refill(result,
        h("div", { class: "kk-total kk-words", "data-testid": "kk-total" }, h("small", {}, `${t.total} · ${formatNotation(r.spec)}`), set.map((one) => (hasTotal(one.spec) ? String(one.total) : diceOf(one).map((d) => d.label ?? String(d.face)).join(" "))).join(" · ")),
        h("ol", { class: "kk-set-list", tabindex: 0, "aria-label": fillIn(t.setRolls, { n: set.length }), "data-testid": "kk-set-list" }, ...lines),
        hasTotal(r.spec) ? h("div", { class: "kk-sum", "data-testid": "kk-set-sum" }, fillIn(t.setSum, { n: set.length, sum: all.sum })) : null,
        h("div", { class: "kk-actions" }, ...badges, copy),
      );
      return;
    }
    // Where the game's reading is the result, it takes the total's place.
    if (game !== null && !game.total && reading !== null && reading.text !== "") {
      refill(result,
        h("div", { class: "kk-total kk-words", "data-testid": "kk-total", "data-tone": reading.tone }, h("small", {}, `${japanese() ? game.nameJa : game.name} · ${formatNotation(r.spec)}`), h("span", { "data-testid": "kk-reading" }, reading.text)),
        r.faces.length > 1 ? sumLine(r) : h("div", { class: "kk-sum" }, "\u00a0"),
        (waiting()[0] as HTMLElement),
        h("div", { class: "kk-actions" }, ...badges, copy),
      );
      return;
    }
    // A loaded roll says so beside its total, whatever else it says.
    if (isLoaded(r.spec)) badges.unshift(h("span", { class: "kk-badge", "data-tone": "bad", "data-testid": "kk-loaded-badge" }, t.loadedBadge));
    // A roll of words is its words: there is no total to show, and no luck to measure.
    if (!hasTotal(r.spec)) {
      refill(result,
        h("div", { class: "kk-total kk-words", "data-testid": "kk-total" }, h("small", {}, `${t.result} · ${formatNotation(r.spec)}`), thrown.map((die) => die.label ?? String(die.face)).join(" · ")),
        h("div", { class: "kk-sum" }, "\u00a0"),
        (waiting()[0] as HTMLElement),
        h("div", { class: "kk-actions" }, ...badges, copy),
      );
      return;
    }
    refill(result,
      h("div", { class: "kk-total", "data-testid": "kk-total" }, h("small", {}, `${isSuccessRoll(r.spec) ? t.successes : t.total} · ${formatNotation(r.spec)}`), String(r.total)),
      r.faces.length > 1 || r.spec.modifier !== 0 || r.spec.math !== undefined ? sumLine(r) : null,
      says,
      h(
        "div",
        { class: "kk-luck" },
        h("div", { class: "kk-meter" }, h("i", { style: `left:${luck * 100}%` })),
        h("span", {}, `${fillIn(t.luckier, { percent: percent(luck, locale) })} · ${fillIn(t.exactly, { odds: exact > 0 ? new Intl.NumberFormat(locale, { maximumFractionDigits: exact > 0.1 ? 1 : 0 }).format(1 / exact) : "∞", total: r.total })}`),
      ),
      // The badges share the link's row, so a natural 20 does not push everything below it down.
      h("div", { class: "kk-actions" }, ...badges, copy),
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
      body.append(exportPanel());
      if (!storageWorks) body.append(h("p", { class: "kk-empty", style: "padding:0" }, t.savedNowhere));
    } else if (tab === "stats") {
      body.append(statsPanel(history, spec, kinds()[lit] ?? spec, t, locale, realDie));
    } else if (empty) {
      body.append(h("p", { class: "kk-empty" }, t.addToRoll));
    } else {
      const now = oddsNow();
      const holding = "probabilities" in now ? { odds: now, held: heldCount(), rest: restOf() } : null;
      body.append(oddsPanel(spec, goal, current, t, locale, (value) => (goal = value), holding, game, japanese() ? "ja" : "en"));
    }
    panels.replaceChildren(strip, body);
  }

  /** Hand the person a file to keep: a link to the text, clicked for them. */
  function save(name: string, type: string, text: string) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const link = h("a", { href: url, download: name, hidden: true });
    doc.body.append(link);
    link.click();
    link.remove();
    later(() => URL.revokeObjectURL(url), 1000);
  }

  /** One level down in the history: the rolls as a file, and a JSON export brought back in. */
  function exportPanel(): HTMLElement {
    const day = new Date().toISOString().slice(0, 10);
    const button = (words: string, id: string, act: () => void) => {
      const made = h("button", { type: "button", class: "kk-link", "data-testid": id, disabled: history.length === 0 }, words);
      made.addEventListener("click", act);
      return made;
    };
    const file = h("input", { type: "file", accept: "application/json,.json", class: "kk-file", "data-testid": "kk-import", "aria-label": t.importJson });
    const pick = h("label", { class: "kk-link kk-pick" }, t.importJson, file);
    file.addEventListener("change", () => {
      const chosen = file.files?.[0];
      if (chosen === undefined) return;
      void chosen.text().then((text) => {
        const read = fromJSON(text);
        if (read === null) exportSaid = t.importBad;
        else {
          // Rolls already here are not added twice; the rest join the history in the order they were thrown.
          const have = new Set(history.map((r) => r.id));
          const fresh = read.filter((r) => !have.has(r.id));
          exportSaid = fresh.length === 0 ? t.importNothing : fillIn(t.imported, { n: fresh.length });
          if (fresh.length > 0) {
            history = [...history, ...fresh].sort((a, b) => a.at - b.at).slice(-HISTORY_LIMIT);
            storageWorks = saveHistory(storage, storageKey, history);
          }
        }
        renderPanels();
      });
    });
    const details = h(
      "details",
      { class: "kk-settings", open: exportOpen, "data-testid": "kk-export" },
      h("summary", {}, t.exportTitle),
      h(
        "div",
        { class: "kk-actions" },
        button(t.exportCsv, "kk-export-csv", () => save(`korokoro-${day}.csv`, "text/csv;charset=utf-8", toCSV(history))),
        button(t.exportJson, "kk-export-json", () => save(`korokoro-${day}.json`, "application/json", toJSON(history, { stats: true }))),
        button(t.exportText, "kk-export-text", () => save(`korokoro-${day}.txt`, "text/plain;charset=utf-8", toText(history))),
        pick,
      ),
      h("p", { class: "kk-fine", role: "status", "data-testid": "kk-export-said" }, exportSaid === "" ? t.exportNote : exportSaid),
    );
    details.addEventListener("toggle", () => (exportOpen = details.open));
    return details;
  }

  /** The dice still to roll while some are held, as notation: `3d6` of a `5d6` with two held. */
  function restOf(): string {
    let at = 0;
    const rest: DiceGroup[] = [];
    for (const group of groupsOf(spec)) {
      let free = 0;
      for (let n = 0; n < group.count; n++, at++) if (held[at] !== true) free += 1;
      if (free > 0) rest.push({ ...group, count: free });
    }
    return rest.length === 0 ? "" : formatNotation(specOf(rest));
  }

  function renderMute() {
    mute.setAttribute("aria-pressed", String(!muted));
    mute.setAttribute("aria-label", muted ? t.soundOff : t.soundOn);
    mute.setAttribute("title", muted ? t.soundOff : t.soundOn);
    mute.replaceChildren(speaker(!muted));
  }

  /** The sound of a throw: the page's own if it gave one, else the recorded dice, fetched on the first throw that wants them. */
  function sound(dice: number, landings: number[]) {
    if (!hasSound || muted) return;
    try {
      if (options.playSound !== undefined) return options.playSound({ dice, ms: animationMs, landings });
      ownSound ??= createRollSound(win ?? undefined);
      ownSound.play({ dice, ms: animationMs, landings });
    } catch {
      // A sound that fails is no reason for the dice not to roll.
    }
  }

  function render() {
    renderControls();
    renderTray();
    renderResult();
    renderPanels();
  }

  function throwDice() {
    if (rolling || empty) return;
    const shown = showing();
    const keeping = shown !== null && holdable() && heldCount() > 0 ? held.slice(0, shown.faces.length) : null;
    // With every die held there is nothing to throw.
    if (keeping !== null && keeping.every(Boolean)) return;
    // The generator throws the dice here, before anything moves; the tumble and the sound only show what it threw.
    const many = (spec.times ?? 1) > 1 ? rollMany(spec, Math.min(TRAY_TIMES, spec.times ?? 1), source).rolls : null;
    const thrown = many !== null ? (many.at(-1) as Roll) : keeping !== null && shown !== null ? rollHeld(shown, keeping, source) : roll(spec, source);
    showingShared = false;
    const moving = thrown.faces.map((_, i) => keeping?.[i] !== true);
    const movers = moving.filter(Boolean).length;
    if (animationMs === 0) {
      sound(movers, moving.flatMap((m) => (m ? [0] : [])));
      return land(thrown, many);
    }
    // Each die starts a moment after the one before and tumbles for its own time; all are down by animationMs.
    const gap = movers < 2 ? 0 : Math.min(45, (animationMs * 0.22) / (movers - 1));
    let order = 0;
    const waits = moving.map((m) => (m ? Math.round(order++ * gap) : 0));
    const tumbles = waits.map((wait) => Math.round((animationMs - wait) * (0.86 + Math.random() * 0.14)));
    sound(movers, waits.flatMap((wait, i) => (moving[i] ? [wait + (tumbles[i] as number)] : [])));
    rolling = true;
    renderResult();
    felt.setAttribute("data-rolling", "true");
    const dice = diceOf(thrown);
    const shapes: [HTMLElement, DiceGroup][] = [];
    diceBox.setAttribute("data-count", dice.length > MAX_DICE ? "many" : String(dice.length));
    diceBox.replaceChildren(
      ...dice.map((die, i) => {
        const kind = groupOf(thrown.spec, die);
        const first = i > 0 && die.group !== dice[i - 1]?.group;
        // A held die stays where it is, showing its face.
        if (!moving[i]) return dieElement(kind, die, i, first);
        const el = dieElement(kind, { face: randomFace(kind), status: "kept", exploded: false, die: i }, i, first);
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
    refill(hint, " ");
    release.hidden = true;
    const flicker = () => {
      for (const [el, kind] of shapes) el.replaceChildren(dieFace(kind, randomFace(kind), t.rolling));
    };
    const step = Math.max(60, Math.round(animationMs / 9));
    for (let at = step; at < animationMs; at += step) later(flicker, at);
    later(() => land(thrown, many), animationMs + 60);
  }

  function land(thrown: Roll, many: Roll[] | null = null) {
    rolling = false;
    current = thrown;
    currentSet = many;
    // A roll with dice held is the next roll of the same turn; any other begins one.
    turn = thrown.held !== undefined ? turn + 1 : 1;
    gameRolls = [...gameRolls, ...(many ?? [thrown])].slice(-24);
    // What was held stays held for the next throw; a fresh roll holds nothing.
    held = thrown.held !== undefined ? [...thrown.held] : thrown.faces.map(() => false);
    for (const one of many ?? [thrown]) history = addToHistory(history, one);
    storageWorks = saveHistory(storage, storageKey, history);
    goal = Math.round(expectedTotal(oddsNow()));
    render();
    diceBox.querySelectorAll(".kk-die").forEach((el, i) => {
      if (thrown.held?.[i] !== true) el.classList.add("kk-land");
    });
    try {
      win?.navigator.vibrate?.(12);
    } catch {
      // A browser that refuses vibration refuses silently; so does this.
    }
    options.onRoll?.(thrown);
  }

  tray.addEventListener("click", throwDice);
  release.addEventListener("click", () => {
    held = held.map(() => false);
    goal = Math.round(expectedTotal(oddsNow()));
    renderTray();
    renderPanels();
  });
  mute.addEventListener("click", () => {
    muted = !muted;
    try {
      storage?.setItem(mutedKey, muted ? "1" : "0");
    } catch {
      // Not remembered on a device that keeps nothing; still muted for now.
    }
    renderMute();
  });
  renderMute();
  const onKey = (event: KeyboardEvent) => {
    if (event.key !== " " || event.defaultPrevented) return;
    const el = event.target as HTMLElement | null;
    if (el !== null && el !== doc.body && el !== root && !root.contains(el)) return;
    // A tray that leaves the page its Space rolls only from inside itself.
    if (options.keyboard === false && (el === null || !root.contains(el))) return;
    if (el?.closest("input, textarea, select, button, summary, [contenteditable]")) return;
    event.preventDefault();
    throwDice();
  };
  doc.addEventListener("keydown", onKey);
  render();

  return {
    roll: throwDice,
    history: () => history,
    setSpec: (next) => {
      // Dice set from outside are their own roll, not a game's.
      game = null;
      changeSpec(next);
    },
    setLocale: (next) => setLocale(next, false),
    setCloth: (next) => {
      // The theme's own --kk-felt, where given, still wins; otherwise the old cloth's colours are taken off first.
      for (const name of ["--kk-felt", "--kk-felt-deep", "--kk-felt-ink"]) root.style.removeProperty(name);
      wear(next);
    },
    destroy() {
      for (const id of timers) clearTimeout(id);
      doc.removeEventListener("keydown", onKey);
      ownSound?.close();
      target.replaceChildren();
    },
  };
}
