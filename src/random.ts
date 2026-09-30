/**
 * Where the randomness comes from.
 *
 * A source hands out unsigned 32-bit integers. Two are offered: the browser's
 * cryptographic generator, which is the default and the fair one, and a seeded
 * generator for rolls that somebody else must be able to reproduce (a shared
 * link, a test, a table that wants to check the dungeon master's dice).
 */
export type RandomSource = {
  /** An integer in [0, 2^32). */
  next(): number;
  /** The seed, when the source is reproducible; null for crypto. */
  readonly seed: string | null;
};

type CryptoLike = { getRandomValues<T extends ArrayBufferView>(array: T): T };

/** The platform's cryptographic generator, buffered so a roll of ten dice is one call. */
export function cryptoSource(provider: CryptoLike | undefined = globalThis.crypto): RandomSource {
  if (provider === undefined || typeof provider.getRandomValues !== "function") {
    throw new Error("korokoro: no crypto.getRandomValues on this platform; pass a seeded source instead");
  }
  const buffer = new Uint32Array(64);
  let used = buffer.length;
  return {
    seed: null,
    next() {
      if (used === buffer.length) {
        provider.getRandomValues(buffer);
        used = 0;
      }
      return buffer[used++] as number;
    },
  };
}

/** cyrb128: four 32-bit words from a string, to start sfc32 from any seed text. */
function hashSeed(text: string): [number, number, number, number] {
  let h1 = 1779033703;
  let h2 = 3144134277;
  let h3 = 1013904242;
  let h4 = 2773480762;
  for (let i = 0; i < text.length; i++) {
    const k = text.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  return [(h1 ^ h2 ^ h3 ^ h4) >>> 0, (h2 ^ h1) >>> 0, (h3 ^ h1) >>> 0, (h4 ^ h1) >>> 0];
}

/**
 * sfc32 started from a text seed: the same seed gives the same rolls on every
 * platform, forever. Not for anything that must be unguessable.
 */
export function seededSource(seed: string): RandomSource {
  let [a, b, c, d] = hashSeed(seed);
  const step = () => {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    let t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return t >>> 0;
  };
  // Warm up, as sfc32's author recommends, so near-identical seeds diverge.
  for (let i = 0; i < 15; i++) step();
  return { seed, next: step };
}

/** A short seed anybody can read aloud or type: eight letters and digits. */
export function newSeed(source: RandomSource = cryptoSource()): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += alphabet[randomInt(source, alphabet.length)];
  return out;
}

/**
 * A fair integer in [0, n). Rejection sampling, never `next() % n`: the modulo
 * leans towards the low faces whenever n does not divide 2^32, and a d6 or a
 * d10 does not.
 */
export function randomInt(source: RandomSource, n: number): number {
  if (!Number.isInteger(n) || n < 1 || n > 2 ** 32) throw new RangeError(`korokoro: cannot pick from ${n}`);
  const limit = 2 ** 32 - (2 ** 32 % n);
  for (;;) {
    const value = source.next();
    if (value < limit) return value % n;
  }
}
