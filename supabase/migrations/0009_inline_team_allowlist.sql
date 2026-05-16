-- 0009_inline_team_allowlist
-- Vervang public.is_team_member() door een inline expressie in de policies.
-- Reden: SECURITY DEFINER function via REST RPC is onnodige attack surface.
-- Inline werkt omdat auth.jwt() STABLE is en Postgres caching binnen één
-- query toepast.

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

drop function if exists public.is_team_member();

create policy "team allowlist" on public.events
  for all to authenticated
  using (exists (select 1 from public.team_members where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))))
  with check (exists (select 1 from public.team_members where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))));

create policy "team allowlist" on public.courses
  for all to authenticated
  using (exists (select 1 from public.team_members where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))))
  with check (exists (select 1 from public.team_members where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))));

create policy "team allowlist" on public.dishes
  for all to authenticated
  using (exists (select 1 from public.team_members where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))))
  with check (exists (select 1 from public.team_members where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))));

create policy "team allowlist" on public.ingredients
  for all to authenticated
  using (exists (select 1 from public.team_members where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))))
  with check (exists (select 1 from public.team_members where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))));

create policy "team allowlist" on public.dish_ingredients
  for all to authenticated
  using (exists (select 1 from public.team_members where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))))
  with check (exists (select 1 from public.team_members where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))));

create policy "team allowlist" on public.guests
  for all to authenticated
  using (exists (select 1 from public.team_members where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))))
  with check (exists (select 1 from public.team_members where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))));

create policy "team allowlist" on public.team_members
  for all to authenticated
  using (exists (select 1 from public.team_members tm where lower(tm.email) = lower(coalesce(auth.jwt() ->> 'email', ''))))
  with check (exists (select 1 from public.team_members tm where lower(tm.email) = lower(coalesce(auth.jwt() ->> 'email', ''))));

create policy "team allowlist" on public.expenses
  for all to authenticated
  using (exists (select 1 from public.team_members where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))))
  with check (exists (select 1 from public.team_members where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))));

create policy "team allowlist" on public.notes
  for all to authenticated
  using (exists (select 1 from public.team_members where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))))
  with check (exists (select 1 from public.team_members where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))));

create policy "team allowlist" on public.inspirations
  for all to authenticated
  using (exists (select 1 from public.team_members where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))))
  with check (exists (select 1 from public.team_members where lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))));
