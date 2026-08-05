import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import type { DateKey } from "@/lib/date";
import type { TaskRow } from "@/lib/supabase/types";

/**
 * Reading and writing the morning list.
 *
 * Kept entirely separate from src/lib/days.ts, and the `tasks` table has no
 * foreign key to `days`. That separation is deliberate and structural: it
 * means no query in this file can reach a score, and no future refactor can
 * quietly make ticking a box worth something.
 *
 * There is no count function here, and there is not going to be one. See
 * design rule 10 — a fraction is a grade, and a grade is what this app exists
 * to avoid.
 */

type Client = SupabaseClient<Database>;

/**
 * Turn what was typed into one task per line.
 *
 * Blank lines vanish, surrounding spaces go, and the order written is the
 * order kept. Trimming also disposes of the carriage return that Windows
 * leaves at the end of each line, which would otherwise be invisible in the
 * text and visible in the layout.
 */
export function splitIntoTasks(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** The tasks written for one day, in the order they were written. */
export async function fetchTasks(
  client: Client,
  dateKey: DateKey,
): Promise<TaskRow[]> {
  const { data, error } = await client
    .from("tasks")
    .select("*")
    .eq("date", dateKey)
    .order("position");

  if (error) throw error;
  return data ?? [];
}

/**
 * Write a whole list at once.
 *
 * `position` is the index it was typed at, so the order survives however the
 * rows come back from the database later.
 *
 * Note what this does not do: it touches the `tasks` table and nothing else.
 * Writing a morning list does not create a `days` row, does not mark the day
 * as logged, and does not change any score or average. A day with ten tasks
 * and no marks is an unlogged day, and that is correct.
 */
export async function createTasks(
  client: Client,
  userId: string,
  dateKey: DateKey,
  texts: string[],
): Promise<TaskRow[]> {
  const rows = texts.map((text, index) => ({
    user_id: userId,
    date: dateKey,
    text,
    position: index,
  }));

  const { data, error } = await client.from("tasks").insert(rows).select();

  if (error) throw error;
  return data ?? [];
}
