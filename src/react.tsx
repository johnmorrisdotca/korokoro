import { useEffect, useRef, type HTMLAttributes } from "react";

import { parseNotation } from "./notation.ts";
import { mountRoller, type RollerHandle, type RollerOptions } from "./ui/mount.ts";

/** The tray's options as props, `notation` as a shorter way to give the dice, and any attribute for the `<div>` the tray is mounted in. */
export type DiceRollerProps = RollerOptions & {
  /** The dice showing at first, as notation: "2d20kh1+5". It wins over `spec` when both are given, and the tray follows it when it changes. */
  notation?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, keyof RollerOptions | "notation">;

const OPTION_NAMES = ["notation", "locale", "strings", "storage", "storageKey", "spec", "query", "shareBase", "theme", "wide", "size", "onRoll", "animationMs", "sound", "playSound", "hold", "placeholder", "keyboard", "languageChooser", "diceWar"] as const;

/**
 * The tray as a React component: `<DiceRoller wide notation="2d20kh1+5" />`.
 *
 * A thin wrapper. The tray is plain DOM, mounted into this component's own
 * element once the browser has it and taken back on unmount, so it renders
 * nothing on the server and needs no provider. Options are read when it
 * mounts (and again when `locale` changes); give it a new `key` to start over
 * with different ones. `notation` is followed as it changes, and `onRoll` is
 * always the newest one passed.
 */
export function DiceRoller(props: DiceRollerProps) {
  const host = useRef<HTMLDivElement>(null);
  const handle = useRef<RollerHandle | null>(null);
  /** The notation the tray was last given, so that a change to it is told from a render that changed something else. */
  const shown = useRef<string | undefined>(undefined);
  const options = useRef<RollerOptions & { notation?: string }>({});
  const element: Record<string, unknown> = {};
  const given: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(props)) {
    if ((OPTION_NAMES as readonly string[]).includes(name)) given[name] = value;
    else element[name] = value;
  }
  useEffect(() => {
    options.current = given as RollerOptions & { notation?: string };
  });

  const { locale, notation } = props;
  useEffect(() => {
    const target = host.current;
    if (target === null) return;
    const { notation: dice, ...rest } = options.current;
    const spec = dice === undefined ? null : parseNotation(dice);
    const roller = mountRoller(target, {
      ...rest,
      ...(spec === null ? {} : { spec }),
      locale,
      onRoll: (roll) => options.current.onRoll?.(roll),
    });
    handle.current = roller;
    shown.current = dice;
    return () => {
      handle.current = null;
      roller.destroy();
    };
  }, [locale]);

  // The dice follow `notation` as it changes, without the tray being mounted afresh.
  useEffect(() => {
    if (notation === shown.current) return;
    shown.current = notation;
    const spec = notation === undefined ? null : parseNotation(notation);
    if (spec !== null) handle.current?.setSpec(spec);
  }, [notation]);

  return <div ref={host} {...(element as HTMLAttributes<HTMLDivElement>)} />;
}
