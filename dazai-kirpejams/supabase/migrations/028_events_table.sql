-- ============================================
-- Migracija 028 — renginių lentelė (editable)
-- ============================================
--
-- Iki šiol renginio duomenys buvo hardcoded'inti `src/lib/events/config.ts`
-- (DAZU_PREZENTACIJA_2026). Šita migracija perkelia juos į DB, kad admin'as
-- galėtų redaguoti per /admin/renginiai puslapį.
--
-- Schema: PK = slug (atitinka `event_registrations.event_slug` FK semantiką
-- be hard constraint'o, kad istoriniai registracijų įrašai išliktų net jei
-- renginys ištrintas). `is_active` su partial unique index užtikrina, kad
-- vienu metu būtų tik vienas aktyvus renginys.

create table if not exists events (
  slug                text primary key,
  is_active           boolean not null default true,

  title               text not null,
  short_title         text not null,
  description         text not null,

  -- Datos saugomos kaip UTC timestamptz. Vilniaus laikas atkuriamas
  -- per `Intl.DateTimeFormat('lt-LT', { timeZone: 'Europe/Vilnius' })`.
  starts_at           timestamptz not null,
  ends_at             timestamptz not null,

  venue_name          text not null,
  venue_street        text not null,
  venue_city          text not null,
  venue_country       text not null default 'LT',
  venue_postal_code   text,

  presenter_name      text not null,
  presenter_title     text not null,

  is_free             boolean not null default true,
  capacity_min        int not null default 0,
  capacity_max        int not null default 100,
  contact_email       text not null,

  -- Santykinis kelias public puslapiui (pvz. /renginys)
  path                text not null default '/renginys',

  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Tik vienas aktyvus renginys vienu metu — partial unique index
-- (filter'inam tik aktyvius, kad pasibaigę su is_active=false netrukdytų).
create unique index if not exists events_one_active_uniq
  on events ((true))
  where is_active = true;

create index if not exists events_starts_at_idx on events (starts_at);

-- RLS
alter table events enable row level security;

-- Public read — viešas puslapis ir sitemap reikalauja info be login'o.
drop policy if exists "Public read events" on events;
create policy "Public read events" on events
  for select
  using (true);

-- Rašymas — tik admin'ams (naudoja jau egzistuojančią is_admin() funkciją).
drop policy if exists "Admins manage events" on events;
create policy "Admins manage events" on events
  for all to authenticated
  using (is_admin())
  with check (is_admin());

-- Seed: dabartinis DAZU_PREZENTACIJA_2026 iš src/lib/events/config.ts.
-- 2026-05-17 10:00–15:00 Europe/Vilnius EEST (UTC+03:00) →
-- starts_at = 2026-05-17T07:00:00Z, ends_at = 2026-05-17T12:00:00Z.
insert into events (
  slug, is_active,
  title, short_title, description,
  starts_at, ends_at,
  venue_name, venue_street, venue_city, venue_country, venue_postal_code,
  presenter_name, presenter_title,
  is_free, capacity_min, capacity_max, contact_email,
  path
) values (
  'dazu-prezentacija-kaune-2026-05-17',
  true,
  'Color SHOCK dažų prezentacija Kaune',
  'Dažų prezentacija Kaune',
  'Gyva profesionalių Color SHOCK plaukų dažų prezentacija Kaune su dažymo technikų demonstracija ant gyvo modelio. Aptarsime oksidantų variantus ir 180 ml pakuotės naudą salonui. Įėjimas nemokamas, būtina registracija.',
  '2026-05-17 07:00:00+00',
  '2026-05-17 12:00:00+00',
  'Įvaizdžio salonas 313 „Rolė"',
  'Kipro Petrausko g. 44',
  'Kaunas',
  'LT',
  null,
  'Džiuljeta Vėbrė',
  'Color SHOCK technologė-atstovė',
  true,
  30,
  50,
  'info@dziuljetavebre.lt',
  '/renginys'
)
on conflict (slug) do nothing;

-- Auto-update timestamp
create or replace function events_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_updated_at on events;
create trigger events_updated_at
  before update on events
  for each row execute function events_set_updated_at();
