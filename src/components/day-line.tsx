"use client";

import { useEffect, useRef, useState } from "react";

import { DAY_LINE, UI } from "@/lib/copy";
import type { DateKey } from "@/lib/date";
import { saveNote } from "@/lib/days";
import { createClient } from "@/lib/supabase/client";

/** Wait this long after the last keystroke before saving. */
const SAVE_DELAY_MS = 500;

/*
 * How tall the box is allowed to be, in pixels. Both figures are two or four
 * lines of 13.5px text at the 1.55 line height, plus padding and borders.
 *
 * The size is the instruction. It opens at two lines because that is what is
 * being asked for, and stops at four because a box that grew to fill the
 * screen would be quietly asking for an essay instead.
 *
 * The minimum matters as much as the maximum: without it the grow-to-fit
 * effect below measures an empty box and shrinks it to a single line, which
 * looks like a search field rather than an invitation to write two lines.
 */
const MIN_HEIGHT_PX = 62;
const MAX_HEIGHT_PX = 104;

type Props = {
  userId: string;
  dateKey: DateKey;
  /** Whatever was already saved for this day — empty string if nothing. */
  initialNote: string;
  /**
   * Called after a successful save. Writing a note creates the day's row, so
   * the screen above needs to know the day has just become a logged day.
   */
  onSaved: () => void;
};

export function DayLine({ userId, dateKey, initialNote, onSaved }: Props) {
  const [note, setNote] = useState(initialNote);
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /**
   * The last text we know is in the database.
   *
   * A `useRef` holds a value across renders without causing one when it
   * changes — unlike `useState`. It is used here rather than state precisely
   * because updating it must not re-run anything.
   *
   * This is also the guard that keeps the app honest. The save effect below
   * runs whenever `note` changes, which includes the very first render. If it
   * saved unconditionally, then merely *opening* the app would write a row and
   * mark the day as logged — the exact thing spec 6.3 forbids. Starting this
   * ref equal to `initialNote` means there is nothing to save until you
   * actually type something different.
   */
  const lastSaved = useRef(initialNote);

  // Autosave, debounced.
  useEffect(() => {
    if (note === lastSaved.current) return;

    const pending = note;
    const timer = setTimeout(async () => {
      try {
        await saveNote(createClient(), userId, dateKey, pending);
        lastSaved.current = pending;
        setSaved(true);
        setFailed(false);
        onSaved();
      } catch {
        setFailed(true);
      }
    }, SAVE_DELAY_MS);

    /*
     * The returned function is effect cleanup: React runs it before the effect
     * runs again, and when the component goes away. Here it cancels the
     * pending save, so typing twenty characters schedules and cancels
     * nineteen timers and sends exactly one request — half a second after you
     * stop.
     */
    return () => clearTimeout(timer);
  }, [note, userId, dateKey, onSaved]);

  // Grow the box to fit, up to the cap, then let it scroll.
  useEffect(() => {
    const element = textareaRef.current;
    if (!element) return;

    // Reset to "auto" first, or scrollHeight only ever reports the current
    // height and the box could never shrink again after a deletion.
    element.style.height = "auto";

    const fitted = Math.min(
      Math.max(element.scrollHeight, MIN_HEIGHT_PX),
      MAX_HEIGHT_PX,
    );
    element.style.height = `${fitted}px`;
  }, [note]);

  function handleChange(event: React.ChangeEvent<HTMLTextAreaElement>) {
    setNote(event.target.value);
    // Clear the indicator as soon as there is something unsaved again,
    // otherwise "saved" would sit there lying while you type.
    setSaved(false);
  }

  return (
    <div className="mt-3">
      <textarea
        ref={textareaRef}
        rows={2}
        value={note}
        onChange={handleChange}
        aria-label={DAY_LINE.label}
        placeholder={DAY_LINE.placeholder}
        className="w-full resize-none overflow-y-auto rounded-[var(--radius-control)] border border-field-line bg-field px-[11px] py-[9px] text-[13.5px] leading-[1.55] text-ink focus:outline-2 focus:outline-offset-[-1px] focus:outline-tag-line"
      />

      {/*
        A fixed-height strip so the layout does not jump when the word
        appears. aria-live lets a screen reader announce it without stealing
        focus mid-sentence.
      */}
      <div aria-live="polite" className="h-4 text-[11.5px] text-muted">
        {failed ? UI.saveFailed : saved ? DAY_LINE.savedIndicator : ""}
      </div>
    </div>
  );
}
