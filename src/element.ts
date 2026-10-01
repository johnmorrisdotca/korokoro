import type { Roll, RollSpec } from "./dice.ts";
import { parseNotation } from "./notation.ts";
import { isCloth, type Cloth } from "./ui/cloth.ts";
import { mountDie, type DieHandle, type DieOptions, type DieSize } from "./ui/die.ts";
import { seededSource } from "./random.ts";
import { isSides } from "./dice.ts";
import { mountRoller, type RollerHandle, type RollerOptions } from "./ui/mount.ts";

/**
 * The tray as a custom element, for any page and any framework:
 *
 *   <korokoro-roller notation="2d20kh1+5" wide></korokoro-roller>
 *
 * Call `defineRoller()` once to register it. The tray is drawn in the
 * element's own light DOM, so a page's CSS variables (`--kk-felt` and the
 * rest) theme it as they do a mounted tray. Each roll is a `korokoro-roll`
 * event whose `detail` is the roll.
 *
 * Attributes, all optional:
 *   notation         the dice showing at first, and again whenever it changes
 *   lang             "ja" for Japanese; anything else English. The page's own language when left out
 *   wide             tray and panels side by side on a wide screen
 *   cloth            the felt's cloth: "green" (unless said), "blue", "red", "black" or "wood"
 *   one-pip          the colour of a d6's one pip: "red" (unless said) or "black"
 *   size             "small" is the felt and the result alone; "medium" adds the choice of dice; "large", or left out, is everything
 *   sound="off"      no sound and no mute button
 *   hold="off"       dice are not held
 *   placeholder="off"   the opening dice are the user's own roll
 *   keyboard="off"   Space rolls only when the focus is inside the tray, and the page keeps it otherwise
 *   language-chooser    the tray's own choice of English or 日本語
 *   dice-war         Dice War among the games: a table of the person at the tray and computers (`diceWar` in the options)
 *   storage="none"   keep no history
 *   storage-key      the key the history is kept under
 *   animation-ms     the length of the tumble
 *   share-base       where shared links point
 *   query            a query string that may hold a shared roll or a seed, in place of the page's own
 *
 * Anything an attribute cannot carry (a theme, your own words, your own
 * sound) is set on the `options` property before the element joins the page,
 * or at any time, which mounts the tray afresh.
 */

/** The element's tag, unless another is asked for. */
export const ROLLER_TAG = "korokoro-roller";

/** The attributes the element watches. */
const WATCHED = ["notation", "lang", "size", "wide", "sound", "hold", "placeholder", "keyboard", "language-chooser", "storage", "storage-key", "animation-ms", "share-base", "query", "cloth", "one-pip", "dice-war"] as const;

// On a server there is no HTMLElement to extend: the class is still defined, so that importing this module never throws, and is simply never used.
const Base: typeof HTMLElement = typeof HTMLElement === "undefined" ? (class {} as unknown as typeof HTMLElement) : HTMLElement;

/** The `<korokoro-roller>` element. */
export class KorokoroRoller extends Base {
  static get observedAttributes(): readonly string[] {
    return WATCHED;
  }

  #roller: RollerHandle | null = null;
  #options: RollerOptions = {};

  /** Options an attribute cannot carry: a theme, words, a sound, a storage of your own. Setting them mounts the tray afresh. An attribute, where there is one, wins over the same option here. */
  get options(): RollerOptions {
    return this.#options;
  }
  set options(next: RollerOptions) {
    this.#options = { ...next };
    this.#remount();
  }

  /** Throw the dice showing, as a tap on the felt does. */
  roll(): void {
    this.#roller?.roll();
  }

  /** Every roll kept so far, oldest first. */
  get history(): readonly Roll[] {
    return this.#roller?.history() ?? [];
  }

  /** Change part of the dice, or all of them, as `RollerHandle.setSpec` does. */
  setSpec(spec: Partial<RollSpec>): void {
    this.#roller?.setSpec(spec);
  }

  connectedCallback(): void {
    if (this.style.display === "") this.style.display = "block";
    this.#remount();
  }

  disconnectedCallback(): void {
    this.#roller?.destroy();
    this.#roller = null;
  }

