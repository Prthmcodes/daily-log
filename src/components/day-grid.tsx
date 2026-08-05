"use client";

import { UI } from "@/lib/copy";
import { formatDayLabel, lastNKeys, type DateKey } from "@/lib/date";
import type { LoggedDay } from "@/lib/days";

/**
 * One Tailwind class per score. Written out in full because Tailwind reads the
 * source as text to decide which classes to generate — a name built at runtime
 * like `bg-score-${score}` would produce no CSS at all.
 *
 * Grey through to green. There is no red at the bottom end: a low score is
 * information, not a warning.
 */
const SCORE_CLASS = [
  "bg-score-0",
  "bg-score-1",
  "bg-score-2",
  "bg-score-3",
  "bg-score-4",
  "bg-score-5",
];

type Props = {
  /** The newest cell. Always today, so the grid never shows the future. */
  endKey: DateKey;
  loggedDays: LoggedDay[];
  selectedKey: DateKey;
  onSelect: (key: DateKey) => void;
};

export function DayGrid({ endKey, loggedDays, selectedKey, onSelect }: Props) {
  const keys = lastNKeys(30, endKey);

  /*
   * A Map from date to score, built once, so each of the thirty cells is a
   * single lookup rather than a search through the list.
   *
   * A date that is not in this Map was never logged. That is the only way the
   * app knows, and it is why an unlogged day has to look different from a zero
   * rather than merely paler.
   */
  const scores = new Map(loggedDays.map((day) => [day.date, day.score]));

  return (
    <section className="mt-4 rounded-[var(--radius-card)] border border-line bg-card px-5 py-[18px]">
      <h2 className="mb-[14px] text-[13px] font-semibold uppercase tracking-[0.07em] text-muted">
        {UI.gridHeading}
      </h2>

      {/*
        Ten across on a phone and fifteen on anything wider. Fifteen columns on
        a 390px screen gives 18px cells, which is too small to hit with a thumb.
      */}
      <div className="grid grid-cols-[repeat(10,minmax(0,1fr))] gap-[5px] sm:grid-cols-[repeat(15,minmax(0,1fr))]">
        {keys.map((key) => {
          const score = scores.get(key);
          const logged = score !== undefined;
          const selected = key === selectedKey;

          const label = `${formatDayLabel(key)} — ${
            logged ? `${score}/5` : UI.notLogged
          }`;

          return (
            <button
              key={key}
              type="button"
              onClick={() => onSelect(key)}
              title={label}
              aria-label={label}
              aria-current={selected ? "date" : undefined}
              className={`aspect-square rounded-[4px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
                logged
                  ? SCORE_CLASS[score]
                  : "border border-dashed border-field-line bg-unlogged"
              } ${selected ? "outline outline-2 outline-offset-1 outline-ink" : ""}`}
            />
          );
        })}
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11.5px] text-muted">
        <span>0</span>
        {SCORE_CLASS.map((className) => (
          <span
            key={className}
            aria-hidden="true"
            className={`inline-block size-[13px] rounded-[3px] ${className}`}
          />
        ))}
        <span>5</span>
        <span className="ml-auto">{UI.gridHint}</span>
      </div>
    </section>
  );
}
