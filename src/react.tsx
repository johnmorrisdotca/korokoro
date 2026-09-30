import { useEffect, useRef, type HTMLAttributes } from "react";

import { mountRoller, type RollerOptions } from "./ui/mount.ts";

export type DiceRollerProps = RollerOptions & Omit<HTMLAttributes<HTMLDivElement>, keyof RollerOptions>;

/**
 * The tray as a React component: `<DiceRoller wide spec={{ count: 1, sides: 20 }} />`.
 *
 * A thin wrapper. The tray is plain DOM, mounted into this component's own
 * element once the browser has it and taken back on unmount, so it renders
 * nothing on the server and needs no provider. Options are read when it
 * mounts; give it a new `key` to start over with different ones.
 */
export function DiceRoller({
  locale,
  strings,
  storage,
  storageKey,
  spec,
  query,
  shareBase,
  theme,
  wide,
  onRoll,
  animationMs,
  ...element
}: DiceRollerProps) {
  const host = useRef<HTMLDivElement>(null);
  // The newest callback, read at roll time, so a parent re-rendering never remounts the tray.
  const latest = useRef(onRoll);
  useEffect(() => {
    latest.current = onRoll;
  });

  useEffect(() => {
    const target = host.current;
    if (target === null) return;
    const roller = mountRoller(target, {
      locale,
      strings,
      storage,
      storageKey,
      spec,
      query,
      shareBase,
      theme,
      wide,
      animationMs,
      onRoll: (roll) => latest.current?.(roll),
    });
    return () => roller.destroy();
    // Mounted once per key and locale, as documented above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  return <div ref={host} {...element} />;
}
