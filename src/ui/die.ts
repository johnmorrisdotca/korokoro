import { faceRange, dieName, groupsOf, isSides, normalizeSpec, roll, type CustomFace, type DiceGroup, type Sides } from "../dice.ts";
import { cryptoSource, type RandomSource } from "../random.ts";
import { clothVars, isCloth, type Cloth } from "./cloth.ts";
import { h } from "./dom.ts";
import { dieFace, faceText } from "./faces.ts";
import { createRollSound, type PlaySound, type RollSound } from "./sound.ts";
import { STRINGS, fillIn, type RollerStrings } from "./strings.ts";
import { injectStyle } from "./style.ts";

/**
 * ONE DIE ON ITS OWN: nothing round it, no felt, no total, no panels. Two
 * kinds, by one option:
 *
 * - a die that rolls (`rollable`, the default): a button, a tap or Enter or
 *   Space throws it, it tumbles, lands on a face the generator chose before
 *   anything moved, and says so to a screen reader;
 * - a die that does not roll (`rollable: false`): a picture of one given
 *   face, set from code with `show`, for a page that wants to display a die.
 *
 * It keeps one steady square (`size` or `width`), the tumble moves only the
 * picture inside it, nothing on it can be selected, and a device that asks
 * for reduced motion gets no tumble.
 */

/** How big the die is drawn: 48, 96 or 150 pixels across. The same three names as everywhere in the family. */
export type DieSize = "small" | "medium" | "large";

/** The pixels of each size. */
export const DIE_SIZE_PX: Readonly<Record<DieSize, number>> = { small: 48, medium: 96, large: 150 };

/** What a lone die is told when it is made. Everything may be left out. */
export type DieOptions = {
  /** The kind of die: 2 to 1000 sides, or "F" for a Fate die. 6 when left out. */
  sides?: Sides;
  /** A die of your own: its faces, in order, in place of numbers. `sides` is then their count. */
  faces?: CustomFace[];
  /** The face showing at first, from 1 (from −1 for a Fate die). Left out, the highest face of the die, or a 6 on a d6. */
  face?: number;
  /** Whether a tap rolls it: true when left out. False is a die that only shows a face. */
  rollable?: boolean;
  /** `small`, `medium` (unless said) or `large`. `width` wins. */
  size?: DieSize;
  /** Its width in pixels, in place of `size`. */
  width?: number;
  /** The colour of a d6's one pip: `"red"` (unless said) or `"black"`. */
  onePip?: "red" | "black";
  /** A cloth's name, for the page's own colours to follow the tray's: only the ink and the die's edge on a felt. `theme` is laid over it. */
  cloth?: Cloth;
  /** CSS variables for the die, such as `{ "--kk-die": "#fff" }`. */
  theme?: Record<`--kk-${string}`, string>;
  /** "ja…" for Japanese, anything else English. The page's own language when left out. */
  locale?: string;
  /** Words to use instead of the built-in ones. */
  strings?: Partial<RollerStrings>;
  /** Where the throw comes from: `seededSource("table")` makes the same throws for everyone. Cryptographic when left out. */
  source?: RandomSource;
  /** The length of the tumble in milliseconds: 600 when left out. Reduced motion always skips it. */
  animationMs?: number;
  /** Whether a throw makes the sound of dice. Off when left out, because a die on its own is a thing on somebody's page, and a page that has not asked for noise gets none. */
  sound?: boolean;
  /** A sound of your own for each throw, in place of the recorded dice. Used only when `sound` is true. */
  playSound?: PlaySound;
  /** Called once the die has landed, with the face. */
  onRoll?: (face: number) => void;
};

/** What `mountDie` hands back. */
export type DieHandle = {
  /** The die's own element, a button if it rolls. */
  readonly element: HTMLElement;
  /** The face showing now (the one it will land on, while it tumbles). */
  readonly face: number;
  /** Whether it is tumbling. */
  readonly rolling: boolean;
  /** Throw it, as a tap does. Does nothing on a die that does not roll, or while it is tumbling. */
  roll(): void;
  /** Show a face at once, with no tumble. Faces outside the die are ignored. */
  show(face: number): void;
  /** Change the kind of die, showing its first face (or `face`). */
  setSides(sides: Sides, face?: number, faces?: CustomFace[]): void;
  /** Change the colour of a d6's one pip. */
  setOnePip(colour: "red" | "black"): void;
  /** Change the language. */
  setLocale(locale: string): void;
  /** Whether a tap rolls it, from now on. */
  setRollable(rollable: boolean): void;
  /** Take the die away, with every timer and listener. */
  destroy(): void;
};

