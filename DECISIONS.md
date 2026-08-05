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

## Chunk 2 — Date logic

**Keys are parsed at midday, never midnight.** `fromDateKey` builds
`"2026-03-29T12:00:00"`. On a clocks-forward morning, midnight either does not
exist or shifts by an hour, and a date sitting on midnight can be dragged into
the previous day. Midday has twelve hours of clearance either side.

**`"YYYY-MM-DD"` is compared as a plain string.** The format is fixed-width,
zero-padded, and ordered largest unit first, so alphabetical order and
chronological order are the same order. `isAfter` therefore does no parsing and
touches no timezone.

**`isValidDateKey` round-trips the date rather than trusting the parser.**
JavaScript accepts `"2026-02-30"` and silently returns 2 March instead of
failing. Building the date and checking it still formats back to the same key
is the only reliable test. Verified in the suite.

**`formatDayLabel` pins the locale to en-GB.** Left to the browser it would
vary by machine and could not be tested. en-GB renders "Wednesday 5 August" —
no comma. That is the format, not an oversight.

**`vitest.config.mts`, not `.ts`.** Vite loads a `.ts` config as CommonJS and
warns on every run, because `package.json` has no `"type": "module"`. The
`.mts` extension marks it as ESM and the warning goes away. Adding
`"type": "module"` instead would have changed how Next.js reads its own config
files, which was not worth it.

## Chunk 3 — Copy

**The banner is stored as segments, not as HTML.** Two words in it are bold and
highlighted. Storing `"...does <b>not</b> end..."` would mean rendering it with
`dangerouslySetInnerHTML`, so instead it is an array of
`{ text, emphasis }` pieces the component maps over. A test joins them back
together and compares against the full sentence, because the spacing at the
segment boundaries is easy to break and impossible to spot by eye.

**Score labels are stored without their leading number.** The spec writes them
as "0 — Zero is data...", but the number is rendered separately beside the
score, so storing it in the string would print it twice.

**Copy is pinned by tests.** Unusual, and deliberate: the likeliest way this
wording breaks is a well-meaning tidy-up during an unrelated refactor. Two of
the tests enforce design rules directly — no string on the list screen may
contain a digit, a percent sign or the word "of" (rule 10), and nothing outside
the subtitle may say "streak", "record", "chain" or "days since" (rules 1
and 2).

**Screen furniture lives here too.** The brief's verbatim list covers 5.1–5.4,
5.6 and 5.7, but rule 5.5 says *no* inline strings, and headings and button
labels are strings the user reads. They are carried over from the prototype
into a separate `UI` block rather than invented.

## Chunk 4 — Database

**Supabase project `daily-log`, ref `oqisbcdzykcmunflemho`, eu-west-2, free tier.**

**Three deviations from the schema in the brief, all small, all flagged:**

1. *An `updated_at` trigger was added.* Both tables have an `updated_at` column
   defaulting to `now()`, but nothing was ever going to change it, so it would
   have sat permanently equal to `created_at`. A column that lies is worse than
   no column.
2. *The trigger function is `SECURITY INVOKER` with `EXECUTE` revoked.* The
   first version was `SECURITY DEFINER`, and Supabase's security linter
   immediately pointed out that this also publishes it as an RPC endpoint
   callable by anyone, signed in or not. It only stamps a column on the row
   being written, so it needs no elevated rights at all.
3. *Policies use `(select auth.uid())` rather than a bare `auth.uid()`.*
   Identical meaning; Postgres evaluates it once per query instead of once per
   row. Supabase's performance linter flags the bare form, and a permanently
   warning advisor page is a page nobody reads.

**Isolation was tested, not asserted.** Two real users were created in
`auth.users`, one wrote to both tables, and the other was then given a genuine
`authenticated` session and could see zero rows in either, could not update or
delete anything, and was refused outright when trying to insert a row owned by
the first. The same was checked anonymously and over the real HTTP API. The
whole thing was re-run after the policy rewrite, because rewriting a policy is
exactly how a table gets quietly opened up. Probe users were then deleted.

**The generated types file leaves out Supabase's generic helpers.** It emits
`Tables<>`, `TablesInsert<>` and friends — dense conditional types that nothing
here uses. `src/lib/supabase/types.ts` has plain aliases instead.

**`.env.example` is committed; `.env.local` is not.** The `.gitignore` rule
`.env*` was swallowing both, so there is now an explicit `!.env.example`.

## Chunk 5 — Auth

**`getUser()`, never `getSession()`.** `getSession()` reads the cookie and
believes it. `getUser()` re-checks the token with Supabase. The first is faster
and forgeable; on a page that decides whether you are allowed in, that trade is
the wrong way round.

**The middleware is the only place allowed to write auth cookies.** Next.js
throws if you set a cookie while rendering a page, so the server client
swallows that specific failure. That is the one empty `catch` in this project
and it carries a comment explaining why it is correct: the middleware has
already refreshed the session earlier in the same request.

**Route protection lives in middleware, not in each page.** A page that forgets
to check is a page that leaks. The middleware denies by default and names the
handful of public paths. `page.tsx` still re-checks and redirects — belt and
braces, and it lets the rest of the file assume a user exists.

**`/auth/confirm` accepts both link shapes.** Supabase sends either a
`token_hash` (from the recommended email template, works on any device) or a
`code` (from the default template, same browser only). Handling both means the
app does not silently depend on a dashboard setting being right. An expired or
already-used link redirects quietly back to sign-in rather than showing an
error screen — a dead link is a mildly annoying fact, not a failure.

**Sign-out is a POST.** Browsers and mail clients pre-fetch GET links, which
would sign you out without you touching anything. It redirects with 303 so the
browser follows up with a GET instead of repeating the POST.
