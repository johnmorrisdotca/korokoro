import { keptFaces, totalOf, type Roll } from "./dice.ts";
import { formatNotation, parseNotation } from "./notation.ts";

/**
 * A roll as a link. The query carries the dice, the faces and when, so the
 * person opening it sees exactly what was thrown; a seeded roll carries its
 * seed too, so the same dice can be thrown again and come out the same.
 */
export function shareQuery(roll: Roll): string {
  const params = new URLSearchParams({ roll: formatNotation(roll.spec), faces: roll.faces.join(","), at: String(roll.at) });
  if (roll.seed !== null) params.set("seed", roll.seed);
  return params.toString();
}

/** A shared roll from a query string, or null when it does not describe one this roller could have thrown. */
export function readShared(query: string | URLSearchParams): Roll | null {
  const params = typeof query === "string" ? new URLSearchParams(query.replace(/^\?/, "")) : query;
  const spec = parseNotation(params.get("roll") ?? "");
  if (spec === null) return null;
  const faces = (params.get("faces") ?? "").split(",").map(Number);
  if (faces.length !== spec.count || !faces.every((f) => Number.isInteger(f) && f >= 1 && f <= spec.sides)) return null;
  const at = Number(params.get("at"));
  const kept = keptFaces(faces, spec.keep);
  return {
    id: `shared-${Number.isFinite(at) ? at.toString(36) : "0"}`,
    spec,
    faces,
    kept,
    total: totalOf(faces, kept, spec.modifier),
    at: Number.isFinite(at) ? at : 0,
    seed: params.get("seed"),
  };
}
