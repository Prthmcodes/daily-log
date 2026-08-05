"use client";

import type { Mark } from "@/lib/copy";

type Props = {
  mark: Mark;
  ticked: boolean;
  onToggle: () => void;
};

/**
 * One of the five daily marks.
 *
 * A real `<button>` rather than a styled `<div>`, so it can be reached and
 * operated from the keyboard and announced properly by a screen reader.
 * `role="switch"` with `aria-checked` says "this is a two-state control and it
 * is currently on", which is exactly what it is.
 *
 * The whole row is the target, and it comes to just over the 44px minimum for
 * something you tap with a thumb.
 */
export function MarkToggle({ mark, ticked, onToggle }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={ticked}
      onClick={onToggle}
      className={`flex w-full min-h-[44px] items-start gap-3 rounded-[9px] border px-3 py-[11px] text-left focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent ${
        ticked
          ? "border-on-line bg-on"
          : "border-transparent hover:bg-row-hover"
      }`}
    >
      <span
        // aria-hidden because the button already announces its own state;
        // without this a screen reader would read the tick twice.
        aria-hidden="true"
        className={`mt-px grid size-5 shrink-0 place-items-center rounded-[5px] border-[1.5px] text-[13px] text-white ${
          ticked ? "border-accent bg-accent" : "border-box bg-card"
        }`}
      >
        {ticked ? "✓" : ""}
      </span>

      <span>
        <span className="font-medium">{mark.label}</span>
        <span className="mt-px block text-[12.5px] text-muted">
          {mark.helper}
        </span>
      </span>
    </button>
  );
}
