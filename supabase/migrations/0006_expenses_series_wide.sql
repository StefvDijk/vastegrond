-- Uitgaven horen bij de hele pop-up-serie, niet per avond (zelfde reden als
-- migratie 0005 voor courses: één event-serie, gedeelde context).
-- expenses_event_id_idx wordt automatisch gedropt met de kolom.
alter table public.expenses drop column event_id;