  attributeChangedCallback(name: string, before: string | null, now: string | null): void {
    if (this.#roller === null || before === now) return;
    // The dice, the language and the cloth change in place; anything else is a tray mounted afresh.
    if (name === "notation") {
      const spec = now === null ? null : parseNotation(now);
      if (spec !== null) this.#roller.setSpec(spec);
    } else if (name === "lang") this.#roller.setLocale(now ?? this.ownerDocument.documentElement.lang ?? "en");
    else if (name === "cloth") this.#roller.setCloth(isCloth(now) ? now : "green");
    else if (name === "one-pip") this.#roller.setOnePip(now === "black" ? "black" : "red");
    else this.#remount();
  }

  /** The tray's options as the attributes and the `options` property give them. */
  #read(): RollerOptions {
    const made: RollerOptions = { ...this.#options };
    const text = (name: string) => this.getAttribute(name);
    const off = (name: string) => ["off", "false", "no", "none", "0"].includes((text(name) ?? "").toLowerCase());
    const notation = text("notation");
    const spec = notation === null ? null : parseNotation(notation);
    if (spec !== null) made.spec = spec;
    if (text("lang") !== null) made.locale = text("lang") as string;
    if (this.hasAttribute("wide")) made.wide = !off("wide");
    if (text("size") === "small" || text("size") === "medium" || text("size") === "large") made.size = text("size") as "small" | "medium" | "large";
    if (this.hasAttribute("sound")) made.sound = !off("sound");
    if (this.hasAttribute("hold")) made.hold = !off("hold");
    if (this.hasAttribute("placeholder")) made.placeholder = !off("placeholder");
    if (this.hasAttribute("keyboard")) made.keyboard = !off("keyboard");
    if (this.hasAttribute("language-chooser")) made.languageChooser = !off("language-chooser");
    if (this.hasAttribute("dice-war")) made.diceWar = !off("dice-war");
    if (this.hasAttribute("storage") && off("storage")) made.storage = null;
    if (text("storage-key") !== null) made.storageKey = text("storage-key") as string;
    if (text("share-base") !== null) made.shareBase = text("share-base") as string;
    if (text("query") !== null) made.query = text("query") as string;
    if (isCloth(text("cloth"))) made.cloth = text("cloth") as Cloth;
    if (text("one-pip") === "black" || text("one-pip") === "red") made.onePip = text("one-pip") as "red" | "black";
    const ms = Number(text("animation-ms"));
    if (text("animation-ms") !== null && Number.isFinite(ms) && ms >= 0) made.animationMs = ms;
    const told = made.onRoll;
    made.onRoll = (roll) => {
      told?.(roll);
      this.dispatchEvent(new CustomEvent<Roll>("korokoro-roll", { detail: roll, bubbles: true, composed: true }));
    };
    return made;
  }

  #remount(): void {
    if (!this.isConnected) return;
    this.#roller?.destroy();
    this.#roller = mountRoller(this, this.#read());
  }
}

/**
 * Register the element, as `<korokoro-roller>` unless another tag is asked
 * for. Safe to call more than once, and does nothing where there are no
 * custom elements (on a server).
 */
export function defineRoller(tag: string = ROLLER_TAG): void {
  if (typeof customElements === "undefined" || customElements.get(tag) !== undefined) return;
  // A class is registered under one tag: a second tag is given a class of its own.
  customElements.define(tag, tag === ROLLER_TAG ? KorokoroRoller : class extends KorokoroRoller {});
}

/** The die's tag, unless another is asked for. */
export const DIE_TAG = "korokoro-die";

/** The attributes the die element watches. */
const DIE_WATCHED = ["sides", "face", "rollable", "size", "width", "one-pip", "lang", "seed", "sound", "animation-ms", "cloth"] as const;

/**
 * ONE DIE ON ITS OWN, as a custom element:
 *
 * ```html
 * <korokoro-die sides="20" size="large"></korokoro-die>
 * <korokoro-die sides="6" face="5" rollable="off"></korokoro-die>
 * ```
 *
 * The first is a d20 a tap rolls; the second a d6 that only shows a 5.
 *
 * Attributes, all optional: `sides` (2 to 1000, or `F`; 6 unless said),
 * `face` (the face showing), `rollable="off"` (a die that shows and does not
 * roll), `size` (`small`, `medium`, `large`) or `width` in pixels, `one-pip`
 * (`red` unless said, or `black`), `lang`, `seed` (the same throws every time),
 * `sound="on"` (silent unless asked), `animation-ms`, `cloth`. Each throw is a
 * `korokoro-die-roll` event whose `detail` is the face. Setting `face` shows
 * that face at once. `roll()` throws it from code; `options` takes what an
 * attribute cannot carry, as `<korokoro-roller>` does.
 */
