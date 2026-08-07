"use client";

import { useEffect, useState } from "react";

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

  useEffect(() => {
    async function load() {
      try {
        // A plain select. It creates nothing.
        setExtras(extrasOf(await fetchExtras(createClient(), dateKey)));
        setLoading(false);
      } catch {
        setFailed(true);
      }
    }

    load();
  }, [dateKey]);

  /** Change the screen first, then the database. Put it back if that fails. */
  async function save(next: Extras) {
    const previous = extras;
    setExtras(next);
    setFailed(false);

    try {
      await saveExtras(createClient(), userId, dateKey, next);
    } catch {
      setExtras(previous);
      setFailed(true);
    }
  }

  const stepper =
    "grid size-8 place-items-center rounded-[8px] text-lg text-muted transition-colors duration-100 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <section className="mt-3 rounded-[var(--radius-card)] border-[0.5px] border-line bg-card px-4 py-[18px]">
      <h2 className="mb-3 text-2xs uppercase tracking-[0.09em] text-muted">
        {EXTRAS.heading}
      </h2>

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

      <div className="mt-3 flex items-center gap-3 border-t-[0.5px] border-rule pt-3">
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
            className="min-w-7 text-center text-xl font-medium tabular-nums"
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

      {failed && (
        <p aria-live="polite" className="mt-3 text-sm text-muted">
          {UI.saveFailed}
        </p>
      )}
    </section>
  );
}
