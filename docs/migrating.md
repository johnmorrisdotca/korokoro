# Migrating

Korokoro keeps old rolls, links and specs working. This page lists the changes
that need a second look.

## 1.4.0: `r` rerolls until clear, and `ro` rerolls once

**What changed.** In notation, `r<3` used to mean "throw a 1 or a 2 again,
once". It now means "throw a 1 or a 2 again until it clears", and `ro<3` is
the reroll-once. This is what `r` and `ro` mean in Roll20 and in the dice
libraries that follow it, and the package changed while it was young enough
for that to be cheap.

| You wrote (1.2.0, 1.3.0) | It meant | Write now |
| --- | --- | --- |
| `2d8r<3` | reroll a 1 or a 2 once | `2d8ro<3` |
| `2d8r<=2` | the same | `2d8ro<=2` |

`2d8r<3` is still read, and now rerolls until clear: its average is 11.0
where `2d8ro<3` averages 10.5.

**What did not change.**

- **Specs.** A `RollSpec` with `reroll: 2` still rerolls once. The new rule is
  a new field, `rerollUntil`. Code that builds specs, and histories kept in
  storage (which hold specs), mean what they meant.
- **Shared links.** A link made by 1.2.0 or 1.3.0 has no `v` in it, and
  `readShared` reads its `r` as reroll once, so it shows the roll it showed
  when it was made. Links made from 1.4.0 on carry `v=2`.
- **Seeds.** A seeded roll of any notation that has not changed meaning throws
  the same dice as before.

**What to do.**

- Notation kept as text (a saved macro, a button on your page, a test):
  change `r<` to `ro<` to keep the roll you had. `parseNotation(text,
  { legacyReroll: true })` reads old text as it was meant, if you cannot
  change it.
- `formatNotation` now writes a reroll-once as `ro<`, so text made from a
  spec is already right.

**One new limit.** A reroll until clear may match at most half a die's faces
(`1d6r<4` is the most for a d6), and stops after 10 rerolls, so that it always
ends. `ro` has no such limit.

## 1.4.0: a tap on a rolled die holds it

In the tray, a tap on a die that has been rolled now holds it for the next
roll, where before it rolled again like a tap anywhere else on the felt. A tap
on the felt beside the dice, or Space, rolls as before. Pass `hold: false` to
`mountRoller` (or the React component) to keep every tap a roll.

A browser test that clicks the middle of the tray (`data-testid="kk-tray"`)
after a first roll may now land on a die. Click the felt's edge, press Space,
or call the handle's `roll()`.
