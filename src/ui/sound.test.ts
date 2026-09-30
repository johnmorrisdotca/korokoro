import { describe, expect, it } from "vitest";

import { MAX_KNOCKS, createRollSound, knockTimes, type SoundData } from "./sound.ts";
import { SOUNDS } from "./sounds-data.ts";

/** Enough of the Web Audio API to see what a roll asks of it. */
function fakeAudio(options: { state?: string; decodeFails?: boolean; resumeFails?: boolean } = {}) {
  const log = { contexts: 0, decoded: 0, started: [] as { at: number; rate: number; seconds: number; skip: number }[], filters: 0, closed: 0 };
  class FakeContext {
    state = options.state ?? "running";
    currentTime = 10;
    sampleRate = 44100;
    destination = {};
    constructor() {
      log.contexts += 1;
    }
    createGain() {
      return { gain: { value: 1 }, connect() {} };
    }
    createBiquadFilter() {
      log.filters += 1;
      return { type: "", frequency: { value: 0 }, Q: { value: 0 }, connect() {} };
    }
    createBuffer(_channels: number, length: number, rate: number) {
      return { duration: length / rate, getChannelData: () => new Float32Array(length) };
    }
    createBufferSource() {
      const source = {
        buffer: null as { duration: number } | null,
        playbackRate: { value: 1 },
        connect() {},
        start(at: number, skip = 0) {
          log.started.push({ at, rate: source.playbackRate.value, seconds: source.buffer?.duration ?? 0, skip });
        },
      };
      return source;
    }
    decodeAudioData(data: ArrayBuffer) {
      log.decoded += 1;
      return options.decodeFails ? Promise.reject(new Error("cannot decode")) : Promise.resolve({ duration: data.byteLength > 5000 ? 0.78 : 0.3 });
    }
    resume() {
      if (options.resumeFails) return Promise.reject(new Error("not allowed"));
      this.state = "running";
      return Promise.resolve();
    }
    close() {
      log.closed += 1;
      return Promise.resolve();
    }
  }
  return { log, win: { AudioContext: FakeContext as unknown as typeof AudioContext, atob } };
}

const settle = () => new Promise((done) => setTimeout(done, 5));
const thrown = (dice: number, ms = 650) => ({ dice, ms, landings: Array.from({ length: dice }, (_, i) => ms - 100 + i * 10) });

describe("the sound of a roll", () => {
  it("is silence, and no error, where there is no audio at all", () => {
    expect(() => createRollSound(undefined).play(thrown(2))).not.toThrow();
    expect(() => createRollSound({}).play(thrown(2))).not.toThrow();
    expect(() => createRollSound(undefined).close()).not.toThrow();
  });

  it("is silence, and no error, where a context cannot be made", () => {
    class Refuses {
      constructor() {
        throw new Error("no audio device");
      }
    }
    expect(() => createRollSound({ AudioContext: Refuses as unknown as typeof AudioContext }).play(thrown(2))).not.toThrow();
  });

  it("plays one shake and a knock for each die landing", async () => {
    const { log, win } = fakeAudio();
    const sound = createRollSound(win, async () => ({ SOUNDS }));
    sound.play(thrown(3));
    await settle();
    expect(log.decoded).toBe(6);
    expect(log.started).toHaveLength(4);
    // The shake starts with the throw; the knocks come when the dice land.
    expect(log.started[0]).toMatchObject({ at: 10, seconds: 0.78, skip: 0 });
    expect(log.started.slice(1).map((s) => Number(s.at.toFixed(2)))).toEqual([10.55, 10.56, 10.57]);
    for (const s of log.started.slice(1)) expect(s.rate >= 0.88 && s.rate <= 1.18).toBe(true);
    expect(log.filters).toBe(0);
  });

  it(`plays ${MAX_KNOCKS} knocks for ten dice, not ten`, async () => {
    const { log, win } = fakeAudio();
    createRollSound(win, async () => ({ SOUNDS })).play(thrown(10));
    await settle();
    expect(log.started).toHaveLength(1 + MAX_KNOCKS);
    expect(knockTimes([1, 2, 3])).toEqual([1, 2, 3]);
    expect(knockTimes([0, 10, 20, 30, 40, 50, 60, 70, 80, 90])).toEqual([0, 20, 50, 70, 90]);
  });

  it("plays no shake for dice that land at once", async () => {
    const { log, win } = fakeAudio();
    createRollSound(win, async () => ({ SOUNDS })).play({ dice: 2, ms: 0, landings: [0, 0] });
    await settle();
    expect(log.started).toHaveLength(2);
  });

  it("loads the recordings once, on the first throw, and never before", async () => {
    let loads = 0;
    const { log, win } = fakeAudio();
    const sound = createRollSound(win, async () => {
      loads += 1;
      return { SOUNDS };
    });
    expect(loads).toBe(0);
    expect(log.contexts).toBe(0);
    sound.play(thrown(1));
    sound.play(thrown(1));
    await settle();
    expect(loads).toBe(1);
    expect(log.contexts).toBe(1);
    expect(log.decoded).toBe(6);
  });

  it.each([
    ["the recordings cannot be fetched", {}, () => Promise.reject(new Error("offline"))],
    ["the recordings cannot be decoded", { decodeFails: true }, async () => ({ SOUNDS: SOUNDS as SoundData })],
    ["the recordings are not audio", {}, async () => ({ SOUNDS: { "die-throw-1": "%%%" } as SoundData })],
  ])("falls back to a knock made in the browser when %s", async (_why, audio, load) => {
    const { log, win } = fakeAudio(audio);
    createRollSound(win, load).play(thrown(2));
    await settle();
    expect(log.started).toHaveLength(2);
    expect(log.filters).toBe(2);
  });

  it("stays silent while the browser holds the context still, and plays once it lets go", async () => {
    const held = fakeAudio({ state: "suspended", resumeFails: true });
    createRollSound(held.win, async () => ({ SOUNDS })).play(thrown(2));
    await settle();
    expect(held.log.started).toHaveLength(0);
    const freed = fakeAudio({ state: "suspended" });
    createRollSound(freed.win, async () => ({ SOUNDS })).play(thrown(2));
    await settle();
    expect(freed.log.started).toHaveLength(3);
  });

  it("is quiet after it is closed", async () => {
    const { log, win } = fakeAudio();
    const sound = createRollSound(win, async () => ({ SOUNDS }));
    sound.play(thrown(1));
    await settle();
    sound.close();
    sound.play(thrown(1));
    await settle();
    expect(log.closed).toBe(1);
    expect(log.started).toHaveLength(2);
  });
});
