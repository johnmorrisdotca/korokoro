# The dice sounds

The tray's rolling sounds are recordings of real dice from **Casino Audio
(1.1)** by Kenney Vleugels, [kenney.nl](https://kenney.nl/assets/casino-audio).

**Licence:** Creative Commons Zero (CC0 1.0),
<http://creativecommons.org/publicdomain/zero/1.0/>, as stated in the pack's
own `License.txt`: "You may use these assets in personal and commercial
projects. Credit (Kenney or www.kenney.nl) would be nice but is not
mandatory." Nothing else in this package comes from anywhere but this
repository.

## The files

Six of the pack's 54 recordings are used, each cut short and re-encoded:

| File here | From the pack | What it is | Length | Size |
| --- | --- | --- | --- | --- |
| `sounds/dice-shake-1.m4a` | `Audio/dice-shake-1.ogg` | dice shaken in a hand | 0.78 s | 6,547 bytes |
| `sounds/dice-shake-2.m4a` | `Audio/dice-shake-2.ogg` | dice shaken in a hand | 0.78 s | 6,714 bytes |
| `sounds/die-throw-1.m4a` | `Audio/die-throw-1.ogg` | one die landing | 0.26 s | 2,590 bytes |
| `sounds/die-throw-2.m4a` | `Audio/die-throw-2.ogg` | one die landing | 0.42 s | 3,787 bytes |
| `sounds/die-throw-3.m4a` | `Audio/die-throw-3.ogg` | one die landing | 0.60 s | 4,686 bytes |
| `sounds/die-throw-4.m4a` | `Audio/die-throw-4.ogg` | one die landing | 0.22 s | 2,400 bytes |

26,724 bytes in all.

## What was done to them

Each recording was decoded from Ogg Vorbis, mixed to one channel, cut to the
part with sound in it (a shake to its first 0.78 seconds), faded at the ends,
brought to the same peak level, and encoded as AAC at 48 kbit/s in an `.m4a`,
which every current browser decodes, Safari on an iPhone included. The
encoder's padding was taken out of each file.

## How they are shipped

`pnpm sounds` writes the six files into `src/ui/sounds.data.ts` as base64, and
a test fails if that module and the files fall out of step. The tray imports
the module only when a roll happens with the sound on, so a page that never
makes a sound never downloads it. It is also exported on its own as
`@johnmorrisdotca/korokoro/sounds`.

If the recordings cannot be loaded or decoded, the tray plays a short knock it
makes itself with the Web Audio API.
