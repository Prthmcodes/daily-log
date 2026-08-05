import { UI } from "@/lib/copy";
import type { DateKey } from "@/lib/date";
import type { LoggedDay } from "@/lib/days";

/**
 * The three numbers on the today screen.
 *
 * The rule that shapes all of this: **an average is taken over logged days
 * only**. A day you never opened is absent from the data entirely and must not
 * count as anything — not as a zero, not as a gap. A day you deliberately
 * scored zero is present, and counts fully.
 *
 * That distinction is the reason this app uses an average rather than a
 * streak. Five good days followed by a zero is 4.2, and 4.2 is not a reason to
 * give up. A broken streak is.
 */

/**
 * The mean score across whichever of `days` fall inside `windowKeys`, or null
 * if none of them do.
 *
 * Null rather than 0, because "nothing to average yet" and "averaging zero"
 * are completely different things and only one of them is a score.
 */
export function averageWithin(
  days: LoggedDay[],
  windowKeys: DateKey[],
): number | null {
  // A Set gives fast "is this key in the window?" checks. With an array we
  // would search the whole list once per day; with 30 days that hardly
  // matters, but the intent reads more clearly this way.
  const window = new Set(windowKeys);

  let total = 0;
  let count = 0;

  for (const day of days) {
    if (window.has(day.date)) {
      total += day.score;
      count++;
    }
  }

  if (count === 0) return null;
  return total / count;
}

/**
 * An average as it appears on screen: one decimal place, or the placeholder
 * when there is nothing to average.
 */
export function formatAverage(value: number | null): string {
  if (value === null) return UI.noValue;
  return value.toFixed(1);
}
