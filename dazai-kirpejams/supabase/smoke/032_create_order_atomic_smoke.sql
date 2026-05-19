-- ============================================
-- SMOKE TESTAS: create_order_atomic (migracija 032)
-- ============================================
--
-- KADA: STAGING Supabase SQL Editor'iuje PO migracijos 032.
--
-- KAIP: pažymėkite VISKĄ ir Run. Rezultatas grįžta LENTELE (Supabase
--       editor nerodo NOTICE pranešimų, todėl reportas — result set).
--
-- KAIP SKAITYTI: stulpelis `result`:
--   A_success         → PASS  (užsakymas sukurtas, ok=true)
--   B_insufficient    → PASS  (likučio trūkumas atmestas / RAISE)
--   C_bad_coupon      → PASS  (blogas kuponas: ok=false, not_found)
-- Jei bet kuris FAIL — NEmerge'inti; atsiųskite lentelę.
--
-- SAUGU: kiekvienas scenarijus atšaukiamas per vidinį subtransaction
--        (savepoint) — DB lieka NEPALIESTA (jokių užsakymų, likutis
--        nepakitęs). Reporto eilutės išlieka (RETURN NEXT tuplestore
--        nėra transakcinis).

create or replace function pg_temp.smoke_032()
returns table(step text, result text, detail text)
language plpgsql
as $fn$
declare
  v_pid   uuid;
  v_stock int;
  v_res   jsonb;
begin
  -- 0) Ar migracija 032 pritaikyta?
  if not exists (
    select 1 from pg_proc where proname = 'create_order_atomic'
  ) then
    step := 'PRECHECK'; result := 'FAIL';
    detail := 'create_order_atomic NERASTA — pritaikykite migraciją 032';
    return next; return;
  end if;

  -- Realus aktyvus produktas su pakankamu likučiu.
  select id, coalesce(stock_quantity, 0)
    into v_pid, v_stock
  from products
  where is_active and coalesce(stock_quantity, 0) >= 2
  order by stock_quantity desc
  limit 1;

  if v_pid is null then
    step := 'SETUP'; result := 'FAIL';
    detail := 'nerasta aktyvaus produkto su stock>=2';
    return next; return;
  end if;
  step := 'SETUP'; result := 'INFO';
  detail := 'produktas ' || v_pid || ' stock=' || v_stock;
  return next;

  -- ---- A) Sėkmingas užsakymas, qty=1 (rašymai atšaukiami) ----
  begin
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
      step := 'A_success'; result := 'PASS'; detail := v_res::text;
    else
      step := 'A_success'; result := 'FAIL';
      detail := 'tikėtasi ok=true, gauta: ' || v_res::text;
    end if;
    return next;
    raise exception 'SMOKE_UNDO';   -- atšaukiam A rašymus (savepoint)
  exception
    when others then
      if sqlerrm <> 'SMOKE_UNDO' then
        step := 'A_success'; result := 'FAIL';
        detail := 'netikėta klaida: ' || sqlerrm;
        return next;
      end if;
  end;

  -- ---- B) Nepakankamas likutis (qty = stock+1) → turi būti atmesta ----
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
    step := 'B_insufficient'; result := 'FAIL';
    detail := 'turėjo būti atmesta, bet užsakymas sukurtas';
    return next;
  exception
    when others then
      step := 'B_insufficient'; result := 'PASS';
      detail := 'atmesta kaip tikėtasi: ' || sqlerrm;
      return next;
  end;

  -- ---- C) Blogas kuponas → ok=false, reason=not_found ----
  begin
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
      step := 'C_bad_coupon'; result := 'PASS'; detail := v_res::text;
    else
      step := 'C_bad_coupon'; result := 'FAIL';
      detail := 'tikėtasi ok=false/not_found, gauta: ' || v_res::text;
    end if;
    return next;
    raise exception 'SMOKE_UNDO';
  exception
    when others then
      if sqlerrm <> 'SMOKE_UNDO' then
        step := 'C_bad_coupon'; result := 'FAIL';
        detail := 'netikėta klaida: ' || sqlerrm;
        return next;
      end if;
  end;

  return;
end;
$fn$;

select * from pg_temp.smoke_032();
