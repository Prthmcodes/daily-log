"use client";

import { useEffect, useState } from "react";

import type { MarkKey } from "@/lib/copy";
import { lastNKeys, todayKey, type DateKey } from "@/lib/date";
import {
  NO_MARKS,
  countLoggedDays,
  fetchDay,
  fetchLoggedDays,
  marksOf,
  saveMarks,
  type LoggedDay,
  type Marks,
} from "@/lib/days";
import { createClient } from "@/lib/supabase/client";

/**
 * Everything the today screen knows and can do.
 *
 * This is a **custom hook**: an ordinary function whose name begins with `use`
 * and which is allowed to call the other hooks. Pulling the state out here
 * leaves the component itself as nothing but layout, and means the rules about
 * when a `days` row may be created live in one file you can read end to end.
 */

/** The longest window any metric or the grid needs. */
const WINDOW_DAYS = 30;

/**
 * Fetch everything the numbers and the grid are drawn from.
 *
 * Outside the hook because it needs nothing from it, which also keeps it out
 * of the effect dependency lists.
 */
async function loadMetrics(endKey: DateKey) {
  const client = createClient();
  const window = lastNKeys(WINDOW_DAYS, endKey);

  // Promise.all runs both requests at once rather than waiting for the first.
  const [days, total] = await Promise.all([
    fetchLoggedDays(client, window[0], endKey),
    countLoggedDays(client),
  ]);

  return { days, total };
}

export function useToday(userId: string) {
  /** Today in the user's own timezone. null until the browser works it out. */
  const [todayK, setTodayK] = useState<DateKey | null>(null);
  /** The day being looked at, which is today until you move. */
  const [selectedKey, setSelectedKey] = useState<DateKey | null>(null);

  const [marks, setMarks] = useState<Marks>(NO_MARKS);
  // Only ever DayLine's starting value; it keeps its own state after that.
  const [initialNote, setInitialNote] = useState("");
  /** Does a row exist for this day? Not the same as "scored above zero". */
  const [isLogged, setIsLogged] = useState(false);
  const [dayLoading, setDayLoading] = useState(true);

  const [loggedDays, setLoggedDays] = useState<LoggedDay[]>([]);
  const [totalLogged, setTotalLogged] = useState(0);

  const [loadFailed, setLoadFailed] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const [metricsStale, setMetricsStale] = useState(false);

  // Work out what day it is, and load the grid and the numbers. Runs once.
  useEffect(() => {
    async function init() {
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
        const { days, total } = await loadMetrics(key);
        setLoggedDays(days);
        setTotalLogged(total);
        setTodayK(key);
        // Setting this starts the effect below, which loads the day itself.
        setSelectedKey(key);
      } catch {
        setLoadFailed(true);
      }
    }

    init();
  }, []);

  // Load whichever day is selected. Runs again every time that changes.
  useEffect(() => {
    if (!selectedKey) return;

    async function loadDay(key: DateKey) {
      try {
        // A plain select. It cannot create a row, which is the whole point:
        // looking at a day is not the same as logging it.
        const row = await fetchDay(createClient(), key);
        setMarks(marksOf(row));
        // `?? ""` is nullish coalescing: use the left unless it is null or
        // undefined. A day with no row has no note.
        setInitialNote(row?.note ?? "");
        setIsLogged(row !== null);
        setDayLoading(false);
      } catch {
        setLoadFailed(true);
      }
    }

    loadDay(selectedKey);
  }, [selectedKey]);

  /** Re-read the grid and the numbers after something has been written. */
  async function refreshMetrics() {
    if (!todayK) return;

    try {
      const { days, total } = await loadMetrics(todayK);
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

  function select(key: DateKey) {
    if (key === selectedKey) return;

    // Clear the marks rather than leaving the previous day's on screen while
    // the new one loads, and refuse taps until they arrive.
    setDayLoading(true);
    setMarks(NO_MARKS);
    setSaveFailed(false);
    setSelectedKey(key);
  }

  async function toggle(key: MarkKey) {
    if (!selectedKey) return;

    const previousMarks = marks;
    const previouslyLogged = isLogged;
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
      await saveMarks(createClient(), userId, selectedKey, next);
      await refreshMetrics();
    } catch {
      // Put it back exactly as it was and say so quietly. No modal, no red.
      setMarks(previousMarks);
      setIsLogged(previouslyLogged);
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
  async function logZero() {
    if (!selectedKey) return;

    setIsLogged(true);
    setSaveFailed(false);

    try {
      await saveMarks(createClient(), userId, selectedKey, NO_MARKS);
      await refreshMetrics();
    } catch {
      setIsLogged(false);
      setSaveFailed(true);
    }
  }

  /** The day line just wrote something, so this day is now a logged day. */
  async function noteSaved() {
    setIsLogged(true);
    await refreshMetrics();
  }

  return {
    todayK,
    selectedKey,
    marks,
    initialNote,
    isLogged,
    dayLoading,
    loggedDays,
    totalLogged,
    loadFailed,
    saveFailed,
    metricsStale,
    sevenDayKeys: todayK ? lastNKeys(7, todayK) : [],
    thirtyDayKeys: todayK ? lastNKeys(WINDOW_DAYS, todayK) : [],
    select,
    toggle,
    logZero,
    noteSaved,
  };
}
