import { DICE_WAR_LIMITS, diceWarOdds, encodeDiceWar, diceWarOver, diceWarPeopleToRoll, diceWarWinners, playDiceWar, startDiceWar, type DiceWarGame, type DiceWarGoal, type DiceWarThrow } from "../diceWar.ts";
import { newSeed } from "../random.ts";
import { h } from "./dom.ts";
import { percent } from "./panels.ts";
import { fillIn, type RollerStrings } from "./strings.ts";

/**
 * DICE WAR IN THE TRAY: a panel under the felt for a table of the person at the tray and computers, played with the
 * tray's own dice. The person's roll is what the tray threw; the computers' dice, and every war the person is not in,
 * are the game's own, from its seed. Nothing here knows a rule: it asks `diceWar.ts`.
 */

/** What a table of Dice War in the tray is set up with. */
export type WarSettings = { players: number; dice: number; goal: DiceWarGoal; to: number };

/** The settings a table opens with: three players, one die, to five points. */
export const WAR_DEFAULTS: WarSettings = { players: 3, dice: 1, goal: "points", to: 5 };

/** The ways a game may end that the panel offers. */
const ENDINGS: readonly [DiceWarGoal, number][] = [["points", 3], ["points", 5], ["points", 10], ["rounds", 5], ["rounds", 10], ["rounds", 20]];

/** The computers' names, after the person's own. */
const NAMES = ["Aiko", "Ben", "Chloé", "Dev", "Emi", "Finn", "Grace"];

/** Where a table stands: the game, and the settings it was made from. */
export type WarSession = { game: DiceWarGame; settings: WarSettings };

/** A new game for these settings, the person in the first seat and computers in the rest. */
export function newWar(settings: WarSettings, names: readonly string[], seed: string = newSeed()): WarSession | null {
  const game = startDiceWar({ players: names.slice(0, settings.players), computers: Array.from({ length: settings.players }, (_, seat) => seat > 0), dice: settings.dice, sides: 6, goal: settings.goal, to: settings.to, seed });
  return game === null ? null : { game, settings };
}

/** The names at a table: the person's, then the computers'. */
export function warNames(count: number, you: string): string[] {
  return [you, ...NAMES].slice(0, count);
}

/**
 * The game after the person's dice, with the computers' wars played out: where only computers are left to roll, they roll at
 * once, until the person is to roll again or the game is over. Null where the dice are not the table's.
 */
export function throwWar(session: WarSession, faces: readonly number[]): WarSession | null {
  let game = playDiceWar(session.game, { faces: { "0": faces } });
  while (game !== null && !diceWarOver(game) && diceWarPeopleToRoll(game).length === 0) game = playDiceWar(game, {});
  return game === null ? null : { ...session, game };
}

/** A throw in words: who rolled what, and what came of it. */
function throwLine(one: DiceWarThrow, names: readonly string[], t: RollerStrings, dice: number): string {
  const rolled = one.rolls.map((roll) => fillIn(t.warBeats, { name: names[roll.seat] ?? "", total: dice > 1 ? `${roll.total} (${roll.faces.join("+")})` : String(roll.total) })).join(" · ");
  const top = one.rolls.find((roll) => roll.seat === one.tied[0])?.total ?? 0;
  const came = one.winner !== null ? fillIn(t.warTakes, { name: names[one.winner] ?? "", n: one.stake }) : one.tied.length > 1 && one.war < DICE_WAR_LIMITS.mostWars ? fillIn(t.warWar, { names: one.tied.map((seat) => names[seat]).join(", "), total: top }) : t.warCalledOff;
  return `${rolled} → ${came}`;
}

