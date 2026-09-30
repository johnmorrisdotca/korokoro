// The conformance suite: what any port of Korokoro has to reproduce, as data.
// It is made from this implementation (`pnpm docs:make` rewrites it) and a
// test fails when the two differ, so the file is never out of date and a
// change to a seeded roll or to the notation cannot land unnoticed.
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";

import { describe, expect, it } from "vitest";

import { roll, rollFrom, rollHeld, rollMany } from "./dice.ts";
import { checkNotation, formatNotation, parseNotation } from "./notation.ts";
import { distributionOf, exactCounts } from "./odds.ts";
import { randomInt, seededSource } from "./random.ts";

const FILE = "conformance/korokoro-conformance.json";

/** Seeds of every kind: plain, empty, one character, and text outside ASCII, which is hashed by its UTF-16 code units. */
const SEEDS = ["table", "table-7", "", "a", "コロコロ", "The quick brown fox"];

/** Notation that is read, with the one way it is written back. Every rule is here at least once. */
const READ = [
  "d20", "2d6", "3d6+2", "4d8-1", "d%", "10d10", "d1000", "2d3", "4dF", "2D6 + 3",
  "2d20kh1", "2d20kh", "2d20kl1", "4d6kh3", "4d6dl1", "5d10dh2", "4d6k3", "4d6d1", "4d6b3", "2d20w1",
  "2d6r<3", "2d6r<=2", "2d6ro<3", "2d6r", "2d6ro", "2d6r=3", "2d6r3", "2d6r>=5", "2d6ro=6", "2d6ro>4", "2d6ro<>3", "2d6ro!=3",
  "3d6!", "3d6!ro<2+1", "3d6!>=5", "3d6!>4", "3d6!=1", "3d6!=6", "3d6!!", "3d6!p", "3d6!!p", "3d6!!>=5",
  "6d10>=8", "6d10>7", "6d10>=8f=1", "6d10>7f1", "3d6=6", "4d6<3", "3d6<>1", "6d10>=8!", "6d10!>=10>=8",
  "4d6min2", "4d6max5", "4d6max5min2", "1d20cs>=19cf=1", "1d20cscf", "4d6sd", "4d6s", "4d6sdkh3", "4d6u", "5d10usd",
  "1d20+1d4", "2d6+1d8+3", "2d20kh1+1d4+5", "2d6+3d6", "1d4+1d6+1d8+1d10",
  "d[Yes,No,Maybe]", "2d[Hit=1,Miss=0,Miss=0]", "d[1,1,2,3,5,8]", "d[Yes#2a7,No]", "d6{6:3}", "2d6{1:0,6:2}+1",
  "6#4d6dl1", "3#2d20kh1+5", "2d6+3 # fire damage", "[fire damage] 2d6+3", "6#4d6dl1 # ability scores",
  "(2d6+3)*2", "2d6x2", "1d20-1d4", "-1d6+10", "floor(4d6/2)", "ceil(4d6/2)", "round(4d6/2)", "abs(1d6-1d6)", "max(1d6,1d8)", "min(1d6,1d8,4)",
  "{4d6,3d8}kh1", "{4d6,3d8}kl1", "(2d6+3)", "3+2d6", "2d6+3+1d4", "1d20-(1d4+2)", "floor(2d6kh1/2)+1d6ro<2", "3#(1d6+1)*2",
];

/** Notation that is refused, with the problem named and the part of the text it is about. */
const REFUSED = [
  "", "nonsense", "11d6", "0d6", "d1", "d1001", "2d6+100", "4d6kh4", "4d6dl4", "1d20kh1", "4d6kh3dl1", "3d6!r<2!",
  "2d6ro<1", "2d6ro<7", "2d6r=7", "1d6r<5", "2d6r>=3", "1d4+1d6+1d8+1d10+1d12", "6d6+5d8",
  "d[only]", "2d[Yes,No]kh1", "d6{7:2}", "d6{6:1}", "4d6!kh3", "4dF!", "2d1000!", "0#2d6", "101#2d6",
  "6d10>=11", "6d10>=1", "6d10f1", "6d10>=8f>=8", "4d6kh3>=5", "3d6!>=1", "3d6!=7", "4d6min1", "4d6max6", "4d6min5max4", "1d20cs>=21",
  "2d6 # 3", "2d6 # one # two", "4d6/2", "max(1d6/2,3)", "6/(1d4-1)", "(2d6", "floor(2d6,2)", "{4d6,3d8}kh2", "2d6*10000", "1d1000*1d1000*1d1000",
  "7d6u", "4d6uo", "3d6!u", "2*3", "2d6*1.5",
];

