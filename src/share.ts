import { canHold, rollFrom, type Roll } from "./dice.ts";
import { formatNotation, parseNotation } from "./notation.ts";

/**
 * The version of the notation a link is written in. 2 is where `r` came to
 * mean reroll until clear; a link with no version is from 1.0.0 to 1.3.0,
 * where `r` rerolled once, and is read that way.
 */
export const SHARE_VERSION = 2;

/**
 * A roll as a link. The query carries the dice, the faces and when, so the
 * person opening it sees exactly what was thrown, every rerolled and exploded
 * die included. A seeded roll carries its seed too, so the same dice can be
 * thrown again and come out the same; a roll with dice held says which.
 */
export function shareQuery(roll: Roll): string {
  const params = new URLSearchParams({ roll: formatNotation(roll.spec), faces: roll.faces.join(","), at: String(roll.at) });
  if (roll.seed !== null) params.set("seed", roll.seed);
  if (roll.held !== undefined) params.set("held", roll.held.flatMap((h, i) => (h ? [i] : [])).join(","));
  params.set("v", String(SHARE_VERSION));
  return params.toString();
}

/**
 * A set of rolls as a link: the notation with its `6#`, and every roll's
 * faces, the rolls parted by semicolons.
 */
export function shareQueryMany(rolls: readonly Roll[]): string {
  const first = rolls[0];
  if (first === undefined) return "";
  const spec = { ...first.spec, times: rolls.length };
  const params = new URLSearchParams({ roll: formatNotation(spec), faces: rolls.map((r) => r.faces.join(",")).join(";"), at: String(first.at) });
  if (first.seed !== null) params.set("seed", first.seed);
  params.set("v", String(SHARE_VERSION));
  return params.toString();
}

/** A shared set of rolls from a query string, or null when it does not hold one: as many rolls as the notation's `#` says, each with faces its dice could show. */
export function readSharedMany(query: string | URLSearchParams): Roll[] | null {
  const params = typeof query === "string" ? new URLSearchParams(query.replace(/^\?/, "")) : query;
  const spec = parseNotation(params.get("roll") ?? "", { legacyReroll: params.get("v") === null });
  const each = (params.get("faces") ?? "").split(";");
  if (spec === null || (spec.times ?? 1) !== each.length || each.length < 2) return null;
  const at = Number(params.get("at"));
  const when = Number.isFinite(at) ? at : 0;
  const rolls: Roll[] = [];
  for (const [index, faces] of each.entries()) {
    if (faces.split(",").some((f) => f.trim() === "")) return null;
    const read = rollFrom(spec, faces.split(",").map(Number), `shared-${when.toString(36)}-${index}`, when, params.get("seed"));
    if (read === null) return null;
    read.set = { id: `shared-${when.toString(36)}-0`, index, of: each.length };
    rolls.push(read);
  }
  return rolls;
}

/** A shared roll from a query string, or null when it does not describe one this roller could have thrown. */
export function readShared(query: string | URLSearchParams): Roll | null {
  const params = typeof query === "string" ? new URLSearchParams(query.replace(/^\?/, "")) : query;
  const spec = parseNotation(params.get("roll") ?? "", { legacyReroll: params.get("v") === null });
  if (spec === null) return null;
  const given = (params.get("faces") ?? "").split(",");
  if (given.some((f) => f.trim() === "")) return null;
  const at = Number(params.get("at"));
  const read: Roll | null = rollFrom(spec, given.map(Number), `shared-${Number.isFinite(at) ? at.toString(36) : "0"}`, Number.isFinite(at) ? at : 0, params.get("seed"));
  if (read === null) return null;
  const faces = read.faces;
  const held = params.get("held");
  if (held !== null) {
    const which = held === "" ? [] : held.split(",").map(Number);
    if (!canHold(spec) || !which.every((i) => Number.isInteger(i) && i >= 0 && i < faces.length)) return null;
    read.held = faces.map((_, i) => which.includes(i));
  }
  return read;
}
