-- ============================================
-- 053: Atsisiuntimai (downloads) — failai klientams
-- ============================================
-- Admin įkelia failus (kainoraščiai, katalogai, spalvų paletė, instrukcijos).
-- Kiekvienam failui: visibility 'public' (visiems) arba 'pro' (tik patvirtintiems
-- profesionalams). Failai privačioje saugykloje; atsisiuntimas per serverio
-- maršrutą su signed URL (pro atveju tikrinama verifikacija).
--
-- ⚠️ Taikyti per Supabase Dashboard SQL Editor.

create table if not exists downloads (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  file_path text not null,
  file_name text,
  file_size_bytes bigint,
  visibility text not null default 'public' check (visibility in ('public', 'pro')),
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_downloads_active
  on downloads(is_active, sort_order);

alter table downloads enable row level security;

-- Vieša metaduomenų peržiūra (failas privačioje saugykloje, tad kelias be
-- signed URL nieko nesuteikia). Rodom tik aktyvius.
drop policy if exists downloads_public_read on downloads;
create policy downloads_public_read
  on downloads for select
  to anon, authenticated
  using (is_active);

-- Admin pilnas valdymas
drop policy if exists downloads_admin_all on downloads;
create policy downloads_admin_all
  on downloads for all
  to authenticated
  using (is_admin())
  with check (is_admin());

-- Privati saugykla failams
insert into storage.buckets (id, name, public)
values ('downloads', 'downloads', false)
on conflict (id) do nothing;

notify pgrst, 'reload schema';
