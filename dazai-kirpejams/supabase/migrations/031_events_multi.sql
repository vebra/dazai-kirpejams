-- ============================================
-- Migracija 031 — kelių renginių palaikymas
-- ============================================
--
-- Pakeitimai:
--   • Drop'inam unique index'ą `events_one_active_uniq` — leidžiam kelis
--     `is_active=true` renginius vienu metu.
--   • `is_active` semantika tampa „rodyti viešai" (per-event visibility).
--     Globalus `shop_settings.event_visible` (027) tampa nereikalingas,
--     bet paliekamas, kad nesulaužytume galimų istorinių užklausų.
--   • Pridedam `display_order` (int) — rūšiavimui admin sąraše ir homepage
--     (rodyti pirma „svarbų" renginį, jei datų nepakanka).

drop index if exists events_one_active_uniq;

alter table events
  add column if not exists display_order int not null default 0;

create index if not exists events_display_order_idx
  on events (display_order, starts_at);
