-- ============================================
-- 065: Checkout kainos imamos iš DB + rep cash/card žymimas apmokėtu
-- ============================================
-- 1) create_order_atomic (kaip 049) PASITIKĖDAVO kliento atsiųstu
--    unit_price_cents — buvo galima pateikti užsakymą bet kokia kaina.
--    Dabar kaina, pavadinimas ir SKU imami iš products SERVERYJE
--    (akcijos kaina pagal tą pačią taisyklę kaip getEffectivePriceCents:
--    sale_price_cents galioja kai 0 < sale < price). Jei kliento krepšelio
--    suma nesutampa su tikra (pasikeitė kaina / bandymas manipuliuoti) —
--    užsakymas atmetamas su reason='price_mismatch', kad pirkėjas nebūtų
--    tyliai apmokestintas kita suma nei matė.
--    Tas pats principas kaip create_rep_order (044), kuris nuo pradžių
--    kainas ima iš product_prices.
--
-- 2) create_rep_order: grynais/kortele apmokėjimas žymimas payment_status
--    ='paid' PAČIOJE funkcijoje. Iki šiol tai bandė daryti rep actions.ts
--    per sesijos klientą, bet rep turi tik SELECT policy ant orders →
--    RLS update'ą tyliai nukirpdavo (0 rows, be klaidos) ir visi grynųjų
--    pardavimai likdavo „laukia apmokėjimo".
--
-- Signatūros nesikeičia. p_items 'name'/'sku'/'unit_price_cents' iš kliento
-- nebenaudojami įrašymui (tik palyginimui) — app payload keisti nereikia.
--
-- ⚠️ Taikyti per Dashboard SQL Editor.
-- ============================================

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
  v_items jsonb;
  v_claimed int;
  v_subtotal int;
  v_disc jsonb;
  v_discount_cents int := 0;
  v_applied_code text := null;
  v_shipping_cents int;
  v_clamped_discount int;
  v_total_cents int;
  v_vat_cents int;
  v_order_id uuid;
  v_bal int;
  item jsonb;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'empty_cart');
  end if;

  -- Patikimas krepšelis: kaina/pavadinimas/SKU iš products, ne iš kliento.
  -- INNER JOIN su is_active — neaktyvi ar neegzistuojanti prekė iškrenta,
  -- tai pagaunam palygindami eilučių skaičių.
  select jsonb_agg(
           jsonb_build_object(
             'product_id', p.id,
             'name', case p_locale
                       when 'en' then coalesce(nullif(p.name_en, ''), p.name_lt)
                       when 'ru' then coalesce(nullif(p.name_ru, ''), p.name_lt)
                       else p.name_lt
                     end,
             'sku', p.sku,
             'quantity', (e->>'quantity')::int,
             'unit_price_cents',
               case
                 when p.sale_price_cents is not null
                  and p.sale_price_cents > 0
                  and p.sale_price_cents < p.price_cents
                 then p.sale_price_cents
                 else p.price_cents
               end
           )
         )
    into v_items
  from jsonb_array_elements(p_items) e
  join products p
    on p.id = (e->>'product_id')::uuid
   and p.is_active = true;

  if v_items is null
     or jsonb_array_length(v_items) <> jsonb_array_length(p_items) then
    return jsonb_build_object('ok', false, 'reason', 'product_unavailable');
  end if;

  select coalesce(
           sum((e->>'unit_price_cents')::int * (e->>'quantity')::int), 0
         )
    into v_subtotal
  from jsonb_array_elements(v_items) e;

  if v_subtotal <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'empty_cart');
  end if;

  -- Kliento deklaruota suma turi sutapti su tikra — kitaip pirkėjas matytų
  -- vieną kainą, o būtų apmokestintas kita (arba tai manipuliacijos bandymas).
  select coalesce(
           sum((e->>'unit_price_cents')::int * (e->>'quantity')::int), 0
         )
    into v_claimed
  from jsonb_array_elements(p_items) e;

  if v_claimed <> v_subtotal then
    return jsonb_build_object(
      'ok', false, 'reason', 'price_mismatch',
      'expected_subtotal_cents', v_subtotal
    );
  end if;

  if p_discount_code is not null and trim(p_discount_code) <> '' then
    v_disc := apply_discount_code_v2(p_discount_code, v_items);
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

  perform decrement_stock_for_order(v_items);

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

  for item in select * from jsonb_array_elements(v_items)
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

    -- Pardavimo įrašas į judėjimo žurnalą (likutis jau sumažintas aukščiau)
    select stock_quantity into v_bal
    from products where id = (item->>'product_id')::uuid;

    insert into stock_movements (product_id, delta, balance_after, reason, source)
    values (
      (item->>'product_id')::uuid,
      -1 * (item->>'quantity')::int,
      v_bal,
      'sale',
      p_order_number
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

-- ============================================
-- create_rep_order — kaip 045, + payment_status pagal mokėjimo būdą
-- ============================================
create or replace function create_rep_order(
  p_client_id uuid,
  p_items jsonb,
  p_delivery_method text,
  p_delivery_address text,
  p_delivery_city text,
  p_delivery_postal_code text,
  p_payment_method text,
  p_locale text,
  p_notes text,
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
  v_uid uuid := auth.uid();
  v_is_rep boolean;
  v_tier text;
  v_cli record;
  v_email text;
  v_payment_status text;
  v_subtotal int := 0;
  v_shipping_cents int;
  v_vat_cents int;
  v_total_cents int;
  v_order_id uuid;
  v_order_number text;
  it jsonb;
  v_pid uuid;
  v_qty int;
  v_price int;
  v_name text;
  v_sku text;
begin
  if v_uid is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  v_is_rep := exists (
    select 1 from public.user_profiles
    where id = v_uid and role = 'sales_rep'
  );
  if not (v_is_rep or is_admin()) then
    raise exception 'NOT_SALES_REP';
  end if;

  -- Klientas + savininkystė + tier
  select * into v_cli
  from public.clients
  where id = p_client_id and (created_by = v_uid or is_admin());
  if not found then
    raise exception 'CLIENT_NOT_FOUND_OR_FORBIDDEN';
  end if;
  v_tier := v_cli.pricing_tier;

  -- orders.email NOT NULL, o klientas gali būti be el. pašto. Fallback:
  -- kliento email → vadybininkės (placed_by) email → ''.
  v_email := coalesce(
    nullif(btrim(v_cli.email), ''),
    (select au.email from auth.users au where au.id = v_uid),
    ''
  );

  -- Grynais / kortele — vadybininkė pinigus surinko vietoje, žymim apmokėtu
  -- ČIA (definer teisės). Anksčiau tai darė actions.ts sesijos klientu, bet
  -- rep neturi UPDATE policy ant orders → RLS tyliai nukirpdavo (0 rows).
  v_payment_status := case
    when p_payment_method in ('cash', 'card') then 'paid'
    else 'pending'
  end;

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  -- order_number generuojamas SERVERYJE; retry per koliziją
  loop
    v_order_number := 'DK-' || to_char(now(), 'YYMMDD') || '-' ||
                      lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (select 1 from orders where order_number = v_order_number);
  end loop;

  insert into orders (
    order_number, email, phone, first_name, last_name,
    company_name, vat_code,
    delivery_method, delivery_address, delivery_city, delivery_postal_code,
    delivery_country, delivery_cost_cents,
    payment_method, payment_status,
    subtotal_cents, vat_cents, total_cents,
    status, approval_status, client_id, placed_by,
    locale, notes
  ) values (
    v_order_number, v_email, v_cli.phone, v_cli.name, '',
    v_cli.name, v_cli.vat_code,
    p_delivery_method::delivery_method, p_delivery_address, p_delivery_city,
    p_delivery_postal_code, 'LT', 0,
    p_payment_method::payment_method, v_payment_status,
    0, 0, 0,
    'pending', 'pending', p_client_id, v_uid,
    p_locale, p_notes
  )
  returning id into v_order_id;

  -- Prekės: kaina iš product_prices pagal tier. Nėra → RAISE (visa rollback).
  for it in select * from jsonb_array_elements(p_items)
  loop
    v_pid := (it->>'product_id')::uuid;
    v_qty := (it->>'quantity')::int;
    if v_qty is null or v_qty <= 0 then
      raise exception 'INVALID_QUANTITY for product %', v_pid;
    end if;

    select pp.price_cents, p.name_lt, p.sku
      into v_price, v_name, v_sku
    from public.product_prices pp
    join public.products p on p.id = pp.product_id
    where pp.product_id = v_pid and pp.tier = v_tier and p.is_active = true;

    if v_price is null then
      raise exception 'NO_PRICE_FOR_TIER product=% tier=%', v_pid, v_tier;
    end if;

    insert into order_items (
      order_id, product_id, product_name, product_sku,
      quantity, unit_price_cents, total_cents
    ) values (
      v_order_id, v_pid, v_name, v_sku,
      v_qty, v_price, v_price * v_qty
    );

    v_subtotal := v_subtotal + v_price * v_qty;
  end loop;

  if v_subtotal <= 0 then
    raise exception 'EMPTY_CART';
  end if;

  if v_subtotal >= p_free_shipping_threshold_cents then
    v_shipping_cents := 0;
  else
    v_shipping_cents := p_shipping_base_cents;
  end if;

  if p_vat_rate > 0 then
    v_vat_cents := round((v_subtotal + v_shipping_cents)::numeric * p_vat_rate)::int;
  else
    v_vat_cents := 0;
  end if;
  v_total_cents := v_subtotal + v_shipping_cents + v_vat_cents;

  update orders
    set subtotal_cents = v_subtotal,
        delivery_cost_cents = v_shipping_cents,
        vat_cents = v_vat_cents,
        total_cents = v_total_cents
  where id = v_order_id;

  return jsonb_build_object(
    'ok', true,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'subtotal_cents', v_subtotal,
    'shipping_cents', v_shipping_cents,
    'vat_cents', v_vat_cents,
    'total_cents', v_total_cents
  );
end;
$$;

-- ============================================
-- Vienkartinis istorinių duomenų pataisymas: rep grynais/kortele užsakymai,
-- kurie dėl RLS bug'o liko 'pending' (turėjo būti 'paid' nuo sukūrimo).
-- placed_by not null = tik vadybininkės užsakymai; viešų neliečiam.
-- ============================================
update orders
   set payment_status = 'paid', updated_at = now()
 where placed_by is not null
   and payment_method in ('cash', 'card')
   and payment_status = 'pending';

notify pgrst, 'reload schema';
