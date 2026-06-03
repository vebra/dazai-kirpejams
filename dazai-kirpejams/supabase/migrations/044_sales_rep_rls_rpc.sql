-- ============================================
-- 044: Vadybininkės funkcionalumas — RLS, trigeris, RPC
-- ============================================
-- Dalis 3/3. Saugumas:
--  - Rep mato/valdo TIK savo klientus ir savo užsakymus.
--  - Rep NEGALI nustatyti/keisti pricing_tier (tik admin).
--  - Rep užsakymai kuriami TIK per create_rep_order (kainos iš product_prices
--    pagal tier SERVERYJE; frontend kainos neperduoda; nėra kainos → RAISE).
--  - Statusą į approved/rejected keičia TIK admin (approve/reject RPC).
-- ⚠️ Taikyti per Dashboard SQL Editor PO 042 ir 043. Idempotentiška.
-- ============================================

-- ───────────────────────────────────────────
-- TRIGERIS: finansiškai jautrūs laukai (pricing_tier, is_vat_payer) — keisti
-- gali TIK admin. Rep insert → forsuojam saugius default'us. (updated_at
-- tvarko bendras set_updated_at trigeris iš migr. 042.)
-- ───────────────────────────────────────────
create or replace function enforce_client_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if not is_admin() then
      new.pricing_tier := 'wholesale_1';   -- rep negali pasirinkti tier
      new.is_vat_payer := false;           -- rep negali nustatyti PVM statuso
    end if;
  elsif tg_op = 'UPDATE' then
    if not is_admin() and (
         new.pricing_tier is distinct from old.pricing_tier
      or new.is_vat_payer is distinct from old.is_vat_payer
    ) then
      raise exception 'Only admin can change pricing_tier / is_vat_payer';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_client_tier on public.clients;
drop trigger if exists trg_client_admin_fields on public.clients;
create trigger trg_client_admin_fields
  before insert or update on public.clients
  for each row execute function enforce_client_admin_fields();

-- ───────────────────────────────────────────
-- RLS: clients — rep tik savo; admin visus
-- ───────────────────────────────────────────
drop policy if exists "clients_rep_select" on public.clients;
create policy "clients_rep_select" on public.clients
  for select to authenticated
  using (is_admin() or created_by = auth.uid());

drop policy if exists "clients_rep_insert" on public.clients;
create policy "clients_rep_insert" on public.clients
  for insert to authenticated
  with check (is_admin() or created_by = auth.uid());

drop policy if exists "clients_rep_update" on public.clients;
create policy "clients_rep_update" on public.clients
  for update to authenticated
  using (is_admin() or created_by = auth.uid())
  with check (is_admin() or created_by = auth.uid());

drop policy if exists "clients_admin_delete" on public.clients;
create policy "clients_admin_delete" on public.clients
  for delete to authenticated
  using (is_admin());   -- trinti gali TIK admin (rep tik kuria/redaguoja)

-- ───────────────────────────────────────────
-- RLS: product_prices — skaito rep+admin; rašo tik admin
-- ───────────────────────────────────────────
drop policy if exists "product_prices_read" on public.product_prices;
create policy "product_prices_read" on public.product_prices
  for select to authenticated
  using (
    is_admin()
    or exists (
      select 1 from public.user_profiles up
      where up.id = auth.uid() and up.role = 'sales_rep'
    )
  );

drop policy if exists "product_prices_admin_write" on public.product_prices;
create policy "product_prices_admin_write" on public.product_prices
  for all to authenticated
  using (is_admin())
  with check (is_admin());

-- ───────────────────────────────────────────
-- RLS: orders — rep mato TIK savo (addityvu prie esamų admin politikų)
-- (Rep NEturi insert/update per RLS — kūrimas/patvirtinimas tik per RPC.)
-- ───────────────────────────────────────────
drop policy if exists "orders_rep_select_own" on public.orders;
create policy "orders_rep_select_own" on public.orders
  for select to authenticated
  using (placed_by = auth.uid());

