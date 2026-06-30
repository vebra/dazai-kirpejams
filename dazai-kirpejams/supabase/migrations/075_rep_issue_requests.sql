-- ============================================
-- 075: Vadybininkės „Išvežimas prekybai" prašymai (rep prašo → admin patvirtina)
-- ============================================
-- Vadybininkė dashborde sudaro prekių sąrašą, kurį nori pasiimti prekybai
-- (konsignacijai), ir pateikia PRAŠYMĄ. Admin jį patvirtina → prekės išduodamos
-- per issue_stock_to_rep_batch (sandėlis −, jos atsargos +). Tai PAKEIČIA blogą
-- praktiką, kai pasikrovimas buvo teikiamas kaip klientų užsakymas.
--
-- items JSONB: [{ "product_id": uuid, "qty": int, "name": text }]
--   name denormalizuotas, nes authenticated rolei products skaityti atimta (067).
--
-- Grąžinimas lieka admino pusėje (return_from_rep), kaip iki šiol.
--
-- ⚠️ Taikyti per Supabase Dashboard SQL Editor.

create table if not exists public.rep_issue_requests (
  id uuid primary key default uuid_generate_v4(),
  rep_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  items jsonb not null,
  note text,
  reject_reason text,
  created_at timestamptz default now(),
  decided_at timestamptz,
  decided_by uuid
);

create index if not exists idx_rep_issue_requests_rep on public.rep_issue_requests(rep_id);
create index if not exists idx_rep_issue_requests_status on public.rep_issue_requests(status);

alter table public.rep_issue_requests enable row level security;

-- Rep mato/ kuria TIK savo; admin mato visus.
drop policy if exists "rir_select" on public.rep_issue_requests;
create policy "rir_select" on public.rep_issue_requests
  for select to authenticated
  using (rep_id = auth.uid() or is_admin());

drop policy if exists "rir_insert_own" on public.rep_issue_requests;
create policy "rir_insert_own" on public.rep_issue_requests
  for insert to authenticated
  with check (rep_id = auth.uid() and status = 'pending');

-- Sprendimą (approve/reject) daro admin — per server action service_role; ši
-- politika leidžia ir per sesiją (is_admin()).
drop policy if exists "rir_admin_update" on public.rep_issue_requests;
create policy "rir_admin_update" on public.rep_issue_requests
  for update to authenticated
  using (is_admin())
  with check (is_admin());

grant select, insert, update on public.rep_issue_requests to authenticated;

comment on table public.rep_issue_requests is
  'Vadybininkės „išvežimas prekybai" prašymai; patvirtinus -> issue_stock_to_rep_batch.';

notify pgrst, 'reload schema';
