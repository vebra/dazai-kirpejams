-- ============================================
-- Migracija 027 — renginio matomumo perjungiklis
-- ============================================
--
-- Prideda shop_settings raktą `event_visible` (boolean), kuris valdo,
-- ar viešai rodyti renginio informaciją:
--   • Hero apačios EventCountdownSection homepage'yje
--   • Atskira /renginys puslapio versija (kai false — 404)
--   • Sitemap įrašas
--
-- Default: true (esama elgsena išlaikoma). Admin'as gali perjungti per
-- /admin/renginiai puslapio viršuje esantį jungiklį.

insert into shop_settings (key, value) values
  ('event_visible', 'true'::jsonb)
on conflict (key) do nothing;
