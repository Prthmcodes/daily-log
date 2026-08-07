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

  const arrow =
    "grid size-11 shrink-0 place-items-center rounded-[var(--radius-control)] border-[0.5px] border-control text-base text-muted transition-colors duration-100 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:cursor-default disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div className="mb-4 flex items-center gap-2">
      <button
        type="button"
        onClick={() => go(-1)}
        aria-label={UI.previousDay}
        className={arrow}
      >
        ‹
      </button>

      <button
        type="button"
        onClick={() => go(1)}
        disabled={isToday}
        aria-label={UI.nextDay}
        className={arrow}
      >
        ›
      </button>

      <span className="ml-1 text-base font-medium">
        {formatDayLabel(selectedKey)}
      </span>

      {isToday && (
        <span className="ml-auto rounded-full bg-tag px-[9px] py-[3px] text-2xs text-tag-ink">
          {UI.todayTag}
        </span>
      )}
    </div>
  );
}
