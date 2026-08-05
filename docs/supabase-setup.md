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

- **Site URL:** `http://localhost:3000` during development; the deployed
  address once it is live.
- **Redirect URLs:** add both, so links work from either.
  - `http://localhost:3000/**`
  - `https://<the deployed domain>/**`

## 3. Things worth knowing

- **The built-in mailer allows about two emails an hour.** Asking for more
  returns a 429, which the sign-in screen now reports honestly rather than
  saying "try again in a moment". If this ever becomes a real nuisance,
  connect an SMTP provider under Authentication → Emails → SMTP Settings.
- **A magic link is single use.** Clicking the same one twice gives
  "Email link is invalid or has expired", which is correct and not a bug.
- **Free-tier projects pause after about a week with no traffic.** Daily use
  keeps it awake; a fortnight away means a slow first load.
