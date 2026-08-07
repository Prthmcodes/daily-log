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

### Chunk 5 fix — the sign-in link landed on a server route it could not read

The first version of `/auth/confirm` was a server route handler. Supabase was
completing sign-in through the implicit flow, which returns the tokens in the
URL *fragment* — `#access_token=...` — and a fragment is never sent to the
server. The route therefore saw an empty request, concluded the link was dead,
and redirected to sign-in, discarding a session that had in fact been created.
The auth log showed `"action":"login","login_method":"implicit"` at the exact
moment the app claimed the link had failed.

It is now a **client** page, because only the browser can see all three shapes
a Supabase sign-in can arrive in: a fragment, `?code=`, or `?token_hash=`.

Two related fixes went in at the same time. A 429 from the email rate limit now
says so, instead of "try again in a moment" — which was wrong by about an hour
and encouraged pressing the button again, making it worse. And a dead link now
reports itself on `/auth/confirm`, where the link actually lands, rather than
silently bouncing to a sign-in page that looks untouched.

## Chunk 6 — Marks

**The today screen decides its own date, in the browser.** `page.tsx` runs on
the server and does only what the server can safely do: establish who you are.
It deliberately does *not* fetch the day, because choosing which day means
knowing what time it is where you are, and the server does not — on Vercel it
thinks it is in UTC. At 23:30 in the UK in summer that is already tomorrow, so
a server-computed date would file an evening's marks under the wrong day
roughly every night for half the year. The cost is a brief "Loading" while the
browser works out the date and fetches the row; that seemed a better trade than
being wrong after 11pm.

**`fetchDay` is a select and nothing else.** Opening the app, re-rendering, or
looking at a different day cannot create a `days` row. The only function that
writes one is `saveMarks`, and the only thing that calls it is a tap on a
toggle. Proved over HTTP: five consecutive reads of an unlogged day left the
table empty.

**The upsert names only the columns it sets,** so writing marks leaves an
existing `note` alone. Also proved rather than assumed.

**`scoreOf` duplicates a calculation the database already does.** The generated
column is the copy that counts; this one exists so the number on screen can
change the instant you tap. A test checks the two agree for all 32 possible
combinations, because a disagreement would put a different number on the screen
than in the averages.

**Marks are `<button role="switch">`, not styled divs.** The prototype used
divs with click handlers, which cannot be reached from a keyboard and announce
nothing to a screen reader.

**`middleware.ts` became `proxy.ts`.** Next.js 16 renamed the convention and
warned about it on every start. Renamed rather than left to break later.

## Chunk 7 — The day line

**A ref holds the last saved text, and it is what stops the app logging days
by itself.** The autosave effect runs whenever the text changes, and the first
render counts as a change. If it saved unconditionally, opening the app would
write a row and mark the day as logged — the exact thing 6.3 forbids. Starting
`lastSaved` equal to the text that came out of the database means there is
nothing to save until you type something different. It is the first line of the
effect for a reason.

**Effect cleanup is what makes the debounce a debounce.** Each keystroke
schedules a save in 500ms and cancels the one scheduled by the previous
keystroke. Typing twenty characters therefore sends one request, half a second
after you stop, rather than twenty.

**The box has a minimum height as well as a maximum.** The grow-to-fit effect
measures the content, and an empty textarea measures one line — so without a
floor it opened as a single-line box that looked like a search field. Both
figures are derived, not guessed: 13.5px at 1.55 line height is 20.93px a line,
so two lines plus padding and borders is 61.85px and four is 103.70px.

**Typing then deleting everything still leaves a logged day.** The first
debounce fires while there is text, which creates the row; clearing the text
afterwards saves an empty note but the row remains. That is correct — you did
deliberately write something — and it is the same outcome as pressing "Log this
day as 0".

## Chunk 8 — Metrics and zero

**An average over logged days only, and null when there are none.** Not zero —
"nothing to average yet" and "averaged zero" are different things and only one
of them is a score. `formatAverage` turns null into the en dash and a real zero
into "0.0", so the two can never look alike.

