<script setup>
// A tray on a documentation page: the real one, from the package as built, for the reader to roll.
// It is folded away until asked for, so that the page is its words first; it is drawn in the
// browser only, leaves the page its Space key, and keeps its history apart from the demo's.
import { DiceRoller } from "../../../dist/vue.js";

defineProps({ notation: String, query: String, open: Boolean });
</script>

<template>
  <details class="live-dice" :open="open" data-testid="live-dice">
    <summary>Try it here: {{ notation ?? "a game's dice" }}</summary>
    <ClientOnly>
      <DiceRoller :notation="notation" :query="query ?? '?'" storage-key="korokoro.docs" :sound="false" :keyboard="false" share-base="https://johnmorrisdotca.github.io/korokoro/" />
    </ClientOnly>
  </details>
</template>
