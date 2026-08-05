"use client";

import { useEffect, useState } from "react";

import { AUTH, UI } from "@/lib/copy";
import { createClient } from "@/lib/supabase/client";

/**
 * Where the link in the sign-in email lands.
 *
 * This has to be a client component, and that is the whole point. Supabase can
 * finish a sign-in in three different shapes depending on the email template
 * and the flow:
 *
 *   #access_token=...  in the URL *fragment* (the implicit flow)
 *   ?code=...          in the query string (the PKCE flow)
 *   ?token_hash=...    in the query string (the recommended template)
 *
 * A fragment is never sent to the server — browsers strip everything after the
 * `#` before making the request. So a server route handler is structurally
 * incapable of seeing the first case, and will conclude the link was empty
 * and bounce you back to sign-in even though the sign-in actually worked.
 *
 * Running in the browser means all three are visible. The Supabase client
 * handles the fragment itself on startup (`detectSessionInUrl` is on by
 * default); the two query-string cases are handled explicitly below.
 */
export default function ConfirmPage() {
  const [failed, setFailed] = useState(false);

  // useEffect runs after the component is on screen. The empty [] at the end
  // means "only once", not on every re-render.
  useEffect(() => {
    // Declared inside the effect because effects cannot themselves be async.
    async function finishSignIn() {
      const supabase = createClient();
      const params = new URLSearchParams(window.location.search);
      const hash = new URLSearchParams(window.location.hash.slice(1));

      // Supabase reports a dead link in the fragment too, so check it first.
      if (hash.get("error")) {
        setFailed(true);
        return;
      }

      const tokenHash = params.get("token_hash");
      const type = params.get("type");
      const code = params.get("code");

      if (tokenHash && type) {
        await supabase.auth.verifyOtp({
          type: type as "magiclink" | "signup" | "recovery" | "email",
          token_hash: tokenHash,
        });
      } else if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }
      // Nothing to do in the fragment case — creating the client above already
      // read the tokens out of the URL and stored the session.

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setFailed(true);
        return;
      }

      // A full page load rather than a client-side route change, so the
      // request carries the newly written cookies and the server sees the
      // session it is about to be asked to trust.
      window.location.replace("/");
    }

    finishSignIn();
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col justify-center px-5 py-10">
      <h1 className="text-[22px] font-semibold tracking-[-0.01em]">
        {UI.appTitle}
      </h1>

      {failed ? (
        <>
          <p className="mt-2 text-[13px] text-muted">{AUTH.linkExpired}</p>
          <a
            href="/sign-in"
            className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-control)] border border-control bg-card px-4 text-[14px] text-ink hover:bg-hover"
          >
            {AUTH.sendButton}
          </a>
        </>
      ) : (
        <p className="mt-2 text-[13px] text-muted">{AUTH.signingIn}</p>
      )}
    </main>
  );
}
