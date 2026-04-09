-- ============================================
-- Dažai Kirpėjams - EAN barkodas ir savikaina
-- ============================================
--
-- Pridedam du stulpelius į `products` lentelę:
--   * `ean`               — EAN-13 barkodas iš tiekėjo (unikalus, nullable)
--   * `cost_price_cents`  — savikaina centais (be PVM), marža stebėjimui
--
-- EAN naudojamas kaip upsert raktas importuojant tiekėjo kainoraščius
-- (`scripts/import-supplier-csv.ts`). Dalinis unikalus indeksas leidžia
-- turėti daug produktų be EAN (pvz. paslaugas, paketus), bet užtikrina,
-- kad konkretus barkodas atsiranda DB'je tik kartą.
--
-- Idempotentiška — galima pritaikyti kelis kartus.

alter table products
  add column if not exists ean text,
  add column if not exists cost_price_cents int;

-- Partial unique — NULL reikšmės nekonfliktuoja tarpusavyje
create unique index if not exists idx_products_ean
  on products(ean)
  where ean is not null;

-- Dažniausia paieška sandėlyje: ieškom pagal EAN įvedus barkodo skanerį
create index if not exists idx_products_ean_lookup
  on products(ean)
  where ean is not null;

comment on column products.ean is 'EAN-13 barkodas (iš tiekėjo). Upsert raktas importuojant CSV.';
comment on column products.cost_price_cents is 'Savikaina centais, be PVM. Iš tiekėjo kainoraščio.';