**"Log this day as 0" writes a row with five false marks. That is all it is.**
There is no `logged_zero` column and no separate state, because a deliberately
zeroed day and a day you ticked nothing on are the same thing. The only
difference between either of those and a day you never opened is whether the
row exists. The button hides once a row exists, since there is then nothing
left for it to do.

**The metrics refetch after a write rather than being updated in place.** It
costs one extra round trip roughly half a second after you tap, and it removes
a whole class of bug where the local copy of the numbers drifts from the
database. The tap itself stays optimistic, which is the part you actually
watch.

**A failed metrics refresh says so instead of being swallowed.** The write it
follows has already succeeded, so reverting would be wrong and an error would
be misleading. It shows "Numbers may be out of date." and leaves the old
figures on screen.

**Writing a note refreshes the metrics too.** A note on an untouched day
creates the row, which makes it a logged day scoring zero — so it changes the
averages, and the panel has to hear about it. `DayLine` reports upwards through
an `onSaved` callback.

## Chunk 9 — Grid and navigation

**Score classes are written out in full, never built at runtime.** Tailwind
reads the source as plain text to decide which CSS to generate, so
`bg-score-${score}` would produce no styles at all and the grid would render
thirty transparent squares. The array of literal names in `day-grid.tsx` looks
redundant and is not. Verified by grepping the built stylesheet for all six.

**Ten columns on a phone, fifteen on anything wider.** Fifteen columns inside a
390px screen works out at 18px cells, which is not something you can hit with a
thumb. Ten gives about 31px. That is still short of the 44px in 6.5 — a
thirty-day heatmap cannot be built from 44px targets on a phone without
becoming a page in itself — so the grid is treated as the glanceable view and
the prev/next arrows are the navigation that meets the size rule. Every cell
carries an aria-label reading, for example, "Wednesday 5 August — 3/5".

**The grid and the averages stay anchored to today; only the editing does not.**
Walking back to last Tuesday changes which day the marks and the day line
belong to, and nothing else. "Last 30 days" would be a strange thing to
recalculate as you browsed.

**`key={selectedKey}` on the day line.** The textarea reads its starting text
once, when it is created. Without a changing key React would keep the same
component alive as you moved between days and you would be typing Tuesday's
note into Wednesday's box.

**Moving to another day clears the marks and refuses taps until it loads.**
Leaving the previous day's ticks on screen would mean a fast tap wrote them
onto the wrong day.

**The state moved into a `useToday` hook.** The screen component had reached
270 lines. It is now 89 and contains only layout, while every rule about when a
row may be written lives in one file that can be read end to end.

## Chunk 10 — Banner and protocol

**Both are server components.** Neither ever changes, so neither carries a
"use client" line, and both are in the HTML before any JavaScript loads. The
most important sentence in the app should not be waiting on a network request.

**The banner sits above the marks; the protocol sits below the grid.** Per the
Chunk 0 ruling. The banner has to be *seen* on opening — it is what stops a
slip before noon turning into a written-off day. The protocol has to be
*there*, reachable without opening anything, but it runs to roughly 250 words
and a screen that makes you read 250 words before ticking a box is a screen you
stop opening.

**Height budget for the banner, calculated rather than eyeballed.** At a 390px
viewport the banner has 314px of content width; at 14px system sans that is
43–46 characters a line, so the sentence wraps to four lines whichever
character-width estimate is used, giving a 115px banner whose bottom edge sits
225px down the page. The smallest phone worth worrying about leaves about 560px
of usable height, so it clears the fold with room to spare. Not a substitute
for looking at it on the actual phone, which is Chunk 14.

**No disclosure widget exists anywhere in the codebase.** Checked rather than
asserted: zero occurrences of `<details>`, `<summary>`, `aria-expanded`,
`role="tab"`, `role="dialog"` or "Modal" across all of src.

## Chunk 11 — Morning list: composing

