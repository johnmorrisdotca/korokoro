/**
 * Arithmetic over the kinds of dice in a roll: `(2d6+3)*2`, `1d20-1d4`,
 * `floor(4d6/2)`, `max(1d6,1d8)`. A roll with a formula still throws its
 * kinds of dice in order, exactly as it would without one; the formula is
 * only how their totals are put together.
 *
 * Everything is worked out in whole-number fractions, never in floating
 * point, so `floor(7/3*3)` is 7 and not 6 or 8, in a roll and in its odds
 * alike. A formula must come to a whole number: a division has to be rounded
 * (`floor`, `ceil` or `round`) before it reaches the total.
 */
export type MathNode =
  /** The total of one kind of dice: the roll's kind at this place, from 0. */
  | { kind: "dice"; group: number }
  /** A whole number. */
  | { kind: "number"; value: number }
  /** Two amounts added, taken away, multiplied or divided. */
  | { kind: "op"; op: "+" | "-" | "*" | "/"; left: MathNode; right: MathNode }
  /** A function of one amount (`floor`, `ceil`, `round`, `abs`) or of several (`max`, `min`). */
  | { kind: "call"; name: MathFunction; args: MathNode[] };

/** The functions a formula may call. `round` rounds a half up, as JavaScript's `Math.round` does. */
export type MathFunction = "floor" | "ceil" | "round" | "abs" | "max" | "min";

/** The most pairs of amounts any one step of a formula's odds may have to put together. */
export const MAX_MATH_PAIRS = 4_000_000;
/** The widest span of totals a formula may have. */
export const MAX_MATH_TOTALS = 1_000_000;
/** The largest whole number written in a formula. */
export const MAX_MATH_NUMBER = 9999;
/** The largest amount, either way, any step of a formula may come to. */
export const MAX_MATH_AMOUNT = 1_000_000;
/** The largest bottom of a fraction any step may have: what it may be divided by, all told. It keeps every step exact in whole numbers. */
export const MAX_MATH_DIVISOR = 1000;
/** The most steps a formula may have. */
export const MAX_MATH_NODES = 40;

/** A fraction in lowest terms, its sign on top. */
type Q = { n: number; d: number };

const gcd = (a: number, b: number): number => (b === 0 ? Math.abs(a) : gcd(b, a % b));
function q(n: number, d = 1): Q {
  const sign = d < 0 ? -1 : 1;
  const common = gcd(n, d) || 1;
  return { n: (sign * n) / common, d: (sign * d) / common };
}
const less = (a: Q, b: Q) => a.n * b.d < b.n * a.d;
/** The greatest whole number no more than a fraction, worked out in whole numbers. */
const exactFloor = (a: Q) => (a.n - (((a.n % a.d) + a.d) % a.d)) / a.d;

function apply(op: "+" | "-" | "*" | "/", a: Q, b: Q): Q {
  if (op === "+") return q(a.n * b.d + b.n * a.d, a.d * b.d);
  if (op === "-") return q(a.n * b.d - b.n * a.d, a.d * b.d);
  if (op === "*") return q(a.n * b.n, a.d * b.d);
  return q(a.n * b.d, a.d * b.n);
}

function call(name: MathFunction, args: Q[]): Q {
  const [a] = args as [Q];
  if (name === "floor") return q(exactFloor(a));
  if (name === "ceil") return q(-exactFloor(q(-a.n, a.d)));
  // Half up: the floor of the amount and a half.
  if (name === "round") return q(exactFloor(q(a.n * 2 + a.d, a.d * 2)));
  if (name === "abs") return q(Math.abs(a.n), a.d);
  return args.reduce((best, next) => ((name === "max" ? less(best, next) : less(next, best)) ? next : best));
}

function value(node: MathNode, totals: readonly number[]): Q {
  if (node.kind === "dice") return q(totals[node.group] ?? 0);
  if (node.kind === "number") return q(node.value);
  if (node.kind === "op") return apply(node.op, value(node.left, totals), value(node.right, totals));
  return call(
    node.name,
    node.args.map((arg) => value(arg, totals)),
  );
}

/** What a formula comes to, given each kind's total. A sound formula (`checkMath`) always comes to a whole number. */
export function evaluateMath(node: MathNode, totals: readonly number[]): number {
  const result = value(node, totals);
  return result.d === 1 ? result.n : exactFloor(result);
}

/** Which kinds of dice a formula uses, in the order it names them. */
export function mathGroups(node: MathNode): number[] {
  if (node.kind === "dice") return [node.group];
  if (node.kind === "number") return [];
  if (node.kind === "op") return [...mathGroups(node.left), ...mathGroups(node.right)];
  return node.args.flatMap(mathGroups);
}

function count(node: MathNode): number {
  if (node.kind === "dice" || node.kind === "number") return 1;
  if (node.kind === "op") return 1 + count(node.left) + count(node.right);
  return 1 + node.args.reduce((sum, arg) => sum + count(arg), 0);
}

