-- Vaste Grond — initieel schema
-- Geldbedragen worden opgeslagen als cents (int) om floating-point-fouten te
-- vermijden. Aan de UI-kant formatteren via formatEuro().

create extension if not exists "pgcrypto";

-- ============================================================================
-- events: één rij per pop-up dinner (30 juli, 31 juli, 1 augustus 2026)
-- ============================================================================
create table public.events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  event_date date not null,
  guest_count int not null default 0 check (guest_count >= 0),
  ticket_price_cents int not null default 0 check (ticket_price_cents >= 0),
  location_name text,
  location_cost_cents int not null default 0 check (location_cost_cents >= 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index events_event_date_idx on public.events (event_date);

-- ============================================================================
-- event_courses: gangen per event (volgorde via "position")
-- ============================================================================
create table public.event_courses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  position int not null check (position >= 0),
  name text not null,
  created_at timestamptz not null default now()
);
create unique index event_courses_event_position_uidx
  on public.event_courses (event_id, position);

-- ============================================================================
-- dishes: gerecht per gang (portions = aantal porties dat recept oplevert)
-- ============================================================================
create table public.dishes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.event_courses(id) on delete cascade,
  name text not null,
  portions int not null default 1 check (portions > 0),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index dishes_course_id_idx on public.dishes (course_id);

-- ============================================================================
-- ingredients: bibliotheek van ingredienten (gedeeld tussen events)
-- prijs_per_unit_cents is per "unit" (bv 1 g, 1 ml, 1 stuk)
-- purchase_unit beschrijft hoe je het inkoopt ("kg", "fles 750ml", "doos van 20")
-- ============================================================================
create table public.ingredients (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  unit text not null,
  price_per_unit_cents int not null default 0 check (price_per_unit_cents >= 0),
  purchase_unit text,
  supplier text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ============================================================================
-- dish_ingredients: koppeltabel gerecht <-> ingredient met hoeveelheid
-- amount is in dezelfde unit als ingredient.unit
-- ============================================================================
create table public.dish_ingredients (
  dish_id uuid not null references public.dishes(id) on delete cascade,
  ingredient_id uuid not null references public.ingredients(id) on delete restrict,
  amount numeric(12,3) not null check (amount >= 0),
  primary key (dish_id, ingredient_id)
);

-- ============================================================================
-- guests: gast-RSVP per event
-- ============================================================================
create table public.guests (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  name text not null,
  status text not null default 'invited'
    check (status in ('invited','confirmed','declined','tentative')),
  party_size int not null default 1 check (party_size > 0),
  dietary text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index guests_event_id_idx on public.guests (event_id);

-- ============================================================================
-- team_members: toegang-allowlist (alle toegang gelijk)
-- ============================================================================
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  email text not null unique,
  display_name text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- expenses: overige uitgaven per event (locatie staat al op event zelf)
-- ============================================================================
create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  category text not null,
  description text not null,
  amount_cents int not null check (amount_cents >= 0),
  created_at timestamptz not null default now()
);
create index expenses_event_id_idx on public.expenses (event_id);

-- ============================================================================
-- updated_at triggers
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_set_updated_at
  before update on public.events
  for each row execute function public.set_updated_at();

create trigger dishes_set_updated_at
  before update on public.dishes
  for each row execute function public.set_updated_at();

create trigger ingredients_set_updated_at
  before update on public.ingredients
  for each row execute function public.set_updated_at();

create trigger guests_set_updated_at
  before update on public.guests
  for each row execute function public.set_updated_at();

-- ============================================================================
-- Row Level Security: alle toegang gelijk voor ingelogde users
-- Bewust gekozen: app is invite-only met sign-ups uit, dus elke geauthenticeerde
-- user is per definitie een teamlid met volledige toegang. Supabase advisor
-- 0024 ("rls_policy_always_true") is hier expected.
-- ============================================================================
alter table public.events           enable row level security;
alter table public.event_courses    enable row level security;
alter table public.dishes           enable row level security;
alter table public.ingredients      enable row level security;
alter table public.dish_ingredients enable row level security;
alter table public.guests           enable row level security;
alter table public.team_members     enable row level security;
alter table public.expenses         enable row level security;

create policy "authenticated full access" on public.events
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.event_courses
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.dishes
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.ingredients
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.dish_ingredients
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.guests
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.team_members
  for all to authenticated using (true) with check (true);
create policy "authenticated full access" on public.expenses
  for all to authenticated using (true) with check (true);
