-- ============================================
-- 037: orders.stock_restored flag + restore_stock_by_order_id RPC
-- ============================================
--
-- KODĖL: kai admin'as atšaukia (cancelled) arba ištrina užsakymą, šiuo metu
-- prekės iš sandėlio neatstatomos. Rezultatas — false „nėra sandėlyje",
-- prarandi pardavimą. Šiandien tokia situacija sprendžiama rankiniu
-- įrašymu admin'o.
--
-- DIZAINAS:
-- - `orders.stock_restored bool` — žymė, kad sandėlis jau atstatytas;
--   idempotency'ui, kad neatstatytume du kartus (status:cancelled → delete,
--   abu turi būti saugūs).
-- - `restore_stock_by_order_id(uuid)` — viena funkcija, kuri:
--     * patikrina, ar jau atstatyta (jei taip — no-op, grąžina true)
--     * praeina visus order_items, padidina products.stock_quantity
--     * pažymi orders.stock_restored = true
--
-- KADA KVIEČIAMA:
-- - updateOrderStatusAction, kai status → 'cancelled' arba 'refunded'
-- - deleteOrderAction prieš DELETE FROM orders
--
-- TAIKOMA: Supabase Dashboard SQL Editor, projektas bylzloadhsodqkhziime.

alter table public.orders
  add column if not exists stock_restored boolean not null default false;

comment on column public.orders.stock_restored is $$true, jei prekės jau grąžintos į sandėlį (po atšaukimo/ištrynimo). Naudojama idempotency'ui — kad cancel+delete neatstatytų sandėlio du kartus.$$;

create or replace function restore_stock_by_order_id(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_already_restored boolean;
  item record;
begin
  -- Užfiksuojam orders eilutę, kad išvengtume race su lygiagrečiu update
  select stock_restored into v_already_restored
  from orders
  where id = p_order_id
  for update;

  if not found then
    -- Užsakymas neegzistuoja
    return false;
  end if;

  if v_already_restored then
    -- Jau atstatyta — no-op, idempotency
    return true;
  end if;

  -- Praeinam visas eilutes ir grąžinam į produktų sandėlį
  for item in
    select product_id, quantity
    from order_items
    where order_id = p_order_id
  loop
    update products
    set
      stock_quantity = stock_quantity + item.quantity,
      is_in_stock = true,
      updated_at = now()
    where id = item.product_id;
  end loop;

  -- Pažymim, kad atstatyta
  update orders
  set
    stock_restored = true,
    updated_at = now()
  where id = p_order_id;

  return true;
end;
$$;

grant execute on function restore_stock_by_order_id(uuid) to service_role;

-- PostgREST schema cache notifikacija — kad nauja funkcija iškart matomas
-- per /rest/v1/rpc/restore_stock_by_order_id be deploy'o pertrauklės.
notify pgrst, 'reload schema';
