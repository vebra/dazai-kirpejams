-- ============================================
-- Dažai Kirpėjams - Admin access (RLS)
-- ============================================
--
-- Variantas 2: admin'ų sąrašas DB lentelėje, RLS politikos iškviečia
-- `is_admin()` helper'į. Bootstrap'as (pirmas admin'as) sukuriamas per
-- scripts/create-admin.ts su SERVICE_ROLE key'u (apeina RLS).
--
-- Šis failas yra idempotentiškas — galima pritaikyti kelis kartus.

-- ============================================
-- ADMIN USERS
-- ============================================
create table if not exists admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz default now()
);

create index if not exists idx_admin_users_email on admin_users(email);

alter table admin_users enable row level security;

-- Admin'ai mato tik save (chicken-and-egg apėjimas — bootstrap per service role).
-- Toks siauras SELECT užtenka, nes realų allow-list'o tikrinimą daro `is_admin()`
-- function'as per SECURITY DEFINER.
drop policy if exists "Users can read own admin row" on admin_users;
create policy "Users can read own admin row" on admin_users
  for select using (id = auth.uid());

-- ============================================
-- IS_ADMIN() HELPER
-- ============================================
-- SECURITY DEFINER leidžia funkcijai matyti visą admin_users lentelę,
-- nepaisant RLS. search_path fiksuotas, kad išvengtume search_path
-- injekcijų (Postgres security definer best practice).
create or replace function is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from admin_users where id = auth.uid()
  );
$$;

-- Leidžiame iškviesti autentifikuotiems vartotojams (anon naudotojams negrąžins true)
grant execute on function is_admin() to authenticated;
grant execute on function is_admin() to anon;

-- ============================================
-- ADMIN POLICIES — visi CRUD veiksmai admin'ams
-- ============================================
-- Svarbu: `for all` apima SELECT/INSERT/UPDATE/DELETE vienoje politikoje.
-- Reikia ir `using` (skaitymui/trynimui/atnaujinimui), ir `with check`
-- (įterpimui/atnaujinimui) — abu `is_admin()`, kad nekiltų asimetrijų.

drop policy if exists "Admin full access orders" on orders;
create policy "Admin full access orders" on orders
  for all to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admin full access order_items" on order_items;
create policy "Admin full access order_items" on order_items
  for all to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admin manage products" on products;
create policy "Admin manage products" on products
  for all to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admin manage categories" on categories;
create policy "Admin manage categories" on categories
  for all to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admin manage brands" on brands;
create policy "Admin manage brands" on brands
  for all to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admin read b2b_inquiries" on b2b_inquiries;
create policy "Admin read b2b_inquiries" on b2b_inquiries
  for all to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admin read contact_messages" on contact_messages;
create policy "Admin read contact_messages" on contact_messages
  for all to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admin manage newsletter_subscribers" on newsletter_subscribers;
create policy "Admin manage newsletter_subscribers" on newsletter_subscribers
  for all to authenticated
  using (is_admin())
  with check (is_admin());

drop policy if exists "Admin manage blog_posts" on blog_posts;
create policy "Admin manage blog_posts" on blog_posts
  for all to authenticated
  using (is_admin())
  with check (is_admin());
