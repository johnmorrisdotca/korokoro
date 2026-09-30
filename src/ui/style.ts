/**
 * The tray's look, injected once per document. Every colour is a CSS variable
 * with a default, so a host page restyles it by setting variables on the
 * element it mounts into (or any ancestor) and never by overriding rules.
 */
export const STYLE_ID = "korokoro-style";

export const CSS = `
.kk-root {
  --kk-surface: #fbf8f1; --kk-ink: #1f2320; --kk-muted: #6b6f68; --kk-rule: #ddd6c6;
  --kk-felt: #2f5d4a; --kk-felt-deep: #1f4135; --kk-felt-ink: #f3efe4;
  --kk-accent: #b5452c; --kk-accent-ink: #fff; --kk-good: #2f7a4f; --kk-bad: #b5452c;
  --kk-die: #fffdf7; --kk-die-edge: #c9bfa9; --kk-die-ink: #1f2320; --kk-pip-one: #b5452c;
  --kk-radius: 16px; --kk-font: inherit;
  font-family: var(--kk-font); color: var(--kk-ink); display: grid; gap: 14px;
  -webkit-tap-highlight-color: transparent;
}
@media (prefers-color-scheme: dark) {
  .kk-root:not([data-theme="light"]) {
    --kk-surface: #1d201e; --kk-ink: #ece8dc; --kk-muted: #a09d93; --kk-rule: #3a3d38;
    --kk-felt: #214337; --kk-felt-deep: #152c24; --kk-die: #f4efe2; --kk-die-edge: #8f8778;
  }
}
.kk-root *, .kk-root *::before, .kk-root *::after { box-sizing: border-box; }
.kk-root button { font: inherit; color: inherit; cursor: pointer; }
.kk-root button:focus-visible, .kk-root input:focus-visible, .kk-tray:focus-visible { outline: 3px solid var(--kk-accent); outline-offset: 2px; }

.kk-controls { display: grid; gap: 10px; }
.kk-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; }
.kk-label { font-size: 0.75rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--kk-muted); min-width: 3.2rem; }
.kk-seg { display: inline-flex; flex-wrap: wrap; gap: 4px; background: var(--kk-surface); border: 1px solid var(--kk-rule); border-radius: 999px; padding: 3px; }
.kk-seg button { border: 0; background: transparent; border-radius: 999px; min-width: 40px; min-height: 36px; padding: 0 10px; font-weight: 600; display: inline-flex; align-items: center; gap: 5px; transition: background .15s, color .15s; }
.kk-seg button[aria-pressed="true"] { background: var(--kk-ink); color: var(--kk-surface); }
.kk-seg button:hover:not([aria-pressed="true"]) { background: color-mix(in srgb, var(--kk-ink) 8%, transparent); }
.kk-icon { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 9; stroke-linejoin: round; }
.kk-stepper { display: inline-flex; align-items: center; border: 1px solid var(--kk-rule); border-radius: 999px; background: var(--kk-surface); }
.kk-stepper button { border: 0; background: transparent; width: 38px; height: 36px; font-size: 1.2rem; border-radius: 999px; }
.kk-stepper output { min-width: 2.6rem; text-align: center; font-weight: 700; font-variant-numeric: tabular-nums; }
.kk-notation { display: inline-flex; gap: 6px; align-items: center; }
.kk-notation input { width: 9.5rem; min-height: 36px; border: 1px solid var(--kk-rule); border-radius: 10px; padding: 0 10px; background: var(--kk-surface); color: var(--kk-ink); font: inherit; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.kk-notation input[aria-invalid="true"] { border-color: var(--kk-bad); }
.kk-error { color: var(--kk-bad); font-size: 0.8rem; }

.kk-tray { position: relative; border: 0; width: 100%; min-height: 250px; border-radius: calc(var(--kk-radius) + 6px); padding: 26px 16px 18px; display: grid; place-items: center; gap: 12px;
  background: radial-gradient(120% 90% at 50% 20%, var(--kk-felt) 0%, var(--kk-felt-deep) 100%); color: var(--kk-felt-ink);
  box-shadow: inset 0 2px 18px rgba(0,0,0,.35), inset 0 0 0 6px rgba(0,0,0,.12), 0 1px 0 rgba(255,255,255,.4); touch-action: manipulation; user-select: none; overflow: hidden; }
.kk-tray::after { content: ""; position: absolute; inset: 0; pointer-events: none; opacity: .12; background-image: radial-gradient(rgba(255,255,255,.5) 1px, transparent 1px); background-size: 5px 5px; }
.kk-dice { display: flex; flex-wrap: wrap; justify-content: center; gap: clamp(8px, 2.5vw, 20px); max-width: 560px; }
.kk-die { width: clamp(64px, 18vw, 96px); aspect-ratio: 1; position: relative; filter: drop-shadow(0 7px 6px rgba(0,0,0,.35)); transition: opacity .25s, transform .25s; }
.kk-dice[data-count="1"] .kk-die { width: clamp(110px, 34vw, 150px); }
.kk-dice[data-count="2"] .kk-die { width: clamp(90px, 28vw, 124px); }
.kk-dice[data-count="4"] .kk-die, .kk-dice[data-count="5"] .kk-die { width: clamp(48px, 14vw, 92px); }
.kk-die-svg { width: 100%; height: 100%; overflow: visible; }
.kk-body { fill: var(--kk-die); stroke: var(--kk-die-edge); stroke-width: 3; }
.kk-shine { fill: none; stroke: rgba(255,255,255,.7); stroke-width: 2; }
.kk-facet { fill: none; stroke: var(--kk-die-edge); stroke-width: 2; opacity: .8; }
.kk-pip { fill: var(--kk-die-ink); }
.kk-pip-one { fill: var(--kk-pip-one); }
.kk-number { fill: var(--kk-die-ink); paint-order: stroke; stroke: var(--kk-die); stroke-width: 7px; stroke-linejoin: round; font-weight: 800; font-family: ui-rounded, "SF Pro Rounded", system-ui, sans-serif; }
.kk-underline { fill: var(--kk-die-ink); }
.kk-die[data-kept="false"] { opacity: .38; transform: scale(.88); }
.kk-die[data-kept="false"]::after { content: ""; position: absolute; left: 12%; right: 12%; top: 50%; height: 3px; background: var(--kk-felt-ink); border-radius: 3px; transform: rotate(-20deg); }
.kk-die[data-hit="crit"] .kk-body { stroke: #e0b43b; stroke-width: 6; }
.kk-die[data-hit="fumble"] .kk-body { stroke: var(--kk-bad); stroke-width: 6; }
.kk-tumble { animation: kk-tumble var(--kk-t, 700ms) cubic-bezier(.2,.7,.3,1) both; }
.kk-land { animation: kk-land 320ms cubic-bezier(.3,1.6,.5,1) both; }
@keyframes kk-tumble {
  0% { transform: translate(var(--kk-x0), var(--kk-y0)) rotate(var(--kk-r0)) scale(.7); }
  35% { transform: translate(calc(var(--kk-x0) * -.4), calc(var(--kk-y0) * -.3)) rotate(calc(var(--kk-r0) * -.6)) scale(1.08); }
  70% { transform: translate(calc(var(--kk-x0) * .15), 4px) rotate(calc(var(--kk-r0) * .2)) scale(.97); }
  100% { transform: none; }
}
@keyframes kk-land { 0% { transform: scale(.92); } 60% { transform: scale(1.06); } 100% { transform: none; } }
.kk-root .kk-tray, .kk-root .kk-tray .kk-hint { color: var(--kk-felt-ink); }
.kk-hint { font-size: .85rem; opacity: .85; letter-spacing: .02em; display: inline-flex; align-items: center; gap: 6px; }
@media (hover: none) { .kk-hint kbd { display: none; } }
.kk-hint kbd { font: inherit; font-size: .72rem; border: 1px solid rgba(255,255,255,.45); border-radius: 5px; padding: 0 5px; }
.kk-tray[data-rolling="true"] .kk-hint { visibility: hidden; }

.kk-result { display: grid; gap: 6px; justify-items: center; text-align: center; min-height: 118px; }
.kk-total { font-size: clamp(3rem, 12vw, 4.6rem); line-height: 1; font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: -.02em; }
.kk-total small { font-size: .9rem; font-weight: 600; color: var(--kk-muted); letter-spacing: .06em; text-transform: uppercase; display: block; margin-bottom: 4px; }
.kk-sum { font-variant-numeric: tabular-nums; color: var(--kk-muted); font-size: .95rem; }
.kk-sum s { opacity: .6; }
.kk-badge { display: inline-block; border-radius: 999px; padding: 2px 10px; font-weight: 700; font-size: .8rem; background: var(--kk-ink); color: var(--kk-surface); }
.kk-badge[data-tone="good"] { background: #e0b43b; color: #1f2320; }
.kk-badge[data-tone="bad"] { background: var(--kk-bad); color: #fff; }
.kk-luck { width: min(320px, 100%); display: grid; gap: 4px; font-size: .85rem; color: var(--kk-muted); }
.kk-meter { height: 8px; border-radius: 99px; background: linear-gradient(90deg, var(--kk-bad), #e0b43b 50%, var(--kk-good)); position: relative; }
.kk-meter i { position: absolute; top: -4px; width: 4px; height: 16px; border-radius: 3px; background: var(--kk-ink); transform: translateX(-50%); box-shadow: 0 0 0 2px var(--kk-surface); transition: left .4s cubic-bezier(.3,1.3,.5,1); }
.kk-actions { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
.kk-link { border: 1px solid var(--kk-rule); background: var(--kk-surface); border-radius: 999px; min-height: 34px; padding: 0 14px; font-size: .85rem; }
.kk-link[data-danger="true"] { border-color: var(--kk-bad); color: var(--kk-bad); }

.kk-panels { border: 1px solid var(--kk-rule); border-radius: var(--kk-radius); background: var(--kk-surface); overflow: hidden; }
.kk-tabs { display: flex; border-bottom: 1px solid var(--kk-rule); }
.kk-tabs button { flex: 1; border: 0; background: transparent; min-height: 44px; font-weight: 600; color: var(--kk-muted); border-bottom: 3px solid transparent; }
.kk-tabs button[aria-selected="true"] { color: var(--kk-ink); border-bottom-color: var(--kk-accent); }
.kk-panel { padding: 14px; display: grid; gap: 14px; }
.kk-empty { color: var(--kk-muted); text-align: center; padding: 18px 0; }
.kk-history { list-style: none; margin: 0; padding: 0; display: grid; max-height: 360px; overflow-y: auto; }
.kk-history li { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 4px 12px; padding: 8px 2px; border-bottom: 1px solid var(--kk-rule); }
.kk-history li:last-child { border-bottom: 0; }
.kk-history time { font-size: .75rem; color: var(--kk-muted); font-variant-numeric: tabular-nums; }
.kk-history code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .8rem; color: var(--kk-muted); }
.kk-history .kk-mini { display: flex; gap: 3px; flex-wrap: wrap; }
.kk-history .kk-mini span { min-width: 22px; height: 22px; border-radius: 6px; border: 1px solid var(--kk-rule); display: inline-grid; place-items: center; font-size: .72rem; font-weight: 700; padding: 0 3px; font-variant-numeric: tabular-nums; }
.kk-history .kk-mini span[data-kept="false"] { opacity: .4; text-decoration: line-through; }
.kk-history strong { font-size: 1.25rem; font-variant-numeric: tabular-nums; min-width: 2.5rem; text-align: right; }
.kk-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
.kk-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 8px; }
.kk-card { border: 1px solid var(--kk-rule); border-radius: 12px; padding: 10px 12px; display: grid; gap: 2px; }
.kk-card b { font-size: 1.35rem; font-variant-numeric: tabular-nums; }
.kk-card span { font-size: .75rem; color: var(--kk-muted); }
.kk-chart { display: grid; gap: 6px; }
.kk-chart h4 { margin: 0; font-size: .85rem; font-weight: 600; }
.kk-chart p { margin: 0; font-size: .8rem; color: var(--kk-muted); }
.kk-bars { display: flex; align-items: flex-end; gap: 2px; height: 120px; padding-top: 6px; border-bottom: 1px solid var(--kk-rule); }
.kk-bar { flex: 1; min-width: 2px; position: relative; height: 100%; display: flex; align-items: flex-end; }
.kk-bar > b { display: block; width: 100%; background: var(--kk-felt); border-radius: 3px 3px 0 0; transition: height .35s ease; }
.kk-bar > i { position: absolute; left: 0; right: 0; height: 2px; background: var(--kk-accent); }
.kk-bar[data-now="true"] > b { background: var(--kk-accent); }
.kk-axis { display: flex; justify-content: space-between; font-size: .7rem; color: var(--kk-muted); font-variant-numeric: tabular-nums; }
.kk-target { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.kk-target input { width: 5rem; min-height: 36px; border: 1px solid var(--kk-rule); border-radius: 10px; padding: 0 10px; background: var(--kk-surface); color: var(--kk-ink); font: inherit; font-weight: 700; }
.kk-big { font-size: 2rem; font-weight: 800; font-variant-numeric: tabular-nums; }
.kk-settings { display: grid; gap: 8px; font-size: .85rem; }
.kk-settings p { margin: 0; color: var(--kk-muted); }
.kk-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (min-width: 900px) {
  .kk-root[data-wide="true"] { grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); align-items: start; }
  .kk-root[data-wide="true"] > .kk-panels { grid-column: 2; grid-row: 1 / span 3; }
}
@media (prefers-reduced-motion: reduce) { .kk-tumble, .kk-land { animation: none; } }
`;

export function injectStyle(doc: Document): void {
  if (doc.getElementById(STYLE_ID) !== null) return;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  doc.head.append(style);
}
