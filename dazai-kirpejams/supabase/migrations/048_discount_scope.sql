-- ============================================
-- 048: Nuolaidų kodų apimtis — išrinktoms prekėms / kategorijoms
-- ============================================
--
-- Iki šiol kuponas taikėsi VISAM krepšeliui. Pridedam galimybę apriboti kuponą
-- konkrečiomis prekėmis (product_ids) ir/ar kategorijomis (category_ids). Jei
-- abu tušti/null — kuponas galioja visoms prekėms (kaip anksčiau).
--
-- Naujos v2 funkcijos priima krepšelio prekes (p_items jsonb), kad nuolaida
-- būtų skaičiuojama TIK nuo tinkamų prekių sumos. Senas (text,int) versijas
-- paliekam, kad niekas nesulūžtų, bet jų nebenaudosim.
--
-- p_items formatas:
--   [{ "product_id": uuid, "unit_price_cents": int, "quantity": int }, ...]

-- 1) Naujos kolonos
alter table discount_codes
  add column if not exists product_ids uuid[],
  add column if not exists category_ids uuid[];

comment on column discount_codes.product_ids is
  'Jei nustatyta — kuponas galioja tik šioms prekėms (nuolaida nuo jų sumos).';
comment on column discount_codes.category_ids is
  'Jei nustatyta — kuponas galioja šių kategorijų prekėms.';

-- ============================================
-- 2) validate_discount_code_v2 — read-only (krepšelio peržiūrai)
-- ============================================
create or replace function validate_discount_code_v2(
  p_code text,
  p_items jsonb
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_code discount_codes%rowtype;
  v_normalized_code text;
  v_full int;
  v_eligible int;
  v_discount_cents int;
  v_scoped boolean;
  v_now timestamptz := now();
begin
  if p_code is null or trim(p_code) = '' then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  v_normalized_code := upper(trim(p_code));

  select * into v_code from discount_codes where code = v_normalized_code;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if not v_code.is_active then
    return jsonb_build_object('ok', false, 'reason', 'inactive');
  end if;
  if v_code.valid_from is not null and v_code.valid_from > v_now then
    return jsonb_build_object('ok', false, 'reason', 'too_early');
  end if;
  if v_code.valid_until is not null and v_code.valid_until < v_now then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;
  if v_code.max_uses is not null and v_code.used_count >= v_code.max_uses then
    return jsonb_build_object('ok', false, 'reason', 'max_uses_reached');
  end if;

  -- Pilna krepšelio suma
  select coalesce(sum((e->>'unit_price_cents')::int * (e->>'quantity')::int), 0)
    into v_full
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) e;

  if v_full <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_cart');
  end if;

  -- Min. užsakymas tikrinamas nuo pilnos krepšelio sumos
  if v_full < v_code.min_order_cents then
    return jsonb_build_object(
      'ok', false, 'reason', 'min_order_not_met',
      'min_order_cents', v_code.min_order_cents
    );
  end if;

  -- Ar kuponas apribotas?
  v_scoped :=
    (v_code.product_ids is not null and cardinality(v_code.product_ids) > 0)
    or (v_code.category_ids is not null and cardinality(v_code.category_ids) > 0);

  if not v_scoped then
    v_eligible := v_full;
  else
    select coalesce(sum((e->>'unit_price_cents')::int * (e->>'quantity')::int), 0)
      into v_eligible
    from jsonb_array_elements(p_items) e
    where (
        v_code.product_ids is not null
        and (e->>'product_id')::uuid = any(v_code.product_ids)
      )
      or (
        v_code.category_ids is not null and exists (
          select 1 from products pr
          where pr.id = (e->>'product_id')::uuid
            and pr.category_id = any(v_code.category_ids)
        )
      );
  end if;

  if v_eligible <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'no_eligible_items');
  end if;

  if v_code.discount_type = 'percent' then
    v_discount_cents := floor(v_eligible * v_code.value / 100.0);
  else
    v_discount_cents := least(v_code.value, v_eligible);
  end if;
  if v_discount_cents > v_eligible then
    v_discount_cents := v_eligible;
  end if;

  return jsonb_build_object(
    'ok', true,
    'code', v_code.code,
    'discount_type', v_code.discount_type,
    'value', v_code.value,
    'discount_cents', v_discount_cents
  );
