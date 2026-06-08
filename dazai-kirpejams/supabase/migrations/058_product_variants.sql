-- ============================================
-- 058: Prekių variantai (dydžiai) + nitrilinių pirštinių S/M/L/XL
-- ============================================
-- Bendra variantų sistema: vieno `variant_group` produktai rodomi viename
-- puslapyje su dydžio pasirinkimu, o kataloge „sulipdomi" į vieną kortelę.
-- Kiekvienas dydis lieka ATSKIRA prekė su savo likučiu ir SKU, todėl
-- krepšelis, checkout, sandėlis ir judėjimo žurnalas veikia be pakeitimų.
--
-- Šis migration'as:
--   1) prideda variant_group / variant_size / variant_sort stulpelius;
--   2) esamą „Vienkartinės nitrilinės pirštinės be pudros (100 vnt.)" prekę
--      pažymi kaip dydį S;
--   3) sukuria 3 dydžius (M/L/XL) nukopijuodamas tą pačią kainą, nuotraukas
--      ir aprašymus. Naujų dydžių likutis = 0 — suvedamas rankiniu būdu
--      sandėlyje (/admin/sandelis).
--
-- ⚠️ Taikyti per Supabase Dashboard SQL Editor.

alter table products
  add column if not exists variant_group text,
  add column if not exists variant_size text,
  add column if not exists variant_sort int;

do $$
declare
  src products%rowtype;
  sizes text[] := array['M', 'L', 'XL'];
  sorts int[]  := array[2, 3, 4];
  i int;
begin
  -- Surandam pirštinių prekę: pirma pagal žinomą slug, kitaip pagal pavadinimą.
  select * into src
    from products
   where variant_group is null
     and (slug = 'gloves-100' or name_lt ilike '%nitrilin%')
   order by created_at asc
   limit 1;

  if not found then
    raise notice '058: pirstiniu preke nerasta — praleidziama';
    return;
  end if;

  -- 1) Esama preke tampa dydziu S (likutis nekeiciamas — lieka esamas).
  update products
     set variant_group = 'pirstines-nitrilo-100',
         variant_size  = 'S',
         variant_sort  = 1,
         updated_at    = now()
   where id = src.id;

  -- 2) Sukuriam M / L / XL kopijuodami is S (kaina, nuotraukos, aprasymai).
  for i in 1 .. array_length(sizes, 1) loop
    if not exists (
      select 1 from products
       where variant_group = 'pirstines-nitrilo-100'
         and variant_size = sizes[i]
    ) then
      insert into products (
        slug, sku, category_id, brand_id,
        name_lt, name_en, name_ru,
        description_lt, description_en, description_ru,
        ingredients_lt, ingredients_en, ingredients_ru,
        usage_lt, usage_en, usage_ru,
        price_cents, compare_price_cents, b2b_price_cents, sale_price_cents,
        volume_ml, weight_g,
        info_type, info_mixing_ratio, info_shelf_life, info_country,
        stock_quantity, is_in_stock, is_active, is_featured,
        image_urls,
        variant_group, variant_size, variant_sort
      )
      select
        src.slug || '-' || lower(sizes[i]),
        case when src.sku is not null and src.sku <> ''
             then src.sku || '-' || sizes[i]
             else null end,
        category_id, brand_id,
        name_lt, name_en, name_ru,
        description_lt, description_en, description_ru,
        ingredients_lt, ingredients_en, ingredients_ru,
        usage_lt, usage_en, usage_ru,
        price_cents, compare_price_cents, b2b_price_cents, sale_price_cents,
        volume_ml, weight_g,
        info_type, info_mixing_ratio, info_shelf_life, info_country,
        0, false, true, false,
        image_urls,
        'pirstines-nitrilo-100', sizes[i], sorts[i]
      from products
      where id = src.id;
    end if;
  end loop;
end $$;

notify pgrst, 'reload schema';
