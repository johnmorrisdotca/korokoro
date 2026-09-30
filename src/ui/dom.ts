/** A few lines of DOM building, so the tray needs no framework. Text is always set as text, never as HTML. */
type Attrs = Record<string, string | number | boolean | null | undefined | EventListener>;
type Child = Node | string | null | undefined | false;

export function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: Child[]): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (name.startsWith("on") && typeof value === "function") el.addEventListener(name.slice(2), value);
    else if (value === true) el.setAttribute(name, "");
    else el.setAttribute(name, String(value));
  }
  for (const child of children) {
    if (child === null || child === undefined || child === false) continue;
    el.append(typeof child === "string" ? document.createTextNode(child) : child);
  }
  return el;
}

const SVG = "http://www.w3.org/2000/svg";

export function s(tag: string, attrs: Record<string, string | number> = {}, ...children: (Node | string)[]): SVGElement {
  const el = document.createElementNS(SVG, tag);
  for (const [name, value] of Object.entries(attrs)) el.setAttribute(name, String(value));
  for (const child of children) el.append(typeof child === "string" ? document.createTextNode(child) : child);
  return el;
}

/** replaceChildren, skipping the parts a render left out. */
export function refill(el: Element, ...children: Child[]): void {
  el.replaceChildren(...children.filter((c): c is Node | string => c !== null && c !== undefined && c !== false));
}
