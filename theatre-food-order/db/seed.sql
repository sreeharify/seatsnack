-- Demo seed data. Run after schema.sql.
-- Adjust show_time / interval_time to something in the near future before demoing.

insert into theatres (id, name) values
  ('11111111-1111-1111-1111-111111111111', 'Aries Plex')
on conflict (id) do nothing;

insert into screens (id, theatre_id, name) values
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Screen 1'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Screen 2'),
  ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'Screen 3')
on conflict (id) do nothing;

-- A show on Screen 2 starting shortly (edit the timestamps to suit your demo time).
insert into shows (screen_id, movie_name, show_time, interval_time) values
  ('22222222-2222-2222-2222-222222222222', 'Now Showing', now() + interval '5 minutes', now() + interval '45 minutes');

insert into menu_items (theatre_id, name, price_paise, is_active) values
  ('11111111-1111-1111-1111-111111111111', 'Popcorn', 12000, true),
  ('11111111-1111-1111-1111-111111111111', 'Pepsi', 8000, true),
  ('11111111-1111-1111-1111-111111111111', 'Chicken 65', 18000, true),
  ('11111111-1111-1111-1111-111111111111', 'Popcorn + Pepsi Combo', 17900, true),
  ('11111111-1111-1111-1111-111111111111', 'Coffee', 5000, true),
  ('11111111-1111-1111-1111-111111111111', 'Nachos', 15000, true);

-- Handy: the Screen 2 id to use for your first test QR / link is
-- 22222222-2222-2222-2222-222222222222
-- Try:  /order?screen=22222222-2222-2222-2222-222222222222&seat=G12