/** Rolls to replay die for die: each from its own seed. */
const ROLLS = [
  "2d6", "4d6dl1", "2d20kh1+5", "10d10", "d1000", "4dF", "3d6!", "3d6!ro<2+1", "2d6r<3", "2d6ro<3", "2d6r>=5", "2d6ro=6",
  "3d6!>=5", "3d6!!", "3d6!p", "3d6!!p", "6d10>=8f=1", "5d10>=8!", "4d6min2max5", "1d20cs>=19cf=1+5", "4d6sd", "5d6u", "6d6u",
  "1d20+2d4+3", "2d20kh1+1d4+5", "d[Yes,No,Maybe]", "3d[Hit=1,Miss=0,Miss=0]", "d6{6:3}", "2d6{1:0,6:2}+1",
  "(2d6+3)*2", "1d20-1d4", "floor(4d6/2)", "max(1d20,1d20)+5", "round(2d6/3)*3", "abs(1d6-1d6)",
];

/** Rolls whose odds are counted in whole numbers, and rolls whose odds are chances. */
const ODDS = [
  "d20", "2d6", "3d6+2", "2d20kh1", "2d20kl1+5", "4dF", "1d20+1d4", "3d6u", "d6{6:3}", "2d[Hit=1,Miss=0,Miss=0]",
  "4d6dl1", "2d6r<3", "2d6ro<3", "3d6!", "6d10>=8f=1", "5d10>=8!", "3d6!p", "4d6min2", "(2d6+3)*2", "floor(4d6/2)", "1d20-1d4", "max(1d6,1d8)",
];

const spec = (text) => parseNotation(text);
/** A chance to twelve significant figures: more than any port needs to match, and steady across JavaScript engines. */
const chance = (p) => Number(p.toPrecision(12));
const die = (d) => {
  const out = { face: d.face, status: d.status, exploded: d.exploded, die: d.die };
  if (d.group !== undefined) out.group = d.group;
  if (d.label !== undefined) out.label = d.label;
  if (d.value !== undefined) out.value = d.value;
  if (d.counts !== undefined) out.counts = d.counts;
  if (d.critical !== undefined) out.critical = d.critical;
  return out;
};

function suite() {
  const random = SEEDS.map((seed) => {
    const source = seededSource(seed);
    const uint32 = Array.from({ length: 8 }, () => source.next());
    const below = [2, 3, 6, 20, 100, 1000].map((n) => {
      const fresh = seededSource(seed);
      return { n, values: Array.from({ length: 12 }, () => randomInt(fresh, n)) };
    });
    return { seed, uint32, below };
  });
  const reads = READ.map((text) => ({ text, written: formatNotation(spec(text)) }));
  const refuses = REFUSED.map((text) => {
    const read = checkNotation(text);
    return { text, problem: read.problem, part: read.part };
  });
  const rolls = ROLLS.map((notation, i) => {
    const seed = `conformance ${i + 1}`;
    const thrown = roll(spec(notation), seededSource(seed), 0);
    return { notation, seed, faces: thrown.faces, kept: thrown.kept, total: thrown.total, dice: thrown.dice.map(die) };
  });
  // A set of rolls, and a roll with dice held, draw from the one stream in order.
  const set = rollMany(spec("6#4d6dl1"), undefined, seededSource("conformance set"), 0);
  const first = roll(spec("5d6"), seededSource("conformance hold"), 0);
  const held = [true, false, false, true, false];
  const second = rollHeld(first, held, seededSource("conformance hold again"), 0);
  const odds = ODDS.map((notation) => {
    const counts = exactCounts(spec(notation));
    const d = distributionOf(spec(notation));
    const out = { notation, min: d.min, max: d.max };
    if (counts !== null) {
      out.outcomes = String(counts.outcomes);
      out.counts = counts.counts.map(String);
    } else out.probabilities = d.probabilities.map(chance);
    return out;
  });
  return {
    format: 1,
    about: "What any implementation of Korokoro has to reproduce. Made from the reference implementation (https://github.com/johnmorrisdotca/korokoro) and checked against it by its tests. docs/spec/random.md and docs/spec/notation.md say how each part is worked out.",
    random,
    notation: { reads, refuses },
    rolls,
    set: { notation: "6#4d6dl1", seed: "conformance set", rolls: set.rolls.map((r) => ({ faces: r.faces, total: r.total })), sum: set.sum, highest: set.highest, lowest: set.lowest },
    held: { notation: "5d6", first: { seed: "conformance hold", faces: first.faces }, held, second: { seed: "conformance hold again", faces: second.faces, total: second.total } },
    odds,
  };
}

