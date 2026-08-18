import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import type { ThresholdRow } from "@/lib/supabase/types";

/**
 * Reading and writing the threshold plan.
 *
 * Every other table in this app records what happened. This one is the only
 * part that points forward: a cue you already know is coming, and what you
 * have decided happens at it.
 *
 * Standing rather than daily — no `date` column — because the edges are the
 * same edges every day. That is deliberate: a plan you rewrite each morning is
 * a plan you stop rewriting, and it would eat the morning list's minute.
 *
 * Like tasks and extras, this table has no connection to `days`. Naming a
 * threshold cannot log a day, and cannot move a score or an average.
 */

type Client = SupabaseClient<Database>;

/** Where the next one goes: one past the highest in use. */
export function nextPosition(thresholds: ThresholdRow[]): number {
  let highest = -1;
  for (const threshold of thresholds) {
    if (threshold.position > highest) highest = threshold.position;
  }
  return highest + 1;
}

/**
 * Is this pair worth saving?
 *
 * Both halves are needed. A cue with no intention is a worry, and an intention
 * with no cue is a wish — the whole point is that the two are joined.
 */
export function isComplete(cue: string, intention: string): boolean {
  return cue.trim().length > 0 && intention.trim().length > 0;
}

/**
 * The sentence as it reads on screen.
 *
 * Kept here rather than in a component so it can be tested, and so the two
 * halves are joined in exactly one place.
 */
export function readAsSentence(cue: string, intention: string): string {
  const start = cue.trim();
  const end = intention.trim();
  // Only add the comma when there is something on both sides of it.
  if (!start) return end;
  if (!end) return start;
  return `${start}, ${end}`;
}

/** Everything named, in the order it was written. */
export async function fetchThresholds(
  client: Client,
): Promise<ThresholdRow[]> {
  const { data, error } = await client
    .from("thresholds")
    .select("*")
    .order("position");

  if (error) throw error;
  return data ?? [];
}

/** Name a new edge. */
export async function addThreshold(
  client: Client,
  userId: string,
  cue: string,
  intention: string,
  position: number,
): Promise<ThresholdRow> {
  const { data, error } = await client
    .from("thresholds")
    .insert({
      user_id: userId,
      cue: cue.trim(),
      intention: intention.trim(),
      position,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

/** Change one. Unlike tasks, these are worth editing rather than retyping. */
export async function updateThreshold(
  client: Client,
  id: string,
  cue: string,
  intention: string,
): Promise<void> {
  const { error } = await client
    .from("thresholds")
    .update({ cue: cue.trim(), intention: intention.trim() })
    .eq("id", id);

  if (error) throw error;
}

/** Remove one. */
export async function deleteThreshold(
  client: Client,
  id: string,
): Promise<void> {
  const { error } = await client.from("thresholds").delete().eq("id", id);

  if (error) throw error;
}
