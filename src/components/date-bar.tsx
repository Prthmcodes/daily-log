"use client";

import { UI } from "@/lib/copy";
import { addDays, formatDayLabel, isAfter, type DateKey } from "@/lib/date";

type Props = {
  selectedKey: DateKey;
  /** Today, in the user's own timezone. The furthest forward you may go. */
  todayK: DateKey;
  onSelect: (key: DateKey) => void;
};

/**
 * Move between days.
 *
 * Tomorrow is not reachable, and neither is any day after it. There is nothing
 * to record about a day that has not happened, and a screen full of empty
 * future days invites planning the perfect week — which is the all-or-nothing
 * thinking this app is trying to avoid.
 */
export function DateBar({ selectedKey, todayK, onSelect }: Props) {
  const isToday = selectedKey === todayK;

  function go(delta: number) {
    const next = addDays(selectedKey, delta);
    // Belt and braces. The forward button is already disabled on today, but a
    // guard here means no future date can be reached however this is called.
    if (isAfter(next, todayK)) return;
    onSelect(next);
  }

  return (
    <div className="mb-4 flex items-center gap-[10px]">
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label={UI.previousDay}
        className="grid size-11 shrink-0 place-items-center rounded-[7px] border border-control bg-card text-[15px] text-muted hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
      >
        ‹
      </button>

      <button
        type="button"
        onClick={() => go(1)}
        disabled={isToday}
        aria-label={UI.nextDay}
        className="grid size-11 shrink-0 place-items-center rounded-[7px] border border-control bg-card text-[15px] text-muted hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:cursor-default disabled:opacity-30 disabled:hover:bg-card"
      >
        ›
      </button>

      <span className="text-[16px] font-semibold">
        {formatDayLabel(selectedKey)}
      </span>

      {isToday && (
        <span className="rounded-full border border-tag-line bg-tag px-2 py-[2px] text-[11px] text-tag-ink">
          {UI.todayTag}
        </span>
      )}
    </div>
  );
}
