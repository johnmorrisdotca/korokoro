import type { Roll, RollSpec } from "./dice.ts";
import type { KorokoroDie } from "./elementDie.ts";
import { appearance, Base, booleanAttribute, writeAttribute } from "./elementShared.ts";
import { parseNotation } from "./notation.ts";
import { type Cloth, isCloth } from "./ui/cloth.ts";
import { mountRoller, type RollerHandle, type RollerOptions } from "./ui/mount.ts";

export { DIE_TAG, defineDie, KorokoroDie } from "./elementDie.ts";

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
const WATCHED = [
  "notation",
  "lang",
  "size",
  "wide",
  "sound",
  "hold",
  "placeholder",
  "keyboard",
  "language-chooser",
  "storage",
  "storage-key",
  "animation-ms",
  "share-base",
  "query",
  "cloth",
  "one-pip",
  "dice-war",
  "width",
  "theme",
  "label",
  "seed",
] as const;

/** The `<korokoro-roller>` element.
 * @example
 * ```ts
 * import { KorokoroRoller } from "@johnmorrisdotca/korokoro/element";
 * console.log(KorokoroRoller.observedAttributes.includes("lang")); // true
 * ```
 */
export class KorokoroRoller extends Base {
  get notation(): string | null {
    return this.getAttribute("notation");
  }
  set notation(value: string | number | null | undefined) {
    writeAttribute(this, "notation", value);
  }
  get size(): string | null {
    return this.getAttribute("size");
  }
  set size(value: string | number | null | undefined) {
    writeAttribute(this, "size", value);
  }
  get wide(): boolean {
    return booleanAttribute(this, "wide", false);
  }
  set wide(value: boolean | string | null | undefined) {
    writeAttribute(this, "wide", value, true);
  }
  get sound(): boolean {
    return booleanAttribute(this, "sound", true);
  }
  set sound(value: boolean | string | null | undefined) {
    writeAttribute(this, "sound", value, true);
  }
  get hold(): boolean {
    return booleanAttribute(this, "hold", true);
  }
  set hold(value: boolean | string | null | undefined) {
    writeAttribute(this, "hold", value, true);
  }
  get placeholder(): boolean {
    return booleanAttribute(this, "placeholder", true);
  }
  set placeholder(value: boolean | string | null | undefined) {
    writeAttribute(this, "placeholder", value, true);
  }
  get keyboard(): boolean {
    return booleanAttribute(this, "keyboard", true);
  }
  set keyboard(value: boolean | string | null | undefined) {
    writeAttribute(this, "keyboard", value, true);
  }
  get languageChooser(): boolean {
    return booleanAttribute(this, "language-chooser", false);
  }
  set languageChooser(value: boolean | string | null | undefined) {
    writeAttribute(this, "language-chooser", value, true);
  }
  get "language-chooser"(): boolean {
    return booleanAttribute(this, "language-chooser", false);
  }
  set "language-chooser"(value: boolean | string | null | undefined) {
    writeAttribute(this, "language-chooser", value, true);
  }
  get diceWar(): boolean {
    return booleanAttribute(this, "dice-war", false);
  }
  set diceWar(value: boolean | string | null | undefined) {
    writeAttribute(this, "dice-war", value, true);
  }
  get "dice-war"(): boolean {
    return booleanAttribute(this, "dice-war", false);
  }
  set "dice-war"(value: boolean | string | null | undefined) {
    writeAttribute(this, "dice-war", value, true);
  }
  get storage(): string | null {
    return this.getAttribute("storage");
  }
  set storage(value: string | number | null | undefined) {
    writeAttribute(this, "storage", value);
  }
  get storageKey(): string | null {
    return this.getAttribute("storage-key");
  }
  set storageKey(value: string | number | null | undefined) {
    writeAttribute(this, "storage-key", value);
  }
  get "storage-key"(): string | null {
    return this.getAttribute("storage-key");
  }
  set "storage-key"(value: string | number | null | undefined) {
    writeAttribute(this, "storage-key", value);
  }
  get animationMs(): string | null {
    return this.getAttribute("animation-ms");
  }
  set animationMs(value: string | number | null | undefined) {
    writeAttribute(this, "animation-ms", value);
  }
  get "animation-ms"(): string | null {
    return this.getAttribute("animation-ms");
  }
  set "animation-ms"(value: string | number | null | undefined) {
    writeAttribute(this, "animation-ms", value);
  }
  get shareBase(): string | null {
    return this.getAttribute("share-base");
  }
  set shareBase(value: string | number | null | undefined) {
    writeAttribute(this, "share-base", value);
  }
  get "share-base"(): string | null {
    return this.getAttribute("share-base");
  }
  set "share-base"(value: string | number | null | undefined) {
    writeAttribute(this, "share-base", value);
  }
  get query(): string | null {
    return this.getAttribute("query");
  }
  set query(value: string | number | null | undefined) {
    writeAttribute(this, "query", value);
  }
  get cloth(): string | null {
    return this.getAttribute("cloth");
  }
  set cloth(value: string | number | null | undefined) {
    writeAttribute(this, "cloth", value);
  }
  get onePip(): string | null {
    return this.getAttribute("one-pip");
  }
  set onePip(value: string | number | null | undefined) {
    writeAttribute(this, "one-pip", value);
  }
  get "one-pip"(): string | null {
    return this.getAttribute("one-pip");
  }
  set "one-pip"(value: string | number | null | undefined) {
    writeAttribute(this, "one-pip", value);
  }
  get width(): string | null {
    return this.getAttribute("width");
  }
  set width(value: string | number | null | undefined) {
    writeAttribute(this, "width", value);
  }
  get theme(): string | null {
    return this.getAttribute("theme");
  }
  set theme(value: string | number | null | undefined) {
    writeAttribute(this, "theme", value);
  }
  get label(): string | null {
    return this.getAttribute("label");
  }
  set label(value: string | number | null | undefined) {
    writeAttribute(this, "label", value);
  }
  get seed(): string | null {
    return this.getAttribute("seed");
  }
  set seed(value: string | number | null | undefined) {
    writeAttribute(this, "seed", value);
  }

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
    if (text("size") === "small" || text("size") === "medium" || text("size") === "large")
      made.size = text("size") as "small" | "medium" | "large";
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
