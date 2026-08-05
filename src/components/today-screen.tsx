"use client";

import { useEffect, useState } from "react";

import { DayLine } from "@/components/day-line";
import { MarkToggle } from "@/components/mark-toggle";
import { MARKS, SCORE_LABELS, UI, type MarkKey } from "@/lib/copy";
import { formatDayLabel, todayKey, type DateKey } from "@/lib/date";
import {
  NO_MARKS,
  fetchDay,
  marksOf,
  saveMarks,
  scoreOf,
  type Marks,
} from "@/lib/days";
import { createClient } from "@/lib/supabase/client";

type Props = {
  /** Passed down from the server, which has already established who you are. */
  userId: string;
};

export function TodayScreen({ userId }: Props) {
  // null means "not loaded yet". It is also how we know the date is ready.
  const [dateKey, setDateKey] = useState<DateKey | null>(null);
  const [marks, setMarks] = useState<Marks>(NO_MARKS);
  // Only ever used as DayLine's starting value; it keeps its own state after.
  const [initialNote, setInitialNote] = useState("");
  const [loadFailed, setLoadFailed] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    async function load() {
      /*
       * todayKey() must run here, in the browser, and not on the server.
       *
       * The server has no idea what timezone you are in — on Vercel it thinks
       * it is in UTC. At 23:30 in the UK during summer that is already
       * tomorrow, so a server-computed date would file an evening's marks
       * under the wrong day roughly every night for half the year.
       */
      const key = todayKey();

      try {
        // A plain select. It cannot create a row, which is the whole point:
        // opening the app is not the same as logging the day.
        const row = await fetchDay(createClient(), key);
        setMarks(marksOf(row));
        // `?? ""` is the nullish coalescing operator: use the left side unless
        // it is null or undefined. A day with no row has no note.
        setInitialNote(row?.note ?? "");
        setDateKey(key);
      } catch {
        setLoadFailed(true);
      }
    }

    load();
    // The empty array means this runs once, when the screen first appears.
  }, []);

  async function handleToggle(key: MarkKey) {
    if (!dateKey) return;

    const previous = marks;
    // Spread the old object, then override one key. This makes a new object
    // rather than editing the old one, which is what React needs to notice
    // that anything changed.
    const next = { ...marks, [key]: !marks[key] };

    // Change the screen first and ask the database afterwards. Waiting for the
    // network before the tick appears is what makes a habit tracker feel like
    // a form to fill in.
    setMarks(next);
    setSaveFailed(false);

    try {
      await saveMarks(createClient(), userId, dateKey, next);
    } catch {
      // Put it back exactly as it was and say so quietly. No modal, no red.
      setMarks(previous);
      setSaveFailed(true);
    }
  }

  if (loadFailed) {
    return <p className="text-[13px] text-muted">{UI.loadFailed}</p>;
  }

  if (!dateKey) {
    return <p className="text-[13px] text-muted">{UI.loading}</p>;
  }

  const score = scoreOf(marks);

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

      <div>
        {MARKS.map((mark) => (
          <MarkToggle
            key={mark.key}
            mark={mark}
            ticked={marks[mark.key]}
            // An arrow function so each row calls handleToggle with its own
            // key. Writing onToggle={handleToggle(mark.key)} would call it
            // immediately during rendering instead.
            onToggle={() => handleToggle(mark.key)}
          />
        ))}
      </div>

      <div className="mt-[14px] flex items-baseline gap-[14px] border-t border-rule pt-[14px]">
        <div className="text-[30px] font-semibold tracking-[-0.02em]">
          {score}
          <span className="text-[15px] font-medium text-muted">/5</span>
        </div>
        <div className="text-[13px] text-muted">{SCORE_LABELS[score]}</div>
      </div>

      {/* aria-live tells a screen reader to announce this when it appears. */}
      {saveFailed && (
        <p aria-live="polite" className="mt-3 text-[13px] text-muted">
          {UI.saveFailed}
        </p>
      )}

      <DayLine userId={userId} dateKey={dateKey} initialNote={initialNote} />
    </section>
  );
}
