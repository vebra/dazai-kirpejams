-- ============================================
-- 078: Audito P3 pataisos — tiekėjo priėmimo atomiškumas + kuponų grąžinimas
-- ============================================
-- B5/B6: tiekėjo užsakymo priėmimas buvo dviejų žingsnių app'e (likutis per
--   RPC + `received` žyma atskiru update be lock) — žymos klaida būdavo
--   nuryjama, o du įrenginiai skenuodami lygiagrečiai perrašydavo vienas kito
--   žymas (lost update) → „Priimti visas likusias" pridėdavo kiekį dukart.
--   Dabar visa operacija — vienas atominis RPC su FOR UPDATE.
-- B8: kupono used_count niekada nebūdavo grąžinamas atšaukus/ištrynus
--   užsakymą — ribotas kuponas „sudegdavo". Grąžinimas įsiūtas į
--   restore_stock_by_order_id (idempotencija per tą patį stock_restored),
--   o reaktyvavimas (redecrement) kuponą vėl paima.
--
-- ⚠️ Taikyti per Supabase Dashboard SQL Editor.

-- ───────────────────────────────────────────
-- Pagalbinė: užsakymo statusas iš details jsonb
-- ───────────────────────────────────────────
create or replace function supplier_order_status(p_details jsonb)
returns text
language sql
immutable
as $$
  select case
    when coalesce(
      (select sum(coalesce((e->>'received')::int, 0))
       from jsonb_array_elements(coalesce(p_details, '[]'::jsonb)) e), 0) = 0
      then 'ordered'
    when (select bool_and(
            coalesce((e->>'received')::int, 0) >= coalesce((e->>'qty')::int, 0))
          from jsonb_array_elements(coalesce(p_details, '[]'::jsonb)) e)
      then 'received'
    else 'partial'
  end
$$;

-- ───────────────────────────────────────────
-- receive_supplier_order_item — vienos prekės priėmimas ATOMIŠKAI
-- ───────────────────────────────────────────
-- Užrakina supplier_orders eilutę (FOR UPDATE) → likutis + žurnalas +
-- received žyma + statusas vienoje transakcijoje. Lygiagretūs kvietimai
-- (du skeneriai) rikiuojasi į eilę, žymos nebeprarandamos.
create or replace function receive_supplier_order_item(
  p_order_id uuid,
  p_product_id uuid,
  p_delta int default 1
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_details jsonb;
  v_idx int := -1;
  v_received int;
  v_qty int;
  v_name text;
  v_stock int;
  v_status text;
  i int;
begin
  if not is_admin() then
    raise exception 'NOT_ADMIN';
  end if;
  if p_delta is null or p_delta <= 0 or p_delta > 100000 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_delta');
  end if;

  select details into v_details
  from supplier_orders where id = p_order_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'order_not_found');
  end if;

  for i in 0 .. coalesce(jsonb_array_length(v_details), 0) - 1 loop
    if v_details->i->>'productId' = p_product_id::text then
      v_idx := i;
      exit;
    end if;
  end loop;
  if v_idx = -1 then
    return jsonb_build_object('ok', false, 'reason', 'item_not_found');
  end if;

  -- Likutis tik auga (mažinimas — per Reviziją), kaip 052 funkcijoje
  update products
    set stock_quantity = coalesce(stock_quantity, 0) + p_delta,
        is_in_stock = true,
        updated_at = now()
  where id = p_product_id
  returning name_lt, stock_quantity into v_name, v_stock;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'product_not_found');
  end if;

  insert into stock_movements (product_id, delta, balance_after, reason, source)
  values (p_product_id, p_delta, v_stock, 'receiving', 'Tiekėjo užsakymas');

  v_received := coalesce((v_details->v_idx->>'received')::int, 0) + p_delta;
  v_qty := coalesce((v_details->v_idx->>'qty')::int, 0);
  v_details := jsonb_set(
    v_details, array[v_idx::text, 'received'], to_jsonb(v_received));

  v_status := supplier_order_status(v_details);
  update supplier_orders
    set details = v_details, status = v_status
  where id = p_order_id;

  return jsonb_build_object(
    'ok', true, 'name', v_name, 'stock', v_stock,
    'received', v_received, 'qty', v_qty, 'status', v_status
  );
end;
$$;

