-- 0008_team_allowlist_rls
-- Vervang permissieve "authenticated full access"-policies door een
-- team-allowlist op email. Een gebruiker mag alleen lezen/schrijven als
-- z'n email voorkomt in public.team_members.

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

drop policy if exists "authenticated full access" on public.events;
drop policy if exists "authenticated full access" on public.courses;
drop policy if exists "authenticated full access" on public.dishes;
drop policy if exists "authenticated full access" on public.ingredients;
drop policy if exists "authenticated full access" on public.dish_ingredients;
drop policy if exists "authenticated full access" on public.guests;
drop policy if exists "authenticated full access" on public.team_members;
drop policy if exists "authenticated full access" on public.expenses;
drop policy if exists "authenticated full access" on public.notes;
drop policy if exists "authenticated full access" on public.inspirations;

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
