import Link from "next/link";

import { THRESHOLDS } from "@/lib/copy";
import { createClient } from "@/lib/supabase/server";
import { fetchThresholds, readAsSentence } from "@/lib/thresholds";

/**
 * The threshold plan, read-only, on the today screen.
 *
 * A server component with no "use client", for the same reason as the banner
 * and the protocol: it never changes while you are looking at it, so it is in
 * the HTML before any JavaScript loads. This is the part you want on screen at
 * the moment the urge turns up, and that moment does not wait for a bundle.
 *
 * Standing rather than daily, so it takes no argument and does not care which
 * day is selected.
 */
export async function ThresholdList() {
  const supabase = await createClient();
  const thresholds = await fetchThresholds(supabase);

  return (
    <section className="mt-3 rounded-[var(--radius-card)] border-[0.5px] border-line bg-card px-4 py-[18px]">
      <h2 className="mb-3 text-2xs uppercase tracking-[0.09em] text-muted">
        {THRESHOLDS.heading}
      </h2>

      {thresholds.length === 0 ? (
        <p className="text-sm text-muted">
          {THRESHOLDS.emptyState}{" "}
          <Link href="/thresholds" className="text-ink underline underline-offset-4">
            {THRESHOLDS.emptyStateLink}
          </Link>
        </p>
      ) : (
        <>
          <ul className="border-t-[0.5px] border-rule">
            {thresholds.map((threshold) => (
              <li
                key={threshold.id}
                className="border-b-[0.5px] border-rule py-3 text-base last:border-b-0"
              >
                {readAsSentence(threshold.cue, threshold.intention)}
              </li>
            ))}
          </ul>

          <p className="mt-3 text-sm text-muted">{THRESHOLDS.standingLine}</p>
        </>
      )}
    </section>
  );
}