**`tasks.ts` imports nothing from `days.ts` or `metrics.ts`, and never will.**
The separation is structural rather than a matter of discipline: the list
screen has no route to a score, so no future refactor can quietly make ticking
a box worth something. There is no count function in that file and there is not
going to be one.

**Windows line endings are handled by the trim, not by a second split.**
Splitting on "\n" leaves a carriage return at the end of every line — invisible
in the text, visible in the layout. Trimming each line removes it. He is typing
this on Windows, so it would have happened on the first real use.

**"Make list" is disabled while the box is empty or only whitespace,** so it
cannot produce a list of nothing. Blank lines within the text are dropped
rather than becoming empty tasks, since typing a blank line to space things out
is normal.

**The list page carries none of the today screen's furniture.** No banner, no
protocol, no numbers, no grid. Putting any of them there would start to imply
the list feeds into them.

**Rule 10, checked mechanically rather than remembered.** No `.length` is
rendered anywhere on the list screen, there is no percent sign, no `<progress>`,
no `toFixed`, no rounding, and no import of anything that can produce a score.
`tasks.length === 0` is used to decide between the compose box and the list,
which is a branch, not a number on screen.

## Chunk 12 — Morning list: ticking

**The tick is muted grey, not green.** Spec 6.6 rules out a green tick on the
list explicitly, and the first version of the row had one. Green would make
finishing a task an achievement, and the moment a tick is worth something an
untick starts being worth something too. The daily marks on the today screen
keep their green; the list does not get it.

**The selected day lives in `?date=`, and both screens read it.** That is what
makes the link between them arrive on the day you were already on. Today has no
parameter at all, so the everyday URL stays clean. The address bar is also a
way into the future, so `parseDateParam` refuses anything later than today, as
well as anything that is not a real calendar day — and it falls back to today
rather than showing an error, because a mistyped URL is not an emergency.

**`history.replaceState` rather than the router.** Changing the URL through
Next's router would ask the server to re-render on every tap of an arrow.
This keeps stepping through days instant while leaving a URL that is correct if
you refresh or follow the link across.

**Moving day fetches in the handler, not in an effect watching the date.** An
effect would also fire on mount and load the same day twice.

**Delete leaves a gap in the position numbering, and that is fine.** `position`
decides order, it is not a count of anything. `nextPosition` takes one past the
highest in use, so something added at three in the afternoon lands at the
bottom even after deletions.

**Editing a task's text is not supported.** Delete it and type it again.
Retyping is a fresh decision, which is the same reason yesterday's unticked
tasks do not carry over.

**Rule 10 re-checked mechanically across all seven list files:** no count
rendered, no percent sign, no `<progress>`, no rounding, no import of anything
that can produce a score, and no colour anywhere that responds to how much is
done.

### Chunk 12 fix — the sign-in raced itself for the one-time code

Symptom: Supabase logged `action: login` on `/verify`, and yet
`auth.sessions` was empty, `last_sign_in_at` was null, and there was no
`/token` exchange anywhere in the log. The app looked as though every link had
expired.

Cause: `@supabase/ssr`'s `createBrowserClient` sets `flowType: "pkce"` and
`detectSessionInUrl: true`, and `_initialize()` therefore reads the URL and
exchanges the code **by itself**. The confirm page was calling
`exchangeCodeForSession` as well. Two consumers, one single-use code and one
single-use verifier: whichever got there first destroyed it for the other, and
neither reliably produced a session.

The manual exchange is gone. The client is left to do it, `verifyOtp` is kept
only for the `token_hash` shape which the client does not handle, and an
`onAuthStateChange` subscription catches the case where the exchange completes
after the initial check. The subscription is unsubscribed in the effect
cleanup.

Also: the error is now read from the query string as well as the fragment.
Supabase puts it in either depending on the flow, and the observed failure had
it in the query string.

### Sign-in uses `token_hash` links, not PKCE codes

PKCE completes only in the browser that requested the link, because the
`code_verifier` is held in a cookie there. That fails for the ordinary case of
asking for a link on a laptop and opening it on a phone — and it failed here
against VS Code's built-in browser versus Chrome. The database showed it
plainly: five `auth.flow_state` rows with `code_challenge_method: s256`, codes
issued, and zero sessions.

