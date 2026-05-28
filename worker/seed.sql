-- Team members (PIN hashed with PBKDF2-HMAC-SHA256, 100 000 iterations)
INSERT OR IGNORE INTO team_members (id, email, display_name, pin_hash) VALUES
  ('tm-stef-001',     'stefvandijk10@gmail.com',     'Stef',     '2Y5potf2fCuABYMuAzRtmw==.kpRhiGLSjqIhvMgf9LDIJfmYUWv0cEngoDEsataK/lY='),
  ('tm-morrison-001', 'morrison_mensink@hotmail.com', 'Morrison', 'dtVvMDMBSZyAqnlNoKEzig==.XEfbFHI1UIvLPxrUmhaOp3zpip2OUBQAiL+SuzsS74U=');

INSERT OR IGNORE INTO events (id, name, event_date, guest_count, ticket_price_cents, location_name, location_cost_cents) VALUES
  ('evt-vg-001', 'Vaste Grond · Avond 1', '2026-07-30', 12, 9500, 'Vogelfrei', 0),
  ('evt-vg-002', 'Vaste Grond · Avond 2', '2026-07-31', 12, 9500, 'Vogelfrei', 0),
  ('evt-vg-003', 'Vaste Grond · Avond 3', '2026-08-01', 12, 9500, 'Vogelfrei', 0);
