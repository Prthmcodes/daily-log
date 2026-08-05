"use client";

import { MarkToggle } from "@/components/mark-toggle";
import { MARKS, SCORE_LABELS, UI, type MarkKey } from "@/lib/copy";
import { scoreOf, type Marks } from "@/lib/days";

type Props = {
  marks: Marks;
  /** Does a row exist for this day? Not the same as "scored above zero". */
  isLogged: boolean;
  /** True while a different day is being fetched, so taps are refused. */
  busy: boolean;
  saveFailed: boolean;
  onToggle: (key: MarkKey) => void;
  onLogZero: () => void;
};

/** The five toggles, the score, and the label that goes with it. */
export function MarksCard({
  marks,
  isLogged,
  busy,
  saveFailed,
  onToggle,
  onLogZero,
}: Props) {
  const score = scoreOf(marks);

  return (
    <>
      <div>
        {MARKS.map((mark) => (
          <MarkToggle
            key={mark.key}
            mark={mark}
            ticked={marks[mark.key]}
            disabled={busy}
            // An arrow function so each row calls onToggle with its own key.
            // onToggle={onToggle(mark.key)} would call it immediately during
            // rendering instead.
            onToggle={() => onToggle(mark.key)}
          />
        ))}
      </div>

      <div className="mt-[14px] flex items-baseline gap-[14px] border-t border-rule pt-[14px]">
        <div className="text-[30px] font-semibold tracking-[-0.02em]">
          {score}
          <span className="text-[15px] font-medium text-muted">/5</span>
        </div>
        <div className="text-[13px] text-muted">{SCORE_LABELS[score]}</div>

        {/* Only offered while there is no row. Once the day is logged there is
            nothing left for this button to do. */}
        {!isLogged && !busy && (
          <button
            type="button"
            onClick={onLogZero}
            className="ml-auto min-h-11 shrink-0 whitespace-nowrap rounded-[var(--radius-control)] border border-control bg-card px-[11px] text-[12.5px] text-muted hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
          >
            {UI.logZeroButton}
          </button>
        )}
      </div>

      {/* aria-live tells a screen reader to announce this when it appears. */}
      {saveFailed && (
        <p aria-live="polite" className="mt-3 text-[13px] text-muted">
          {UI.saveFailed}
        </p>
      )}
    </>
  );
}
