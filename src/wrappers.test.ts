import { describe, expect, it } from "vitest";
import { createSSRApp, h } from "vue";
import { renderToString } from "vue/server-renderer";

import { KorokoroRoller, ROLLER_TAG, defineRoller } from "./element.ts";
import { DiceRoller } from "./vue.ts";

describe("the custom element, where there is no browser", () => {
  it("can be imported and asked to register, and does nothing", () => {
    expect(typeof HTMLElement).toBe("undefined");
    expect(typeof KorokoroRoller).toBe("function");
    expect(ROLLER_TAG).toBe("korokoro-roller");
    expect(() => defineRoller()).not.toThrow();
    expect(() => defineRoller("my-dice")).not.toThrow();
  });

  it("watches the attributes it documents", () => {
    expect(KorokoroRoller.observedAttributes).toEqual(["notation", "lang", "wide", "sound", "hold", "placeholder", "language-chooser", "storage", "storage-key", "animation-ms", "share-base", "query"]);
  });
});

describe("the Vue component, on a server", () => {
  it("renders an empty box and mounts nothing", async () => {
    const html = await renderToString(createSSRApp({ render: () => h(DiceRoller, { notation: "2d20kh1+5", wide: true, class: "dice" }) }));
    expect(html).toBe('<div class="dice"></div>');
  });

  it("takes the tray's options as props, and a Boolean left out stays left out", () => {
    const props = DiceRoller.props as Record<string, { default?: unknown }>;
    for (const name of ["notation", "spec", "locale", "strings", "storage", "storageKey", "query", "shareBase", "theme", "wide", "animationMs", "sound", "playSound", "hold", "placeholder", "languageChooser"]) expect(props, name).toHaveProperty(name);
    // Vue would make a missing Boolean false, and turn the sound off for everybody who did not ask.
    for (const name of ["wide", "sound", "hold", "placeholder", "languageChooser"]) expect(props[name]).toMatchObject({ type: Boolean, default: undefined });
    expect(DiceRoller.emits).toHaveProperty("roll");
  });
});
