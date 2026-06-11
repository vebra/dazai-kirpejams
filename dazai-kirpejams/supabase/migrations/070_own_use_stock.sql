-- ============================================
-- 070: „Savo naudojimui" — savininkės sunaudotos prekės (salono darbui)
-- ============================================
-- Džiuljeta (savininkė) ima dažus/priemones savo saloniniam darbui ir už jas
-- nemoka. Tai NE pardavimas ir NE nurašymas (gedimas) — atskira kategorija
-- apskaitai: kiek prekių sunaudota veiklai. Ataskaita rodo savikainą (€).
--
-- RPC nuskaito likutį ir įrašo judėjimą su reason='own_use'. Analogiškas
-- write_off_stock (050), tik atskira kategorija, kad apskaitoje nesimaišytų su
-- nurašymais. source='Savo naudojimui' (žurnalui).
--
-- ⚠️ Taikyti per Dashboard SQL Editor.
-- ============================================

create or replace function consume_own_use_stock(
  p_product_id uuid,
  p_qty int,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cur int;
  v_removed int;
  v_new int;
begin
  if p_qty is null or p_qty <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_qty');
  end if;

  select stock_quantity into v_cur from products where id = p_product_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'not_found');
  end if;

  v_removed := least(p_qty, coalesce(v_cur, 0));
  if v_removed <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'no_stock');
  end if;

  v_new := coalesce(v_cur, 0) - v_removed;

  update products
    set stock_quantity = v_new,
        is_in_stock = v_new > 0,
        updated_at = now()
  where id = p_product_id;

  insert into stock_movements (product_id, delta, balance_after, reason, source, note)
  values (p_product_id, -v_removed, v_new, 'own_use', 'Savo naudojimui', p_note);

  return jsonb_build_object('ok', true, 'removed', v_removed, 'stock', v_new);
end;
$$;

grant execute on function consume_own_use_stock(uuid, int, text) to service_role;

notify pgrst, 'reload schema';
