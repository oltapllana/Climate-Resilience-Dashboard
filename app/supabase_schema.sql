-- Run this once in the Supabase dashboard: SQL Editor -> New query -> paste -> Run.
-- Creates the table that stores user-imported stations for the climate dashboard.

create table if not exists public.saved_stations (
  id          text primary key,           -- station id (e.g. "imported_myfile")
  name_en     text,
  name_sq     text,
  lat         double precision,
  lon         double precision,
  type        text,
  data        jsonb not null,             -- full station object incl. measurements
  created_at  timestamptz not null default now()
);

-- Row Level Security: required because the frontend uses the public anon key.
alter table public.saved_stations enable row level security;

-- Policies: EVERYONE can read (the dashboard is public), but ONLY the four
-- approved email addresses below can add / change / remove stations. The check
-- reads the signed-in user's email straight from their JWT, so it holds even if
-- project-level signups get re-enabled later.
--
-- Approved uploaders. Add or remove addresses in ALL THREE lists below to
-- change who can upload (keep them identical across insert/update/delete).
create policy "public read" on public.saved_stations
  for select using (true);

create policy "allowlist insert" on public.saved_stations
  for insert to authenticated
  with check (
    lower(auth.jwt() ->> 'email') in (
      'zana.guda@student.uni-pr.edu',
      'olta.pllana@student.uni-pr.edu'
    )
  );

create policy "allowlist update" on public.saved_stations
  for update to authenticated
  using (
    lower(auth.jwt() ->> 'email') in (
      'zana.guda@student.uni-pr.edu',
      'olta.pllana@student.uni-pr.edu'
    )
  );

create policy "allowlist delete" on public.saved_stations
  for delete to authenticated
  using (
    lower(auth.jwt() ->> 'email') in (
      'zana.guda@student.uni-pr.edu',
      'olta.pllana@student.uni-pr.edu'
    )
  );

-- ---------------------------------------------------------------------------
-- If you already ran the older version of this file, first drop the old
-- policies before creating these, e.g.:
--   drop policy if exists "authed insert" on public.saved_stations;
--   drop policy if exists "authed update" on public.saved_stations;
--   drop policy if exists "authed delete" on public.saved_stations;
--   drop policy if exists "public read"   on public.saved_stations;
-- ---------------------------------------------------------------------------
