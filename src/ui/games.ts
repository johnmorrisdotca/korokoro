import { PRESETS, findPresets, type GameFamily, type Preset } from "../games/presets.ts";
import { h } from "./dom.ts";
import { fillIn, type RollerStrings } from "./strings.ts";

/**
 * The one control for games: a closed line until somebody opens it, then a
 * search box and the games on their shelves. Choosing one sets the dice and
 * has each roll read the way that game reads it. The tray above is untouched
 * until it is opened.
 */
export type GamesState = {
  /** Whether the list is open. */
  open: boolean;
  /** What is typed in the search box. */
  search: string;
};

const FAMILIES: [GameFamily, keyof RollerStrings][] = [
  ["board", "familyBoard"],
  ["dice", "familyDice"],
  ["traditional", "familyTraditional"],
  ["cards", "familyCards"],
  ["roleplaying", "familyRoleplaying"],
  ["handy", "familyHandy"],
];

/** Where somebody tells us of a game that is missing. */
export const SUGGEST_A_GAME = "https://github.com/johnmorrisdotca/korokoro/issues/new?template=suggest-a-game.md";

/** A game played with the tray rather than only read by it: shown on a shelf of its own under the others. */
export type PlayedGame = { name: string; says: string; chosen: boolean; choose: () => void; value: string };

export function gamesPanel(state: GamesState, chosen: Preset | null, japanese: boolean, t: RollerStrings, choose: (preset: Preset) => void, stop: () => void, played: PlayedGame | null = null): HTMLElement {
  const name = (p: Preset) => (japanese ? p.nameJa : p.name);
  const search = h("input", { type: "search", class: "kk-field", value: state.search, placeholder: t.gamesSearch, "aria-label": t.gamesSearch, autocomplete: "off", autocapitalize: "none", autocorrect: "off", spellcheck: "false", enterkeyhint: "search", "data-testid": "kk-games-search" });
  const nothing = h("p", { hidden: true, "data-testid": "kk-games-nothing" }, t.gamesNothing);
  const entries = new Map<string, HTMLElement>();
  const shelves = FAMILIES.map(([family, title]) => {
    const list = PRESETS.filter((p) => p.family === family).map((preset) => {
      const button = h(
        "button",
        { type: "button", class: "kk-game", "aria-pressed": String(chosen?.id === preset.id), "data-testid": "kk-game", "data-value": preset.id },
        h("b", {}, name(preset)),
        h("code", {}, preset.notation),
        h("span", {}, japanese ? preset.saysJa : preset.says),
      );
      button.addEventListener("click", () => choose(preset));
      entries.set(preset.id, button);
      return button;
    });
    return h("section", { "data-family": family }, h("h4", {}, t[title]), h("div", { class: "kk-games" }, ...list));
  });
  // The game played with the tray: found by its name like the rest, and kept apart because it is played and not only read.
  const playedButton =
    played === null
      ? null
      : h("button", { type: "button", class: "kk-game", "aria-pressed": String(played.chosen), "data-testid": "kk-game", "data-value": played.value }, h("b", {}, played.name), h("span", {}, played.says));
  playedButton?.addEventListener("click", () => played?.choose());
  const playedShelf = playedButton === null ? null : h("section", { "data-family": "played" }, h("h4", {}, t.warFamily), h("div", { class: "kk-games" }, playedButton));
  // The list is narrowed in place as somebody types, so the box keeps its focus and a phone keeps its keyboard.
  const narrow = () => {
    state.search = search.value;
    const found = new Set(findPresets(search.value).map((p) => p.id));
    for (const [id, entry] of entries) entry.hidden = !found.has(id);
    for (const shelf of shelves) shelf.hidden = !PRESETS.some((p) => p.family === shelf.dataset.family && found.has(p.id));
    // The played game is found by any word of its name, its saying, or "dice war".
    const words = search.value.toLowerCase().split(/\s+/).filter(Boolean);
    const haystack = played === null ? "" : `${played.name} ${played.says} ${played.value} war`.toLowerCase();
    const playedFound = played !== null && words.every((word) => haystack.includes(word));
    if (playedButton !== null) playedButton.hidden = !playedFound;
    if (playedShelf !== null) playedShelf.hidden = !playedFound;
    nothing.hidden = found.size > 0 || playedFound;
  };
  search.addEventListener("input", narrow);
  narrow();

  const halt = chosen === null && played?.chosen !== true ? null : h("button", { type: "button", class: "kk-link", "data-testid": "kk-games-stop" }, fillIn(t.gamesStop, { name: chosen === null ? (played?.name ?? "") : name(chosen) }));
  halt?.addEventListener("click", stop);

  const details = h(
    "details",
    { class: "kk-settings kk-more", open: state.open, "data-testid": "kk-games-panel" },
    h("summary", {}, `${t.games}: ${chosen !== null ? name(chosen) : played?.chosen === true ? played.name : t.gamesNone}`),
    h("div", { class: "kk-row" }, search, halt),
    h("div", { class: "kk-shelves", tabindex: "0", role: "group", "aria-label": t.games }, nothing, ...shelves, playedShelf),
    h("p", {}, h("a", { href: SUGGEST_A_GAME, target: "_blank", rel: "noopener", "data-testid": "kk-games-missing" }, t.gamesMissing)),
    h("p", { class: "kk-fine" }, t.gamesNote),
  );
  details.addEventListener("toggle", () => (state.open = details.open));
  return details;
}
