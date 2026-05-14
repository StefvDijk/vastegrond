-- Notities + Inspiratie tabbladen.
-- - notes: vrije notities (titel + body + tags + optionele koppeling aan gerecht/gang)
-- - inspirations: links, recepten, foto's (url of image_path in storage)
-- - storage bucket "inspirations" voor geüploade afbeeldingen / geplakte screenshots

-- ============================================================================
-- notes
-- ============================================================================
create table public.notes (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  body text not null default '',
  tags text[] not null default '{}',
  dish_id uuid references public.dishes(id) on delete set null,
  course_id uuid references public.courses(id) on delete set null,
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index notes_updated_at_idx on public.notes (updated_at desc);
create index notes_author_id_idx on public.notes (author_id);

create trigger notes_set_updated_at
  before update on public.notes
  for each row execute function public.set_updated_at();

-- ============================================================================
-- inspirations
-- image_path verwijst naar object in storage bucket "inspirations".
-- url is optioneel (Instagram/recept-link). Een item heeft url of image_path of
-- allebei — geen check-constraint zodat tekst-only inspiratie ook werkt.
-- ============================================================================
create table public.inspirations (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  note text not null default '',
  url text,
  image_path text,
  tags text[] not null default '{}',
  dish_id uuid references public.dishes(id) on delete set null,
  course_id uuid references public.courses(id) on delete set null,
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index inspirations_created_at_idx on public.inspirations (created_at desc);
create index inspirations_author_id_idx on public.inspirations (author_id);

create trigger inspirations_set_updated_at
  before update on public.inspirations
  for each row execute function public.set_updated_at();

-- ============================================================================
-- RLS: zelfde patroon als rest van de app — alle ingelogde users zijn teamlid.
-- ============================================================================
alter table public.notes        enable row level security;
alter table public.inspirations enable row level security;

create policy "authenticated full access" on public.notes
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.inspirations
  for all to authenticated using (true) with check (true);

-- ============================================================================
-- Storage bucket "inspirations" — private (signed URLs of authenticated access).
-- ============================================================================
insert into storage.buckets (id, name, public)
  values ('inspirations', 'inspirations', false)
  on conflict (id) do nothing;

-- Storage RLS: elke ingelogde user mag in bucket "inspirations" lezen/schrijven.
create policy "inspirations bucket read"
  on storage.objects for select to authenticated
  using (bucket_id = 'inspirations');

create policy "inspirations bucket insert"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'inspirations');

create policy "inspirations bucket update"
  on storage.objects for update to authenticated
  using (bucket_id = 'inspirations')
  with check (bucket_id = 'inspirations');

create policy "inspirations bucket delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'inspirations');
