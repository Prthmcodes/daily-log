import { isAfter, isValidDateKey, type DateKey } from "@/lib/date";

/**
 * The day being looked at, carried in the address bar.
 *
 * Both screens read and write the same `?date=` parameter, which is what lets
 * the link between them arrive on the same day you were already on. Today has
 * no parameter at all, so the everyday URL stays clean.
 */

const PARAM = "date";

/**
 * Validate a `?date=` value.
 *
 * Separate from the reading below so it can be tested without a browser, and
 * because this is where the rules live: it has to be a real calendar day, and
 * it may not be in the future. Anything else falls back to today rather than
 * failing — a mistyped URL should not be an error screen.
 */
export function parseDateParam(
  value: string | null,
  todayK: DateKey,
): DateKey | null {
  if (!value) return null;
  if (!isValidDateKey(value)) return null;
  // Future days are not reachable, however you try to reach them (spec 5.10).
  if (isAfter(value, todayK)) return null;
  return value;
}

/** Read `?date=` out of the address bar. Returns null if it is not usable. */
export function readDateFromUrl(todayK: DateKey): DateKey | null {
  if (typeof window === "undefined") return null;

  const value = new URLSearchParams(window.location.search).get(PARAM);
  return parseDateParam(value, todayK);
}

/**
 * Keep the address bar in step with what is on screen.
 *
 * `history.replaceState` changes the URL without asking the server for
 * anything, so stepping back through the days stays instant. Using the router
 * here would re-render the page from the server on every tap of an arrow.
 */
export function writeDateToUrl(key: DateKey, todayK: DateKey): void {
  if (typeof window === "undefined") return;

  const url = new URL(window.location.href);
  if (key === todayK) {
    url.searchParams.delete(PARAM);
  } else {
    url.searchParams.set(PARAM, key);
  }
  window.history.replaceState(null, "", url);
}

/** The link to the other screen, carrying the day you are looking at. */
export function screenHref(
  path: string,
  key: DateKey,
  todayK: DateKey,
): string {
  if (key === todayK) return path;
  return `${path}?${PARAM}=${key}`;
}
