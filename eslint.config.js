import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist/", "site/", "node_modules/", "test-results/", "playwright-report/", "website/guide/", "website/reference/", "website/public/", "website/.vitepress/cache/"] },
  { ignores: [".readme-examples/"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  { files: ["tray/**/*.mjs", "playwright.config.mjs"], languageOptions: { globals: { process: "readonly", Buffer: "readonly", Image: "readonly", OffscreenCanvas: "readonly", getComputedStyle: "readonly", customElements: "readonly", console: "readonly", URL: "readonly", document: "readonly", window: "readonly", localStorage: "readonly" } } },
  { files: ["website/**/*.mjs"], languageOptions: { globals: { URL: "readonly" } } },
  { files: ["scripts/**/*.mjs"], languageOptions: { globals: { console: "readonly", URL: "readonly", document: "readonly", location: "readonly", localStorage: "readonly", navigator: "readonly", URLSearchParams: "readonly" } } },
  { files: ["scripts/readme-pictures.mjs", "scripts/readme-pictures-lib.mjs"], languageOptions: { globals: { console: "readonly", process: "readonly", URL: "readonly", document: "readonly", window: "readonly", getComputedStyle: "readonly" } } },
);
