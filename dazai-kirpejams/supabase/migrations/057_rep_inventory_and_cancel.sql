-- ============================================
-- 057: Vadybininkės atsargos (rep_id) + laukiančio užsakymo atšaukimas
-- ============================================
-- 1) stock_movements.rep_id — kuriai vadybininkei išduota (kad „Mano atsargos"
--    būtų filtruojamos patikimai pagal ID, ne pagal vardą).
-- 2) issue_stock_to_rep papildoma p_rep_id (sena 3-arg versija pašalinama).
-- 3) cancel_rep_pending_order — vadybininkė atšaukia SAVO dar nepatvirtintą
--    (pending) užsakymą (auth.uid() patikra; sandėlis neliečiamas — pending
--    jo ir nelietė).
--
-- ⚠️ Taikyti per Supabase Dashboard SQL Editor.

alter table stock_movements add column if not exists rep_id uuid;

drop function if exists issue_stock_to_rep(uuid, int, text);

create or replace function issue_stock_to_rep(
  p_product_id uuid,
  p_qty int,
  p_rep text,
  p_rep_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cur int;
  v_bal int;
  v_name text;
begin
  if p_qty is null or p_qty <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_qty');
  end if;

  select stock_quantity, name_lt into v_cur, v_name
  from products where id = p_product_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if coalesce(v_cur, 0) < p_qty then
    return jsonb_build_object('ok', false, 'reason', 'insufficient_stock',
      'stock', coalesce(v_cur, 0));
  end if;

  update products
    set stock_quantity = v_cur - p_qty,
        is_in_stock = (v_cur - p_qty) > 0,
        updated_at = now()
  where id = p_product_id
  returning stock_quantity into v_bal;

  insert into stock_movements (product_id, delta, balance_after, reason, source, rep_id)
  values (p_product_id, -p_qty, v_bal, 'issue_to_rep',
          coalesce(nullif(btrim(p_rep), ''), 'Vadybininkė'), p_rep_id);

  return jsonb_build_object('ok', true, 'removed', p_qty, 'stock', v_bal, 'name', v_name);
end;
$$;

grant execute on function issue_stock_to_rep(uuid, int, text, uuid) to service_role;

-- ============================================
create or replace function cancel_rep_pending_order(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_o orders%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'reason', 'auth');
  end if;

  select * into v_o from orders where id = p_order_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;
  if v_o.placed_by is distinct from v_uid then
    return jsonb_build_object('ok', false, 'reason', 'forbidden');
  end if;
  if v_o.approval_status is distinct from 'pending' then
    return jsonb_build_object('ok', false, 'reason', 'not_pending');
  end if;

  delete from order_items where order_id = p_order_id;
  delete from orders where id = p_order_id;
  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function cancel_rep_pending_order(uuid) to authenticated;

-- ============================================
-- get_my_issued_stock — ką vadybininkei išduota iš sandėlio (jos atsargos).
-- SECURITY DEFINER, nes stock_movements skaito tik admin; čia grąžinam TIK
-- prisijungusios vadybininkės (auth.uid()) įrašus.
-- ============================================
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
         sum(-m.delta)::int as issued,
         max(m.created_at) as last_at
  from stock_movements m
  join products p on p.id = m.product_id
  where m.reason = 'issue_to_rep' and m.rep_id = auth.uid()
  group by m.product_id, p.name_lt, p.sku, p.color_number
  having sum(-m.delta) <> 0
  order by max(m.created_at) desc;
$$;

grant execute on function get_my_issued_stock() to authenticated;

notify pgrst, 'reload schema';