export class KorokoroDie extends Base {
  static get observedAttributes(): readonly string[] {
    return DIE_WATCHED;
  }

  #die: DieHandle | null = null;
  #options: DieOptions = {};

  get options(): DieOptions {
    return this.#options;
  }
  set options(next: DieOptions) {
    this.#options = { ...next };
    this.#remount();
  }

  /** Throw the die, as a tap does. */
  roll(): void {
    this.#die?.roll();
  }

  /** The face showing. Setting it shows that face at once, as the `face` attribute does, and is how a framework that sets properties sets it. */
  get face(): number | null {
    return this.#die?.face ?? null;
  }
  set face(face: number | string | null) {
    if (face === null || face === undefined) this.removeAttribute("face");
    else this.setAttribute("face", String(face));
  }

  connectedCallback(): void {
    if (this.style.display === "") this.style.display = "inline-block";
    this.#remount();
  }

  disconnectedCallback(): void {
    this.#die?.destroy();
    this.#die = null;
  }

  attributeChangedCallback(name: string, before: string | null, now: string | null): void {
    if (this.#die === null || before === now) return;
    // The face, the pip and the language change in place; anything else is a die made afresh.
    if (name === "face") {
      const face = Number(now);
      if (now !== null && Number.isInteger(face)) this.#die.show(face);
    } else if (name === "one-pip") this.#die.setOnePip(now === "black" ? "black" : "red");
    else if (name === "lang") this.#die.setLocale(now ?? this.ownerDocument.documentElement.lang ?? "en");
    else if (name === "rollable") this.#die.setRollable(!["off", "false", "no", "none", "0"].includes((now ?? "").toLowerCase()));
    else this.#remount();
  }

  #read(): DieOptions {
    const made: DieOptions = { ...this.#options };
    const text = (name: string) => this.getAttribute(name);
    const off = (name: string) => ["off", "false", "no", "none", "0"].includes((text(name) ?? "").toLowerCase());
    const sides = text("sides") === "F" ? "F" : Number(text("sides"));
    if (text("sides") !== null && isSides(sides)) made.sides = sides;
    const face = Number(text("face"));
    if (text("face") !== null && Number.isInteger(face)) made.face = face;
    if (this.hasAttribute("rollable")) made.rollable = !off("rollable");
    const size = text("size");
    if (size === "small" || size === "medium" || size === "large") made.size = size as DieSize;
    const width = Number(text("width"));
    if (text("width") !== null && width > 0) made.width = width;
    if (text("one-pip") === "black" || text("one-pip") === "red") made.onePip = text("one-pip") as "red" | "black";
    if (text("lang") !== null) made.locale = text("lang") as string;
    if (text("seed") !== null) made.source = seededSource(text("seed") as string);
    if (this.hasAttribute("sound")) made.sound = !off("sound");
    const ms = Number(text("animation-ms"));
    if (text("animation-ms") !== null && Number.isFinite(ms) && ms >= 0) made.animationMs = ms;
    if (isCloth(text("cloth"))) made.cloth = text("cloth") as Cloth;
    const told = made.onRoll;
    made.onRoll = (landed) => {
      told?.(landed);
      this.dispatchEvent(new CustomEvent<number>("korokoro-die-roll", { detail: landed, bubbles: true, composed: true }));
    };
    return made;
  }

  #remount(): void {
    if (!this.isConnected) return;
    this.#die?.destroy();
    this.#die = mountDie(this, this.#read());
  }
}

/** Register `<korokoro-die>`, as that tag unless another is asked for. Safe to call more than once; does nothing where there are no custom elements. */
export function defineDie(tag: string = DIE_TAG): void {
  if (typeof customElements === "undefined" || customElements.get(tag) !== undefined) return;
  customElements.define(tag, tag === DIE_TAG ? KorokoroDie : class extends KorokoroDie {});
}

declare global {
  interface HTMLElementTagNameMap {
    "korokoro-die": KorokoroDie;
    "korokoro-roller": KorokoroRoller;
  }
  interface HTMLElementEventMap {
    "korokoro-die-roll": CustomEvent<number>;
    "korokoro-roll": CustomEvent<Roll>;
  }
}
