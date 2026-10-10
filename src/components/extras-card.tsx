"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { MarkToggle } from "@/components/mark-toggle";
import { EXTRAS, UI } from "@/lib/copy";
import type { DateKey } from "@/lib/date";
import {
  NO_EXTRAS,
  adjustBlocks,
  extrasOf,
  fetchExtras,
  saveExtras,
  type Extras,
} from "@/lib/extras";
import { createClient } from "@/lib/supabase/client";

type Props = {
  userId: string;
  dateKey: DateKey;
};

/** Wait this long after the last keystroke before saving the hardest line. */
const SAVE_DELAY_MS = 500;

/**
 * Things worth noticing that are deliberately not scored.
 *
 * This card is on the today screen but has nothing to do with the number above
 * it. It writes to its own table, so none of it can create a `days` row, mark
 * the day as logged, or move an average. A day where you read fifty pages and
 * ticked no marks is still a zero, and that is correct — these are two
 * different things being tracked on one screen, not one thing.
 *
 * It loads its own data rather than being handed it, which keeps the today
 * screen's state out of this. The parent gives it a `key` of the date so that
 * moving to another day builds a fresh one.
 */
export function ExtrasCard({ userId, dateKey }: Props) {
  const [extras, setExtras] = useState<Extras>(NO_EXTRAS);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  /**
   * The hardest line is held separately from the rest.
   *
   * The ticks save the instant they are pressed; text cannot, or every
   * keystroke would be a request. So this one field keeps its own state and
   * saves on a timer, and `lastSaved` is what stops it writing on load — see
   * the effect below.
   */
  const [hardest, setHardest] = useState("");
  const lastSaved = useRef("");

  useEffect(() => {
    async function load() {
      try {
        // A plain select. It creates nothing.
        const loaded = extrasOf(await fetchExtras(createClient(), dateKey));
        setExtras(loaded);
        setHardest(loaded.hardest);
        // Both of these, or the effect below would immediately "save" the text
        // it has only just read, writing a row merely because you opened the
        // app — the exact thing this table is arranged to prevent.
        lastSaved.current = loaded.hardest;
        setLoading(false);
      } catch {
        setFailed(true);
      }
    }

    load();
  }, [dateKey]);

  /**
   * Change the screen first, then the database. Put it back if that fails.
   *
   * `hardest` is folded back in from its own state rather than taken from
   * `next`. A tick pressed while a half-typed sentence is still waiting on its
   * timer would otherwise write the *previously saved* text and wipe what is
   * on screen. What the screen shows is the truth; this keeps it that way.
   */
  async function save(next: Extras) {
    const previous = extras;
    const merged = { ...next, hardest };

    setExtras(merged);
    setFailed(false);

    try {
      await saveExtras(createClient(), userId, dateKey, merged);
      lastSaved.current = hardest;
    } catch {
      setExtras(previous);
      setFailed(true);
    }
  }

  // Autosave the hardest line, debounced, and never on load.
  useEffect(() => {
    if (loading) return;
    if (hardest === lastSaved.current) return;

    const pending = hardest;
    const timer = setTimeout(async () => {
      try {
        await saveExtras(createClient(), userId, dateKey, {
          ...extras,
          hardest: pending,
        });
        lastSaved.current = pending;
        setExtras((current) => ({ ...current, hardest: pending }));
        setFailed(false);
      } catch {
        setFailed(true);
      }
    }, SAVE_DELAY_MS);

    /*
     * Effect cleanup: React runs this before the effect runs again, and when
     * the component goes away. It cancels the pending save, so typing twenty
     * characters schedules and cancels nineteen timers and sends exactly one
     * request, half a second after you stop.
     */
    return () => clearTimeout(timer);
  }, [hardest, loading, userId, dateKey, extras]);

  const stepper =
    "grid size-8 place-items-center rounded-[8px] text-lg text-muted transition-colors duration-100 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <section className="mt-3 rounded-[var(--radius-card)] border-[0.5px] border-line bg-card px-4 py-[18px]">
      <h2 className="mb-3 text-2xs uppercase tracking-[0.09em] text-muted">
        {EXTRAS.heading}
      </h2>

      <div className="border-t-[0.5px] border-rule" />

      <MarkToggle
        label={EXTRAS.noReels.label}
        helper={EXTRAS.noReels.helper}
        ticked={extras.noReels}
        disabled={loading}
        // Grey, not green. These are not scored, and a green tick would say
        // otherwise (spec 6.6).
        tone="muted"
        onToggle={() => save({ ...extras, noReels: !extras.noReels })}
      />

      <MarkToggle
        label={EXTRAS.readSomething.label}
        helper={EXTRAS.readSomething.helper}
        ticked={extras.readSomething}
        disabled={loading}
        tone="muted"
        onToggle={() =>
          save({ ...extras, readSomething: !extras.readSomething })
        }
      />

      <MarkToggle
        label={EXTRAS.alone.label}
        helper={EXTRAS.alone.helper}
        ticked={extras.alone}
        disabled={loading}
        tone="muted"
        onToggle={() => save({ ...extras, alone: !extras.alone })}
      />

      <MarkToggle
        label={EXTRAS.letGo.label}
        helper={EXTRAS.letGo.helper}
        ticked={extras.letGo}
        disabled={loading}
        tone="muted"
        onToggle={() => save({ ...extras, letGo: !extras.letGo })}
      />

      <div className="mt-4 flex items-center gap-3">
        <div className="flex-1">
          <div className="text-base font-medium">{EXTRAS.studyLabel}</div>
          <div className="mt-px text-sm text-muted">{EXTRAS.studyHelper}</div>
        </div>

        {/* One grouped control rather than three loose buttons. */}
        <div className="flex shrink-0 items-center gap-1 rounded-[var(--radius-control)] border-[0.5px] border-control p-[3px]">
          <button
            type="button"
            onClick={() =>
              save({
                ...extras,
                studyBlocks: adjustBlocks(extras.studyBlocks, -1),
              })
            }
            disabled={loading || extras.studyBlocks === 0}
            aria-label={EXTRAS.removeBlock}
            className={stepper}
          >
            −
          </button>

          {/*
            Today's number and nothing else. No average, no history, nothing to
            compare it against — a fact rather than a score. `aria-live` reads
            it out when it changes, since the buttons do not say what it became.
          */}
          <span
            aria-live="polite"
            className="min-w-7 text-center font-serif text-xl tabular-nums"
          >
            {extras.studyBlocks}
          </span>

          <button
            type="button"
            onClick={() =>
              save({
                ...extras,
                studyBlocks: adjustBlocks(extras.studyBlocks, 1),
              })
            }
            disabled={loading}
            aria-label={EXTRAS.addBlock}
            className={stepper}
          >
            +
          </button>
        </div>
      </div>

      {/*
        Where the pressure was.

        Last on the card, and below the ticks, because it is the one thing here
        that takes a sentence rather than a tap. Two rows tall for the same
        reason the day line is: the size of the box is the instruction.
      */}
      <div className="mt-4 border-t-[0.5px] border-rule pt-4">
        <label className="block text-sm text-muted">
          {EXTRAS.hardestLabel}
          <textarea
            rows={2}
            value={hardest}
            onChange={(event) => setHardest(event.target.value)}
            placeholder={EXTRAS.hardestPlaceholder}
            className="mt-1 w-full resize-none rounded-[var(--radius-control)] border-[0.5px] border-field-line bg-field px-3 py-[10px] text-base leading-[1.5] text-ink focus:outline-2 focus:outline-offset-[-1px] focus:outline-tag-line"
          />
        </label>

        {/*
          The only path in the app that runs forwards.

          Everything else records what happened; the edges screen decides what
          happens next time. Until now those two were written days apart and
          from memory. This carries the sentence across as a starting cue —
          which you then sharpen into a moment, because a description is not
          yet a cue.

          It appears only once there is something to carry, and it is a link
          rather than a button: nothing is written here, the edges screen
          simply opens with the box already full.
        */}
        {hardest.trim().length > 0 && (
          <Link
            href={`/thresholds?cue=${encodeURIComponent(hardest.trim())}`}
            className="mt-1 inline-flex min-h-11 items-center text-sm text-muted underline underline-offset-4 hover:text-ink"
          >
            {EXTRAS.hardestToEdge}
          </Link>
        )}
      </div>

      {failed && (
        <p aria-live="polite" className="mt-3 text-sm text-muted">
          {UI.saveFailed}
        </p>
      )}
    </section>
  );
}
