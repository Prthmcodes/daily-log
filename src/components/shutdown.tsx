"use client";

import { useState } from "react";

import { SHUTDOWN, UI } from "@/lib/copy";
import { createClient } from "@/lib/supabase/client";
import type { TaskRow } from "@/lib/supabase/types";
import { addWorkItem, fetchWorkItems, nextPosition } from "@/lib/work";

type Props = {
  userId: string;
  tasks: TaskRow[];
};

/**
 * Ending the day on purpose.
 *
 * Newport's algorithm from Deep Work: review everything still open, and for
 * each one either have a plan you trust or put it somewhere it will be
 * revisited. Then say the phrase. He admits the phrase sounds cheesy; it works
 * because it is a cue, and cues are what this whole app is about.
 *
 * Three things it deliberately does not do:
 *
 *   It does not tick anything. An unticked task stays unticked, because that
 *   is an honest record of the day — "unticked isn't failed".
 *
 *   It does not roll anything over to tomorrow's list. Moving something puts
 *   it on the work board, which is a different object with a different
 *   lifetime, and only ever because you pressed the button.
 *
 *   It does not count what is left. There is no "three still open".
 *
 * Nothing here is persisted beyond the work items it creates. The phrase is a
 * cue, not a record, and giving it a database row would make it something to
 * be consistent about.
 */
export function Shutdown({ userId, tasks }: Props) {
  // Which task ids have been sent to the board this sitting. A Set is the
  // natural shape for "have I already done this one".
  const [moved, setMoved] = useState<Set<string>>(new Set());
  const [complete, setComplete] = useState(false);
  const [failed, setFailed] = useState(false);

  const open = tasks.filter((task) => !task.done);

  async function moveToWork(task: TaskRow) {
    setFailed(false);

    try {
      const client = createClient();
      // Read the board first so the item lands at the bottom of its bucket
      // rather than on top of something.
      const items = await fetchWorkItems(client);
      await addWorkItem(
        client,
        userId,
        "important",
        task.text,
        nextPosition(items, "important"),
      );
      // `new Set(moved)` copies rather than mutating, which is what React
      // needs in order to notice the change.
      setMoved(new Set(moved).add(task.id));
    } catch {
      setFailed(true);
    }
  }

  return (
    <section className="mt-3 rounded-[var(--radius-card)] border-[0.5px] border-line bg-card px-4 py-[18px]">
      <h2 className="mb-3 text-2xs uppercase tracking-[0.09em] text-muted">
        {SHUTDOWN.heading}
      </h2>

      <p className="text-sm text-muted">{SHUTDOWN.intro}</p>

      {open.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{SHUTDOWN.nothingOpen}</p>
      ) : (
        <ul className="mt-3 border-t-[0.5px] border-rule">
          {open.map((task) => (
            <li
              key={task.id}
              className="flex min-h-11 items-center gap-3 border-b-[0.5px] border-rule py-2 last:border-b-0"
            >
              <span className="flex-1 text-base">{task.text}</span>

              {moved.has(task.id) ? (
                <span className="shrink-0 text-xs text-muted">
                  {SHUTDOWN.movedIndicator}
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => moveToWork(task)}
                  className="min-h-11 shrink-0 rounded-[var(--radius-control)] border-[0.5px] border-control bg-card px-3 text-xs text-muted transition-colors duration-100 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                >
                  {SHUTDOWN.moveButton}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      {complete ? (
        <p aria-live="polite" className="mt-4 text-base">
          {SHUTDOWN.completePhrase}
        </p>
      ) : (
        <button
          type="button"
          onClick={() => setComplete(true)}
          className="mt-4 min-h-11 w-full rounded-[var(--radius-control)] border-[0.5px] border-control bg-card px-4 text-base text-ink transition-colors duration-100 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        >
          {SHUTDOWN.completeButton}
        </button>
      )}

      {failed && (
        <p aria-live="polite" className="mt-3 text-sm text-muted">
          {UI.saveFailed}
        </p>
      )}
    </section>
  );
}
