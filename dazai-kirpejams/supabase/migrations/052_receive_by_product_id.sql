-- ============================================
-- 052: Rankinis priėmimas pagal prekės ID (be EAN)
-- ============================================
-- Prekėms be barkodo (arba kai patogiau rinktis ranka): atomiškai +delta prie
-- likučio pagal product_id. Įrašo į žurnalą reason='receiving', source=tiekėjas
-- (arba 'Rankinis'). Tik admin.
--
-- ⚠️ Taikyti per Supabase Dashboard SQL Editor.

create or replace function receive_stock_by_product_id(
  p_product_id uuid,
  p_delta int default 1,
  p_source text default 'Rankinis'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text;
  v_sku text;
  v_stock int;
begin
  if not is_admin() then
    raise exception 'NOT_ADMIN';
  end if;
  if p_delta is null or p_delta <= 0 then
    raise exception 'INVALID_DELTA';
  end if;

  update products
    set stock_quantity = coalesce(stock_quantity, 0) + p_delta,
        is_in_stock = (coalesce(stock_quantity, 0) + p_delta) > 0,
        updated_at = now()
  where id = p_product_id
  returning name_lt, sku, stock_quantity into v_name, v_sku, v_stock;

  if not found then
    return jsonb_build_object('ok', true, 'found', false);
  end if;

  insert into stock_movements (product_id, delta, balance_after, reason, source)
  values (p_product_id, p_delta, v_stock, 'receiving', coalesce(nullif(btrim(p_source), ''), 'Rankinis'));

  return jsonb_build_object(
    'ok', true, 'found', true,
    'name', v_name, 'sku', v_sku, 'stock', v_stock
  );
end;
$$;

grant execute on function receive_stock_by_product_id(uuid, int, text) to authenticated;

notify pgrst, 'reload schema';
