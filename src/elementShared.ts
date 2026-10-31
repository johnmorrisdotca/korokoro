// On a server there is no HTMLElement to extend: the class is still defined, so that importing this module never throws, and is simply never used.
export const Base: typeof HTMLElement =
  typeof HTMLElement === "undefined" ? (class {} as unknown as typeof HTMLElement) : HTMLElement;

export const booleanAttribute = (element: Element, name: string, fallback: boolean): boolean => {
  const value = element.getAttribute(name);
  return value === null ? fallback : !["off", "false", "no", "none", "0"].includes(value.trim().toLowerCase());
};
export const writeAttribute = (element: Element, name: string, value: unknown, flag = false): void => {
  if (value === null || value === undefined) element.removeAttribute(name);
  else if (flag)
    element.setAttribute(
      name,
      value === false || ["off", "false", "no", "none", "0"].includes(String(value).trim().toLowerCase())
        ? "false"
        : "",
    );
  else element.setAttribute(name, String(value));
};
const widthStyles = new WeakMap<HTMLElement, [string, string]>();
const themedRoots = new WeakSet<HTMLElement>();
export const appearance = (element: HTMLElement): void => {
  const width = Number(element.getAttribute("width"));
  if (Number.isFinite(width) && width > 0) {
    if (!widthStyles.has(element)) widthStyles.set(element, [element.style.width, element.style.maxWidth]);
    element.style.width = `${width}px`;
    element.style.maxWidth = "100%";
  } else if (widthStyles.has(element)) {
    const [before, maximum] = widthStyles.get(element)!;
    element.style.width = before;
    element.style.maxWidth = maximum;
    widthStyles.delete(element);
  }
  const root = element.querySelector<HTMLElement>(".kk-root");
  const theme = element.getAttribute("theme");
  if (root && (theme === "light" || theme === "dark")) {
    root.dataset.theme = theme;
    themedRoots.add(root);
  } else if (root && themedRoots.has(root)) {
    delete root.dataset.theme;
    themedRoots.delete(root);
  }
  const label = element.getAttribute("label");
  if (label !== null) {
    element.setAttribute("aria-label", label);
    if (!element.hasAttribute("role")) {
      element.setAttribute("role", "group");
      element.dataset.kkLabelRole = "group";
    }
    element.dataset.kkLabel = "set";
  } else if (element.dataset.kkLabel === "set") {
    element.removeAttribute("aria-label");
    if (element.dataset.kkLabelRole === "group") element.removeAttribute("role");
    delete element.dataset.kkLabel;
    delete element.dataset.kkLabelRole;
  }
};
