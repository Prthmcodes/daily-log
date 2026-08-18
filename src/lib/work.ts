import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import type { WorkItemRow } from "@/lib/supabase/types";

/**
 * The work board.
 *
 * Three buckets of things that need doing, sorted by how much they matter.
 *
 * This is a different kind of object from the morning list and the separation
 * is the whole point. A task on the morning list belongs to one day, does not
 * roll over, and is never counted — because a fraction of the day's intentions
 * is a grade, and grades are what the app exists to avoid. A work item
 * persists until it is done. Putting the two together would have produced a
 * running total of undone work sitting next to the day's score.
 *
 * So, as with tasks, extras and thresholds: nothing in this file can reach a
 * score, and there is no count function here.
 */

type Client = SupabaseClient<Database>;

/** The three buckets, in the order they are shown. */
export const BUCKETS = ["emergency", "important", "unimportant"] as const;

export type Bucket = (typeof BUCKETS)[number];

/** Is this a bucket the database will accept? Guards a URL or a stale value. */
export function isBucket(value: string): value is Bucket {
  // `.some` is a plain "does any entry match", the same as a loop with an
  // early return.
  return BUCKETS.some((bucket) => bucket === value);
}

/**
 * Where the next item in a bucket goes.
 *
 * Position is per bucket, so moving an item between buckets puts it at the
 * bottom of the one it arrives in rather than somewhere arbitrary in the
 * middle.
 */
export function nextPosition(items: WorkItemRow[], bucket: Bucket): number {
  let highest = -1;
  for (const item of items) {
    if (item.bucket === bucket && item.position > highest) {
      highest = item.position;
    }
  }
  return highest + 1;
}

/** Just the items in one bucket, in order. */
export function inBucket(items: WorkItemRow[], bucket: Bucket): WorkItemRow[] {
  return items
    .filter((item) => item.bucket === bucket)
    .sort((a, b) => a.position - b.position);
}

/** Everything on the board. */
export async function fetchWorkItems(client: Client): Promise<WorkItemRow[]> {
  const { data, error } = await client
    .from("work_items")
    .select("*")
    .order("position");

  if (error) throw error;
  return data ?? [];
}

/** Add something to a bucket. */
export async function addWorkItem(
  client: Client,
  userId: string,
  bucket: Bucket,
  text: string,
  position: number,
): Promise<WorkItemRow> {
  const { data, error } = await client
    .from("work_items")
    .insert({ user_id: userId, bucket, text: text.trim(), position })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Tick or untick. Nothing else happens — no score, no average, no total. */
export async function setWorkItemDone(
  client: Client,
  id: string,
  done: boolean,
): Promise<void> {
  const { error } = await client
    .from("work_items")
    .update({ done })
    .eq("id", id);

  if (error) throw error;
}

/**
 * Move an item to another bucket.
 *
 * The point of the board is re-triage: things change how much they matter
 * during a day, and having to delete and retype would make you avoid saying so.
 */
export async function moveWorkItem(
  client: Client,
  id: string,
  bucket: Bucket,
  position: number,
): Promise<void> {
  const { error } = await client
    .from("work_items")
    .update({ bucket, position })
    .eq("id", id);

  if (error) throw error;
}

/** Remove one. */
export async function deleteWorkItem(
  client: Client,
  id: string,
): Promise<void> {
  const { error } = await client.from("work_items").delete().eq("id", id);

  if (error) throw error;
}
