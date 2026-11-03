import {
  type CustomFace,
  compareText,
  type DiceGroup,
  MAX_FACE_VALUE,
  MAX_FACES,
  MAX_LABEL,
  MAX_LOADED_SIDES,
  MAX_ROLL_LABEL,
  MAX_WEIGHT,
  MIN_SIDES,
  type Sides,
} from "./dice.ts";

/** Characters a custom face's words may not hold: the ones notation is written with. */
const NOT_IN_A_LABEL = /[,[\]{}=#+]/;
/** A control character: a new line, a tab, a bell. None belongs in a face's words. */
const isControl = (text: string) =>
  [...text].some((c) => (c.codePointAt(0) as number) < 32 || c.codePointAt(0) === 127);

/** A custom die's faces, checked: the faces as given if every one is sound, or undefined.
 *
 * @param faces - Physical face values, in the order thrown.
 * @returns A custom die's faces, checked: the faces as given if every one is sound, or undefined.

 *
 * @example
 * ```ts
 * import { customFaces } from "@johnmorrisdotca/korokoro";
 * console.log(customFaces([{ label: "Hit", value: 1 }, { label: "Miss", value: 0 }])?.map((face) => face.label));
 * ```
 */
export function customFaces(faces: unknown): CustomFace[] | undefined {
  if (!Array.isArray(faces) || faces.length < MIN_SIDES || faces.length > MAX_FACES) return undefined;
  const sound: CustomFace[] = [];
  for (const given of faces as unknown[]) {
    if (typeof given !== "object" || given === null) return undefined;
    const { label, value, colour } = given as Record<string, unknown>;
    if (
      typeof label !== "string" ||
      label !== label.trim() ||
      label === "" ||
      [...label].length > MAX_LABEL ||
      NOT_IN_A_LABEL.test(label) ||
      isControl(label)
    )
      return undefined;
    const face: CustomFace = { label };
    if (value !== undefined) {
      if (typeof value !== "number" || !Number.isInteger(value) || Math.abs(value) > MAX_FACE_VALUE) return undefined;
      face.value = value;
    }
    if (colour !== undefined) {
      if (typeof colour !== "string" || !/^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i.test(colour)) return undefined;
      face.colour = colour.toLowerCase();
    }
    sound.push(face);
  }
  return sound;
}

/**
 * A loaded die's weights, checked and in lowest terms: one whole number from
 * 0 to `MAX_WEIGHT` for each face, at least two faces that can come up.
 * Undefined when they are not sound, and also when every face weighs the
 * same, which is a fair die and must not be called loaded.
 *
 * @param sides - A numbered die size or F for Fate dice.
 * @param weights - One integer weight per physical face.
 * @returns A loaded die's weights, checked and in lowest terms: one whole number from 0 to `MAX_WEIGHT` for each face, at least two faces that can come up. undefined when they are not sound, and also when every face weighs the same, which is a fair die and must not be called loaded.

 *
 * @example
 * ```ts
 * import { loadedWeights } from "@johnmorrisdotca/korokoro";
 * console.log(loadedWeights(6, [1, 1, 1, 1, 1, 3]));
 * ```
 */
export function loadedWeights(sides: Sides, weights: unknown): number[] | undefined {
  if (sides === "F" || sides > MAX_LOADED_SIDES || !Array.isArray(weights) || weights.length !== sides)
    return undefined;
  if (!weights.every((w) => typeof w === "number" && Number.isInteger(w) && w >= 0 && w <= MAX_WEIGHT))
    return undefined;
  const all = weights as number[];
  if (all.filter((w) => w > 0).length < 2) return undefined;
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const common = all.reduce(gcd);
  const least = all.map((w) => w / common);
  return least.every((w) => w === 1) ? undefined : least;
}

/** A roll's label, checked: a few words with no control characters and nothing notation is written with, or undefined.
 *
 * @param label - The optional short text that describes a roll.
 * @returns A roll's label, checked: a few words with no control characters and nothing notation is written with, or undefined.

 *
 * @example
 * ```ts
 * import { rollLabel } from "@johnmorrisdotca/korokoro";
 * console.log(rollLabel(" fire damage "));
 * ```
 */
export function rollLabel(label: unknown): string | undefined {
  if (typeof label !== "string") return undefined;
  const words = label.trim().replace(/\s+/g, " ");
  // Only digits is no label: `2d6 # 3` is somebody reaching for a repeat, which is written `3#2d6`.
  if (
    words === "" ||
    [...words].length > MAX_ROLL_LABEL ||
    isControl(words) ||
    /[#[\]{}]/.test(words) ||
    /^\d+$/.test(words)
  )
    return undefined;
  return words;
}

/** The modifiers of one kind of dice as notation writes them, in the one order they are written: `>=8f=1!`, `r<3kh3`. Two kinds with the same die and the same text here are the same dice under the same rules.
 *
 * @param group - One kind of dice and its rules.
 * @returns The modifiers of one kind of dice as notation writes them, in the one order they are written: `>=8f=1!`, `r<3kh3`. Two kinds with the same die and the same text here are the same dice under the same rules.

 *
 * @example
 * ```ts
 * import { rulesText } from "@johnmorrisdotca/korokoro";
 * import { parseNotation } from "@johnmorrisdotca/korokoro";
 * console.log(rulesText(parseNotation("4d6kh3")!));
 * ```
 */
export function rulesText(group: DiceGroup): string {
  const count =
    group.success === undefined
      ? ""
      : `${compareText(group.success)}${group.failure === undefined ? "" : `f${compareText(group.failure)}`}`;
  const kind =
    group.explodeKind === undefined
      ? "!"
      : group.explodeKind === "compound"
        ? "!!"
        : group.explodeKind === "penetrating"
          ? "!p"
          : "!!p";
  const explode =
    group.explode === true ? `${kind}${group.explodeWhen === undefined ? "" : compareText(group.explodeWhen)}` : "";
  const reroll =
    group.rerollUntil !== undefined
      ? `r<${group.rerollUntil + 1}`
      : group.reroll !== undefined
        ? `ro<${group.reroll + 1}`
        : group.rerollUntilWhen !== undefined
          ? `r${compareText(group.rerollUntilWhen)}`
          : group.rerollWhen !== undefined
            ? `ro${compareText(group.rerollWhen)}`
            : "";
  const keep = group.keep === "all" ? "" : `${group.keep === "highest" ? "kh" : "kl"}${group.keepCount ?? 1}`;
  const clamp = `${group.floor === undefined ? "" : `min${group.floor}`}${group.ceiling === undefined ? "" : `max${group.ceiling}`}`;
  const marks = `${group.critical === undefined ? "" : `cs${compareText(group.critical)}`}${group.fumble === undefined ? "" : `cf${compareText(group.fumble)}`}`;
  const sort = group.sort === undefined ? "" : group.sort === "ascending" ? "sa" : "sd";
  return `${count}${explode}${reroll}${keep}${clamp}${group.unique === true ? "u" : ""}${marks}${sort}`;
}
