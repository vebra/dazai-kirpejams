-- ============================================
-- 059: Redaguojamas „Prekės ženklas" laukas prekei
-- ============================================
-- Iki šiol prekės ženklas produkto puslapio lentelėje buvo fiksuotas kode
-- („Color SHOCK / RosaNera Cosmetics") — visoms prekėms vienodas. Dabar —
-- redaguojamas kiekvienai prekei (pvz. pirštinėms „MEDICOV"). Tuščia (null) —
-- svetainėje rodoma numatyta „Color SHOCK / RosaNera Cosmetics".
--
-- Variantų (dydžių) prekėms laukas sinchronizuojamas su kitais dydžiais per
-- redagavimo formą (žr. updateProduct action).
--
-- ⚠️ Taikyti per Supabase Dashboard SQL Editor.

alter table products
  add column if not exists info_brand text;

notify pgrst, 'reload schema';
