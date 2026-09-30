/**
 * The sound of a roll: a shake while the dice tumble and a knock as each one
 * lands. The recordings are real dice (see SOUNDS.md), loaded the first time a
 * tray with its sound on rolls and never before, so a page that stays silent
 * never fetches them. Where they cannot be loaded or decoded, a short knock
 * made in the browser stands in. Nothing here throws: a platform with no
 * audio, a blocked context or a failed decode is simply silent.
 */
export type SoundThrow = {
  /** How many dice were thrown. */
  dice: number;
  /** How long the tumble lasts, in milliseconds. Nought when the dice land at once. */
  ms: number;
  /** When each die lands, in milliseconds from the throw, in the order thrown. */
  landings: number[];
};

/** Anything that makes a roll's sound: the built-in one, or a page's own. */
export type PlaySound = (thrown: SoundThrow) => void;

/** The tray's own sound: `play` for each throw, `close` when the tray goes. */
export type RollSound = { play: PlaySound; close(): void };

/** The recordings, by name, as base64. */
export type SoundData = Record<string, string>;

type AudioWindow = {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
  atob?: (text: string) => string;
};

/** As many knocks as one roll plays: ten dice landing are five knocks, not a wall of noise. */
export const MAX_KNOCKS = 5;
/** The tray's loudness, out of 1. */
const VOLUME = 0.5;

type Loaded = { shakes: AudioBuffer[]; knocks: AudioBuffer[] };

function bytesOf(base64: string, atob: (text: string) => string): ArrayBuffer {
  const text = atob(base64);
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
  return bytes.buffer;
}

/** Decoding as a promise, on browsers that take callbacks and on those that return one. */
function decode(ctx: AudioContext, data: ArrayBuffer): Promise<AudioBuffer> {
  return new Promise((resolve, reject) => {
    const pending = ctx.decodeAudioData(data, resolve, reject) as Promise<AudioBuffer> | undefined;
    if (pending !== undefined && typeof pending.then === "function") pending.then(resolve, reject);
  });
}

/** The landings that get a knock: all of them up to `MAX_KNOCKS`, then an even spread from first to last. */
export function knockTimes(landings: readonly number[]): number[] {
  if (landings.length <= MAX_KNOCKS) return [...landings];
  return Array.from({ length: MAX_KNOCKS }, (_, i) => landings[Math.round((i * (landings.length - 1)) / (MAX_KNOCKS - 1))] as number);
}

/**
 * The tray's sound for one window. `load` fetches the recordings; it is the
 * package's own lazy import unless a test hands in another.
 */
export function createRollSound(
  win: AudioWindow | undefined,
  load: () => Promise<{ SOUNDS: SoundData }> = () => import("./sounds-data.ts"),
): RollSound {
  let ctx: AudioContext | null = null;
  let out: GainNode | null = null;
  let loaded: Promise<Loaded | null> | null = null;
  let closed = false;

  function context(): AudioContext | null {
    if (ctx !== null) return ctx;
    const Context = win?.AudioContext ?? win?.webkitAudioContext;
    if (Context === undefined) return null;
    ctx = new Context();
    out = ctx.createGain();
    out.gain.value = VOLUME;
    out.connect(ctx.destination);
    return ctx;
  }

  function recordings(audio: AudioContext): Promise<Loaded | null> {
    loaded ??= (async () => {
      try {
        const atob = win?.atob ?? globalThis.atob;
        const { SOUNDS } = await load();
        const names = Object.keys(SOUNDS).sort();
        const buffers = await Promise.all(names.map((name) => decode(audio, bytesOf(SOUNDS[name] as string, atob))));
        const pick = (start: string) => buffers.filter((_, i) => (names[i] as string).startsWith(start));
        const made = { shakes: pick("dice-shake"), knocks: pick("die-throw") };
        return made.knocks.length > 0 ? made : null;
      } catch {
        return null;
      }
    })();
    return loaded;
  }

  function sample(audio: AudioContext, buffer: AudioBuffer, at: number, rate: number, gain: number, skip = 0) {
    const source = audio.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = rate;
    const level = audio.createGain();
    level.gain.value = gain;
    source.connect(level);
    level.connect(out as GainNode);
    source.start(at, skip);
  }

  /** A knock made here, for when the recordings cannot be had: a burst of noise, band-passed and cut off fast. */
  function knock(audio: AudioContext, at: number, rate: number, gain: number) {
    const length = Math.round(audio.sampleRate * 0.05);
    const buffer = audio.createBuffer(1, length, audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
    const source = audio.createBufferSource();
    source.buffer = buffer;
    const band = audio.createBiquadFilter();
    band.type = "bandpass";
    band.frequency.value = 1900 * rate;
    band.Q.value = 1.4;
    const level = audio.createGain();
    level.gain.value = gain * 1.6;
    source.connect(band);
    band.connect(level);
    level.connect(out as GainNode);
    source.start(at);
  }

  function schedule(audio: AudioContext, sounds: Loaded | null, thrown: SoundThrow, began: number) {
    const late = audio.currentTime - began;
    const any = <T>(list: T[]) => list[Math.floor(Math.random() * list.length)] as T;
    // The shake is for the tumble: not for dice that land at once, and not once the tumble is half over.
    if (sounds !== null && sounds.shakes.length > 0 && thrown.ms >= 300 && late < thrown.ms / 2000) {
      const shake = any(sounds.shakes);
      // Played a little fast or slow so that it ends as the dice do; on the first roll, while the
      // recordings were being fetched, it has missed its start and joins in where it would have been.
      const rate = Math.min(1.5, Math.max(0.85, shake.duration / (thrown.ms / 1000 + 0.04)));
      sample(audio, shake, audio.currentTime, rate, 0.55, Math.max(0, late) * rate);
    }
    const knocks = knockTimes(thrown.landings);
    const each = 0.62 / Math.sqrt(Math.max(1, knocks.length));
    for (const ms of knocks) {
      const at = began + ms / 1000;
      // A knock whose moment has passed is dropped, not played late.
      if (at < audio.currentTime - 0.08) continue;
      const rate = 0.88 + Math.random() * 0.3;
      const gain = each * (0.75 + Math.random() * 0.5);
      if (sounds === null) knock(audio, Math.max(at, audio.currentTime), rate, gain);
      else sample(audio, any(sounds.knocks), Math.max(at, audio.currentTime), rate, gain);
    }
  }

  return {
    play(thrown) {
      if (closed) return;
      try {
        const audio = context();
        if (audio === null) return;
        const go = () => {
          const began = audio.currentTime;
          void recordings(audio).then((sounds) => {
            try {
              if (!closed) schedule(audio, sounds, thrown, began);
            } catch {
              // A node that will not start is a roll without its sound, nothing more.
            }
          });
        };
        // A browser holds a context still until the page has been touched; a roll made by code before then stays silent.
        if (audio.state === "running") go();
        else
          void audio.resume().then(
            () => {
              if (audio.state === "running") go();
            },
            () => undefined,
          );
      } catch {
        // No audio here, or none allowed: the dice still roll.
      }
    },
    close() {
      closed = true;
      try {
        void ctx?.close().catch(() => undefined);
      } catch {
        // Already closed.
      }
      ctx = null;
    },
  };
}
