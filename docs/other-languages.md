# Use Korokoro from another language

Korokoro is written in TypeScript and runs wherever JavaScript does. From
Python, Go, Rust, C# or anything else that can start a program, the way in is
the command line: run `koro` with `--json`, read what it prints, and check its
exit code. No JavaScript is written, and nothing is kept running between
rolls.

```sh
npm install -g @johnmorrisdotca/korokoro     # puts koro on the path; needs Node 22 or later
koro 2d20kh1+5 --seed table --json
```

## What comes back

The JSON is the same shape whatever is rolled, and it is versioned: `format`
is `1`, and goes up only if a reader of the old shape would be wrong about
the new one. New fields may be added without it changing, so read the fields
you need and ignore the rest.

```json
{
  "format": 1,
  "generator": "korokoro 1.15.1",
  "rolls": [
    {
      "id": "…",
      "notation": "2d20kh1+5",
      "spec": { "count": 2, "sides": 20, "modifier": 5, "keep": "highest" },
      "faces": [19, 12],
      "kept": [true, false],
      "total": 24,
      "at": 1790000000000,
      "time": "2026-09-21T14:13:20.000Z",
      "seed": "table",
      "dice": [
        { "face": 19, "status": "kept", "exploded": false, "die": 0 },
        { "face": 12, "status": "dropped", "exploded": false, "die": 1 }
      ]
    }
  ]
}
```

| Field | What it is |
| --- | --- |
| `notation` | The dice, written the one way Korokoro writes them |
| `faces` | Every die thrown, in the order thrown |
| `kept` | Which faces count |
| `total` | The result. With `"successes": true` beside it, it is a count of successes |
| `dice` | What became of each die: `kept`, `dropped` or `rerolled`; whether it `exploded`; `value` when it counts for something other than its face; `counts` of 1 or −1 when successes are counted |
| `words` | What the faces say, on a roll of custom dice |
| `seed` | The seed, or `null` for a roll from the cryptographic generator |
| `errors` | At the top, beside `rolls`: anything that could not be rolled, each with its `input`, `problem`, `part` and `message` |

Exit codes: `0` done; `1` something asked for could not be rolled (the
message is on standard error, and in `errors`); `2` the command itself was
wrong.

Other shapes, all with `"format": 1`: `koro --odds 2d6 --json` gives `odds`
(each with `min`, `max`, `expected`, `spread`, `mostLikely` and
`probabilities`); `koro --games --json` gives `games`; `koro --test "3 5 6"
--json` gives `test`.

## Many rolls at once

Starting a process for every roll is slow. Send them all at once on standard
input, one to a line, and read one answer:

```sh
printf '2d6\n1d20+5\n4d6dl1\n' | koro --stdin --json --seed table
```

`rolls` comes back in the order asked for. A seed serves the whole command,
so the same input gives the same dice.

## Python

```python
#!/usr/bin/env python3
"""Roll dice from Python: run the command line, read its JSON."""
import json
import shutil
import subprocess

# On Windows the command is koro.cmd; shutil.which finds it either way.
koro = shutil.which("koro")
done = subprocess.run([koro, "2d20kh1+5", "--seed", "table", "--json"], capture_output=True, text=True, encoding="utf-8")
if done.returncode != 0:
    raise SystemExit(done.stderr)
result = json.loads(done.stdout)
assert result["format"] == 1
roll = result["rolls"][0]
print(roll["total"])  # 24: the dice were 19 and 12, the 19 kept, plus 5
```

## Go

```go
// Roll dice from Go: run the command line, read its JSON.
package main

import (
	"encoding/json"
	"fmt"
	"log"
	"os/exec"
)

type roll struct {
	Notation string `json:"notation"`
	Faces    []int  `json:"faces"`
	Kept     []bool `json:"kept"`
	Total    int    `json:"total"`
}

type result struct {
	Format int    `json:"format"`
	Rolls  []roll `json:"rolls"`
}

func main() {
	out, err := exec.Command("koro", "2d20kh1+5", "--seed", "table", "--json").Output()
	if err != nil {
		log.Fatal(err)
	}
	var got result
	if err := json.Unmarshal(out, &got); err != nil {
		log.Fatal(err)
	}
	if got.Format != 1 {
		log.Fatal("this reads format 1")
	}
	fmt.Println(got.Rolls[0].Total) // 24: the dice were 19 and 12, the 19 kept, plus 5
}
```

## Rust

With `serde_json = "1"` in `Cargo.toml`:

```rust
// Roll dice from Rust: run the command line, read its JSON.
use std::process::Command;

fn main() {
    let done = Command::new("koro")
        .args(["2d20kh1+5", "--seed", "table", "--json"])
        .output()
        .expect("koro is on the path");
    if !done.status.success() {
        panic!("{}", String::from_utf8_lossy(&done.stderr));
    }
    let result: serde_json::Value = serde_json::from_slice(&done.stdout).expect("JSON");
    assert_eq!(result["format"], 1);
    // 24: the dice were 19 and 12, the 19 kept, plus 5
    println!("{}", result["rolls"][0]["total"]);
}
```

## C#

```csharp
// Roll dice from C#: run the command line, read its JSON.
using System.Diagnostics;
using System.Text.Json;

var start = new ProcessStartInfo("koro") { RedirectStandardOutput = true, RedirectStandardError = true, UseShellExecute = false };
foreach (var arg in new[] { "2d20kh1+5", "--seed", "table", "--json" }) start.ArgumentList.Add(arg);
using var koro = Process.Start(start)!;
var text = koro.StandardOutput.ReadToEnd();
koro.WaitForExit();
if (koro.ExitCode != 0) throw new Exception(koro.StandardError.ReadToEnd());

using var result = JsonDocument.Parse(text);
if (result.RootElement.GetProperty("format").GetInt32() != 1) throw new Exception("this reads format 1");
// 24: the dice were 19 and 12, the 19 kept, plus 5
Console.WriteLine(result.RootElement.GetProperty("rolls")[0].GetProperty("total").GetInt32());
```

Each of the four is a file in
[`docs/examples/languages`](./examples/languages), and CI installs the package
and runs every one of them, so what is shown here is what runs. On Windows
the command is `koro.cmd`, which a shell finds as `koro`; a program that
starts it without a shell should look it up on the path first, as the Python
example does.

## Without Node

A machine with no Node cannot run `koro` yet. Standalone executables are
planned. Until then, the other way is a port.

## Writing a port

A port is Korokoro's rules in another language, giving the same dice from the
same seed. Three things make that possible:

- [The seeded generator and how dice are drawn](./spec/random.md): the
  algorithm, step by step.
- [The notation](./spec/notation.md): the grammar, what each part means, and
  the one way each roll is written.
- [The conformance suite](../conformance/korokoro-conformance.json): seeds
  with the numbers they give, notation with how it is written back or why it
  is refused, seeded rolls die for die, and exact odds. A port that matches
  the file matches Korokoro.

[`conformance/port_check.py`](../conformance/port_check.py) is a small
example: the generator written in Python from the specification alone, which
checks itself against the suite.

If you are writing one, [open an issue](https://github.com/johnmorrisdotca/korokoro/issues/new?template=porting.md)
and say so: we will link it from the README, and questions about the
specification are welcome there.