grant execute on function receive_supplier_order_item(uuid, uuid, int) to authenticated;

-- ───────────────────────────────────────────
-- receive_supplier_order_all — visų likusių prekių priėmimas ATOMIŠKAI
-- ───────────────────────────────────────────
create or replace function receive_supplier_order_all(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_details jsonb;
  v_remaining int;
  v_pid uuid;
  v_stock int;
  v_units int := 0;
  v_touched int := 0;
  v_status text;
  i int;
begin
  if not is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  select details into v_details
  from supplier_orders where id = p_order_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'order_not_found');
  end if;

  for i in 0 .. coalesce(jsonb_array_length(v_details), 0) - 1 loop
    v_remaining := coalesce((v_details->i->>'qty')::int, 0)
                   - coalesce((v_details->i->>'received')::int, 0);
    if v_remaining <= 0 then
      continue;
    end if;
    v_pid := (v_details->i->>'productId')::uuid;

    update products
      set stock_quantity = coalesce(stock_quantity, 0) + v_remaining,
          is_in_stock = true,
          updated_at = now()
    where id = v_pid
    returning stock_quantity into v_stock;
    if not found then
      -- Ištrinta prekė — praleidžiam (kaip senoje app logikoje)
      continue;
    end if;

    insert into stock_movements (product_id, delta, balance_after, reason, source)
    values (v_pid, v_remaining, v_stock, 'receiving', 'Tiekėjo užsakymas');

    v_details := jsonb_set(
      v_details, array[i::text, 'received'], v_details->i->'qty');
    v_units := v_units + v_remaining;
    v_touched := v_touched + 1;
  end loop;

  v_status := supplier_order_status(v_details);
  update supplier_orders
    set details = v_details, status = v_status
  where id = p_order_id;

  return jsonb_build_object(
    'ok', true, 'received_units', v_units,
    'items_touched', v_touched, 'status', v_status
  );
end;
$$;

grant execute on function receive_supplier_order_all(uuid) to authenticated;

-- ───────────────────────────────────────────
-- set_supplier_order_received — rankinė žymos korekcija ATOMIŠKAI
-- ───────────────────────────────────────────
-- Likučio NEKEIČIA (kaip ir anksčiau) — tik received žymą + statusą su lock'u.
create or replace function set_supplier_order_received(
  p_order_id uuid,
  p_product_id uuid,
  p_received int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_details jsonb;
  v_idx int := -1;
  v_status text;
  i int;
begin
  if not is_admin() then
    raise exception 'NOT_ADMIN';
  end if;
  if p_received is null or p_received < 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_received');
  end if;

  select details into v_details
  from supplier_orders where id = p_order_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'order_not_found');
  end if;

  for i in 0 .. coalesce(jsonb_array_length(v_details), 0) - 1 loop
    if v_details->i->>'productId' = p_product_id::text then
      v_idx := i;
      exit;
    end if;
  end loop;
  if v_idx = -1 then
    return jsonb_build_object('ok', false, 'reason', 'item_not_found');
  end if;

  v_details := jsonb_set(
    v_details, array[v_idx::text, 'received'], to_jsonb(p_received));
  v_status := supplier_order_status(v_details);
  update supplier_orders
    set details = v_details, status = v_status
  where id = p_order_id;

  return jsonb_build_object('ok', true, 'received', p_received, 'status', v_status);
end;
$$;

grant execute on function set_supplier_order_received(uuid, uuid, int) to authenticated;

