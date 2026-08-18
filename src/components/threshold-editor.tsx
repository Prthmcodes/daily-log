"use client";

import { useEffect, useState } from "react";

import { THRESHOLDS, UI } from "@/lib/copy";
import { createClient } from "@/lib/supabase/client";
import type { ThresholdRow } from "@/lib/supabase/types";
import {
  addThreshold,
  deleteThreshold,
  fetchThresholds,
  isComplete,
  nextPosition,
  updateThreshold,
} from "@/lib/thresholds";

type Props = {
  userId: string;
};

const FIELD =
  "min-h-11 w-full rounded-[var(--radius-control)] border-[0.5px] border-field-line bg-field px-3 text-base text-ink focus:outline-2 focus:outline-offset-[-1px] focus:outline-tag-line";

/**
 * Writing and changing the threshold plan.
 *
 * Editing is allowed here, unlike on the morning list, and the difference is
 * deliberate. A task is a decision for one day, so retyping it tomorrow is the
 * point. An edge is a standing decision about a moment that recurs — it is
 * meant to be sharpened over months, not rewritten every morning.
 *
 * Changes save when a field loses focus rather than on a timer. There is no
 * hurry here, nothing is being logged, and a Save button per row would be four
 * buttons on a screen that needs none.
 */
export function ThresholdEditor({ userId }: Props) {
  const [thresholds, setThresholds] = useState<ThresholdRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [saved, setSaved] = useState(false);

  const [newCue, setNewCue] = useState("");
  const [newIntention, setNewIntention] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setThresholds(await fetchThresholds(createClient()));
        setLoading(false);
      } catch {
        setFailed(true);
      }
    }

    load();
  }, []);

  async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isComplete(newCue, newIntention)) return;

    setFailed(false);
    try {
      const created = await addThreshold(
        createClient(),
        userId,
        newCue,
        newIntention,
        nextPosition(thresholds),
      );
      setThresholds([...thresholds, created]);
      // Empty the boxes so the next one can be typed straight away.
      setNewCue("");
      setNewIntention("");
    } catch {
      setFailed(true);
    }
  }

  /** Change one field of one row, on screen only. */
  function edit(id: string, field: "cue" | "intention", value: string) {
    setThresholds(
      thresholds.map((threshold) =>
        threshold.id === id ? { ...threshold, [field]: value } : threshold,
      ),
    );
    setSaved(false);
  }

  /** Commit a row when its field loses focus. */
  async function commit(id: string) {
    const threshold = thresholds.find((item) => item.id === id);
    if (!threshold) return;
    if (!isComplete(threshold.cue, threshold.intention)) return;

    setFailed(false);
    try {
      await updateThreshold(
        createClient(),
        id,
        threshold.cue,
        threshold.intention,
      );
      setSaved(true);
    } catch {
      setFailed(true);
    }
  }

  async function remove(id: string) {
    const previous = thresholds;
    setThresholds(thresholds.filter((threshold) => threshold.id !== id));
    setFailed(false);

    try {
      await deleteThreshold(createClient(), id);
    } catch {
      setThresholds(previous);
      setFailed(true);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted">{UI.loading}</p>;
  }

  return (
    <>
      {thresholds.map((threshold) => (
        <div
          key={threshold.id}
          className="border-b-[0.5px] border-rule py-4 first:border-t-[0.5px]"
        >
          <label className="block text-sm text-muted">
            {THRESHOLDS.cueLabel}
            <input
              type="text"
              value={threshold.cue}
              onChange={(event) => edit(threshold.id, "cue", event.target.value)}
              onBlur={() => commit(threshold.id)}
              className={`mt-1 ${FIELD}`}
            />
          </label>

          <label className="mt-2 block text-sm text-muted">
            {THRESHOLDS.intentionLabel}
            <input
              type="text"
              value={threshold.intention}
              onChange={(event) =>
                edit(threshold.id, "intention", event.target.value)
              }
              onBlur={() => commit(threshold.id)}
              className={`mt-1 ${FIELD}`}
            />
          </label>

          <button
            type="button"
            onClick={() => remove(threshold.id)}
            className="mt-2 min-h-11 text-sm text-muted transition-colors duration-100 hover:text-ink"
          >
            {THRESHOLDS.removeButton}
          </button>
        </div>
      ))}

      <form onSubmit={handleAdd} className="pt-4">
        <label className="block text-sm text-muted">
          {THRESHOLDS.cueLabel}
          <input
            type="text"
            value={newCue}
            onChange={(event) => setNewCue(event.target.value)}
            placeholder={THRESHOLDS.cuePlaceholder}
            className={`mt-1 ${FIELD}`}
          />
        </label>

        <label className="mt-2 block text-sm text-muted">
          {THRESHOLDS.intentionLabel}
          <input
            type="text"
            value={newIntention}
            onChange={(event) => setNewIntention(event.target.value)}
            placeholder={THRESHOLDS.intentionPlaceholder}
            className={`mt-1 ${FIELD}`}
          />
        </label>

        <button
          type="submit"
          disabled={!isComplete(newCue, newIntention)}
          className="mt-3 min-h-11 w-full rounded-[var(--radius-control)] border-[0.5px] border-control bg-card px-4 text-base text-ink transition-colors duration-100 hover:bg-hover disabled:opacity-40 disabled:hover:bg-card"
        >
          {THRESHOLDS.addButton}
        </button>
      </form>

      {/* A fixed strip, so the layout does not jump when a word appears. */}
      <div aria-live="polite" className="mt-2 h-4 text-2xs text-muted">
        {failed ? UI.saveFailed : saved ? THRESHOLDS.savedIndicator : ""}
      </div>
    </>
  );
}
