-- Reorder-flow wordt eenvoudiger zonder unique-index op (event_id, position).
-- Sorteren gebeurt nu op (position asc, created_at asc).
drop index if exists public.event_courses_event_position_uidx;
