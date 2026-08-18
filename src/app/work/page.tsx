import Link from "next/link";
import { redirect } from "next/navigation";

import { WorkBoard } from "@/components/work-board";
import { UI, WORK } from "@/lib/copy";
import { createClient } from "@/lib/supabase/server";

/**
 * The work board.
 *
 * Its own route, and no date in the URL, because unlike the two daily screens
 * this is not about a day. Things stay here until they are done.
 *
 * Note what is absent: the banner, the protocol, the score, the numbers and
 * the grid. None of them belongs to a backlog, and putting any of them here
 * would start to suggest that getting through this list is what the app is
 * measuring. It is not, and it never counts any of it.
 */
export default async function WorkPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  return (
    <main className="mx-auto w-full max-w-[760px] px-5 py-6">
      <h1 className="font-serif text-2xl tracking-[-0.01em]">{UI.appTitle}</h1>
      <p className="mt-0.5 mb-[18px] text-sm text-muted">{WORK.heading}</p>

      <nav className="mb-3 flex gap-5">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-base text-muted hover:text-ink"
        >
          {UI.todayScreenLink}
        </Link>
        <Link
          href="/list"
          className="inline-flex min-h-11 items-center text-base text-muted hover:text-ink"
        >
          {UI.listScreenLink}
        </Link>
        <span className="inline-flex min-h-11 items-center border-b-2 border-ink text-base font-medium text-ink">
          {UI.workScreenLink}
        </span>
      </nav>

      <WorkBoard userId={user.id} />
    </main>
  );
}
