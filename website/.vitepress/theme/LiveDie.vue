<script setup>
// One die on a documentation page, twice: the real one from the package as built. The first rolls
// when tapped; the second only shows a face and never rolls. Drawn in the browser only.
import { onBeforeUnmount, onMounted, ref } from "vue";

const rolls = ref(null);
const shows = ref(null);
const said = ref("");
const handles = [];

onMounted(async () => {
  const { mountDie } = await import("../../../dist/index.js");
  handles.push(mountDie(rolls.value, { sides: 20, size: "large", onRoll: (face) => (said.value = `Rolled ${face}.`) }));
  handles.push(mountDie(shows.value, { sides: 6, face: 5, size: "large", rollable: false }));
});
onBeforeUnmount(() => handles.forEach((handle) => handle.destroy()));
</script>

<template>
  <div class="live-die" data-testid="live-die">
    <figure><div ref="rolls" /><figcaption>Rolls: tap it</figcaption></figure>
    <figure><div ref="shows" /><figcaption>Shows a face, never rolls</figcaption></figure>
    <p class="live-die-said" aria-live="polite">{{ said }}</p>
  </div>
</template>
