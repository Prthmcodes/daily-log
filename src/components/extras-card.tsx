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

  return (
    <section className="mt-4 rounded-[var(--radius-card)] border border-line bg-card px-5 py-[18px]">
      <h2 className="mb-[14px] text-[13px] font-semibold uppercase tracking-[0.07em] text-muted">
        {EXTRAS.heading}
      </h2>

      <MarkToggle
        label={EXTRAS.noReels.label}
        helper={EXTRAS.noReels.helper}
        ticked={extras.noReels}
        disabled={loading}
        onToggle={() => save({ ...extras, noReels: !extras.noReels })}
      />

      <MarkToggle
        label={EXTRAS.readSomething.label}
        helper={EXTRAS.readSomething.helper}
        ticked={extras.readSomething}
        disabled={loading}
        onToggle={() =>
          save({ ...extras, readSomething: !extras.readSomething })
        }
      />

      <div className="mt-[14px] flex items-center gap-3 border-t border-rule pt-[14px]">
        <div className="flex-1">
          <div className="font-medium">{EXTRAS.studyLabel}</div>
          <div className="mt-px text-[12.5px] text-muted">
            {EXTRAS.studyHelper}
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            save({ ...extras, studyBlocks: adjustBlocks(extras.studyBlocks, -1) })
          }
          disabled={loading || extras.studyBlocks === 0}
          aria-label={EXTRAS.removeBlock}
          className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-control)] border border-control bg-card text-[18px] text-muted hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:opacity-30 disabled:hover:bg-card"
        >
          −
        </button>

        {/*
          Today's number and nothing else. No average, no history, nothing to
          compare it against — a fact rather than a score. `aria-live` reads it
          out when it changes, since the buttons themselves do not say what it
          became.
        */}
        <span
          aria-live="polite"
          className="min-w-8 text-center text-[25px] font-semibold tracking-[-0.02em] tabular-nums"
        >
          {extras.studyBlocks}
        </span>

        <button
          type="button"
          onClick={() =>
            save({ ...extras, studyBlocks: adjustBlocks(extras.studyBlocks, 1) })
          }
          disabled={loading}
          aria-label={EXTRAS.addBlock}
          className="grid size-11 shrink-0 place-items-center rounded-[var(--radius-control)] border border-control bg-card text-[18px] text-muted hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:opacity-30 disabled:hover:bg-card"
        >
          +
        </button>
      </div>

      {failed && (
        <p aria-live="polite" className="mt-3 text-[13px] text-muted">
          {UI.saveFailed}
        </p>
      )}
    </section>
  );
}
