-- ============================================
-- 066: Savikainos/B2B slėpimas — FAZĖ 1 (addityvu, saugu bet kada)
-- ============================================
-- Problema: `products` "Public read" politika atiduoda VISUS stulpelius, įsk.
-- cost_price_cents (savikaina/marža) ir b2b_price_cents — bet kas su viešu anon
-- raktu (jis naršyklės bundle'e) arba bet kuris prisiregistravęs (registracija
-- atvira) per PostgREST `select=cost_price_cents` galėjo nuskaityti maržas.
-- Šių 2 stulpelių neskaito joks viešas/rep kelias — tik admin (service_role).
--
-- DVI FAZĖS dėl vienos bendros DB (preview + prod ta pati Supabase):
--   066 (ŠITAS) — VIEW + teisės. Addityvu: niekas nelūžta, products lieka
--                 pasiekiama kaip buvo. Taikyti PRIEŠ deploy.
--   067         — REVOKE nuo products. Breaking: taikyti TIK kai naujas
--                 kodas (queries.ts → products_public) jau gyvas prode.
--
-- Atstatymas: drop view products_public; (067 turi savo atstatymą).
--
-- ⚠️ Taikyti per Dashboard SQL Editor PIRMA (prieš mergiant kodą į prod).
-- ============================================

-- Viešas view be jautrių stulpelių (cost_price_cents, b2b_price_cents).
-- NE security_invoker — veikia savininko teisėmis, tad anon nereikės teisės į
-- pačią products lentelę (067 ją atims). is_active filtras pakeičia "Public
-- read" politikos sąlygą (anon mato tik aktyvias prekes — kaip ir dabar).
drop view if exists products_public;
create view products_public as
  select
    id, slug, sku, ean,
    category_id, brand_id,
    name_lt, name_en, name_ru,
    description_lt, description_en, description_ru,
    ingredients_lt, ingredients_en, ingredients_ru,
    usage_lt, usage_en, usage_ru,
    price_cents, compare_price_cents, sale_price_cents,
    volume_ml, weight_g,
    color_hex, color_name, color_number, color_tone, color_family,
    info_brand, info_type, info_mixing_ratio, info_shelf_life, info_country,
    stock_quantity, is_in_stock, reorder_point,
    is_active, is_featured,
    image_urls,
    variant_group, variant_size, variant_sort,
    created_at, updated_at
  from products
  where is_active = true;

grant select on products_public to anon;
grant select on products_public to authenticated;

-- Stulpelių lygio prieiga prie tikros lentelės authenticated rolei (rep
-- portalas ima konkrečius stulpelius + įdėtinį product_prices). Addityvu, kol
-- 067 neatims blanket SELECT — tada lieka TIK šitie stulpeliai (be cost/b2b).
grant select (
  id, slug, sku, ean,
  category_id, brand_id,
  name_lt, name_en, name_ru,
  description_lt, description_en, description_ru,
  ingredients_lt, ingredients_en, ingredients_ru,
  usage_lt, usage_en, usage_ru,
  price_cents, compare_price_cents, sale_price_cents,
  volume_ml, weight_g,
  color_hex, color_name, color_number, color_tone, color_family,
  info_brand, info_type, info_mixing_ratio, info_shelf_life, info_country,
  stock_quantity, is_in_stock, reorder_point,
  is_active, is_featured,
  image_urls,
  variant_group, variant_size, variant_sort,
  created_at, updated_at
) on products to authenticated;

notify pgrst, 'reload schema';
