import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/", "site/", "node_modules/", "test-results/", "playwright-report/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ["tray/**/*.mjs", "playwright.config.mjs"], languageOptions: { globals: { process: "readonly", Buffer: "readonly", getComputedStyle: "readonly", customElements: "readonly", console: "readonly", URL: "readonly", document: "readonly", window: "readonly", localStorage: "readonly" } } },
  { files: ["scripts/**/*.mjs"], languageOptions: { globals: { console: "readonly", URL: "readonly", document: "readonly" } } },
);
