"use client";

import { useEffect, useState } from "react";

import { AUTH, UI } from "@/lib/copy";
import { createClient } from "@/lib/supabase/client";

/**
 * Where the link in the sign-in email lands.
 *
 * This has to run in the browser, and that is the point. Supabase can finish a
 * sign-in in three different shapes:
 *
 *   ?code=...          the PKCE flow, which is what this app uses
 *   #access_token=...  the implicit flow, in the URL *fragment*
 *   ?token_hash=...    the recommended email template
 *
 * A fragment is never sent to the server — the browser strips everything after
 * the `#` before making the request — so a server route handler cannot see the
 * second case at all, and would conclude the link was empty.
 *
 * The important thing here is what this file does NOT do. The Supabase client
 * is configured with `detectSessionInUrl`, so simply creating it reads the URL
 * and exchanges the code by itself. Calling `exchangeCodeForSession` as well
 * makes two things race for the same single-use code: one wins, the other
 * destroys the verifier, and the sign-in silently produces no session at all.
 * That bug looked exactly like an expired link.
 */
export default function ConfirmPage() {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hash = new URLSearchParams(window.location.hash.slice(1));

    // Creating the client is what consumes the link.
    const supabase = createClient();

    /*
     * Listen before asking. If the exchange finishes after the check below,
     * this still catches it. `onAuthStateChange` also fires once on startup
     * with no session, which is why the session itself is tested rather than
     * the event name.
     */
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) window.location.replace("/");
    });

    async function finishSignIn() {
      // Supabase reports a dead link in the query string or the fragment
      // depending on the flow, so both are worth checking.
      if (params.get("error") || hash.get("error")) {
        setFailed(true);
        return;
      }

      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      // The one case the client does not handle on its own.
      if (tokenHash && type) {
        await supabase.auth.verifyOtp({
          type: type as "magiclink" | "signup" | "recovery" | "email",
          token_hash: tokenHash,
        });
      }

      // getSession waits for the client to finish reading the URL, so by the
      // time this returns the exchange has either worked or failed.
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // A full page load rather than a client-side route change, so the
        // request carries the newly written cookies and the server sees the
        // session it is about to be asked to trust.
        window.location.replace("/");
        return;
      }

      setFailed(true);
    }

    finishSignIn();

    // Effect cleanup: stop listening if this screen goes away, so the
    // subscription cannot outlive the component.
    return () => subscription.unsubscribe();
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col justify-center px-5 py-10">
      <h1 className="text-xl font-medium tracking-[-0.02em]">
        {UI.appTitle}
      </h1>

      {failed ? (
        <>
          <p className="mt-2 text-sm text-muted">{AUTH.linkExpired}</p>
          <a
            href="/sign-in"
            className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[var(--radius-control)] border-[0.5px] border-control bg-card px-4 text-base text-ink transition-colors duration-100 hover:bg-hover"
          >
            {AUTH.sendButton}
          </a>
        </>
      ) : (
        <p className="mt-2 text-sm text-muted">{AUTH.signingIn}</p>
      )}
    </main>
  );
}
