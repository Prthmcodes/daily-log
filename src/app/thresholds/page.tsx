import Link from "next/link";
import { redirect } from "next/navigation";

import { ThresholdEditor } from "@/components/threshold-editor";
import { THRESHOLDS, UI } from "@/lib/copy";
import { createClient } from "@/lib/supabase/server";

/**
 * Writing the threshold plan.
 *
 * Its own route, away from the two daily screens. This is a thing you do once
 * and revise occasionally, and putting it on the today screen would add
 * minutes to a ritual with a ninety-second budget.
 */
export default async function ThresholdsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  return (
    <main className="mx-auto w-full max-w-[560px] px-5 py-6">
      <h1 className="font-serif text-2xl tracking-[-0.01em]">{UI.appTitle}</h1>
      <p className="mt-0.5 mb-[18px] text-sm text-muted">
        {THRESHOLDS.editHeading}
      </p>

      <section className="rounded-[var(--radius-card)] border-[0.5px] border-line bg-card px-4 py-[18px]">
        <p className="mb-4 text-sm text-muted">{THRESHOLDS.emptyState}</p>

        <ThresholdEditor userId={user.id} />
      </section>

      <Link
        href="/"
        className="mt-4 inline-flex min-h-11 items-center text-sm text-muted hover:text-ink"
      >
        {THRESHOLDS.backLink}
      </Link>
    </main>
  );
}
