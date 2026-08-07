"use client";

import { useState } from "react";

import { MORNING_LIST } from "@/lib/copy";

type Props = {
  onAdd: (text: string) => void;
};

/**
 * Add one more thing, part way through the day.
 *
 * One line, one return key. A single text input inside a form submits on Enter
 * without any JavaScript being asked to, so this is one tap and one keystroke,
 * which is what it has to be for something used at three in the afternoon
 * while thinking about something else.
 */
export function AddTask({ onAdd }: Props) {
  const [text, setText] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = text.trim();
    if (trimmed.length === 0) return;

    onAdd(trimmed);
    // Empty the box so the next one can be typed straight away.
    setText("");
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3">
      <input
        type="text"
        value={text}
        onChange={(event) => setText(event.target.value)}
        aria-label={MORNING_LIST.addTaskPlaceholder}
        placeholder={MORNING_LIST.addTaskPlaceholder}
        className="min-h-11 w-full rounded-[var(--radius-control)] border-[0.5px] border-field-line bg-field px-3 text-base text-ink focus:outline-2 focus:outline-offset-[-1px] focus:outline-tag-line"
      />

      {/*
        Hidden from view but not from screen readers or the keyboard. The form
        already submits on Enter; this gives the input an explicit submit
        control, which is what assistive software expects to find.
      */}
      <button type="submit" className="sr-only">
        {MORNING_LIST.addTaskButton}
      </button>
    </form>
  );
}
