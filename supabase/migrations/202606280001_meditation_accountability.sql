create extension if not exists pgcrypto;

create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  start_date date not null,
  status text not null default 'upcoming' check (status in ('active', 'completed', 'upcoming')),
  created_at timestamptz not null default now()
);

create table if not exists public.members (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null,
  timezone text not null,
  cohort_id uuid references public.cohorts(id) on delete set null,
  role text not null default 'member' check (role in ('member', 'admin')),
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.buddy_pairs (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  member_a_id uuid references public.members(id) on delete cascade,
  member_b_id uuid references public.members(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.buddy_pair_members (
  pair_id uuid not null references public.buddy_pairs(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (pair_id, member_id)
);

create table if not exists public.daily_content (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  week_number integer not null check (week_number between 1 and 4),
  day_number integer not null check (day_number between 1 and 28),
  title text not null,
  audio_url text not null,
  duration_seconds integer not null check (duration_seconds > 0),
  unlock_date date not null,
  created_at timestamptz not null default now(),
  unique (cohort_id, day_number),
  unique (cohort_id, unlock_date)
);

create table if not exists public.practice_logs (
  id uuid primary key default gen_random_uuid(),
  member_id uuid not null references public.members(id) on delete cascade,
  content_id uuid not null references public.daily_content(id) on delete cascade,
  completed_at timestamptz not null default now(),
  completion_date date not null,
  percent_completed integer not null check (percent_completed between 0 and 100),
  unique (member_id, content_id)
);

create table if not exists public.pair_streaks (
  id uuid primary key default gen_random_uuid(),
  pair_id uuid not null unique references public.buddy_pairs(id) on delete cascade,
  current_streak integer not null default 0,
  longest_streak integer not null default 0,
  last_joint_completion_date date,
  updated_at timestamptz not null default now()
);

create table if not exists public.pair_content_progress (
  pair_id uuid not null references public.buddy_pairs(id) on delete cascade,
  content_id uuid not null references public.daily_content(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  joint_completed_at timestamptz,
  primary key (pair_id, content_id)
);

create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  member_id uuid references public.members(id) on delete set null,
  pair_id uuid references public.buddy_pairs(id) on delete set null,
  event_type text not null,
  recipient_email text not null,
  subject text not null,
  html_body text not null,
  status text not null default 'queued' check (status in ('queued', 'sent', 'failed')),
  provider text not null default 'supabase_edge',
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create index if not exists idx_members_cohort on public.members(cohort_id);
create index if not exists idx_buddy_pairs_cohort on public.buddy_pairs(cohort_id);
create index if not exists idx_practice_logs_member_date on public.practice_logs(member_id, completion_date);
create index if not exists idx_daily_content_cohort_day on public.daily_content(cohort_id, day_number);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.members
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.get_member_cohort_id(member_uuid uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select cohort_id
  from public.members
  where id = member_uuid
  limit 1;
$$;

create or replace function public.local_completion_date(member_timezone text, completed_at timestamptz default now())
returns date
language sql
immutable
as $$
  select ((completed_at at time zone member_timezone) - interval '3 hours')::date;
$$;

create or replace function public.get_member_pair(member_uuid uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select pair_id
  from public.buddy_pair_members
  where member_id = member_uuid
  limit 1;
$$;

create or replace function public.complete_practice(content_uuid uuid, percent integer, completed_when timestamptz default now())
returns public.practice_logs
language plpgsql
security definer
set search_path = public
as $$
declare
  current_member public.members;
  content public.daily_content;
  pair_uuid uuid;
  completion_day date;
  log_row public.practice_logs;
begin
  select * into current_member from public.members where id = auth.uid();
  if current_member.id is null then
    raise exception 'member profile not found';
  end if;

  select * into content from public.daily_content where id = content_uuid;
  if content.id is null or content.cohort_id is distinct from current_member.cohort_id then
    raise exception 'content is not available for this member';
  end if;

  pair_uuid := public.get_member_pair(current_member.id);
  if pair_uuid is null then
    raise exception 'member is not paired yet';
  end if;

  if not exists (
    select 1 from public.pair_content_progress
    where pair_id = pair_uuid and content_id = content_uuid
  ) then
    raise exception 'content is waiting for partner completion';
  end if;

  completion_day := public.local_completion_date(current_member.timezone, completed_when);

  insert into public.practice_logs(member_id, content_id, completed_at, completion_date, percent_completed)
  values (current_member.id, content_uuid, completed_when, completion_day, greatest(percent, 90))
  on conflict (member_id, content_id) do update
    set percent_completed = greatest(public.practice_logs.percent_completed, excluded.percent_completed)
  returning * into log_row;

  return log_row;
end;
$$;

create or replace function public.handle_joint_completion()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pair_uuid uuid;
  required_count integer;
  complete_count integer;
  streak_count integer;
  current_content public.daily_content;
  next_content_id uuid;
begin
  pair_uuid := public.get_member_pair(new.member_id);
  if pair_uuid is null then
    return new;
  end if;

  select * into current_content from public.daily_content where id = new.content_id;

  select count(*) into required_count
  from public.buddy_pair_members
  where pair_id = pair_uuid;

  select count(distinct pl.member_id) into complete_count
  from public.practice_logs pl
  join public.buddy_pair_members bpm on bpm.member_id = pl.member_id
  where bpm.pair_id = pair_uuid
    and pl.content_id = new.content_id;

  if required_count > 0 and complete_count = required_count then
    insert into public.pair_streaks(pair_id, current_streak, longest_streak, last_joint_completion_date, updated_at)
    values (pair_uuid, 1, 1, new.completion_date, now())
    on conflict (pair_id) do update set
      current_streak = public.pair_streaks.current_streak + 1,
      longest_streak = greatest(public.pair_streaks.longest_streak, public.pair_streaks.current_streak + 1),
      last_joint_completion_date = new.completion_date,
      updated_at = now()
    returning current_streak into streak_count;

    update public.pair_content_progress
    set joint_completed_at = coalesce(joint_completed_at, now())
    where pair_id = pair_uuid and content_id = new.content_id;

    select id into next_content_id
    from public.daily_content
    where cohort_id = current_content.cohort_id
      and day_number = current_content.day_number + 1
      and unlock_date <= (new.completion_date + interval '1 day')::date
    limit 1;

    if next_content_id is not null then
      insert into public.pair_content_progress(pair_id, content_id)
      values (pair_uuid, next_content_id)
      on conflict do nothing;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists on_practice_log_joint_completion on public.practice_logs;
create trigger on_practice_log_joint_completion
after insert on public.practice_logs
for each row execute function public.handle_joint_completion();

alter table public.cohorts enable row level security;
alter table public.members enable row level security;
alter table public.buddy_pairs enable row level security;
alter table public.buddy_pair_members enable row level security;
alter table public.daily_content enable row level security;
alter table public.practice_logs enable row level security;
alter table public.pair_streaks enable row level security;
alter table public.pair_content_progress enable row level security;
alter table public.notification_events enable row level security;

create policy "members read own cohort" on public.members for select
  using (id = auth.uid() or public.is_admin() or cohort_id = public.get_member_cohort_id(auth.uid()));
create policy "members update own onboarding" on public.members for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "cohorts visible to members" on public.cohorts for select
  using (public.is_admin() or id = public.get_member_cohort_id(auth.uid()));
create policy "admins manage cohorts" on public.cohorts for all using (public.is_admin()) with check (public.is_admin());

create policy "pairs visible to pair members" on public.buddy_pairs for select
  using (public.is_admin() or id = public.get_member_pair(auth.uid()));
create policy "pair members visible to pair" on public.buddy_pair_members for select
  using (public.is_admin() or pair_id = public.get_member_pair(auth.uid()));

create policy "content visible to cohort members" on public.daily_content for select
  using (public.is_admin() or cohort_id = public.get_member_cohort_id(auth.uid()));
create policy "admins manage content" on public.daily_content for all using (public.is_admin()) with check (public.is_admin());

create policy "practice logs visible to pair" on public.practice_logs for select
  using (
    public.is_admin()
    or member_id = auth.uid()
    or public.get_member_pair(member_id) = public.get_member_pair(auth.uid())
  );
create policy "members insert own practice through rpc" on public.practice_logs for insert
  with check (member_id = auth.uid());

create policy "streaks visible to pair" on public.pair_streaks for select
  using (public.is_admin() or pair_id = public.get_member_pair(auth.uid()));
create policy "progress visible to pair" on public.pair_content_progress for select
  using (public.is_admin() or pair_id = public.get_member_pair(auth.uid()));

create policy "notification events admin only" on public.notification_events for select
  using (public.is_admin());
