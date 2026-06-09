-- ============================================
-- 063: Vadybininkės užsakymo patvirtinimas TIESIAI IŠ SANDĖLIO
-- ============================================
-- Numatytas patvirtinimas (approve_rep_order, migr 062) nurašo iš vadybininkės
-- atsargų. Bet kartais ji parduoda prekę, kurios jai nebuvo išduota — tada
-- prekė siunčiama tiesiai iš centrinio sandėlio. Ši funkcija nurašo iš
-- CENTRINIO SANDĖLIO (kaip įprastas užsakymas), vadybininkės atsargų neliečia.
-- Blokuoja, jei sandėlyje per mažai. Įrašo 'sale' judėjimus žurnalui.
--
-- Atšaukus tokį užsakymą, restore_stock_by_order_id (migr 062) teisingai grąžins
-- į centrinį sandėlį (nes nėra 'rep_sale' įrašo, o yra paprastas pardavimas).
--
-- ⚠️ Taikyti per Supabase Dashboard SQL Editor.

create or replace function approve_rep_order_from_warehouse(p_order_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status order_approval_status;
  v_order_number text;
  v_items jsonb;
  v_bal int;
  it record;
begin
  if not is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  select approval_status, order_number into v_status, v_order_number
  from orders where id = p_order_id for update;
  if not found then raise exception 'ORDER_NOT_FOUND'; end if;
  if v_status is distinct from 'pending' then
    raise exception 'NOT_PENDING (status=%)', v_status;
  end if;

  -- Surenkam prekes decrement_stock_for_order formatu
  select coalesce(jsonb_agg(jsonb_build_object(
           'product_id', oi.product_id, 'quantity', oi.quantity)), '[]'::jsonb)
    into v_items
  from order_items oi where oi.order_id = p_order_id;

  -- Nuskaitom CENTRINĮ SANDĖLĮ (RAISE jei neužtenka)
  perform decrement_stock_for_order(v_items);

  -- Pardavimo įrašai žurnalui (likutis jau sumažintas aukščiau)
  for it in select product_id, quantity from order_items where order_id = p_order_id
  loop
    select stock_quantity into v_bal from products where id = it.product_id;
    insert into stock_movements (product_id, delta, balance_after, reason, source)
    values (it.product_id, -it.quantity, v_bal, 'sale', v_order_number);
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

grant execute on function approve_rep_order_from_warehouse(uuid) to authenticated;

notify pgrst, 'reload schema';
