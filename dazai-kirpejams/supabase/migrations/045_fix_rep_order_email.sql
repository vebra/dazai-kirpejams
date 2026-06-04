-- ============================================
-- 045: create_rep_order pataisa — orders.email NOT NULL
-- ============================================
-- Problema: clients.email yra NEBŪTINAS (rep gali sukurti klientą be el. pašto —
-- privalomi tik pavadinimas + telefonas). Bet orders.email yra NOT NULL, o 044
-- įrašinėjo tiesiai v_cli.email → klientui be el. pašto užsakymas krenta
-- (23502 null value in column "email").
--
-- Sprendimas: coalesce(kliento email, REP email iš auth.users, ''). Kai klientas
-- be el. pašto — kontaktu tampa užsakymą pateikusios vadybininkės el. paštas
-- (prasmingas, kontaktuojamas adresas); kraštutiniu atveju tuščias string'as.
-- Kitos logikos NEKEIČIAM. Signatūra ta pati → PostgREST schema reload NEreikia.
--
-- ⚠️ Taikyti per Dashboard SQL Editor.
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
    p_payment_method::payment_method, 'pending',
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
