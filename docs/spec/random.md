# The seeded generator and how dice are drawn

This is what a port of Korokoro has to do for a seeded roll to come out die
for die as it does here. It is the specification; `src/random.ts` and
`src/dice.ts` are the reference implementation; and
[`conformance/korokoro-conformance.json`](../../conformance/korokoro-conformance.json)
is the data to check against. All arithmetic is on unsigned 32-bit integers
unless it says otherwise, and `imul` is 32-bit multiplication that keeps the
low 32 bits.

An unseeded roll uses the platform's cryptographic generator in place of
steps 1 and 2, and everything from step 3 on is the same.

## 1. From a seed to four words

The seed is text. It is read as its **UTF-16 code units**, in order (so
`コロコロ` is four units, and a character outside the Basic Multilingual Plane
is two). Start with

```
h1 = 1779033703   h2 = 3144134277   h3 = 1013904242   h4 = 2773480762
```

and for each code unit `k`, in this order, each line using the values the
lines before it have just made:

```
h1 = h2 ^ imul(h1 ^ k, 597399067)
h2 = h3 ^ imul(h2 ^ k, 2869860233)
h3 = h4 ^ imul(h3 ^ k, 951274213)
h4 = h1 ^ imul(h4 ^ k, 2716044179)
```

Then, once, again each line using what the lines before it made, with `>>>`
an unsigned shift:

```
h1 = imul(h3 ^ (h1 >>> 18), 597399067)
h2 = imul(h4 ^ (h2 >>> 22), 2869860233)
h3 = imul(h1 ^ (h3 >>> 17), 951274213)
h4 = imul(h2 ^ (h4 >>> 19), 2716044179)
```

The four words of state are, each as an unsigned 32-bit integer:

```
a = h1 ^ h2 ^ h3 ^ h4      b = h2 ^ h1      c = h3 ^ h1      d = h4 ^ h1
```

(This is the hash known as cyrb128.) The empty seed is allowed: it is the
four starting values put through the last two steps.

## 2. The stream: sfc32

One step of the generator, which returns `t`:

```
t = (a + b) mod 2^32
a = b ^ (b >>> 9)
b = (c + (c << 3)) mod 2^32
c = (c << 21) | (c >>> 11)          a rotation left by 21
d = (d + 1) mod 2^32
t = (t + d) mod 2^32
c = (c + t) mod 2^32
```

**The first fifteen steps are thrown away.** The sixteenth is the first
number the stream hands out. The conformance file's `random[].uint32` is the
first eight numbers handed out for each seed.

## 3. A fair whole number below n

To pick a whole number from 0 up to but not including `n` (1 ≤ n ≤ 2^32):

```
limit = 2^32 - (2^32 mod n)
repeat: v = next number from the stream
until v < limit
return v mod n
```

This is rejection sampling: a plain `v mod n` would favour the low numbers
whenever `n` does not divide 2^32. A port must reject exactly these values,
or its stream falls out of step. `random[].below` in the conformance file is
the first twelve picks below 2, 3, 6, 20, 100 and 1000, each from a fresh
stream.

## 4. One die

| Die | Pick | Face |
| --- | --- | --- |
| A numbered die of `s` sides | below `s` | pick + 1 |
| A Fate die | below 3 | pick − 1: −1, 0 or +1 |
| A custom die of `f` faces | below `f` | the face at place pick + 1, as written |
| A loaded die with weights `w1 … ws` | below `w1 + … + ws` | the first face whose weights, added up from the lowest face, exceed the pick |
| A die that must differ (`u`), with `t` faces already showing | below `s − t` | the face at that place among the faces not yet showing, counted from the lowest, from 0 |

One die is one pick, whatever its kind.

## 5. One roll

The kinds of dice are thrown in the order written, and within a kind each die
asked for is **settled before the next is touched**:

1. Throw the die.
2. If the kind rerolls once (`ro`) and the face meets the reroll, the die is
   thrown again, once, and that face stands whatever it is.
3. If the kind rerolls until clear (`r`), then while the face meets the
   reroll the die is thrown again, up to 10 times; after that it stands as it
   lies.
4. If the kind explodes and the face left standing is one that explodes, and
   this die has thrown fewer than 10 extra dice, another die is thrown, which
   goes through steps 1 to 4 itself.

Every face thrown is recorded, in the order thrown: a rerolled face, then its
replacement; an exploding face, then the die it threw. Nothing else draws
from the stream: keeping, dropping, counting, marking and sorting are all
worked out from the faces.

`rolls[]` in the conformance file is thirty-five rolls to reproduce this way,
each with its seed, its faces and what became of each die.

## 6. Several rolls from one stream

- **A roll thrown several times** (`6#4d6dl1`) is the roll made that many
  times, one after another, from the one stream (`set` in the file).
- **Holding dice**: the second roll walks the dice in the same order, and a
  die that is held is not thrown: it keeps its face and takes no pick
  (`held` in the file). Its stream is its own seed's, from the start.
- **Several rolls from one seed**, as the command line makes them, are drawn
  one after another in the order asked for.

## 7. What is not part of the stream

The tumble, the sound and the order dice are shown in never draw from the
generator. A roll's `id` and its time are not random and are not part of what
a port reproduces.
