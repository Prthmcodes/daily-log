/**
 * Every date in Daily Log passes through this file.
 *
 * The problem it exists to solve: a "day" in this app means a day in *your*
 * calendar, not a day in UTC. The obvious way to get a date string in
 * JavaScript is `new Date().toISOString().slice(0, 10)` — and it is wrong.
 * `toISOString()` converts to UTC first, so at 23:59 in New York it reports
 * tomorrow, and at 07:00 in Auckland it reports yesterday. Marks would land
 * on the wrong day and there would be no error message.
 *
 * So: build the key from the local getters (`getFullYear`, `getMonth`,
 * `getDate`), and never call `toISOString()` anywhere in this project.
 *
 * These are pure functions. No React, no Supabase, no imports at all.
 */

/**
 * A single calendar day in the user's own timezone, formatted "YYYY-MM-DD".
 *
 * This is a type *alias*, not a new type — a DateKey is a string and can be
 * used anywhere a string can. It exists to document intent in signatures.
 */
export type DateKey = string;

/** Shape check only. `isValidDateKey` does the real validation. */
const KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** 7 becomes "07", 12 stays "12". Months and days are always two digits. */
function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

/**
 * Turn a Date into the key for the calendar day it falls on, in local time.
 *
 * `getMonth()` is zero-based in JavaScript — January is 0 — which is why it
 * has a `+ 1`. `getFullYear()` and `getDate()` are not zero-based. This is a
 * genuine inconsistency in the language, not a mistake here.
 */
export function toDateKey(date: Date): DateKey {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

/** The key for today, wherever the user currently is. */
export function todayKey(): DateKey {
  return toDateKey(new Date());
}

/**
 * Is this a real calendar day, written correctly?
 *
 * The round-trip at the end is doing real work. JavaScript accepts
 * "2026-02-30" and silently rolls it forward to 2 March rather than failing,
 * so the only reliable check is to build the date and see whether it still
 * says what we asked for.
 */
export function isValidDateKey(key: string): boolean {
  if (!KEY_PATTERN.test(key)) return false;

  const date = new Date(`${key}T12:00:00`);
  if (Number.isNaN(date.getTime())) return false;

  return toDateKey(date) === key;
}

/**
 * Turn a key back into a Date, positioned at midday.
 *
 * Midday, not midnight, and this matters. On the day a country puts its
 * clocks forward, midnight may not exist or may shift by an hour, which can
 * drag a date across into the day before. Midday has twelve hours of clearance
 * on either side, so no DST rule in the world can move it off its own day.
 *
 * Note also the "T12:00:00" suffix. A bare "2026-08-05" is parsed as UTC by
 * the language spec; adding a time with no timezone offset makes it local.
 */
export function fromDateKey(key: DateKey): Date {
  if (!isValidDateKey(key)) {
    throw new Error(`Not a valid date key: "${key}"`);
  }
  return new Date(`${key}T12:00:00`);
}

/**
 * The key `delta` days away. Negative goes backwards.
 *
 * `setDate` handles rolling over month and year ends by itself — setting day
 * 32 of August gives you 1 September — so there is no arithmetic to get wrong.
 */
export function addDays(key: DateKey, delta: number): DateKey {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + delta);
  return toDateKey(date);
}

/**
 * `count` consecutive keys ending at `endKey`, oldest first.
 *
 * lastNKeys(3, "2026-08-05") gives
 * ["2026-08-03", "2026-08-04", "2026-08-05"].
 *
 * `endKey = todayKey()` is a default parameter: leave the argument out and it
 * fills itself in. It is evaluated on every call, so it never goes stale.
 */
export function lastNKeys(count: number, endKey: DateKey = todayKey()): DateKey[] {
  const keys: DateKey[] = [];
  for (let offset = count - 1; offset >= 0; offset--) {
    keys.push(addDays(endKey, -offset));
  }
  return keys;
}

/**
 * Is `key` a later day than `other`?
 *
 * Comparing the strings directly is safe here, and deliberate. "YYYY-MM-DD" is
 * fixed-width with zero-padded parts and the components run largest to
 * smallest, so alphabetical order and chronological order are the same order.
 * No parsing, no Date objects, no timezone involved.
 */
export function isAfter(key: DateKey, other: DateKey): boolean {
  return key > other;
}

/** Future days are not reachable in this app — see spec 5.10. */
export function isFuture(key: DateKey): boolean {
  return isAfter(key, todayKey());
}

/**
 * A key as a human reads it: "Wednesday, 5 August".
 *
 * The locale is pinned to en-GB rather than left to the browser so that the
 * output is the same everywhere, including in tests.
 */
export function formatDayLabel(key: DateKey): string {
  return fromDateKey(key).toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
