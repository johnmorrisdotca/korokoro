import { defineComponent, h, onBeforeUnmount, onMounted, ref, watch, type PropType } from "vue";

import type { Roll, RollSpec } from "./dice.ts";
import { parseNotation } from "./notation.ts";
import { mountRoller, type RollerHandle, type RollerOptions } from "./ui/mount.ts";

/**
 * The tray as a Vue component:
 *
 *   <DiceRoller notation="2d20kh1+5" wide @roll="save" />
 *
 * A thin wrapper. The tray is plain DOM, mounted into this component's own
 * element when Vue mounts it and taken back when it unmounts, so it renders
 * an empty box on the server and needs no plugin. The props are the tray's
 * options, with `notation` as a shorter way to give the dice. The dice and
 * the language are followed as they change; the other options are read when
 * it mounts, so give the component a new `key` to start over with different
 * ones. Each roll is a `roll` event. `roll()`, `history()`, `setSpec()` and
 * `setLocale()` are there on a template ref.
 */
// A Boolean prop left out is `undefined`, not `false`: the tray's own default then stands.
const flag = { type: Boolean, default: undefined } as const;

export const DiceRoller = defineComponent({
  name: "DiceRoller",
  props: {
    /** The dice showing at first, as notation: "2d20kh1+5". */
    notation: String,
    /** The dice showing at first, as a spec. `notation` wins when both are given. */
    spec: Object as PropType<Partial<RollSpec>>,
    locale: String,
    strings: Object as PropType<RollerOptions["strings"]>,
    /** Where the history is kept; `null` keeps nothing. */
    storage: { type: Object as PropType<RollerOptions["storage"]>, default: undefined },
    storageKey: String,
    query: String,
    shareBase: String,
    theme: Object as PropType<RollerOptions["theme"]>,
    wide: flag,
    /** How much of the tray is drawn: "small", "medium" or "large". */
    size: String as PropType<RollerOptions["size"]>,
    animationMs: Number,
    sound: flag,
    playSound: Function as PropType<RollerOptions["playSound"]>,
    hold: flag,
    placeholder: flag,
    keyboard: flag,
    languageChooser: flag,
  },
  emits: {
    /** Once each roll has landed. */
    roll: (roll: Roll) => typeof roll === "object",
  },
  setup(props, { emit, expose }) {
    const box = ref<HTMLElement | null>(null);
    let roller: RollerHandle | null = null;
    const dice = (): Partial<RollSpec> | undefined => (props.notation !== undefined ? (parseNotation(props.notation) ?? props.spec) : props.spec);

    onMounted(() => {
      if (box.value === null) return;
      const options: RollerOptions = { onRoll: (roll) => emit("roll", roll) };
      // Only what was given is passed on, so that everything left out keeps the tray's default.
      const given = props as unknown as Record<string, unknown>;
      for (const name of ["locale", "strings", "storage", "storageKey", "query", "shareBase", "theme", "wide", "size", "animationMs", "sound", "playSound", "hold", "placeholder", "keyboard", "languageChooser"] as const) {
        if (given[name] !== undefined) (options as Record<string, unknown>)[name] = given[name];
      }
      const spec = dice();
      if (spec !== undefined) options.spec = spec;
      roller = mountRoller(box.value, options);
    });
    onBeforeUnmount(() => {
      roller?.destroy();
      roller = null;
    });
    watch(
      () => props.locale,
      (locale) => {
        if (locale !== undefined) roller?.setLocale(locale);
      },
    );
    watch([() => props.notation, () => props.spec], () => {
      const spec = dice();
      if (spec !== undefined) roller?.setSpec(spec);
    });

    expose({
      /** Throw the dice showing. */
      roll: () => roller?.roll(),
      /** Every roll kept so far, oldest first. */
      history: (): readonly Roll[] => roller?.history() ?? [],
      setSpec: (spec: Partial<RollSpec>) => roller?.setSpec(spec),
      setLocale: (locale: string) => roller?.setLocale(locale),
    });
    return () => h("div", { ref: box });
  },
});
