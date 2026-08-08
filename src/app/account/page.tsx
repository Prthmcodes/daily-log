import Link from "next/link";
import { redirect } from "next/navigation";

import { AccountForm } from "@/components/account-form";
import { ACCOUNT, UI } from "@/lib/copy";
import { createClient } from "@/lib/supabase/server";

/**
 * Account settings — currently just a password.
 *
 * Deliberately its own route rather than a section of the today screen. The
 * today log has a ninety-second budget and nothing that is done once belongs
 * on it.
 */
export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  return (
    <main className="mx-auto w-full max-w-[420px] px-5 py-6">
      <h1 className="font-serif text-2xl tracking-[-0.01em]">
        {UI.appTitle}
      </h1>
      <p className="mt-0.5 mb-[18px] text-sm text-muted">{ACCOUNT.heading}</p>

      <section className="rounded-[var(--radius-card)] border-[0.5px] border-line bg-card px-4 py-[18px]">
        <p className="mb-4 text-sm text-muted">
          {ACCOUNT.signedInAs} {user.email}
        </p>

        <AccountForm />
      </section>

      <div className="mt-6 flex items-center gap-4">
        <Link
          href="/"
          className="inline-flex min-h-11 items-center text-sm text-muted hover:text-ink"
        >
          {ACCOUNT.backLink}
        </Link>

        <form action="/auth/sign-out" method="post">
          <button
            type="submit"
            className="min-h-11 rounded-[var(--radius-control)] border-[0.5px] border-control bg-card px-4 text-sm text-muted transition-colors duration-100 hover:bg-hover"
          >
            {UI.signOut}
          </button>
        </form>
      </div>
    </main>
  );
}