end;
$$;

grant execute on function validate_discount_code_v2(text, jsonb) to authenticated;
grant execute on function validate_discount_code_v2(text, jsonb) to anon;

-- ============================================
-- 3) apply_discount_code_v2 — atomiškas (used_count++)
-- ============================================
create or replace function apply_discount_code_v2(
  p_code text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code discount_codes%rowtype;
  v_normalized_code text;
  v_full int;
  v_eligible int;
  v_discount_cents int;
  v_scoped boolean;
  v_now timestamptz := now();
begin
  if p_code is null or trim(p_code) = '' then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  v_normalized_code := upper(trim(p_code));

  select * into v_code from discount_codes
  where code = v_normalized_code
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if not v_code.is_active then
    return jsonb_build_object('ok', false, 'reason', 'inactive');
  end if;
  if v_code.valid_from is not null and v_code.valid_from > v_now then
    return jsonb_build_object('ok', false, 'reason', 'too_early');
  end if;
  if v_code.valid_until is not null and v_code.valid_until < v_now then
    return jsonb_build_object('ok', false, 'reason', 'expired');
  end if;
  if v_code.max_uses is not null and v_code.used_count >= v_code.max_uses then
    return jsonb_build_object('ok', false, 'reason', 'max_uses_reached');
  end if;

  select coalesce(sum((e->>'unit_price_cents')::int * (e->>'quantity')::int), 0)
    into v_full
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) e;

  if v_full <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_cart');
  end if;

  if v_full < v_code.min_order_cents then
    return jsonb_build_object(
      'ok', false, 'reason', 'min_order_not_met',
      'min_order_cents', v_code.min_order_cents
    );
  end if;

  v_scoped :=
    (v_code.product_ids is not null and cardinality(v_code.product_ids) > 0)
    or (v_code.category_ids is not null and cardinality(v_code.category_ids) > 0);

  if not v_scoped then
    v_eligible := v_full;
  else
    select coalesce(sum((e->>'unit_price_cents')::int * (e->>'quantity')::int), 0)
      into v_eligible
    from jsonb_array_elements(p_items) e
    where (
        v_code.product_ids is not null
        and (e->>'product_id')::uuid = any(v_code.product_ids)
      )
      or (
        v_code.category_ids is not null and exists (
          select 1 from products pr
          where pr.id = (e->>'product_id')::uuid
            and pr.category_id = any(v_code.category_ids)
        )
      );
  end if;

  if v_eligible <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'no_eligible_items');
  end if;

  if v_code.discount_type = 'percent' then
    v_discount_cents := floor(v_eligible * v_code.value / 100.0);
  else
    v_discount_cents := least(v_code.value, v_eligible);
  end if;
  if v_discount_cents > v_eligible then
    v_discount_cents := v_eligible;
  end if;

  update discount_codes
    set used_count = used_count + 1
    where id = v_code.id;

  return jsonb_build_object(
    'ok', true,
    'code', v_code.code,
    'discount_type', v_code.discount_type,
    'value', v_code.value,
    'discount_cents', v_discount_cents
  );
end;
$$;

grant execute on function apply_discount_code_v2(text, jsonb) to service_role;

-- ============================================
-- 4) create_order_atomic — kviečia apply_discount_code_v2 su p_items
-- ============================================
-- Identiškas 032 versijai, pakeista TIK nuolaidos eilutė (89): vietoj
-- apply_discount_code(p_code, v_subtotal) → apply_discount_code_v2(p_code, p_items).
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
  select coalesce(
           sum((e->>'unit_price_cents')::int * (e->>'quantity')::int), 0
         )
    into v_subtotal
  from jsonb_array_elements(p_items) e;

  if v_subtotal <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'empty_cart');
  end if;

  if p_discount_code is not null and trim(p_discount_code) <> '' then
    v_disc := apply_discount_code_v2(p_discount_code, p_items);
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

  perform decrement_stock_for_order(p_items);

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

grant execute on function create_order_atomic(
  text, jsonb, text, text, text, text, text, text, text, text, text, text,
  text, text, text, text, text, int, int, numeric
) to service_role;

notify pgrst, 'reload schema';
