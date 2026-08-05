"use client";

import { useState } from "react";

import { ACCOUNT } from "@/lib/copy";
import { createClient } from "@/lib/supabase/client";

/** Supabase's own minimum is six; eight is a small, free improvement. */
const MIN_LENGTH = 8;

type Status = "idle" | "saving" | "saved" | "tooShort" | "failed";

const MESSAGES: Partial<Record<Status, string>> = {
  saved: ACCOUNT.saved,
  tooShort: ACCOUNT.tooShort,
  failed: ACCOUNT.failed,
};

/**
 * Set a password for this account.
 *
 * Only reachable when already signed in, which is what makes it safe: proving
 * who you are has already happened, so this is a change of credentials rather
 * than a way to obtain one.
 */
export function AccountForm() {
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < MIN_LENGTH) {
      setStatus("tooShort");
      return;
    }

    setStatus("saving");

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setStatus("failed");
      return;
    }

    setStatus("saved");
    // Do not leave it sitting in the box afterwards.
    setPassword("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <label htmlFor="password" className="block text-[13px] text-muted">
        {ACCOUNT.passwordLabel}
      </label>

      <input
        id="password"
        type="password"
        autoComplete="new-password"
        value={password}
        onChange={(event) => {
          setPassword(event.target.value);
          // Clear the previous message as soon as it stops being true.
          setStatus("idle");
        }}
        className="mt-1 min-h-11 w-full rounded-[var(--radius-control)] border border-field-line bg-field px-3 text-[15px] text-ink focus:outline-2 focus:outline-offset-[-1px] focus:outline-tag-line"
      />

      <p className="mt-2 text-[11.5px] text-muted">{ACCOUNT.passwordHint}</p>

      <button
        type="submit"
        disabled={status === "saving" || password.length === 0}
        className="mt-3 min-h-11 rounded-[var(--radius-control)] border border-control bg-card px-4 text-[14px] text-ink hover:bg-hover disabled:opacity-40 disabled:hover:bg-card"
      >
        {status === "saving" ? ACCOUNT.saving : ACCOUNT.saveButton}
      </button>

      {MESSAGES[status] && (
        <p aria-live="polite" className="mt-3 text-[13px] text-muted">
          {MESSAGES[status]}
        </p>
      )}
    </form>
  );
}
