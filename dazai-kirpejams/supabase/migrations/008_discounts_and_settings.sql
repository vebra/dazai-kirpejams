-- ============================================
-- Nuolaidų kodai ir parduotuvės nustatymai
-- ============================================
--
-- Ši migracija prideda du dalykus, reikalingus admin „Kainos ir nuolaidos"
-- sekcijai:
--   1) `discount_codes` — kuponų kodai, kuriuos klientai įveda krepšelyje
--   2) `shop_settings` — key-value store parduotuvės nustatymams
--      (pristatymo kainoms, nemokamo pristatymo ribai, min. užsakymo sumai)

-- ============================================
-- DISCOUNT CODES
-- ============================================

create type discount_type as enum ('percent', 'fixed_cents');

create table if not exists discount_codes (
  id uuid primary key default uuid_generate_v4(),

  -- Kliento matomas kodas (pvz. PAVASARIS25). Visada saugom UPPERCASE,
  -- palyginimas case-insensitive.
  code text unique not null,

  -- Vidinis aprašymas admin'ui — ne klientui
  description text,

  discount_type discount_type not null,
  -- Jei 'percent' — reikšmė nuo 1 iki 100 (procentai)
  -- Jei 'fixed_cents' — reikšmė cent'ais (pvz. 500 = €5 nuolaida)
  value int not null check (value > 0),

  -- Minimali krepšelio suma (cent'ais), kad kuponas taptų galiojantis
  min_order_cents int default 0 check (min_order_cents >= 0),

  -- Maksimalus panaudojimų skaičius (NULL = neribotas)
  max_uses int check (max_uses is null or max_uses > 0),

  -- Kiek kartų jau buvo panaudotas (didinam per aplikaciją, ne per DB)
  used_count int default 0 check (used_count >= 0),

  -- Galiojimo langas (NULL = visada)
  valid_from timestamptz,
  valid_until timestamptz,

  -- Leidžia greitai išjungti kuponą be trynimo
  is_active boolean default true,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_discount_codes_code on discount_codes(code);
create index idx_discount_codes_active on discount_codes(is_active);

-- Norim užtikrinti, kad kodas visada saugomas UPPERCASE formatu — kitaip
-- galima lengvai priveisti duplikatų tipo „Pavasaris25" ir „PAVASARIS25"
create or replace function normalize_discount_code()
returns trigger
language plpgsql
as $$
begin
  new.code := upper(trim(new.code));
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_normalize_discount_code on discount_codes;
create trigger trg_normalize_discount_code
  before insert or update on discount_codes
  for each row execute function normalize_discount_code();

-- RLS — viešas skaitymas tik aktyvių kodų (klientas validuos krepšelyje).
-- Rašymas — tik service role / admin (RLS apsaugo nuo anoniminio).
alter table discount_codes enable row level security;

drop policy if exists "Public read active discount codes" on discount_codes;
create policy "Public read active discount codes" on discount_codes
  for select
  using (is_active = true);

-- Naudojam `is_admin()` helper'į iš 004_admin_access.sql — jis yra
-- SECURITY DEFINER ir mato visą admin_users lentelę, apeidamas RLS.
drop policy if exists "Admins manage discount codes" on discount_codes;
create policy "Admins manage discount codes" on discount_codes
  for all to authenticated
  using (is_admin())
  with check (is_admin());

-- ============================================
-- SHOP SETTINGS — key-value store
-- ============================================
--
-- Naudojam vietoj atskirų kolonų, kad galėtume pridėti naujų nustatymų
-- be schema migracijų. JSONB value leidžia saugoti ne tik number bet ir
-- objektus (pvz. delivery_costs su kiekvienu metodu).

create table if not exists shop_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);

alter table shop_settings enable row level security;

-- Viešas skaitymas — mums reikia, kad krepšelis galėtų rodyti pristatymo
-- kainas ir nemokamo pristatymo ribą be login'o.
drop policy if exists "Public read shop settings" on shop_settings;
create policy "Public read shop settings" on shop_settings
  for select
  using (true);

-- Rašymas tik admin'ams
drop policy if exists "Admins manage shop settings" on shop_settings;
create policy "Admins manage shop settings" on shop_settings
  for all to authenticated
  using (is_admin())
  with check (is_admin());

-- Pradinės reikšmės — atitinka dabartinius hard-coded'intus MVP nustatymus,
-- kad admin'as matytų konkrečias reikšmes, kurias gali keisti.
insert into shop_settings (key, value) values
  ('free_shipping_threshold_cents', '5000'::jsonb),
  ('min_order_cents', '0'::jsonb),
  ('delivery_cost_courier_cents', '499'::jsonb),
  ('delivery_cost_parcel_locker_cents', '299'::jsonb),
  ('delivery_cost_pickup_cents', '0'::jsonb)
on conflict (key) do nothing;
