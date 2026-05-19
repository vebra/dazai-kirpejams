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
  v_res := create_order_atomic(
    'SMOKE-A-' || floor(random() * 1e9)::text,
    jsonb_build_array(jsonb_build_object(
      'product_id', v_pid, 'name', 'SMOKE', 'sku', NULL,
      'unit_price_cents', 1000, 'quantity', 1)),
    'smoke@example.com', '+37060000000', 'Smoke', 'Test',
    NULL, NULL, NULL,
    'pickup', NULL, NULL, NULL,
    'bank_transfer', 'lt', 'smoke-test',
    NULL,            -- p_discount_code
    0,               -- p_shipping_base_cents
    5000,            -- p_free_shipping_threshold_cents
    0                -- p_vat_rate
  );
  if coalesce((v_res->>'ok')::boolean, false) then
    raise notice 'A OK (ok=true): %', v_res;
  else
    raise notice 'A KLAIDA — tikėtasi ok=true, gauta: %', v_res;
  end if;

  -- ---- B) Nepakankamas likutis (qty = stock+1) → turi RAISE ----
  begin
    perform create_order_atomic(
      'SMOKE-B-' || floor(random() * 1e9)::text,
      jsonb_build_array(jsonb_build_object(
        'product_id', v_pid, 'name', 'SMOKE', 'sku', NULL,
        'unit_price_cents', 1000, 'quantity', v_stock + 1)),
      'smoke@example.com', '+37060000000', 'Smoke', 'Test',
      NULL, NULL, NULL,
      'pickup', NULL, NULL, NULL,
      'bank_transfer', 'lt', NULL,
      NULL, 0, 5000, 0
    );
    raise notice 'B KLAIDA — turėjo būti atmesta (RAISE), bet nebuvo';
  exception
    when others then
      raise notice 'B OK — atmesta kaip tikėtasi: %', sqlerrm;
  end;

  -- ---- C) Blogas kuponas → ok=false, reason=not_found ----
  v_res := create_order_atomic(
    'SMOKE-C-' || floor(random() * 1e9)::text,
    jsonb_build_array(jsonb_build_object(
      'product_id', v_pid, 'name', 'SMOKE', 'sku', NULL,
      'unit_price_cents', 1000, 'quantity', 1)),
    'smoke@example.com', '+37060000000', 'Smoke', 'Test',
    NULL, NULL, NULL,
    'pickup', NULL, NULL, NULL,
    'bank_transfer', 'lt', NULL,
    'TIKRAI-NEEGZISTUOJA-XYZ',   -- p_discount_code
    0, 5000, 0
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
