-- ============================================
-- 074: Užsakymai tiekėjui (supplier_orders)
-- ============================================
-- Kiekvieno tiekėjui pateikto užsakymo suvestinė: kada pateiktas, kiek
-- pozicijų, bendras vnt. kiekis, laisva pastaba + pilnas prekių sąrašas
-- (details jsonb — savarankiškas snapshot'as pateikimo momentu; jei prekė
-- vėliau pervadinama ar ištrinama, istorija lieka tiksli).
--
-- details formatas: [{ productId, name, nameEn, colorNumber, sku, ean,
--                      stockAtOrder, qty }, ...]
--
-- status: 'ordered' (numatyta). Paliktas plėtrai (pvz. 'received') — kol kas
-- tik istorijai „kada ir kiek užsakyta".
--
-- Rašo TIK service_role (createSupplierOrderAction, už requireAdmin); skaito admin.
--
-- ⚠️ Taikyti per Dashboard SQL Editor.
-- ============================================

create table if not exists supplier_orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'ordered',
  note text,
  item_count int not null,
  total_qty int not null,
  details jsonb not null default '[]'::jsonb
);

create index if not exists idx_supplier_orders_created
  on supplier_orders(created_at desc);

alter table supplier_orders enable row level security;

drop policy if exists supplier_orders_admin_read on supplier_orders;
create policy supplier_orders_admin_read
  on supplier_orders for select
  to authenticated
  using (is_admin());

-- INSERT/UPDATE/DELETE policy nėra — rašo tik service_role (apeina RLS).

notify pgrst, 'reload schema';