const FUNCTIONS: readonly string[] = ["floor", "ceil", "round", "abs", "max", "min"];

/** A formula given by hand, checked for its shape alone: the nodes are what they say they are. Undefined when it is not a formula. */
export function soundMath(given: unknown, depth = 0): MathNode | undefined {
  if (typeof given !== "object" || given === null || depth > MAX_MATH_NODES) return undefined;
  const node = given as Record<string, unknown>;
  if (node.kind === "dice") return Number.isInteger(node.group) && (node.group as number) >= 0 ? { kind: "dice", group: node.group as number } : undefined;
  if (node.kind === "number") return Number.isInteger(node.value) && Math.abs(node.value as number) <= MAX_MATH_NUMBER ? { kind: "number", value: node.value as number } : undefined;
  if (node.kind === "op") {
    const left = soundMath(node.left, depth + 1);
    const right = soundMath(node.right, depth + 1);
    if ((node.op !== "+" && node.op !== "-" && node.op !== "*" && node.op !== "/") || left === undefined || right === undefined) return undefined;
    return { kind: "op", op: node.op, left, right };
  }
  if (node.kind === "call" && typeof node.name === "string" && FUNCTIONS.includes(node.name) && Array.isArray(node.args)) {
    const args = node.args.map((arg) => soundMath(arg, depth + 1));
    const several = node.name === "max" || node.name === "min";
    if (args.includes(undefined) || (several ? args.length < 2 || args.length > 4 : args.length !== 1)) return undefined;
    return { kind: "call", name: node.name as MathFunction, args: args as MathNode[] };
  }
  return undefined;
}

/** Why a formula cannot be used, when it cannot. */
export type MathProblem =
  /** It does not name each kind of dice exactly once, or has too many steps. */
  | "shape"
  /** It can come to something that is not a whole number: a division that is not rounded. */
  | "fraction"
  /** It can divide by nothing. */
  | "zero"
  /** Its totals spread too wide, or its odds would take too long to work out. */
  | "large";

type Span = { min: Q; max: Q; whole: boolean; width: number; bottom: number };

const size = (a: Q) => Math.abs(a.n) / a.d;

function span(node: MathNode, ranges: readonly { min: number; max: number }[]): Span | MathProblem {
  if (node.kind === "dice") {
    const range = ranges[node.group];
    if (range === undefined) return "shape";
    return { min: q(range.min), max: q(range.max), whole: true, width: range.max - range.min + 1, bottom: 1 };
  }
  if (node.kind === "number") return { min: q(node.value), max: q(node.value), whole: true, width: 1, bottom: 1 };
  const wide = (min: Q, max: Q, whole: boolean, width: number, bottom: number): Span | MathProblem => {
    const across = whole ? exactFloor(max) - exactFloor(min) + 1 : width;
    const narrow = Math.min(width, across);
    if (narrow > MAX_MATH_TOTALS || size(min) > MAX_MATH_AMOUNT || size(max) > MAX_MATH_AMOUNT || bottom > MAX_MATH_DIVISOR) return "large";
    return { min, max, whole, width: narrow, bottom: whole ? 1 : bottom };
  };
  if (node.kind === "op") {
    const a = span(node.left, ranges);
    const b = span(node.right, ranges);
    if (typeof a === "string") return a;
    if (typeof b === "string") return b;
    if (a.width * b.width > MAX_MATH_PAIRS) return "large";
    if (node.op === "/" && !less(q(0), b.min) && !less(b.max, q(0))) return "zero";
    // Every way the ends can be put together: the least and the most are among them.
    const ends = [apply(node.op, a.min, b.min), apply(node.op, a.min, b.max), apply(node.op, a.max, b.min), apply(node.op, a.max, b.max)];
    const min = ends.reduce((x, y) => (less(y, x) ? y : x));
    const max = ends.reduce((x, y) => (less(x, y) ? y : x));
    // The bottom of a quotient is at most the bottom it had times the largest top it is divided by.
    const bottom = node.op === "/" ? a.bottom * Math.max(size(b.min), size(b.max)) * b.bottom : a.bottom * b.bottom;
    return wide(min, max, node.op !== "/" && a.whole && b.whole, a.width * b.width, bottom);
  }
  const args: Span[] = [];
  for (const arg of node.args) {
    const made = span(arg, ranges);
    if (typeof made === "string") return made;
    args.push(made);
  }
  const [first] = args as [Span];
  if (node.name === "floor" || node.name === "ceil" || node.name === "round") return wide(call(node.name, [first.min]), call(node.name, [first.max]), true, first.width, 1);
  if (node.name === "abs") {
    const low = call("abs", [first.min]);
    const high = call("abs", [first.max]);
    const crosses = less(first.min, q(0)) && less(q(0), first.max);
    return wide(crosses ? q(0) : less(low, high) ? low : high, less(low, high) ? high : low, first.whole, first.width, first.bottom);
  }
  if (args.reduce((pairs, arg) => pairs * arg.width, 1) > MAX_MATH_PAIRS) return "large";
  return wide(
    call(
      node.name,
      args.map((arg) => arg.min),
    ),
    call(
      node.name,
      args.map((arg) => arg.max),
    ),
    args.every((arg) => arg.whole),
    args.reduce((sum, arg) => sum + arg.width, 0),
    Math.max(...args.map((arg) => arg.bottom)),
  );
}

