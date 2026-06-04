-- ============================================
-- 046: Prekių priėmimas barkodu — atominis likučio didinimas pagal EAN
-- ============================================
-- Skaneris (HID) įrašo barkodą; serveris randa prekę pagal `ean` ir ATOMIŠKAI
-- padidina stock_quantity (kad greitai skanuojant neprarastume skaičiavimų —
-- read-modify-write turėtų lenktynių sąlygą). Tik admin.
--
-- Grąžina jsonb: { ok, found, product_id, name, sku, stock } arba { found:false }.
-- ⚠️ Taikyti per Dashboard SQL Editor.
-- ============================================

create or replace function receive_stock_by_ean(
  p_ean text,
  p_delta int default 1
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_name text;
  v_sku text;
  v_stock int;
begin
  if not is_admin() then
    raise exception 'NOT_ADMIN';
  end if;

  if p_ean is null or btrim(p_ean) = '' then
    raise exception 'EMPTY_EAN';
  end if;

  -- Atominis didinimas. Pasirenkam vieną eilutę (jei ean nebūtų unikalus).
  update products
    set stock_quantity = coalesce(stock_quantity, 0) + p_delta,
        is_in_stock = (coalesce(stock_quantity, 0) + p_delta) > 0,
        updated_at = now()
  where id = (
    select id from products where ean = btrim(p_ean) limit 1
  )
  returning id, name_lt, sku, stock_quantity
    into v_id, v_name, v_sku, v_stock;

  if not found then
    return jsonb_build_object('ok', true, 'found', false);
  end if;

  return jsonb_build_object(
    'ok', true,
    'found', true,
    'product_id', v_id,
    'name', v_name,
    'sku', v_sku,
    'stock', v_stock
  );
end;
$$;

grant execute on function receive_stock_by_ean(text, int) to authenticated;
