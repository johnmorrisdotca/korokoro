import { LOADED_PRESETS } from "../loaded.ts";
import type { DiceSet } from "../sets.ts";
import { MAX_SET_NAME } from "../sets.ts";
import { h } from "./dom.ts";
import { fillIn, type RollerStrings } from "./strings.ts";

/**
 * Everything that is one level down from the default tray, in one closed
 * section: making a die of your own, the loaded dice, and the sets kept on
 * this device. Closed, it is a single line; the tray above it is unchanged.
 */
export type MoreState = {
  /** Whether the section is open. */
  open: boolean;
  /** What is typed in the faces box. */
  faces: string;
  /** What is typed in the set's name. */
  name: string;
  /** What to say under the faces box: a refusal, or nothing. */
  error: string;
};

export type MoreActions = {
  /** Add a die written as notation to the roll. Returns a refusal to show, or null when it was added. */
  add(notation: string): string | null;
  /** Keep the roll showing under a name. */
  save(name: string): void;
  /** Make a set the roll. */
  use(set: DiceSet): void;
  /** Forget a set. */
  remove(set: DiceSet): void;
  /** Copy a link to a set. */
  copy(set: DiceSet, button: HTMLElement): void;
  /** Draw the section again after its state changed. */
  redraw(): void;
};

/** Which of the tray's words name each loaded preset and say what it does. */
const PRESET_WORDS: Record<string, [keyof RollerStrings, keyof RollerStrings]> = {
  optimist: ["loadedOptimist", "loadedOptimistSays"],
  flat: ["loadedFlat", "loadedFlatSays"],
  "odd-couple": ["loadedOddCouple", "loadedOddCoupleSays"],
};

export function morePanel(state: MoreState, sets: readonly DiceSet[], canSave: boolean, t: RollerStrings, act: MoreActions): HTMLElement {
  const faces = h("input", { type: "text", class: "kk-field", value: state.faces, placeholder: t.customHint, "aria-label": t.customHint, autocomplete: "off", autocapitalize: "none", autocorrect: "off", spellcheck: "false", enterkeyhint: "done", "data-testid": "kk-custom-faces" });
  const add = h("button", { type: "button", class: "kk-link", "data-testid": "kk-custom-add" }, t.customAdd);
  const make = () => {
    state.faces = faces.value;
    if (faces.value.trim() === "") return;
    // The box takes the faces alone, or a whole die for anybody who has learnt the notation.
    const typed = faces.value.trim();
    state.error = act.add(/^\d*\s*d/i.test(typed) && /[[{]/.test(typed) ? typed : `1d[${typed}]`) ?? "";
    if (state.error === "") state.faces = "";
    act.redraw();
  };
  faces.addEventListener("input", () => (state.faces = faces.value));
  faces.addEventListener("keydown", (event) => {
    if (event.key === "Enter") make();
  });
  add.addEventListener("click", make);

  const presets = LOADED_PRESETS.map((preset) => {
    const [name, says] = PRESET_WORDS[preset.id] as [keyof RollerStrings, keyof RollerStrings];
    const button = h("button", { type: "button", class: "kk-preset", "data-testid": "kk-loaded-preset", "data-value": preset.id }, h("b", {}, t[name]), h("code", {}, preset.notation), h("span", {}, t[says]));
    button.addEventListener("click", () => {
      state.error = act.add(preset.notation) ?? "";
      act.redraw();
    });
    return button;
  });

  const name = h("input", { type: "text", class: "kk-field", value: state.name, maxlength: MAX_SET_NAME, placeholder: t.setName, "aria-label": t.setName, autocomplete: "off", enterkeyhint: "done", "data-testid": "kk-set-name" });
  const save = h("button", { type: "button", class: "kk-link", disabled: !canSave, "data-testid": "kk-set-save" }, t.setSave);
  const keep = () => {
    if (name.value.trim() === "" || !canSave) return;
    act.save(name.value);
    state.name = "";
    act.redraw();
  };
  name.addEventListener("input", () => (state.name = name.value));
  name.addEventListener("keydown", (event) => {
    if (event.key === "Enter") keep();
  });
  save.addEventListener("click", keep);

  const list = sets.map((set) => {
    const use = h("button", { type: "button", class: "kk-set-use", "aria-label": fillIn(t.setRoll, { name: set.name, notation: set.notation }), "data-testid": "kk-set-use" }, h("b", {}, set.name), h("code", {}, set.notation));
    use.addEventListener("click", () => act.use(set));
    const copy = h("button", { type: "button", class: "kk-link", "aria-label": fillIn(t.setCopy, { name: set.name }), "data-testid": "kk-set-copy" }, t.copyLink);
    copy.addEventListener("click", () => act.copy(set, copy));
    const remove = h("button", { type: "button", class: "kk-link", "aria-label": fillIn(t.setDelete, { name: set.name }), "data-testid": "kk-set-delete" }, "×");
    remove.addEventListener("click", () => act.remove(set));
    return h("li", { "data-testid": "kk-set" }, use, copy, remove);
  });

  const details = h(
    "details",
    { class: "kk-settings kk-more", open: state.open, "data-testid": "kk-more" },
    h("summary", {}, t.moreDice),
    h("section", {}, h("h4", {}, t.customTitle), h("div", { class: "kk-row" }, faces, add), h("span", { class: "kk-error", role: "alert", "data-testid": "kk-custom-error" }, state.error)),
    h("section", {}, h("h4", {}, t.loadedTitle), h("p", {}, t.loadedNote), h("div", { class: "kk-presets" }, ...presets)),
    h("section", {}, h("h4", {}, t.setsTitle), h("div", { class: "kk-row" }, name, save), sets.length === 0 ? h("p", {}, t.setNone) : h("ul", { class: "kk-sets", "data-testid": "kk-sets" }, ...list)),
  );
  details.addEventListener("toggle", () => (state.open = details.open));
  return details;
}
