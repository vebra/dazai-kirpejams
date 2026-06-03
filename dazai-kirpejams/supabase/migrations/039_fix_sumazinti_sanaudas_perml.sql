-- ============================================
-- 039: „Kaip sumažinti sąnaudas" — pataisyti kainos per ml teiginį
-- ============================================
-- Straipsnis sakė „beveik dvigubai mažesnė", kas prieštaravo atnaujintam
-- „180 ml vs 60 ml" straipsniui (dabar ~4x prieš premium 60 ml). Keičiame į
-- „kelis kartus mažesnė" — suderinta su pagrindiniu straipsniu, nepervertinta.
--
-- PASTABA: frazės paimtos iš GYVO DB turinio (straipsnis perrašytas ir
-- nebeatitinka articles.ts / migracijos 011). REPLACE keičia tik vieną sakinį;
-- idempotentiška (jei jau pakeista — no-op).
-- ============================================

UPDATE blog_posts
SET
  content_lt = REPLACE(
    content_lt,
    'vieno mililitro kaina gali būti beveik dvigubai mažesnė nei standartinėje 60 ml pakuotėje',
    'vieno mililitro kaina gali būti kelis kartus mažesnė nei standartinėje 60 ml pakuotėje'
  ),
  content_en = REPLACE(
    content_en,
    'the cost per ml can be almost twice as low as in a standard 60 ml tube',
    'the cost per ml can be several times lower than in a standard 60 ml tube'
  ),
  content_ru = REPLACE(
    content_ru,
    'цена одного миллилитра может быть почти вдвое ниже, чем в стандартном тюбике 60 мл',
    'цена одного миллилитра может быть в несколько раз ниже, чем в стандартном тюбике 60 мл'
  ),
  updated_at = now()
WHERE slug = 'sumazinti-sanaudas';
