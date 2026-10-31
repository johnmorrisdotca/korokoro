import { isSides } from "./dice.ts";
import { appearance, Base, booleanAttribute, writeAttribute } from "./elementShared.ts";
import { seededSource } from "./random.ts";
import { type Cloth, isCloth } from "./ui/cloth.ts";
import { type DieHandle, type DieOptions, type DieSize, mountDie } from "./ui/die.ts";

/** The die's tag, unless another is asked for.
 * @example
 * ```ts
 * import { DIE_TAG } from "@johnmorrisdotca/korokoro/element";
 * console.log(typeof DIE_TAG); // string
 * ```
 */
export const DIE_TAG = "korokoro-die";

/** The attributes the die element watches. */
const DIE_WATCHED = [
  "sides",
  "face",
  "rollable",
  "size",
  "width",
  "one-pip",
  "lang",
  "seed",
  "sound",
  "animation-ms",
  "cloth",
  "theme",
  "label",
] as const;

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
  get sides(): string | null {
    return this.getAttribute("sides");
  }
  set sides(value: string | number | null | undefined) {
    writeAttribute(this, "sides", value);
  }
  get rollable(): boolean {
    return booleanAttribute(this, "rollable", true);
  }
  set rollable(value: boolean | string | null | undefined) {
    writeAttribute(this, "rollable", value, true);
  }
  get size(): string | null {
    return this.getAttribute("size");
  }
  set size(value: string | number | null | undefined) {
    writeAttribute(this, "size", value);
  }
  get width(): string | null {
    return this.getAttribute("width");
  }
  set width(value: string | number | null | undefined) {
    writeAttribute(this, "width", value);
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
  get seed(): string | null {
    return this.getAttribute("seed");
  }
  set seed(value: string | number | null | undefined) {
    writeAttribute(this, "seed", value);
  }
  get sound(): boolean {
    return booleanAttribute(this, "sound", false);
  }
  set sound(value: boolean | string | null | undefined) {
    writeAttribute(this, "sound", value, true);
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
  get cloth(): string | null {
    return this.getAttribute("cloth");
  }
  set cloth(value: string | number | null | undefined) {
    writeAttribute(this, "cloth", value);
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
    else if (name === "rollable")
      this.#die.setRollable(!["off", "false", "no", "none", "0"].includes((now ?? "").toLowerCase()));
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
      this.dispatchEvent(
        new CustomEvent<number>("korokoro-die-roll", { detail: landed, bubbles: true, composed: true }),
      );
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
