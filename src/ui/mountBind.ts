import type { Session } from "./mountSession.ts";

/**
 * The fields the tray closes over, read and written through the functions that were split out of
 * `mountRoller`, plus those functions themselves.
 */
export function bindSession<D extends object>(
  reads: { [K in keyof D]: () => D[K] },
  writes: Partial<{ [K in keyof D]: (value: D[K]) => void }>,
  methods: (session: Session) => Omit<Session, keyof D>,
): Session {
  const session = {} as Session;
  for (const key of Object.keys(reads) as (keyof D)[]) {
    const read = reads[key];
    const write = writes[key];
    const desc: PropertyDescriptor = { enumerable: true, configurable: true, get: () => read() };
    if (write !== undefined) desc.set = (value) => write(value);
    Object.defineProperty(session, key, desc);
  }
  return Object.assign(session, methods(session));
}
