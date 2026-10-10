import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import type { DateKey } from "@/lib/date";
import type { ExtrasRow } from "@/lib/supabase/types";

/**
 * Reading and writing the "also today" row.
 *
 * Its own table, and that separation is the whole design. Had these been extra
 * columns on `days`, ticking "read a few pages" would have created a `days`
 * row — which is what "this day was logged" means — and the day would then
 * count as a logged zero and pull the averages down. Reading a book would make
 * your score worse. A separate table makes that impossible rather than merely
 * something to remember not to do.
 *
 * Nothing in this file can reach a score, and nothing that calculates a score
 * imports from it.
 */

type Client = SupabaseClient<Database>;

/** What is ticked and counted for one day. */
export type Extras = {
  noReels: boolean;
  readSomething: boolean;
  /** Ten minutes with nothing running. A capacity, not a rule. */
  alone: boolean;
  /** Felt the pull to correct or win, and left it alone. */
  letGo: boolean;
  studyBlocks: number;
  /** One line on where the day was hardest. Never scored, never counted. */
  hardest: string;
};

/** A day nobody has touched. */
export const NO_EXTRAS: Extras = {
  noReels: false,
  readSomething: false,
  alone: false,
  letGo: false,
  studyBlocks: 0,
  hardest: "",
};

/** Pull the three values out of a row, or the empty state if there is none. */
export function extrasOf(row: ExtrasRow | null): Extras {
  if (!row) return NO_EXTRAS;

  return {
    noReels: row.no_reels,
    readSomething: row.read_something,
    alone: row.alone,
    letGo: row.let_go,
    studyBlocks: row.study_blocks,
    hardest: row.hardest,
  };
}

/**
 * Blocks can go up and down but never below zero.
 *
 * The database has the same rule as a CHECK constraint. This one exists so the
 * screen never shows a number the database would reject.
 */
export function adjustBlocks(current: number, delta: number): number {
  const next = current + delta;
  return next < 0 ? 0 : next;
}

/** Fetch one day's extras, or null if there are none. */
export async function fetchExtras(
  client: Client,
  dateKey: DateKey,
): Promise<ExtrasRow | null> {
  const { data, error } = await client
    .from("extras")
    .select("*")
    .eq("date", dateKey)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Write the day's extras, creating the row if it does not exist.
 *
 * Note what this does not do: it touches the `extras` table and nothing else.
 * It does not create a `days` row, does not mark the day as logged, and does
 * not change any score or average.
 */
export async function saveExtras(
  client: Client,
  userId: string,
  dateKey: DateKey,
  extras: Extras,
): Promise<void> {
  const { error } = await client.from("extras").upsert(
    {
      user_id: userId,
      date: dateKey,
      no_reels: extras.noReels,
      read_something: extras.readSomething,
      alone: extras.alone,
      let_go: extras.letGo,
      study_blocks: extras.studyBlocks,
      hardest: extras.hardest,
    },
    { onConflict: "user_id,date" },
  );

  if (error) throw error;
}
