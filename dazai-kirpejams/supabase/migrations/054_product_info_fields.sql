-- ============================================
-- 054: Redaguojami „Papildoma informacija" laukai prekei
-- ============================================
-- Iki šiol Tipas / Maišymo santykis / Galiojimas / Kilmės šalis buvo fiksuoti
-- kode (vienodi visiems). Dabar — redaguojami kiekvienai prekei. Tuščia (null)
-- — svetainėje rodoma numatyta reikšmė (atsarga).
--
-- ⚠️ Taikyti per Supabase Dashboard SQL Editor.

alter table products
  add column if not exists info_type text,
  add column if not exists info_mixing_ratio text,
  add column if not exists info_shelf_life text,
  add column if not exists info_country text;

notify pgrst, 'reload schema';
