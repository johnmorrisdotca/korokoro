import type { Roll, RollSpec } from "../dice.ts";
import type { StorageLike } from "../history.ts";
import type { Cloth } from "./cloth.ts";
import type { PlaySound } from "./sound.ts";
import type { RollerStrings } from "./strings.ts";

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

export function defaultStorage(): StorageLike | undefined {
  try {
    return globalThis.localStorage ?? undefined;
  } catch {
    return undefined;
  }
}
