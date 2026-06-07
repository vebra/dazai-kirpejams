-- ============================================
-- 055: Pridėti prekę prie esamo užsakymo (add_order_item)
-- ============================================
-- Admin gali pridėti prekę prie jau sukurto užsakymo. Atomiškai:
--   • įterpia order_items eilutę (efektyvi kaina — su akcija, jei aktyvi)
--   • sumažina likutį + įrašas į judėjimo žurnalą (reason='sale')
--   • perskaičiuoja užsakymo sumas (subtotal, PVM, viso)
-- PVM 21% taikomas tik jei užsakymas turi vat_code (kaip checkout'e).
--
-- ⚠️ Taikyti per Supabase Dashboard SQL Editor.

create or replace function add_order_item(
  p_order_id uuid,
  p_product_id uuid,
  p_qty int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order orders%rowtype;
  v_prod products%rowtype;
  v_unit int;
  v_subtotal int;
  v_total int;
  v_vat int;
  v_vat_rate numeric;
  v_bal int;
begin
  if p_qty is null or p_qty <= 0 then
    return jsonb_build_object('ok', false, 'reason', 'invalid_qty');
  end if;

  select * into v_order from orders where id = p_order_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'order_not_found');
  end if;

  select * into v_prod from products where id = p_product_id for update;
  if not found then
    return jsonb_build_object('ok', false, 'reason', 'product_not_found');
  end if;
  if not v_prod.is_active then
    return jsonb_build_object('ok', false, 'reason', 'product_inactive');
  end if;
  if coalesce(v_prod.stock_quantity, 0) < p_qty then
    return jsonb_build_object('ok', false, 'reason', 'insufficient_stock',
      'stock', coalesce(v_prod.stock_quantity, 0));
  end if;

  -- Efektyvi kaina: akcijos kaina, jei aktyvi
  if v_prod.sale_price_cents is not null
     and v_prod.sale_price_cents > 0
     and v_prod.sale_price_cents < v_prod.price_cents then
    v_unit := v_prod.sale_price_cents;
  else
    v_unit := v_prod.price_cents;
  end if;

  insert into order_items (
    order_id, product_id, product_name, product_sku,
    quantity, unit_price_cents, total_cents
  ) values (
    p_order_id, p_product_id, v_prod.name_lt, v_prod.sku,
    p_qty, v_unit, v_unit * p_qty
  );

  update products
    set stock_quantity = stock_quantity - p_qty,
        is_in_stock = (stock_quantity - p_qty) > 0,
        updated_at = now()
  where id = p_product_id
  returning stock_quantity into v_bal;

  insert into stock_movements (product_id, delta, balance_after, reason, source)
  values (p_product_id, -p_qty, v_bal, 'sale', v_order.order_number);

  -- Perskaičiuojam sumas iš visų eilučių
  select coalesce(sum(total_cents), 0) into v_subtotal
  from order_items where order_id = p_order_id;

  v_vat_rate := case
    when v_order.vat_code is not null and btrim(v_order.vat_code) <> '' then 0.21
    else 0
  end;

  v_total := v_subtotal - coalesce(v_order.discount_cents, 0)
             + coalesce(v_order.delivery_cost_cents, 0);
  if v_total < 0 then v_total := 0; end if;

  if v_vat_rate > 0 then
    v_vat := round(v_total::numeric - v_total::numeric / (1 + v_vat_rate))::int;
  else
    v_vat := 0;
  end if;

  update orders
    set subtotal_cents = v_subtotal,
        vat_cents = v_vat,
        total_cents = v_total,
        updated_at = now()
  where id = p_order_id;

  return jsonb_build_object(
    'ok', true,
    'subtotal_cents', v_subtotal,
    'total_cents', v_total,
    'stock', v_bal
  );
end;
$$;

grant execute on function add_order_item(uuid, uuid, int) to service_role;

notify pgrst, 'reload schema';
