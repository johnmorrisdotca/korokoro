// The default theme, in the family's colours, with the tray itself for live examples.
import DefaultTheme from "vitepress/theme";

import "./family-tokens.css";
import "./site.css";
import LiveDice from "./LiveDice.vue";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("LiveDice", LiveDice);
  },
};
