"use client";

import { useEffect, useState } from "react";

import { DayLine } from "@/components/day-line";
import { MarkToggle } from "@/components/mark-toggle";
import { MetricsPanel } from "@/components/metrics-panel";
import { MARKS, SCORE_LABELS, UI, type MarkKey } from "@/lib/copy";
import { formatDayLabel, lastNKeys, todayKey, type DateKey } from "@/lib/date";
import {
  NO_MARKS,
  countLoggedDays,
  fetchDay,
  fetchLoggedDays,
  marksOf,
  saveMarks,
  scoreOf,
  type LoggedDay,
  type Marks,
} from "@/lib/days";
import { averageWithin, formatAverage } from "@/lib/metrics";
import { createClient } from "@/lib/supabase/client";

/** The longest window any metric needs. */
const WINDOW_DAYS = 30;

/**
 * Fetch everything the numbers are calculated from.
 *
 * Defined outside the component because it needs nothing from it. That also
 * keeps it out of the effect's dependency list below.
 */
async function loadMetrics(endKey: DateKey) {
  const client = createClient();
  const window = lastNKeys(WINDOW_DAYS, endKey);

  // Promise.all runs both requests at once instead of waiting for the first
  // to finish before starting the second.
  const [days, total] = await Promise.all([
    fetchLoggedDays(client, window[0], endKey),
    countLoggedDays(client),
  ]);

  return { days, total };
}

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
  /** Does a row exist for this day? Not the same as "scored above zero". */
  const [isLogged, setIsLogged] = useState(false);
  const [loggedDays, setLoggedDays] = useState<LoggedDay[]>([]);
  const [totalLogged, setTotalLogged] = useState(0);

  const [loadFailed, setLoadFailed] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [metricsStale, setMetricsStale] = useState(false);

  useEffect(() => {
    async function load() {
      /*
       * todayKey() must run here, in the browser, and not on the server.
       *
       * The server has no idea what timezone you are in — on Vercel it thinks
       * it is in UTC. At 23:30 in the UK in summer that is already tomorrow,
       * so a server-computed date would file an evening's marks under the
       * wrong day roughly every night for half the year.
       */
      const key = todayKey();

      try {
        // Plain selects. None of this can create a row, which is the whole
        // point: opening the app is not the same as logging the day.
        const row = await fetchDay(createClient(), key);
        const { days, total } = await loadMetrics(key);

        setMarks(marksOf(row));
        // `?? ""` is nullish coalescing: use the left unless it is null or
        // undefined. A day with no row has no note.
        setInitialNote(row?.note ?? "");
        setIsLogged(row !== null);
        setLoggedDays(days);
        setTotalLogged(total);
        setDateKey(key);
      } catch {
        setLoadFailed(true);
      }
    }

    load();
    // The empty array means this runs once, when the screen first appears.
  }, []);

  /** Re-read the numbers after something has been written. */
  async function refreshMetrics(key: DateKey) {
    try {
      const { days, total } = await loadMetrics(key);
      setLoggedDays(days);
      setTotalLogged(total);
      setMetricsStale(false);
    } catch {
      // The write itself succeeded — only the refresh failed — so reverting
      // would be wrong and an error would be misleading. Say the numbers may
      // be behind and leave them showing.
      setMetricsStale(true);
    }
  }

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
    setIsLogged(true);
    setSaveFailed(false);

    try {
      await saveMarks(createClient(), userId, dateKey, next);
      await refreshMetrics(dateKey);
    } catch {
      // Put it back exactly as it was and say so quietly. No modal, no red.
      setMarks(previous);
      setIsLogged(isLogged);
      setSaveFailed(true);
    }
  }

  /**
   * "Log this day as 0" — a shortcut for creating the row, nothing more.
   *
   * There is no separate zero state and no extra column. A day scored zero is
   * a row whose five marks are all false, which is exactly what a day you
   * ticked nothing on looks like. The only difference between that and a day
   * you never opened is whether the row exists.
   */
  async function handleLogZero() {
    if (!dateKey) return;

    setIsLogged(true);
    setSaveFailed(false);

    try {
      await saveMarks(createClient(), userId, dateKey, NO_MARKS);
      await refreshMetrics(dateKey);
    } catch {
      setIsLogged(false);
      setSaveFailed(true);
    }
  }

  /** The day line just wrote something, so the day is now logged. */
  async function handleNoteSaved() {
    if (!dateKey) return;
    setIsLogged(true);
    await refreshMetrics(dateKey);
  }

  if (loadFailed) {
    return <p className="text-[13px] text-muted">{UI.loadFailed}</p>;
  }

  if (!dateKey) {
    return <p className="text-[13px] text-muted">{UI.loading}</p>;
  }

  const score = scoreOf(marks);
  const sevenDay = averageWithin(loggedDays, lastNKeys(7, dateKey));
  const thirtyDay = averageWithin(loggedDays, lastNKeys(WINDOW_DAYS, dateKey));

  return (
    <>
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
              // key. onToggle={handleToggle(mark.key)} would call it
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

          {/* Only offered while there is no row. Once the day is logged there
              is nothing left for this button to do. */}
          {!isLogged && (
            <button
              type="button"
              onClick={handleLogZero}
              className="ml-auto min-h-[44px] shrink-0 whitespace-nowrap rounded-[var(--radius-control)] border border-control bg-card px-[11px] text-[12.5px] text-muted hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
            >
              {UI.logZeroButton}
            </button>
          )}
        </div>

        {/* aria-live tells a screen reader to announce this when it appears. */}
        {saveFailed && (
          <p aria-live="polite" className="mt-3 text-[13px] text-muted">
            {UI.saveFailed}
          </p>
        )}

        <DayLine
          userId={userId}
          dateKey={dateKey}
          initialNote={initialNote}
          onSaved={handleNoteSaved}
        />
      </section>

      <MetricsPanel
        sevenDay={formatAverage(sevenDay)}
        thirtyDay={formatAverage(thirtyDay)}
        daysLogged={totalLogged}
        stale={metricsStale}
      />
    </>
  );
}
