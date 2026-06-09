-- ============================================
-- 062: Konsignacija — patvirtintas vadybininkės užsakymas nurašo iš JOS atsargų
-- ============================================
-- Modelis: vadybininkei prekės IŠDUODAMOS iš sandėlio (issue_to_rep — sandėlis −,
-- jos atsargos +). Ji prekiauja iš savo atsargų. Kai adminas PATVIRTINA jos
-- užsakymą, prekės nurašomos iš JOS ATSARGŲ (ne iš centrinio sandėlio — jis jau
-- sumažėjo išduodant). Jei jai neužtenka — patvirtinti negalima (blokuojama).
--
-- Atsargų (held) judėjimai stock_movements lentelėje, žymimi rep_id:
--   issue_to_rep     held +   (sandėlis −)
--   return_from_rep  held −   (sandėlis +)   — grąžino į sandėlį
--   rep_sale         held −   (sandėlis 0)   — pardavė klientui (patvirtinta)
--   rep_sale_cancel  held +   (sandėlis 0)   — pardavimas atšauktas, grįžo į atsargas
--
-- ⚠️ Taikyti per Supabase Dashboard SQL Editor.

-- ───────────────────────────────────────────
-- rep_held(rep, product) — kiek vadybininkė šiuo metu turi konkrečios prekės.
-- Vienas skaičiavimo šaltinis visoms vietoms (atsargos, grąžinimas, pardavimas).
-- ───────────────────────────────────────────
create or replace function rep_held(p_rep_id uuid, p_product_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(sum(
           case when reason in ('issue_to_rep', 'rep_sale_cancel')
                then abs(delta) else -abs(delta) end
         ), 0)::int
  from stock_movements
  where rep_id = p_rep_id
    and product_id = p_product_id
    and reason in ('issue_to_rep', 'return_from_rep', 'rep_sale', 'rep_sale_cancel');
$$;

grant execute on function rep_held(uuid, uuid) to authenticated, service_role;

-- ───────────────────────────────────────────
-- get_my_issued_stock — vadybininkės turimos atsargos (neto pagal visus judėjimus)
-- ───────────────────────────────────────────
create or replace function get_my_issued_stock()
returns table (
  product_id uuid,
  name text,
  sku text,
  color_number text,
  issued int,
  last_at timestamptz
)
language sql
security definer
set search_path = public
stable
as $$
  select m.product_id, p.name_lt, p.sku, p.color_number,
         sum(case when m.reason in ('issue_to_rep', 'rep_sale_cancel')
                  then abs(m.delta) else -abs(m.delta) end)::int as issued,
         max(m.created_at) as last_at
  from stock_movements m
  join products p on p.id = m.product_id
  where m.reason in ('issue_to_rep', 'return_from_rep', 'rep_sale', 'rep_sale_cancel')
    and m.rep_id = auth.uid()
  group by m.product_id, p.name_lt, p.sku, p.color_number
  having sum(case when m.reason in ('issue_to_rep', 'rep_sale_cancel')
                  then abs(m.delta) else -abs(m.delta) end) > 0
  order by max(m.created_at) desc;
$$;

grant execute on function get_my_issued_stock() to authenticated;

-- ───────────────────────────────────────────
-- return_stock_from_rep_batch — pre-check dabar per rep_held() (įskaito pardavimus)
-- ───────────────────────────────────────────
create or replace function return_stock_from_rep_batch(
  p_items jsonb,
  p_rep text,
  p_rep_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jsonb;
  v_pid uuid;
  v_qty int;
  v_held int;
  v_bal int;
  v_name text;
  v_results jsonb := '[]'::jsonb;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'empty');
  end if;
  if p_rep_id is null then
    return jsonb_build_object('ok', false, 'reason', 'no_rep');
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_pid := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::int;
    if v_qty is null or v_qty <= 0 then
      return jsonb_build_object('ok', false, 'reason', 'invalid_qty', 'product_id', v_pid);
    end if;

    select name_lt into v_name from products where id = v_pid for update;
    if not found then
      return jsonb_build_object('ok', false, 'reason', 'not_found', 'product_id', v_pid);
    end if;

    v_held := rep_held(p_rep_id, v_pid);
    if v_qty > v_held then
      return jsonb_build_object('ok', false, 'reason', 'exceeds_held',
        'product_id', v_pid, 'held', v_held, 'name', v_name);
    end if;
  end loop;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_pid := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::int;
    update products
      set stock_quantity = coalesce(stock_quantity, 0) + v_qty,
          is_in_stock = (coalesce(stock_quantity, 0) + v_qty) > 0,
          updated_at = now()
    where id = v_pid
    returning stock_quantity, name_lt into v_bal, v_name;

    insert into stock_movements (product_id, delta, balance_after, reason, source, rep_id)
    values (v_pid, v_qty, v_bal, 'return_from_rep',
            coalesce(nullif(btrim(p_rep), ''), 'Vadybininkė'), p_rep_id);

    v_results := v_results || jsonb_build_object(
      'product_id', v_pid, 'qty', v_qty, 'balance', v_bal, 'name', v_name);
  end loop;

  return jsonb_build_object('ok', true, 'items', v_results);
end;
$$;

grant execute on function return_stock_from_rep_batch(jsonb, text, uuid) to service_role;

-- ───────────────────────────────────────────
-- approve_rep_order — nurašo iš VADYBININKĖS atsargų (ne iš centrinio sandėlio).
-- Blokuoja, jei jai neužtenka. Įrašo 'rep_sale' judėjimą (sandėlis neliečiamas).
-- ───────────────────────────────────────────
create or replace function approve_rep_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status order_approval_status;
  v_placed_by uuid;
  v_order_number text;
  v_held int;
  v_wh int;
  it record;
begin
  if not is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  select approval_status, placed_by, order_number
    into v_status, v_placed_by, v_order_number
  from orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_status is distinct from 'pending' then
    raise exception 'NOT_PENDING (status=%)', v_status;
  end if;
  if v_placed_by is null then
    raise exception 'NO_REP_ON_ORDER';
  end if;

  -- 1) PRE-CHECK: ar vadybininkė turi pakankamai KIEKVIENOS prekės atsargose.
  for it in select product_id, quantity, product_name from order_items where order_id = p_order_id
  loop
    if it.product_id is null then
      raise exception 'ITEM_WITHOUT_PRODUCT';
    end if;
    v_held := rep_held(v_placed_by, it.product_id);
    if it.quantity > v_held then
      raise exception 'INSUFFICIENT_REP_STOCK product=% name=% held=% need=%',
        it.product_id, it.product_name, v_held, it.quantity;
    end if;
  end loop;

  -- 2) APPLY: nurašom iš atsargų (rep_sale). Centrinis sandėlis NELIEČIAMAS —
  --    balance_after = esamas sandėlio likutis (nepakitęs), informaciniam žurnalui.
  for it in select product_id, quantity from order_items where order_id = p_order_id
  loop
    select stock_quantity into v_wh from products where id = it.product_id;
    insert into stock_movements (product_id, delta, balance_after, reason, source, rep_id)
    values (it.product_id, -it.quantity, v_wh, 'rep_sale', v_order_number, v_placed_by);
  end loop;

  update orders
    set approval_status = 'approved',
        approved_by = auth.uid(),
        approved_at = now(),
        updated_at = now()
  where id = p_order_id;

  return jsonb_build_object('ok', true, 'order_id', p_order_id);
end;
$$;

grant execute on function approve_rep_order(uuid) to authenticated;

-- ───────────────────────────────────────────
-- restore_stock_by_order_id — atšaukus/grąžinus užsakymą grąžinam ten, iš kur buvo
-- nurašyta: vadybininkės pardavimą (rep_sale) → atgal į JOS atsargas; paprastą
-- užsakymą → į centrinį sandėlį. Idempotentiška per orders.stock_restored.
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
  v_has_rep_sale boolean;
  v_is_rep boolean;
  v_bal int;
  v_wh int;
  item record;
begin
  select stock_restored, order_number, placed_by, approval_status
    into v_already_restored, v_order_number, v_placed_by, v_appr
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

  update orders set stock_restored = true, updated_at = now() where id = p_order_id;
  return true;
end;
$$;

grant execute on function restore_stock_by_order_id(uuid) to service_role;

notify pgrst, 'reload schema';
