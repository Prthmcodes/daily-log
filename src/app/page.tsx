import { redirect } from "next/navigation";

import { UI } from "@/lib/copy";
import { createClient } from "@/lib/supabase/server";

/**
 * The today screen. Chunk 5 gets it as far as "you are signed in and it knows
 * who you are"; the marks, score, day line, metrics and grid arrive next.
 *
 * This is a server component — it runs on the server before anything reaches
 * the browser, which is why it can await the database directly with no
 * loading spinner.
 */
export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The middleware already redirects anyone signed out, so this should never
  // fire. It stays because "should never happen" is not the same as "cannot",
  // and without it every line below would need a null check.
  if (!user) redirect("/sign-in");

  return (
    <main className="mx-auto w-full max-w-[760px] px-5 py-6">
      <h1 className="text-[22px] font-semibold tracking-[-0.01em]">
        {UI.appTitle}
      </h1>
      <p className="mb-6 text-[13px] text-muted">{UI.subtitle}</p>

      <section className="rounded-[var(--radius-card)] border border-line bg-card p-5">
        <p className="text-[13px] text-muted">Signed in as {user.email}</p>

        {/*
          A plain form rather than a button with a click handler, so signing
          out still works if JavaScript has not loaded yet.
        */}
        <form action="/auth/sign-out" method="post" className="mt-3">
          <button
            type="submit"
            className="mt-1 min-h-[44px] rounded-[var(--radius-control)] border border-control bg-card px-4 text-[13px] text-muted hover:bg-hover"
          >
            {UI.signOut}
          </button>
        </form>
      </section>
    </main>
  );
}
