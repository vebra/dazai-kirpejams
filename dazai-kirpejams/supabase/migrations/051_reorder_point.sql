-- ============================================
-- 051: Atsargų perspėjimo riba (reorder_point)
-- ============================================
-- Kiekvienai prekei galima nustatyti ribą. Kai likutis <= ribos (ir riba > 0),
-- prekė rodoma „Ką užsakyti" sąraše. Null/0 = perspėjimo nėra.
--
-- ⚠️ Taikyti per Supabase Dashboard SQL Editor.

alter table products
  add column if not exists reorder_point int
    check (reorder_point is null or reorder_point >= 0);

comment on column products.reorder_point is
  'Atsargų perspėjimo riba. Kai stock_quantity <= reorder_point (>0) — prekę reikia užsakyti.';

notify pgrst, 'reload schema';
