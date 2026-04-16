-- ============================================
-- INVOICES — PVM sąskaitos faktūros
-- ============================================
--
-- Kiekvienam apmokėtam užsakymui išrašoma viena sąskaita faktūra. Saugome
-- „snapshot" duomenis (seller + buyer + line items), nes sąskaitos turinys
-- pagal LR apskaitos įstatymą turi būti nekintamas — net jei įmonės arba
-- kliento duomenys vėliau pasikeis.
--
-- Numeracija: `SF-{year}-{NNNN}`, atominiai per `invoice_counters` lentelę.
-- Sekuencija kiekvieniems metams iš naujo prasideda nuo 0001.

create table if not exists invoice_counters (
  year int primary key,
  last_number int not null default 0,
  updated_at timestamptz default now()
);

alter table invoice_counters enable row level security;

-- Counter'iai keičiami tik per SECURITY DEFINER funkciją žemiau —
-- RLS uždaro tiesioginę prieigą net admin'ams, kad išvengtume
-- rankinio tampymo ir skylių numeracijoje.
drop policy if exists "No direct invoice counter access" on invoice_counters;
create policy "No direct invoice counter access" on invoice_counters
  for all to authenticated
  using (false)
  with check (false);

-- ============================================
-- Atominė kito sąskaitos numerio generacija
-- ============================================
--
-- ON CONFLICT DO UPDATE ... RETURNING garantuoja atomiškumą per
-- PostgreSQL row-level lock'ą ant primary key — jei du procesai
-- vienu metu kviečia funkciją, vienas laukia kito commit'o ir
-- gauna kitą numerį. Numeracijos skylių nebus.
create or replace function next_invoice_number()
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  current_year int := extract(year from now())::int;
  next_num int;
begin
  insert into invoice_counters (year, last_number)
  values (current_year, 1)
  on conflict (year) do update
    set last_number = invoice_counters.last_number + 1,
        updated_at = now()
  returning last_number into next_num;

  return format('SF-%s-%s', current_year, lpad(next_num::text, 4, '0'));
end;
$$;

-- Kviesti funkciją gali bet kuris authenticated vartotojas, bet
-- server action'as papildomai patikrina `requireAdmin()` prieš
-- kvietimą — RLS ant `invoices` insert garantuoja, kad anonimas
-- negalės piktnaudžiauti.
revoke all on function next_invoice_number() from public;
grant execute on function next_invoice_number() to authenticated;

-- ============================================
-- INVOICES table
-- ============================================

create table if not exists invoices (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references orders(id) on delete restrict,

  -- Sąskaitos numeris (unikalus, generuojamas per next_invoice_number())
  invoice_number text unique not null,
  issued_at timestamptz not null default now(),

  -- Pardavėjo duomenų „snapshot" išrašymo momentu. Atitinka
  -- CompanyInfo struktūrą iš shop_settings, bet užsifiksuotas — jei
  -- admin'as vėliau pakeičia rekvizitus, senos sąskaitos lieka tokios,
  -- kokios buvo išrašytos.
  seller_snapshot jsonb not null,
  -- Pirkėjo duomenų snapshot — iš orders lentelės kopijuojami tuo pačiu
  -- principu. Apima tiek asmenį, tiek įmonę (B2B).
  buyer_snapshot jsonb not null,
  -- Prekių sąrašo snapshot — name, sku, quantity, unit_price_cents, total_cents
  items_snapshot jsonb not null,

  -- Sumų snapshot — duplikuotas iš orders, kad sąskaita būtų
  -- pilnai savarankiška (galima atspausdinti vien iš invoices eilutės)
  subtotal_cents int not null,
  discount_cents int not null default 0,
  delivery_cost_cents int not null default 0,
  vat_cents int not null,
  vat_rate numeric(5, 2) not null default 21.00,
  total_cents int not null,

  -- PDF saugojimas — Etape 2 bus užpildyta
  pdf_path text,
  pdf_generated_at timestamptz,

  -- Būsena: 'issued' (išrašyta), 'cancelled' (anuliuota — kreditiniai ateityje)
  status text not null default 'issued'
    check (status in ('issued', 'cancelled')),

  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Vienam užsakymui — viena sąskaita. Kreditiniai ateityje bus
  -- atskira lentelė `credit_notes`, referencinga į `invoices`.
  constraint uq_invoices_order unique (order_id)
);

create index idx_invoices_order on invoices(order_id);
create index idx_invoices_number on invoices(invoice_number);
create index idx_invoices_issued on invoices(issued_at desc);

-- RLS
alter table invoices enable row level security;

-- Admin'ai — pilna prieiga (is_admin() helper iš 004_admin_access.sql)
drop policy if exists "Admins manage invoices" on invoices;
create policy "Admins manage invoices" on invoices
  for all to authenticated
  using (is_admin())
  with check (is_admin());

-- Savininkas gali skaityti savo sąskaitas per atitinkamą order'į
-- (jungtis pagal email, nes orders neturi user_id).
-- Etape 3 naudosim šią politiką kliento paskyroje.
drop policy if exists "Users read own invoices" on invoices;
create policy "Users read own invoices" on invoices
  for select to authenticated
  using (
    exists (
      select 1 from orders o
      where o.id = invoices.order_id
        and o.email = (select auth.jwt() ->> 'email')
    )
  );
