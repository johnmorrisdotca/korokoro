import { describe, expect, it } from "vitest";
import { canHold, diceOf, MAX_GROUPS, roll, rollHeld } from "./dice.ts";
import { parseHistory, serializeHistory } from "./history.ts";
import {
  chanceAtLeast,
  chanceExactly,
  distributionHolding,
  distributionOf,
  expectedTotal,
  luckOf,
  mostLikely,
  spreadOf,
} from "./odds.ts";
import { dice, scripted, sum } from "./pools.fixture.ts";
import { seededSource } from "./random.ts";
import { readShared, shareQuery } from "./share.ts";
import { statsOf } from "./stats.ts";
import { STRINGS } from "./ui/strings.ts";

describe("holding dice", () => {
  it("only plain dice can be held", () => {
    expect(canHold(dice("5d6"))).toBe(true);
    expect(canHold(dice("1d20+2d4+3"))).toBe(true);
    expect(canHold(dice("4dF"))).toBe(true);
    for (const text of ["4d6kh3", "3d6!", "2d6ro<2", "2d6r<2", "1d20+2d6!"]) {
      expect(canHold(dice(text)), text).toBe(false);
      expect(() => rollHeld(roll(dice(text), seededSource("h"), 1), [], seededSource("h"))).toThrow(RangeError);
    }
    expect(() => rollHeld(roll(dice("5d6"), seededSource("h"), 1), [true], seededSource("h"))).toThrow(RangeError);
  });

  it("keeps the held faces and throws the rest, in order, from the same source", () => {
    const first = roll(dice("5d6+1"), scripted([6, 2, 6, 1, 3]), 1);
    const second = rollHeld(first, [true, false, true, false, false], scripted([6, 4, 4]), 2);
    expect(second.faces).toEqual([6, 6, 6, 4, 4]);
    expect(second.held).toEqual([true, false, true, false, false]);
    expect(second.total).toBe(27);
    expect(second.spec).toEqual(first.spec);
    expect(second.kept).toEqual([true, true, true, true, true]);
    expect(first.held).toBeUndefined();
    const all = rollHeld(second, [true, true, true, true, true], scripted([]), 3);
    expect(all.faces).toEqual(second.faces);
  });

  it("holds across kinds of dice", () => {
    const first = roll(dice("1d20+2d4"), scripted([3, 4, 1]), 1);
    const second = rollHeld(first, [false, true, false], scripted([19, 2]), 2);
    expect(second.faces).toEqual([19, 4, 2]);
    expect(second.dice?.map((d) => d.group)).toEqual([0, 1, 1]);
  });

  it("replays from a seed: the same holds give the same dice", () => {
    const play = () => {
      const source = seededSource("yacht");
      const one = roll(dice("5d6"), source, 1);
      const two = rollHeld(
        one,
        one.faces.map((f) => f >= 5),
        source,
        2,
      );
      const three = rollHeld(
        two,
        two.faces.map((f) => f >= 5),
        source,
        3,
      );
      return [one.faces, two.faces, three.faces, three.held];
    };
    expect(play()).toEqual(play());
    expect(play()[0]).toEqual([3, 3, 6, 3, 6]);
    const [one, two] = play() as number[][];
    one!.forEach((face, i) => {
      if (face >= 5) expect(two![i]).toBe(face);
    });
  });

  it("is kept and shared with which dice were held", () => {
    const first = roll(dice("5d6"), seededSource("keep"), 1);
    const second = rollHeld(first, [true, false, false, true, false], seededSource("keep2"), 2);
    expect(parseHistory(serializeHistory([first, second]))).toEqual([first, second]);
    expect(shareQuery(second)).toContain("held=0%2C3");
    expect(readShared(shareQuery(second))).toMatchObject({ faces: second.faces, held: second.held });
    expect(readShared(shareQuery(first))).not.toHaveProperty("held");
    expect(readShared("roll=5d6&faces=1,2,3,4,5&held=7&v=2")).toBeNull();
    expect(readShared("roll=4d6kh3&faces=1,2,3,4&held=1&v=2")).toBeNull();
    // A history whose held does not fit is kept as an ordinary roll.
    expect(
      parseHistory(JSON.stringify([{ spec: first.spec, faces: first.faces, at: 1, held: [true] }]))[0],
    ).not.toHaveProperty("held");
  });

  it("the odds with dice held are the odds of the rest, on top of what is held", () => {
    const spec = dice("5d6+1");
    const held = distributionHolding(spec, [6, 2, 6, 1, 3], [true, false, true, false, false]);
    // Twelve held, plus one, plus three d6.
    expect(held.min).toBe(16);
    expect(held.max).toBe(31);
    expect(held.probabilities).toEqual(distributionOf(dice("3d6")).probabilities);
    expect(expectedTotal(held)).toBeCloseTo(12 + 1 + 10.5, 12);
    expect(chanceAtLeast(held, 31)).toBeCloseTo(1 / 216, 14);
    expect(chanceExactly(held, 15)).toBe(0);
    expect(luckOf(held, 16)).toBeCloseTo(1 / 432, 14);
    expect(mostLikely(held)).toEqual([23, 24]);
    const mixed = distributionHolding(dice("1d20+2d4"), [3, 4, 1], [false, true, false]);
    expect(mixed.min).toBe(6);
    expect(mixed.max).toBe(28);
    expect(sum(mixed.probabilities)).toBeCloseTo(1, 14);
    expect(expectedTotal(mixed)).toBeCloseTo(4 + 10.5 + 2.5, 12);
  });

  it("with every die held the total is certain, and with none it is the roll's own odds", () => {
    const spec = dice("3d6+2");
    expect(distributionHolding(spec, [1, 2, 3], [true, true, true])).toEqual({ min: 8, max: 8, probabilities: [1] });
    const none = distributionHolding(spec, [1, 2, 3], [false, false, false]);
    expect(none.min).toBe(5);
    none.probabilities.forEach((p, i) => {
      expect(p).toBeCloseTo(distributionOf(spec).probabilities[i] as number, 14);
    });
    expect(() => distributionHolding(dice("4d6kh3"), [1, 2, 3, 4], [true, false, false, false])).toThrow(RangeError);
  });

  it("the odds agree with the dice thrown again", () => {
    const spec = dice("5d6");
    const first = roll(spec, scripted([6, 2, 6, 1, 3]), 1);
    const held = [true, false, true, false, false];
    const d = distributionHolding(spec, first.faces, held);
    const source = seededSource("again");
    const throws = 30_000;
    let total = 0;
    for (let i = 0; i < throws; i++) total += rollHeld(first, held, source, i).total;
    expect(Math.abs(total / throws - expectedTotal(d))).toBeLessThan((4 * spreadOf(d)) / Math.sqrt(throws));
  });

  it("stats count a held roll's new dice only, and leave it out of luck and totals", () => {
    const first = roll(dice("5d6"), scripted([6, 2, 6, 1, 3]), 1);
    const second = rollHeld(first, [true, false, true, false, false], scripted([6, 4, 4]), 2);
    const stats = statsOf([first, second], dice("5d6"));
    expect(stats.rolls).toBe(2);
    expect(stats.heldRolls).toBe(1);
    expect(stats.diceThrown).toBe(8);
    expect(stats.faces?.counts).toEqual([1, 1, 1, 2, 0, 3]);
    expect(stats.totals?.rolls).toBe(1);
    expect(stats.luck).toBeCloseTo(luckOf(dice("5d6"), 18), 12);
    expect(diceOf(second).every((d) => d.status === "kept")).toBe(true);
  });
});

it("the tray's words for the new refusals name the limits the code keeps", () => {
  for (const words of [STRINGS.en, STRINGS.ja]) {
    expect(words.notationKinds).toContain(String(MAX_GROUPS));
    expect(words.notationKinds).toContain("{part}");
    expect(words.notationMinus).toContain("{part}");
  }
});
