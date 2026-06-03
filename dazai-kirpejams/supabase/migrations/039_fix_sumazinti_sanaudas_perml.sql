-- ============================================
-- 039: „Kaip sumažinti sąnaudas" — pataisyti kainos per ml teiginį
-- ============================================
-- Straipsnis sakė „beveik dvigubai mažesnė", kas prieštaravo atnaujintam
-- „180 ml vs 60 ml" straipsniui (dabar ~4x prieš premium 60 ml). Keičiame į
-- „kelis kartus mažesnė" — suderinta su pagrindiniu straipsniu, nepervertinta.
-- REPLACE keičia tik vieną sakinį; idempotentiška (jei jau pakeista — no-op).
-- ============================================

UPDATE blog_posts
SET
  content_lt = REPLACE(
    content_lt,
    '180 ml pakuotėje kaina per ml yra beveik dvigubai mažesnė nei 60 ml standartinėse',
    '180 ml pakuotėje kaina per ml yra kelis kartus mažesnė nei 60 ml standartinėse'
  ),
  content_en = REPLACE(
    content_en,
    'the price per ml in a 180 ml package is almost twice lower than in standard 60 ml packages',
    'the price per ml in a 180 ml package is several times lower than in standard 60 ml packages'
  ),
  content_ru = REPLACE(
    content_ru,
    'цена за мл в упаковке 180 мл почти вдвое ниже, чем в стандартных 60 мл',
    'цена за мл в упаковке 180 мл в несколько раз ниже, чем в стандартных 60 мл'
  ),
  updated_at = now()
WHERE slug = 'sumazinti-sanaudas';
