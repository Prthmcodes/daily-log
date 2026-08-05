# Decisions

Choices made during the build that aren't obvious from the code, and the
reasons for them. Newest at the bottom.

## Chunk 0 — Orientation

**Banner above the fold, protocol below it.** The reframe banner is visible on
load without scrolling. The five-rule protocol lives on the same page with no
tab, accordion or modal in front of it — but you do scroll to reach it. It runs
to about 250 words and cannot share a 390px fold with the marks and the score.

**Small text uses `--color-muted` (#6b6862), not `--color-faint` (#8a867e).**
Faint measures 3.6:1 against white, which fails WCAG AA for body text. Muted
measures 5.6:1 and passes. Faint is kept for large or decorative text only.

**"Days logged" is all-time, not windowed.** Carried over from the prototype,
which counted every logged day rather than only the last 30.

**`isLogged()` and the `touched` flag are deleted.** The prototype tracked
whether a day had been logged with a flag *and* a marks/note heuristic. In the
database version a day is logged if and only if a row exists in `days`. There
is no second predicate and no extra column.

**Unlogged is visually distinct from zero.** Score 0 renders `--color-score-0`
(#eeebe5). A day never opened renders `--color-unlogged` (#f5f3ef) with a
dashed border. If these ever look the same, a day you missed starts to read as
a day you failed.

**Supabase project region: eu-west-2 (London).**

## Chunk 1 — Skeleton

**Tailwind v4, so there is no `tailwind.config.ts`.** Design tokens are defined
in `src/app/globals.css` inside an `@theme` block, and Tailwind generates the
utility classes from them. A token called `--color-accent` gives you
`bg-accent`, `text-accent`, `border-accent`.

**The palette is closed.** Every colour the app uses is named in that `@theme`
block. The prototype had drifted to roughly fifteen unnamed shades; they are
all now tokens with names.

**No dark mode.** The Next.js starter ships a `prefers-color-scheme` block; it
was removed. Dark mode is explicitly out of scope.

**System sans-serif, not a web font.** The starter pulls Geist from Google
Fonts. Removed — it costs a network round trip on a phone for a look the spec
doesn't ask for.