-- ───────────────────────────────────────────
-- RPC: create_rep_order — kainos iš product_prices pagal kliento tier
-- Frontend perduoda TIK [{product_id, quantity}] + client_id. Be kainos.
-- ───────────────────────────────────────────
create or replace function create_rep_order(
  p_client_id uuid,
  p_items jsonb,                      -- [{ "product_id": uuid, "quantity": int }]
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

  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'EMPTY_CART';
  end if;

  -- order_number generuojamas SERVERYJE (ne iš frontendo); retry per koliziją
  loop
    v_order_number := 'DK-' || to_char(now(), 'YYMMDD') || '-' ||
                      lpad((floor(random() * 1000000))::int::text, 6, '0');
    exit when not exists (select 1 from orders where order_number = v_order_number);
  end loop;

  -- Sukuriam užsakymą (approval_status = pending; sandėlis NEliečiamas)
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
    v_order_number, v_cli.email, v_cli.phone, v_cli.name, '',
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

  -- Pristatymas
  if v_subtotal >= p_free_shipping_threshold_cents then
    v_shipping_cents := 0;
  else
    v_shipping_cents := p_shipping_base_cents;
  end if;
  -- PVM: product_prices = NETO (be PVM). Vietiniam LT pardavimui PVM imamas
  -- VISIEMS klientams (ne tik PVM mokėtojams) — p_vat_rate iš constants.ts.
  -- is_vat_payer + vat_code saugomi sąskaitai / ateities ES reverse-charge
  -- (jei atsiras užsienio ES klientų — tada reikės clients.country + 0% logikos).
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

-- ───────────────────────────────────────────
-- RPC: approve_rep_order — TIK admin; nuskaito sandėlį.
-- SVARBU: kainų NEperkainuoja — order_items kainos lieka tokios, kokias
-- rep matė pateikdama (užfiksuotos create_rep_order metu). Keičia tik statusą.
-- ───────────────────────────────────────────
create or replace function approve_rep_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status order_approval_status;
  v_items jsonb;
begin
  if not is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  select approval_status into v_status from orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_status is distinct from 'pending' then
    raise exception 'NOT_PENDING (status=%)', v_status;
  end if;

  -- Sukuriam p_items decrement_stock_for_order formatu iš order_items
  select coalesce(jsonb_agg(jsonb_build_object(
           'product_id', oi.product_id, 'quantity', oi.quantity)), '[]'::jsonb)
    into v_items
  from order_items oi where oi.order_id = p_order_id;

  -- Nuskaitom sandėlį (RAISE jei neužtenka → admin negali patvirtinti)
  perform decrement_stock_for_order(v_items);

  update orders
    set approval_status = 'approved',
        approved_by = auth.uid(),
        approved_at = now(),
        updated_at = now()
  where id = p_order_id;

  return jsonb_build_object('ok', true, 'order_id', p_order_id);
end;
$$;

-- ───────────────────────────────────────────
-- RPC: reject_rep_order — TIK admin; sandėlio neliečia
-- ───────────────────────────────────────────
create or replace function reject_rep_order(p_order_id uuid, p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status order_approval_status;
begin
  if not is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  select approval_status into v_status from orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_status is distinct from 'pending' then
    raise exception 'NOT_PENDING (status=%)', v_status;
  end if;

  update orders
    set approval_status = 'rejected',
        approved_by = auth.uid(),
        approved_at = now(),
        rejection_reason = p_reason,   -- rep mato priežastį; sandėlis nepaliestas
        updated_at = now()
  where id = p_order_id;

  return jsonb_build_object('ok', true, 'order_id', p_order_id);
end;
$$;

grant execute on function create_rep_order(uuid, jsonb, text, text, text, text, text, text, text, int, int, numeric) to authenticated;
grant execute on function approve_rep_order(uuid) to authenticated;
grant execute on function reject_rep_order(uuid, text) to authenticated;
