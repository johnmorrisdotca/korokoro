// Proves the claim in the README: the packed package works in React, Vue, Svelte, Angular, as a
// custom element and in a plain page, with nothing for the consumer to configure. It packs the package, makes a small
// project for each in a scratch folder, installs the tarball and each framework's own tools
// there (never here: the package has no dependencies), and builds it. With KOROKORO_BROWSER
// set to the path of a Playwright module it also opens each built page and rolls the dice.
//
//   pnpm build && node scripts/check-frameworks.mjs [scratch folder]
//
// Run it before a release that names a framework. It needs the network and a few minutes.
import { execFileSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { extname, join, resolve } from "node:path";
import process from "node:process";

const root = resolve(process.argv[2] ?? mkdtempSync(join(tmpdir(), "korokoro-frameworks-")));
rmSync(root, { recursive: true, force: true });
mkdirSync(root, { recursive: true });
const run = (cwd, command, args) => execFileSync(command, args, { cwd, stdio: "pipe", shell: process.platform === "win32", env: { ...process.env, NG_CLI_ANALYTICS: "false", NEXT_TELEMETRY_DISABLED: "1" } }).toString();
const write = (dir, files) => {
  for (const [name, text] of Object.entries(files)) {
    mkdirSync(join(dir, name, ".."), { recursive: true });
    writeFileSync(join(dir, name), typeof text === "string" ? text : JSON.stringify(text, null, 2));
  }
};

run(process.cwd(), "pnpm", ["pack", "--pack-destination", root]);
const tarball = join(root, readdirSync(root).find((name) => name.endsWith(".tgz")));
const korokoro = `file:${tarball}`;
const page = (script) => `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>korokoro</title></head><body><div id="app"></div>${script}</body></html>`;

const projects = {
  // The tray in a component's mount hook, which is all any framework needs.
  vue: {
    out: "dist",
    files: {
      "package.json": { name: "check-vue", private: true, type: "module", dependencies: { "@johnmorrisdotca/korokoro": korokoro, vue: "^3.5.0" }, devDependencies: { vite: "^7.0.0", "@vitejs/plugin-vue": "^6.0.0" } },
      "vite.config.js": `import vue from "@vitejs/plugin-vue";\nexport default { base: "./", plugins: [vue()] };\n`,
      "index.html": page(`<script type="module" src="/src/main.js"></script>`),
      "src/main.js": `import { createApp } from "vue";\nimport App from "./App.vue";\ncreateApp(App).mount("#app");\n`,
      "src/App.vue": `<script setup>
import { ref } from "vue";
import { DiceRoller } from "@johnmorrisdotca/korokoro/vue";

const total = ref(null);
</script>

<template>
  <DiceRoller notation="1d20" query="?seed=vue" @roll="(roll) => (total = roll.total)" />
  <p id="total">{{ total }}</p>
</template>
`,
    },
  },
  // The custom element, in a page with a bundler and no framework.
  element: {
    out: "dist",
    files: {
      "package.json": { name: "check-element", private: true, type: "module", dependencies: { "@johnmorrisdotca/korokoro": korokoro }, devDependencies: { vite: "^7.0.0" } },
      "vite.config.js": `export default { base: "./" };\n`,
      "index.html": page(`<korokoro-roller notation="1d20" query="?seed=element"></korokoro-roller><p id="total"></p><script type="module" src="/src/main.js"></script>`),
      "src/main.js": `import { defineRoller } from "@johnmorrisdotca/korokoro/element";

defineRoller();
document.addEventListener("korokoro-roll", (event) => (document.getElementById("total").textContent = event.detail.total));
`,
    },
  },
  // The custom element registered by being imported: a bundler must keep the import, which package.json's sideEffects says it has to.
  define: {
    out: "dist",
    files: {
      "package.json": { name: "check-define", private: true, type: "module", dependencies: { "@johnmorrisdotca/korokoro": korokoro }, devDependencies: { vite: "^7.0.0" } },
      "vite.config.js": `export default { base: "./" };\n`,
      "index.html": page(`<korokoro-roller notation="1d20" query="?seed=define"></korokoro-roller><p id="total"></p><script type="module" src="/src/main.js"></script>`),
      "src/main.js": `import "@johnmorrisdotca/korokoro/element/define";

document.addEventListener("korokoro-roll", (event) => (document.getElementById("total").textContent = event.detail.total));
`,
    },
  },
  svelte: {
    out: "dist",
    files: {
      "package.json": { name: "check-svelte", private: true, type: "module", dependencies: { "@johnmorrisdotca/korokoro": korokoro, svelte: "^5.0.0" }, devDependencies: { vite: "^7.0.0", "@sveltejs/vite-plugin-svelte": "^6.0.0" } },
      "vite.config.js": `import { svelte } from "@sveltejs/vite-plugin-svelte";\nexport default { base: "./", plugins: [svelte()] };\n`,
      "index.html": page(`<script type="module" src="/src/main.js"></script>`),
      "src/main.js": `import { mount } from "svelte";\nimport App from "./App.svelte";\nmount(App, { target: document.getElementById("app") });\n`,
      "src/App.svelte": `<script>
  import { onMount } from "svelte";
  import { mountRoller } from "@johnmorrisdotca/korokoro";

  let box;
  let total = $state(null);
  onMount(() => {
    const roller = mountRoller(box, { spec: { count: 1, sides: 20 }, query: "?seed=svelte", onRoll: (roll) => (total = roll.total) });
    return () => roller.destroy();
  });
</script>

<div bind:this={box}></div>
<p id="total">{total}</p>
`,
    },
  },
  angular: {
    out: "dist/check-angular/browser",
    files: {
      "package.json": {
        name: "check-angular",
        private: true,
        dependencies: { "@johnmorrisdotca/korokoro": korokoro, "@angular/common": "^20.0.0", "@angular/compiler": "^20.0.0", "@angular/core": "^20.0.0", "@angular/platform-browser": "^20.0.0", rxjs: "^7.8.0", tslib: "^2.8.0" },
        devDependencies: { "@angular/build": "^20.0.0", "@angular/cli": "^20.0.0", "@angular/compiler-cli": "^20.0.0", typescript: "~5.8.0" },
      },
      "angular.json": {
        version: 1,
        projects: {
          "check-angular": {
            projectType: "application",
            root: "",
            sourceRoot: "src",
            architect: { build: { builder: "@angular/build:application", options: { outputPath: "dist/check-angular", index: "src/index.html", browser: "src/main.ts", tsConfig: "tsconfig.json", baseHref: "./" }, configurations: { production: {} }, defaultConfiguration: "production" } },
          },
        },
      },
      "tsconfig.json": { compilerOptions: { target: "ES2022", module: "ES2022", moduleResolution: "bundler", strict: true, experimentalDecorators: true, skipLibCheck: true, lib: ["ES2022", "dom"] }, files: ["src/main.ts"] },
      "src/index.html": page(`<check-root></check-root>`),
      "src/main.ts": `import { Component, ElementRef, OnDestroy, afterNextRender, provideZonelessChangeDetection, signal, viewChild } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { mountRoller, type RollerHandle } from "@johnmorrisdotca/korokoro";

@Component({
  selector: "check-root",
  template: \`<div #box></div><p id="total">{{ total() }}</p>\`,
})
class App implements OnDestroy {
  private box = viewChild.required<ElementRef<HTMLElement>>("box");
  private roller?: RollerHandle;
  total = signal<number | null>(null);
  constructor() {
    afterNextRender(() => {
      this.roller = mountRoller(this.box().nativeElement, { spec: { count: 1, sides: 20 }, query: "?seed=angular", onRoll: (roll) => this.total.set(roll.total) });
    });
  }
  ngOnDestroy() {
    this.roller?.destroy();
  }
}

bootstrapApplication(App, { providers: [provideZonelessChangeDetection()] });
`,
    },
  },
  react: {
    out: "dist",
    files: {
      "package.json": { name: "check-react", private: true, type: "module", dependencies: { "@johnmorrisdotca/korokoro": korokoro, react: "^19.0.0", "react-dom": "^19.0.0" }, devDependencies: { vite: "^7.0.0", "@vitejs/plugin-react": "^5.0.0" } },
      "vite.config.js": `import react from "@vitejs/plugin-react";\nexport default { base: "./", plugins: [react()] };\n`,
      "index.html": page(`<script type="module" src="/src/main.jsx"></script>`),
      "src/main.jsx": `import { useState } from "react";
import { createRoot } from "react-dom/client";
import { DiceRoller } from "@johnmorrisdotca/korokoro/react";

function App() {
  const [total, setTotal] = useState(null);
  return (
    <>
      <DiceRoller notation="1d20" query="?seed=react" onRoll={(roll) => setTotal(roll.total)} />
      <p id="total">{total}</p>
    </>
  );
}
createRoot(document.getElementById("app")).render(<App />);
`,
    },
  },
  // No framework and no bundler: a script tag and the files as they are published.
  plain: {
    out: ".",
    build: (dir) => {
      run(dir, "npm", ["install", "--no-audit", "--no-fund", "--ignore-scripts"]);
      cpSync(join(dir, "node_modules/@johnmorrisdotca/korokoro"), join(dir, "korokoro"), { recursive: true, dereference: true });
      rmSync(join(dir, "node_modules"), { recursive: true, force: true });
    },
    files: {
      "package.json": { name: "check-plain", private: true, dependencies: { "@johnmorrisdotca/korokoro": korokoro } },
      "index.html": page(`<p id="total"></p><script type="module">
import { mountRoller } from "./korokoro/dist/index.js";
mountRoller(document.getElementById("app"), { spec: { count: 1, sides: 20 }, query: "?seed=plain", onRoll: (roll) => (document.getElementById("total").textContent = roll.total) });
</script>`),
    },
  },
};

const only = process.env.KOROKORO_FRAMEWORKS?.split(",");
const built = [];
for (const [name, project] of Object.entries(projects)) {
  if (only !== undefined && !only.includes(name)) continue;
  const dir = join(root, name);
  write(dir, project.files);
  const started = Date.now();
  try {
    if (project.build !== undefined) project.build(dir);
    else {
      run(dir, "npm", ["install", "--no-audit", "--no-fund"]);
      run(dir, "npx", name === "angular" ? ["ng", "build"] : ["vite", "build"]);
    }
    if (!existsSync(join(dir, project.out, "index.html"))) throw new Error(`no index.html in ${project.out}`);
    built.push([name, join(dir, project.out)]);
    console.log(`built   ${name.padEnd(8)} in ${Math.round((Date.now() - started) / 1000)} s`);
  } catch (error) {
    console.log(`FAILED  ${name}: ${String(error.stderr ?? error.stdout ?? error.message).split("\n").slice(-12).join("\n")}`);
    process.exitCode = 1;
  }
}

// Open each built page in a browser and roll: the tray has to mount, throw the dice and hand the roll back.
if (process.env.KOROKORO_BROWSER !== undefined) {
  const { chromium, webkit } = createRequire(import.meta.url)(process.env.KOROKORO_BROWSER);
  const types = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json" };
  for (const [engine, launcher] of [["chromium", chromium], ["webkit", webkit]]) {
    const browser = await launcher.launch();
    for (const [name, out] of built) {
      const context = await browser.newContext({ viewport: { width: 390, height: 800 } });
      const tab = await context.newPage();
      const errors = [];
      let lazy = 0;
      tab.on("pageerror", (error) => errors.push(String(error)));
      await tab.route("http://check.test/**", (route) => {
        let file = join(out, decodeURIComponent(new URL(route.request().url()).pathname));
        if (existsSync(file) && statSync(file).isDirectory()) file = join(file, "index.html");
        if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
        const body = readFileSync(file);
        if (body.includes("AAAAHGZ0eXBNNEEg")) lazy += 1;
        return route.fulfill({ body, contentType: types[extname(file)] ?? "application/octet-stream" });
      });
      await tab.goto("http://check.test/");
      await tab.waitForSelector('[data-testid="kk-tray"]');
      const before = lazy;
      await tab.locator('[data-testid="kk-tray"]').click();
      await tab.waitForFunction(() => document.getElementById("total").textContent !== "", null, { timeout: 5000 });
      const total = await tab.locator("#total").textContent();
      const shown = await tab.locator('[data-testid="kk-total"]').evaluate((el) => el.lastChild.textContent);
      // Every project asks for one d20, each in its own way: a spec, a notation prop, an attribute.
      const dice = await tab.locator('[data-testid="kk-notation"]').inputValue();
      const ok = errors.length === 0 && total === shown && dice === "1d20" && Number(total) >= 1 && Number(total) <= 20 && before === 0;
      console.log(`${ok ? "rolled " : "FAILED "} ${name.padEnd(8)} in ${engine}: ${dice}, the roll handed back ${total}, the tray shows ${shown}; sound fetched before the roll ${before}, after ${lazy}${errors.length > 0 ? ` ${errors.join("; ")}` : ""}`);
      if (!ok) process.exitCode = 1;
      await context.close();
    }
    await browser.close();
  }
}
console.log(`scratch projects are in ${root}`);
