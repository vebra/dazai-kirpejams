-- ============================================
-- 024: Event registrations — dažų prezentacijos Kaune registracijos
-- ============================================
--
-- Lentelė laiko registracijas viešiems renginiams (pirmas — 2026-05-17
-- Color SHOCK prezentacija Kaune pas Džiuljetą Vėbrę). Struktūra pakankamai
-- generinė, kad galėtume ateityje pridėti daugiau renginių be naujos
-- schemos — tik naujas `event_slug` + reklama.
--
-- `event_slug` indeksuotas, kad admin filtravimas būtų greitas, net kai
-- turėsim kelis renginius vienu metu.
--
-- Priminimo logika: `reminder_sent_at` pradžioje NULL; cron (priminimas
-- likus 1 d iki renginio) atnaujina į now() tik ką įvykdytoms eilutėms.
-- Tai užkerta dubliuotus siuntimus, jei cron paleidžiamas kelis kartus.
--
-- `unique (event_slug, email)` — apsaugo nuo atsitiktinio dvigubo submit'o
-- (Enter Enter su tam pačiu email). Ne griežtas biznio taisyklės kriterijus,
-- tiesiog UX apsauga.

create table if not exists event_registrations (
  id uuid primary key default uuid_generate_v4(),
  event_slug text not null,
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text not null,
  salon_name text,
  role text, -- 'kirpejas' | 'koloristas' | 'savininkas' | 'kita'
  guests_count int not null default 0, -- kiek papildomų kolegų atsives (0 = vienas)
  locale text not null default 'lt',
  status text not null default 'confirmed', -- 'confirmed' | 'cancelled' | 'attended' | 'no_show'
  reminder_sent_at timestamptz,
  notes text, -- admin pastabos
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  unique (event_slug, email),
  check (guests_count >= 0 and guests_count <= 10),
  check (status in ('confirmed', 'cancelled', 'attended', 'no_show'))
);

create index if not exists event_registrations_event_slug_idx
  on event_registrations (event_slug);

create index if not exists event_registrations_status_idx
  on event_registrations (status);

create index if not exists event_registrations_created_at_idx
  on event_registrations (created_at desc);

-- RLS: tik service-role skaito/rašo. Viešas insert'as vyksta per server
-- action'ą (naudoja service role ssr klientą), admin'as — per admin auth
-- patikrą aukščiau route sluoksnyje.
alter table event_registrations enable row level security;

-- Niekas iš anon/authenticated kontekstų neturi tiesioginio priėjimo
create policy "event_registrations_service_only_select"
  on event_registrations for select
  using (false);

create policy "event_registrations_service_only_insert"
  on event_registrations for insert
  with check (false);

create policy "event_registrations_service_only_update"
  on event_registrations for update
  using (false);

-- `updated_at` atnaujinamas iš app kodo (server action), kaip ir kitose
-- projekto lentelėse — triggerių projekte nėra.
