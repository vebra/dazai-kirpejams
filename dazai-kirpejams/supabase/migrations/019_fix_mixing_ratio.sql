-- ============================================
-- Fix mixing ratio in product usage instructions: 1:1 → 1:2
-- ============================================
-- Color SHOCK dažų maišymo santykis yra 1:2 (1 dalis dažų + 2 dalys oksidanto).
-- Kai kuriuose produktuose DB įraše buvo klaidingas „1:1" — taisome
-- visose trijose kalbose.

UPDATE products
SET usage_lt = REPLACE(usage_lt, '1:1', '1:2'),
    usage_en = REPLACE(usage_en, '1:1', '1:2'),
    usage_ru = REPLACE(usage_ru, '1:1', '1:2'),
    updated_at = NOW()
WHERE usage_lt LIKE '%1:1%'
   OR usage_en LIKE '%1:1%'
   OR usage_ru LIKE '%1:1%';
