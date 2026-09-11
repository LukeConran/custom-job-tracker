-- Application Scout — Phase 1 schema
-- Apply in the Supabase SQL editor, or via the CLI:
--   supabase db push
-- Equivalent migration: supabase/migrations/20260911000000_init.sql

create table if not exists public.roles (
  id text primary key,
  source text not null,
  company text not null,
  title text not null,
  url text not null unique,
  category text,
  locations jsonb not null default '[]'::jsonb,
  skills jsonb not null default '[]'::jsonb,
  posted_at timestamptz,
  terms text,
  raw jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  fit_tag text,
  rank_score numeric
);

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  role_id text references public.roles (id) on delete set null,
  url text not null unique,
  company text,
  title text,
  status text not null check (
    status in ('applied', 'interviewing', 'oa', 'offer', 'rejected', 'skipped')
  ),
  notes text not null default '',
  applied_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists applications_role_id_idx on public.applications (role_id);
create index if not exists applications_status_idx on public.applications (status);
create index if not exists roles_rank_score_idx on public.roles (rank_score desc nulls last);
create index if not exists roles_last_seen_at_idx on public.roles (last_seen_at desc);

-- Personal prototype RLS:
-- All app reads/writes go through Next.js server routes using
-- SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS. Anon/authenticated
-- clients have no policies, so the tables are not publicly writable
-- even if NEXT_PUBLIC_SUPABASE_ANON_KEY is embedded in the browser.
--
-- To query from the Supabase dashboard table editor you are already
-- the project owner. Do not add "allow all" policies unless you
-- accept that anyone with the anon key can read/write your tracker.
alter table public.roles enable row level security;
alter table public.applications enable row level security;