-- ───────────────────────────────────────────
-- restore_stock_by_order_id v3 — kaip 062 + kupono grąžinimas (B8)
-- ───────────────────────────────────────────
create or replace function restore_stock_by_order_id(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_already_restored boolean;
  v_order_number text;
  v_placed_by uuid;
  v_appr order_approval_status;
  v_discount_code text;
  v_has_rep_sale boolean;
  v_is_rep boolean;
  v_bal int;
  v_wh int;
  item record;
begin
  select stock_restored, order_number, placed_by, approval_status, discount_code
    into v_already_restored, v_order_number, v_placed_by, v_appr, v_discount_code
  from orders
  where id = p_order_id
  for update;

  if not found then
    return false;
  end if;
  if v_already_restored then
    return true;
  end if;

  -- Ar šis užsakymas buvo nurašytas iš vadybininkės atsargų?
  v_has_rep_sale := exists (
    select 1 from stock_movements
    where source = v_order_number and reason = 'rep_sale'
  );
  v_is_rep := v_placed_by is not null and exists (
    select 1 from user_profiles where id = v_placed_by and role = 'sales_rep'
  );

  if v_has_rep_sale then
    -- Vadybininkės pardavimas atšauktas → prekės grįžta į JOS atsargas
    -- (rep_sale_cancel). Centrinis sandėlis neliečiamas.
    for item in
      select product_id, quantity from order_items where order_id = p_order_id
    loop
      select stock_quantity into v_wh from products where id = item.product_id;
      insert into stock_movements (product_id, delta, balance_after, reason, source, rep_id)
      values (item.product_id, item.quantity, v_wh, 'rep_sale_cancel',
              v_order_number, v_placed_by);
    end loop;

  elsif v_is_rep and v_appr is distinct from 'approved' then
    -- Nepatvirtintas vadybininkės užsakymas — niekas nebuvo nurašyta, nieko
    -- negrąžinam (tik pažymim, kad apdorota).
    null;

  else
    -- Paprastas užsakymas (arba senas patvirtintas rep užsakymas iš sandėlio) —
    -- grąžinam į centrinį sandėlį, kaip anksčiau.
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
  end if;

  -- B8: kupono panaudojimas grąžinamas — ribotas (max_uses) kuponas nebe
  -- „sudega" ant atšauktų/ištrintų užsakymų. Idempotencija — per tą patį
  -- stock_restored flag'ą (antrą kartą čia nepateksim).
  if v_discount_code is not null and btrim(v_discount_code) <> '' then
    update discount_codes
      set used_count = greatest(used_count - 1, 0)
    where code = v_discount_code;
  end if;

  update orders set stock_restored = true, updated_at = now() where id = p_order_id;
  return true;
end;
$$;

grant execute on function restore_stock_by_order_id(uuid) to service_role;

-- ───────────────────────────────────────────
-- redecrement_stock_by_order_id v2 — kaip 076 + kupono paėmimas atgal (B8)
-- ───────────────────────────────────────────
create or replace function redecrement_stock_by_order_id(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_bal int;
  item record;
begin
  select * into v_order from orders where id = p_order_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'order_not_found');
  end if;

  if v_order.approval_status is not null then
    return jsonb_build_object('ok', false, 'reason', 'rep_order');
  end if;

  if not coalesce(v_order.stock_restored, false) then
    return jsonb_build_object('ok', true, 'already', true);
  end if;

  -- 1) Pre-check: užrakinam ir patikrinam VISAS eilutes prieš keisdami bet ką
  for item in
    select oi.product_id, oi.quantity, p.stock_quantity, p.name_lt
    from order_items oi
    join products p on p.id = oi.product_id
    where oi.order_id = p_order_id
    for update of p
  loop
    if coalesce(item.stock_quantity, 0) < item.quantity then
      return jsonb_build_object(
        'ok', false, 'reason', 'insufficient_stock',
        'product', item.name_lt,
        'stock', coalesce(item.stock_quantity, 0),
        'needed', item.quantity
      );
    end if;
  end loop;

  -- 2) Apply
  for item in
    select product_id, quantity from order_items where order_id = p_order_id
  loop
    update products
      set stock_quantity = stock_quantity - item.quantity,
          is_in_stock = (stock_quantity - item.quantity) > 0,
          updated_at = now()
    where id = item.product_id
    returning stock_quantity into v_bal;

    insert into stock_movements (product_id, delta, balance_after, reason, source, note)
    values (item.product_id, -item.quantity, v_bal, 'sale', v_order.order_number,
            'Reaktyvuotas atšauktas užsakymas');
  end loop;

  -- B8 simetriška pusė: reaktyvuojant kuponas vėl paimamas (restore jį grąžino)
  if v_order.discount_code is not null and btrim(v_order.discount_code) <> '' then
    update discount_codes
      set used_count = used_count + 1
    where code = v_order.discount_code;
  end if;

  update orders
    set stock_restored = false, updated_at = now()
  where id = p_order_id;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function redecrement_stock_by_order_id(uuid) to service_role;

notify pgrst, 'reload schema';
