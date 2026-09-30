# The notation

What Korokoro reads, exactly. This is the specification;
`src/notation.ts` is the reference implementation; and the `notation` part of
[`conformance/korokoro-conformance.json`](../../conformance/korokoro-conformance.json)
is the data to check against: 95 texts that are read, each with the one way
it is written back, and 54 that are refused, each with the problem named and
the part of the text it is about.

Letters are read in either case. Spaces are allowed between any two parts and
mean nothing. Text longer than 400 characters is refused.

## Grammar

In EBNF, where `{ x }` is x any number of times and `[ x ]` is x or nothing:

```ebnf
notation = [ times "#" ] [ "[" label "]" ] roll [ "#" label ] ;
times    = number ;                                  (* 1 to 100 *)
roll     = dice { "+" dice } [ bonus ]               (* a plain roll *)
         | formula ;
bonus    = ( "+" | "-" ) number ;                    (* 0 to 99 *)

dice     = [ number ] "d" sides { modifier } ;       (* the number of dice: 1 when left out *)
sides    = number                                    (* 2 to 1000 *)
         | "%"                                       (* 100 *)
         | "F"                                       (* a Fate die: -1, 0, +1 *)
         | number "{" weight { "," weight } "}"      (* a loaded die *)
         | "[" face { "," face } "]" ;               (* a custom die *)
weight   = number ":" number ;                       (* a face, and how heavily it is weighted: 0 to 99 *)
face     = words [ "=" [ "-" ] number ] [ "#" colour ] ;
colour   = 3 or 6 hexadecimal digits ;

modifier = ( "!" | "!!" | "!p" | "!!p" ) [ compare ]
         | "r" [ point ] | "ro" [ point ]
         | ( "k" | "kh" | "kl" | "b" | "w" | "d" | "dh" | "dl" ) [ number ]
         | "min" number | "max" number
         | compare
         | "f" point
         | "cs" [ point ] | "cf" [ point ]
         | "s" | "sa" | "sd"
         | "u" ;
compare  = ( "=" | "<" | ">" | "<=" | ">=" | "<>" ) number ;
point    = compare | "!=" number | number ;          (* a bare number is "=" *)

formula  = term { ( "+" | "-" ) term } ;
term     = factor { ( "*" | "x" | "×" | "/" ) factor } ;
factor   = dice | number                             (* a number up to 9999 *)
         | "-" factor
         | "(" formula ")"
         | ( "floor" | "ceil" | "round" | "abs" ) "(" formula ")"
         | ( "max" | "min" ) "(" formula "," formula { "," formula } ")"
         | "{" formula "," formula { "," formula } "}" keepone ;
keepone  = ( "k" | "kh" | "kl" | "d" | "dh" | "dl" ) [ number ] ;   (* must leave exactly one roll *)

label    = up to 40 characters, none of # [ ] { } and no control character, and not only digits ;
number   = digit { digit } ;
```

A text is tried as a plain roll first. If that fails and the text multiplies,
divides, brackets, groups, takes dice away, or has a number before its dice,
it is read as a formula. After a `!`, a comparison belongs to the explosion:
`6d10!>=8` explodes at 8 or more, and successes on exploding dice are written
`6d10>=8!`.

## What each part means

| Part | Meaning |
| --- | --- |
| `6#` | The whole roll is thrown that many times, from one stream |
| `kh n`, `k n`, `b n` | Keep the highest `n` of the kind's dice (1 when left out) |
| `kl n`, `w n` | Keep the lowest `n` |
| `dl n`, `d n` | Drop the lowest `n`: keep the highest of what is left |
| `dh n` | Drop the highest `n` |
| `!` | A die showing its highest face throws another die, which is added |
| `! compare` | The same, on the faces that meet the comparison |
| `!!` | Compounding: the extra dice are part of the die that threw them |
| `!p` | Penetrating: each extra die counts one less than its face |
| `r point` | A die meeting it is thrown again until it does not, up to 10 times. `r` alone is the lowest face |
| `ro point` | A die meeting it is thrown again once |
| `min n`, `max n` | A die counts for no less than `n`, or no more |
| a bare `compare` | The kind's dice are counted, not added: one for each die meeting it |
| `f point` | With a count: each die meeting it takes one away |
| `cs point`, `cf point` | Marks only. Alone: the highest face, and the lowest |
| `s`, `sa`, `sd` | The dice are shown sorted. The roll keeps the order thrown |
| `u` | The dice all show different faces |
| `<3`, `>7` | Kept as `<=2` and `>=8` |