describe("the conformance suite", () => {
  const made = `${JSON.stringify(suite(), null, 1)}\n`;

  it("is what this implementation makes: run `pnpm docs:make` after a change that is meant", () => {
    if (process.env.UPDATE_DOCS === "1") writeFileSync(FILE, made);
    expect(readFileSync(FILE, "utf8")).toBe(made);
  });

  it("covers every refusal by name, and refuses what it says is refused", () => {
    const data = JSON.parse(made);
    for (const { text, problem, part } of data.notation.refuses) {
      expect(problem, text).toBeTypeOf("string");
      expect(part, text).toBeTypeOf("string");
      expect(parseNotation(text), text).toBeNull();
    }
    const named = new Set(data.notation.refuses.map((r) => r.problem));
    for (const problem of ["shape", "count", "sides", "bonus", "twice", "keep", "reroll", "explode", "kinds", "custom", "weights", "times", "successes", "clamp", "marks", "label", "unique", "math", "fraction", "zero"]) expect(named.has(problem), problem).toBe(true);
  });

  it("can be passed by an implementation that reads nothing but the file", () => {
    // This one: every part of the suite checked against the file's own data, as a port would.
    const data = JSON.parse(readFileSync(FILE, "utf8"));
    expect(data.format).toBe(1);
    for (const { seed, uint32, below } of data.random) {
      const source = seededSource(seed);
      expect(uint32.map(() => source.next()), seed).toEqual(uint32);
      for (const { n, values } of below) {
        const fresh = seededSource(seed);
        expect(values.map(() => randomInt(fresh, n)), `${seed} below ${n}`).toEqual(values);
      }
    }
    for (const { text, written } of data.notation.reads) {
      expect(formatNotation(parseNotation(text)), text).toBe(written);
      // What is written back reads as the same roll, and is written the same way again.
      expect(formatNotation(parseNotation(written)), written).toBe(written);
    }
    for (const { notation, seed, faces, kept, total, dice } of data.rolls) {
      const thrown = roll(parseNotation(notation), seededSource(seed), 0);
      expect([thrown.faces, thrown.kept, thrown.total], notation).toEqual([faces, kept, total]);
      expect(thrown.dice.map(die), notation).toEqual(dice);
      // And the other way: the faces alone are enough to put the roll back together.
      expect(rollFrom(parseNotation(notation), faces, "x", 0, seed).total, notation).toBe(total);
    }
    expect(rollMany(parseNotation(data.set.notation), undefined, seededSource(data.set.seed), 0).rolls.map((r) => r.total)).toEqual(data.set.rolls.map((r) => r.total));
    const again = rollHeld(roll(parseNotation(data.held.notation), seededSource(data.held.first.seed), 0), data.held.held, seededSource(data.held.second.seed), 0);
    expect(again.faces).toEqual(data.held.second.faces);
    for (const { notation, min, max, outcomes, counts, probabilities } of data.odds) {
      const d = distributionOf(parseNotation(notation));
      expect([d.min, d.max], notation).toEqual([min, max]);
      if (counts !== undefined) {
        const exact = exactCounts(parseNotation(notation));
        expect([String(exact.outcomes), exact.counts.map(String)], notation).toEqual([outcomes, counts]);
        expect(counts.reduce((sum, c) => sum + BigInt(c), 0n), notation).toBe(BigInt(outcomes));
      } else expect(d.probabilities.map(chance), notation).toEqual(probabilities);
    }
  });
});

describe("the specification pages", () => {
  const data = JSON.parse(readFileSync(FILE, "utf8"));
  const notation = readFileSync("docs/spec/notation.md", "utf8");
  const random = readFileSync("docs/spec/random.md", "utf8");

  it("count what the suite holds", () => {
    expect(notation).toContain(`${data.notation.reads.length} texts that are read`);
    expect(notation).toContain(`${data.notation.refuses.length} that are refused`);
    expect(random).toContain("`rolls[]` in the conformance file is thirty-five rolls");
    expect(data.rolls).toHaveLength(35);
    expect(data.random[0].uint32).toHaveLength(8);
    expect(data.random[0].below.map((b) => b.n)).toEqual([2, 3, 6, 20, 100, 1000]);
  });

  it("name every problem a refusal can have, and no other", () => {
    const from = notation.indexOf("## Refusals");
    const listed = [...notation.slice(from).matchAll(/^\| `([a-z]+)` \|/gm)].map((m) => m[1]);
    const given = new Set(data.notation.refuses.map((r) => r.problem));
    expect(new Set(listed)).toEqual(given);
  });

  it("the constants the generator is built from are the ones written down", () => {
    const source = readFileSync("src/random.ts", "utf8");
    for (const number of ["1779033703", "3144134277", "1013904242", "2773480762", "597399067", "2869860233", "951274213", "2716044179"]) {
      expect(source, number).toContain(number);
      expect(random, number).toContain(number);
    }
    expect(source).toContain("for (let i = 0; i < 15; i++) step();");
    expect(random).toContain("The first fifteen steps are thrown away");
  });
});
