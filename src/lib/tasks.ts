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

/**
 * Where the next task goes.
 *
 * One past the highest position in use, so something added at three in the
 * afternoon lands at the bottom rather than in the middle. Deleting leaves a
 * gap in the numbering, which is harmless — position only decides order, it is
 * not a count of anything.
 */
export function nextPosition(tasks: TaskRow[]): number {
  let highest = -1;
  for (const task of tasks) {
    if (task.position > highest) highest = task.position;
  }
  return highest + 1;
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

/** Add one task later in the day. Things come up. */
export async function addTask(
  client: Client,
  userId: string,
  dateKey: DateKey,
  text: string,
  position: number,
): Promise<TaskRow> {
  const { data, error } = await client
    .from("tasks")
    .insert({ user_id: userId, date: dateKey, text, position })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Tick or untick one task.
 *
 * Nothing else happens. No score changes, no day becomes logged, no total is
 * recalculated, because there is no total.
 */
export async function setTaskDone(
  client: Client,
  taskId: string,
  done: boolean,
): Promise<void> {
  const { error } = await client.from("tasks").update({ done }).eq("id", taskId);

  if (error) throw error;
}

/**
 * Remove a task.
 *
 * Editing the text of a task is deliberately not supported: delete it and
 * type it again. Retyping is a fresh decision, and this is a list of things
 * you intend to do today rather than a document to maintain.
 */
export async function deleteTask(
  client: Client,
  taskId: string,
): Promise<void> {
  const { error } = await client.from("tasks").delete().eq("id", taskId);

  if (error) throw error;
}
