"use client";

import { MORNING_LIST } from "@/lib/copy";
import type { TaskRow as Task } from "@/lib/supabase/types";

type Props = {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
};

/**
 * One line of the morning list.
 *
 * A done task is muted and struck through. It is not green, it does not
 * animate, and nothing celebrates. An unticked task carries no marker either —
 * no red, no "overdue", no exclamation mark. Both states are just a box, which
 * is the whole of design rule 10 expressed in CSS.
 *
 * The delete button sits outside the toggle rather than inside it, because a
 * button inside a button is invalid HTML and behaves unpredictably.
 */
export function TaskRow({ task, onToggle, onDelete }: Props) {
  return (
    <li className="flex items-start gap-1 border-b border-rule last:border-b-0">
      <button
        type="button"
        role="checkbox"
        aria-checked={task.done}
        onClick={onToggle}
        className="flex min-h-11 flex-1 items-start gap-3 rounded-[9px] px-2 py-[11px] text-left hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
      >
        <span
          // aria-hidden because the button already announces its own state;
          // without this a screen reader would read the tick twice.
          aria-hidden="true"
          // Muted grey when ticked, never the green used for the daily marks.
          // Spec 6.6 rules out a green tick here explicitly: green would make
          // finishing a task an achievement, and the moment a tick is worth
          // something, an untick starts being worth something too.
          className={`mt-px grid size-5 shrink-0 place-items-center rounded-[5px] border-[1.5px] text-[13px] text-white ${
            task.done ? "border-muted bg-muted" : "border-box bg-card"
          }`}
        >
          {task.done ? "✓" : ""}
        </span>

        <span
          className={`text-[14px] ${
            task.done ? "text-muted line-through" : "text-ink"
          }`}
        >
          {task.text}
        </span>
      </button>

      <button
        type="button"
        onClick={onDelete}
        aria-label={`${MORNING_LIST.deleteTaskLabel}: ${task.text}`}
        className="grid size-11 shrink-0 place-items-center rounded-[9px] text-[15px] text-muted hover:bg-row-hover focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
      >
        ×
      </button>
    </li>
  );
}
