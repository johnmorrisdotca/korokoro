import { isDieSides, type DiceGroup, type DieSides, type Sides } from "../dice.ts";
import { s } from "./dom.ts";

/**
 * Each die drawn as its own shape, the way it looks on the table: a d6 with
 * pips, the others as their silhouette with the number in the middle. The d30
 * is a rhombic triacontahedron seen face on: ten sides round the edge, and the
 * number on the diamond face that points at you. A Fate die is a cube marked
 * plus, minus or left blank. A die of any other size has no one shape, so it
 * is a plain eight-sided token that says what it is under its number.
 * Everything is in a 100 by 100 box and coloured by the tray's CSS variables.
 */
const OUTLINES: Record<DieSides, string> = {
  4: "M50 6 L95 88 Q96 92 91 92 L9 92 Q4 92 5 88 Z",
  6: "",
  8: "M50 3 L95 50 L50 97 L5 50 Z",
  10: "M50 3 L94 42 L50 97 L6 42 Z",
  12: "M50 4 L94 36 L77 90 L23 90 L6 36 Z",
  20: "M50 3 L91 26 L91 74 L50 97 L9 74 L9 26 Z",
  30: "M97 50 L88 22.4 L64.5 5.3 L35.5 5.3 L12 22.4 L3 50 L12 77.6 L35.5 94.7 L64.5 94.7 L88 77.6 Z",
  100: "M50 3 L94 42 L50 97 L6 42 Z",
};

/** Lines inside the outline that suggest the facets. */
const FACETS: Partial<Record<DieSides, string>> = {
  8: "M5 50 L95 50",
  10: "M6 42 L50 58 L94 42 M50 58 L50 97",
  100: "M6 42 L50 58 L94 42 M50 58 L50 97",
  12: "M50 22 L76 40 L66 72 L34 72 L24 40 Z",
  20: "M50 22 L78 70 L22 70 Z M50 3 L50 22 M91 74 L78 70 M9 74 L22 70",
  30: "M50 29 L84 50 L50 71 L16 50 Z M3 50 L16 50 M84 50 L97 50 M35.5 5.3 L50 29 L64.5 5.3 M35.5 94.7 L50 71 L64.5 94.7",
};

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [[28, 28], [72, 72]],
  3: [[28, 28], [50, 50], [72, 72]],
  4: [[28, 28], [72, 28], [28, 72], [72, 72]],
  5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
  6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]],
};

/** Where the number sits, so it is inside the widest part of the shape. */
const NUMBER_Y: Record<DieSides, number> = { 4: 68, 6: 50, 8: 52, 10: 44, 12: 52, 20: 54, 30: 50, 100: 44 };

const TOKEN = "M31 4 L69 4 L96 31 L96 69 L69 96 L31 96 L4 69 L4 31 Z";

/** What a face reads as: a custom die's words, a Fate die's sign, every other die its number. */
export function faceText(group: DiceGroup, face: number): string {
  const custom = group.faces?.[face - 1];
  if (custom !== undefined) return custom.label;
  if (group.sides !== "F") return String(face);
  return face > 0 ? "+" : face < 0 ? "−" : "0";
}

/** How large a custom face's words are drawn, by the longest line of them. */
function wordSize(longest: number): number {
  return longest <= 1 ? 40 : longest === 2 ? 34 : longest === 3 ? 28 : longest === 4 ? 23 : longest <= 6 ? 17 : longest <= 8 ? 13.5 : longest <= 11 ? 10.5 : 8.5;
}

/** Dark ink or light, whichever reads on a colour given as #rgb or #rrggbb. */
function inkOn(colour: string): string {
  const hex = colour.length === 4 ? [...colour.slice(1)].map((c) => c + c).join("") : colour.slice(1);
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? "#1f2320" : "#ffffff";
}

/** A custom face: a plain tile in the face's colour, with its words, on two lines where they are long and have a space to break at. */
function customFace(svg: SVGElement, label: string, colour: string | undefined) {
  const body = s("rect", { x: 4, y: 4, width: 92, height: 92, rx: 18, class: "kk-body" });
  if (colour !== undefined) body.setAttribute("style", `fill:${colour}`);
  svg.append(body, s("rect", { x: 10, y: 10, width: 80, height: 80, rx: 14, class: "kk-shine" }));
  const chars = [...label];
  let lines = [label];
  if (chars.length > 6 && label.includes(" ")) {
    // Break at the space nearest the middle.
    const spaces = chars.flatMap((c, i) => (c === " " ? [i] : []));
    const at = spaces.reduce((best, i) => (Math.abs(i - chars.length / 2) < Math.abs(best - chars.length / 2) ? i : best));
    lines = [chars.slice(0, at).join(""), chars.slice(at + 1).join("")];
  }
  const size = wordSize(Math.max(...lines.map((line) => [...line].length)));
  lines.forEach((line, i) => {
    const text = s("text", { x: 50, y: 50 + (i - (lines.length - 1) / 2) * size * 1.15, "font-size": size, class: "kk-word", "text-anchor": "middle", "dominant-baseline": "central" }, line);
    if (colour !== undefined) text.setAttribute("style", `fill:${inkOn(colour)}`);
    svg.append(text);
  });
}

