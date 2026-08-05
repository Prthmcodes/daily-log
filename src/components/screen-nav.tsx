"use client";

import Link from "next/link";

import { UI } from "@/lib/copy";
import type { DateKey } from "@/lib/date";
import { screenHref } from "@/lib/query-date";

type Props = {
  current: "today" | "list";
  selectedKey: DateKey;
  todayK: DateKey;
};

/**
 * Switching between the log and the morning list.
 *
 * Both links carry the day you are currently looking at, so moving between the
 * two screens never quietly puts you back on today. Today itself has no
 * parameter, which keeps the everyday URL clean.
 */
export function ScreenNav({ current, selectedKey, todayK }: Props) {
  const base =
    "min-h-11 inline-flex items-center px-1 text-[14px] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent";

  return (
    <nav className="mb-4 flex gap-4">
      <Link
        href={screenHref("/", selectedKey, todayK)}
        aria-current={current === "today" ? "page" : undefined}
        className={`${base} ${
          current === "today"
            ? "font-medium text-ink underline underline-offset-4"
            : "text-muted hover:text-ink"
        }`}
      >
        {UI.todayScreenLink}
      </Link>

      <Link
        href={screenHref("/list", selectedKey, todayK)}
        aria-current={current === "list" ? "page" : undefined}
        className={`${base} ${
          current === "list"
            ? "font-medium text-ink underline underline-offset-4"
            : "text-muted hover:text-ink"
        }`}
      >
        {UI.listScreenLink}
      </Link>
    </nav>
  );
}
