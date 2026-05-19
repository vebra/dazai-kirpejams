-- ============================================
-- 032: Atominis užsakymo kūrimas (create_order_atomic)
-- ============================================
--
-- ⚠️  REIKIA STAGING DB VERIFIKACIJOS PRIEŠ MERGE Į PRODUKCIJĄ.
--     Ši migracija nebuvo paleista prieš realią DB kuriant ją — prašome
--     pritaikyti staging Supabase, atlikti checkout smoke testą
--     (sėkmė + nepakankamas likutis + blogas kuponas + order_number
--     kolizija) ir tik tada merge'inti.
--
-- KODĖL:
-- Anksčiau checkout'as JS pusėje orkestravo: apply_discount_code →
-- decrement_stock_for_order → orders insert → order_items insert, o
-- nesėkmės atveju „best-effort" kompensavo (restore_stock / revert_discount).
-- Jei kompensacija pati nepavykdavo (tinklas/DB), likdavo nenuosekli būsena:
-- likutis sumažintas užsakymui, kurio nėra, arba kupono used_count
-- sugadintas. plpgsql funkcija veikia VIENOJE transakcijoje — bet koks
-- neperimtas RAISE automatiškai rollback'ina VISKĄ. Taip pašalinam JS
-- kompensaciją iš esmės.
--
-- TIESOS ŠALTINIS: komercinės konstantos (nemokamo pristatymo riba,
-- pristatymo tarifas, PVM tarifas) NEdubliuojamos SQL'e — jos perduodamos
-- parametrais iš `src/lib/commerce/constants.ts`, kad liktų vienas
-- tiesos šaltinis. SQL atlieka tik tą pačią aritmetiką kaip
-- `calculateOrderTotals`.
--
-- GRĄŽINA jsonb:
--   { ok: true, order_id, order_number, subtotal_cents, discount_code,
--     discount_cents, shipping_cents, vat_cents, total_cents }
--   { ok: false, reason: "...", min_order_cents? }   -- kupono/krepšelio klaida
-- Likučio trūkumas / order_number kolizija → RAISE (Postgres klaida),
-- visa transakcija rollback'inasi; caller'is mato klaidą ir (kolizijos
-- atveju) pergeneruoja numerį bei bando vėl.

create or replace function create_order_atomic(
  p_order_number text,
  p_items jsonb,
  p_email text,
  p_phone text,
  p_first_name text,
  p_last_name text,
  p_company_name text,
  p_company_code text,
  p_vat_code text,
  p_delivery_method text,
  p_delivery_address text,
  p_delivery_city text,
  p_delivery_postal_code text,
  p_payment_method text,
  p_locale text,
  p_notes text,
  p_discount_code text,
  p_shipping_base_cents int,
  p_free_shipping_threshold_cents int,
  p_vat_rate numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_subtotal int;
  v_disc jsonb;
  v_discount_cents int := 0;
  v_applied_code text := null;
  v_shipping_cents int;
  v_clamped_discount int;
  v_total_cents int;
  v_vat_cents int;
  v_order_id uuid;
  item jsonb;
begin
  -- 1) Subtotal iš pateiktų prekių (serveris nepasitiki kliento totals)
  select coalesce(
           sum((e->>'unit_price_cents')::int * (e->>'quantity')::int), 0
         )
    into v_subtotal
  from jsonb_array_elements(p_items) e;

  if v_subtotal <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'empty_cart');
  end if;

  -- 2) Nuolaidos kodas (jei pateiktas). apply_discount_code inkrementuoja
  --    used_count TIK kai ok; jei klaida — niekas nepakeista, stock dar
  --    neliestas, saugiai grąžinam reason'ą.
  if p_discount_code is not null and trim(p_discount_code) <> '' then
    v_disc := apply_discount_code(p_discount_code, v_subtotal);
    if not coalesce((v_disc->>'ok')::boolean, false) then
      return jsonb_build_object(
        'ok', false,
        'reason', coalesce(v_disc->>'reason', 'coupon_generic'),
        'min_order_cents', v_disc->'min_order_cents'
      );
    end if;
    v_discount_cents := coalesce((v_disc->>'discount_cents')::int, 0);
    v_applied_code := v_disc->>'code';
  end if;

  -- 3) Likučių mažinimas — RAISE'ina jei nepakanka / produktas neaktyvus.
  --    Esame toje pačioje transakcijoje, todėl raise propaguoja ir
  --    AUTOMATIŠKAI rollback'ina jau pritaikytą kupono used_count.
  perform decrement_stock_for_order(p_items);

  -- 4) Totals — ta pati logika kaip constants.ts `calculateOrderTotals`.
  --    Nemokamo pristatymo riba skaičiuojama nuo subtotal (PRIEŠ nuolaidą),
  --    kad kuponas nepanaikintų teisės į nemokamą pristatymą.
  if v_subtotal >= p_free_shipping_threshold_cents then
    v_shipping_cents := 0;
  else
    v_shipping_cents := p_shipping_base_cents;
  end if;

  v_clamped_discount := greatest(0, least(v_discount_cents, v_subtotal));
  v_total_cents := v_subtotal - v_clamped_discount + v_shipping_cents;

  if p_vat_rate > 0 then
    v_vat_cents := round(
      v_total_cents::numeric - v_total_cents::numeric / (1 + p_vat_rate)
    )::int;
  else
    v_vat_cents := 0;
  end if;

  -- 5) orders insert. order_number unique violation → 23505 propaguoja,
  --    visa funkcija rollback'inasi; caller pergeneruoja numerį, bando vėl.
  insert into orders (
    order_number, email, phone, first_name, last_name,
    company_name, company_code, vat_code,
    delivery_method, delivery_address, delivery_city, delivery_postal_code,
    delivery_country, delivery_cost_cents,
    payment_method, payment_status,
    subtotal_cents, discount_code, discount_cents, vat_cents, total_cents,
    status, locale, notes
  ) values (
    p_order_number, p_email, p_phone, p_first_name, p_last_name,
    p_company_name, p_company_code, p_vat_code,
    p_delivery_method::delivery_method, p_delivery_address, p_delivery_city,
    p_delivery_postal_code,
    'LT', v_shipping_cents,
    p_payment_method::payment_method, 'pending',
    v_subtotal, v_applied_code, v_clamped_discount, v_vat_cents, v_total_cents,
    'pending', p_locale, p_notes
  )
  returning id into v_order_id;

  -- 6) order_items insert
  for item in select * from jsonb_array_elements(p_items)
  loop
    insert into order_items (
      order_id, product_id, product_name, product_sku,
      quantity, unit_price_cents, total_cents
    ) values (
      v_order_id,
      (item->>'product_id')::uuid,
      item->>'name',
      item->>'sku',
      (item->>'quantity')::int,
      (item->>'unit_price_cents')::int,
      (item->>'unit_price_cents')::int * (item->>'quantity')::int
    );
  end loop;

  return jsonb_build_object(
    'ok', true,
    'order_id', v_order_id,
    'order_number', p_order_number,
    'subtotal_cents', v_subtotal,
    'discount_code', v_applied_code,
    'discount_cents', v_clamped_discount,
    'shipping_cents', v_shipping_cents,
    'vat_cents', v_vat_cents,
    'total_cents', v_total_cents
  );
end;
$$;

-- Kviečiama tik iš server action'o per service-role klientą.
grant execute on function create_order_atomic(
  text, jsonb, text, text, text, text, text, text, text, text, text, text,
  text, text, text, text, text, int, int, numeric
) to service_role;
