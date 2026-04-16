-- ============================================
-- Update hair dye retail price from €7.99 to €7.90
-- ============================================
-- Keičiame Pro Hair Color 180ml retail kainą iš 799 ct į 790 ct.
-- MEN produktai turi 1299 ct retail, todėl neliečiami.
-- Papildomai atnaujinami blog straipsniai, kur buvo hardcoded 7,99 €
-- pavyzdžiai ekonominiame palyginime — sumos perskaičiuotos.

-- 1) Products — keičiame tik eilutes, kurios dar turi seną 799 ct kainą
UPDATE products
SET price_cents = 790
WHERE price_cents = 799;

-- 2) Blog posts — pakeičiame kainos nuorodas ir perskaičiuotas sumas
--    (7×7,90=55,30; 27×7,90=213,30; 320×7,90=2 528,00)
UPDATE blog_posts
SET content_lt = REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(content_lt, '7,99 €', '7,90 €'),
          '55,93 €', '55,30 €'
        ),
        '215,73 €', '213,30 €'
      ),
      '2 556,80 €', '2 528,00 €'
    ),
    content_en = REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(content_en, '7,99 €', '7,90 €'),
          '55,93 €', '55,30 €'
        ),
        '215,73 €', '213,30 €'
      ),
      '2 556,80 €', '2 528,00 €'
    ),
    content_ru = REPLACE(
      REPLACE(
        REPLACE(
          REPLACE(content_ru, '7,99 €', '7,90 €'),
          '55,93 €', '55,30 €'
        ),
        '215,73 €', '213,30 €'
      ),
      '2 556,80 €', '2 528,00 €'
    ),
    updated_at = NOW()
WHERE content_lt LIKE '%7,99 €%'
   OR content_en LIKE '%7,99 €%'
   OR content_ru LIKE '%7,99 €%';
