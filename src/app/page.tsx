import Link from "next/link";
import { redirect } from "next/navigation";

import { Protocol } from "@/components/protocol";
import { ReframeBanner } from "@/components/reframe-banner";
import { TodayScreen } from "@/components/today-screen";
import { UI } from "@/lib/copy";
import { createClient } from "@/lib/supabase/server";

/**
 * The today screen.
 *
 * This part runs on the server, and does only what the server can safely do:
 * establish who you are, and put the fixed text on the page. It deliberately
 * does not fetch the day, because choosing *which* day means knowing what time
 * it is where you are, and the server does not. That belongs to the browser —
 * see the useToday hook.
 */
export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The proxy already redirects anyone signed out, so this should never fire.
  // It stays because "should never happen" is not the same as "cannot", and
  // without it the line below would need a null check.
  if (!user) redirect("/sign-in");

  return (
    <main className="mx-auto w-full max-w-[760px] px-5 py-6">
      <h1 className="text-[22px] font-semibold tracking-[-0.01em]">
        {UI.appTitle}
      </h1>
      <p className="mb-[22px] text-[13px] text-muted">{UI.subtitle}</p>

      {/* Above the marks, so it is read before the day is scored. */}
      <ReframeBanner />

      <TodayScreen userId={user.id} />

      <Protocol />

      <div className="mt-6 flex items-center gap-4">
        <Link
          href="/account"
          className="inline-flex min-h-11 items-center text-[13px] text-muted hover:text-ink"
        >
          {UI.accountLink}
        </Link>

        <form action="/auth/sign-out" method="post">
          <button
            type="submit"
            className="min-h-11 rounded-[var(--radius-control)] border border-control bg-card px-4 text-[13px] text-muted hover:bg-hover"
          >
            {UI.signOut}
          </button>
        </form>
      </div>
    </main>
  );
}
