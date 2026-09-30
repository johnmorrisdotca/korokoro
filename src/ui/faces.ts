import type { DieSides } from "../dice.ts";
import { s } from "./dom.ts";

/**
 * Each die drawn as its own shape, the way it looks on the table: a d6 with
 * pips, the others as their silhouette with the number in the middle.
 * Everything is in a 100 by 100 box and coloured by the tray's CSS variables.
 */
const OUTLINES: Record<DieSides, string> = {
  4: "M50 6 L95 88 Q96 92 91 92 L9 92 Q4 92 5 88 Z",
  6: "",
  8: "M50 3 L95 50 L50 97 L5 50 Z",
  10: "M50 3 L94 42 L50 97 L6 42 Z",
  12: "M50 4 L94 36 L77 90 L23 90 L6 36 Z",
  20: "M50 3 L91 26 L91 74 L50 97 L9 74 L9 26 Z",
  100: "M50 3 L94 42 L50 97 L6 42 Z",
};

/** Lines inside the outline that suggest the facets. */
const FACETS: Partial<Record<DieSides, string>> = {
  8: "M5 50 L95 50",
  10: "M6 42 L50 58 L94 42 M50 58 L50 97",
  100: "M6 42 L50 58 L94 42 M50 58 L50 97",
  12: "M50 22 L76 40 L66 72 L34 72 L24 40 Z",
  20: "M50 22 L78 70 L22 70 Z M50 3 L50 22 M91 74 L78 70 M9 74 L22 70",
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
const NUMBER_Y: Record<DieSides, number> = { 4: 68, 6: 50, 8: 52, 10: 44, 12: 52, 20: 54, 100: 44 };

export function dieFace(sides: DieSides, face: number, label: string): SVGElement {
  const svg = s("svg", { viewBox: "0 0 100 100", class: "kk-die-svg", role: "img", "aria-label": label });
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
  const size = text.length >= 3 ? 24 : text.length === 2 ? 30 : 36;
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
