# The command line and export

The command line, export, and dice from an address. Back to the [README](../README.md#the-command-line).

## The command line

Installing the package puts three commands on the path: `korokoro`, the
shorter `koro`, and `roll`, which is the plain English for it (`roll 2d6+3`).
They are the same. They need Node 22 or later and nothing
else, and run the same on Linux, macOS and Windows.

```sh
npm install -g @johnmorrisdotca/korokoro    # or use npx, as above
```

```console
$ koro 2d20kh1+5 --seed table
2d20kh1+5: 24  [19 (12)]

$ koro 6#4d6dl1 --seed table
4d6kh3: 8  [1 2 (1) 5]
4d6kh3: 12  [4 6 (1) 2]
4d6kh3: 11  [5 (1) 2 4]
4d6kh3: 9  [3 (2) 3 3]
4d6kh3: 13  [6 4 3 (2)]
4d6kh3: 12  [4 (1) 5 3]
  sum 65 · highest 13 · lowest 8

$ koro --odds 2d6
2d6
  range 2 to 12 · expected 7 · spread 2.42 · most likely 7
   2    2.78%  #####
   3    5.56%  ##########
   …

$ koro --game craps --seed table
Craps (2d6): 3 · 3 on the come-out: craps  [1 2]

$ koro --test "3 5 6 6 1 2"
6 results on a d6: too few to say. The test wants 30.
```

In the brackets is each die as it fell: `(1)` was dropped, `[2]` was rerolled,
`6!` exploded, `9*` is a success and `1x` takes one away, and `4→3` is a die
that counts for something other than its face.

| Option | What it does |
| --- | --- |
| `-s`, `--seed <seed>` | The same seed throws the same dice. One seed serves the whole command, in the order the rolls are written |
| `-t`, `--times <n>` | Throw each roll `n` times, 1 to 100. `6#4d6dl1` says the same in the notation |
| `--max-dice <n>` | Allow up to `n` dice in a roll, from 10 (the default) to 100. Past ten, plain dice only |
| `-o`, `--odds` | Show the exact odds and do not roll: the range, the average, the spread, and each total with its chance. Past forty totals, the forty likeliest |
| `-g`, `--game <name>` | Roll a game's dice and read them as the game does. Any of its names |
| `--games` | List the games |
| `--test <results>` | Test a real die's results for fairness. `--sides <n>` names the die when its highest face never came up |
| `-j`, `--json` | Print JSON: `{ "format": 1, "generator": …, "rolls": [ … ] }`, the same shape `toJSON` writes and `fromJSON` reads |
| `--csv` | Print CSV, with a header |
| `--stdin` | Read dice from standard input, one roll to a line. Windows line endings are fine |
| `--lang <en\|ja>` | English or Japanese. Otherwise `LC_ALL`, `LC_MESSAGES` or `LANG` decides, and where none is set (Windows), the system's language |
| `--no-color` | No colour. `NO_COLOR` is honoured too, and output that is piped is never coloured |
| `-h`, `--help`, `-v`, `--version` | |

With no dice it rolls `2d6`. Dice that cannot be rolled are said on standard
error, by name, and the rest are still rolled.

| Exit code | Means |
| --- | --- |
| 0 | Done |
| 1 | Something asked for could not be rolled: notation that was refused, a game that does not exist |
| 2 | The command itself was wrong: an option it does not know, or one without its value |

Your shell reads `<`, `>`, `!`, `#`, `[` and `{` before Korokoro does, so
quote a roll that has them: `koro "6d10>=8f=1"`, `koro "d[Yes,No,Maybe]"`.

**From another program or another language**, the JSON is the way in: run
`koro --json`, read standard output, and check the exit code.
[Use Korokoro from another language](other-languages.md) has the shape
of the JSON and a working example in Python, Go, Rust and C#, and says how to
write a port: there is [a specification](spec/random.md) and
[a conformance suite](../conformance/korokoro-conformance.json) to check one
against. The shape is
versioned by `format`, which goes up only if a reader of the old shape would
be wrong about the new one.

```sh
printf '2d6\n1d20+5\n' | koro --stdin --json --seed table
```

In JavaScript there is no need for a process: `runCli(args, surroundings)` is
the whole command line as a pure function, returning `{ code, out, err }`.

## Export

A history, or any list of rolls, is written out three ways. Each is a pure
function that returns a string; what is done with it is yours.

```ts
toJSON(rolls);                // { "format": 1, "generator": "korokoro 1.15.2", "rolls": [ … ] }
toJSON(rolls, { stats: true });  // with statsOf(rolls) beside them
fromJSON(text);               // the rolls back again, or null if it is not an export
toCSV(rolls);                 // for a spreadsheet
toText(rolls);                // for a chat or a log
```

```
2026-09-30T12:00:00.000Z  2d20kh1+5 # attack: 24  [19 (12)]
2026-09-30T12:00:05.000Z  4d6kh3: 8  [1 2 (1) 5]
```

```csv
time,notation,label,total,dice,faces,seed,held,loaded,set
2026-09-30T12:00:00.000Z,2d20kh1+5,attack,24,19 (12),19 12,table,,,
2026-09-30T12:00:05.000Z,4d6kh3,,8,1 2 (1) 5,1 2 1 5,table,,,
```

- **The JSON reads back in**, and nothing in it is trusted: `fromJSON` puts
  each roll together again from its dice and its faces, works the total out
  itself, and leaves out a roll that does not add up.
- **The CSV is safe to open.** A cell that a spreadsheet would run as a
  formula (one starting with `=`, `+`, `-` or `@`) is given a leading
  apostrophe, unless it is simply a number. Lines end CRLF, as RFC 4180 has
  them, and cells are quoted where they need to be.
- **In the tray** it is *Export and import*, under the history: save as CSV,
  JSON or text, and bring a JSON export back in, on this device or another.
  Rolls already there are not added twice.

## Dice from an address

<https://johnmorrisdotca.github.io/korokoro/api/?roll=2d20kh1%2B5&seed=table>
is a page that shows that roll as plain text and nothing else; `format=json`,
`format=csv` and `odds=1` do what they say. It runs in your browser: there is
no server, so it is for a link, a bookmark or a frame in another page, not for
a program to fetch. [Dice as plain text](plain-output.md) has the
address's parts, how a framing page is sent the answer, and how to use the
package from a CDN with nothing to install.
