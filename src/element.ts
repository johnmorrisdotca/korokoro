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

/** The element's tag, unless another is asked for.
 * @example
 * ```ts
 * import { ROLLER_TAG } from "@johnmorrisdotca/korokoro/element";
 * console.log(typeof ROLLER_TAG); // string
 * ```
 */
export const ROLLER_TAG = "korokoro-roller";

/** The attributes the element watches. */
const WATCHED = ["notation", "lang", "size", "wide", "sound", "hold", "placeholder", "keyboard", "language-chooser", "storage", "storage-key", "animation-ms", "share-base", "query", "cloth", "one-pip", "dice-war", "width", "theme", "label", "seed"] as const;

// On a server there is no HTMLElement to extend: the class is still defined, so that importing this module never throws, and is simply never used.
const Base: typeof HTMLElement = typeof HTMLElement === "undefined" ? (class {} as unknown as typeof HTMLElement) : HTMLElement;


const booleanAttribute = (element: Element, name: string, fallback: boolean): boolean => {
  const value = element.getAttribute(name);
  return value === null ? fallback : !["off", "false", "no", "none", "0"].includes(value.trim().toLowerCase());
};
const writeAttribute = (element: Element, name: string, value: unknown, flag = false): void => {
  if (value === null || value === undefined) element.removeAttribute(name);
  else if (flag) element.setAttribute(name, value === false || ["off", "false", "no", "none", "0"].includes(String(value).trim().toLowerCase()) ? "false" : "");
  else element.setAttribute(name, String(value));
};
const widthStyles = new WeakMap<HTMLElement, [string, string]>();
const themedRoots = new WeakSet<HTMLElement>();
const appearance = (element: HTMLElement): void => {
  const width = Number(element.getAttribute("width"));
  if (Number.isFinite(width) && width > 0) {
    if (!widthStyles.has(element)) widthStyles.set(element, [element.style.width, element.style.maxWidth]);
    element.style.width = `${width}px`; element.style.maxWidth = "100%";
  } else if (widthStyles.has(element)) {
    const [before, maximum] = widthStyles.get(element)!;
    element.style.width = before; element.style.maxWidth = maximum; widthStyles.delete(element);
  }
  const root = element.querySelector<HTMLElement>(".kk-root");
  const theme = element.getAttribute("theme");
  if (root && (theme === "light" || theme === "dark")) { root.dataset.theme = theme; themedRoots.add(root); }
  else if (root && themedRoots.has(root)) { delete root.dataset.theme; themedRoots.delete(root); }
  const label = element.getAttribute("label");
  if (label !== null) {
    element.setAttribute("aria-label", label);
    if (!element.hasAttribute("role")) { element.setAttribute("role", "group"); element.dataset.kkLabelRole = "group"; }
    element.dataset.kkLabel = "set";
  } else if (element.dataset.kkLabel === "set") {
    element.removeAttribute("aria-label");
    if (element.dataset.kkLabelRole === "group") element.removeAttribute("role");
    delete element.dataset.kkLabel; delete element.dataset.kkLabelRole;
  }
};

/** The `<korokoro-roller>` element.
 * @example
 * ```ts
 * import { KorokoroRoller } from "@johnmorrisdotca/korokoro/element";
 * console.log(KorokoroRoller.observedAttributes.includes("lang")); // true
 * ```
 */
