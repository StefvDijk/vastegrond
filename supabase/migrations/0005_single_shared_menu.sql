-- Eén gedeeld menu voor alle avonden: gangen + gerechten staan los van events.
-- Allergenen en aantal personen verschillen wel per avond (zie guests / events).

-- 1) gangen: drop event_id en hernoem tabel naar "courses"
alter table public.event_courses drop column event_id;
alter table public.event_courses rename to courses;

-- 2) policy hernoemen niet nodig — Postgres koppelt policies aan de tabel-OID,
--    blijven dus gewoon werken na rename.
