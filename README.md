# Daily Log

A personal habit tracker. Five daily marks scored 0–5, one or two lines on how
the day went, and a morning list of tasks.

One user. Next.js + Supabase, deployed on Vercel.

## Running it

```bash
npm install
npm run dev
```

`npm run check` runs lint, typecheck and tests.

Then open http://localhost:3000.

## Layout

```
src/
  app/        routes (Next.js App Router)
  lib/        pure logic — date keys, product copy, the Supabase client
```

## The one rule worth knowing before you change anything

There is no streak counter and there is no arithmetic on the morning list.
Both are deliberate. See DECISIONS.md.