The email templates now send `?token_hash=...&type=...`, which carries
everything the exchange needs and works in any browser on any device. The
confirm page already handled that shape. `{{ .RedirectTo }}` is used rather
than `{{ .SiteURL }}` so the same template serves localhost and production.

Written down in docs/supabase-setup.md, because it is a dashboard setting that
nothing in this repository can enforce or even notice if it changes.

### Password sign-in added; magic links kept as the fallback

The brief specified magic links only. That turned out to be a poor everyday
mechanism here, for two reasons that only appeared on contact with the real
service:

- The free mailer allows about **two emails an hour**, and a failed sign-in
  attempt costs one.
- A magic link completes **only in the browser that asked for it**, because
  PKCE keeps the verifier in a cookie there. Requesting on a laptop and opening
  on a phone cannot work.

Both fixes were investigated and neither was available. Editing the email
template to a `token_hash` link requires custom SMTP — the dashboard says so
plainly. Switching to implicit flow is impossible because `@supabase/ssr` sets
`flowType: "pkce"` *after* spreading the caller's options, so it cannot be
overridden.

So the sign-in screen now takes a password, with "Email me a link instead"
kept underneath — the link is still the only way in on a brand-new account, and
the fallback on a device where the password is not to hand. A password is set
under **Account**, which is reachable only when already signed in, so it is a
change of credentials rather than a way to obtain one.

Verified against the live service: sign in with a password (200), wrong
password (400 `invalid_credentials`), `updateUser({ password })` (200), sign in
with the new one (200), old one refused (400), and a three-character password
rejected upstream (422 `weak_password`) — so the form's eight-character rule is
stricter than the server's, not a substitute for it.

## Chunk 13 — Deploy

**Live at https://daily-log-zeta-teal.vercel.app.** Vercel generated that name
because `daily-log.vercel.app` already belongs to an unrelated project.

**Imported from GitHub rather than uploaded.** The Vercel connector available
here can push a file tree directly, but it has no way to set environment
variables — and this app deliberately refuses to build without them, since
`src/lib/supabase/client.ts` throws at import time if either is missing. Going
through the dashboard also links the repository, so every push to `main` now
deploys itself.

**Verified rather than assumed.** The two environment variables were confirmed
present in the production JavaScript bundle by fetching every chunk the page
references and searching for the project URL and the publishable key — a build
can succeed while pointing at the wrong project, and the app would then look
perfectly fine and talk to nothing. Route protection was checked against the
live site: `/`, `/list` and `/account` all return 307 to `/sign-in` when signed
out, and `/auth/confirm` returns 200 because it has to be reachable to complete
a sign-in.

## Chunk 15 — Also today (added after v1)

Three things asked for after the build: reels watched, book read, and a count
of 25-minute study blocks. Three conflicts were raised before building, and all
three were settled deliberately.

**A count of reels watched would have been a lapse counter.** Every measurement
in this app is phrased as the presence of something good — "Shower was silent",
not "times I caved" — so that a bad day produces a low number rather than a
high one. A reel count climbs when the day goes badly, which is the shape of
the thing that made every previous system collapse. It is a tick instead: "No
reels or shorts".

**The study count climbs with the thing you wanted, so a plain number is safe.**
It is shown for today only. No average, no history, not in the grid, nothing to
beat. The moment it sits beside yesterday's it becomes a record, and rule 2
rules out records.

**They are not part of the score, and they are in their own table.** Adding
columns to `days` would have meant that ticking "read a few pages" created a
`days` row — which is the definition of a logged day — so the day would count
as a logged zero and drag the averages down. Reading a book would have made
your score worse. Proved rather than assumed: ticking both marks and logging
six study blocks left `days` empty and the 7-day average at "–", and logging
the day afterwards still scored exactly 3.