const DEFAULT_TUMBLE_MS = 600;

/** The group for one die. */
function groupFor(sides: Sides, faces: CustomFace[] | undefined): DiceGroup {
  const spec = normalizeSpec({ count: 1, sides, faces });
  return groupsOf(spec)[0] as DiceGroup;
}

/** Whether a face is one this group's die has. */
function hasFace(group: DiceGroup, face: number): boolean {
  if (!Number.isInteger(face)) return false;
  const { low, high } = group.faces !== undefined ? { low: 1, high: group.faces.length } : faceRange(group.sides);
  return face >= low && face <= high;
}

/** The face a die shows when nobody has said: a six on a d6, the top face of any other. */
function restingFace(group: DiceGroup): number {
  return group.faces !== undefined ? 1 : faceRange(group.sides).high;
}

/**
 * Put one die in an element. Only the element is needed: a die of 6 sides
 * that rolls.
 *
 * @example
 * const die = mountDie(box, { sides: 20, size: "large", onRoll: (face) => console.log(face) });
 * die.roll();
 */
export function mountDie(target: HTMLElement, options: DieOptions = {}): DieHandle {
  const doc = target.ownerDocument;
  const win = doc.defaultView;
  injectStyle(doc);
  const reduced = win?.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  const animationMs = reduced ? 0 : Math.max(0, options.animationMs ?? DEFAULT_TUMBLE_MS);
  let locale = options.locale ?? doc.documentElement.lang ?? "en";
  const wordsFor = (tag: string): RollerStrings => ({ ...(tag.toLowerCase().startsWith("ja") ? STRINGS.ja : STRINGS.en), ...options.strings });
  let t = wordsFor(locale);
  let rollable = options.rollable !== false;
  const source = options.source ?? cryptoSource();
  const timers = new Set<ReturnType<typeof setTimeout>>();
  let sound: RollSound | null = null;
  let group = groupFor(isSides(options.sides) ? options.sides : 6, options.faces);
  let face = options.face !== undefined && hasFace(group, options.face) ? options.face : restingFace(group);
  let rolling = false;
  let element: HTMLElement | null = null;
  let destroyed = false;

  const px = options.width !== undefined && Number.isFinite(options.width) && options.width > 0 ? Math.round(options.width) : null;
  const root = h("div", { class: "kk-root kk-solo", "data-die-size": options.size ?? "medium", "data-testid": "kk-solo", "data-one-pip": options.onePip === "black" ? "black" : "red" });
  if (px !== null) root.style.setProperty("--kk-solo", `${px}px`);
  for (const [name, value] of Object.entries({ ...clothVars(options.cloth), ...(options.theme ?? {}) })) root.style.setProperty(name, value);
  if (isCloth(options.cloth)) root.dataset.cloth = options.cloth;
  // What a screen reader is told when it lands, and nothing more: the die itself is labelled with what it shows.
  const said = h("span", { class: "kk-sr", "aria-live": "polite", "data-testid": "kk-solo-said" });
  root.append(said);
  target.append(root);

  const name = () => (group.faces !== undefined ? "" : dieName(group));
  const label = () => fillIn(rollable ? t.dieAloneRollable : t.dieAlone, { die: name(), face: faceText(group, face) }).replace(/^[\s,、]+/, "");

  function draw(tumbling: boolean, shown: number = face) {
    const text = label();
    const attrs = { class: "kk-die", "data-face": String(face), "data-sides": String(group.sides), "data-testid": "kk-solo-die", "data-rolling": tumbling ? "true" : "false", "data-custom": group.faces !== undefined ? "true" : null };
    const picture = dieFace(group, shown, text);
    const next = rollable ? h("button", { ...attrs, type: "button", "aria-label": text }, picture) : h("span", { ...attrs, role: "img", "aria-label": text }, picture);
    // The svg labels itself too; the button's own label is the one that is read.
    picture.removeAttribute("role");
    picture.removeAttribute("aria-label");
    picture.setAttribute("aria-hidden", "true");
    if (rollable) next.addEventListener("click", throwIt);
    if (element === null) root.prepend(next);
    else element.replaceWith(next);
    element = next;
    root.dataset.rollable = String(rollable);
    return next;
  }

  const later = (fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timers.delete(id);
      fn();
    }, ms);
    timers.add(id);
  };

  function ring(): void {
    if (options.sound !== true) return;
    try {
      if (options.playSound !== undefined) return options.playSound({ dice: 1, ms: animationMs, landings: [animationMs] });
      sound ??= createRollSound(win ?? undefined);
      sound.play({ dice: 1, ms: animationMs, landings: [animationMs] });
    } catch {
      // A sound that fails is no reason for the die not to roll.
    }
  }

  function land(landed: number) {
    rolling = false;
    face = landed;
    draw(false);
    element?.classList.add("kk-land");
    said.textContent = fillIn(t.dieAloneRolled, { die: name(), face: faceText(group, landed) }).replace(/^[\s,、:]+/, "");
    options.onRoll?.(landed);
  }

  function throwIt() {
    if (rolling || !rollable || destroyed) return;
    // The generator throws the die here, before anything moves; the tumble and the sound only show what it threw.
    const thrown = roll({ count: 1, sides: group.sides, faces: group.faces } as Parameters<typeof roll>[0], source).faces[0] as number;
    ring();
    if (animationMs === 0) return land(thrown);
    rolling = true;
    const el = draw(true, face);
    el.classList.add("kk-tumble");
    el.setAttribute("aria-busy", "true");
    el.style.setProperty("--kk-x0", `${Math.round((Math.random() - 0.5) * 60)}px`);
    el.style.setProperty("--kk-y0", `${Math.round(-20 - Math.random() * 30)}px`);
    el.style.setProperty("--kk-r0", `${Math.round((Math.random() - 0.5) * 720)}deg`);
    el.style.setProperty("--kk-t", `${animationMs}ms`);
    // A show of faces while it tumbles, for show only: the throw is already made.
    const { low, high } = group.faces !== undefined ? { low: 1, high: group.faces.length } : faceRange(group.sides);
    const flicker = () => {
      if (element === null) return;
      const svg = dieFace(group, low + Math.floor(Math.random() * (high - low + 1)), "");
      svg.removeAttribute("role");
      svg.removeAttribute("aria-label");
      svg.setAttribute("aria-hidden", "true");
      element.replaceChildren(svg);
    };
    const step = Math.max(60, Math.round(animationMs / 9));
    for (let at = step; at < animationMs; at += step) later(flicker, at);
    later(() => land(thrown), animationMs + 30);
  }

  draw(false);

  return {
    get element() {
      return element as HTMLElement;
    },
    get face() {
      return face;
    },
    get rolling() {
      return rolling;
    },
    roll: throwIt,
    show(next) {
      if (!hasFace(group, next)) return;
      for (const id of timers) clearTimeout(id);
      timers.clear();
      rolling = false;
      face = next;
      draw(false);
    },
    setSides(sides, next, faces) {
      if (!isSides(sides)) return;
      for (const id of timers) clearTimeout(id);
      timers.clear();
      rolling = false;
      group = groupFor(sides, faces);
      face = next !== undefined && hasFace(group, next) ? next : restingFace(group);
      draw(false);
    },
    setOnePip(colour) {
      root.dataset.onePip = colour === "black" ? "black" : "red";
    },
    setLocale(next) {
      locale = next;
      t = wordsFor(locale);
      draw(rolling);
    },
    setRollable(next) {
      rollable = next;
      if (!rollable) {
        for (const id of timers) clearTimeout(id);
        timers.clear();
        rolling = false;
      }
      draw(false);
    },
    destroy() {
      destroyed = true;
      for (const id of timers) clearTimeout(id);
      timers.clear();
      sound?.close();
      root.remove();
    },
  };
}
