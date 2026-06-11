-- ============================================
-- 071: Revizijų istorija (stock_revisions)
-- ============================================
-- Kiekvienos patvirtintos revizijos suvestinė: kada, kiek pozicijų pakeista,
-- bendras vnt. ir vertės (savikaina) pokytis + pilnas neatitikimų sąrašas
-- (details jsonb — savarankiškas snapshot'as, nereikia jungti žurnalo).
--
-- details formatas: [{ productId, name, colorNumber, sku, system, counted,
--                      diff, valueCents }, ...]
--
-- Rašo TIK service_role (applyRevisionAction, už requireAdmin); skaito admin.
--
-- ⚠️ Taikyti per Dashboard SQL Editor.
-- ============================================

create table if not exists stock_revisions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  applied_count int not null,
  total_delta int not null,
  value_change_cents bigint not null default 0,
  details jsonb not null default '[]'::jsonb
);

create index if not exists idx_stock_revisions_created
  on stock_revisions(created_at desc);

alter table stock_revisions enable row level security;

drop policy if exists stock_revisions_admin_read on stock_revisions;
create policy stock_revisions_admin_read
  on stock_revisions for select
  to authenticated
  using (is_admin());

-- INSERT policy nėra — rašo tik service_role (apeina RLS).

notify pgrst, 'reload schema';
