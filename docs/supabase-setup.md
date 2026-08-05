# Supabase settings that are not in the code

Two things live in the Supabase dashboard rather than in this repo, and both
will silently break sign-in if they are wrong. Project: **daily-log**
(`oqisbcdzykcmunflemho`, eu-west-2).

## 1. Email templates — use `token_hash`, not the default link

**Why.** The default template sends a PKCE link. Completing a PKCE sign-in
needs a `code_verifier` cookie that only exists in the browser that *asked*
for the link, so the link fails if you open it anywhere else — a different
browser, or your phone after requesting it on your laptop. A `token_hash`
link carries everything it needs and works anywhere.

Go to **Authentication → Emails → Templates**.

### Magic Link

Used every time you sign in after the first.

```html
<h2>Sign in to Daily Log</h2>
<p><a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=magiclink">Sign in</a></p>
<p>If you did not ask for this, ignore it.</p>
```

### Confirm signup

Used only for the very first sign-in on a new account. Same thing with
`type=signup`.

```html
<h2>Sign in to Daily Log</h2>
<p><a href="{{ .RedirectTo }}?token_hash={{ .TokenHash }}&type=signup">Sign in</a></p>
```

`{{ .RedirectTo }}` is whatever the app asked for — which is
`<wherever it is running>/auth/confirm`. Using it rather than `{{ .SiteURL }}`
means the same template works from localhost and from the deployed site
without being edited again.

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
