# Supabase settings that are not in the code

Two things live in the Supabase dashboard rather than in this repo, and both
will silently break sign-in if they are wrong. Project: **daily-log**
(`oqisbcdzykcmunflemho`, eu-west-2).

## 1. Email links only complete in the browser that asked for one

The emailed link uses PKCE, which needs a `code_verifier` cookie held by the
browser that requested it. Open the link somewhere else — a different browser,
or your phone after asking on your laptop — and it fails with "Email link is
invalid or has expired", which is misleading but is what Supabase returns.

**Two things were considered and are not available:**

- *Changing the email template to a `token_hash` link*, which would work
  anywhere. The dashboard refuses to edit templates without custom SMTP
  configured: "Set up custom SMTP to edit templates".
- *Switching the client to implicit flow.* `@supabase/ssr` hardcodes
  `flowType: "pkce"` after spreading your options, so it cannot be overridden.

**So sign-in uses a password instead**, set under Account once you are in.
Email links remain as the fallback and the way in on a new account. If the two
emails an hour ever becomes a nuisance, configuring SMTP removes the cap and
unlocks the templates at the same time.

## 2. URL configuration

**Authentication → URL Configuration.**

Supabase refuses to redirect anywhere that is not on this list, and
`{{ .RedirectTo }}` above is exactly such a redirect. If a link takes you
somewhere unexpected, this is why.

- **Site URL:** `https://daily-log-zeta-teal.vercel.app`
- **Redirect URLs:** add both, so links work from either.
  - `https://daily-log-zeta-teal.vercel.app/**`
  - `http://localhost:3000/**`

The domain is Vercel's own invention: `daily-log.vercel.app` was already taken
by an unrelated project, so it generated `daily-log-zeta-teal`. A custom domain
would replace it, and both settings above would need updating with it.

## 3. Things worth knowing

- **The built-in mailer allows about two emails an hour.** Asking for more
  returns a 429, which the sign-in screen now reports honestly rather than
  saying "try again in a moment". If this ever becomes a real nuisance,
  connect an SMTP provider under Authentication → Emails → SMTP Settings.
- **A magic link is single use.** Clicking the same one twice gives
  "Email link is invalid or has expired", which is correct and not a bug.
- **Free-tier projects pause after about a week with no traffic.** Daily use
  keeps it awake; a fortnight away means a slow first load.

## 4. Changing the schema

`supabase/migrations/` is the source of truth. The live project was set up by
hand, so it has no migration history of its own.

1. Add a new file in `supabase/migrations/` named `<UTC timestamp>_<what>.sql`,
   for example `20261101120000_add_something.sql`.
2. Paste it into the Supabase SQL editor and run it **once**.
3. Update `supabase/schema.sql` by hand to match.
4. Regenerate `src/lib/database.types.ts` with the command written in its
   header. Set `SUPABASE_ACCESS_TOKEN` in that one terminal session first, as
   described below; do not run `supabase login`.
5. If the change is non-obvious, add a line to `DECISIONS.md`.

**Never run `supabase db push` or `supabase link` against the live project.**
There is no migration history on it, so a push would try to re-create tables
that already exist.

`supabase gen types` is the only CLI command used here. It is read-only. Give
it a token through the `SUPABASE_ACCESS_TOKEN` environment variable for that
one terminal session, not through `supabase login`. The token reaches every
project on the account, so never put it in `.env.local`, a committed file or a
screenshot.
