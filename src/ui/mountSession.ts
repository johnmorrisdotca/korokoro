import type { DiceGroup, DieRoll, Roll, RollSpec, Sides } from "../dice.ts";
import type { Preset } from "../games/presets.ts";
import type { StorageLike } from "../history.ts";
import type { Distribution } from "../odds.ts";
import type { RandomSource } from "../random.ts";
import type { DiceSet } from "../sets.ts";
import type { GamesState } from "./games.ts";
import type { MoreState } from "./more.ts";
import type { RollerOptions, Tab } from "./mount.ts";
import type { RealDie } from "./panels.ts";
import type { RollSound } from "./sound.ts";
import type { RollerStrings } from "./strings.ts";
import type { WarSession, WarSettings } from "./war.ts";

export interface Session {
  readonly options: RollerOptions;
  readonly doc: Document;
  readonly win: (Window & typeof globalThis) | null;
  readonly wordsFor: (tag: string) => RollerStrings;
  locale: string;
  t: RollerStrings;
  readonly storage: StorageLike | undefined;
  readonly storageKey: string;
  readonly animationMs: number;
  readonly languageKey: string;
  readonly hasSound: boolean;
  spec: RollSpec;
  game: Preset | null;
  war: WarSession | null;
  warSettings: WarSettings;
  gameRolls: Roll[];
  turn: number;
  currentSet: Roll[] | null;
  readonly gamesState: GamesState;
  exportOpen: boolean;
  exportSaid: string;
  readonly japanese: () => boolean;
  readonly TRAY_TIMES: 10;
  readonly setsKey: string;
  sets: DiceSet[];
  readonly more: MoreState;
  readonly realDie: RealDie;
  empty: boolean;
  lit: number;
  suggested: boolean;
  history: Roll[];
  current: Roll | null;
  showingShared: boolean;
  held: boolean[];
  rolling: boolean;
  tab: Tab;
  goal: number;
  seed: string | null;
  source: RandomSource;
  clearArmed: boolean;
  storageWorks: boolean;
  readonly muted: boolean;
  ownSound: RollSound | null;
  readonly timers: Set<number>;
  readonly controls: HTMLDivElement;
  readonly tray: HTMLButtonElement;
  readonly diceBox: HTMLDivElement;
  readonly hint: HTMLSpanElement;
  readonly mute: HTMLButtonElement;
  readonly release: HTMLButtonElement;
  readonly felt: HTMLDivElement;
  readonly result: HTMLDivElement;
  readonly warBox: HTMLDivElement;
  readonly panels: HTMLDivElement;
  readonly said: HTMLDivElement;
  readonly notation: () => string;
  readonly kinds: () => DiceGroup[];
  readonly plainDie: (sides: Sides) => DiceGroup;
  readonly showing: () => Roll | null;
  readonly turnOver: () => boolean;
  readonly holdable: () => boolean;
  readonly heldCount: () => number;
  later: (fn: () => void, ms: number) => void;
  segment: <T extends string | number>(
    label: string,
    values: readonly T[],
    chosen: T | null,
    name: (v: T) => Node | string,
    pick: (v: T) => void,
    testId: string,
    dimmed?: (v: T) => boolean,
    last?: HTMLElement | null,
    inPool?: (v: T) => boolean,
    help?: Record<string, string>,
  ) => HTMLDivElement;
  settle: (before: string) => void;
  setKinds: (next: DiceGroup[], touched: string | null) => void;
  changeSpec: (next: Partial<RollSpec>) => void;
  changeLit: (next: Partial<DiceGroup>) => void;
  addDie: (die: DiceGroup, count?: number) => boolean;
  takeOne: (index: number) => void;
  renderControls: () => void;
  setLocale: (next: string, remember: boolean) => void;
  chooseWar: () => void;
  startWar: () => void;
  renderWar: () => void;
  chooseGame: (preset: Preset) => void;
  useSeed: (next: string | null) => void;
  dieLabel: (group: DiceGroup, die: DieRoll, isHeld: boolean) => string;
  dieElement: (
    group: DiceGroup,
    die: DieRoll,
    index: number,
    first: boolean,
    hold?: ((index: number) => void) | null,
  ) => HTMLElement;
  randomFace: (group: DiceGroup) => number;
  restingDice: () => DieRoll[];
  toggleHold: (index: number) => void;
  oddsNow: () => RollSpec | Distribution;
  renderTray: () => void;
  sumLine: (r: Roll) => HTMLElement;
  waiting: () => HTMLElement[];
  linkTo: (query: string) => string;
  copyLink: (url: string, button: HTMLElement) => void;
  renderResult: () => void;
  renderPanels: () => void;
  save: (name: string, type: string, text: string) => void;
  exportPanel: () => HTMLElement;
  restOf: () => string;
  renderMute: () => void;
  sound: (dice: number, landings: number[]) => void;
  render: () => void;
  throwDice: () => void;
  land: (thrown: Roll, many?: Roll[] | null) => void;
}
