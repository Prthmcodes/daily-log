-- The Daily Log schema as it currently stands.
--
-- This is a record, not a migration chain. It was applied to the live project
-- in three steps; this file is the result, and running it against an empty
-- database would reproduce it exactly. Keep it in step by hand if the schema
-- changes — otherwise the database becomes the only copy of the design.

-- One row per logged day. Its existence IS the record that the day was logged.
-- There is deliberately no `touched` column: a row exists because the user did
-- something on the today screen, and nothing else creates one.
create table public.days (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,              -- the user's LOCAL date, never UTC
  shower      boolean not null default false,
  meal        boolean not null default false,
  work        boolean not null default false,
  wait        boolean not null default false,
  human       boolean not null default false,
  note        text    not null default '',
  score       int generated always as (
                shower::int + meal::int + work::int + wait::int + human::int
              ) stored,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, date)
);

-- The morning list. Deliberately a separate table with NO foreign key to days,
-- so that tasks can never be joined into a score or an average by accident.
create table public.tasks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  date        date not null,              -- same local-date key as days.date
  text        text not null,
  done        boolean not null default false,
  position    int not null,               -- order written, stable
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.days  enable row level security;
alter table public.tasks enable row level security;

-- `(select auth.uid())` rather than a bare `auth.uid()`: identical meaning,
-- but Postgres evaluates it once per query instead of once per row.
create policy "own rows" on public.days
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "own rows" on public.tasks
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index days_user_date_idx  on public.days  (user_id, date desc);
create index tasks_user_date_idx on public.tasks (user_id, date, position);

-- Keeps updated_at honest. SECURITY INVOKER, with EXECUTE revoked, because a
-- SECURITY DEFINER function in the public schema is also exposed as a callable
-- RPC endpoint to anyone at all.
create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public;
revoke execute on function public.set_updated_at() from anon;
revoke execute on function public.set_updated_at() from authenticated;

create trigger days_set_updated_at
  before update on public.days
  for each row execute function public.set_updated_at();

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

-- Things tracked alongside the day that are deliberately NOT part of the score.
--
-- A separate table, exactly like tasks, and for the same reason: if these were
-- columns on `days` then ticking "read a few pages" would create a days row,
-- which is what "this day was logged" means, and the day would count as a
-- logged zero and pull the averages down. Reading a book would make your score
-- worse. Keeping them apart makes that impossible rather than something to
-- remember not to do.
create table public.extras (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  date           date not null,             -- the user's LOCAL date, never UTC
  no_reels       boolean not null default false,
  read_something boolean not null default false,
  study_blocks   int not null default 0 check (study_blocks >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (user_id, date)
);

alter table public.extras enable row level security;

create policy "own rows" on public.extras
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create index extras_user_date_idx on public.extras (user_id, date desc);

create trigger extras_set_updated_at
  before update on public.extras
  for each row execute function public.set_updated_at();
