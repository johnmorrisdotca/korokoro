/**
 * Odds of games that take more than one roll, worked out exactly as whole
 * numbers over whole numbers. `presetOdds` counts a single roll; these follow
 * a turn to its end.
 */
type Fraction = [bigint, bigint];

const gcd = (a: bigint, b: bigint): bigint => (b === 0n ? (a < 0n ? -a : a) : gcd(b, a % b));
const lowest = ([n, d]: Fraction): Fraction => {
  const g = gcd(n, d);
  return [n / g, d / g];
};
const add = (a: Fraction, b: Fraction): Fraction => lowest([a[0] * b[1] + b[0] * a[1], a[1] * b[1]]);
const times = (a: Fraction, b: Fraction): Fraction => lowest([a[0] * b[0], a[1] * b[1]]);

/** A fraction as a number, for showing. */
export const asChance = ([n, d]: Fraction): number => Number(n) / Number(d);

/**
 * With `held` dice of one face kept and the other five-less-held thrown
 * again, the chance of ending with each size of largest group, from 1 to 5.
 * The player keeps whichever face is then the most common, changing face if
 * the new dice make a larger group of another.
 */
function afterReroll(held: number): Fraction[] {
  const thrown = 5 - held;
  const counts = [0n, 0n, 0n, 0n, 0n, 0n];
  const faces = new Array<number>(thrown).fill(0);
  for (;;) {
    const of = [held, 0, 0, 0, 0, 0];
    for (const face of faces) of[face] = (of[face] as number) + 1;
    const most = Math.max(...of);
    counts[most] = (counts[most] as bigint) + 1n;
    let i = 0;
    while (i < thrown && faces[i] === 5) faces[i++] = 0;
    if (i === thrown) break;
    faces[i] = (faces[i] as number) + 1;
  }
  return counts.map((c) => lowest([c, 6n ** BigInt(thrown)]));
}

/**
 * The chance of a Yahtzee (five dice alike) within a number of rolls, holding
 * the largest group each time: 1 roll is 1 in 1296, and the usual three come
 * to 347897 in 7558272, about 4.6%.
 */
export function yahtzeeWithin(rolls: number): Fraction {
  // state[m] is the chance of holding a largest group of m dice.
  let state: Fraction[] = [[0n, 1n], [0n, 1n], [0n, 1n], [0n, 1n], [0n, 1n], [0n, 1n]];
  // The first roll is a reroll with one die in hand: every die is its own group of one.
  state = afterReroll(1);
  for (let r = 1; r < rolls; r++) {
    const next: Fraction[] = state.map(() => [0n, 1n]);
    for (let held = 1; held <= 5; held++) {
      const here = state[held] as Fraction;
      if (here[0] === 0n) continue;
      afterReroll(held).forEach((chance, most) => (next[most] = add(next[most] as Fraction, times(here, chance))));
    }
    state = next;
  }
  return state[5] as Fraction;
}

/**
 * The chance that a craps shooter passes: a natural on the come-out, or a
 * point that comes again before a seven. 244 in 495, a little under a half.
 */
export function crapsPass(): Fraction {
  const ways = (total: number): bigint => BigInt(6 - Math.abs(7 - total));
  let pass: Fraction = [ways(7) + ways(11), 36n];
  // A point comes again before a seven with the chance its ways bear to its ways and the seven's together.
  for (const point of [4, 5, 6, 8, 9, 10]) pass = add(pass, times([ways(point), 36n], [ways(point), ways(point) + ways(7)]));
  return pass;
}

/** The chance that three dice make a chinchirorin hand within a number of throws: each throw makes one half the time, so three come to 7 in 8. */
export function chinchirorinHandWithin(throws: number): Fraction {
  return lowest([2n ** BigInt(throws) - 1n, 2n ** BigInt(throws)]);
}