The order modifiers are applied in, whatever order they are written in:
reroll; explode; min and max; keep and drop; count; marks; sort. Then the
kinds are added and the bonus applied, or the formula is worked out.

A formula is worked out in exact fractions. `round` sends a half up. It must
come to a whole number: a division that is not inside `floor`, `ceil` or
`round` is refused.

## Limits

| | |
| --- | --- |
| Dice over the whole roll | 1 to 10 (up to 100 plain dice where the caller asks) |
| Kinds of dice | 4 |
| Sides | 2 to 1000 |
| Bonus | −99 to +99 |
| Explosions for each die | 10 extra dice; only dice of 100 sides or fewer explode |
| Rerolls until clear, for each die | 10 |
| Custom faces | 2 to 20, each up to 16 characters, worth −9999 to 9999 |
| Loaded dice | up to 100 sides, weights 0 to 99, at least two faces that can come up |
| Dice that all differ | up to 100 sides, no more dice than sides |
| Numbers in a formula | up to 9999 |
| The span of a formula's totals | 1,000,000 |
| Times | 1 to 100 |

## One spelling for each roll

`formatNotation` writes every roll one way, and that text reads back as the
same roll:

1. `times#`, when more than 1.
2. Each kind: its count (always written), `d` and its sides, then its
   modifiers in this order: the success and failure comparisons; the
   explosion; the reroll; `kh` or `kl` with its number; `min`, `max`; `u`;
   `cs`, `cf`; `sa` or `sd`.
3. A plain roll: the kinds joined by `+`, then the bonus. Two kinds that are
   the same dice under the same rules are one kind.
4. A formula: written with the fewest brackets that keep its meaning, `*` for
   multiplying, and a group as `max(…)` or `min(…)`. A formula that only adds
   is written as the plain roll it is.
5. ` # label`, when there is one.

Comparisons are written `=n`, `<=n`, `>=n` or `<>n`. A reroll of a run of
faces from the lowest is written `r<n` or `ro<n`. Drops are written as the
keep they come to: `4d6dl1` is `4d6kh3`.

## Refusals

Text that is not read is refused with a problem from this list and the part
of the text it is about. Nothing is ever rolled as something else.

| Problem | When |
| --- | --- |
| `shape` | Not dice notation at all |
| `count` | More dice than the limit, or none |
| `sides` | A die with fewer than 2 sides or more than 1000 |
| `bonus` | A bonus past 99 |
| `twice` | The same kind of modifier twice, or keep and drop together |
| `keep` | Keeping or dropping that leaves every die, or none |
| `reroll` | A reroll that rerolls no face or every face, or an `r` that matches more than half the faces |
| `explode` | Exploding Fate dice, dice past 100 sides, dice that are kept or dropped, or on every face or none |
| `kinds` | More than four kinds of dice |
| `times` | A repeat of 0, or past 100 |
| `custom` | A custom die that cannot be read, or one given modifiers |
| `weights` | A loaded die whose weights cannot be used |
| `successes` | A count no die can meet or every die meets, a failure with no success or overlapping it, or a count with keep or drop |
| `clamp` | A `min` or `max` outside the die, or `min` above `max` |
| `marks` | A `cs` or `cf` no die can meet, or every die meets |
| `unique` | More dice than faces, a die past 100 sides, another rule beside `u`, or `uo` |
| `math` | Brackets that do not match, an unknown function, a number past 9999, a group that keeps other than one roll, or totals too wide to count |
| `fraction` | A division that is not rounded |
| `zero` | A formula that can divide by nothing |
| `label` | A label that is too long, only digits, or has a character notation is written with |