**`study_blocks` has a CHECK constraint as well as a guard in the code.** The
client can never show a number the database would refuse; the database refuses
it anyway (23514) if anything ever bypasses the client.

**MarkToggle now takes a label and a helper instead of a Mark.** It was typed
to the five habit keys, which no longer covers everything it renders.

## Chunk 14 — Verification pass

Everything in the brief's list that can be checked without holding the phone,
run against the live database with two real users.

```
 1. 23:59 local resolves to the local day, not UTC           PASS
      London: local 2026-08-05 / UTC 2026-08-05
      New_York: local 2026-08-05 / UTC 2026-08-06
      Auckland: local 2026-08-05 / UTC 2026-08-05
 2. days, tasks and extras all store the same local key      PASS
 3. unlogged day excluded (avg 3.7) vs deliberate zero (2.8)  PASS
 4. a day with tasks + extras but no marks is still unlogged  PASS
 5. tomorrow refused by the date guard and the URL guard      PASS
 6. the link between screens carries the day, not a reset     PASS
 7. the other user sees days:0 tasks:0 extras:0               PASS
 8. writing another user's rows refused on all three (403x3)  PASS
 9. signed out sees days:0 tasks:0 extras:0                   PASS
```

Line 1 is the point of the whole date module: at 23:59 in New York the UTC date
is already the next day, and the app is not.

**Section 4, audited against the source with comments stripped.** Nothing
streak-shaped, no red or amber, no gamification or notifications, no microphone
or audio, `toISOString` never called, no disclosure widget, no percentage or
rounding anywhere on the list, and the list still cannot import anything that
produces a score. The only two matches for "streak" in shipped code are the
subtitle and the page description, both of which promise its absence.

**Rule 6.3, audited by call graph rather than by memory.** Exactly three call
sites can create a `days` row, and they are the three deliberate actions the
brief allows: `saveNote` from typing in the day line, `saveMarks` from toggling
a mark, and `saveMarks(NO_MARKS)` from "Log this day as 0". Nothing else in the
codebase writes to that table.

Both Supabase advisor pages return empty for performance; security shows only
the leaked-password check, which is a dashboard toggle and appeared because the
app now accepts passwords.

**Not verifiable from here, and left to a real device:** the two ritual timings.

## Visual refinement

The palette did not change. Every colour is still one of the 6.6 tokens or a
shade carried over from the prototype, and no design rule moved. What changed
is craft.

**A named type scale replaced nine arbitrary sizes.** The app was using 11.5,
12.5, 13, 13.5, 15, 16, 22, 25 and 30px, most inherited from the prototype and
none related to each other. `globals.css` now defines eight steps — 11, 12, 13,
15, 17, 20, 28, 40 — as Tailwind text sizes, so a new component picks a step
instead of inventing a number. No `text-[13.5px]` survives anywhere.

**Weights are 400 and 500 only.** The prototype used 550 and 650, which are not
real weights in most system fonts and get synthesised inconsistently.

**Hairlines at 0.5px, radii at 14px cards and 10px controls.** At 1px every
card read as a box; at 0.5px they read as paper, which is the stated aim.

**The score is the largest thing on the screen** at 40px, on its own line with
the label beside it. At 30px, wedged between a `/5` and a button, the number the
app exists to produce looked like a footnote on itself.

**"Log this day as 0" moved below the score row.** In the row it competed with
the score label for the same horizontal space and won, on a screen where the
label is the part doing the work.

**The grid legend is gone and the grid is ten columns.** The `0 ▪▪▪▪▪▪ 5` strip
explained a ramp that explains itself and was the busiest thing on a quiet
screen. Ten columns also lifts the cells from 18px to about 31px, which was the
touch-target problem flagged in Chunk 9.

**The extras stepper is one grouped control** rather than three loose elements,
and its ticks are grey rather than green — `MarkToggle` gained a `tone` prop for
exactly that, since spec 6.6 rules out a green tick on anything unscored.

**Transitions are 100ms colour fades on hover only.** Not celebratory, nothing
moves, and the existing `prefers-reduced-motion` block still overrides them.
