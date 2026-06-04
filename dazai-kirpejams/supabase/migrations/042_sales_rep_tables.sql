-- ============================================
-- 042: Vadybininkės (sales_rep) funkcionalumas — lentelės
-- ============================================
-- Dalis 1/3. Tik lentelės/stulpeliai. RLS ir RPC — migracijoje 044.
--
-- SPRENDIMAI (patvirtinti):
--  A) orders.status (enum) NEliečiamas — naujas approval_status (043).
--  B) role (client/sales_rep) į user_profiles; admin LIEKA per admin_users.
--  C) product_prices tik REP srautui; vieša savitarna lieka su price_cents.
--  D) clients — atskira lentelė (vadybininkės salonai), nesusieta su login.
--
-- ⚠️ Taikyti per Supabase Dashboard SQL Editor. Idempotentiška.
-- ============================================

-- 1) user_profiles.role — atskiria client / sales_rep (admin = admin_users)
alter table public.user_profiles
  add column if not exists role text not null default 'client';

do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'user_profiles_role_check'
  ) then
    alter table public.user_profiles
      add constraint user_profiles_role_check
      check (role in ('client', 'sales_rep'));
  end if;
end $$;

create index if not exists idx_user_profiles_role on public.user_profiles(role);

-- 2) clients — vadybininkės valdomi klientai (salonai/kirpėjai)
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  -- Kainų grupė. Keisti gali TIK admin (trigeris 044). Naujiems — wholesale_1.
  pricing_tier text not null default 'wholesale_1'
    check (pricing_tier in ('wholesale_1', 'wholesale_2', 'wholesale_3')),
  -- PVM mokėtojo statusas + kodas (sąskaitai; kol kas PVM skaičiuojamas visiems).
  is_vat_payer boolean not null default false,
  vat_code text,
  -- Šalis — KOL KAS tik saugoma, NEnaudojama skaičiavime (PVM 21% visiems).
  -- Ateičiai: kai atsiras LV/EE/ES salonų — čia bus ES reverse-charge pagrindas.
  country text not null default 'LT',
  -- Vadybininkė, sukūrusi klientą (= savininkystė RLS'ui)
  created_by uuid not null references auth.users(id) on delete restrict,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_clients_created_by on public.clients(created_by);

-- 3) product_prices — VIENINTELĖ kainų vieta REP srautui (pagal tier)
create table if not exists public.product_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  tier text not null
    check (tier in ('wholesale_1', 'wholesale_2', 'wholesale_3')),
  price_cents integer not null check (price_cents > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, tier)
);

create index if not exists idx_product_prices_product on public.product_prices(product_id);

-- Bendras updated_at trigeris (projekte nebuvo universalaus — tik user_profiles
-- turėjo savo). Atnaujina updated_at per kiekvieną UPDATE.
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_clients_updated_at on public.clients;
create trigger trg_clients_updated_at
  before update on public.clients
  for each row execute function set_updated_at();

drop trigger if exists trg_product_prices_updated_at on public.product_prices;
create trigger trg_product_prices_updated_at
  before update on public.product_prices
  for each row execute function set_updated_at();

-- RLS įjungiama dabar (užrakinta); politikos — 044. Iki tol prieiga tik
-- service_role (apeina RLS).
alter table public.clients enable row level security;
alter table public.product_prices enable row level security;

comment on table public.clients is 'Vadybininkės valdomi klientai (salonai/kirpėjai). NĖRA auth.users.';
comment on table public.product_prices is 'Didmeninės kainos pagal tier — tik REP srautui. Vieša savitarna naudoja products.price_cents.';
comment on column public.user_profiles.role is 'client | sales_rep. Admin nustatomas per admin_users (is_admin()).';
