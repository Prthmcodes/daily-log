"use client";

import { WORK } from "@/lib/copy";
import type { WorkItemRow } from "@/lib/supabase/types";
import { BUCKETS, isBucket, type Bucket } from "@/lib/work";

type Props = {
  item: WorkItemRow;
  onToggle: () => void;
  onMove: (bucket: Bucket) => void;
  onDelete: () => void;
};

/**
 * One thing on the board.
 *
 * The tick is grey, not green, for the same reason as the morning list: the
 * moment finishing something is rendered as an achievement, not finishing it
 * starts being rendered as a failure.
 *
 * Moving between buckets is a plain `<select>`. It is one control, it is
 * keyboard-operable and screen-reader-friendly for free, and on a phone it
 * opens the native picker — all of which a set of custom buttons would have
 * had to earn.
 */
export function WorkRow({ item, onToggle, onMove, onDelete }: Props) {
  return (
    <li className="flex items-center gap-1 border-b-[0.5px] border-rule last:border-b-0">
      <button
        type="button"
        role="checkbox"
        aria-checked={item.done}
        onClick={onToggle}
        className="flex min-h-11 flex-1 items-center gap-3 px-1 py-2 text-left transition-colors duration-100 hover:bg-row-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
      >
        <span
          aria-hidden="true"
          className={`grid size-[21px] shrink-0 place-items-center rounded-[6px] border-[1.5px] text-sm text-white ${
            item.done ? "border-muted bg-muted" : "border-box bg-card"
          }`}
        >
          {item.done ? "✓" : ""}
        </span>

        <span
          className={`text-base ${
            item.done ? "text-muted line-through" : "text-ink"
          }`}
        >
          {item.text}
        </span>
      </button>

      <select
        value={item.bucket}
        onChange={(event) => {
          const next = event.target.value;
          // The value can only be one of the three, but the guard keeps
          // TypeScript honest and would catch a stale option.
          if (isBucket(next)) onMove(next);
        }}
        aria-label={`${WORK.moveLabel}: ${item.text}`}
        className="min-h-11 shrink-0 rounded-[var(--radius-control)] border-[0.5px] border-control bg-card px-2 text-xs text-muted focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
      >
        {BUCKETS.map((bucket) => (
          <option key={bucket} value={bucket}>
            {WORK.buckets[bucket]}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={onDelete}
        aria-label={`${WORK.deleteLabel}: ${item.text}`}
        className="grid size-11 shrink-0 place-items-center rounded-[10px] text-base text-muted transition-colors duration-100 hover:bg-row-hover focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
      >
        ×
      </button>
    </li>
  );
}
