#!/usr/bin/env python3
"""A port of Korokoro's seeded generator, written from docs/spec/random.md alone.

It is here for two reasons: to show that the specification is enough to write
a port from, and as a start for anyone writing one. It checks itself against
the conformance suite: the stream for every seed, the fair picks below n, and
every roll of plain dice (`2d6`, `10d10`, `d1000`, `4dF`), die for die.

    python3 conformance/port_check.py

Standard library only. Exit code 0 when everything matches.
"""
import json
import os
import re
import sys

MASK = 0xFFFFFFFF


def imul(a, b):
    return (a * b) & MASK


def words_of(seed):
    """Step 1: a seed's UTF-16 code units hashed into four words."""
    h1, h2, h3, h4 = 1779033703, 3144134277, 1013904242, 2773480762
    units = seed.encode("utf-16-le")
    for i in range(0, len(units), 2):
        k = units[i] | (units[i + 1] << 8)
        h1 = h2 ^ imul(h1 ^ k, 597399067)
        h2 = h3 ^ imul(h2 ^ k, 2869860233)
        h3 = h4 ^ imul(h3 ^ k, 951274213)
        h4 = h1 ^ imul(h4 ^ k, 2716044179)
    h1 = imul(h3 ^ (h1 >> 18), 597399067)
    h2 = imul(h4 ^ (h2 >> 22), 2869860233)
    h3 = imul(h1 ^ (h3 >> 17), 951274213)
    h4 = imul(h2 ^ (h4 >> 19), 2716044179)
    return [(h1 ^ h2 ^ h3 ^ h4) & MASK, (h2 ^ h1) & MASK, (h3 ^ h1) & MASK, (h4 ^ h1) & MASK]


class Stream:
    """Step 2: sfc32, with its first fifteen numbers thrown away."""

    def __init__(self, seed):
        self.a, self.b, self.c, self.d = words_of(seed)
        for _ in range(15):
            self.next()

    def next(self):
        t = (self.a + self.b) & MASK
        self.a = self.b ^ (self.b >> 9)
        self.b = (self.c + (self.c << 3)) & MASK
        self.c = ((self.c << 21) | (self.c >> 11)) & MASK
        self.d = (self.d + 1) & MASK
        t = (t + self.d) & MASK
        self.c = (self.c + t) & MASK
        return t

    def below(self, n):
        """Step 3: a fair whole number from 0 up to but not including n."""
        limit = 2**32 - (2**32 % n)
        while True:
            v = self.next()
            if v < limit:
                return v % n


def main():
    here = os.path.dirname(os.path.abspath(__file__))
    with open(os.path.join(here, "korokoro-conformance.json"), encoding="utf-8") as file:
        suite = json.load(file)
    if suite["format"] != 1:
        sys.exit("this check reads format 1")
    checked = 0
    for entry in suite["random"]:
        stream = Stream(entry["seed"])
        assert [stream.next() for _ in entry["uint32"]] == entry["uint32"], f"the stream for {entry['seed']!r}"
        for picks in entry["below"]:
            fresh = Stream(entry["seed"])
            assert [fresh.below(picks["n"]) for _ in picks["values"]] == picks["values"], f"picks below {picks['n']} for {entry['seed']!r}"
        checked += 1
    rolled = 0
    for roll in suite["rolls"]:
        # Steps 4 and 5 for the plain dice: a count, a d, and a number of sides or F. The rest need the notation's rules.
        plain = re.fullmatch(r"(\d*)d(\d+|F)", roll["notation"])
        if plain is None:
            continue
        count = int(plain.group(1) or 1)
        stream = Stream(roll["seed"])
        if plain.group(2) == "F":
            faces = [stream.below(3) - 1 for _ in range(count)]
        else:
            faces = [stream.below(int(plain.group(2))) + 1 for _ in range(count)]
        assert faces == roll["faces"], f"{roll['notation']} from {roll['seed']!r}: {faces} is not {roll['faces']}"
        assert sum(faces) == roll["total"], roll["notation"]
        rolled += 1
    assert rolled >= 4, "the suite should hold at least four rolls of plain dice"
    print(f"{checked} seeds and {rolled} rolls of plain dice match the conformance suite")


if __name__ == "__main__":
    main()
