-- Applied to the live project by hand on 2026-10-10 (Supabase SQL editor).
-- schema.sql is kept in step with this file by hand, as its header asks.
--
-- Three columns on `extras`, and none on `days`. That placement is the whole
-- safety argument — see the comment above the table in schema.sql.

alter table public.extras
  add column if not exists alone   boolean not null default false,
  add column if not exists let_go  boolean not null default false,
  add column if not exists hardest text    not null default '';
