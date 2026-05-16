-- 0010_fix_team_members_recursion
-- De inline EXISTS-check uit migratie 0009 veroorzaakt infinite recursion
-- op de team_members policy: de policy van team_members ondervraagt
-- team_members, wat de policy opnieuw triggert.
-- Fix: gebruik een SECURITY DEFINER helper die RLS bypasst bij de check.
-- Trade-off: een minor advisor-warning over executable function. De
-- function returnt alleen een boolean (geen data leak), dus risico is laag.

create or replace function public.is_team_member()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members
    where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_team_member() from public, anon;
grant execute on function public.is_team_member() to authenticated;

drop policy if exists "team allowlist" on public.events;
drop policy if exists "team allowlist" on public.courses;
drop policy if exists "team allowlist" on public.dishes;
drop policy if exists "team allowlist" on public.ingredients;
drop policy if exists "team allowlist" on public.dish_ingredients;
drop policy if exists "team allowlist" on public.guests;
drop policy if exists "team allowlist" on public.team_members;
drop policy if exists "team allowlist" on public.expenses;
drop policy if exists "team allowlist" on public.notes;
drop policy if exists "team allowlist" on public.inspirations;

create policy "team allowlist" on public.events
  for all to authenticated using (public.is_team_member()) with check (public.is_team_member());
create policy "team allowlist" on public.courses
  for all to authenticated using (public.is_team_member()) with check (public.is_team_member());
create policy "team allowlist" on public.dishes
  for all to authenticated using (public.is_team_member()) with check (public.is_team_member());
create policy "team allowlist" on public.ingredients
  for all to authenticated using (public.is_team_member()) with check (public.is_team_member());
create policy "team allowlist" on public.dish_ingredients
  for all to authenticated using (public.is_team_member()) with check (public.is_team_member());
create policy "team allowlist" on public.guests
  for all to authenticated using (public.is_team_member()) with check (public.is_team_member());
create policy "team allowlist" on public.team_members
  for all to authenticated using (public.is_team_member()) with check (public.is_team_member());
create policy "team allowlist" on public.expenses
  for all to authenticated using (public.is_team_member()) with check (public.is_team_member());
create policy "team allowlist" on public.notes
  for all to authenticated using (public.is_team_member()) with check (public.is_team_member());
create policy "team allowlist" on public.inspirations
  for all to authenticated using (public.is_team_member()) with check (public.is_team_member());