/** The panel: the table, the scores, the last throw, the odds and the choices. `change` and `restart` are the person's. */
export function warPanel(session: WarSession, names: readonly string[], t: RollerStrings, locale: string, change: (next: Partial<WarSettings>) => void, restart: () => void): HTMLElement {
  const { game, settings } = session;
  const over = diceWarOver(game);
  const winners = diceWarWinners(game);
  const best = Math.max(...game.scores);
  const select = (label: string, value: string, options: [string, string][], pick: (value: string) => void, id: string) => {
    const box = h("select", { class: "kk-field", "data-testid": id, "aria-label": label }, ...options.map(([v, text]) => h("option", { value: v }, text)));
    box.value = value;
    box.addEventListener("change", () => pick(box.value));
    return h("label", { class: "kk-war-field" }, h("span", { class: "kk-label" }, label), box);
  };
  const line = game.goal === "rounds" ? fillIn(t.warRoundOf, { n: game.round, of: game.to }) : `${fillIn(t.warRoundLine, { n: game.round })} · ${fillIn(t.warPoints, { n: game.to })}`;
  const status = over ? fillIn(t.warWon, { names: winners.map((seat) => names[seat]).join(", ") }) : `${line} · ${fillIn(t.warAtStake, { n: game.stake })} · ${t.warYourThrow}`;
  // The throws of the round now going, or the round that just ended: where the last throw was the end of a round, that round.
  const last = game.throws.at(-1);
  const recent = last === undefined ? [] : game.throws.filter((one) => one.round === last.round);
  const mine = last?.rolls.find((roll) => roll.seat === 0);
  const odds = diceWarOdds({ players: settings.players, dice: settings.dice });
  const yours = mine === undefined ? null : diceWarOdds({ players: settings.players, dice: settings.dice }, mine.total);
  return h(
    "section",
    { class: "kk-war", "data-testid": "kk-war", "data-over": String(over) },
    h("h4", {}, t.warName),
    h("p", { class: "kk-fine" }, t.warSays),
    h(
      "div",
      { class: "kk-row kk-war-settings" },
      select(t.warPlayers, String(settings.players), Array.from({ length: 5 }, (_, at) => [String(at + 2), String(at + 2)] as [string, string]), (v) => change({ players: Number(v) }), "kk-war-players"),
      select(t.warDice, String(settings.dice), [1, 2, 3].map((n) => [String(n), String(n)] as [string, string]), (v) => change({ dice: Number(v) }), "kk-war-dice"),
      select(t.warPlayTo, `${settings.goal}:${settings.to}`, ENDINGS.map(([goal, n]) => [`${goal}:${n}`, fillIn(goal === "points" ? t.warPoints : t.warRounds, { n })] as [string, string]), (v) => {
        const [goal, n] = v.split(":");
        change({ goal: goal as DiceWarGoal, to: Number(n) });
      }, "kk-war-goal"),
    ),
    h("p", { class: "kk-war-status", "aria-live": "polite", "data-testid": "kk-war-status" }, status),
    h("ul", { class: "kk-war-scores", "aria-label": t.warScores, "data-testid": "kk-war-scores" }, ...game.players.map((_, seat) => h("li", { "data-leader": String(game.scores[seat] === best && best > 0), "data-testid": "kk-war-seat" }, h("span", {}, names[seat]), h("b", {}, String(game.scores[seat]))))),
    recent.length === 0
      ? null
      : h("div", { class: "kk-war-last" }, h("h5", {}, t.warLast), h("ol", { "data-testid": "kk-war-throws" }, ...recent.map((one) => h("li", {}, throwLine(one, names, t, game.dice))))),
    odds.war > 0 ? h("p", { class: "kk-fine" }, fillIn(t.warOdds, { odds: new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(1 / odds.war) })) : null,
    yours === null || mine === undefined || yours.beats === null || yours.ties === null || yours.loses === null
      ? null
      : h("p", { class: "kk-fine" }, fillIn(t.warYourOdds, { total: mine.total, beats: percent(yours.beats, locale), ties: percent(yours.ties, locale), loses: percent(yours.loses, locale) })),
    h("details", { class: "kk-war-keep" }, h("summary", {}, t.warKeep), h("pre", { class: "kk-war-text", tabindex: "0", "data-testid": "kk-war-text" }, encodeDiceWar(game))),
    h("div", { class: "kk-actions" }, h("button", { type: "button", class: "kk-link", "data-testid": "kk-war-new", onclick: restart }, t.warNew)),
  );
}
