"use client";

import { useEffect, useState } from "react";

import { todayKey, type DateKey } from "@/lib/date";
import { readDateFromUrl, writeDateToUrl } from "@/lib/query-date";
import { createClient } from "@/lib/supabase/client";
import type { TaskRow } from "@/lib/supabase/types";
import {
  addTask,
  createTasks,
  deleteTask,
  fetchTasks,
  nextPosition,
  setTaskDone,
  splitIntoTasks,
} from "@/lib/tasks";

/**
 * Everything the morning list knows and can do.
 *
 * Look at what is not here: no count, no total, no completed tally, no
 * percentage, nothing derived from how many tasks are done. There is no
 * function in this file that could produce one, and nothing it imports could
 * either. That is design rule 10, kept by making the alternative unavailable
 * rather than by remembering not to.
 */
export function useList(userId: string) {
  const [todayK, setTodayK] = useState<DateKey | null>(null);
  const [selectedKey, setSelectedKey] = useState<DateKey | null>(null);
  const [tasks, setTasks] = useState<TaskRow[]>([]);

  const [busy, setBusy] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    async function init() {
      // The date is worked out in the browser, because the server does not
      // know what timezone you are in. A `?date=` in the address bar wins,
      // as long as it is a real day and not in the future.
      const key = todayKey();
      const start = readDateFromUrl(key) ?? key;

      try {
        const rows = await fetchTasks(createClient(), start);
        setTasks(rows);
        setTodayK(key);
        setSelectedKey(start);
      } catch {
        setLoadFailed(true);
      }
    }

    init();
  }, []);

  /**
   * Move to another day.
   *
   * The fetch happens here rather than in an effect watching `selectedKey`,
   * which keeps it to one request: an effect would fire once on mount as well
   * and load the same day twice.
   */
  async function select(key: DateKey) {
    if (!todayK || key === selectedKey) return;

    setBusy(true);
    setSaveFailed(false);
    setSelectedKey(key);
    writeDateToUrl(key, todayK);

    try {
      setTasks(await fetchTasks(createClient(), key));
    } catch {
      setLoadFailed(true);
    } finally {
      setBusy(false);
    }
  }

  /** Turn what was typed into the day's list. */
  async function makeList(text: string) {
    if (!selectedKey) return;

    const texts = splitIntoTasks(text);
    if (texts.length === 0) return;

    setBusy(true);
    setSaveFailed(false);

    try {
      setTasks(await createTasks(createClient(), userId, selectedKey, texts));
    } catch {
      setSaveFailed(true);
    } finally {
      // `finally` runs whether or not it worked, so the screen can never be
      // left stuck as busy.
      setBusy(false);
    }
  }

  /** Add one more thing, part way through the day. */
  async function add(text: string) {
    if (!selectedKey) return;

    setSaveFailed(false);
    const position = nextPosition(tasks);

    try {
      const created = await addTask(
        createClient(),
        userId,
        selectedKey,
        text,
        position,
      );
      setTasks([...tasks, created]);
    } catch {
      setSaveFailed(true);
    }
  }

  /** Tick or untick. Instant, then confirmed. */
  async function toggle(taskId: string) {
    const previous = tasks;
    const target = tasks.find((task) => task.id === taskId);
    if (!target) return;

    const done = !target.done;
    // `.map` builds a new array with one entry replaced, rather than editing
    // the old one, which is what React needs to notice anything changed.
    setTasks(
      tasks.map((task) => (task.id === taskId ? { ...task, done } : task)),
    );
    setSaveFailed(false);

    try {
      await setTaskDone(createClient(), taskId, done);
    } catch {
      setTasks(previous);
      setSaveFailed(true);
    }
  }

  /** Remove a task. Also optimistic — it disappears, then is confirmed gone. */
  async function remove(taskId: string) {
    const previous = tasks;

    setTasks(tasks.filter((task) => task.id !== taskId));
    setSaveFailed(false);

    try {
      await deleteTask(createClient(), taskId);
    } catch {
      setTasks(previous);
      setSaveFailed(true);
    }
  }

  return {
    todayK,
    selectedKey,
    tasks,
    busy,
    loadFailed,
    saveFailed,
    select,
    makeList,
    add,
    toggle,
    remove,
  };
}
