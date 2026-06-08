-- ============================================
-- 056: Vadybininkės apmokėjimai (grynais/kortele) + prekių išdavimas vadybininkei
-- ============================================
-- 1) payment_method enum praplečiamas: 'cash' (grynais), 'card' (kortelė terminale).
-- 2) issue_stock_to_rep — admin išduoda prekes vadybininkei: sumažina SANDĖLIO
--    likutį + įrašas į žurnalą (reason='issue_to_rep', source=vadybininkės vardas).
--    (Modelis A — atskira vadybininkės atsargų apskaita nevedama.)
--
-- ⚠️ Taikyti per Supabase Dashboard SQL Editor.
-- Pastaba: jei „ALTER TYPE ... ADD VALUE" mestų klaidą dėl transakcijos —
-- paleiskite tas dvi eilutes atskirai.

alter type payment_method add value if not exists 'cash';
alter type payment_method add value if not exists 'card';

create or replace function issue_stock_to_rep(
  p_product_id uuid,
  p_qty int,
  p_rep text
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

  insert into stock_movements (product_id, delta, balance_after, reason, source)
  values (p_product_id, -p_qty, v_bal, 'issue_to_rep',
          coalesce(nullif(btrim(p_rep), ''), 'Vadybininkė'));

  return jsonb_build_object('ok', true, 'removed', p_qty, 'stock', v_bal, 'name', v_name);
end;
$$;

grant execute on function issue_stock_to_rep(uuid, int, text) to service_role;

notify pgrst, 'reload schema';
