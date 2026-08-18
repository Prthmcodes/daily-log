import type { Database } from "@/lib/database.types";

/**
 * Short names for the shapes in database.types.ts, so the rest of the app can
 * say `DayRow` instead of
 * `Database["public"]["Tables"]["days"]["Row"]` every time.
 *
 * Note the two tables have no type relationship to each other, and that is
 * deliberate. Tasks are structurally incapable of contributing to a score
 * (design rule 11), and keeping them unrelated in the types too means a future
 * refactor cannot quietly join them.
 */

/** A logged day. Its existence in the table IS the record that it was logged. */
export type DayRow = Database["public"]["Tables"]["days"]["Row"];
export type DayInsert = Database["public"]["Tables"]["days"]["Insert"];
export type DayUpdate = Database["public"]["Tables"]["days"]["Update"];

/**
 * The things tracked alongside a day that are not part of the score.
 * Separate from DayRow on purpose — see src/lib/extras.ts.
 */
export type ExtrasRow = Database["public"]["Tables"]["extras"]["Row"];

/**
 * One named edge: a cue you know is coming, and what happens at it.
 * Standing rather than daily — see src/lib/thresholds.ts.
 */
export type ThresholdRow = Database["public"]["Tables"]["thresholds"]["Row"];

/**
 * One thing on the work board. Persists until done — unlike a task, which
 * belongs to a single day. See src/lib/work.ts for why they are separate.
 */
export type WorkItemRow = Database["public"]["Tables"]["work_items"]["Row"];

/** One line of the morning list. */
export type TaskRow = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type TaskUpdate = Database["public"]["Tables"]["tasks"]["Update"];
