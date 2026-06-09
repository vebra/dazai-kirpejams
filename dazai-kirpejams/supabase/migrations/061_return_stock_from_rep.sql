-- ============================================
-- 061: Prekių grąžinimas IŠ vadybininkės atgal į sandėlį (batch, viskas-arba-nieko)
-- ============================================
-- Veidrodis 060-ai, tik priešinga kryptimi. Adminas priima neparduotas prekes
-- iš vadybininkės: kiekvienai prekei PADIDINA sandėlio likutį ir įrašo į judėjimo
-- žurnalą (reason='return_from_rep', teigiamas delta, rep_id). Atomiškai:
-- jei vadybininkė bando grąžinti DAUGIAU nei jai šiuo metu išduota (turima) —
-- nieko nepriimama, grąžinama, kurios prekės per daug.
--
-- „Turima" = išduota − jau grąžinta (issue_to_rep delta neig., return_from_rep teig.),
-- t.y. sum(-delta) per abi priežastis tam pačiam rep_id + product_id.
--
-- p_items pavyzdys: [{"product_id":"uuid","qty":3}, {"product_id":"uuid","qty":1}]
--
-- ⚠️ Taikyti per Supabase Dashboard SQL Editor.

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

  -- 1) PRE-CHECK: užrakinam prekes ir patikrinam, kad grąžinama ne daugiau,
  --    nei vadybininkė turi. Jei kažko per daug — grąžinam klaidą, nieko nekeitę.
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

    select coalesce(sum(-m.delta), 0)::int into v_held
    from stock_movements m
    where m.product_id = v_pid
      and m.rep_id = p_rep_id
      and m.reason in ('issue_to_rep', 'return_from_rep');

    if v_qty > v_held then
      return jsonb_build_object('ok', false, 'reason', 'exceeds_held',
        'product_id', v_pid, 'held', v_held, 'name', v_name);
    end if;
  end loop;

  -- 2) APPLY: viskas tilpo — priimam grąžinimą.
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

-- ============================================
-- get_my_issued_stock — dabar rodo NETO (išduota − grąžinta), kad „Mano atsargos"
-- atitiktų realiai vadybininkės turimą kiekį, o ne bendrą kada nors išduotą.
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
  where m.reason in ('issue_to_rep', 'return_from_rep')
    and m.rep_id = auth.uid()
  group by m.product_id, p.name_lt, p.sku, p.color_number
  having sum(-m.delta) > 0
  order by max(m.created_at) desc;
$$;

grant execute on function get_my_issued_stock() to authenticated;

notify pgrst, 'reload schema';
