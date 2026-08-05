import type { SupabaseClient } from "@supabase/supabase-js";

import { MARKS, type MarkKey, type Score } from "@/lib/copy";
import type { Database } from "@/lib/database.types";
import type { DateKey } from "@/lib/date";
import type { DayRow } from "@/lib/supabase/types";

/**
 * Reading and writing the `days` table.
 *
 * All the database talk lives here rather than in components, so a component
 * never has to know a table name and this file can be read on its own to see
 * every way a `days` row can come into existence. There is exactly one, and
 * it is `saveMarks`.
 */

/** Which of the five are ticked. */
export type Marks = Record<MarkKey, boolean>;

/** A day nobody has touched. Not the same thing as a day scored zero. */
export const NO_MARKS: Marks = {
  shower: false,
  meal: false,
  work: false,
  wait: false,
  human: false,
};

type Client = SupabaseClient<Database>;

/** Pull just the five booleans out of a row, or all-false if there is no row. */
export function marksOf(row: DayRow | null): Marks {
  if (!row) return NO_MARKS;

  return {
    shower: row.shower,
    meal: row.meal,
    work: row.work,
    wait: row.wait,
    human: row.human,
  };
}

/**
 * The score is the count of ticked marks, 0 to 5.
 *
 * The database calculates this too, in a generated column, and that copy is
 * the one that counts. This one exists so the number on screen can change the
 * instant you tap, without waiting to be told what it is.
 */
export function scoreOf(marks: Marks): Score {
  let count = 0;
  for (const mark of MARKS) {
    if (marks[mark.key]) count++;
  }
  // TypeScript cannot see that a count over five items is at most five.
  return count as Score;
}

/**
 * Fetch one day, or null if it was never logged.
 *
 * There is no `user_id` filter here and that is not an oversight — row level
 * security adds it in the database, so this query can only ever see your own
 * rows. Adding it in the query as well would imply the safety came from here.
 *
 * `maybeSingle()` returns null for no match. `single()` would treat "no row"
 * as an error, and for this table a missing row is the normal, meaningful
 * state: it means the day was never logged.
 */
export async function fetchDay(
  client: Client,
  dateKey: DateKey,
): Promise<DayRow | null> {
  const { data, error } = await client
    .from("days")
    .select("*")
    .eq("date", dateKey)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Write the five marks for a day, creating the row if it does not exist.
 *
 * This is a deliberate user action — a tap on a toggle — which is the only
 * thing allowed to bring a `days` row into being. Nothing that merely reads,
 * renders or navigates may call this.
 *
 * The upsert only names the columns it sets, so an existing `note` survives
 * untouched.
 */
export async function saveMarks(
  client: Client,
  userId: string,
  dateKey: DateKey,
  marks: Marks,
): Promise<void> {
  const { error } = await client
    .from("days")
    .upsert(
      { user_id: userId, date: dateKey, ...marks },
      { onConflict: "user_id,date" },
    );

  if (error) throw error;
}
