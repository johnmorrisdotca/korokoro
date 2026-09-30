import { useEffect, useRef, type HTMLAttributes } from "react";

import { mountRoller, type RollerOptions } from "./ui/mount.ts";

export type DiceRollerProps = RollerOptions & Omit<HTMLAttributes<HTMLDivElement>, keyof RollerOptions>;

const OPTION_NAMES = ["locale", "strings", "storage", "storageKey", "spec", "query", "shareBase", "theme", "wide", "onRoll", "animationMs"] as const;

/**
 * The tray as a React component: `<DiceRoller wide spec={{ count: 1, sides: 20 }} />`.
 *
 * A thin wrapper. The tray is plain DOM, mounted into this component's own
 * element once the browser has it and taken back on unmount, so it renders
 * nothing on the server and needs no provider. Options are read when it
 * mounts (and again when `locale` changes); give it a new `key` to start over
 * with different ones. `onRoll` is always the newest one passed.
 */
export function DiceRoller(props: DiceRollerProps) {
  const host = useRef<HTMLDivElement>(null);
  const options = useRef<RollerOptions>({});
  const element: Record<string, unknown> = {};
  const given: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(props)) {
    if ((OPTION_NAMES as readonly string[]).includes(name)) given[name] = value;
    else element[name] = value;
  }
  useEffect(() => {
    options.current = given as RollerOptions;
  });

  const { locale } = props;
  useEffect(() => {
    const target = host.current;
    if (target === null) return;
    const roller = mountRoller(target, {
      ...options.current,
      locale,
      onRoll: (roll) => options.current.onRoll?.(roll),
    });
    return () => roller.destroy();
  }, [locale]);

  return <div ref={host} {...(element as HTMLAttributes<HTMLDivElement>)} />;
}