/** The mark of a loaded die: a small weight in the corner, on the felt, in every size. */
function loadedMark(): SVGElement {
  const mark = s("g", { class: "kk-loaded" });
  // On the corner and over the edge, clear of every pip and number.
  mark.append(s("circle", { cx: 9, cy: 9, r: 14 }), s("path", { d: "M4.5 6.5 L2 16.5 L16 16.5 L13.5 6.5 Z" }), s("circle", { cx: 9, cy: 4.2, r: 3, class: "kk-loaded-ring" }));
  return mark;
}

/** One die drawn showing a face, as an SVG labelled for a screen reader. A loaded die carries its mark. */
export function dieFace(group: DiceGroup, face: number, label: string): SVGElement {
  const svg = drawFace(group, face, label);
  if (group.weights !== undefined) svg.append(loadedMark());
  return svg;
}

function numberSize(text: string): number {
  return text.length >= 4 ? 19 : text.length === 3 ? 24 : text.length === 2 ? 30 : 36;
}

function drawFace(group: DiceGroup, face: number, label: string): SVGElement {
  const sides: Sides = group.sides;
  const svg = s("svg", { viewBox: "0 0 100 100", class: "kk-die-svg", role: "img", "aria-label": label });
  const custom = group.faces?.[face - 1];
  if (group.faces !== undefined) {
    customFace(svg, custom?.label ?? "?", custom?.colour);
    return svg;
  }
  if (sides === "F") {
    svg.append(s("rect", { x: 4, y: 4, width: 92, height: 92, rx: 18, class: "kk-body" }));
    svg.append(s("rect", { x: 10, y: 10, width: 80, height: 80, rx: 14, class: "kk-shine" }));
    if (face !== 0) svg.append(s("rect", { x: 26, y: 44, width: 48, height: 12, rx: 4, class: "kk-pip" }));
    if (face > 0) svg.append(s("rect", { x: 44, y: 26, width: 12, height: 48, rx: 4, class: "kk-pip" }));
    return svg;
  }
  if (!isDieSides(sides)) {
    const text = String(face);
    svg.append(s("path", { d: TOKEN, class: "kk-body", "stroke-linejoin": "round" }));
    svg.append(s("text", { x: 50, y: 45, "font-size": numberSize(text), class: "kk-number", "text-anchor": "middle", "dominant-baseline": "central" }, text));
    if (text === "6" || text === "9") svg.append(s("rect", { x: 42, y: 63, width: 16, height: 3, rx: 1.5, class: "kk-underline" }));
    svg.append(s("text", { x: 50, y: 80, "font-size": 13, class: "kk-caption", "text-anchor": "middle", "dominant-baseline": "central" }, `d${sides}`));
    return svg;
  }
  if (sides === 6) {
    svg.append(s("rect", { x: 4, y: 4, width: 92, height: 92, rx: 18, class: "kk-body" }));
    svg.append(s("rect", { x: 10, y: 10, width: 80, height: 80, rx: 14, class: "kk-shine" }));
    for (const [cx, cy] of PIPS[face] ?? []) svg.append(s("circle", { cx, cy, r: face === 1 ? 11 : 8.5, class: face === 1 ? "kk-pip kk-pip-one" : "kk-pip" }));
    return svg;
  }
  svg.append(s("path", { d: OUTLINES[sides], class: "kk-body", "stroke-linejoin": "round" }));
  const facets = FACETS[sides];
  if (facets !== undefined) svg.append(s("path", { d: facets, class: "kk-facet" }));
  const text = String(face);
  const size = numberSize(text);
  svg.append(
    s("text", { x: 50, y: NUMBER_Y[sides], "font-size": size, class: "kk-number", "text-anchor": "middle", "dominant-baseline": "central" }, text),
  );
  // A 6 and a 9 look alike upside down; real dice underline them, and so does this.
  if (text === "6" || text === "9") {
    svg.append(s("rect", { x: 42, y: NUMBER_Y[sides] + 18, width: 16, height: 3, rx: 1.5, class: "kk-underline" }));
  }
  return svg;
}

/** A small outline of a die, for the picker's chips. */
export function dieIcon(sides: DieSides): SVGElement {
  const svg = s("svg", { viewBox: "0 0 100 100", class: "kk-icon", "aria-hidden": "true" });
  if (sides === 6) svg.append(s("rect", { x: 10, y: 10, width: 80, height: 80, rx: 16 }));
  else svg.append(s("path", { d: OUTLINES[sides] }));
  return svg;
}
