import { clothVars, isCloth } from "./cloth.ts";

/** Lays the cloth's colours, then the host's own CSS variables over them, on the tray. */
export function wearCloth(
  root: HTMLElement,
  cloth: string | undefined,
  theme?: Record<`--kk-${string}`, string>,
): void {
  for (const [name, value] of Object.entries({ ...clothVars(cloth), ...(theme ?? {}) }))
    root.style.setProperty(name, value);
  root.dataset.cloth = isCloth(cloth) ? cloth : "green";
}

/** Whether a key press is the Space that rolls this tray, and not one the page or a control keeps for itself. */
export function spaceRollsTray(event: KeyboardEvent, doc: Document, root: HTMLElement, keyboard?: boolean): boolean {
  if (event.key !== " " || event.defaultPrevented) return false;
  const el = event.target as HTMLElement | null;
  if (el !== null && el !== doc.body && el !== root && !root.contains(el)) return false;
  // A tray that leaves the page its Space rolls only from inside itself.
  if (keyboard === false && (el === null || !root.contains(el))) return false;
  return !el?.closest("input, textarea, select, button, summary, [contenteditable]");
}