export class KorokoroRoller extends Base {
  get notation(): string | null { return this.getAttribute("notation"); }
  set notation(value: string | number | null | undefined) { writeAttribute(this, "notation", value); }
  get size(): string | null { return this.getAttribute("size"); }
  set size(value: string | number | null | undefined) { writeAttribute(this, "size", value); }
  get wide(): boolean { return booleanAttribute(this, "wide", false); }
  set wide(value: boolean | string | null | undefined) { writeAttribute(this, "wide", value, true); }
  get sound(): boolean { return booleanAttribute(this, "sound", true); }
  set sound(value: boolean | string | null | undefined) { writeAttribute(this, "sound", value, true); }
  get hold(): boolean { return booleanAttribute(this, "hold", true); }
  set hold(value: boolean | string | null | undefined) { writeAttribute(this, "hold", value, true); }
  get placeholder(): boolean { return booleanAttribute(this, "placeholder", true); }
  set placeholder(value: boolean | string | null | undefined) { writeAttribute(this, "placeholder", value, true); }
  get keyboard(): boolean { return booleanAttribute(this, "keyboard", true); }
  set keyboard(value: boolean | string | null | undefined) { writeAttribute(this, "keyboard", value, true); }
  get languageChooser(): boolean { return booleanAttribute(this, "language-chooser", false); }
  set languageChooser(value: boolean | string | null | undefined) { writeAttribute(this, "language-chooser", value, true); }
  get ["language-chooser"](): boolean { return booleanAttribute(this, "language-chooser", false); }
  set ["language-chooser"](value: boolean | string | null | undefined) { writeAttribute(this, "language-chooser", value, true); }
  get diceWar(): boolean { return booleanAttribute(this, "dice-war", false); }
  set diceWar(value: boolean | string | null | undefined) { writeAttribute(this, "dice-war", value, true); }
  get ["dice-war"](): boolean { return booleanAttribute(this, "dice-war", false); }
  set ["dice-war"](value: boolean | string | null | undefined) { writeAttribute(this, "dice-war", value, true); }
  get storage(): string | null { return this.getAttribute("storage"); }
  set storage(value: string | number | null | undefined) { writeAttribute(this, "storage", value); }
  get storageKey(): string | null { return this.getAttribute("storage-key"); }
  set storageKey(value: string | number | null | undefined) { writeAttribute(this, "storage-key", value); }
  get ["storage-key"](): string | null { return this.getAttribute("storage-key"); }
  set ["storage-key"](value: string | number | null | undefined) { writeAttribute(this, "storage-key", value); }
  get animationMs(): string | null { return this.getAttribute("animation-ms"); }
  set animationMs(value: string | number | null | undefined) { writeAttribute(this, "animation-ms", value); }
  get ["animation-ms"](): string | null { return this.getAttribute("animation-ms"); }
  set ["animation-ms"](value: string | number | null | undefined) { writeAttribute(this, "animation-ms", value); }
  get shareBase(): string | null { return this.getAttribute("share-base"); }
  set shareBase(value: string | number | null | undefined) { writeAttribute(this, "share-base", value); }
  get ["share-base"](): string | null { return this.getAttribute("share-base"); }
  set ["share-base"](value: string | number | null | undefined) { writeAttribute(this, "share-base", value); }
  get query(): string | null { return this.getAttribute("query"); }
  set query(value: string | number | null | undefined) { writeAttribute(this, "query", value); }
  get cloth(): string | null { return this.getAttribute("cloth"); }
  set cloth(value: string | number | null | undefined) { writeAttribute(this, "cloth", value); }
  get onePip(): string | null { return this.getAttribute("one-pip"); }
  set onePip(value: string | number | null | undefined) { writeAttribute(this, "one-pip", value); }
  get ["one-pip"](): string | null { return this.getAttribute("one-pip"); }
  set ["one-pip"](value: string | number | null | undefined) { writeAttribute(this, "one-pip", value); }
  get width(): string | null { return this.getAttribute("width"); }
  set width(value: string | number | null | undefined) { writeAttribute(this, "width", value); }
  get theme(): string | null { return this.getAttribute("theme"); }
  set theme(value: string | number | null | undefined) { writeAttribute(this, "theme", value); }
  get label(): string | null { return this.getAttribute("label"); }
  set label(value: string | number | null | undefined) { writeAttribute(this, "label", value); }
  get seed(): string | null { return this.getAttribute("seed"); }
  set seed(value: string | number | null | undefined) { writeAttribute(this, "seed", value); }

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
    if (["width", "theme", "label"].includes(name)) appearance(this);
    else if (name === "notation") {
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
    const off = (name: string) => ["off", "false", "no", "none", "0"].includes((text(name) ?? "").trim().toLowerCase());
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
    if (text("seed") !== null) made.query = `?seed=${encodeURIComponent(text("seed") as string)}`;
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
    appearance(this);
  }
}

/**
 * Register the element, as `<korokoro-roller>` unless another tag is asked
 * for. Safe to call more than once, and does nothing where there are no
 * custom elements (on a server).
 * @param tag - The custom tag name; omitted to use the package default.
 * @returns Nothing; existing definitions and server imports remain safe.
 * @example
 * ```ts
 * import { defineRoller } from "@johnmorrisdotca/korokoro/element";
 * defineRoller();
 * console.log(typeof defineRoller); // function
 * ```
 */
