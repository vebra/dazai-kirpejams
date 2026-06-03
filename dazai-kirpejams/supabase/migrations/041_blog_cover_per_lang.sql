-- ============================================
-- 041: Blogo viršelis pagal kalbą (EN/RU)
-- ============================================
-- Leidžia kiekvienai kalbai turėti atskirą viršelio nuotrauką. `cover_image_url`
-- lieka LT / numatytasis; EN/RU tušti → puslapis naudoja LT viršelį (atsarga).
-- Idempotentiška. Paleisti PRIEŠ deploy (saveBlogPostAction rašys į šiuos stulpelius).
-- ============================================

ALTER TABLE blog_posts
  ADD COLUMN IF NOT EXISTS cover_image_url_en text,
  ADD COLUMN IF NOT EXISTS cover_image_url_ru text;
