-- ============================================
-- Vartotojų profiliai ir verifikacija
-- ============================================
--
-- Šios svetainės kainos matomos TIK patvirtintiems profesionalams —
-- kirpėjams su sertifikatu arba salonams su verslo liudijimu.
--
-- Srautas:
--   1) Vartotojas registruojasi per Supabase Auth (email + password)
--   2) Užpildo profilį + įkelia verifikacijos dokumentą
--   3) Admin'as peržiūri dokumentą → patvirtina arba atmeta
--   4) Patvirtintas vartotojas mato kainas ir gali pirkti
--
-- `user_profiles` lentelė papildo `auth.users` — nesaugo credential'ų,
-- tik profilio + verifikacijos duomenis.

-- ============================================
-- Verifikacijos statusai
-- ============================================
create type verification_status as enum ('pending', 'approved', 'rejected');

-- ============================================
-- USER PROFILES
-- ============================================
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,

  -- Kontaktinė info
  first_name text not null default '',
  last_name text not null default '',
  phone text default '',

  -- Verslo tipas — kirpėjas (sertifikatas) arba salonas (verslo liudijimas)
  business_type text check (business_type in ('hairdresser', 'salon', 'other')),

  -- Salono/verslo duomenys (nebūtina individualiam kirpėjui)
  salon_name text,
  company_code text,

  -- Verifikacija
  verification_status verification_status not null default 'pending',
  verification_document_url text,       -- Supabase Storage path
  verification_notes text,              -- vartotojo komentaras prie dokumento
  rejection_reason text,                -- admin'o komentaras (jei atmesta)
  verified_at timestamptz,              -- kada patvirtintas
  verified_by uuid references auth.users(id) on delete set null,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_user_profiles_status on user_profiles(verification_status);
create index idx_user_profiles_created on user_profiles(created_at desc);

-- ============================================
-- RLS
-- ============================================
alter table user_profiles enable row level security;

-- Vartotojas mato tik savo profilį
drop policy if exists "Users read own profile" on user_profiles;
create policy "Users read own profile" on user_profiles
  for select using (id = auth.uid());

-- Vartotojas gali atnaujinti tik savo profilį
drop policy if exists "Users update own profile" on user_profiles;
create policy "Users update own profile" on user_profiles
  for update using (id = auth.uid());

-- Vartotojas gali sukurti profilį tik sau
drop policy if exists "Users insert own profile" on user_profiles;
create policy "Users insert own profile" on user_profiles
  for insert with check (id = auth.uid());

-- Adminai mato visus profilius (verifikacijai)
drop policy if exists "Admin full access user_profiles" on user_profiles;
create policy "Admin full access user_profiles" on user_profiles
  for all to authenticated
  using (is_admin())
  with check (is_admin());

-- ============================================
-- Trigger: updated_at automatinis atnaujinimas
-- ============================================
create or replace function update_user_profile_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_update_user_profile_timestamp on user_profiles;
create trigger trg_update_user_profile_timestamp
  before update on user_profiles
  for each row execute function update_user_profile_timestamp();

-- ============================================
-- RPC: Gauti verifikacijos statusą
-- ============================================
-- Read-only funkcija, kurią gali kviesti bet kuris autentifikuotas vartotojas.
-- Grąžina savo profilio verification_status (arba null jei profilio nėra).
-- Naudojama client-side: ar rodyti kainas, ar leisti pirkti.
create or replace function get_my_verification_status()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select verification_status::text
  from user_profiles
  where id = auth.uid();
$$;

grant execute on function get_my_verification_status() to authenticated;

-- ============================================
-- Supabase Storage bucket verifikacijos dokumentams
-- ============================================
-- Privatus bucket'as — dokumentai matomi tik per admin panelę.
insert into storage.buckets (id, name, public, file_size_limit)
values ('verification-docs', 'verification-docs', false, 10485760)
on conflict (id) do nothing;

-- Authenticated vartotojai gali įkelti tik į savo aplanką
drop policy if exists "Users upload own verification docs" on storage.objects;
create policy "Users upload own verification docs" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Vartotojai gali skaityti tik savo dokumentus
drop policy if exists "Users read own verification docs" on storage.objects;
create policy "Users read own verification docs" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'verification-docs'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Adminai mato visus dokumentus (per service role → RLS bypassed, bet
-- pridedam ir explicit'inę politiką dėl admin SSR kliento, kuris naudoja
-- anon key + user sesiją).
drop policy if exists "Admins read all verification docs" on storage.objects;
create policy "Admins read all verification docs" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'verification-docs'
    and is_admin()
  );