export function defineRoller(tag: string = ROLLER_TAG): void {
  if (typeof customElements === "undefined" || customElements.get(tag) !== undefined) return;
  // A class is registered under one tag: a second tag is given a class of its own.
  customElements.define(tag, tag === ROLLER_TAG ? KorokoroRoller : class extends KorokoroRoller {});
}

/** The die's tag, unless another is asked for.
 * @example
 * ```ts
 * import { DIE_TAG } from "@johnmorrisdotca/korokoro/element";
 * console.log(typeof DIE_TAG); // string
 * ```
 */
export const DIE_TAG = "korokoro-die";

/** The attributes the die element watches. */
const DIE_WATCHED = ["sides", "face", "rollable", "size", "width", "one-pip", "lang", "seed", "sound", "animation-ms", "cloth", "theme", "label"] as const;

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
 * @example
 * ```ts
 * import { KorokoroDie } from "@johnmorrisdotca/korokoro/element";
 * console.log(KorokoroDie.observedAttributes.includes("lang")); // true
 * ```
 */
export class KorokoroDie extends Base {
  get sides(): string | null { return this.getAttribute("sides"); }
  set sides(value: string | number | null | undefined) { writeAttribute(this, "sides", value); }
  get rollable(): boolean { return booleanAttribute(this, "rollable", true); }
  set rollable(value: boolean | string | null | undefined) { writeAttribute(this, "rollable", value, true); }
  get size(): string | null { return this.getAttribute("size"); }
  set size(value: string | number | null | undefined) { writeAttribute(this, "size", value); }
  get width(): string | null { return this.getAttribute("width"); }
  set width(value: string | number | null | undefined) { writeAttribute(this, "width", value); }
  get onePip(): string | null { return this.getAttribute("one-pip"); }
  set onePip(value: string | number | null | undefined) { writeAttribute(this, "one-pip", value); }
  get ["one-pip"](): string | null { return this.getAttribute("one-pip"); }
  set ["one-pip"](value: string | number | null | undefined) { writeAttribute(this, "one-pip", value); }
  get seed(): string | null { return this.getAttribute("seed"); }
  set seed(value: string | number | null | undefined) { writeAttribute(this, "seed", value); }
  get sound(): boolean { return booleanAttribute(this, "sound", false); }
  set sound(value: boolean | string | null | undefined) { writeAttribute(this, "sound", value, true); }
  get animationMs(): string | null { return this.getAttribute("animation-ms"); }
  set animationMs(value: string | number | null | undefined) { writeAttribute(this, "animation-ms", value); }
  get ["animation-ms"](): string | null { return this.getAttribute("animation-ms"); }
  set ["animation-ms"](value: string | number | null | undefined) { writeAttribute(this, "animation-ms", value); }
  get cloth(): string | null { return this.getAttribute("cloth"); }
  set cloth(value: string | number | null | undefined) { writeAttribute(this, "cloth", value); }
  get theme(): string | null { return this.getAttribute("theme"); }
  set theme(value: string | number | null | undefined) { writeAttribute(this, "theme", value); }
  get label(): string | null { return this.getAttribute("label"); }
  set label(value: string | number | null | undefined) { writeAttribute(this, "label", value); }

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
    if (["width", "theme", "label"].includes(name) && name !== "width") appearance(this);
    else if (name === "face") {
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
    const off = (name: string) => ["off", "false", "no", "none", "0"].includes((text(name) ?? "").trim().toLowerCase());
    const sides = text("sides") === "F" ? "F" : Number(text("sides"));
    if (text("sides") !== null && isSides(sides)) made.sides = sides;
    const face = Number(text("face"));
    if (text("face") !== null && Number.isInteger(face)) made.face = face;
    if (this.hasAttribute("rollable")) made.rollable = !off("rollable");
    const size = text("size");
    if (size === "small" || size === "medium" || size === "large") made.size = size as DieSize;
    const width = Number(text("width"));
    if (text("width") !== null && Number.isFinite(width) && width > 0) made.width = width;
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
    appearance(this);
  }
}

/** Register `<korokoro-die>`, as that tag unless another is asked for. Safe to call more than once; does nothing where there are no custom elements.
 * @param tag - The custom tag name; omitted to use the package default.
 * @returns Nothing; existing definitions and server imports remain safe.
 * @example
 * ```ts
 * import { defineDie } from "@johnmorrisdotca/korokoro/element";
 * defineDie();
 * console.log(typeof defineDie); // function
 * ```
 */
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
