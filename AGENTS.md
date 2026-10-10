# Daily Log — working notes

A personal habit tracker for one user. Read DECISIONS.md before changing
anything non-obvious.

## Non-negotiables

- **No streak counter, and nothing streak-shaped.** No "best week", no "days
  since a zero", no personal records. The headline metric is a rolling 7-day
  average, because one zero barely moves an average and destroys a streak.
- **No arithmetic on the morning list.** No count, no "3 of 8", no percentage,
  no progress bar, no colour that changes with completion. A fraction is a
  grade, and grades are what this app exists to avoid.
- **A `days` row is created only by a deliberate action on the today screen** —
  toggling a mark, typing in the day line, or pressing "Log this day as 0".
  Never by navigating, rendering, or writing a task. Row existence *is* the
  record that a day was logged; there is no `touched` column.
- **Never derive a date from `toISOString()`.** It returns the wrong day west of
  UTC late in the evening. All date handling goes through `src/lib/date.ts`.
- **All user-facing copy lives in `src/lib/copy.ts`.** No inline strings in
  components. The wording is the product's mechanism, and inline strings drift.
- **Low scores are neutral.** Grey to green only. No red, no warnings, no guilt.

## Audience

The code is read by someone who knows Java and Python and is partway through
learning JavaScript. Prefer the boring idiomatic solution. When using a JS or
React idiom they may not have met — destructuring, optional chaining, `useEffect`
cleanup, closures in handlers — add a one-line comment naming the concept.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
