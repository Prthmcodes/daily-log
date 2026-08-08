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
      {/* Ruled rows, edge to edge. The rule above the first one closes the
          set off from the date bar. */}
      <div className="border-t-[0.5px] border-rule">
        {MARKS.map((mark) => (
          <MarkToggle
            key={mark.key}
            label={mark.label}
            helper={mark.helper}
            ticked={marks[mark.key]}
            disabled={busy}
            // An arrow function so each row calls onToggle with its own key.
            // onToggle={onToggle(mark.key)} would call it immediately during
            // rendering instead.
            onToggle={() => onToggle(mark.key)}
          />
        ))}
      </div>

      {/*
        The score gets its own line and the largest type on the screen, set in
        the serif. It is the thing being measured, and at the prototype's 30px
        — wedged between a "/5" and a button — it read like a footnote on
        itself.
      */}
      <div className="mt-5 flex items-baseline gap-3">
        <div className="font-serif text-3xl tracking-[-0.02em] tabular-nums">
          {score}
          <span className="text-xl text-muted">/5</span>
        </div>
        <div className="text-sm text-muted">{SCORE_LABELS[score]}</div>
      </div>

      {/* aria-live tells a screen reader to announce this when it appears. */}
      {saveFailed && (
        <p aria-live="polite" className="mt-3 text-sm text-muted">
          {UI.saveFailed}
        </p>
      )}

      {/*
        Below the score rather than beside it. In the score row it competed
        with the label for the same space and won, on a screen where the label
        is the part doing the work.
      */}
      {!isLogged && !busy && (
        <button
          type="button"
          onClick={onLogZero}
          className="mt-4 min-h-11 w-full rounded-[var(--radius-control)] border-[0.5px] border-control bg-card px-4 text-sm text-muted transition-colors duration-100 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
        >
          {UI.logZeroButton}
        </button>
      )}
    </>
  );
}
