-- Mimo schema. Run once in Supabase → SQL Editor → New query → Run.
-- Safe to re-run: every statement is idempotent.

-- ---------------------------------------------------------------- profiles
-- One row per signed-in user (auth.users.id), mirroring the app's Profile.
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text        not null default '',
  email       text        not null default '',
  age         integer     not null default 21 check (age between 5 and 120),
  income_type text        not null default 'salary' check (income_type in ('salary', 'pocket', 'none')),
  income      numeric(14, 2) not null default 0 check (income >= 0),
  currency    text        not null default 'PKR' check (char_length(currency) = 3),
  -- How much the user wants to save each month; income minus this is what they can spend.
  savings_goal numeric(14, 2) not null default 0 check (savings_goal >= 0),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- For databases created before savings_goal was added.
alter table public.profiles
  add column if not exists savings_goal numeric(14, 2) not null default 0 check (savings_goal >= 0);

-- ---------------------------------------------------------------- expenses
create table if not exists public.expenses (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid        not null references auth.users (id) on delete cascade default auth.uid(),
  category       text        not null check (category in ('Food', 'Transport', 'Shopping', 'Bills')),
  amount         numeric(14, 2) not null check (amount >= 0),
  note           text        not null default '',
  raw_transcript text,
  spent_at       timestamptz not null default now(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- Monthly totals and the history list both filter by user and sort by date.
create index if not exists expenses_user_spent_at_idx on public.expenses (user_id, spent_at desc);

-- ------------------------------------------------------------------- goals
create table if not exists public.goals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users (id) on delete cascade default auth.uid(),
  title      text        not null check (char_length(title) between 1 and 80),
  saved      numeric(14, 2) not null default 0 check (saved >= 0),
  target     numeric(14, 2) not null check (target > 0),
  due        text        not null default 'No deadline',
  kind       text        not null default 'target' check (kind in ('phone', 'gift', 'shield', 'target')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists goals_user_idx on public.goals (user_id);

-- --------------------------------------------------------- updated_at upkeep
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

drop trigger if exists expenses_touch on public.expenses;
create trigger expenses_touch before update on public.expenses
  for each row execute function public.touch_updated_at();

drop trigger if exists goals_touch on public.goals;
create trigger goals_touch before update on public.goals
  for each row execute function public.touch_updated_at();


-- ----------------------------------------- create a profile on every sign-up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Only the trigger should call this, not the public API (/rest/v1/rpc).
revoke execute on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------- row level security (RLS)
-- Without these policies the public API key could read everyone's data. Each user can
-- only see and change their own rows.
alter table public.profiles enable row level security;
alter table public.expenses enable row level security;
alter table public.goals    enable row level security;

drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
  for all to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "own expenses" on public.expenses;
create policy "own expenses" on public.expenses
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "own goals" on public.goals;
create policy "own goals" on public.goals
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- --------------------------------------------------------------- delete account
-- Lets someone delete their own account from the app. Removing the auth.users row takes the
-- profile, expenses, goals and AI usage with it, because they all reference it on delete cascade.
create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'not signed in';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;

-- --------------------------------------------------------------- AI daily limit
-- One row per user per UTC day. Only consume_ai_quota touches it, so the read-receipt function
-- can stop one account from running up the Gemini bill. RLS on with no policies: no direct access.
create table if not exists public.ai_usage (
  user_id uuid    not null references auth.users (id) on delete cascade,
  day     date    not null,
  calls   integer not null default 0 check (calls >= 0),
  primary key (user_id, day)
);

alter table public.ai_usage enable row level security;
revoke all on public.ai_usage from anon, authenticated;

-- Counts one call for the signed-in user. Returns false once today's limit is reached.
create or replace function public.consume_ai_quota(daily_limit integer)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  used integer;
begin
  if auth.uid() is null then
    return false;
  end if;
  insert into public.ai_usage (user_id, day, calls)
  values (auth.uid(), (now() at time zone 'utc')::date, 1)
  on conflict (user_id, day) do update
    set calls = public.ai_usage.calls + 1
    where public.ai_usage.calls < daily_limit
  returning calls into used;
  return used is not null;
end;
$$;

revoke execute on function public.consume_ai_quota(integer) from public, anon;
grant execute on function public.consume_ai_quota(integer) to authenticated;
