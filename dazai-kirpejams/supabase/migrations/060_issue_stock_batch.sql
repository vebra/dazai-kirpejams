-- ============================================
-- 060: Prekių išdavimas vadybininkei SĄRAŠU (batch, viskas-arba-nieko)
-- ============================================
-- Iki šiol prekės vadybininkei buvo išduodamos po vieną. Dabar — sąrašu:
-- viena funkcija priima kelias prekes su kiekiais ir atomiškai jas išduoda.
-- Jei NORS vienos prekės nepakanka likučio — nieko neišduodama (transakcija
-- rollback'inasi), grąžinama, kurios prekės pritrūko. Kiekvienai prekei
-- sumažinamas sandėlio likutis ir įrašoma į judėjimo žurnalą (issue_to_rep).
--
-- p_items pavyzdys: [{"product_id":"uuid","qty":5}, {"product_id":"uuid","qty":2}]
--
-- ⚠️ Taikyti per Supabase Dashboard SQL Editor.

create or replace function issue_stock_to_rep_batch(
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
  v_cur int;
  v_bal int;
  v_name text;
  v_results jsonb := '[]'::jsonb;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    return jsonb_build_object('ok', false, 'reason', 'empty');
  end if;

  -- 1) PRE-CHECK: užrakinam visų prekių eilutes ir patikrinam likučius PRIEŠ
  --    bet kokį keitimą. Jei kažko trūksta — grąžinam klaidą, nieko nepakeitę.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_pid := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::int;
    if v_qty is null or v_qty <= 0 then
      return jsonb_build_object('ok', false, 'reason', 'invalid_qty', 'product_id', v_pid);
    end if;
    select stock_quantity, name_lt into v_cur, v_name
    from products where id = v_pid for update;
    if not found then
      return jsonb_build_object('ok', false, 'reason', 'not_found', 'product_id', v_pid);
    end if;
    if coalesce(v_cur, 0) < v_qty then
      return jsonb_build_object('ok', false, 'reason', 'insufficient_stock',
        'product_id', v_pid, 'stock', coalesce(v_cur, 0), 'name', v_name);
    end if;
  end loop;

  -- 2) APPLY: visi likučiai pakankami — išduodam.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_pid := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'qty')::int;
    update products
      set stock_quantity = stock_quantity - v_qty,
          is_in_stock = (stock_quantity - v_qty) > 0,
          updated_at = now()
    where id = v_pid
    returning stock_quantity, name_lt into v_bal, v_name;

    insert into stock_movements (product_id, delta, balance_after, reason, source, rep_id)
    values (v_pid, -v_qty, v_bal, 'issue_to_rep',
            coalesce(nullif(btrim(p_rep), ''), 'Vadybininkė'), p_rep_id);

    v_results := v_results || jsonb_build_object(
      'product_id', v_pid, 'qty', v_qty, 'balance', v_bal, 'name', v_name);
  end loop;

  return jsonb_build_object('ok', true, 'items', v_results);
end;
$$;

grant execute on function issue_stock_to_rep_batch(jsonb, text, uuid) to service_role;

notify pgrst, 'reload schema';
