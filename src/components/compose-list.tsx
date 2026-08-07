"use client";

import { useState } from "react";

import { MORNING_LIST, UI } from "@/lib/copy";

type Props = {
  busy: boolean;
  onSubmit: (text: string) => void;
};

/**
 * The box you type the morning's list into.
 *
 * Deliberately one plain textarea and one button. No per-item fields, no
 * "add another" that grows the form, no drag handles — the whole thing has to
 * be writable in under a minute, half asleep, before the day has started.
 *
 * There is no microphone and no dictation button here, and there will not be
 * one. The phone keyboard already has a dictation key and it works in a plain
 * textarea for free.
 */
export function ComposeList({ busy, onSubmit }: Props) {
  const [text, setText] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    // Without this the browser reloads the page on submit and the text is
    // thrown away.
    event.preventDefault();
    onSubmit(text);
  }

  return (
    <form onSubmit={handleSubmit}>
      <p className="mb-3 text-sm text-muted">{MORNING_LIST.emptyState}</p>

      <textarea
        rows={5}
        value={text}
        onChange={(event) => setText(event.target.value)}
        aria-label={MORNING_LIST.composeLabel}
        placeholder={MORNING_LIST.composePlaceholder}
        className="w-full resize-none rounded-[var(--radius-control)] border-[0.5px] border-field-line bg-field px-3 py-[10px] text-base leading-[1.5] text-ink focus:outline-2 focus:outline-offset-[-1px] focus:outline-tag-line"
      />

      <button
        type="submit"
        disabled={busy || text.trim().length === 0}
        className="mt-3 min-h-11 w-full rounded-[var(--radius-control)] border-[0.5px] border-control bg-card px-4 text-base text-ink transition-colors duration-100 hover:bg-hover focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent disabled:opacity-40 disabled:hover:bg-card"
      >
        {MORNING_LIST.makeListButton}
      </button>

      {busy && (
        <p aria-live="polite" className="mt-2 text-2xs text-muted">
          {UI.loading}
        </p>
      )}
    </form>
  );
}
