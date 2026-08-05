"use client";

import { useState } from "react";

import { AUTH, UI } from "@/lib/copy";
import { createClient } from "@/lib/supabase/client";

/**
 * "use client" at the top of the file marks this as a component that runs in
 * the browser. It has to, because it holds state and responds to typing —
 * things that only exist once a page is live in front of someone.
 */

/** What the form is currently doing. Clearer than three separate booleans. */
type Status = "idle" | "sending" | "sent" | "failed";

export default function SignInPage() {
  // useState gives you a value and a function to change it. Calling the
  // setter re-renders the component with the new value.
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Without this the browser reloads the page on submit, the old-fashioned
    // way, and everything above is thrown away.
    event.preventDefault();
    setStatus("sending");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // Where the link in the email should land. `window.location.origin`
        // is whichever host this is running on, so it works unchanged on
        // localhost and on the deployed site.
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    setStatus(error ? "failed" : "sent");
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-[420px] flex-col justify-center px-5 py-10">
      <h1 className="text-[22px] font-semibold tracking-[-0.01em]">
        {UI.appTitle}
      </h1>
      <p className="mt-1 mb-6 text-[13px] text-muted">{AUTH.intro}</p>

      <form onSubmit={handleSubmit}>
        <label htmlFor="email" className="block text-[13px] text-muted">
          {AUTH.emailLabel}
        </label>

        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          // Every keystroke sets state, which re-renders with the new value.
          // React calls this a "controlled input": the state is the truth,
          // and the box on screen just displays it.
          onChange={(event) => setEmail(event.target.value)}
          className="mt-1 min-h-[44px] w-full rounded-[var(--radius-control)] border border-field-line bg-field px-3 text-[15px] text-ink focus:outline-2 focus:outline-offset-[-1px] focus:outline-tag-line"
        />

        <button
          type="submit"
          disabled={status === "sending"}
          className="mt-3 min-h-[44px] w-full rounded-[var(--radius-control)] border border-control bg-card px-3 text-[14px] text-ink hover:bg-hover disabled:opacity-40"
        >
          {status === "sending" ? AUTH.sendingButton : AUTH.sendButton}
        </button>
      </form>

      {/*
        `&&` renders the right-hand side only when the left is true. It is the
        usual way to show something conditionally in JSX.
      */}
      {status === "sent" && (
        <p className="mt-4 text-[13px] text-muted">{AUTH.sent}</p>
      )}

      {status === "failed" && (
        <p className="mt-4 text-[13px] text-muted">{AUTH.failed}</p>
      )}
    </main>
  );
}
