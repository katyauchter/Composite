-- Composite: core schema.
-- Every row belongs to one user and is protected by row-level security,
-- so a user can only ever read or write their own data.


-- Where a record came from. New sources (e.g. Lose It, MyFitnessPal) get added here.
create type public.data_source as enum ('manual', 'screenshot', 'csv', 'apple_health', 'integration');

-- Profile -----------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  timezone text not null default 'UTC',
  -- Daily targets set by the user or their coach
  target_calories integer,
  target_protein_g numeric(6,1),
  target_carbs_g numeric(6,1),
  target_fat_g numeric(6,1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Nutrition: one row per logged entry (a meal, a whole-day total, a CSV row...)
create table public.nutrition_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null,
  source public.data_source not null default 'manual',
  label text,                         -- e.g. "Breakfast" or "Daily total"
  calories numeric(7,1),
  protein_g numeric(6,1),
  carbs_g numeric(6,1),
  fat_g numeric(6,1),
  extra jsonb not null default '{}',  -- source-specific details, e.g. parser confidence
  screenshot_id uuid,                 -- set when parsed from a screenshot
  external_id text,                   -- id in the source system, for de-duplication
  created_at timestamptz not null default now(),
  unique (user_id, source, external_id)
);
create index nutrition_entries_user_day on public.nutrition_entries (user_id, day);

-- Body metrics: weight, body fat %, lean mass, BMI, etc. One row per measurement.
create table public.body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  metric text not null check (metric in ('weight_kg', 'body_fat_pct', 'lean_mass_kg', 'bmi', 'waist_cm')),
  value numeric(8,3) not null,
  measured_at timestamptz not null,
  source public.data_source not null default 'manual',
  external_id text,                   -- HealthKit sample UUID
  created_at timestamptz not null default now(),
  unique (user_id, source, external_id)
);
create index body_metrics_user_metric_time on public.body_metrics (user_id, metric, measured_at desc);

-- Workouts ------------------------------------------------------------------
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  activity_type text not null,        -- e.g. "running", "traditionalStrengthTraining"
  started_at timestamptz not null,
  ended_at timestamptz not null,
  duration_min numeric(7,1),
  energy_kcal numeric(7,1),
  distance_m numeric(9,1),
  avg_heart_rate numeric(5,1),
  source public.data_source not null default 'apple_health',
  external_id text,
  created_at timestamptz not null default now(),
  unique (user_id, source, external_id)
);
create index workouts_user_time on public.workouts (user_id, started_at desc);

-- Daily activity totals from Apple Health (steps, active energy)
create table public.daily_activity (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null,
  steps integer,
  active_energy_kcal numeric(7,1),
  source public.data_source not null default 'apple_health',
  updated_at timestamptz not null default now(),
  primary key (user_id, day, source)
);

-- Screenshots uploaded for parsing --------------------------------------------
create table public.screenshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null,
  storage_path text not null,         -- path in the "screenshots" storage bucket
  status text not null default 'pending' check (status in ('pending', 'parsed', 'failed')),
  parsed jsonb,
  error text,
  created_at timestamptz not null default now()
);

alter table public.nutrition_entries
  add constraint nutrition_entries_screenshot_fk
  foreign key (screenshot_id) references public.screenshots (id) on delete set null;

-- Daily summary: nutrition totals + activity for each day ----------------------
create view public.daily_summary with (security_invoker = true) as
with n as (
  select user_id, day,
    sum(calories) as calories, sum(protein_g) as protein_g,
    sum(carbs_g) as carbs_g, sum(fat_g) as fat_g
  from public.nutrition_entries group by user_id, day
), a as (
  select user_id, day,
    max(steps) as steps, max(active_energy_kcal) as active_energy_kcal
  from public.daily_activity group by user_id, day
)
select
  coalesce(n.user_id, a.user_id) as user_id,
  coalesce(n.day, a.day) as day,
  n.calories, n.protein_g, n.carbs_g, n.fat_g,
  a.steps, a.active_energy_kcal
from n full join a on a.user_id = n.user_id and a.day = n.day;

-- Row-level security ------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.nutrition_entries enable row level security;
alter table public.body_metrics enable row level security;
alter table public.workouts enable row level security;
alter table public.daily_activity enable row level security;
alter table public.screenshots enable row level security;

create policy "own profile" on public.profiles
  for all using (id = auth.uid()) with check (id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['nutrition_entries', 'body_metrics', 'workouts', 'daily_activity', 'screenshots'] loop
    execute format(
      'create policy "own rows" on public.%I for all using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

-- Create a profile automatically when someone signs up
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Private storage bucket for screenshots; each user only sees their own folder (<user_id>/...)
insert into storage.buckets (id, name, public) values ('screenshots', 'screenshots', false)
  on conflict (id) do nothing;

create policy "own screenshots" on storage.objects
  for all using (bucket_id = 'screenshots' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'screenshots' and (storage.foldername(name))[1] = auth.uid()::text);
