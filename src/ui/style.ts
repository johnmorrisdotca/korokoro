/**
 * The tray's look, injected once per document. Every colour is a CSS variable
 * with a default, so a host page restyles it by setting variables on the
 * element it mounts into (or any ancestor) and never by overriding rules.
 */
export const STYLE_ID = "korokoro-style";

/** The tray's stylesheet. */
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
/* Long notation, a custom die's faces above all, wraps where it must and never widens the page. */
.kk-root > *, .kk-controls > *, .kk-panel > *, .kk-result > * { min-width: 0; max-width: 100%; }
.kk-total small, .kk-sum, .kk-chart h4, .kk-chart p, .kk-history code, .kk-settings summary, .kk-error { overflow-wrap: anywhere; }
.kk-root button:focus-visible, .kk-root input:focus-visible, .kk-tray:focus-visible { outline: 3px solid var(--kk-accent); outline-offset: 2px; }

.kk-controls { display: grid; gap: 10px; }
.kk-row { display: flex; flex-wrap: wrap; align-items: center; gap: 8px 12px; }
.kk-label { font-size: 0.75rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--kk-muted); min-width: 3.2rem; }
.kk-seg { display: inline-flex; flex-wrap: wrap; gap: 4px; background: var(--kk-surface); border: 1px solid var(--kk-rule); border-radius: 999px; padding: 3px; }
/* Ten counts are one row where there is room and two rows of five on a phone, never a ragged wrap. */
.kk-seg[data-testid="kk-count"] { display: inline-grid; grid-template-columns: repeat(10, auto); }
@media (max-width: 540px) { .kk-seg[data-testid="kk-count"] { grid-template-columns: repeat(5, auto); } }
.kk-seg { border-radius: 26px; }
.kk-seg button { border: 0; background: transparent; border-radius: 999px; min-width: 44px; min-height: 44px; padding: 0 10px; font-weight: 600; display: inline-flex; align-items: center; gap: 5px; transition: background .15s, color .15s; }
.kk-seg button[aria-pressed="true"] { background: var(--kk-ink); color: var(--kk-surface); }
.kk-seg button:hover:not([aria-pressed="true"]):not(:disabled) { background: color-mix(in srgb, var(--kk-ink) 8%, transparent); }
.kk-root button:disabled { opacity: .32; cursor: default; }
/* The pool: four places, one for each kind of dice a roll may hold, so it is one line however many are in it. */
.kk-pool { flex: 1 1 100%; display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 6px; min-height: 44px; }
.kk-chip { min-width: 0; min-height: 44px; border: 1px solid var(--kk-rule); background: var(--kk-surface); border-radius: 999px; padding: 0 10px; font-weight: 700; font-size: .9rem; font-variant-numeric: tabular-nums; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
.kk-chip span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kk-chip i { font-style: normal; font-weight: 800; color: var(--kk-muted); }
.kk-chip[data-lit="true"] { border-color: var(--kk-ink); }
/* The dice the tray opened with, before anybody has chosen: a dashed outline and quieter ink. */
.kk-chip[data-suggested="true"] { border-style: dashed; border-color: var(--kk-muted); color: var(--kk-muted); background: transparent; }
.kk-chip:hover { border-color: var(--kk-bad); }
.kk-chip:hover i { color: var(--kk-bad); }
.kk-seg .kk-clear { margin-left: auto; font-weight: 600; font-size: .85rem; color: var(--kk-muted); padding: 0 14px; }
/* The eight dice and Clear on one line where the tray is wide, and two lines on a phone. */
.kk-seg[data-testid="kk-sides"] { display: flex; gap: 2px; }
.kk-seg[data-testid="kk-sides"] button { padding: 0 8px; }
.kk-seg[data-testid="kk-sides"] .kk-clear { padding: 0 10px; }
.kk-seg button[data-in="true"]:not([aria-pressed="true"]) { box-shadow: inset 0 0 0 1px var(--kk-rule); }
.kk-icon { width: 15px; height: 15px; fill: none; stroke: currentColor; stroke-width: 9; stroke-linejoin: round; }
.kk-stepper { display: inline-flex; align-items: center; border: 1px solid var(--kk-rule); border-radius: 999px; background: var(--kk-surface); }
.kk-stepper button { border: 0; background: transparent; width: 44px; height: 44px; font-size: 1.2rem; border-radius: 999px; }
.kk-stepper output { min-width: 2.6rem; text-align: center; font-weight: 700; font-variant-numeric: tabular-nums; }
.kk-notation { display: inline-flex; gap: 6px; align-items: center; }
.kk-notation { flex: 1 1 8rem; min-width: 0; max-width: 16rem; }
.kk-field { min-height: 44px; border: 1px solid var(--kk-rule); border-radius: 10px; padding: 0 10px; background: var(--kk-surface); color: var(--kk-ink); font: inherit; min-width: 0; }
.kk-notation input { width: 100%; min-height: 44px; border: 1px solid var(--kk-rule); border-radius: 10px; padding: 0 10px; background: var(--kk-surface); color: var(--kk-ink); font: inherit; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.kk-notation input[aria-invalid="true"] { border-color: var(--kk-bad); }
.kk-error { color: var(--kk-bad); font-size: 0.8rem; }
.kk-formula { flex-basis: 100%; }

/* The felt is the picture; the tray is a button filling it, under the dice, so a tap anywhere but on a held die rolls. */
.kk-felt { position: relative; min-width: 0; min-height: 250px; border-radius: calc(var(--kk-radius) + 6px); padding: 26px 16px 18px; display: grid; place-items: center; align-content: center; gap: 12px;
  background: radial-gradient(120% 90% at 50% 20%, var(--kk-felt) 0%, var(--kk-felt-deep) 100%); color: var(--kk-felt-ink);
  box-shadow: inset 0 2px 18px rgba(0,0,0,.35), inset 0 0 0 6px rgba(0,0,0,.12), 0 1px 0 rgba(255,255,255,.4); touch-action: manipulation; user-select: none; -webkit-user-select: none; overflow: hidden; }
.kk-felt::after { content: ""; position: absolute; inset: 0; z-index: 2; pointer-events: none; opacity: .12; background-image: radial-gradient(rgba(255,255,255,.5) 1px, transparent 1px); background-size: 5px 5px; }
.kk-tray { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; padding: 0; background: transparent; border-radius: inherit; }
.kk-root .kk-tray:focus-visible { outline-offset: -6px; }
.kk-root .kk-tray:disabled { opacity: 1; }
.kk-dice, .kk-hint { position: relative; z-index: 1; pointer-events: none; }
.kk-mute, .kk-release { position: absolute; top: 8px; z-index: 3; min-height: 44px; border: 0; display: grid; place-items: center; background: transparent; color: var(--kk-felt-ink); }
.kk-mute { right: 8px; width: 44px; border-radius: 50%; opacity: .8; }
.kk-release { left: 8px; padding: 0 14px; border-radius: 999px; font-size: .85rem; font-weight: 600; background: rgba(0,0,0,.28); box-shadow: inset 0 0 0 1px rgba(255,255,255,.35); }
.kk-release[hidden] { display: none; }
.kk-root .kk-mute, .kk-root .kk-release { color: var(--kk-felt-ink); }
.kk-mute:hover { background: rgba(0,0,0,.18); opacity: 1; }
.kk-mute[aria-pressed="false"] { opacity: .55; }
.kk-dice { --kk-gap: clamp(8px, 2.5vw, 20px); display: flex; flex-wrap: wrap; justify-content: center; gap: var(--kk-gap); max-width: 560px; }
.kk-die { width: clamp(64px, 18vw, 96px); aspect-ratio: 1; position: relative; display: block; border: 0; padding: 0; background: transparent; filter: drop-shadow(0 7px 6px rgba(0,0,0,.35)); transition: opacity .25s, transform .25s; }
.kk-dice[data-count="1"] .kk-die { width: clamp(110px, 34vw, 150px); }
.kk-dice[data-count="2"] .kk-die { width: clamp(90px, 28vw, 124px); }
.kk-dice[data-count="4"] .kk-die, .kk-dice[data-count="5"] .kk-die { width: clamp(48px, 14vw, 92px); }
/* Six to ten dice sit in two even rows: three and three, four and three, up to five and five. */
.kk-dice[data-count="6"], .kk-dice[data-count="7"], .kk-dice[data-count="8"], .kk-dice[data-count="9"], .kk-dice[data-count="10"] { --kk-w: clamp(46px, 13.5vw, 84px); --kk-row: 5; max-width: calc(var(--kk-row) * var(--kk-w) + (var(--kk-row) - 1) * var(--kk-gap)); }
.kk-dice[data-count="6"] { --kk-row: 3; }
.kk-dice[data-count="7"], .kk-dice[data-count="8"] { --kk-row: 4; }
.kk-dice[data-count="6"] .kk-die, .kk-dice[data-count="7"] .kk-die, .kk-dice[data-count="8"] .kk-die, .kk-dice[data-count="9"] .kk-die, .kk-dice[data-count="10"] .kk-die { width: var(--kk-w); }
.kk-dice[data-count="many"] .kk-die { width: clamp(44px, 12vw, 64px); }
.kk-die-svg { width: 100%; height: 100%; overflow: visible; }
.kk-body { fill: var(--kk-die); stroke: var(--kk-die-edge); stroke-width: 3; }
.kk-shine { fill: none; stroke: rgba(255,255,255,.7); stroke-width: 2; }
.kk-facet { fill: none; stroke: var(--kk-die-edge); stroke-width: 2; opacity: .8; }
.kk-pip { fill: var(--kk-die-ink); }
.kk-pip-one { fill: var(--kk-pip-one); }
.kk-number { fill: var(--kk-die-ink); paint-order: stroke; stroke: var(--kk-die); stroke-width: 7px; stroke-linejoin: round; font-weight: 800; font-family: ui-rounded, "SF Pro Rounded", system-ui, sans-serif; }
.kk-underline { fill: var(--kk-die-ink); }
.kk-word { fill: var(--kk-die-ink); font-weight: 800; font-family: ui-rounded, "SF Pro Rounded", system-ui, sans-serif; }
/* A loaded die's mark: a weight on a red disc in its corner, at every size. */
.kk-loaded circle { fill: var(--kk-bad); stroke: var(--kk-die); stroke-width: 2; }
.kk-loaded path { fill: #fff; }
.kk-loaded .kk-loaded-ring { fill: none; stroke: #fff; stroke-width: 2.4; }
.kk-caption { fill: var(--kk-die-ink); opacity: .6; font-weight: 700; font-family: ui-rounded, "SF Pro Rounded", system-ui, sans-serif; }
/* A die that can be held is a button over the felt; the rest let a tap through to it. */
button.kk-die { pointer-events: auto; border-radius: 18%; }
button.kk-die[aria-pressed="true"] { transform: translateY(-5px); }
button.kk-die[aria-pressed="true"] .kk-body { stroke: #e0b43b; stroke-width: 7; }
button.kk-die[aria-pressed="true"]::before { content: attr(data-tag); position: absolute; z-index: 1; left: 50%; bottom: -7px; transform: translateX(-50%); padding: 1px 7px; border-radius: 999px; background: #e0b43b; color: #1f2320; font-size: .62rem; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; white-space: nowrap; line-height: 1.4; }
/* A little air between two kinds of dice, where there are few enough dice for it not to cost a row. */
.kk-dice:not([data-count="6"]):not([data-count="7"]):not([data-count="8"]):not([data-count="9"]):not([data-count="10"]):not([data-count="many"]) .kk-die[data-first="true"] { margin-left: clamp(6px, 2vw, 14px); }
.kk-die[data-kept="false"] { opacity: .38; transform: scale(.88); }
.kk-die[data-kept="false"]::after { content: ""; position: absolute; left: 12%; right: 12%; top: 50%; height: 3px; background: var(--kk-felt-ink); border-radius: 3px; transform: rotate(-20deg); }
.kk-die[data-exploded="true"] .kk-body { stroke: var(--kk-accent); stroke-width: 5; }
.kk-die[data-exploded="true"]::before, .kk-die[data-status="rerolled"]::before { content: "!"; position: absolute; z-index: 1; top: -7%; right: -7%; width: 36%; aspect-ratio: 1; border-radius: 50%; display: grid; place-items: center; background: var(--kk-accent); color: var(--kk-accent-ink); font-weight: 800; font-size: clamp(.62rem, 2.4vw, .95rem); line-height: 1; }
.kk-die[data-status="rerolled"]::before { content: "↻"; background: var(--kk-felt-ink); color: var(--kk-felt-deep); }
.kk-die[data-hit="crit"] .kk-body { stroke: #e0b43b; stroke-width: 6; }
.kk-die[data-hit="fumble"] .kk-body { stroke: var(--kk-bad); stroke-width: 6; }
/* A die that is a success wears a tick; one that takes a success away, a cross. */
.kk-die[data-counts]::after { position: absolute; z-index: 1; bottom: -7%; right: -7%; width: 36%; aspect-ratio: 1; border-radius: 50%; display: grid; place-items: center; font-weight: 800; font-size: clamp(.62rem, 2.4vw, .95rem); line-height: 1; }
.kk-die[data-counts="1"]::after { content: "✓"; background: #e0b43b; color: #1f2320; }
.kk-die[data-counts="-1"]::after { content: "✗"; background: var(--kk-bad); color: #fff; }
.kk-die[data-counts="1"] .kk-body { stroke: #e0b43b; stroke-width: 5; }
.kk-sum b { color: var(--kk-ink); }
/* Choosing a file: the input lies over its label, unseen, so the label is what is tapped and what takes the focus ring. */
.kk-pick { position: relative; display: inline-flex; align-items: center; cursor: pointer; min-height: 44px; box-sizing: border-box; }
.kk-pick .kk-file { position: absolute; inset: -1px; width: calc(100% + 2px); height: calc(100% + 2px); opacity: 0; cursor: pointer; }
.kk-pick:focus-within { outline: 3px solid var(--kk-accent); outline-offset: 2px; }
.kk-sum i { font-style: normal; color: var(--kk-bad); }
.kk-history .kk-mini span[data-counts="1"] { border-color: #b98a12; box-shadow: inset 0 0 0 1px #b98a12; }
.kk-history .kk-mini span[data-counts="-1"] { border-color: var(--kk-bad); color: var(--kk-bad); }
.kk-tumble { animation: kk-tumble var(--kk-t, 600ms) cubic-bezier(.2,.7,.3,1) var(--kk-wait, 0ms) both; }
.kk-land { animation: kk-land 320ms cubic-bezier(.3,1.6,.5,1) both; }
@keyframes kk-tumble {
  0% { transform: translate(var(--kk-x0), var(--kk-y0)) rotate(var(--kk-r0)) scale(.7); }
  35% { transform: translate(calc(var(--kk-x0) * -.4), calc(var(--kk-y0) * -.3)) rotate(calc(var(--kk-r0) * -.6)) scale(1.08); }
  70% { transform: translate(calc(var(--kk-x0) * .15), 4px) rotate(calc(var(--kk-r0) * .2)) scale(.97); }
  100% { transform: none; }
}
@keyframes kk-land { 0% { transform: scale(.92); } 60% { transform: scale(1.06); } 100% { transform: none; } }
.kk-root .kk-felt, .kk-root .kk-felt .kk-hint { color: var(--kk-felt-ink); }
.kk-hint { font-size: .85rem; opacity: .85; letter-spacing: .02em; display: inline-flex; align-items: center; gap: 6px; }
@media (hover: none) { .kk-hint kbd { display: none; } }
.kk-hint kbd { font: inherit; font-size: .72rem; border: 1px solid rgba(255,255,255,.45); border-radius: 5px; padding: 0 5px; }
.kk-felt[data-rolling="true"] .kk-hint { visibility: hidden; }
.kk-hint { text-align: center; min-height: 1.3em; }

/* Room for a roll's total, its sum, a badge, its luck and its link, kept from the start: the choices below never move when the dice land. */
.kk-result { display: grid; gap: 6px; justify-items: center; align-content: start; text-align: center; min-height: 214px; }
.kk-luck[data-waiting="true"] { opacity: .3; min-height: 3.1em; align-content: start; }
@media (min-width: 700px) { .kk-felt { min-height: 272px; } .kk-result { min-height: 226px; } }
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
.kk-actions { display: flex; gap: 8px; justify-content: center; align-items: center; flex-wrap: wrap; }
.kk-link { border: 1px solid var(--kk-rule); background: var(--kk-surface); border-radius: 999px; min-height: 44px; padding: 0 14px; font-size: .85rem; }
.kk-link[data-danger="true"] { border-color: var(--kk-bad); color: var(--kk-bad); }

/* A tray in a small space: the felt and the result alone, or those and the choice of dice. */
.kk-root[data-size="small"] > .kk-controls, .kk-root[data-size="small"] > .kk-panels, .kk-root[data-size="medium"] > .kk-panels { display: none; }
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
.kk-history .kk-mini span[data-exploded="true"] { border-color: var(--kk-accent); color: var(--kk-accent); }
.kk-history .kk-mini span[data-held="true"] { border-color: #e0b43b; box-shadow: inset 0 0 0 1px #e0b43b; }
.kk-history .kk-mini span[data-first="true"] { margin-left: 6px; }
.kk-sum s { text-decoration-thickness: 1.5px; }
.kk-reading { font-weight: 700; font-size: .95rem; overflow-wrap: anywhere; }
.kk-reading[data-tone="good"], .kk-words[data-tone="good"] { color: var(--kk-good); }
.kk-reading[data-tone="bad"], .kk-words[data-tone="bad"] { color: var(--kk-bad); }
/* A set of rolls: a box of its own that scrolls, so that ten rolls take the room of four. */
.kk-set-list { list-style: none; margin: 0; padding: 4px 8px; width: min(420px, 100%); max-height: 132px; overflow-y: auto; border: 1px solid var(--kk-rule); border-radius: 12px; background: var(--kk-surface); display: grid; gap: 0; text-align: left; font-variant-numeric: tabular-nums; }
.kk-set-list li { display: grid; grid-template-columns: 1.4rem 1fr auto auto; align-items: center; gap: 8px; padding: 4px 0; border-bottom: 1px solid var(--kk-rule); }
.kk-set-list li:last-child { border-bottom: 0; }
.kk-set-list .kk-sum { font-size: .85rem; text-align: left; }
.kk-set-n { color: var(--kk-muted); font-size: .75rem; }
.kk-set-list i { font-style: normal; font-size: .7rem; text-transform: uppercase; letter-spacing: .05em; color: var(--kk-muted); }
.kk-set-list li[data-mark="highest"] b { color: var(--kk-good); }
.kk-set-list li[data-mark="lowest"] b { color: var(--kk-bad); }
.kk-history-set details > summary { display: grid; grid-template-columns: auto 1fr; gap: 2px 12px; align-items: center; cursor: pointer; min-height: 44px; }
.kk-history-set details > summary strong { grid-column: 1 / -1; text-align: left; font-size: 1.05rem; overflow-wrap: anywhere; }
.kk-shelves { max-height: 420px; overflow-y: auto; border: 1px solid var(--kk-rule); border-radius: 12px; padding: 4px 10px 10px; display: grid; gap: 4px; }
.kk-history-set, .kk-history li.kk-history-set { display: block; }
.kk-history-set .kk-history { max-height: none; padding-left: 12px; }
.kk-games { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 6px; }
.kk-game { text-align: left; border: 1px solid var(--kk-rule); background: var(--kk-surface); border-radius: 12px; padding: 8px 12px; min-height: 44px; display: grid; gap: 2px; }
.kk-game[hidden], .kk-more section[hidden] { display: none; }
.kk-game code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .75rem; color: var(--kk-muted); overflow-wrap: anywhere; }
.kk-game span { color: var(--kk-muted); font-size: .8rem; }
.kk-game:hover, .kk-game[aria-pressed="true"] { border-color: var(--kk-ink); }
.kk-fine { font-size: .75rem; color: var(--kk-muted); margin: 0; }
.kk-more a { color: inherit; }
.kk-more input[type="search"] { flex: 1 1 12rem; }
.kk-outcomes { display: grid; grid-template-columns: 1fr auto; gap: 4px 12px; margin: 0; font-size: .85rem; }
.kk-outcomes dt { overflow-wrap: anywhere; }
.kk-outcomes dd { margin: 0; text-align: right; font-variant-numeric: tabular-nums; color: var(--kk-muted); white-space: nowrap; }
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
.kk-target input { width: 5rem; min-height: 44px; border: 1px solid var(--kk-rule); border-radius: 10px; padding: 0 10px; background: var(--kk-surface); color: var(--kk-ink); font: inherit; font-weight: 700; }
.kk-big { font-size: 2rem; font-weight: 800; font-variant-numeric: tabular-nums; }
.kk-settings { display: grid; gap: 8px; font-size: .85rem; }
.kk-settings p { margin: 0; color: var(--kk-muted); }
.kk-settings summary { min-height: 44px; display: flex; align-items: center; gap: 6px; cursor: pointer; }
.kk-settings summary::before { content: "▸"; }
.kk-settings[open] > summary::before { content: "▾"; }
.kk-settings summary::-webkit-details-marker { display: none; }
.kk-settings summary { list-style: none; }
.kk-more section { display: grid; gap: 8px; padding: 4px 0 10px; }
.kk-more h4, .kk-chart h4 { margin: 0; font-size: .85rem; font-weight: 600; }
.kk-more .kk-row .kk-field { flex: 1 1 12rem; }
.kk-presets { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 8px; }
.kk-preset { text-align: left; border: 1px solid var(--kk-rule); background: var(--kk-surface); border-radius: 12px; padding: 10px 12px; display: grid; gap: 3px; min-height: 44px; }
.kk-preset code, .kk-set-use code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .8rem; color: var(--kk-muted); }
.kk-preset span { color: var(--kk-muted); font-size: .8rem; }
.kk-preset:hover, .kk-set-use:hover { border-color: var(--kk-ink); }
.kk-sets { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
.kk-sets li { display: flex; gap: 6px; align-items: center; }
.kk-set-use { flex: 1 1 auto; min-width: 0; min-height: 44px; text-align: left; border: 1px solid var(--kk-rule); background: var(--kk-surface); border-radius: 12px; padding: 4px 12px; display: grid; }
.kk-set-use code { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kk-sets .kk-link { min-width: 44px; flex: 0 0 auto; }
.kk-results { flex: 1 1 12rem; padding: 8px 10px; resize: vertical; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
.kk-axis-words span { flex: 1; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.kk-words { font-size: clamp(1.5rem, 7vw, 2.6rem); letter-spacing: 0; overflow-wrap: anywhere; }
.kk-history .kk-mini span[data-loaded="true"] { border-style: dashed; border-color: var(--kk-bad); }
.kk-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
@media (min-width: 900px) {
  .kk-root[data-wide="true"] { grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr); align-items: start; }
  .kk-root[data-wide="true"] > .kk-panels { grid-column: 2; grid-row: 1 / span 3; }
}
@media (prefers-reduced-motion: reduce) { .kk-tumble, .kk-land { animation: none; } }
`;

/** Add the tray's stylesheet to a document, once. */
export function injectStyle(doc: Document): void {
  if (doc.getElementById(STYLE_ID) !== null) return;
  const style = doc.createElement("style");
  style.id = STYLE_ID;
  style.textContent = CSS;
  doc.head.append(style);
}
