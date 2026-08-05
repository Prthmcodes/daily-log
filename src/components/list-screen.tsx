"use client";

import { useEffect, useState } from "react";

import { ComposeList } from "@/components/compose-list";
import { MORNING_LIST, UI } from "@/lib/copy";
import { formatDayLabel, todayKey, type DateKey } from "@/lib/date";
import { createClient } from "@/lib/supabase/client";
import type { TaskRow } from "@/lib/supabase/types";
import { createTasks, fetchTasks, splitIntoTasks } from "@/lib/tasks";

type Props = {
  /** Passed down from the server, which has already established who you are. */
  userId: string;
};

/**
 * The morning list.
 *
 * Its own screen, its own table, and no arithmetic anywhere on it. There is no
 * count, no fraction, no percentage, no progress bar, and no colour that
 * responds to how much is done. A ticked box and an unticked box are both just
 * boxes. That is design rule 10 and it is as load-bearing as the absence of a
 * streak counter.
 */
export function ListScreen({ userId }: Props) {
  const [dateKey, setDateKey] = useState<DateKey | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    async function load() {
      // Same rule as the today screen: the date is worked out in the browser,
      // because the server does not know what timezone you are in.
      const key = todayKey();

      try {
        setTasks(await fetchTasks(createClient(), key));
        setDateKey(key);
      } catch {
        setLoadFailed(true);
      }
    }

    load();
  }, []);

  async function handleMakeList(text: string) {
    if (!dateKey) return;

    const texts = splitIntoTasks(text);
    if (texts.length === 0) return;

    setBusy(true);
    setSaveFailed(false);

    try {
      const created = await createTasks(createClient(), userId, dateKey, texts);
      setTasks(created);
    } catch {
      setSaveFailed(true);
    } finally {
      // `finally` runs whether or not it worked, so the screen can never be
      // left stuck as busy.
      setBusy(false);
    }
  }

  if (loadFailed) {
    return <p className="text-[13px] text-muted">{UI.loadFailed}</p>;
  }

  if (!dateKey) {
    return <p className="text-[13px] text-muted">{UI.loading}</p>;
  }

  return (
    <section className="rounded-[var(--radius-card)] border border-line bg-card px-5 py-[18px]">
      <div className="mb-4 flex items-center gap-[10px]">
        <span className="text-[16px] font-semibold">
          {formatDayLabel(dateKey)}
        </span>
        <span className="rounded-full border border-tag-line bg-tag px-2 py-[2px] text-[11px] text-tag-ink">
          {UI.todayTag}
        </span>
      </div>

      {tasks.length === 0 ? (
        <ComposeList busy={busy} onSubmit={handleMakeList} />
      ) : (
        <>
          <ul>
            {tasks.map((task) => (
              <li
                key={task.id}
                className="min-h-11 border-b border-rule py-[11px] text-[14px] last:border-b-0"
              >
                {task.text}
              </li>
            ))}
          </ul>

          <p className="mt-4 text-[13px] text-muted">
            {MORNING_LIST.standingLine}
          </p>
        </>
      )}

      {saveFailed && (
        <p aria-live="polite" className="mt-3 text-[13px] text-muted">
          {UI.saveFailed}
        </p>
      )}
    </section>
  );
}