/**
 * Whether a formula can be used with kinds of dice whose totals run over
 * these ranges: the problem, or null when there is none. It has to name each
 * kind exactly once (so the kinds stay independent and the odds exact), come
 * to a whole number, never divide by nothing, and stay small enough to count.
 */
export function checkMath(node: MathNode, ranges: readonly { min: number; max: number }[]): MathProblem | null {
  const used = mathGroups(node);
  if (count(node) > MAX_MATH_NODES || used.length !== ranges.length || new Set(used).size !== used.length || used.some((g) => g >= ranges.length)) return "shape";
  const made = span(node, ranges);
  if (typeof made === "string") return made;
  return made.whole ? null : "fraction";
}

/** The least and the most a sound formula can come to, given each kind's range. */
export function mathRange(node: MathNode, ranges: readonly { min: number; max: number }[]): { min: number; max: number } {
  const made = span(node, ranges);
  if (typeof made === "string") return { min: 0, max: 0 };
  return { min: exactFloor(made.min), max: exactFloor(made.max) };
}

const key = (a: Q) => `${a.n}/${a.d}`;
type Spread = Map<string, { at: Q; chance: number }>;

function spread(node: MathNode, leaves: readonly Map<number, number>[]): Spread {
  const out: Spread = new Map();
  const put = (at: Q, chance: number) => {
    const k = key(at);
    const have = out.get(k);
    if (have === undefined) out.set(k, { at, chance });
    else have.chance += chance;
  };
  if (node.kind === "dice") for (const [total, chance] of leaves[node.group] ?? []) put(q(total), chance);
  else if (node.kind === "number") put(q(node.value), 1);
  else if (node.kind === "op") {
    const a = spread(node.left, leaves);
    const b = spread(node.right, leaves);
    for (const x of a.values()) for (const y of b.values()) put(apply(node.op, x.at, y.at), x.chance * y.chance);
  } else {
    // Every way the arguments can come out together: they share no dice, so their chances multiply.
    let ways: { at: Q[]; chance: number }[] = [{ at: [], chance: 1 }];
    for (const arg of node.args) {
      const made = [...spread(arg, leaves).values()];
      ways = ways.flatMap((way) => made.map((one) => ({ at: [...way.at, one.at], chance: way.chance * one.chance })));
    }
    for (const way of ways) put(call(node.name, way.at), way.chance);
  }
  return out;
}

/**
 * The odds of a formula: the chance of each whole number it can come to,
 * given the chance of each total of each kind of dice. Exact in its
 * arithmetic, because the kinds share no dice and each is named once.
 */
export function spreadMath(node: MathNode, leaves: readonly Map<number, number>[]): Map<number, number> {
  const out = new Map<number, number>();
  for (const { at, chance } of spread(node, leaves).values()) {
    const total = at.d === 1 ? at.n : exactFloor(at);
    out.set(total, (out.get(total) ?? 0) + chance);
  }
  return out;
}

const RANK = { "+": 1, "-": 1, "*": 2, "/": 2 } as const;

/** A formula as notation writes it, with brackets only where they are needed. `dice` writes the kind at a place. */
export function mathText(node: MathNode, dice: (group: number) => string): string {
  if (node.kind === "dice") return dice(node.group);
  if (node.kind === "number") return String(node.value);
  if (node.kind === "call") return `${node.name}(${node.args.map((arg) => mathText(arg, dice)).join(",")})`;
  // Nothing taken from nought is written as a minus sign: -1d6.
  if (node.op === "-" && node.left.kind === "number" && node.left.value === 0) {
    const inner = mathText(node.right, dice);
    return `-${node.right.kind === "op" ? `(${inner})` : inner}`;
  }
  const rank = RANK[node.op];
  const side = (child: MathNode, right: boolean) => {
    const text = mathText(child, dice);
    const loose = child.kind === "op" && (RANK[child.op] < rank || (right && RANK[child.op] === rank && (node.op === "-" || node.op === "/")));
    // A negative number on the right is bracketed so that it cannot be read as two signs.
    return loose || (right && text.startsWith("-")) ? `(${text})` : text;
  };
  return `${side(node.left, false)}${node.op}${side(node.right, true)}`;
}
