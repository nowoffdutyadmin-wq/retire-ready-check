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

drop policy if exists "members read own cohort" on public.members;
drop policy if exists "cohorts visible to members" on public.cohorts;
drop policy if exists "pairs visible to pair members" on public.buddy_pairs;
drop policy if exists "pair members visible to pair" on public.buddy_pair_members;
drop policy if exists "content visible to cohort members" on public.daily_content;

create policy "members read own cohort" on public.members for select
  using (id = auth.uid() or public.is_admin() or cohort_id = public.get_member_cohort_id(auth.uid()));

create policy "cohorts visible to members" on public.cohorts for select
  using (public.is_admin() or id = public.get_member_cohort_id(auth.uid()));

create policy "pairs visible to pair members" on public.buddy_pairs for select
  using (public.is_admin() or id = public.get_member_pair(auth.uid()));

create policy "pair members visible to pair" on public.buddy_pair_members for select
  using (public.is_admin() or pair_id = public.get_member_pair(auth.uid()));

create policy "content visible to cohort members" on public.daily_content for select
  using (public.is_admin() or cohort_id = public.get_member_cohort_id(auth.uid()));
