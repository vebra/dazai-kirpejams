-- ============================================
-- SMOKE TESTAS: create_order_atomic (migracija 032)
-- ============================================
--
-- KADA: paleisti STAGING Supabase SQL Editor'iuje PO to, kai pritaikyta
--       migracija 032_atomic_create_order.sql.
--
-- KAS: patikrina 3 scenarijus prieš REALŲ aktyvų produktą, BET viskas
--      vyksta viename `begin; ... rollback;` bloke — staging DB lieka
--      NEPALIESTA (jokių užsakymų, likutis nepakitęs).
--
-- KAIP SKAITYTI: žiūrėkite „Messages/Notices" skiltį po paleidimo.
--   A scenarijus turi grąžinti ok=true.
--   B scenarijus turi BŪTI ATMESTAS (RAISE) — likučio trūkumas.
--   C scenarijus turi grąžinti ok=false, reason=not_found (blogas kuponas).
--   Galutinis SELECT turi rodyti smoke_orders = 1 (tik A), o po ROLLBACK
--   net ir tas dingsta.
--
-- SVARBU: jei matote „nerasta aktyvaus produkto su stock>=2" — staging'e
--         nėra tinkamo produkto; laikinai padidinkite kažkurio produkto
--         stock_quantity arba seed'inkite ir kartokite.
--
-- Priklausomybės (turi egzistuoti): decrement_stock_for_order (006),
-- apply_discount_code (009), create_order_atomic (032).

begin;

do $$
declare
  v_pid    uuid;
  v_stock  int;
  v_res    jsonb;
begin
  -- 0) Patikra: ar migracija 032 pritaikyta (funkcija egzistuoja)?
  if not exists (
    select 1 from pg_proc where proname = 'create_order_atomic'
  ) then
    raise exception
      'SMOKE: funkcija create_order_atomic NERASTA — pirma pritaikykite migraciją 032_atomic_create_order.sql';
  end if;

  -- Realus aktyvus produktas su pakankamu likučiu (jo pakeitimai bus
  -- atšaukti ROLLBACK'u pabaigoje).
  select id, coalesce(stock_quantity, 0)
    into v_pid, v_stock
  from products
  where is_active and coalesce(stock_quantity, 0) >= 2
  order by stock_quantity desc
  limit 1;

  if v_pid is null then
    raise exception 'SMOKE: nerasta aktyvaus produkto su stock>=2';
  end if;
  raise notice 'SMOKE: testinis produktas % (stock=%)', v_pid, v_stock;

  -- ---- A) Sėkmingas užsakymas, qty=1, be kupono ----
  -- Vardinė notacija (=>) — Postgres kiekvieną literalą coerce'ina į
  -- deklaruotą parametro tipą, todėl nebėra „unknown"/integer↔numeric
  -- funkcijos resolution problemos.
  v_res := create_order_atomic(
    p_order_number => 'SMOKE-A-' || floor(random() * 1e9)::text,
    p_items => jsonb_build_array(jsonb_build_object(
      'product_id', v_pid, 'name', 'SMOKE', 'sku', NULL,
      'unit_price_cents', 1000, 'quantity', 1)),
    p_email => 'smoke@example.com',
    p_phone => '+37060000000',
    p_first_name => 'Smoke',
    p_last_name => 'Test',
    p_company_name => NULL,
    p_company_code => NULL,
    p_vat_code => NULL,
    p_delivery_method => 'pickup',
    p_delivery_address => NULL,
    p_delivery_city => NULL,
    p_delivery_postal_code => NULL,
    p_payment_method => 'bank_transfer',
    p_locale => 'lt',
    p_notes => 'smoke-test',
    p_discount_code => NULL,
    p_shipping_base_cents => 0,
    p_free_shipping_threshold_cents => 5000,
    p_vat_rate => 0
  );
  if coalesce((v_res->>'ok')::boolean, false) then
    raise notice 'A OK (ok=true): %', v_res;
  else
    raise notice 'A KLAIDA — tikėtasi ok=true, gauta: %', v_res;
  end if;

  -- ---- B) Nepakankamas likutis (qty = stock+1) → turi RAISE ----
  begin
    perform create_order_atomic(
      p_order_number => 'SMOKE-B-' || floor(random() * 1e9)::text,
      p_items => jsonb_build_array(jsonb_build_object(
        'product_id', v_pid, 'name', 'SMOKE', 'sku', NULL,
        'unit_price_cents', 1000, 'quantity', v_stock + 1)),
      p_email => 'smoke@example.com',
      p_phone => '+37060000000',
      p_first_name => 'Smoke',
      p_last_name => 'Test',
      p_company_name => NULL,
      p_company_code => NULL,
      p_vat_code => NULL,
      p_delivery_method => 'pickup',
      p_delivery_address => NULL,
      p_delivery_city => NULL,
      p_delivery_postal_code => NULL,
      p_payment_method => 'bank_transfer',
      p_locale => 'lt',
      p_notes => NULL,
      p_discount_code => NULL,
      p_shipping_base_cents => 0,
      p_free_shipping_threshold_cents => 5000,
      p_vat_rate => 0
    );
    raise notice 'B KLAIDA — turėjo būti atmesta (RAISE), bet nebuvo';
  exception
    when others then
      raise notice 'B OK — atmesta kaip tikėtasi: %', sqlerrm;
  end;

  -- ---- C) Blogas kuponas → ok=false, reason=not_found ----
  v_res := create_order_atomic(
    p_order_number => 'SMOKE-C-' || floor(random() * 1e9)::text,
    p_items => jsonb_build_array(jsonb_build_object(
      'product_id', v_pid, 'name', 'SMOKE', 'sku', NULL,
      'unit_price_cents', 1000, 'quantity', 1)),
    p_email => 'smoke@example.com',
    p_phone => '+37060000000',
    p_first_name => 'Smoke',
    p_last_name => 'Test',
    p_company_name => NULL,
    p_company_code => NULL,
    p_vat_code => NULL,
    p_delivery_method => 'pickup',
    p_delivery_address => NULL,
    p_delivery_city => NULL,
    p_delivery_postal_code => NULL,
    p_payment_method => 'bank_transfer',
    p_locale => 'lt',
    p_notes => NULL,
    p_discount_code => 'TIKRAI-NEEGZISTUOJA-XYZ',
    p_shipping_base_cents => 0,
    p_free_shipping_threshold_cents => 5000,
    p_vat_rate => 0
  );
  if (v_res->>'ok')::boolean is not true
     and v_res->>'reason' = 'not_found' then
    raise notice 'C OK (ok=false, reason=not_found): %', v_res;
  else
    raise notice 'C KLAIDA — tikėtasi ok=false/not_found, gauta: %', v_res;
  end if;
end $$;

-- Per šią (būsimą rollback'inamą) transakciją turi būti tik A užsakymas.
select count(*) as smoke_orders_in_tx
from orders
where order_number like 'SMOKE-A-%';

-- VISKA atšaukiam — staging DB lieka tiksliai tokia, kokia buvo.
rollback;

-- Po ROLLBACK papildomas saugiklis: įsitikinkite, kad NIEKO neliko.
-- (Turi grąžinti 0.)
select count(*) as smoke_orders_persisted
from orders
where order_number like 'SMOKE-%';
