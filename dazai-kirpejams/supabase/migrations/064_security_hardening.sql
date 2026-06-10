-- ============================================
-- 064: Saugumo sugriežtinimas (2026-06-10 audito radiniai)
-- ============================================
-- Problema: dalis SECURITY DEFINER funkcijų ir RLS policy buvo pasiekiamos
-- su viešu anon raktu TIESIAI per PostgREST (apeinant app sluoksnį):
--
--   1. decrement_stock_for_order — anon galėjo nunulinti visą sandėlį.
--   2. v1 kuponų funkcijos (apply/revert) — anon galėjo sudeginti kupono
--      max_uses limitą arba jį atstatyti. Checkout naudoja TIK v2 (048).
--   3. discount_codes "Public read" — visi aktyvūs kuponai (kodas, vertė,
--      limitai) enumeruojami viešai. App jų tiesiogiai neskaito: krepšelio
--      peržiūra eina per validate_discount_code_v2 (definer), admin — per
--      "Admins manage discount codes" policy.
--   4. shop_settings "using (true)" — KV lentelė su banko/sąskaitų/PVM
--      raktais skaitoma viešai. App viešo skaitymo NETURI: events/visibility,
--      invoices — service_role; admin — "Admins manage shop settings".
--   5. next_invoice_number — bet kuris prisijungęs klientas galėjo prasukti
--      sąskaitų numeraciją (palikdamas tarpus SF-YYYY-NNNN sekoje).
--   6. rep_held — bet kuris prisijungęs galėjo zonduoti vadybininkių
--      likučius. Kviečiama tik IŠ definer funkcijų (vidiniams kvietimams
--      grant nereikia) ir per service_role.
--
-- Niekas iš app pusės nesikeičia — nė vienas iš šių kelių nebuvo naudojamas.
-- Funkcijų signatūros nesikeičia → PostgREST schema reload NEbūtinas,
-- bet notify paliekam dėl policy pakeitimų.
--
-- ⚠️ Taikyti per Dashboard SQL Editor.
-- ============================================

-- 1) Sandėlio nurašymas — tik service_role (kviečia create_order_atomic viduje)
revoke execute on function decrement_stock_for_order(jsonb) from public, anon, authenticated;

-- 2) v1 kuponų funkcijos — nebenaudojamos nuo 048 (v2), paliekam tik service_role
revoke execute on function validate_discount_code(text, int) from public, anon, authenticated;
revoke execute on function apply_discount_code(text, int) from public, anon, authenticated;
revoke execute on function revert_discount_code(text) from public, anon, authenticated;

-- 3) Kuponai nebeskaitomi viešai (validacija — per validate_discount_code_v2)
drop policy if exists "Public read active discount codes" on discount_codes;

-- 4) shop_settings nebeskaitoma viešai (admin/serveris turi savo kelius)
drop policy if exists "Public read shop settings" on shop_settings;

-- 5) Sąskaitų numeratorius — tik service_role (kviečia invoices/generate.ts)
revoke execute on function next_invoice_number() from public, anon, authenticated;

-- 6) Vadybininkės likučio funkcija — tik service_role ir vidiniai kvietimai
revoke execute on function rep_held(uuid, uuid) from public, anon, authenticated;

-- ============================================
-- Indeksai augančiam judėjimo žurnalui (audito N4)
-- ============================================
-- rep_held() filtruoja rep_id+product_id kiekvieno patvirtinimo/grąžinimo
-- pre-check'e; restore_stock_by_order_id ieško pagal source=order_number.
create index if not exists idx_stock_movements_rep
  on stock_movements(rep_id, product_id) where rep_id is not null;
create index if not exists idx_stock_movements_source
  on stock_movements(source);
create index if not exists idx_order_items_product
  on order_items(product_id);

notify pgrst, 'reload schema';
