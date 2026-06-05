-- ============================================
-- 049: Sandelio judėjimo žurnalas (stock_movements)
-- ============================================
-- Kiekvienas likučio pokytis fiksuojamas: priėmimas (+), pardavimas (−),
-- grąžinimas po atšaukimo (+), rankinė korekcija (±). Suteikia istoriją ir
-- ataskaitas „kas, kada, kiek, kodėl".
--
-- reason reikšmės: 'receiving' | 'sale' | 'cancel_restore' | 'correction'
-- source: barkodo 'scanner', užsakymo numeris, admin pastaba ir pan.
--
-- ⚠️ Taikyti per Supabase Dashboard SQL Editor.

create table if not exists stock_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  delta int not null,
  balance_after int,
  reason text not null,
  source text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_stock_movements_product
  on stock_movements(product_id, created_at desc);
create index if not exists idx_stock_movements_created
  on stock_movements(created_at desc);

-- RLS: rašo tik SECURITY DEFINER funkcijos (insert policy nėra); skaityti gali
-- tik admin.
alter table stock_movements enable row level security;

drop policy if exists stock_movements_admin_read on stock_movements;
create policy stock_movements_admin_read
  on stock_movements for select
  to authenticated
  using (is_admin());

-- ============================================
-- receive_stock_by_ean — priėmimas + žurnalas
-- ============================================
create or replace function receive_stock_by_ean(
  p_ean text,
  p_delta int default 1
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_name text;
  v_sku text;
  v_stock int;
begin
  if not is_admin() then
    raise exception 'NOT_ADMIN';
  end if;
  if p_ean is null or btrim(p_ean) = '' then
    raise exception 'EMPTY_EAN';
  end if;

  update products
    set stock_quantity = coalesce(stock_quantity, 0) + p_delta,
        is_in_stock = (coalesce(stock_quantity, 0) + p_delta) > 0,
        updated_at = now()
  where id = (
    select id from products where ean = btrim(p_ean) limit 1
  )
  returning id, name_lt, sku, stock_quantity
    into v_id, v_name, v_sku, v_stock;

  if not found then
    return jsonb_build_object('ok', true, 'found', false);
  end if;

  insert into stock_movements (product_id, delta, balance_after, reason, source)
  values (v_id, p_delta, v_stock, 'receiving', 'scanner');

  return jsonb_build_object(
    'ok', true, 'found', true,
    'product_id', v_id, 'name', v_name, 'sku', v_sku, 'stock', v_stock
  );
end;
$$;

grant execute on function receive_stock_by_ean(text, int) to authenticated;

-- ============================================
-- restore_stock_by_order_id — grąžinimas + žurnalas
-- ============================================
create or replace function restore_stock_by_order_id(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_already_restored boolean;
  v_order_number text;
  v_bal int;
  item record;
begin
  select stock_restored, order_number into v_already_restored, v_order_number
  from orders
  where id = p_order_id
  for update;

  if not found then
    return false;
  end if;
  if v_already_restored then
    return true;
  end if;

  for item in
    select product_id, quantity from order_items where order_id = p_order_id
  loop
    update products
    set stock_quantity = stock_quantity + item.quantity,
        is_in_stock = true,
        updated_at = now()
    where id = item.product_id
    returning stock_quantity into v_bal;

    insert into stock_movements (product_id, delta, balance_after, reason, source)
    values (item.product_id, item.quantity, v_bal, 'cancel_restore', v_order_number);
  end loop;

  update orders set stock_restored = true, updated_at = now() where id = p_order_id;
  return true;
end;
$$;

grant execute on function restore_stock_by_order_id(uuid) to service_role;

-- ============================================
-- set_product_stock — rankinė korekcija + žurnalas
-- ============================================
create or replace function set_product_stock(
  p_product_id uuid,
  p_new_stock int,
  p_source text default 'admin',
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old int;
  v_delta int;
begin
  if p_new_stock is null or p_new_stock < 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_stock');
  end if;

  select stock_quantity into v_old from products where id = p_product_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  update products
    set stock_quantity = p_new_stock,
        is_in_stock = p_new_stock > 0,
        updated_at = now()
  where id = p_product_id;

  v_delta := p_new_stock - coalesce(v_old, 0);
  if v_delta <> 0 then
    insert into stock_movements (product_id, delta, balance_after, reason, source, note)
    values (p_product_id, v_delta, p_new_stock, 'correction', p_source, p_note);
  end if;

  return jsonb_build_object('ok', true, 'stock', p_new_stock, 'delta', v_delta);
end;
$$;

grant execute on function set_product_stock(uuid, int, text, text) to service_role;

-- ============================================
-- create_order_atomic — kaip 048, + pardavimo įrašai į žurnalą
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

notify pgrst, 'reload schema';
