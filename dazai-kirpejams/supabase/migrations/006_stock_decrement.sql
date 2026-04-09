-- ============================================
-- 006: Atomic stock decrement for orders
-- ============================================
--
-- Užsakymo metu reikia ATOMIŠKAI:
--   1. patikrinti ar visos prekės aktyvios,
--   2. patikrinti ar likutis ≥ prašomas kiekis,
--   3. sumažinti stock_quantity,
--   4. atnaujinti is_in_stock flag'ą.
--
-- Visa tai turi vykti vienoje transakcijoje — kitaip du paraleliai
-- sukurti užsakymai gali nuskaityti tą patį likutį ir abu "parduoti"
-- paskutinį vienetą (race condition).
--
-- RPC funkcija `decrement_stock_for_order(items jsonb)`:
--   input:  jsonb masyvas [{product_id: uuid, quantity: int}, ...]
--   output: void — jei pasiseka
--   exception: raise exception jei prekė neaktyvi arba neužtenka likučio
--
-- Kviečia createOrder() server action'as naudodamas service role klientą
-- (bypasses RLS). FOR UPDATE lock'as ant products eilučių garantuoja
-- serijinį darbą net ir esant aukšto concurrency.

create or replace function decrement_stock_for_order(items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  product_record record;
  requested_qty int;
begin
  -- Iteruojam per visus užsakymo item'us
  for item in select * from jsonb_array_elements(items)
  loop
    requested_qty := (item->>'quantity')::int;

    if requested_qty <= 0 then
      raise exception 'Neteisingas kiekis: %', requested_qty;
    end if;

    -- Lock'inam produkto eilutę iki transakcijos pabaigos.
    -- FOR UPDATE užtikrina, kad kitas paralelus užsakymas lauks.
    select id, name_lt, stock_quantity, is_active
      into product_record
    from products
    where id = (item->>'product_id')::uuid
    for update;

    if not found then
      raise exception 'Produktas nerastas: %', item->>'product_id';
    end if;

    if not product_record.is_active then
      raise exception 'Produktas nebeprieinamas: %', product_record.name_lt;
    end if;

    if coalesce(product_record.stock_quantity, 0) < requested_qty then
      raise exception 'Nepakanka likučio: % (yra %, prašoma %)',
        product_record.name_lt,
        coalesce(product_record.stock_quantity, 0),
        requested_qty;
    end if;

    -- Sumažinam likutį
    update products
    set
      stock_quantity = stock_quantity - requested_qty,
      is_in_stock = (stock_quantity - requested_qty) > 0,
      updated_at = now()
    where id = product_record.id;
  end loop;
end;
$$;

-- Kompensacinis veiksmas — padidina likutį atgal, kai reikia rollback.
-- Naudojama jei order insert'as nesėkmingas po to, kai stock jau
-- buvo sumažintas. Tame pačiame atominės operacijos kontekste.
create or replace function restore_stock_for_order(items jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  item jsonb;
  qty int;
begin
  for item in select * from jsonb_array_elements(items)
  loop
    qty := (item->>'quantity')::int;

    update products
    set
      stock_quantity = stock_quantity + qty,
      is_in_stock = true,
      updated_at = now()
    where id = (item->>'product_id')::uuid;
  end loop;
end;
$$;

-- Service role jau turi visas teises, bet aiškumui leidžiam ir
-- authenticated vartotojams iškviesti (jei ateityje užsakymus kursim
-- per anon klientą su RLS, o ne per service role).
grant execute on function decrement_stock_for_order(jsonb) to authenticated;
grant execute on function decrement_stock_for_order(jsonb) to anon;
grant execute on function decrement_stock_for_order(jsonb) to service_role;

grant execute on function restore_stock_for_order(jsonb) to service_role;
