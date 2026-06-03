-- ============================================
-- 043: Vadybininkės funkcionalumas — orders stulpeliai
-- ============================================
-- Dalis 2/3. Naujas patvirtinimo ciklas atskiras nuo esamo orders.status
-- (enum order_status — pildymo/mokėjimo ciklas, NELIEČIAMAS).
--
-- approval_status — TIK patvirtinimo sprendimas (ne pildymas):
--   NULL      → įprastas savitarnos užsakymas (ne rep srautas)
--   pending   → rep pateikė, laukia admin
--   approved  → admin patvirtino (tada nuskaitomas sandėlis)
--   rejected  → admin atmetė
--
-- PILDYMĄ (shipped/delivered/„įvykdyta") seka esamas orders.status (order_status
-- enum) — VIENAS tiesos šaltinis. Sąmoningai NEdedam 'fulfilled' čia, kad
-- du statusai neprasilenktų. Po approved užsakymas eina įprastu pildymo keliu.
--
-- ⚠️ Taikyti per Dashboard SQL Editor. Idempotentiška.
-- ============================================

do $$ begin
  if not exists (select 1 from pg_type where typname = 'order_approval_status') then
    create type order_approval_status as enum
      ('pending', 'approved', 'rejected');
  end if;
end $$;

alter table public.orders
  add column if not exists client_id uuid references public.clients(id) on delete set null,
  add column if not exists placed_by uuid references auth.users(id) on delete set null,
  add column if not exists approval_status order_approval_status,
  add column if not exists approved_by uuid references auth.users(id) on delete set null,
  add column if not exists approved_at timestamptz,
  add column if not exists rejection_reason text;

create index if not exists idx_orders_approval_status on public.orders(approval_status);
create index if not exists idx_orders_placed_by on public.orders(placed_by);
create index if not exists idx_orders_client_id on public.orders(client_id);

comment on column public.orders.approval_status is 'REP užsakymo patvirtinimo ciklas. NULL = įprastas savitarnos užsakymas. Atskiras nuo status (order_status pildymo ciklo).';
comment on column public.orders.placed_by is 'auth.users id — vadybininkė, pateikusi užsakymą kliento vardu.';
